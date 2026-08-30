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
import { consumePendingSpaceDeepLink } from '@/lib/pushDeepLink';

export default function AppGate() {
  const router = useRouter();
  const rootState = useRootNavigationState();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const onboarded = profile?.onboarded === true;

  useEffect(() => {
    if (__DEV__) {
      console.log(
        `[push-dl] ${Date.now()} gate check navKey=${rootState?.key} authLoading=${authLoading} isAuthenticated=${isAuthenticated} profileLoading=${profileLoading} onboarded=${onboarded}`,
      );
    }
    // Wait until the navigation tree is fully hydrated before navigating.
    if (!rootState?.key) return;
    if (authLoading) return;

    if (!isAuthenticated) {
      if (__DEV__) console.log(`[push-dl] ${Date.now()} gate replace -> /(auth)/welcome`);
      router.replace('/(auth)/welcome');
      return;
    }

    if (profileLoading) return;

    if (!onboarded) {
      if (__DEV__) console.log(`[push-dl] ${Date.now()} gate replace -> /(app)/onboarding`);
      router.replace('/(app)/onboarding');
      return;
    }

    // Navigate to the tabs GROUP, not the deep nested index file — the group
    // href resolves to the tab navigator's initial screen and avoids the
    // doubled-`index` path (/(tabs)/index/index) which can 404 to +not-found.
    // Replace to tabs FIRST so there is a real back target, then — on this
    // authenticated + onboarded branch only — replay any pending notification
    // deep link by pushing private-space on top. Single-consume: a later gate
    // pass or a later app open will not re-fire it.
    if (__DEV__) console.log(`[push-dl] ${Date.now()} gate replace -> /(app)/(tabs)`);
    router.replace('/(app)/(tabs)' as any);

    const pendingSpaceId = consumePendingSpaceDeepLink();
    if (pendingSpaceId) {
      if (__DEV__) console.log(`[push-dl] ${Date.now()} gate replaying pending spaceId=${pendingSpaceId}`);
      router.push({ pathname: '/(app)/private-space', params: { spaceId: pendingSpaceId } } as any);
    }
  }, [rootState?.key, authLoading, isAuthenticated, profileLoading, onboarded]);

  // Always render splash while the effect resolves the destination — prevents a
  // flash of the wrong screen group before navigation settles.
  return <SplashScreen />;
}
