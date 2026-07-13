import { useEffect } from 'react';
import { useRouter, usePathname, useRootNavigationState } from 'expo-router';
import { SplashScreen } from '@/components/shared/SplashScreen';

/**
 * Catch-all for unmatched routes. Redirects home via an effect (NOT a
 * render-phase <Redirect>): a render-phase redirect here spins into
 * "Maximum update depth exceeded" whenever a navigation target 404s and
 * bounces back through this screen. The __DEV__ log surfaces the exact
 * unmatched path so a bad router.replace target is easy to spot.
 */
export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const rootState = useRootNavigationState();

  useEffect(() => {
    if (__DEV__) console.warn('[+not-found] unmatched path →', pathname);
    if (!rootState?.key) return;
    router.replace('/');
  }, [rootState?.key, pathname]);

  return <SplashScreen />;
}
