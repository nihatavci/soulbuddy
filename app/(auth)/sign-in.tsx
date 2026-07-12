/**
 * Sign In — re:sense, email + password only.
 *
 * Google / OTP / magic-link are out of scope for the Phase 1 slice (CONTEXT).
 * Auth logic (supabase.auth.signInWithPassword) + local error state + Haptics
 * feedback are unchanged; onAuthStateChange in AuthContext drives navigation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { AppColors, Typography } from '@/constants/theme';
import { Space, Relation, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { Wordmark } from '@/components/ui/Wordmark';
import { useT } from '@/context/LanguageContext';

export default function SignInScreen() {
  const router = useRouter();
  const t = useT();

  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [showPass, setShowPass]               = useState(false);
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Password sign-in ──────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.signIn.errors.emailAndPassword'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      // On success: onAuthStateChange in AuthContext handles navigation
    } catch (err: any) {
      setError(err?.message ?? t('auth.signIn.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Wordmark size={30} style={styles.wordmark} />
              <Text style={styles.title}>{t('auth.signIn.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signIn.emailLabel')}</Text>
                <AnimatedInputWrapper focused={emailFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    placeholderTextColor={AppColors.textSecondary}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(null); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!loading}
                  />
                </AnimatedInputWrapper>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('auth.signIn.passwordLabel')}</Text>
                  <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={styles.forgotLink}>{t('auth.signIn.forgot')}</Text>
                  </Pressable>
                </View>
                <AnimatedInputWrapper focused={passwordFocused} style={[styles.input, styles.inputRow]}>
                  <TextInput
                    style={[styles.inputInner, styles.inputFlex]}
                    placeholder="••••••••"
                    placeholderTextColor={AppColors.textSecondary}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPass}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={AppColors.textSecondary} />
                  </Pressable>
                </AnimatedInputWrapper>
              </View>

              {/* Error */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Primary CTA */}
              <Button
                label={t('auth.signIn.signInButton')}
                variant="primary"
                size="lg"
                onPress={handleSignIn}
                disabled={loading}
                loading={loading}
                style={styles.cta}
              />

              {/* Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('auth.signIn.noAccount')} </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
                  <Text style={styles.switchLink}>{t('auth.signIn.signUpLink')}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: AppColors.background },
  safe:   { flex: 1, backgroundColor: 'transparent' },
  kav:    { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: ScreenPaddingH, paddingTop: ScreenPaddingTop, paddingBottom: ScreenPaddingBottom },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: Space.lg,
  },
  wordmark: { marginBottom: Space.md },
  title:    { fontFamily: Typography.fonts.heading, fontSize: 24, color: AppColors.text, marginBottom: Relation.strong },
  subtitle: { fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.textSecondary, marginBottom: Space.lg },
  fieldGroup: { marginBottom: Space.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.xs },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Space.xs,
  },
  forgotLink: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary, textDecorationLine: 'underline' },
  input: {
    backgroundColor: AppColors.elevated, borderRadius: 16,
    borderWidth: 1, borderColor: AppColors.border,
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text, letterSpacing: 0,
  },
  inputRow:  { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  errorBox: {
    backgroundColor: 'rgba(200,92,92,0.12)', borderRadius: Space.sm, padding: Space.sm + 2,
    marginBottom: Space.sm + 2, borderWidth: 1, borderColor: 'rgba(200,92,92,0.30)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.text, lineHeight: 18 },
  cta: { borderRadius: 999, marginBottom: Space.md },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchLabel: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary },
  switchLink:  { fontFamily: Typography.fonts.heading, fontSize: 14, color: AppColors.accent, textDecorationLine: 'underline' },
});
