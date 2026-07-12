/**
 * MMKV storage
 *
 * react-native-mmkv is a native C++ module — it is NOT available in Expo Go.
 * This file wraps it with a safe conditional so the app doesn't crash.
 *
 * • Expo Go  → MMKV unavailable; Prefs degrades to a plain in-memory Map
 * • Dev client / production build → full MMKV with disk persistence
 *
 * The TanStack Query cache persister uses AsyncStorage instead of MMKV
 * so it works universally (see store/queryClient.ts).
 */

// ─── MMKV (native builds only) ─────────────────────────────────────────────

type MMKVInstance = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | boolean | number) => void;
  getBoolean: (key: string) => boolean | undefined;
  delete: (key: string) => void;
};

let _storage: MMKVInstance | null = null;
let _prefsStorage: MMKVInstance | null = null;

try {
  // Dynamic require so Metro doesn't hard-fail when MMKV native module is absent
  const { MMKV } = require('react-native-mmkv');
  _storage      = new MMKV({ id: 'myapp-store' });
  _prefsStorage = new MMKV({ id: 'myapp-prefs' });
} catch {
  // Running in Expo Go — native module not available, fall through to in-memory
}

export const storage      = _storage;
export const prefsStorage = _prefsStorage;

// ─── Sync storage adapter (only used by native builds) ────────────────────

/**
 * Implements the `SyncStorage<string>` interface for
 * `@tanstack/query-sync-storage-persister`.
 * Only valid when `storage` is non-null (i.e. native build).
 */
export const mmkvStorageAdapter = storage
  ? {
      getItem:    (key: string): string | null => storage.getString(key) ?? null,
      setItem:    (key: string, value: string): void => storage.set(key, value),
      removeItem: (key: string): void => storage.delete(key),
    }
  : null;

// ─── Preference helpers ────────────────────────────────────────────────────
// Falls back to a plain in-memory Map when running in Expo Go.

const _memPrefs = new Map<string, string | boolean>();

export const Prefs = {
  get: (key: string, fallback?: string): string | undefined =>
    (prefsStorage?.getString(key) ?? (_memPrefs.get(key) as string | undefined)) ?? fallback,

  set: (key: string, value: string): void => {
    if (prefsStorage) prefsStorage.set(key, value);
    else _memPrefs.set(key, value);
  },

  getBool: (key: string, fallback = false): boolean =>
    (prefsStorage?.getBoolean(key) ?? (_memPrefs.get(key) as boolean | undefined)) ?? fallback,

  setBool: (key: string, value: boolean): void => {
    if (prefsStorage) prefsStorage.set(key, value);
    else _memPrefs.set(key, value);
  },

  getInt: (key: string, fallback = 0): number => {
    const raw = prefsStorage?.getString(key) ?? (_memPrefs.get(key) as string | undefined);
    if (raw == null) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  },

  setInt: (key: string, value: number): void => {
    const encoded = String(value);
    if (prefsStorage) prefsStorage.set(key, encoded);
    else _memPrefs.set(key, encoded);
  },

  remove: (key: string): void => {
    prefsStorage?.delete(key);
    _memPrefs.delete(key);
  },
};
