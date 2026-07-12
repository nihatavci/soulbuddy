/**
 * useAccountDeletion — shared deletion hook used by Profile and Account screens.
 *
 * Apple guideline 5.1.1(v) requires permanent account deletion (not just
 * deactivation). For authenticated users we:
 *   1. Clean up app DB rows (FK order: messages → conversation_sessions →
 *      mood_entries → love_maps → profiles).
 *   2. POST to the `delete-user` Edge Function which removes the auth.users row
 *      via the service-role admin API.
 *   3. Best-effort RC logout (swallow errors — RC may not be initialized).
 *   4. Clear local prefs and signOut.
 *
 * For anonymous users there is no server account; we only clear local state
 * and signOut, which routes back through AppGate to a fresh onboarding.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { logoutRevenueCat } from '@/lib/revenuecat';
import { Prefs } from '@/store/mmkv';

export function useAccountDeletion() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, signOut, isAnonymous } = useAuth();

  const [loading, setLoading] = useState(false);

  const performDelete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      if (isAnonymous) {
        // Local-only reset. No server account exists for anonymous users.
        Prefs.remove('onboarding_v3_complete');
        await signOut();
        router.replace('/(app)/' as any);
        return;
      }

      const uid = user?.id;
      if (!uid) {
        throw new Error('no_user');
      }

      // 1. Clean up app DB rows in FK order (children before parents).
      const sessions = await supabase
        .from('conversation_sessions')
        .select('id')
        .eq('user_id', uid);
      const sessionIds = (sessions.data ?? []).map((s: { id: string }) => s.id);

      if (sessionIds.length > 0) {
        await supabase.from('messages').delete().in('session_id', sessionIds);
      }
      await supabase.from('conversation_sessions').delete().eq('user_id', uid);
      await supabase.from('mood_entries').delete().eq('user_id', uid);
      await supabase.from('love_maps').delete().eq('user_id', uid);
      await supabase.from('profiles').delete().eq('user_id', uid);

      // 2. Permanently delete auth.users via Edge Function.
      // Fetch the live session directly — AuthContext's mapped session only
      // exposes `token` and may be stale if a refresh happened mid-flow.
      const { data: { session: liveSession } } = await supabase.auth.getSession();
      const accessToken = liveSession?.access_token;
      if (!accessToken) {
        throw new Error('no_session');
      }
      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const fnUrl = `${baseUrl}/functions/v1/delete-user`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`delete-user failed: ${res.status}`);
      }

      // 3. Best-effort RC logout (anon users may not have an RC session).
      try {
        await logoutRevenueCat();
      } catch {
        // ignore — RC not critical for deletion
      }

      // 4. Local cleanup + sign out → AppGate re-routes to onboarding.
      Prefs.remove('onboarding_v3_complete');
      await signOut();
      router.replace('/(app)/' as any);
    } catch (err: any) {
      const fallback = t('account.deleteFailed');
      Alert.alert('Error', err?.message ? `${fallback}` : fallback);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t('account.deleteConfirmTitle'),
      t('account.deleteConfirmBody'),
      [
        { text: t('account.deleteCancel'), style: 'cancel' },
        {
          text: t('account.deleteCta'),
          style: 'destructive',
          onPress: () => {
            void performDelete();
          },
        },
      ],
    );
  };

  return { loading, confirmDelete };
}
