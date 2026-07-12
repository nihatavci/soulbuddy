/**
 * hooks/useTrackingTransparency.ts — App Tracking Transparency gate
 *
 * Requests ATT permission on iOS before any tracking starts.
 * Returns { isReady, isTrackingAllowed } so the app can:
 *   - Wait for the prompt before initializing analytics
 *   - Disable personalized tracking if the user denies
 *
 * On Android and Expo Go, tracking is allowed by default (ATT is iOS-only).
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';

interface TrackingState {
  /** True once ATT has been resolved (granted, denied, or N/A on Android) */
  isReady: boolean;
  /** True if the user granted tracking permission (or on Android where ATT doesn't apply) */
  isTrackingAllowed: boolean;
}

export function useTrackingTransparency(): TrackingState {
  const [state, setState] = useState<TrackingState>({
    isReady: Platform.OS !== 'ios', // Android is immediately ready
    isTrackingAllowed: Platform.OS !== 'ios', // Android allows by default
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let cancelled = false;

    async function requestATT() {
      try {
        // Check existing status first — avoid re-prompting if already decided
        const existing = await getTrackingPermissionsAsync();
        if (existing.status === PermissionStatus.GRANTED) {
          if (!cancelled) setState({ isReady: true, isTrackingAllowed: true });
          return;
        }
        if (existing.status === PermissionStatus.DENIED) {
          if (!cancelled) setState({ isReady: true, isTrackingAllowed: false });
          return;
        }

        // Status is UNDETERMINED — show the native ATT dialog
        const { status } = await requestTrackingPermissionsAsync();
        if (!cancelled) {
          setState({
            isReady: true,
            isTrackingAllowed: status === PermissionStatus.GRANTED,
          });
        }
      } catch {
        // Expo Go or simulator may throw — treat as allowed to avoid blocking
        if (!cancelled) setState({ isReady: true, isTrackingAllowed: true });
      }
    }

    requestATT();
    return () => { cancelled = true; };
  }, []);

  return state;
}
