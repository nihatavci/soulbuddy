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
