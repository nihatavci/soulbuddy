/**
 * Reset Password screen
 *
 * Supabase password reset flow:
 * 1. User clicks the reset link in their email (sent by forgot-password.tsx)
 * 2. The deep link (myapp://reset-password) opens this screen
 * 3. Supabase fires a PASSWORD_RECOVERY auth state change event
 * 4. User enters new password, we call supabase.auth.updateUser({ password })
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { AppColors, Typography } from '@/constants/theme';
import { Space, Relation } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { useT } from '@/context/LanguageContext';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const t = useT();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showNew, setShowNew]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [passFocused,    setPassFocused]    = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, _session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryReady(true);
        }
      },
    );

    // Also check if we already have a session (user may have already clicked link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setRecoveryReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError(t('auth.resetPassword.errors.passwordTooShort'));
      return;
    }
    if (newPassword !== confirm) {
      setError(t('auth.resetPassword.errors.passwordsMismatch'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setError(err?.message ?? t('auth.resetPassword.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // If no recovery event yet and no session, show waiting state
  if (!recoveryReady && !done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.logo}>myapp</Text>
          <View style={styles.card}>
            <Text style={styles.title}>{t('auth.resetPassword.waitingTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.resetPassword.waitingSubtitle', {
                emailSuffix: email ? t('auth.resetPassword.waitingEmailSuffix', { email }) : '',
              })}
            </Text>
            <Button
              label={t('auth.resetPassword.backToForgot')}
              variant="primary"
              size="lg"
              onPress={() => router.replace('/(auth)/forgot-password')}
              style={styles.btnOverride}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>myapp</Text>
        </View>

        <View style={styles.card}>
          {!done ? (
            <>
              <Text style={styles.title}>{t('auth.resetPassword.newPasswordTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.resetPassword.newPasswordSubtitle')}
                {email ? <Text style={styles.emailHighlight}> ({email})</Text> : ''}.
              </Text>

              {/* New password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.resetPassword.newPasswordLabel')}</Text>
                <AnimatedInputWrapper focused={passFocused} style={[styles.input, styles.inputRow]}>
                  <TextInput
                    style={[styles.inputInner, styles.inputFlex]}
                    placeholder={t('auth.resetPassword.passwordPlaceholder')}
                    placeholderTextColor={AppColors.textSecondary}
                    value={newPassword}
                    onChangeText={t => { setNewPassword(t); setError(null); }}
                    secureTextEntry={!showNew}
                    returnKeyType="next"
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    editable={!loading}
                    autoFocus
                  />
                  <Pressable onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                    <Feather name={showNew ? 'eye-off' : 'eye'} size={18} color={AppColors.textSecondary} />
                  </Pressable>
                </AnimatedInputWrapper>
              </View>

              {/* Confirm */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.resetPassword.confirmPasswordLabel')}</Text>
                <AnimatedInputWrapper focused={confirmFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder="••••••••"
                    placeholderTextColor={AppColors.textSecondary}
                    value={confirm}
                    onChangeText={t => { setConfirm(t); setError(null); }}
                    secureTextEntry={!showNew}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    editable={!loading}
                  />
                </AnimatedInputWrapper>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                label={t('auth.resetPassword.setButton')}
                variant="primary"
                size="lg"
                onPress={handleReset}
                disabled={loading}
                loading={loading}
                style={styles.btnOverride}
              />
            </>
          ) : (
            <>
              <Text style={styles.iconSuccess}>✓</Text>
              <Text style={styles.title}>{t('auth.resetPassword.doneTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.resetPassword.doneSubtitle')}
              </Text>
              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                onPress={() => router.replace('/(app)' as any)}
                style={styles.btnOverride}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: AppColors.background },
  kav:     { flex: 1, justifyContent: 'center', paddingHorizontal: Space.lg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Space.lg },
  // Logo ↔ card: weak(26)
  header:  { alignItems: 'center', marginBottom: Relation.weak },
  logo: { fontFamily: Typography.fonts.heading, fontSize: 28, color: AppColors.text, letterSpacing: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: Space.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 4, width: '100%',
  },
  iconSuccess: { fontSize: 40, color: '#4CAF50', marginBottom: Space.xs, textAlign: 'center' },
  // Title ↔ Subtitle: strong(6) | Subtitle ↔ field: weak(26)
  title: { fontFamily: Typography.fonts.heading, fontSize: 22, color: AppColors.text, marginBottom: Relation.strong },
  subtitle: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary, marginBottom: Relation.weak, lineHeight: 21 },
  emailHighlight: { fontFamily: Typography.fonts.heading, color: AppColors.text },
  // Field ↔ Field: medium(16) | Label ↔ Input: strong(6)
  fieldGroup: { marginBottom: Space.md },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    marginBottom: Space.xs, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    backgroundColor: AppColors.background, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text, letterSpacing: 0,
  },
  inputFlex: { flex: 1 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  errorBox: {
    backgroundColor: 'rgba(232,93,86,0.1)', borderRadius: Space.sm, padding: Space.sm + 2,
    marginBottom: Space.sm + 2, borderWidth: 1, borderColor: 'rgba(232,93,86,0.25)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.accent },
  // Override for Button to match original dark-bg style
  btnOverride: {
    backgroundColor: AppColors.text, borderRadius: 14, marginBottom: Space['2xs'],
  },
});
