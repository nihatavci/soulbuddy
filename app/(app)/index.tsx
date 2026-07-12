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
 * Unauthenticated users are redirected to the welcome screen (the (auth) group's
 * initial route), never straight to the account screens, so a signed-out user
 * cannot deep-link past the 18+ age gate.
 */

import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { SplashScreen } from '@/components/shared/SplashScreen';

export default function AppGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading) return <SplashScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;
  if (profileLoading) return <SplashScreen />;
  if (profile?.onboarded !== true) return <Redirect href="/(app)/onboarding" />;
  return <Redirect href={'/(app)/(tabs)/index/index' as any} />;
}
