// Thin wrapper over Supabase's auto-generated PostgREST API, using plain
// fetch — no extra npm package, no native module, so Expo Go keeps working.
//
// Every call resolves to `null` on failure (offline, bad key, server down)
// instead of throwing, because the cloud is an optional layer on top of the
// local AsyncStorage data.
import { ANON_KEY, CLOUD_ENABLED, REST_BASE } from './supabaseConfig';

const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function request(table, { method = 'GET', query = '', body, prefer } = {}) {
  if (!CLOUD_ENABLED) return null;
  try {
    const res = await fetch(`${REST_BASE}/${table}${query}`, {
      method,
      headers: prefer ? { ...HEADERS, Prefer: prefer } : HEADERS,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (_e) {
    return null; // network unreachable — caller keeps the work queued
  }
}

// 200 rows per request keeps a first-time push of years of data well under
// any gateway body-size limit.
const CHUNK = 200;
function chunked(list) {
  const out = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

export const cloud = {
  // Does this family code already exist? Used when someone tries to join.
  async checkFamily(code) {
    const rows = await request('kharcha_families', { query: `?select=code&code=eq.${code}` });
    if (rows === null) return null; // could not reach the server
    return rows.length > 0;
  },

  // Creating is idempotent, so a retried "create family" never errors out.
  async createFamily(code) {
    const ok = await request('kharcha_families', {
      method: 'POST',
      body: { code, created_at: Date.now() },
      prefer: 'resolution=ignore-duplicates,return=minimal',
    });
    return ok !== null;
  },

  async listMembers(code) {
    return request('kharcha_members', {
      query: `?select=device_name,joined_at&code=eq.${code}&order=joined_at.asc`,
    });
  },

  // Re-joining with the same name must not create a duplicate row.
  async addMember(code, deviceName) {
    const ok = await request('kharcha_members', {
      method: 'POST',
      body: [{ code, device_name: deviceName, joined_at: Date.now() }],
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    return ok !== null;
  },

  // Insert-or-update by primary key (id) — the upsert half of sync.
  async pushEntries(rows) {
    if (!rows || rows.length === 0) return true;
    for (const part of chunked(rows)) {
      const ok = await request('kharcha_entries', {
        method: 'POST',
        body: part,
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
      if (ok === null) return false;
    }
    return true;
  },

  // Only rows that changed after `since` — a delta pull, not a full download.
  async pullEntries(code, since) {
    return request('kharcha_entries', {
      query: `?select=*&family_code=eq.${code}&updated_at=gt.${since || 0}&order=updated_at.asc&limit=2000`,
    });
  },

};
