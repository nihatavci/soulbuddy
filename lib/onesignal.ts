/**
 * lib/onesignal.ts — OneSignal Push Notifications
 *
 * Wraps the OneSignal React Native SDK.
 * Privacy-first: never sends mood, journal, or health data as tags or payloads.
 *
 * Setup (one-time):
 *  1. Create a OneSignal app at https://onesignal.com
 *  2. Add your App ID to .env.local as EXPO_PUBLIC_ONESIGNAL_APP_ID
 *  3. Add onesignal-expo-plugin to app.json plugins
 *  4. Run: npm install react-native-onesignal onesignal-expo-plugin
 */

import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Lazy-load native module — top-level import crashes in Expo Go because
// react-native-onesignal requires a native build (dev build or production).
const OSModule = IS_EXPO_GO ? null : (() => {
  try { return require('react-native-onesignal'); } catch { return null; }
})();
const OneSignal = OSModule?.OneSignal ?? null;
const LogLevel   = OSModule?.LogLevel   ?? null;

// ─── Initialize ──────────────────────────────────────────────────────────────
// Call once in app/(app)/_layout.tsx on mount.
// Must happen before any other OneSignal calls.

export function initOneSignal(): void {
  if (!OneSignal) {
    if (__DEV__) console.log('[OneSignal] Expo Go — push notifications disabled. Use a dev build or production build.');
    return;
  }

  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '';

  if (!appId) {
    if (__DEV__) console.warn('[OneSignal] No App ID found — push notifications disabled. Add EXPO_PUBLIC_ONESIGNAL_APP_ID to .env.local');
    return;
  }

  try {
    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }
    OneSignal.initialize(appId);
  } catch (e) {
    if (__DEV__) console.warn('[OneSignal] Initialization failed:', e);
  }
}

// ─── Permission ──────────────────────────────────────────────────────────────
// Request push notification permission from the user.
// Per CLAUDE.md: "Push notifications must have opt-out flows — never send
// without explicit permission."
//
// Returns true if permission was granted, false otherwise.

export async function requestPushPermission(): Promise<boolean> {
  if (!OneSignal) return false;
  const granted = await OneSignal.Notifications.requestPermission(true);
  return granted;
}

/**
 * Check if the user has already granted push notification permission.
 */
export function hasPushPermission(): boolean {
  if (!OneSignal) return false;
  return OneSignal.Notifications.hasPermission();
}

// ─── User registration ──────────────────────────────────────────────────────
// Ties the OneSignal player to the Clerk user ID so push notifications
// can be targeted per-account across devices.

export function registerPushUser(userId: string): void {
  if (!OneSignal) return;
  OneSignal.login(userId);
}

export function unregisterPushUser(): void {
  if (!OneSignal) return;
  OneSignal.logout();
}

// ─── Tags / Segments ────────────────────────────────────────────────────────
// Tags allow OneSignal segments to target groups of users.
// PRIVACY: Never include mood text, journal entries, therapy content, or
// any health data as tag values.

const ALLOWED_TAGS = ['is_pro', 'trial_status', 'language', 'couple_connected', 'app_version'] as const;
type AllowedTag = typeof ALLOWED_TAGS[number];

/** Pure: keep only known-safe tags with defined values. Exported for testing. */
export function filterAllowedTags(tags: Partial<Record<AllowedTag, string | undefined>>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const key of ALLOWED_TAGS) {
    const v = tags[key];
    if (v !== undefined) safe[key] = v;
  }
  return safe;
}

export function setNotificationTags(tags: Partial<Record<AllowedTag, string>>): void {
  if (!OneSignal) return;
  OneSignal.User.addTags(filterAllowedTags(tags));
}

export function removeNotificationTag(key: AllowedTag): void {
  if (!OneSignal) return;
  OneSignal.User.removeTag(key);
}

// ─── Opt-in / Opt-out ───────────────────────────────────────────────────────
// User-facing controls for the notification preferences toggle in profile.
// These control whether OneSignal can deliver pushes to this device.

export function optInPush(): void {
  if (!OneSignal) return;
  OneSignal.User.pushSubscription.optIn();
}

export function optOutPush(): void {
  if (!OneSignal) return;
  OneSignal.User.pushSubscription.optOut();
}

/**
 * Check if the user is currently opted into push notifications.
 */
export function isPushOptedIn(): boolean {
  if (!OneSignal) return false;
  return OneSignal.User.pushSubscription.getOptedIn();
}

// ─── Notification event listeners ────────────────────────────────────────────
// These should be set up once in app/(app)/_layout.tsx.

type NotificationClickHandler = (notification: any) => void;

/**
 * Register a handler that fires when the user taps a notification.
 * Use this for deep linking to specific screens.
 */
export function onNotificationClicked(handler: NotificationClickHandler): void {
  if (!OneSignal) return;
  OneSignal.Notifications.addEventListener('click', (event: any) => {
    handler(event.notification);
  });
}

/**
 * Fire a real OneSignal push to the current user's device via the Cloudflare Worker.
 * Proves end-to-end delivery is working. Call after opt-in with a short delay
 * so OneSignal can register the subscription before the push is sent.
 */
export async function sendTestPushNotification(userId: string): Promise<void> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL ?? '';
  if (!workerUrl || !userId) return;

  try {
    // Dynamic import so this import path doesn't pull supabase into onesignal module
    const { supabase } = await import('@/services/supabase');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    await fetch(`${workerUrl}/api/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch {
    // Non-blocking — test push failure doesn't affect opt-in flow
  }
}

/**
 * Register a handler that fires when a notification is received in the foreground.
 * Return true to display it, false to suppress.
 */
export function onForegroundNotification(
  handler: (notification: any) => boolean,
): void {
  if (!OneSignal) return;
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
    const shouldDisplay = handler(event.getNotification());
    if (!shouldDisplay) {
      event.preventDefault();
    }
  });
}
