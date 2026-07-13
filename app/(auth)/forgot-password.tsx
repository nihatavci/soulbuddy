/**
 * Forgot Password screen
 *
 * Sends a password reset email via Supabase Auth.
 * The email contains a magic link that redirects to myapp://reset-password.
 */

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { Space, Relation } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { useT } from '@/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const t = useT();

  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError(t('auth.forgotPassword.errors.emailRequired'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'myapp://reset-password' },
      );

      if (resetError) {
        // Don't reveal whether the email exists (T-16-06)
        setError(t('auth.forgotPassword.errors.generic'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate to reset screen
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch {
      // Don't reveal whether the email exists
      setError(t('auth.forgotPassword.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={320} top={-130} right={-150} opacity={0.4} />
      <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back */}
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t('auth.forgotPassword.back')}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.logo}>myapp</Text>
        </View>

        <View style={styles.card}>
          {!sent ? (
            <>
              <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.forgotPassword.subtitle')}
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signIn.emailLabel')}</Text>
                <AnimatedInputWrapper focused={emailFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    placeholderTextColor={AppColors.textSecondary}
                    value={email}
                    onChangeText={t => { setEmail(t); setError(null); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!loading}
                    autoFocus
                  />
                </AnimatedInputWrapper>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                label={t('auth.forgotPassword.sendButton')}
                variant="primary"
                size="lg"
                onPress={handleSend}
                disabled={loading}
                loading={loading}
                style={styles.btnOverride}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('auth.forgotPassword.sentTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.forgotPassword.sentSubtitle')}
              </Text>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('auth.forgotPassword.rememberIt')} </Text>
            <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.switchLink}>{t('auth.signUp.signInLink')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  kav:   { flex: 1, justifyContent: 'center', paddingHorizontal: Space.lg },
  back:  { position: 'absolute', top: Space.md, left: 0, padding: Space.xs + 2 },
  backText: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary },
  // Logo ↔ card: weak(26)
  header: { alignItems: 'center', marginBottom: Relation.weak },
  logo: { fontFamily: Typography.fonts.heading, fontSize: 28, color: AppColors.text, letterSpacing: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: Space.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 4,
  },
  // Title ↔ Subtitle: strong(6) | Subtitle ↔ field: weak(26)
  title: { fontFamily: Typography.fonts.heading, fontSize: 22, color: AppColors.text, marginBottom: Relation.strong },
  subtitle: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary, marginBottom: Relation.weak, lineHeight: 21 },
  // Field ↔ Field: medium(16) | Label ↔ Input: strong(6)
  fieldGroup: { marginBottom: Space.md },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    marginBottom: Space.xs, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppColors.background, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text, letterSpacing: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(232,93,86,0.1)', borderRadius: Space.sm, padding: Space.sm + 2,
    marginBottom: Space.sm + 2, borderWidth: 1, borderColor: 'rgba(232,93,86,0.25)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.accent },
  // Override for Button to match original dark-bg style
  btnOverride: {
    backgroundColor: AppColors.text, borderRadius: 14, marginBottom: Space.md,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchLabel: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary },
  switchLink: {
    fontFamily: Typography.fonts.heading, fontSize: 13,
    color: AppColors.text, textDecorationLine: 'underline',
  },
});
