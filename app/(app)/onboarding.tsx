/**
 * Onboarding Screen — placeholder (domain components removed).
 * Redirects to paywall until onboarding flow is rebuilt.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { trackMixpanel, trackMixpanelOnboardingCompleted } from '@/lib/mixpanel';
import { logAppsFlyerEvent } from '@/lib/appsflyer';
import { logFacebookEvent, FBEvent } from '@/lib/facebook';
import { SplashScreen } from '@/components/shared/SplashScreen';

export default function OnboardingScreen() {
  const router = useRouter();

  useEffect(() => {
    trackMixpanel('onboarding_started');
    // No onboarding flow components yet — skip straight to paywall
    trackMixpanelOnboardingCompleted();
    logAppsFlyerEvent('onboarding_complete', { version: 'v1' });
    logFacebookEvent(FBEvent.ONBOARDING_DONE, { version: 'v1' });
    router.replace('/(app)/paywall');
  }, []);

  return <SplashScreen />;
}
