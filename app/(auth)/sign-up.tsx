/**
 * Sign Up — re:sense, email + password only.
 *
 * Google / OTP are out of scope for the Phase 1 slice (CONTEXT). Email
 * confirmation is disabled on the remote project, so a successful signUp returns
 * a session immediately and onAuthStateChange drives navigation toward onboarding.
 * signUp logic + validation + Haptics feedback are unchanged.
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
import * as Linking from 'expo-linking';
import { Feather } from '@expo/vector-icons';
import { AppColors, Typography } from '@/constants/theme';
import { Space, Relation, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { Wordmark } from '@/components/ui/Wordmark';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { AppleSignInButton } from '@/components/ui/AppleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LanguageContext';

export default function SignUpScreen() {
  const router = useRouter();
  const t = useT();
  const { signInWithApple } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [nameFocused,    setNameFocused]    = useState(false);
  const [emailFocused,   setEmailFocused]   = useState(false);
  const [passFocused,    setPassFocused]    = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const validate = (): string | null => {
    if (!name.trim())         return t('auth.signUp.errors.nameRequired');
    if (!email.trim())        return t('auth.signUp.errors.emailRequired');
    if (!email.includes('@')) return t('auth.signUp.errors.emailInvalid');
    if (password.length < 8)  return t('auth.signUp.errors.passwordTooShort');
    if (password !== confirm) return t('auth.signUp.errors.passwordsMismatch');
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() } },
      });

      if (signUpError) {
        setError(signUpError.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Email already registered → identities array is empty.
      if (data.user && data.user.identities?.length === 0) {
        setError(t('auth.signUp.errors.emailExists'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Email confirmation is disabled → a session should be present. If it is
      // not, confirmation is unexpectedly on; surface a clear message.
      if (!data.session) {
        setError(t('auth.signUp.errors.generic'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      // Success: onAuthStateChange in AuthContext handles navigation
    } catch (err: any) {
      setError(err?.message ?? t('auth.signUp.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError(null);
    const { error: appleError } = await signInWithApple();
    if (appleError) {
      setError(appleError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // Success → onAuthStateChange in AuthContext handles navigation
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={320} top={-130} right={-150} opacity={0.4} />
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
              <Text style={styles.title}>{t('auth.signUp.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.signUp.subtitle')}</Text>

              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signUp.nameLabel')}</Text>
                <AnimatedInputWrapper focused={nameFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Alex"
                    placeholderTextColor={AppColors.textSecondary}
                    value={name}
                    onChangeText={(v) => { setName(v); setError(null); }}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    editable={!loading}
                  />
                </AnimatedInputWrapper>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signUp.emailLabel')}</Text>
                <AnimatedInputWrapper focused={emailFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.signUp.emailPlaceholder')}
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
                <Text style={styles.label}>{t('auth.signUp.passwordLabel')}</Text>
                <AnimatedInputWrapper focused={passFocused} style={[styles.input, styles.inputRow]}>
                  <TextInput
                    style={[styles.inputInner, styles.inputFlex]}
                    placeholder={t('auth.signUp.passwordPlaceholder')}
                    placeholderTextColor={AppColors.textSecondary}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPass}
                    autoComplete="new-password"
                    returnKeyType="next"
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={AppColors.textSecondary} />
                  </Pressable>
                </AnimatedInputWrapper>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signUp.confirmPasswordLabel')}</Text>
                <AnimatedInputWrapper focused={confirmFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder="••••••••"
                    placeholderTextColor={AppColors.textSecondary}
                    value={confirm}
                    onChangeText={(v) => { setConfirm(v); setError(null); }}
                    secureTextEntry={!showPass}
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    editable={!loading}
                  />
                </AnimatedInputWrapper>
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Sign Up CTA */}
              <Button
                label={t('auth.signUp.signUpButton')}
                variant="primary"
                size="lg"
                onPress={handleSignUp}
                disabled={loading}
                loading={loading}
                style={styles.cta}
              />

              {/* Apple sign-in (iOS) */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.signUp.divider')}</Text>
                <View style={styles.dividerLine} />
              </View>
              <AppleSignInButton onPress={handleApple} style={styles.appleBtn} />

              {/* Terms note */}
              <Text style={styles.terms}>
                {t('auth.signUp.termsPrefix')}{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL('https://example.com/terms')}>{t('common.termsOfService')}</Text>
                {' '}{t('common.and')}{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL('https://example.com/privacy')}>{t('common.privacyPolicy')}</Text>.
              </Text>

              {/* Switch to Sign In */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('auth.signUp.hasAccount')} </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
                  <Text style={styles.switchLink}>{t('auth.signUp.signInLink')}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
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
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    marginBottom: Space.xs, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppColors.elevated, borderRadius: 16,
    borderWidth: 1, borderColor: AppColors.border,
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text, letterSpacing: 0,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  errorBox: {
    backgroundColor: 'rgba(200,92,92,0.12)', borderRadius: Space.sm, padding: Space.sm + 2,
    marginBottom: Space.sm + 2, borderWidth: 1, borderColor: 'rgba(200,92,92,0.30)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.text, lineHeight: 18 },
  cta: { borderRadius: 999, marginBottom: Space.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Space.md, gap: Space.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: AppColors.border },
  dividerText: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  appleBtn: { marginBottom: Space.md },
  terms: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary,
    textAlign: 'center', lineHeight: 17, marginBottom: Space.md,
  },
  termsLink: { fontFamily: Typography.fonts.heading, textDecorationLine: 'underline', color: AppColors.text },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchLabel: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary },
  switchLink:  { fontFamily: Typography.fonts.heading, fontSize: 14, color: AppColors.accent, textDecorationLine: 'underline' },
});
