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

const LEGACY_META_KEY = 'kharchaCloudMeta';
const LEGACY_SNAPSHOT_KEY = 'kharchaSyncSnapshot';

export function getMetaKey(userScope) {
  const scope = (userScope && String(userScope).trim()) || 'guest';
  return `kharchaCloudMeta_${scope}`;
}

export function getSnapshotKey(userScope) {
  const scope = (userScope && String(userScope).trim()) || 'guest';
  return `kharchaSyncSnapshot_${scope}`;
}

// ── Persisted helper state ────────────────────────────────────────────────
export async function readMeta(userScope = 'guest') {
  try {
    const key = getMetaKey(userScope);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const meta = JSON.parse(raw);
      return meta && meta.familyCode ? meta : null;
    }
    // Backward compatibility: If no scoped meta exists and we are in 'guest' scope,
    // migrate any legacy meta to guest scope and clean up legacy key.
    if (!userScope || userScope === 'guest') {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_META_KEY);
      if (legacyRaw) {
        const meta = JSON.parse(legacyRaw);
        if (meta && meta.familyCode) {
          await AsyncStorage.setItem(key, legacyRaw).catch(() => {});
          await AsyncStorage.removeItem(LEGACY_META_KEY).catch(() => {});
          return meta;
        }
      }
    }
    return null;
  } catch (_e) {
    return null;
  }
}

export async function saveMeta(patch, userScope = 'guest') {
  const current = (await readMeta(userScope)) || {};
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(getMetaKey(userScope), JSON.stringify(next)).catch(() => {});
  return next;
}

export async function setMeta(next, userScope = 'guest') {
  await AsyncStorage.setItem(getMetaKey(userScope), JSON.stringify(next)).catch(() => {});
  return next;
}

export async function clearMeta(userScope = 'guest') {
  await AsyncStorage.removeItem(getMetaKey(userScope)).catch(() => {});
  await AsyncStorage.removeItem(getSnapshotKey(userScope)).catch(() => {});
  if (!userScope || userScope === 'guest') {
    await AsyncStorage.removeItem(LEGACY_META_KEY).catch(() => {});
    await AsyncStorage.removeItem(LEGACY_SNAPSHOT_KEY).catch(() => {});
  }
}

// Snapshot = what this device last successfully put in / took out of the
// cloud: { [entryId]: { u: updatedAt, d: deletedFlag } }.
export async function readSnapshot(userScope = 'guest') {
  try {
    const raw = await AsyncStorage.getItem(getSnapshotKey(userScope));
    return raw ? JSON.parse(raw) : {};
  } catch (_e) {
    return {};
  }
}

async function saveSnapshot(map, userScope = 'guest') {
  await AsyncStorage.setItem(getSnapshotKey(userScope), JSON.stringify(map)).catch(() => {});
}

// ── Local data helpers ────────────────────────────────────────────────────
// data is { '2026-10': [entry, ...], ... } — walk it into [monthKey, entry] pairs.
function forEachEntry(data, fn) {
  Object.keys(data).forEach((monthKey) => {
    const list = data[monthKey];
    if (Array.isArray(list)) list.forEach((entry) => fn(monthKey, entry));
  });
}

// ── Payment Metadata Encoding for Cloud Sync ──────────────────────────────
// Encodes payment state into added_by so sync works immediately with no database schema change
export function encodeAddedBy(deviceName, entry) {
  const base = String(deviceName || '').trim();
  if (!entry || !entry.paid) return base;
  const payload = {
    p: 1,
    m: entry.paymentMode || 'UPI',
    a: entry.paidAt || Date.now(),
    n: entry.paymentNote ? String(entry.paymentNote).trim() : '',
  };
  return `${base}§§PM§§${JSON.stringify(payload)}`;
}

export function decodeAddedBy(raw) {
  if (!raw || typeof raw !== 'string') {
    return { deviceName: '', paid: false, paymentMode: null, paidAt: null, paymentNote: '' };
  }
  const sepIdx = raw.indexOf('§§PM§§');
  if (sepIdx === -1) {
    return { deviceName: raw.trim(), paid: false, paymentMode: null, paidAt: null, paymentNote: '' };
  }
  const deviceName = raw.slice(0, sepIdx).trim();
  try {
    const meta = JSON.parse(raw.slice(sepIdx + 6));
    return {
      deviceName,
      paid: !!meta.p,
      paymentMode: meta.m || 'UPI',
      paidAt: meta.a || null,
      paymentNote: meta.n || '',
    };
  } catch (_e) {
    return { deviceName, paid: false, paymentMode: null, paidAt: null, paymentNote: '' };
  }
}

// Entries restored from an older backup file (or made before this branch)
// have no cloud fields — give them an id + timestamp so they can sync.
export function ensureIds(data, deviceName, forceUpdateAddedBy = false) {
  let touched = false;
  const next = {};
  Object.keys(data).forEach((monthKey) => {
    const list = Array.isArray(data[monthKey]) ? data[monthKey] : [];
    next[monthKey] = list.map((entry) => {
      const dec = decodeAddedBy(entry && entry.addedBy);
      let cleanAddedBy = dec.deviceName || (entry && entry.addedBy) || deviceName || '';
      if (cleanAddedBy === 'Test1' || forceUpdateAddedBy) {
        cleanAddedBy = deviceName || '';
      }
      if (entry && entry.id && entry.updatedAt && entry.addedBy === cleanAddedBy) return entry;
      touched = true;
      return {
        ...entry,
        id: entry && entry.id ? entry.id : newEntryId(),
        updatedAt: entry && entry.updatedAt ? entry.updatedAt : Date.now(),
        addedBy: cleanAddedBy,
      };
    });
  });
  return touched ? next : data;
}

export function newEntryId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}${rand}`;
}

// ── Membership check ──────────────────────────────────────────────────────
// When the family owner removes a member, that device must stop syncing.
// Returns true while the device still appears in the family's active member
// list. Only a genuine network failure (listMembers -> null) counts as
// "can't tell" — a flaky connection must never kick somebody out of their own
// family. An empty list, though, is a real server answer: every member row is
// gone (owner removed everyone), so the device is no longer an active member.
export async function checkActiveMembership(meta) {
  if (!meta || !meta.familyCode || !meta.deviceName) return true;
  const members = await cloud.listMembers(meta.familyCode);
  if (members === null) return true; // offline — never kick on a failed request
  const here = String(meta.deviceName).trim();
  return members.some((m) => String(m.device_name || '').trim() === here);
}

// The owner IS the family — their name must always appear in the member list.
// If the owner's own row went missing (deleted from another device, or by a
// mistyped self-delete), re-register it so everyone's "सदस्य" list shows the
// owner again. Never applied to members: a removed member must stay removed.
export async function ensureOwnerMembership(meta) {
  if (!meta || meta.role !== 'owner' || !meta.familyCode || !meta.deviceName) return;
  const members = await cloud.listMembers(meta.familyCode);
  if (members === null) return; // offline — retry on the next sync
  const here = String(meta.deviceName).trim();
  const found = members.some((m) => String(m.device_name || '').trim() === here);
  if (!found) await cloud.addMember(meta.familyCode, meta.deviceName);
}

// ── Push: local changes -> cloud ──────────────────────────────────────────
// Diffs the live data against the snapshot. Anything new/edited becomes an
// upsert row; anything in the snapshot that vanished locally becomes a soft
// delete. On success the snapshot advances, which is what "queued" means:
// unpushed work is automatically retried on the next sync.
export async function pushLocal(data, meta, userScope = 'guest') {
  if (!meta || !meta.familyCode) return { ok: false, pushed: 0 };

  // PERMISSION RULE:
  // Members who joined via the family code may add brand-new entries and push
  // payment-only updates (भुगतान mark/unmark) of rows they already synced.
  // Any other edit of an existing row and all soft-deletes stay owner-side —
  // members never push those.
  const isMember = meta.role === 'member';

  const snapshot = await readSnapshot(userScope);
  const seen = {};
  const upserts = [];

  forEachEntry(data, (monthKey, entry) => {
    if (!entry || !entry.id) return;
    seen[entry.id] = 1;
    const prev = snapshot[entry.id];
    const updatedAt = entry.updatedAt || 0;

    const isPaid = entry.paid ? 1 : 0;
    const paymentMode = entry.paymentMode || '';
    const paymentNote = entry.paymentNote || '';
    const paidAt = entry.paidAt || 0;

    const paymentChanged =
      !prev ||
      prev.p === undefined ||
      prev.p !== isPaid ||
      prev.m !== paymentMode ||
      prev.n !== paymentNote ||
      prev.a !== paidAt;

    // A member touching an already-synced row may only push when the payment
    // fields themselves changed — nothing else about the row moves.
    if (isMember && prev !== undefined && !paymentChanged) return;

    if (prev && prev.u >= updatedAt && !prev.d && !paymentChanged) return; // already in sync

    const effectiveUpdatedAt = paymentChanged ? Math.max(updatedAt, Date.now()) : updatedAt;

    upserts.push({
      id: entry.id,
      family_code: meta.familyCode,
      month_key: monthKey,
      day: Number(entry.day) || 1,
      name: String(entry.name || ''),
      cost: Number(entry.cost) || 0,
      added_by: encodeAddedBy(entry.addedBy, entry),
      updated_at: effectiveUpdatedAt,
      deleted: false,
    });
  });

  const deletes = [];
  if (!isMember) {
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
  }

  const pending = upserts.concat(deletes);
  if (pending.length === 0) return { ok: true, pushed: 0 };

  const ok = await cloud.pushEntries(pending);
  if (!ok) return { ok: false, pushed: 0 }; // stays queued for the next tick

  for (const row of upserts) {
    const dec = decodeAddedBy(row.added_by);
    snapshot[row.id] = {
      u: row.updated_at,
      d: 0,
      p: dec.paid ? 1 : 0,
      m: dec.paymentMode || '',
      a: dec.paidAt || 0,
      n: dec.paymentNote || '',
    };
  }
  for (const row of deletes) snapshot[row.id] = { u: row.updated_at, d: 1 };
  await saveSnapshot(snapshot, userScope);
  return { ok: true, pushed: pending.length };
}

// ── Pull: cloud -> local ─────────────────────────────────────────────────
// Fetches only the rows that changed since the last pull and turns them into a
// small list of operations. The operations get applied later by applyRows(),
// against whatever the local data looks like at that moment — a kharcha added
// while the network request was still in flight must never be overwritten by a
// stale copy of the register.
export async function pullRemote(data, meta, userScope = 'guest') {
  if (!meta || !meta.familyCode) return { ok: false, changed: false, applied: [], data };

  const rows = await cloud.pullEntries(meta.familyCode, meta.lastPulledAt || 0);
  if (!rows) return { ok: false, changed: false, applied: [], data }; // offline
  if (rows.length === 0) {
    const nextMeta = await saveMeta({ ...meta, lastPulledAt: Date.now() }, userScope);
    return { ok: true, changed: false, applied: [], data, meta: nextMeta };
  }

  const snapshot = await readSnapshot(userScope);
  const index = {};
  forEachEntry(data, (monthKey, entry) => {
    if (entry && entry.id) index[entry.id] = entry;
  });

  const isMember = meta.role === 'member';
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

    const dec = decodeAddedBy(row.added_by);
    const paid = row.paid !== undefined ? !!row.paid : dec.paid;
    const paymentMode = row.payment_mode || dec.paymentMode || null;
    const paidAt = Number(row.paid_at) || dec.paidAt || null;
    const paymentNote = row.payment_note !== undefined ? String(row.payment_note || '') : dec.paymentNote;

    // For owner: local edits/deletes win until sent.
    // For members: cloud is the truth — except a payment mark this device made
    // but has not managed to push yet must not be silently rolled back by a
    // pull; it goes up on the next sync round instead.
    const memberPayDirty =
      isMember && !!here && !!prev &&
      ((here.paid ? 1 : 0) !== (prev.p || 0) ||
        (here.paymentMode || '') !== (prev.m || '') ||
        (here.paymentNote || '') !== (prev.n || '') ||
        (here.paidAt || 0) !== (prev.a || 0));
    const dirty = isMember
      ? memberPayDirty
      : (!here ? !!prev : prev === undefined || prev.u !== here.updatedAt);
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
        addedBy: dec.deviceName,
        updatedAt: at,
        paid,
        paymentMode,
        paidAt,
        paymentNote,
      },
    });
    snapshot[row.id] = {
      u: at,
      d: 0,
      p: paid ? 1 : 0,
      m: paymentMode || '',
      a: paidAt || 0,
      n: paymentNote || '',
    };
  });

  await saveSnapshot(snapshot, userScope);
  const newest = rows.reduce((a, r) => Math.max(a, Number(r.updated_at) || 0), meta.lastPulledAt || 0);
  const nextMeta = await saveMeta({ ...meta, lastPulledAt: newest }, userScope);
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
      next[monthKey] = next[monthKey].map((e) => (e.id === op.id ? { ...e, ...op.entry } : e));
      return;
    }
    if (!op.monthKey) return;
    next[op.monthKey] = [op.entry, ...(next[op.monthKey] || [])];
    index[op.id] = op.monthKey;
  });
  return next;
}

// A kicked member must not keep seeing the family's register. The snapshot is
// exactly the set of ids this device synced with the family (pulled down or
// pushed up), so everything in it gets dropped from the local data. Entries
// that never touched the cloud — the phone's own personal kharcha — stay.
export function stripSyncedEntries(data, snapshot) {
  const next = {};
  let changed = false;
  Object.keys(data).forEach((monthKey) => {
    const list = Array.isArray(data[monthKey]) ? data[monthKey] : [];
    const kept = list.filter((e) => !e || !e.id || snapshot[e.id] === undefined);
    if (kept.length !== list.length) changed = true;
    if (kept.length > 0) next[monthKey] = kept;
  });
  return changed ? next : data;
}

// One full round trip: push whatever is pending, then pull whatever is new.
export async function syncOnce(data, meta, userScope = 'guest') {
  if (!meta || !meta.familyCode) return { ok: false, changed: false, applied: [], pushed: 0 };
  const push = await pushLocal(data, meta, userScope);
  const pull = await pullRemote(data, meta, userScope);
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
