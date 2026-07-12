/**
 * TanStack Query client + persister
 *
 * Strategy:
 *   • staleTime  5 min  → data is considered fresh for 5 minutes
 *   • gcTime    24 h   → unused cache entries survive 24 h on disk
 *   • networkMode 'offlineFirst' → serve cache immediately, refetch in bg
 *   • Mutations pause when offline; auto-resume on reconnect via
 *     queryClient.resumePausedMutations() (called from useNetworkSync)
 *
 * Persister:
 *   Uses AsyncStorage so it works in BOTH Expo Go and native builds.
 *   On native builds MMKV is faster, but AsyncStorage is fine for cache
 *   serialisation (happens at most once per second in the background).
 */

import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'myapp-query-cache';

// ─── QueryClient ───────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   1000 * 60 * 5,        // 5 minutes
      gcTime:      1000 * 60 * 60 * 24,  // 24 hours
      retry:       2,
      retryDelay:  (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,        // mobile has no "window focus"
      refetchOnReconnect:   true,         // refetch when network returns
    },
    mutations: {
      networkMode: 'offlineFirst',        // queue mutations when offline
      retry:       1,
      retryDelay:  2000,
    },
  },
});

// ─── AsyncStorage Persister ────────────────────────────────────────────────
// Implements the Persister interface manually — no extra package needed.
// Works in Expo Go, dev client, and production builds.

let _flushTimer: ReturnType<typeof setTimeout> | null = null;

export const mmkvPersister: Persister = {
  persistClient: (client: PersistedClient) => {
    // Throttle writes: flush at most every 1 second
    if (_flushTimer) return;
    _flushTimer = setTimeout(async () => {
      _flushTimer = null;
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client));
      } catch {
        // Storage full or unavailable — silently skip
      }
    }, 1000);
  },

  restoreClient: async (): Promise<PersistedClient | undefined> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },

  removeClient: async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
  },
};

// ─── Query key factory ─────────────────────────────────────────────────────
// Centralised keys prevent typos and enable targeted invalidation.

export const queryKeys = {
  // profiles
  profile:        (userId: string)             => ['profile', userId] as const,
  partnerProfile: (coupleId: string)           => ['partnerProfile', coupleId] as const,

  // mood entries
  moodEntries:    (userId: string, limit?: number) =>
    limit != null ? ['moodEntries', userId, limit] : ['moodEntries', userId],

  // couple
  couple:         (userId: string)             => ['couple', userId] as const,

  // conversation sessions
  sessions:       (userId: string, mode?: string) =>
    mode ? ['sessions', userId, mode] : ['sessions', userId],

  // love maps
  loveMaps:       (userId: string, category?: string) =>
    category ? ['loveMaps', userId, category] : ['loveMaps', userId],

  // a single conversation session (with context — used for rename/title)
  session:        (sessionId: string)          => ['session', sessionId] as const,

  // messages in a session
  messages:       (sessionId: string)          => ['messages', sessionId] as const,

  // extended profile (relationship DNA)
  profileExtended: (userId: string)            => ['profileExtended', userId] as const,

  // aggregated AI context (profile + moods + love maps + sessions)
  userContext:     (userId: string)             => ['userContext', userId] as const,
} as const;
