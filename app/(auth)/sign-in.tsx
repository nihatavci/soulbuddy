/**
 * Sign In screen
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

type SignInMode = 'password' | 'magic';

export default function SignInScreen() {
  const router = useRouter();
  const t = useT();

  const [mode, setMode]                   = useState<SignInMode>('password');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass]           = useState(false);
  const [codeSent, setCodeSent]           = useState(false);
  const [otpCode, setOtpCode]             = useState('');
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [otpFocused,      setOtpFocused]      = useState(false);

  // Disabled when any action is in progress
  const busy = loading || googleLoading;

  const switchMode = (m: SignInMode) => {
    setMode(m);
    setError(null);
    setCodeSent(false);
    setOtpCode('');
  };

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

  // ── Email OTP — Step 1: send code ───────────────────────────────────────
  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(t('auth.signIn.errors.emailRequired'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });

      if (otpError) {
        setError(otpError.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setCodeSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setError(err?.message ?? t('auth.signIn.errors.generic'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP — Step 2: verify code ─────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!otpCode.trim()) {
      setError(t('auth.signIn.errors.codeRequired'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message);
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

  // ── Google Sign-In (native popup with nonce for iOS) ──────────────────────
  const handleGoogle = async () => {
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
      // If response.type === 'cancelled', do nothing (user cancelled)
    } catch (err: any) {
      // Ignore user-initiated cancellations
      const code = err?.code ?? '';
      if (code !== 'SIGN_IN_CANCELLED' && code !== 'ERR_CANCELED') {
        setError(err?.message ?? t('auth.signIn.errors.generic'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setGoogleLoading(false);
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
            {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.title}>{t('auth.signIn.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>

            {/* Mode tabs */}
            <View style={styles.tabs}>
              {(['password', 'magic'] as SignInMode[]).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.tab, mode === m && styles.tabActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[styles.tabText, mode === m && styles.tabTextActive]} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {m === 'password' ? t('auth.signIn.usePassword') : t('auth.signIn.useMagicLink')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Email — shown always, but locked once code is sent */}
            {!codeSent && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('auth.signIn.emailLabel')}</Text>
                <AnimatedInputWrapper focused={emailFocused} style={styles.input}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    placeholderTextColor={AppColors.textSecondary}
                    value={email}
                    onChangeText={t => { setEmail(t); setCodeSent(false); setOtpCode(''); setError(null); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType={mode === 'password' ? 'next' : 'send'}
                    onSubmitEditing={mode === 'magic' ? handleSendCode : undefined}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!busy}
                  />
                </AnimatedInputWrapper>
              </View>
            )}

            {/* Password (password mode) */}
            {mode === 'password' && (
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
                    onChangeText={t => { setPassword(t); setError(null); }}
                    secureTextEntry={!showPass}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!busy}
                  />
                  <Pressable onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                    <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={AppColors.textSecondary} />
                  </Pressable>
                </AnimatedInputWrapper>
              </View>
            )}

            {/* OTP code input (email code mode, after code is sent) */}
            {mode === 'magic' && codeSent && (
              <>
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    {t('auth.signIn.codeSentTo', { email: email.trim() })}
                    {'\n'}{t('auth.signIn.enterSixDigit')}
                  </Text>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t('auth.signIn.verificationCode')}</Text>
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
                      editable={!busy}
                      autoFocus
                    />
                  </AnimatedInputWrapper>
                </View>
                <Pressable
                  onPress={() => { setCodeSent(false); setOtpCode(''); setError(null); }}
                  style={styles.resendRow}
                >
                  <Text style={styles.resendText}>{t('auth.signIn.resendCode')}</Text>
                </Pressable>
              </>
            )}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Primary button */}
            {mode === 'password' ? (
              <Button
                label={t('auth.signIn.signInButton')}
                variant="primary"
                size="lg"
                onPress={handleSignIn}
                disabled={busy}
                loading={loading}
                style={styles.btnOverride}
              />
            ) : codeSent ? (
              <Button
                label={t('auth.signIn.verifyCodeButton')}
                variant="primary"
                size="lg"
                onPress={handleVerifyCode}
                disabled={busy}
                loading={loading}
                style={styles.btnOverride}
              />
            ) : (
              <Button
                label={t('auth.signIn.sendCodeButton')}
                variant="primary"
                size="lg"
                onPress={handleSendCode}
                disabled={busy}
                loading={loading}
                style={styles.btnOverride}
              />
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.signIn.divider')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <Pressable
              style={[styles.googleBtn, busy && styles.btnDisabled]}
              onPress={handleGoogle}
              disabled={busy}
            >
              {googleLoading
                ? <ActivityIndicator color={AppColors.text} />
                : <><GoogleLogo size={20} /><Text style={styles.googleBtnText} adjustsFontSizeToFit minimumFontScale={0.8}>{t('auth.signIn.googleButton')}</Text></>
              }
            </Pressable>

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
  // Screen padding: lg(26) horizontal, xl(42) top, lg(26) bottom
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: ScreenPaddingH, paddingTop: ScreenPaddingTop, paddingBottom: ScreenPaddingBottom },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: Space.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 4,
  },
  // Title ↔ Subtitle: strong(6) | Subtitle ↔ tabs: weak(26) via tabs marginTop
  title:    { fontFamily: Typography.fonts.heading, fontSize: 24, color: AppColors.text, marginBottom: Relation.strong },
  subtitle: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, marginBottom: Relation.weak },
  tabs: {
    flexDirection: 'row', backgroundColor: AppColors.background,
    borderRadius: Space.sm, padding: Space['2xs'], marginBottom: Space.lg,
  },
  tab:       { flex: 1, paddingVertical: Space.sm - 2, alignItems: 'center', borderRadius: Space.xs + 1 },
  tabActive: {
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText:       { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary },
  tabTextActive: { color: AppColors.text },
  // Field ↔ Field: medium(16)
  fieldGroup: { marginBottom: Space.md },
  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.xs },
  // Label ↔ Input: strong(6)
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Space.xs,
  },
  forgotLink: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary, textDecorationLine: 'underline' },
  // Animated border wrapper — AnimatedInputWrapper applies borderColor animation
  input: {
    backgroundColor: AppColors.background, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  inputInner: {
    paddingHorizontal: Space.sm + 4, paddingVertical: 13,
    fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text, letterSpacing: 0,
  },
  otpInputWrap: { alignItems: 'center' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: Typography.fonts.heading, width: '100%' },
  inputRow:  { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  eyeBtn: {
    paddingHorizontal: 12, paddingVertical: 13,
  },
  successBox: {
    backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: Space.sm, padding: Space.sm + 4,
    marginBottom: Space.sm + 4, borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)',
  },
  successText:  { fontFamily: Typography.fonts.body, fontSize: 13, color: '#2e7d32', lineHeight: 19 },
  successEmail: { fontFamily: Typography.fonts.heading },
  resendRow: { alignItems: 'center', marginBottom: Space.sm },
  resendText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, textDecorationLine: 'underline' },
  errorBox: {
    backgroundColor: 'rgba(232,93,86,0.1)', borderRadius: Space.sm, padding: Space.sm + 2,
    marginBottom: Space.sm + 2, borderWidth: 1, borderColor: 'rgba(232,93,86,0.25)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.accent, lineHeight: 18 },
  // Override for Button component to match original dark-bg style
  btnOverride: {
    backgroundColor: AppColors.text, borderRadius: 14, marginBottom: Space.md,
  },
  btnDisabled: { opacity: 0.5 },
  // Divider ↔ Google: medium(16)
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Space.md, gap: Space.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  dividerText: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  // Google ↔ switch: medium(16) via marginBottom
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.sm,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, marginBottom: Space.md,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  googleBtnText: { fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.text },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchLabel: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary },
  switchLink:  { fontFamily: Typography.fonts.heading, fontSize: 13, color: AppColors.text, textDecorationLine: 'underline' },
});
