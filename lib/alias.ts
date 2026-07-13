/**
 * lib/alias.ts — pure alias validation for re:sense onboarding (IDEN-01).
 *
 * Aliases are the public handle; there is NO real-name field. This screens
 * length, allowed characters, and a small reserved/brand/profanity list. Pure
 * (no I/O) — uniqueness is enforced by the case-insensitive DB index and
 * surfaced as an inline error at write time, not here.
 */

const MIN = 3;
const MAX = 20;

// Only letters, digits, underscore and hyphen — no spaces or punctuation.
const ALLOWED = /^[A-Za-z0-9_-]+$/;

// Reserved handles + brand words + a minimal profanity screen (lowercased).
const RESERVED = new Set([
  'admin', 'administrator', 'root', 'system', 'support', 'help',
  'moderator', 'mod', 'staff', 'official', 'resense', 'resense_',
  're:sense', 'resensе', // brand
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'rape',
]);

export interface AliasResult {
  ok: boolean;
  value: string;
  error?: string;
}

export function validateAlias(raw: string): AliasResult {
  const value = (raw ?? '').trim();

  if (value.length < MIN) {
    return { ok: false, value, error: 'Alias must be at least 3 characters.' };
  }
  if (value.length > MAX) {
    return { ok: false, value, error: 'Alias must be at most 20 characters.' };
  }
  if (!ALLOWED.test(value)) {
    return { ok: false, value, error: 'Use letters, numbers, _ or - only.' };
  }
  if (RESERVED.has(value.toLowerCase())) {
    return { ok: false, value, error: 'That alias isn’t available.' };
  }

  return { ok: true, value };
}
