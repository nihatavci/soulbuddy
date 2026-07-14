/**
 * Root Layout
 *
 * Routing strategy:
 *   Not authenticated → allowed into (app) group (unauthenticated onboarding)
 *   Authenticated + in (auth) group → redirect to (app)
 *
 * Provider order (outer → inner):
 *   Sentry.wrap                  ← error monitoring + performance
 *     GestureHandlerRootView
 *         PersistQueryClientProvider  ← TanStack Query persistence
 *           AuthProvider               ← Supabase Auth
 *             LanguageProvider
 *               MentalStateProvider
 */

import '@/i18n'; // i18next init — must be first, before any component imports
import 'react-native-gesture-handler';
import '../global.css';

import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';

// Suppress red-box for native modules that degrade gracefully in Expo Go
LogBox.ignoreLogs([
  'Could not load RNOneSignal native module',
  '[RevenueCat]',
]);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useSegments, useNavigationContainerRef, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { setGeminiAuthProvider } from '@/services/gemini';
import { supabase } from '@/services/supabase';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { loadFonts } from '@/constants/fonts';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { queryClient, mmkvPersister } from '@/store/queryClient';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { initSentry, SentryWrap, sentryRoutingInstrumentation } from '@/lib/sentry';
import { useTrackingTransparency } from '@/hooks/useTrackingTransparency';
import { ToastSetupProvider, ToastOverlay } from '@/components/glow/index';
import { getConsentPreferences, hasGivenConsent } from '@/lib/consent';
import { initMixpanel, optInMixpanel, optOutMixpanel } from '@/lib/mixpanel';

// ─── Sentry must init BEFORE anything else renders ───────────────────────────
// All config (replay, feedback, privacy guards) lives in lib/sentry.ts
initSentry();

// ─── Mixpanel init ────────────────────────────────────────────────────────────
// Called at module load time (before any render) — safe, non-blocking.
initMixpanel();


// ─── Auth Guard ────────────────────────────────────────────────────────────────
// Redirects an authenticated user out of the (auth) group. Navigation runs in an
// effect (NOT a render-phase <Redirect>): firing navigation during render while the
// nested navigators are still mounting trips React's "Maximum update depth exceeded"
// guard — this is the same class of bug the root index (app/index.tsx) and AppGate
// ((app)/index.tsx) already avoid. We gate on useRootNavigationState().key so we only
// navigate once the navigation tree is hydrated.

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootState = useRootNavigationState();

  // Resume offline-queued mutations and refetch stale queries on reconnect
  useNetworkSync();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (!rootState?.key) return;      // nav tree not hydrated yet
    if (isLoading) return;

    // Authenticated user in (auth) group → send them to (app)
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
    }
    // Unauthenticated user in (app) group — no redirect here; AppGate sends them
    // to /(auth)/welcome (no anonymous session is auto-created in re:sense).
  }, [rootState?.key, isLoading, isAuthenticated, inAuthGroup]);

  return null;
}

// ─── Auth-gated app shell ────────────────────────────────────────────────────
// Sits inside AuthProvider so it can read isLoading. Shows the branded splash
// screen until Supabase has resolved auth state — prevents a flash of the wrong
// screen group ((app) vs (auth)) before the AuthGuard navigates.

function AuthGatedApp({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
  const { isAuthenticated } = useAuth();

  // Always register the token provider — it returns null if no session exists,
  // which is fine (Gemini service handles the error). Previously this was guarded
  // by isAuthenticated, which meant it was never set during unauthenticated flows.
  useEffect(() => {
    setGeminiAuthProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, [isAuthenticated]);

  return (
    <LanguageProvider>
      <ToastSetupProvider>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth group — unauthenticated screens */}
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          {/* App group — authenticated screens */}
          <Stack.Screen name="(app)"  options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* ToastOverlay MUST be last — rendered after Stack so it floats above all native screens */}
        <ToastOverlay />
      </ToastSetupProvider>
    </LanguageProvider>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const colorScheme = useColorScheme();

  const { isReady: attReady } = useTrackingTransparency();

  useEffect(() => {
    if (!attReady) return;
    if (hasGivenConsent()) {
      const consent = getConsentPreferences();
      if (consent.analytics) {
        optInMixpanel();
      } else {
        optOutMixpanel();
      }
    }
  }, [attReady]);

  // Sentry navigation tracking — register the navigation container ref
  // so Sentry auto-creates transactions for each screen change.
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef.current) {
      sentryRoutingInstrumentation.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    async function load() {
      try {
        await loadFonts();
      } catch (err) {
        console.error('Font loading error:', err);
      }
      setFontsLoaded(true);
    }
    load();
  }, []);

  if (!fontsLoaded || !attReady) {
    return null; // Splash is shown by AuthGatedApp — single instance only
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* TanStack Query with cache persistence */}
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister:    mmkvPersister,
            maxAge:       1000 * 60 * 60 * 24,   // 24 h cache lifetime
            buster:       '3',                    // bumped — Supabase auth migration
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.state.status === 'success',
            },
          }}
        >
          <AuthProvider>
            <AuthGatedApp colorScheme={colorScheme} />
          </AuthProvider>
        </PersistQueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Sentry.wrap enables performance monitoring and automatic error capture
// for the entire component tree.
export default SentryWrap(RootLayout);
