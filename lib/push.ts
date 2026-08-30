/**
 * Push registration — Expo push tokens for message notifications.
 *
 * Registers the device's Expo push token and stores it in Supabase `push_tokens`.
 * A DB trigger (migration 011) sends a push to the other space member on each new
 * message via Expo's push service.
 *
 * Defensive by design: `expo-notifications` is a native module, so we dynamic-
 * require it — a build without the module (or web) simply no-ops instead of
 * crashing. Requires a real EAS projectId (getExpoPushTokenAsync) and the app
 * rebuilt with expo-notifications; until then this is a safe no-op.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import { Prefs } from '@/store/mmkv';
import { extractSpaceId } from '@/lib/pushDeepLink';

const PUSH_OPT_OUT_KEY = 'push_opted_out';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null; // native module absent in this build — no-op
}

function resolveProjectId(): string | null {
  const id =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants?.expoConfig?.extra as any)?.eas?.projectId ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants as any)?.easConfig?.projectId ??
    null;
  return id && id !== 'REPLACE_ME' ? id : null;
}

/**
 * Configure how notifications behave while the app is FOREGROUNDED.
 * Product decision: no OS banner when the app is open — the live in-app update +
 * tab dot already surface the message. We still let the badge update. Call once.
 */
export function configureNotifications(): void {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    if (__DEV__) console.warn('[push] configureNotifications failed', e);
  }
}

/** Set the app-icon badge (presence model: pass 1 for "has unread", 0 for none). */
export async function setAppBadge(count: number): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch (e) {
    if (__DEV__) console.warn('[push] setAppBadge failed', e);
  }
}

/**
 * Deep-link on notification tap. Fires the handler with the `spaceId` from the
 * push `data` payload — both for taps while running and for a cold start launched
 * from a notification. Returns an unsubscribe fn.
 */
export function addPushResponseListener(
  handler: (spaceId: string) => void,
): () => void {
  if (!Notifications) return () => {};
  try {
    // Cold start: app opened by tapping a notification.
    if (__DEV__) console.log(`[push-dl] ${Date.now()} registering getLastNotificationResponseAsync`);
    Notifications.getLastNotificationResponseAsync?.().then((resp: unknown) => {
      if (__DEV__) {
        console.log(`[push-dl] ${Date.now()} getLastNotificationResponseAsync resolved`, JSON.stringify(resp));
      }
      const spaceId = extractSpaceId(resp);
      if (spaceId) handler(spaceId);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((resp: unknown) => {
      if (__DEV__) {
        console.log(`[push-dl] ${Date.now()} addNotificationResponseReceivedListener fired`, JSON.stringify(resp));
      }
      const spaceId = extractSpaceId(resp);
      if (spaceId) handler(spaceId);
    });
    return () => { try { sub?.remove?.(); } catch { /* non-fatal */ } };
  } catch (e) {
    if (__DEV__) console.warn('[push] addPushResponseListener failed', e);
    return () => {};
  }
}

// ─── Notification preferences ────────────────────────────────────────────
// User-facing opt-in/opt-out toggle in profile.tsx. Distinct from the OS-level
// permission prompt: a user can have OS permission granted but still choose to
// opt out here, in which case we drop their token so no push is attempted.

/** Whether the device currently has OS-level notification permission. */
export async function hasPushPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Prompt the OS permission dialog. Returns true if granted. */
export async function requestPushPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** In-app opt-in state (defaults to opted-in; explicit opt-out is sticky). */
export function isPushOptedIn(): boolean {
  return !Prefs.getBool(PUSH_OPT_OUT_KEY, false);
}

/** User opted in via the profile toggle — register their Expo push token. */
export async function optInPush(userId: string): Promise<void> {
  Prefs.setBool(PUSH_OPT_OUT_KEY, false);
  await registerPushToken(userId);
}

/** User opted out — remember the choice and drop their token so pushes stop. */
export async function optOutPush(userId: string): Promise<void> {
  Prefs.setBool(PUSH_OPT_OUT_KEY, true);
  try {
    await supabase.from('push_tokens').delete().eq('user_id', userId);
  } catch (e) {
    if (__DEV__) console.warn('[push] optOutPush failed to clear token', e);
  }
}

/** Request permission, get the Expo push token, and upsert it for this user. */
export async function registerPushToken(userId: string): Promise<void> {
  if (!Notifications || Platform.OS === 'web' || !userId) return;
  try {
    const perms = await Notifications.getPermissionsAsync();
    let status = perms.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const projectId = resolveProjectId();
    if (!projectId) return; // EAS projectId not configured yet

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );
  } catch (e) {
    if (__DEV__) console.warn('[push] registerPushToken failed', e);
  }
}
