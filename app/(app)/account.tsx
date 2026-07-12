/**
 * Account & Security screen
 *
 * - Change password (Supabase Auth)
 * - Sign out
 * - Delete account (with confirmation)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { AppColors, Typography } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import { useT } from '@/context/LanguageContext';

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const t = useT();

  // ── Change password ─────────────────────────────────────────────────────────
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);
  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused]         = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [pwError, setPwError]         = useState<string | null>(null);
  const [pwSuccess, setPwSuccess]     = useState(false);

  // ── Delete account (shared hook for both Profile and Account screens) ──────
  const { loading: delLoading, confirmDelete: handleDeleteAccount } = useAccountDeletion();

  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPass) { setPwError(t('account.errors.currentRequired')); return; }
    if (newPass.length < 8) { setPwError(t('account.errors.tooShort')); return; }
    if (newPass !== confirmPass) { setPwError(t('account.errors.mismatch')); return; }
    if (newPass === currentPass) { setPwError(t('account.errors.sameAsCurrent')); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPwError(null);
    setPwLoading(true);

    try {
      // Verify current password before allowing change (T-16-09 mitigation)
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPass,
      });
      if (verifyErr) {
        setPwError(t('account.errors.incorrect'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPwLoading(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPass });
      if (updateErr) {
        setPwError(updateErr.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPwLoading(false);
        return;
      }

      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setPwSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: any) {
      const msg = err?.message ?? t('account.errors.changeFailed');
      setPwError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPwLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('account.signOutConfirm.title'),
      t('account.signOutConfirm.body'),
      [
        { text: t('account.signOutConfirm.cancel'), style: 'cancel' },
        {
          text: t('account.signOutConfirm.confirm'),
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
            // Route back through AppGate so it re-evaluates auth/entitlement
            // and redirects into the proper flow (anon -> onboarding/paywall).
            router.replace('/(app)/' as any);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={AppColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('account.passwordSecurity')}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Change Password */}
        <Text style={styles.sectionTitle}>{t('account.changePassword')}</Text>

        <View style={styles.card}>
          {/* Current password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('account.currentPassword')}</Text>
            <AnimatedInputWrapper focused={currentFocused} style={[styles.input, styles.inputRow]}>
              <TextInput
                style={[styles.inputInner, styles.inputFlex]}
                placeholder="••••••••"
                placeholderTextColor={AppColors.textSecondary}
                value={currentPass}
                onChangeText={t => { setCurrentPass(t); setPwError(null); setPwSuccess(false); }}
                secureTextEntry={!showCurrent}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
                editable={!pwLoading}
              />
              <Pressable onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                <Text>{showCurrent ? '🙈' : '👁'}</Text>
              </Pressable>
            </AnimatedInputWrapper>
          </View>

          {/* New password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('account.newPassword')}</Text>
            <AnimatedInputWrapper focused={newFocused} style={[styles.input, styles.inputRow]}>
              <TextInput
                style={[styles.inputInner, styles.inputFlex]}
                placeholder={t('account.newPasswordPlaceholder')}
                placeholderTextColor={AppColors.textSecondary}
                value={newPass}
                onChangeText={t => { setNewPass(t); setPwError(null); setPwSuccess(false); }}
                secureTextEntry={!showNew}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                editable={!pwLoading}
              />
              <Pressable onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                <Text>{showNew ? '🙈' : '👁'}</Text>
              </Pressable>
            </AnimatedInputWrapper>
          </View>

          {/* Confirm */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('account.confirmNewPassword')}</Text>
            <AnimatedInputWrapper focused={confirmFocused} style={styles.input}>
              <TextInput
                style={styles.inputInner}
                placeholder="••••••••"
                placeholderTextColor={AppColors.textSecondary}
                value={confirmPass}
                onChangeText={t => { setConfirmPass(t); setPwError(null); setPwSuccess(false); }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                editable={!pwLoading}
              />
            </AnimatedInputWrapper>
          </View>

          {pwError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{pwError}</Text>
            </View>
          )}

          {pwSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{t('account.passwordChanged')}</Text>
            </View>
          )}

          <Button
            label={t('account.updatePassword')}
            variant="primary"
            size="lg"
            onPress={handleChangePassword}
            disabled={pwLoading}
            loading={pwLoading}
            style={styles.btnOverride}
          />
        </View>

        {/* Session */}
        <Text style={styles.sectionTitle}>{t('account.session')}</Text>

        <View style={[styles.card, styles.signOutCard]}>
          <Pressable style={styles.menuRow} onPress={handleSignOut}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(232,93,86,0.08)' }]}>
                <Ionicons name="log-out-outline" size={18} color="#E85D56" />
              </View>
              <Text style={[styles.menuLabel, styles.menuLabelStrong, { color: '#E85D56' }]}>{t('account.signOut')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(232,93,86,0.45)" />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>{t('account.dangerZone')}</Text>

        <View style={[styles.card, styles.dangerCard]}>
          <Pressable
            style={styles.menuRow}
            onPress={handleDeleteAccount}
            disabled={delLoading}
          >
            <View style={styles.menuRowLeft}>
              {delLoading ? (
                <ActivityIndicator size="small" color="#C0392B" style={{ marginRight: 14 }} />
              ) : (
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(192,57,43,0.12)' }]}>
                  <Ionicons name="trash-outline" size={18} color="#C0392B" />
                </View>
              )}
              <View>
                <Text style={[styles.menuLabel, styles.menuLabelStrong, { color: '#C0392B' }]}>{t('profile.deleteAccount')}</Text>
                <Text style={styles.dangerSubtext}>{t('account.deleteAccountSubtext')}</Text>
              </View>
            </View>
            {!delLoading && <Ionicons name="chevron-forward" size={16} color="rgba(192,57,43,0.5)" />}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: AppColors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.fonts.heading, fontSize: 18, color: AppColors.text },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: Typography.fonts.heading, fontSize: 12, color: AppColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
  },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: AppColors.border,
    marginBottom: 24, padding: 18,
  },
  signOutCard: { padding: 0, borderWidth: 1, borderColor: 'rgba(232,93,86,0.25)' },
  dangerCard: { padding: 0, borderWidth: 1.5, borderColor: 'rgba(192,57,43,0.4)', backgroundColor: 'rgba(192,57,43,0.03)' },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 11, color: AppColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    backgroundColor: AppColors.background, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  inputInner: {
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text,
  },
  inputFlex: { flex: 1 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  errorBox: {
    backgroundColor: 'rgba(232,93,86,0.08)', borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(232,93,86,0.2)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.accent },
  successBox: {
    backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(76,175,80,0.2)',
  },
  successText: { fontFamily: Typography.fonts.body, fontSize: 13, color: '#2e7d32' },
  btnOverride: {
    backgroundColor: AppColors.text, borderRadius: 14, marginTop: 4,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text },
  menuLabelStrong: { fontFamily: Typography.fonts.heading, fontWeight: '700' },
  dangerSubtext: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: 'rgba(232,93,86,0.95)', marginTop: 2,
  },

  // Guest-locked state
  guestLockWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  guestLockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestLockHeadline: {
    fontFamily: Typography.fonts.heading,
    fontSize: 22,
    color: AppColors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  guestLockBody: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 320,
  },
  guestLockCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A0F00',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  guestLockCTAText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
