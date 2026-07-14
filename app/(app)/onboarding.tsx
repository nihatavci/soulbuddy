/**
 * Onboarding — alias + intent + boundaries → real profiles row (IDEN-01/02/03).
 *
 * Completes the Walking Skeleton: writes { alias, intent, boundaries, onboarded,
 * age_confirmed_at } to the remote re:sense project via useUpdateProfile, then
 * routes back through AppGate (profile.onboarded → app shell). age_confirmed_at
 * becomes server-side truth here, from the MMKV flag set at the age gate (AGE-01).
 * re:sense ink surface; alias uniqueness surfaces as an inline (non-modal) error.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Wordmark';
import { ChipGroup } from '@/components/ui/SelectableChip';
import { useUpdateProfile } from '@/hooks/useProfile';
import { validateAlias } from '@/lib/alias';
import { INTENT_OPTIONS, BOUNDARY_OPTIONS } from '@/constants/onboarding';
import { Prefs } from '@/store/mmkv';
import { useT } from '@/context/LanguageContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useT();
  const { mutateAsync } = useUpdateProfile();

  const [alias, setAlias] = useState('');
  const [intent, setIntent] = useState<string[]>([]);
  const [boundaries, setBoundaries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aliasFocused, setAliasFocused] = useState(false);

  const intentOptions = useMemo(
    () => INTENT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );
  const boundaryOptions = useMemo(
    () => BOUNDARY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );

  const canSubmit =
    validateAlias(alias).ok && intent.length >= 1 && boundaries.length >= 1 && !submitting;

  const handleSubmit = async () => {
    const v = validateAlias(alias);
    if (!v.ok) {
      setError(v.error ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setSubmitting(true);

    const ageConfirmed = Prefs.getBool('age_confirmed_18_plus');

    try {
      await mutateAsync({
        alias: v.value,
        intent,
        boundaries,
        onboarded: true,
        age_confirmed_at: ageConfirmed ? new Date().toISOString() : null,
      });
      // Success → re-enter AppGate, which routes an onboarded user into the app shell.
      router.replace('/(app)/' as any);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (/profiles_alias_lower_key|duplicate key|unique/i.test(msg)) {
        setError(t('onboarding.aliasTaken'));
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={380} top={-150} right={-150} opacity={0.5} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Wordmark size={24} style={styles.wordmark} />
            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

            {/* Alias */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('onboarding.aliasLabel')}</Text>
              <AnimatedInputWrapper focused={aliasFocused} style={styles.input}>
                <TextInput
                  style={styles.inputInner}
                  placeholder={t('onboarding.aliasPlaceholder')}
                  placeholderTextColor={AppColors.textSecondary}
                  value={alias}
                  onChangeText={(v) => { setAlias(v); setError(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="done"
                  onFocus={() => setAliasFocused(true)}
                  onBlur={() => setAliasFocused(false)}
                  editable={!submitting}
                />
              </AnimatedInputWrapper>
              <Text style={styles.helper}>{t('onboarding.aliasHelper')}</Text>
            </View>

            {/* Intent */}
            <View style={styles.fieldGroup}>
              <Text style={styles.sectionTitle}>{t('onboarding.intentTitle')}</Text>
              <Text style={styles.helper}>{t('onboarding.intentHelper')}</Text>
              <View style={styles.chips}>
                <ChipGroup options={intentOptions} selected={intent} onChange={setIntent} />
              </View>
            </View>

            {/* Boundaries */}
            <View style={styles.fieldGroup}>
              <Text style={styles.sectionTitle}>{t('onboarding.boundaryTitle')}</Text>
              <Text style={styles.helper}>{t('onboarding.boundaryHelper')}</Text>
              <View style={styles.chips}>
                <ChipGroup options={boundaryOptions} selected={boundaries} onChange={setBoundaries} />
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={t('onboarding.cta')}
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              style={styles.cta}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  kav: { flex: 1 },
  scroll: { paddingTop: 26, paddingBottom: 24 },
  wordmark: { marginBottom: 20 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 30, letterSpacing: -0.5, color: AppColors.text },
  subtitle: { fontFamily: Typography.fonts.body, fontSize: 16, lineHeight: 24, color: AppColors.textSecondary, marginTop: 8, maxWidth: 320 },
  fieldGroup: { marginTop: 28 },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  sectionTitle: { fontFamily: Typography.fonts.heading, fontSize: 18, color: AppColors.text },
  input: { backgroundColor: AppColors.elevated, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  inputInner: {
    paddingHorizontal: 14, paddingVertical: 14,
    fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text,
  },
  helper: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, marginTop: 8 },
  chips: { marginTop: 14 },
  errorBox: {
    marginTop: 20, padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(166,69,61,0.14)', borderWidth: 1, borderColor: 'rgba(166,69,61,0.4)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.text },
  footer: { paddingTop: 12, paddingBottom: 16 },
  cta: { borderRadius: 999 },
});
