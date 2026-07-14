/**
 * Reply Composer — a pushed modal for adding to someone's signal (RESONANCE flow).
 *
 * A re:sense reply is an ADD, not a reaction: you continue the thought rather than
 * judge it. Reads the original signal (read-only card) and lets you compose an
 * addition in the same typewriter face. On submit we jump to the resonance-unlock
 * screen to showcase the mutual-resonance arc. Reads the live signal via
 * useSignal and inserts the reply via useAddReply — the DB trigger auto-opens a
 * private space, whose id we carry into resonance-unlock. Calm by design: no
 * urgency, no "reply before it disappears".
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { SIGNAL_MAX_CHARS } from '@/constants/signals';
import { useSignal } from '@/hooks/useSignals';
import { useAddReply } from '@/hooks/useReplies';

const MIN_ADDITION = 3;
const NEAR_LIMIT = SIGNAL_MAX_CHARS - 15;

export default function ReplyComposerScreen() {
  const router = useRouter();
  const { signalId } = useLocalSearchParams<{ signalId?: string }>();
  const { data: original } = useSignal(signalId);
  const { mutateAsync: addReply, isPending } = useAddReply();

  const [addition, setAddition] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = addition.trim().length >= MIN_ADDITION && !isPending;
  const nearLimit = addition.length >= NEAR_LIMIT;

  const handleSubmit = async () => {
    if (!canSubmit || !signalId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitError(null);
    try {
      const { space } = await addReply({ signalId, text: addition });
      if (space?.id) {
        // Showcase the resonance arc: signal → response → mutual resonance.
        router.replace({ pathname: '/(app)/resonance-unlock', params: { spaceId: space.id } });
      } else {
        // Reply succeeded but the space read-back failed — don't push a broken
        // private-space with an empty id. The spaces query is already
        // invalidated, so the Private tab will show it once it settles.
        router.replace('/(app)/(tabs)/private');
      }
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Something went wrong. Try again.');
    }
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={320} top={-120} right={-150} opacity={0.4} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={22} color={AppColors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Add to this</Text>

            {/* Original signal — read-only */}
            {original == null ? (
              <View style={[styles.card, styles.cardLoading]}>
                <ActivityIndicator color={AppColors.accent} />
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.alias}>{original.alias}</Text>
                <Text style={styles.originalText}>{original.text}</Text>
              </View>
            )}

            {/* Composer */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your addition</Text>
              <Text style={styles.explainer}>
                Don’t reply — add to it. Continue the thought, don’t judge it.
              </Text>

              <AnimatedInputWrapper focused={focused} style={styles.input}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="pick up where it left off…"
                  placeholderTextColor={AppColors.textSecondary}
                  value={addition}
                  onChangeText={setAddition}
                  multiline
                  maxLength={SIGNAL_MAX_CHARS}
                  textAlignVertical="top"
                  autoCorrect
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </AnimatedInputWrapper>

              <Text style={[styles.counter, nearLimit && styles.counterNear]}>
                {addition.length}/{SIGNAL_MAX_CHARS}
              </Text>

              {submitError != null && (
                <Text style={styles.errorText}>{submitError}</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={isPending ? 'Adding…' : 'Add to the signal'}
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={!canSubmit || original == null}
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
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginLeft: -8,
  },
  scroll: { paddingTop: 8, paddingBottom: 24 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 28, letterSpacing: -0.5, color: AppColors.text, marginBottom: 20 },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: AppColors.border, padding: 18,
  },
  cardLoading: { alignItems: 'center', paddingVertical: 28 },
  alias: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.4,
    textTransform: 'uppercase', color: AppColors.accent, marginBottom: 10,
  },
  originalText: { fontFamily: 'SpecialElite', fontSize: 17, lineHeight: 25, color: AppColors.text },
  fieldGroup: { marginTop: 28 },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  explainer: {
    fontFamily: Typography.fonts.body, fontSize: 13, lineHeight: 20,
    color: AppColors.textSecondary, marginBottom: 14,
  },
  input: { backgroundColor: AppColors.elevated, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  inputInner: {
    paddingHorizontal: 14, paddingVertical: 14,
    fontFamily: 'SpecialElite', fontSize: 17, lineHeight: 25, color: AppColors.text,
    minHeight: 110,
  },
  counter: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary,
    textAlign: 'right', marginTop: 8,
  },
  counterNear: { color: AppColors.error },
  errorText: {
    fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.error,
    marginTop: 8,
  },
  footer: { paddingTop: 12, paddingBottom: 16 },
  cta: { borderRadius: 999 },
});
