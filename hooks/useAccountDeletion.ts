/**
 * useAccountDeletion — shared deletion hook used by Profile and Account screens.
 *
 * Apple guideline 5.1.1(v) requires permanent account deletion (not just
 * deactivation). For re:sense we:
 *   1. POST to the `delete-user` Edge Function, which removes the auth.users row
 *      via the service-role admin API. Deleting auth.users cascades to the
 *      `public.profiles` row (FK `on delete cascade`), so there is no separate
 *      table cleanup — re:sense stores no per-user rows outside `profiles` in v1.
 *   2. Best-effort RevenueCat logout (swallow errors — RC may not be initialized).
 *   3. signOut → AppGate re-routes to sign-in.
 *
 * NOTE: re:sense has no anonymous sessions (removed in Phase 1), so there is no
 * local-only reset path. If later phases add user-owned tables outside profiles,
 * the delete-user Edge Function (service role) is where that cleanup belongs.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { logoutRevenueCat } from '@/lib/revenuecat';

export function useAccountDeletion() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  const performDelete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      const uid = user?.id;
      if (!uid) {
        throw new Error('no_user');
      }

      // Permanently delete auth.users via Edge Function (cascades to profiles).
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

      // Best-effort RC logout (RC may not be initialized in keyless builds).
      try {
        await logoutRevenueCat();
      } catch {
        // ignore — RC not critical for deletion
      }

      // Sign out → AppGate re-routes to sign-in.
      await signOut();
      router.replace('/(app)/' as any);
    } catch {
      Alert.alert('Error', t('account.deleteFailed'));
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
