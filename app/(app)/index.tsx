/**
 * App Gate — the initial route inside (app).
 *
 * Deterministic re:sense routing (no anonymous auto-session, no consent/subscription gates):
 *   1. auth loading           → splash
 *   2. not authenticated      → /(auth)/welcome  (welcome → age gate precede account creation; AGE-01)
 *   3. profile loading        → splash
 *   4. profile not onboarded  → /(app)/onboarding
 *   5. else                   → /(app)/(tabs)/index/index
 *
 * Navigation runs in an effect (NOT a render-phase <Redirect>). Firing navigation
 * during render — while the nested (app) navigator is still mounting under the root
 * Stack — trips React's "Maximum update depth exceeded" guard (see app/index.tsx for
 * the same fix on the root index). We gate on useRootNavigationState().key so we only
 * navigate once the navigation tree is hydrated, and always render the splash so there
 * is no flash of the wrong screen group.
 *
 * Unauthenticated users are sent to the welcome screen (the (auth) group's initial
 * route), never straight to the account screens, so a signed-out user cannot deep-link
 * past the 18+ age gate.
 */

import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { SplashScreen } from '@/components/shared/SplashScreen';

export default function AppGate() {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const onboarded = profile?.onboarded === true;

  useEffect(() => {
    // Wait until the navigation tree is fully hydrated before navigating.
    if (!rootState?.key) return;
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (profileLoading) return;

    if (!onboarded) {
      router.replace('/(app)/onboarding');
      return;
    }

    // Navigate to the tabs GROUP, not the deep nested index file — the group
    // href resolves to the tab navigator's initial screen and avoids the
    // doubled-`index` path (/(tabs)/index/index) which can 404 to +not-found.
    router.replace('/(app)/(tabs)' as any);
  }, [rootState?.key, authLoading, isAuthenticated, profileLoading, onboarded]);

  // Always render splash while the effect resolves the destination — prevents a
  // flash of the wrong screen group before navigation settles.
  return <SplashScreen />;
}
