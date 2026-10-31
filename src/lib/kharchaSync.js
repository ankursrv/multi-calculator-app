// The sync engine that sits between the local AsyncStorage data and Supabase.
//
// Design rules (this is what keeps the offline app untouched):
//  - AsyncStorage stays the single source of truth for the UI. The cloud never
//    blocks a read or a write.
//  - Local-first: adding an entry saves instantly, then gets pushed in the
//    background. If the phone is offline the row simply stays "unpushed"
//    because our snapshot of what was last synced never advances.
//  - Conflict resolution is per-entry last-write-wins on `updatedAt`.
//  - Deletions are soft (`deleted = true`) so an offline delete on one phone
//    does not get resurrected by the next pull from another phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloud } from './cloudApi';

const META_KEY = 'kharchaCloudMeta';
const SNAPSHOT_KEY = 'kharchaSyncSnapshot';

// ── Persisted helper state ────────────────────────────────────────────────
export async function readMeta() {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw);
    return meta && meta.familyCode ? meta : null;
  } catch (_e) {
    return null;
  }
}

export async function saveMeta(patch) {
  const current = (await readMeta()) || {};
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(META_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export async function setMeta(next) {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export async function clearMeta() {
  await AsyncStorage.removeItem(META_KEY).catch(() => {});
  await AsyncStorage.removeItem(SNAPSHOT_KEY).catch(() => {});
}

// Snapshot = what this device last successfully put in / took out of the
// cloud: { [entryId]: { u: updatedAt, d: deletedFlag } }.
async function readSnapshot() {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_e) {
    return {};
  }
}

async function saveSnapshot(map) {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(map)).catch(() => {});
}

// ── Local data helpers ────────────────────────────────────────────────────
// data is { '2026-10': [entry, ...], ... } — walk it into [monthKey, entry] pairs.
function forEachEntry(data, fn) {
  Object.keys(data).forEach((monthKey) => {
    const list = data[monthKey];
    if (Array.isArray(list)) list.forEach((entry) => fn(monthKey, entry));
  });
}

// Entries restored from an older backup file (or made before this branch)
// have no cloud fields — give them an id + timestamp so they can sync.
export function ensureIds(data, deviceName) {
  let touched = false;
  const next = {};
  Object.keys(data).forEach((monthKey) => {
    const list = Array.isArray(data[monthKey]) ? data[monthKey] : [];
    next[monthKey] = list.map((entry) => {
      if (entry && entry.id && entry.updatedAt) return entry;
      touched = true;
      return {
        ...entry,
        id: entry && entry.id ? entry.id : newEntryId(),
        updatedAt: Date.now(),
        addedBy: (entry && entry.addedBy) || deviceName || '',
      };
    });
  });
  return touched ? next : data;
}

export function newEntryId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}${rand}`;
}

// ── Push: local changes -> cloud ──────────────────────────────────────────
// Diffs the live data against the snapshot. Anything new/edited becomes an
// upsert row; anything in the snapshot that vanished locally becomes a soft
// delete. On success the snapshot advances, which is what "queued" means:
// unpushed work is automatically retried on the next sync.
export async function pushLocal(data, meta) {
  if (!meta || !meta.familyCode) return { ok: false, pushed: 0 };

  const snapshot = await readSnapshot();
  const seen = {};
  const upserts = [];

  forEachEntry(data, (monthKey, entry) => {
    if (!entry || !entry.id) return;
    seen[entry.id] = 1;
    const prev = snapshot[entry.id];
    const updatedAt = entry.updatedAt || 0;
    if (prev && prev.u >= updatedAt && !prev.d) return; // already in sync
    upserts.push({
      id: entry.id,
      family_code: meta.familyCode,
      month_key: monthKey,
      day: Number(entry.day) || 1,
      name: String(entry.name || ''),
      cost: Number(entry.cost) || 0,
      added_by: entry.addedBy || '',
      updated_at: updatedAt,
      deleted: false,
    });
  });

  const deletes = [];
  Object.keys(snapshot).forEach((id) => {
    if (seen[id] || snapshot[id].d) return;
    // Locally gone but still alive in the cloud => someone deleted it here.
    deletes.push({
      id,
      family_code: meta.familyCode,
      month_key: '',
      day: 1,
      name: '',
      cost: 0,
      added_by: '',
      updated_at: Date.now(),
      deleted: true,
    });
  });

  const pending = upserts.concat(deletes);
  if (pending.length === 0) return { ok: true, pushed: 0 };

  const ok = await cloud.pushEntries(pending);
  if (!ok) return { ok: false, pushed: 0 }; // stays queued for the next tick

  for (const row of upserts) snapshot[row.id] = { u: row.updated_at, d: 0 };
  for (const row of deletes) snapshot[row.id] = { u: row.updated_at, d: 1 };
  await saveSnapshot(snapshot);
  return { ok: true, pushed: pending.length };
}

// ── Pull: cloud -> local ─────────────────────────────────────────────────
// Fetches only the rows that changed since the last pull and turns them into a
// small list of operations. The operations get applied later by applyRows(),
// against whatever the local data looks like at that moment — a kharcha added
// while the network request was still in flight must never be overwritten by a
// stale copy of the register.
export async function pullRemote(data, meta) {
  if (!meta || !meta.familyCode) return { ok: false, changed: false, applied: [], data };

  const rows = await cloud.pullEntries(meta.familyCode, meta.lastPulledAt || 0);
  if (!rows) return { ok: false, changed: false, applied: [], data }; // offline
  if (rows.length === 0) {
    const nextMeta = await saveMeta({ ...meta, lastPulledAt: Date.now() });
    return { ok: true, changed: false, applied: [], data, meta: nextMeta };
  }

  const snapshot = await readSnapshot();
  const index = {};
  forEachEntry(data, (monthKey, entry) => {
    if (entry && entry.id) index[entry.id] = entry;
  });

  const applied = [];
  rows.forEach((row) => {
    const at = Number(row.updated_at) || 0;
    const here = index[row.id];
    const prev = snapshot[row.id];

    if (row.deleted) {
      applied.push({ id: row.id, deleted: true });
      snapshot[row.id] = { u: at, d: 1 };
      return;
    }

    // This device still holds a newer edit that has not been pushed yet, or a
    // delete that has not landed — local wins until our own write is sent.
    // Comparing against the snapshot (not the clock) keeps phone clock skew
    // from breaking the sync.
    const dirty = !here ? !!prev : prev === undefined || prev.u !== here.updatedAt;
    if (dirty) return;
    if (!here && !row.month_key) return;

    applied.push({
      id: row.id,
      deleted: false,
      monthKey: row.month_key,
      entry: {
        id: row.id,
        name: row.name,
        cost: Number(row.cost) || 0,
        day: Number(row.day) || 1,
        addedBy: row.added_by || '',
        updatedAt: at,
      },
    });
    snapshot[row.id] = { u: at, d: 0 };
  });

  await saveSnapshot(snapshot);
  const newest = rows.reduce((a, r) => Math.max(a, Number(r.updated_at) || 0), meta.lastPulledAt || 0);
  const nextMeta = await saveMeta({ ...meta, lastPulledAt: newest });
  return { ok: true, changed: applied.length > 0, applied, data, meta: nextMeta };
}

// Pure fold of the pulled operations into the current local data. Cheap and
// side-effect free, which is what makes it safe to run inside a setState
// updater (the freshest `prev` is what gets merged, never a stale snapshot).
export function applyRows(data, ops) {
  if (!ops || ops.length === 0) return data;
  const index = {};
  forEachEntry(data, (monthKey, entry) => {
    if (entry && entry.id) index[entry.id] = monthKey;
  });

  const next = { ...data };
  ops.forEach((op) => {
    const monthKey = index[op.id];
    if (op.deleted) {
      if (monthKey) {
        next[monthKey] = next[monthKey].filter((e) => e.id !== op.id);
        delete index[op.id];
      }
      return;
    }
    if (monthKey) {
      next[monthKey] = next[monthKey].map((e) => (e.id === op.id ? op.entry : e));
      return;
    }
    if (!op.monthKey) return;
    next[op.monthKey] = [op.entry, ...(next[op.monthKey] || [])];
    index[op.id] = op.monthKey;
  });
  return next;
}

// One full round trip: push whatever is pending, then pull whatever is new.
export async function syncOnce(data, meta) {
  if (!meta || !meta.familyCode) return { ok: false, changed: false, applied: [], pushed: 0 };
  const push = await pushLocal(data, meta);
  const pull = await pullRemote(data, meta);
  return {
    ok: push.ok && pull.ok,
    pushed: push.pushed,
    changed: pull.changed,
    applied: pull.applied,
    meta: pull.meta || meta,
  };
}

// Restoring a backup file on a synced phone must not erase whatever the rest
// of the family has added since that file was made, so the restore becomes a
// union by entry id instead of a wholesale replace. Unlink a family and the
// old "load the file exactly as it is" behaviour still applies.
export function mergeBackup(local, backup, deviceName) {
  const base = ensureIds(backup, deviceName);
  const index = {};
  forEachEntry(local, (monthKey, entry) => {
    if (entry && entry.id) index[entry.id] = { monthKey, entry };
  });

  const next = {};
  Object.keys(local).forEach((k) => {
    next[k] = local[k];
  });

  Object.keys(base).forEach((k) => {
    const fresh = [];
    (Array.isArray(base[k]) ? base[k] : []).forEach((entry) => {
      const here = entry && entry.id ? index[entry.id] : null;
      if (here) {
        // Same entry on both sides — keep whichever was edited last.
        if ((entry.updatedAt || 0) > (here.entry.updatedAt || 0)) {
          next[here.monthKey] = next[here.monthKey].map((x) => (x.id === entry.id ? entry : x));
        }
        return;
      }
      fresh.push(entry);
    });
    if (fresh.length > 0) next[k] = [...fresh, ...(next[k] || [])];
  });

  return next;
}
