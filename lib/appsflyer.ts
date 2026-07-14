/**
 * lib/appsflyer.ts — AppsFlyer SDK wrapper
 *
 * Handles:
 *   - SDK initialization (iOS + Android)
 *   - Install attribution data capture
 *   - OneLink / deep link handling
 *
 * Usage:
 *   1. Call initAppsFlyer() once on app mount (in app/(app)/_layout.tsx)
 *   2. Pass an onDeepLink handler to route users to the right screen
 *   3. Attribution data is logged in DEV and forwarded to Mixpanel
 *
 * Dashboard note:
 *   - Production events appear in the main AF dashboard
 *   - Debug/dev builds send to a SEPARATE debug feed — never visible in the
 *     production Events page. Always test with a production/release build.
 */

import { Platform } from 'react-native';
import { trackMixpanelInstallAttributed } from '@/lib/mixpanel';

// Dev key + app IDs are set in .env.local — no hardcoded fallbacks (keyless-boot:
// a blank .env.local must no-op AppsFlyer, never send events with stale credentials).
const DEV_KEY = process.env.EXPO_PUBLIC_AF_DEV_KEY ?? '';
const IOS_APP_ID     = process.env.EXPO_PUBLIC_AF_IOS_APP_ID ?? '';     // App Store numeric ID
const ANDROID_APP_ID = process.env.EXPO_PUBLIC_AF_ANDROID_APP_ID ?? ''; // Google Play package name

// Lazy-load native module — crashes in Expo Go since it requires a native build.
// The SDK uses `export default` (ES module) — Metro resolves this correctly when
// imported via `require`, but the default export may be nested under `.default`
// OR be the module itself depending on Metro's interop. We handle both.
let appsflyer: any = null;
try {
  const mod = require('react-native-appsflyer');
  // Metro ESM interop: default export may be at .default or at the root
  appsflyer = mod?.default ?? mod;
  // Sanity-check: must have initSdk method
  if (typeof appsflyer?.initSdk !== 'function') {
    appsflyer = null;
    if (__DEV__) console.warn('[AppsFlyer] Module loaded but initSdk not found — check react-native-appsflyer version');
  } else {
    if (__DEV__) console.log('[AppsFlyer] module loaded successfully ✓');
  }
} catch (e: any) {
  console.warn('[AppsFlyer] require failed:', e?.message ?? e);
  appsflyer = null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AFDeepLinkResult {
  deepLinkStatus: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  scheme?: string;
  host?: string;
  path?: string;
  parameters?: Record<string, string>;
  /** Raw AppsFlyer deep link data */
  data?: Record<string, any>;
}

export type DeepLinkHandler = (result: AFDeepLinkResult) => void;

// ─── Initialize ───────────────────────────────────────────────────────────────

/**
 * Initialize the AppsFlyer SDK.
 * Call once on app mount — before any navigation or user identification.
 *
 * @param onDeepLink - Optional handler called whenever a OneLink / deep link is resolved.
 *                     Use this to navigate users to the correct in-app screen.
 */
export function initAppsFlyer(onDeepLink?: DeepLinkHandler): void {
  console.log('[AppsFlyer] initAppsFlyer called | platform:', Platform.OS, '| module ready:', !!appsflyer);

  // Keyless-boot guard (mirror lib/sentry.ts): no dev key → no-op, don't init.
  if (!DEV_KEY) {
    if (__DEV__) console.warn('[AppsFlyer] No dev key found — attribution disabled. Add EXPO_PUBLIC_AF_DEV_KEY to .env.local');
    return;
  }

  if (!appsflyer) {
    console.warn('[AppsFlyer] Native module not available — make sure you ran: npx expo run:ios (not Expo Go)');
    return;
  }

  // Register deep link listener BEFORE init so no link events are missed
  if (onDeepLink) {
    appsflyer.onDeepLink((res: any) => {
      if (__DEV__) console.log('[AppsFlyer] Deep link:', JSON.stringify(res, null, 2));

      const result: AFDeepLinkResult = {
        deepLinkStatus: res.deepLinkStatus ?? 'NOT_FOUND',
        data: res.data,
      };

      // Parse scheme/host/path from deep_link_value if present
      const dlValue: string | undefined = res.data?.deep_link_value;
      if (dlValue) {
        try {
          const url = new URL(dlValue);
          result.scheme = url.protocol.replace(':', '');
          result.host = url.hostname;
          result.path = url.pathname;
          const params: Record<string, string> = {};
          url.searchParams.forEach((value, key) => { params[key] = value; });
          result.parameters = params;
        } catch {
          // Not a full URL — treat as a path/slug directly
          result.path = dlValue;
        }
      }

      onDeepLink(result);
    });
  }

  // Register conversion data listener BEFORE initSdk
  appsflyer.onInstallConversionData((res: any) => {
    if (__DEV__) console.log('[AppsFlyer] Conversion data:', JSON.stringify(res, null, 2));

    // SDK wraps data: { status: "success", type: "onInstallConversionDataLoaded", data: {...} }
    const data = res?.data ?? res ?? {};
    const isFirstLaunch = data.is_first_launch === true || data.is_first_launch === 'true';

    if (!isFirstLaunch) return; // Only care about fresh installs

    const status: string = data.af_status ?? 'Organic';
    const mediaSource: string = data.media_source ?? 'organic';
    const campaign: string = data.campaign ?? '';
    const adSet: string = data.adset ?? '';

    trackMixpanelInstallAttributed({
      af_status: status,
      media_source: mediaSource,
      campaign,
      adset: adSet,
    });

    if (__DEV__) {
      console.log(`[AppsFlyer] Install attributed: ${status} | source: ${mediaSource} | campaign: ${campaign}`);
    }
  });

  // Log conversion failures in DEV
  appsflyer.onInstallConversionFailure?.((err: any) => {
    if (__DEV__) console.warn('[AppsFlyer] Conversion failure:', JSON.stringify(err, null, 2));
  });

  // Init SDK — promise form so we don't need to handle success/error callbacks
  //
  // isDebug: __DEV__ — dev builds get verbose SDK logging + events surface in
  // the AppsFlyer SDK Integration Test tool (hq1.appsflyer.com → register your
  // test device → Integration Tests). Debug-mode events go to a SEPARATE feed
  // and never appear on the main production Events page. Release/TestFlight
  // builds (__DEV__ false) report to the live dashboard.
  //
  // timeToWaitForATTUserAuthorization: On iOS, set to 60 so the SDK waits for
  // the ATT dialog to resolve before sending the first launch event. Setting to
  // 0 means it fires before ATT resolves, and Apple/AF may silently drop the
  // first-open event on devices with undetermined tracking status.
  appsflyer.initSdk({
    devKey: DEV_KEY,
    isDebug: __DEV__,
    appId: Platform.OS === 'android' ? ANDROID_APP_ID : IOS_APP_ID,
    onInstallConversionDataListener: true,   // enables onInstallConversionData callbacks
    onDeepLinkListener: true,                // enables onDeepLink callbacks
    timeToWaitForATTUserAuthorization: 60,   // wait up to 60s for ATT dialog — prevents first-open event loss on iOS
  })
    .then((result: any) => {
      if (__DEV__) console.log('[AppsFlyer] SDK initialized ✓', result);
    })
    .catch((error: any) => {
      if (__DEV__) console.warn('[AppsFlyer] SDK init error:', error);
    });
}

/**
 * Get the AppsFlyer device UID. Needed to link RevenueCat → AppsFlyer so RC can
 * forward server-validated purchases/renewals to AppsFlyer (and onward to Meta/
 * Google/ASA partner configs). Resolves null if the SDK isn't ready.
 */
export function getAppsFlyerId(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof appsflyer?.getAppsFlyerUID !== 'function') return resolve(null);
    try {
      appsflyer.getAppsFlyerUID((err: any, uid: string) => resolve(err ? null : (uid || null)));
    } catch {
      resolve(null);
    }
  });
}

// ─── User identification ──────────────────────────────────────────────────────

/**
 * Associate the AppsFlyer device record with your Supabase user ID.
 * Call after successful sign-in / sign-up.
 */
export function setAppsFlyerUserId(userId: string): void {
  if (!appsflyer) return;
  appsflyer.setCustomerUserId(userId, (res: any) => {
    if (__DEV__) console.log('[AppsFlyer] Customer user ID set:', res);
  });
}

/**
 * Clear the customer user ID on sign-out.
 */
export function clearAppsFlyerUserId(): void {
  if (!appsflyer) return;
  appsflyer.setCustomerUserId('', () => {});
}

// ─── Event catalog ──────────────────────────────────────────────────────────
//
// Categorised AppsFlyer events. `af_*` are AppsFlyer PREDEFINED names — they map
// automatically to ad-platform conversion events (Meta / Google / TikTok), so
// prefer them for funnel/ROAS events. Custom events use snake_case.
//
// EASY TO TEST (no purchase needed) = the ENGAGEMENT group: just tap around the
// app and watch them stream into the SDK Integration Test tool.
export const AFEvent = {
  // ── Activation ──
  REGISTRATION:        'af_complete_registration', // account created / signed up
  ONBOARDING_DONE:     'onboarding_complete',       // finished onboarding
  FIRST_REPLY:         'first_reply_generated',     // first-ever reply = the "aha"

  // ── Engagement (no $ — easiest to test) ──
  SCREENSHOT_UPLOADED: 'screenshot_uploaded',
  REPLY_GENERATED:     'reply_generated',
  REPLY_COPIED:        'reply_copied',
  GENERATE_MORE:       'generate_more',

  // ── Auth ──
  LOGIN:               'af_login',                  // successful sign-in (email/google/apple)

  // ── Monetization (drives influencer ROAS) ──
  PAYWALL_VIEWED:      'paywall_viewed',            // already fired in paywall.tsx
  CHECKOUT_INITIATED:  'af_initiated_checkout',     // tapped a plan / subscribe
  ADD_PAYMENT_INFO:    'af_add_payment_info',       // user enters purchase sheet (before billing)
  TRIAL_STARTED:       'af_start_trial',            // free trial began
  SUBSCRIBE_INITIATED: 'af_subscribe',              // subscription flow started — Google: no revenue (see partner config)
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed', // actual billing confirmed — Google: in_app_purchase + revenue
} as const;

// ─── Event logging ────────────────────────────────────────────────────────────

/**
 * Log a custom in-app event to AppsFlyer.
 * Use for purchase, subscription, and key conversion events.
 */
export function logAppsFlyerEvent(eventName: string, eventValues: Record<string, any> = {}): void {
  if (!appsflyer) return;
  appsflyer.logEvent(eventName, eventValues)
    .then(() => { if (__DEV__) console.log('[AppsFlyer] Event logged:', eventName); })
    .catch((e: any) => { if (__DEV__) console.warn('[AppsFlyer] Event log failed:', eventName, e); });
}
