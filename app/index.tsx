/**
 * Root index — redirects to (app). AuthGuard in _layout.tsx handles
 * unauthenticated users → sign-in.
 *
 * Uses useEffect instead of <Redirect> to avoid firing navigation
 * during the render phase, which can cause "Maximum update depth exceeded"
 * when the provider tree is deep and multiple navigators are mounting.
 */
import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function RootIndex() {
  const router = useRouter();
  const rootState = useRootNavigationState();

  useEffect(() => {
    // Wait until the navigation tree is fully hydrated before navigating.
    if (!rootState?.key) return;
    router.replace('/(app)' as any);
  }, [rootState?.key]);

  return null;
}
