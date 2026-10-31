// Supabase connection details, read from Expo public env vars.
//
// If the vars are missing (no account yet, or working on a branch without
// cloud), CLOUD_ENABLED stays false and the whole sync layer becomes a
// no-op — the app then behaves exactly like the offline-only version.
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// A real project URL always points at a *.supabase.<tld> host and anon keys
// are long strings, so the placeholder values in .env.example (or a half-filled
// .env.local) will not accidentally switch the cloud on.
const PLACEHOLDER_MARK = 'YOUR-PROJECT-REF';
function looksLikeProjectUrl(url) {
  if (url.indexOf('https://') !== 0) return false;
  const host = url.slice(8).split('/')[0];
  const parts = host.split('.');
  return parts.length >= 3 && parts[parts.length - 2] === 'supabase';
}

export const CLOUD_ENABLED =
  looksLikeProjectUrl(rawUrl) && rawKey.length >= 40 && rawUrl.indexOf(PLACEHOLDER_MARK) === -1;

// PostgREST base — Supabase auto-generates a CRUD API at <project>/rest/v1.
export const REST_BASE = CLOUD_ENABLED ? `${rawUrl.replace(/\/+$/, '')}/rest/v1` : '';

export const ANON_KEY = rawKey;

// Family codes are typed by hand on a phone, so skip confusable characters
// (no I/O/0/1). 28 symbols ^ 8 positions makes a code impossible to guess.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const FAMILY_CODE_LENGTH = 8;

export function makeFamilyCode() {
  let code = '';
  for (let i = 0; i < FAMILY_CODE_LENGTH; i += 1) {
    const r = global.crypto ? global.crypto.getRandomValues(new Uint8Array(1))[0] : Math.floor(Math.random() * 256);
    code += CODE_ALPHABET[r % CODE_ALPHABET.length];
  }
  return code;
}

// Only uppercase alphanumerics of the right length can be a valid code.
export function normalizeFamilyCode(input) {
  const cleaned = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned.length === FAMILY_CODE_LENGTH ? cleaned : '';
}
