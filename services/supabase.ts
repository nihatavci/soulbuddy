/**
 * Supabase client
 *
 * Auth is handled natively by Supabase Auth. Sessions are persisted in an
 * encrypted MMKV store (encryption key held in expo-secure-store).
 *
 * RLS policies should use:
 *   auth.uid() = user_id
 *
 * All writes requiring elevated permissions still go through the Cloudflare
 * Worker (server/), which uses the Supabase service role key.
 */

import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import type { Database } from './database.types';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__ && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn(
    '[supabase] Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  );
}

// ─── Encrypted MMKV session storage ──────────────────────────────────────────

const MMKV_KEY_ID = 'supabase-mmkv-key';

/**
 * Retrieve or generate a 32-char hex encryption key for MMKV.
 * The key is stored in the device's hardware-backed secure store (Keychain on iOS).
 */
function getOrCreateEncryptionKey(): string {
  let key = SecureStore.getItem(MMKV_KEY_ID);
  if (!key) {
    const bytes = Crypto.getRandomBytes(16);
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    SecureStore.setItem(MMKV_KEY_ID, key);
  }
  return key;
}

const sessionStorage = new MMKV({
  id: 'supabase-auth',
  encryptionKey: getOrCreateEncryptionKey(),
});

/** AsyncStorage-compatible adapter for Supabase auth persistence. */
const mmkvAdapter = {
  getItem: (key: string): string | null => sessionStorage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    sessionStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    sessionStorage.delete(key);
  },
};

// ─── Supabase client ─────────────────────────────────────────────────────────

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Must be false for React Native
  },
  global: {
    headers: {
      'x-app-name': 'myapp-mobile',
    },
  },
});

// ─── Auto-refresh management ─────────────────────────────────────────────────

/**
 * Start automatic token refresh. Call when app comes to foreground.
 * Supabase will periodically refresh the access token in the background.
 */
export function startAutoRefresh(): void {
  supabase.auth.startAutoRefresh();
}

/**
 * Stop automatic token refresh. Call when app goes to background.
 * Prevents unnecessary network activity while the app is inactive.
 */
export function stopAutoRefresh(): void {
  supabase.auth.stopAutoRefresh();
}

// ─── Typed helpers ───────────────────────────────────────────────────────────

export type Tables        = Database['public']['Tables'];
export type Views         = Database['public']['Views'];
export type Profile       = Tables['profiles']['Row'];
export type PublicProfile = Views['public_profiles']['Row']; // alias + intent + boundaries only (no identity)
