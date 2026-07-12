/**
 * App Gate — the initial route inside (app).
 *
 * Declaratively redirects through:
 *   Auto: No session? → create anonymous session silently
 *   Gate 0: GDPR consent          -> /(app)/consent
 *   Gate 1: Onboarding complete?  -> /(app)/onboarding
 *   Gate 2: Subscribed?           -> /(app)/paywall
 *   Gate 3: All passed            -> /(app)/(tabs)/index/index
 */

import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuth } from '@/context/AuthContext';
import { Prefs } from '@/store/mmkv';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { hasGivenConsent } from '@/lib/consent';

export default function AppGate() {
  const { data: entitlements, isLoading: entitlementsLoading } = useEntitlements();
  const { isAuthenticated, signInAnonymously } = useAuth();

  // Auto-create an anonymous session in the background so backend calls work
  // later. This is fire-and-forget — it may fail (e.g. captcha protection
  // enabled on Supabase) and that's OK: onboarding is local-only (MMKV), the
  // paywall uses RevenueCat (no Supabase session required), and users who
  // actually sign up will get a real session then.
  useEffect(() => {
    if (!isAuthenticated) {
      signInAnonymously();
    }
  }, [isAuthenticated]);

  // Gate 0: GDPR consent — must be shown before any data collection starts.
  if (!hasGivenConsent()) {
    return <Redirect href={'/(app)/consent' as any} />;
  }

  // Gate 1 runs first so first-time users never wait on network/auth at all.
  const onboardingComplete = Prefs.getBool('onboarding_v3_complete');
  if (!onboardingComplete) {
    return <Redirect href="/(app)/onboarding" />;
  }

  // Only wait on entitlements once onboarding is done — at this point the
  // user is about to hit the paywall/tabs and we need the real isPro value.
  if (entitlementsLoading) {
    return <SplashScreen />;
  }

  // Gate 2: Pro status — is the user subscribed?
  // Users who tapped "Skip" on the paywall have `paywall_deferred` set and
  // get full app access; the signup push happens after their first generation.
  //
  // M5: Anonymous sessions bypass is intentional — anonymous users with
  // paywall_deferred access the free tier (daily reply limit enforced by
  // useMultiToneGeneration + server-side rate limiting). Premium features
  // are gated by RevenueCat entitlements + edge KV check in the Worker.
  // TODO: Consider server-side entitlement enforcement on /api/ai/generate
  // to prevent API-level bypass (currently only client-side gating).
  const isPro = entitlements?.isPro ?? false;
  const paywallDeferred = Prefs.getBool('paywall_deferred');
  if (!isPro && !paywallDeferred) {
    return <Redirect href="/(app)/paywall" />;
  }

  // All gates passed — go to tabs home.
  return <Redirect href={'/(app)/(tabs)/index/index' as any} />;
}
