/**
 * useNetworkSync
 *
 * Monitors network connectivity and:
 *   1. Resumes paused (offline-queued) mutations when back online.
 *   2. Invalidates stale queries so they refetch with fresh data.
 *
 * Must be mounted once inside QueryClientProvider — place it in the root
 * layout alongside <AuthGuard />.
 *
 * Uses @react-native-community/netinfo for reliable connectivity events
 * on both iOS and Android.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { queryKeys } from '@/store/queryClient';
import { useAuth } from '@/context/AuthContext';

export function useNetworkSync() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);

      if (!isOnline) {
        wasOfflineRef.current = true;
        return;
      }

      // ── Back online ──────────────────────────────────────────────────
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;

        // 1. Resume any mutations that were paused while offline
        qc.resumePausedMutations();

        // 2. Invalidate critical queries so they refetch fresh data
        if (user?.id) {
          qc.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
          qc.invalidateQueries({ queryKey: queryKeys.moodEntries(user.id) });
          qc.invalidateQueries({ queryKey: queryKeys.couple(user.id) });
          qc.invalidateQueries({ queryKey: queryKeys.sessions(user.id) });
          qc.invalidateQueries({ queryKey: queryKeys.loveMaps(user.id) });
        }
      }
    });

    return unsubscribe;
  }, [qc, user?.id]);
}

// ─── Standalone network check helper ──────────────────────────────────────

/**
 * Returns a one-shot Promise resolving to the current network state.
 * Useful for pre-flight checks before heavy operations.
 */
export async function isNetworkAvailable(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable !== false);
}
