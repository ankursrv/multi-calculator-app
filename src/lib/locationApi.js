// Thin wrapper over Supabase's PostgREST API for location shares, using plain
// fetch — no extra npm package, no native module, so Expo Go keeps working.
//
// Every call resolves to `null` on failure (offline, bad key, server down)
// instead of throwing, because the cloud is an optional layer on top of local
// AsyncStorage data.
import { ANON_KEY, CLOUD_ENABLED, REST_BASE } from './supabaseConfig';

export { CLOUD_ENABLED };

const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function request({ method = 'GET', table = 'location_shares', query = '', body, prefer } = {}) {
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

// Ensure the family code exists in `kharcha_families` so that Supabase RLS policies
// (which verify `exists (select 1 from kharcha_families where code = family_code)`)
// succeed without permission errors.
export async function ensureFamilyRegistered(familyCode) {
  if (!CLOUD_ENABLED || !familyCode) return false;
  try {
    const res = await request({
      table: 'kharcha_families',
      method: 'POST',
      body: { code: familyCode, created_at: Date.now() },
      prefer: 'resolution=ignore-duplicates,return=minimal',
    });
    return res !== null;
  } catch (_e) {
    return false;
  }
}

// Upsert this device's own location share row. One row per device+family.
export async function upsertLocationShare(share) {
  return request({
    table: 'location_shares',
    method: 'POST',
    body: [share],
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

// Pull the latest location share for every member of a family.
export async function pullLocationShares(familyCode, since = 0) {
  if (!familyCode) return [];
  const safeCode = encodeURIComponent(familyCode);
  const query = `?select=*&family_code=eq.${safeCode}&updated_at=gt.${since}&order=updated_at.desc&limit=200`;
  return request({
    table: 'location_shares',
    query,
  });
}

// Mark this device's share as expired (stop sharing).
export async function expireLocationShare(id) {
  if (!id) return null;
  const safeId = encodeURIComponent(id);
  return request({
    table: 'location_shares',
    method: 'PATCH',
    query: `?id=eq.${safeId}`,
    body: { expires_at: 0 },
  });
}

// Delete this device's share row completely.
export async function deleteLocationShare(id) {
  if (!id) return null;
  const safeId = encodeURIComponent(id);
  return request({
    table: 'location_shares',
    method: 'DELETE',
    query: `?id=eq.${safeId}`,
  });
}
