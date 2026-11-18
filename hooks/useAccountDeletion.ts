/**
 * useAccountDeletion — shared deletion hook used by Profile and Account screens.
 *
 * Apple guideline 5.1.1(v) requires permanent account deletion (not just
 * deactivation). On Terra the sign-in (`auth.users`) is SHARED with other apps, so we:
 *   1. Call `resense.delete_my_account()`, which deletes this user's re:sense data and
 *      leaves the app in the portfolio registry. The shared sign-in row is removed only when
 *      re:sense was the last app they used; otherwise it stays for Pauci / ReCurate.
 *   2. Best-effort RevenueCat logout (swallow errors — RC may not be initialized).
 *   3. signOut → AppGate re-routes to sign-in.
 *
 * NOTE: never call an admin deleteUser here — it would delete the person's other Terra apps too.
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

      const { error } = await supabase.rpc('delete_my_account');
      if (error) {
        throw new Error(`delete_my_account failed: ${error.message}`);
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
