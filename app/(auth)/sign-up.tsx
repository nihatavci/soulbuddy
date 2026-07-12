/**
 * Sign Up screen
 * Design: white bg, system font headings, body text
 *
 * Auth methods:
 *   - Email + Password  (Supabase Auth)
 *   - Google OAuth      (Native Google Sign-In + Supabase signInWithIdToken)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Feather } from '@expo/vector-icons';
import { AppColors, Typography } from '@/constants/theme';
import { Space, Relation, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from '@/constants/spacing';
import { supabase } from '@/services/supabase';
import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { useT } from '@/context/LanguageContext';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  ...(Platform.OS === 'ios' && {
    iosClientId: '1009931647680-q4csblcicrdgl0vska3v2r4p8ojikesv.apps.googleusercontent.com',
  }),
});

export default function SignUpScreen() {
  const router = useRouter();
  const t = useT();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading]   = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const [nameFocused,     setNameFocused]     = useState(false);
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passFocused,     setPassFocused]     = useState(false);
  const [confirmFocused,  setConfirmFocused]  = useState(false);
  const [otpFocused,      setOtpFocused]      = useState(false);

  // OTP verification state
  const [verifying, setVerifying]         = useState(false);
  const [otpCode, setOtpCode]             = useState('');

  const busy = loading || googleLoading;

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!name.trim())           return t('auth.signUp.errors.nameRequired');
    if (!email.trim())          return t('auth.signUp.errors.emailRequired');
    if (!email.includes('@'))   return t('auth.signUp.errors.emailInvalid');
    if (password.length < 8)    return t('auth.signUp.errors.passwordTooShort');
    if (password !== confirm)   return t('auth.signUp.errors.passwordsMismatch');
    return null;
  };

  // ── Email + Password sign-up ──────────────────────────────────────────────
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

      // T-16-06: Check if email already registered (identities array empty)
      if (data.user && data.user.identities?.length === 0) {
        setError(t('auth.signUp.errors.emailExists'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // If session is null, email confirmation needed - show OTP verification
      if (!data.session) {
        setVerifying(true);
      }
      // If session exists, onAuthStateChange in AuthContext handles navigation
    } catch (err: any) {
      setError(err?.message ?? t('auth.signUp.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP code ───────────────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!otpCode.trim()) {
      setError(t('auth.signUp.errors.codeRequired'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      // On success: onAuthStateChange in AuthContext handles navigation
    } catch (err: any) {
      setError(err?.message ?? t('auth.signUp.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In (native popup with nonce for iOS) ──────────────────────
  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setGoogleLoading(true);

    try {
      await GoogleSignin.signOut();

      const rawNonce = Crypto.getRandomBytes(16).reduce(
        (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
        '',
      );
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const response = await GoogleSignin.signIn({ nonce: hashedNonce } as any);

      if (response.type === 'success' && response.data.idToken) {
        const { error: idTokenError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.data.idToken,
          nonce: rawNonce,
        });

        if (idTokenError) {
          setError(idTokenError.message);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        // On success: onAuthStateChange in AuthContext handles navigation
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code !== 'SIGN_IN_CANCELLED' && code !== 'ERR_CANCELED') {
        setError(err?.message ?? t('auth.signUp.errors.generic'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── OTP Verification view ─────────────────────────────────────────────────
  if (verifying) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.card}>
                <Text style={styles.title}>{t('auth.signIn.verifyCodeButton')}</Text>
                <Text style={styles.subtitle}>{t('auth.signUp.verifySubtitle', { email: email.trim() })}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t('auth.signUp.verificationCode')}</Text>
                  <AnimatedInputWrapper focused={otpFocused} style={[styles.input, styles.otpInputWrap]}>
                    <TextInput
                      style={[styles.inputInner, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor={AppColors.textSecondary}
                      value={otpCode}
                      onChangeText={t => { setOtpCode(t.replace(/[^0-9]/g, '')); setError(null); }}
                      keyboardType="number-pad"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyCode}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
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
                  label={t('auth.signIn.verifyCodeButton')}
                  variant="primary"
                  size="lg"
                  onPress={handleVerifyCode}
                  disabled={loading}
                  loading={loading}
                  style={styles.btnOverride}
                />

                <Pressable
                  onPress={() => { setVerifying(false); setOtpCode(''); setError(null); }}
                  style={styles.backRow}
                >
                  <Text style={styles.backText}>{t('auth.signUp.backToSignUp')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

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
            {/* ── Card ── */}
            <View style={styles.card}>
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
                  onChangeText={setName}
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
                  onChangeText={setEmail}
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
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoComplete="new-password"
                  returnKeyType="next"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
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
                  onChangeText={setConfirm}
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

            {/* Sign Up Button */}
            <Button
              label={t('auth.signUp.signUpButton')}
              variant="primary"
              size="lg"
              onPress={handleSignUp}
              disabled={busy}
              loading={loading}
              style={styles.btnOverride}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.signUp.divider')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <Pressable
              style={[styles.googleBtn, busy && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={busy}
            >
              {googleLoading ? (
                <ActivityIndicator color={AppColors.text} />
              ) : (
                <>
                  <GoogleLogo size={20} />
                  <Text style={styles.googleBtnText} adjustsFontSizeToFit minimumFontScale={0.8}>{t('auth.signUp.googleButton')}</Text>
                </>
              )}
            </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: AppColors.background },
  safe:   { flex: 1, backgroundColor: 'transparent' },
  kav:    { flex: 1 },
  // Screen padding: lg(26) horizontal, xl(42) top, lg(26) bottom
  scroll: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: ScreenPaddingH, paddingTop: ScreenPaddingTop, paddingBottom: ScreenPaddingBottom },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: Space.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  // Title ↔ Subtitle: strong(6) | Subtitle ↔ first field: weak(26) via subtitle marginBottom
  title: {
    fontFamily: Typography.fonts.heading,
    fontSize: 24,
    color: AppColors.text,
    marginBottom: Relation.strong,
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: Relation.weak,
  },
  // Field ↔ Field: medium(16)
  fieldGroup: { marginBottom: Space.md },
  // Label ↔ Input: strong(6)
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: AppColors.text,
    marginBottom: Space.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4,
    paddingVertical: 13,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.text,
    letterSpacing: 0,
  },
  otpInputWrap: { alignItems: 'center' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: Typography.fonts.heading, width: '100%' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  errorBox: {
    backgroundColor: 'rgba(232, 93, 86, 0.1)',
    borderRadius: Space.sm,
    padding: Space.sm + 2,
    marginBottom: Space.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 86, 0.25)',
  },
  errorText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.accent,
    lineHeight: 18,
  },
  // Override for Button to match original dark-bg style
  btnOverride: {
    backgroundColor: AppColors.text,
    borderRadius: 14,
    marginBottom: Space.md,
  },
  btnDisabled: { opacity: 0.6 },
  backRow: { alignItems: 'center', marginTop: Space.sm - 2 },
  backText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, textDecorationLine: 'underline' },
  // Divider ↔ Google: medium(16)
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Space.md, gap: Space.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  dividerText: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  // Google ↔ terms: medium(16)
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: Space.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  googleBtnText: { fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text },
  terms: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: Space.md,
  },
  termsLink: { fontFamily: Typography.fonts.heading, textDecorationLine: 'underline', color: AppColors.text },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchLabel: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary },
  switchLink: {
    fontFamily: Typography.fonts.heading,
    fontSize: 13,
    color: AppColors.text,
    textDecorationLine: 'underline',
  },
});
