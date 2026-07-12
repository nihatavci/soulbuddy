/**
 * useReduceMotion
 *
 * Reads the OS "Reduce Motion" accessibility setting and keeps it live.
 * Returns true when the user has asked the system to minimize animation, so
 * components can drop entrances/loops to a calm static end-state.
 *
 * The repo had no reduce-motion handling before this; new animated surfaces
 * (gift popup, offer hero, CTA glow) gate their motion on it.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
