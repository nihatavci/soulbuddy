/**
 * App layout — reachable by both authenticated and unauthenticated users.
 *
 * Routing is handled by the gate screen (index.tsx) which uses
 * declarative <Redirect> to send users through: onboarding -> paywall -> signup -> tabs.
 * This layout just defines the Stack and handles SDK initialization.
 *
 * Responsible for:
 * – Initializing RevenueCat anonymously (no userId required)
 * – Identifying the user in Sentry so crash reports are linked (when authenticated)
 * – Initializing AppsFlyer for install attribution + OneLink deep linking
 * – Clearing stale onboarding state from previous A/B gate bug
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { initRevenueCat, linkRevenueCatIdentifiers } from '@/lib/revenuecat';
import { identifySentryUser, clearSentryUser } from '@/lib/sentry';
import { initAppsFlyer, setAppsFlyerUserId, clearAppsFlyerUserId } from '@/lib/appsflyer';
import { initFacebook, setFacebookUserId, clearFacebookUserId } from '@/lib/facebook';
import { requestTrackingPermissionsAsync, PermissionStatus } from 'expo-tracking-transparency';
import {
  identifyMixpanelUser,
  resetMixpanelIdentity,
  setSuperPropertyIsPro,
  trackMixpanelAppOpened,
} from '@/lib/mixpanel';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Prefs } from '@/store/mmkv';
import { UnreadProvider } from '@/context/UnreadContext';
import { registerPushToken, configureNotifications, addPushResponseListener } from '@/lib/push';
import { setPendingSpaceDeepLink } from '@/lib/pushDeepLink';

export default function AppLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const rootState = useRootNavigationState();

  // The push-response listener is registered once (mount-only effect below) but
  // fires asynchronously, possibly long after mount — it must always read the
  // LATEST nav-hydration / auth state, not whatever was captured in the effect's
  // closure at registration time. Refs give it a live read without re-subscribing.
  const navKeyRef = useRef<string | undefined>(rootState?.key);
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    navKeyRef.current = rootState?.key;
  }, [rootState?.key]);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const { data: entitlements } = useEntitlements();
  const isPro = entitlements?.isPro ?? false;

  // ── DEV ONLY: Clear stale onboarding state from previous buggy A/B gate ──
  useEffect(() => {
    const version = Prefs.getInt('onboarding_version') ?? 0;
    const hasExtendedProfile = Prefs.getBool('onboarding_v2_profile_saved');

    if (version >= 1 && !hasExtendedProfile) {
      if (__DEV__) console.log('[Onboarding] Resetting stale onboarding_version (was set by buggy A/B gate)');
      Prefs.setInt('onboarding_version', 0);
      Prefs.setBool('onboarding_complete', false);
    }
  }, []);

  // Initialize RevenueCat anonymously on mount (no userId required).
  // Post-signup identification is handled via loginRevenueCat() in the signup flow.
  useEffect(() => {
    initRevenueCat();
  }, []);

  // Initialize AppsFlyer for install attribution + OneLink deep links.
  // ATT must be requested (iOS 14.5+) before initSdk so the SDK captures IDFA
  // on the first launch. The SDK's 60s wait is a safety net, but requesting
  // explicitly here ensures the dialog fires before the SDK timer expires.
  useEffect(() => {
    const SAFE_DEEP_LINK_PATHS = new Set([
      '/(app)/(tabs)',
      '/(app)/profile',
      '/(app)/account',
      '/(app)/onboarding',
    ]);

    const DEEP_LINK_SLUGS: Record<string, string> = {
      test_link: '/(app)/(tabs)',
      home:      '/(app)/(tabs)',
      profile:   '/(app)/profile',
    };

    (async () => {
      // Request ATT before SDK init so IDFA is available on first launch.
      // On Android / simulator this is a no-op.
      let trackingAllowed = Platform.OS !== 'ios'; // Android: always allowed
      try {
        const { status } = await requestTrackingPermissionsAsync();
        trackingAllowed = status === PermissionStatus.GRANTED;
      } catch {
        // ATT unavailable (e.g. simulator) — proceed without IDFA
        trackingAllowed = true;
      }

      // Meta SDK — init AFTER ATT so advertiser tracking respects the choice.
      initFacebook(trackingAllowed);

      initAppsFlyer((result) => {
        if (result.deepLinkStatus !== 'FOUND') return;
        if (result.path && SAFE_DEEP_LINK_PATHS.has(result.path)) {
          router.push(result.path as any);
          return;
        }
        const slug = result.path?.replace(/^\/+/, '') ?? '';
        const mapped = DEEP_LINK_SLUGS[slug];
        if (mapped) router.push(mapped as any);
      });

      // Link AppsFlyer/Mixpanel/Meta IDs to RevenueCat so RC can forward
      // server-validated purchases to those platforms. Delay lets the AppsFlyer
      // SDK compute its UID and RevenueCat.configure() settle first.
      setTimeout(() => {
        linkRevenueCatIdentifiers({ trackingAllowed });
      }, 2500);
    })();
  }, []);

  // Register the Expo push token for message notifications (no-op until the app
  // is rebuilt with expo-notifications + a real EAS projectId).
  useEffect(() => {
    if (user?.id) registerPushToken(user.id);
  }, [user?.id]);

  // Message-notification behavior: suppress foreground banners (in-app update +
  // tab dot handle it), and route notification taps to the private-space thread.
  useEffect(() => {
    configureNotifications();
    const unsubscribe = addPushResponseListener((spaceId) => {
      const navReady = navKeyRef.current != null;
      const userResolved = userIdRef.current != null;
      if (__DEV__) {
        console.log(
          `[push-dl] ${Date.now()} handler spaceId=${spaceId} navKey=${navKeyRef.current} userId=${userIdRef.current}`,
        );
      }
      if (!navReady || !userResolved) {
        // Nav tree not hydrated yet, or the user hasn't cleared the auth gate —
        // hold the link instead of navigating. AppGate replays it once it lands
        // the user on the tabs (authenticated + onboarded branch only).
        if (__DEV__) console.log(`[push-dl] ${Date.now()} holding pending spaceId=${spaceId} (navReady=${navReady} userResolved=${userResolved})`);
        setPendingSpaceDeepLink(spaceId);
        return;
      }
      router.push({ pathname: '/(app)/private-space', params: { spaceId } } as any);
    });
    return unsubscribe;
  }, [router]);

  // Identify user in Sentry (ID only — no PII)
  useEffect(() => {
    if (user?.id) {
      identifySentryUser(user.id);
    } else {
      clearSentryUser();
    }
  }, [user?.id]);

  // Sync Supabase user ID with AppsFlyer for cross-channel attribution
  useEffect(() => {
    if (user?.id) {
      setAppsFlyerUserId(user.id);
    } else {
      clearAppsFlyerUserId();
    }
  }, [user?.id]);

  // Sync Supabase user ID with Meta SDK for advanced matching
  useEffect(() => {
    if (user?.id) {
      setFacebookUserId(user.id);
    } else {
      clearFacebookUserId();
    }
  }, [user?.id]);

  // Identify user in Mixpanel
  useEffect(() => {
    if (user?.id) {
      identifyMixpanelUser(user.id);
    } else {
      resetMixpanelIdentity();
    }
  }, [user?.id]);

  // Sync is_pro super property whenever entitlements change
  useEffect(() => {
    setSuperPropertyIsPro(isPro);
  }, [isPro]);

  // Track app_opened on mount with retention signals
  useEffect(() => {
    const now = Date.now();
    const installTs = Prefs.getInt('install_timestamp');
    if (!installTs) {
      Prefs.setInt('install_timestamp', now);
    }
    const daysSinceInstall = installTs
      ? Math.floor((now - installTs) / (1000 * 60 * 60 * 24))
      : 0;

    const sessionCount = (Prefs.getInt('total_session_count') ?? 0) + 1;
    Prefs.setInt('total_session_count', sessionCount);
    const isReturnVisit = sessionCount > 1;

    trackMixpanelAppOpened({ days_since_install: daysSinceInstall, session_count: sessionCount, is_return_visit: isReturnVisit });
  }, []);

  return (
    <UnreadProvider>
    <Stack screenOptions={{ headerShown: false }}>
      {/* Gate screen — initial route, shows splash and redirects */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="account" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen
        name="onboarding"
        options={{
          animation: 'fade',
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      {/* ── re:sense product screens (UI shell) ───────────────────────────── */}
      <Stack.Screen name="reply-composer"    options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="resonance-unlock"  options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="private-space"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="reveal"            options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="check-in"          options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
    </UnreadProvider>
  );
}
