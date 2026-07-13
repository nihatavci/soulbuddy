/**
 * Create — the Signal Composer (create tab).
 *
 * Leaves one short anonymous signal on the board: choose a format (feeling/place/
 * memory/thought), then write a half-sentence others can add to (≤120 chars). Calm
 * by design — the daily-cap line frames scarcity as intention, never urgency. No
 * streaks, no "post now" pressure. UI shell: the CTA mocks the write (router.back())
 * and stands in for the future `signals` insert. Local state only.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Wordmark';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import {
  SIGNAL_FORMATS,
  SIGNAL_MAX_CHARS,
  DAILY_SIGNAL_CAP,
  type SignalFormat,
} from '@/constants/mockSignals';

export default function CreateScreen() {
  const router = useRouter();
  const remaining = DAILY_SIGNAL_CAP - 1; // mock: one dropped today

  const [format, setFormat] = useState<SignalFormat | null>(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const selectedHint = SIGNAL_FORMATS.find((f) => f.value === format)?.hint;
  const count = text.length;
  const nearLimit = count >= SIGNAL_MAX_CHARS - 15;
  const canLeave = format !== null && text.trim().length >= 3;

  const chooseFormat = (value: SignalFormat) => {
    Haptics.selectionAsync();
    setFormat(value);
  };

  const handleLeave = () => {
    if (!canLeave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mock: no write yet. Stands in for the future `signals` insert.
    router.back();
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={400} top={-160} right={-150} opacity={0.5} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <Wordmark size={24} />
            <Text style={styles.cap}>{remaining} of {DAILY_SIGNAL_CAP} signals left today</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Leave a signal</Text>
            <Text style={styles.subtitle}>A half-sentence someone else can add to. Max 120 characters.</Text>

            {/* Format chooser */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>What is it</Text>
              <View style={styles.pills}>
                {SIGNAL_FORMATS.map((f) => {
                  const active = f.value === format;
                  return (
                    <Pressable
                      key={f.value}
                      onPress={() => chooseFormat(f.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
                    >
                      <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {!!selectedHint && <Text style={styles.hint}>{selectedHint}</Text>}
            </View>

            {/* Composer */}
            <View style={styles.fieldGroup}>
              <AnimatedInputWrapper focused={focused} style={styles.composer}>
                <TextInput
                  style={styles.composerInner}
                  placeholder="type your signal…"
                  placeholderTextColor={AppColors.textSecondary}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={SIGNAL_MAX_CHARS}
                  textAlignVertical="top"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </AnimatedInputWrapper>
              <Text style={[styles.counter, nearLimit && styles.counterNear]}>
                {count}/{SIGNAL_MAX_CHARS}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Leave it on the board"
              variant="primary"
              size="lg"
              onPress={handleLeave}
              disabled={!canLeave}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 8,
  },
  cap: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  scroll: { paddingTop: 12, paddingBottom: 24 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 32, letterSpacing: -0.5, color: AppColors.text },
  subtitle: {
    fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22,
    color: AppColors.textSecondary, marginTop: 6, maxWidth: 320,
  },
  fieldGroup: { marginTop: 28 },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.text,
    letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
  },
  pillIdle: { backgroundColor: AppColors.elevated, borderColor: AppColors.border },
  pillActive: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  pillText: { fontFamily: Typography.fonts.body, fontSize: 14 },
  pillTextIdle: { color: AppColors.text },
  pillTextActive: { color: AppColors.ink },
  hint: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, marginTop: 12 },
  composer: { backgroundColor: AppColors.elevated, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  composerInner: {
    paddingHorizontal: 16, paddingVertical: 16, minHeight: 120,
    fontFamily: 'SpecialElite', fontSize: 18, lineHeight: 26, color: AppColors.text,
  },
  counter: {
    fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary,
    textAlign: 'right', marginTop: 8,
  },
  counterNear: { color: AppColors.error },
  footer: { paddingTop: 12, paddingBottom: 16 },
  cta: { borderRadius: 999 },
});
