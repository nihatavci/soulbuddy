/**
 * useHapticOnFocus
 *
 * Fires Haptics.selectionAsync() whenever this screen gains focus,
 * but skips the initial mount (so the first render is silent).
 *
 * iOS-only use case: NativeTabs has no screenListeners API, so haptics
 * are wired here instead. Android tab haptics stay in screenListeners.
 */

import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export function useHapticOnFocus(): void {
  const isFocused = useIsFocused();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isFocused) {
      void Haptics.selectionAsync();
    }
  }, [isFocused]);
}
