/**
 * hooks/useEntitlements.ts
 *
 * TanStack Query hook for RevenueCat entitlement status.
 *
 * Features:
 * – 5-minute stale time (no hammering RevenueCat on every render)
 * – AppState listener: refetches the instant the app comes to foreground
 *   (catches purchases made in the App Store / Play Store outside the app)
 * – isPro boolean derived from "MyApp Pro" entitlement in CustomerInfo
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect } from 'react';
import { fetchCustomerInfo, isProFromCustomerInfo } from '@/lib/revenuecat';

// ─── Query key ───────────────────────────────────────────────────────────────
// Export so paywall can invalidate directly after a purchase.

export const ENTITLEMENTS_QUERY_KEY = ['entitlements'] as const;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEntitlements() {
  const queryClient = useQueryClient();

  // Refetch whenever the app comes to foreground.
  // This is the most reliable way to pick up purchases made externally
  // (e.g. user restores on a new device, or purchases via App Store).
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (lastState !== 'active' && nextState === 'active') {
        queryClient.invalidateQueries({ queryKey: ENTITLEMENTS_QUERY_KEY });
      }
      lastState = nextState;
    });

    return () => sub.remove();
  }, [queryClient]);

  return useQuery({
    queryKey: ENTITLEMENTS_QUERY_KEY,
    queryFn: async () => {
      const info = await fetchCustomerInfo();
      return {
        isPro:        isProFromCustomerInfo(info),
        customerInfo: info,
      };
    },
    staleTime: 5 * 60 * 1000,   // 5 min — fresh enough for entitlement checks
    gcTime:    30 * 60 * 1000,  // 30 min in memory after unmount
    // On error, optimistically assume free tier (never lock out free users)
    placeholderData: { isPro: false, customerInfo: null as any },
  });
}
