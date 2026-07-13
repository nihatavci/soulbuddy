/**
 * Signal Board — home tab (Phase 1 landing).
 *
 * The real Signal Board (drop a signal → read others → resonance) arrives in a
 * later phase. For now this is a calm, on-brand placeholder that confirms the
 * identity foundation is live: it greets the user by their chosen alias and
 * rests quietly — no counters, streaks, or badges (non-addictive by design).
 *
 * English copy; re:sense ink surface. Playfair for the section title, Special
 * Elite for the "signal" prompt line, Satoshi for body.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Wordmark } from '@/components/ui/Wordmark';
import { useProfile } from '@/hooks/useProfile';

export default function HomeScreen() {
  const { data: profile } = useProfile();
  const alias = profile?.alias?.trim();

  return (
    <View style={styles.root}>
      {/* Soft gold ink-disc wash — echoes the welcome/onboarding surfaces */}
      <View style={styles.disc} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Wordmark size={26} />
        </View>

        <View style={styles.center}>
          <Text style={styles.greeting}>
            {alias ? `You're here, ${alias}.` : "You're here."}
          </Text>
          <Text style={styles.title}>The board is resting.</Text>
          <Text style={styles.body}>
            No signals yet. When it opens, you'll drop a short anonymous
            sentence — a feeling, a place, a half-thought — and read what others
            leave behind. Nothing to chase here. Come as you are.
          </Text>

          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>your next signal</Text>
            <Text style={styles.promptText}>a half-sentence, whenever it finds you…</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  disc: {
    position: 'absolute',
    top: -170,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,208,58,0.05)',
  },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  header: { paddingTop: 8, paddingBottom: 4 },
  center: { flex: 1, justifyContent: 'center', paddingBottom: 48 },
  greeting: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: AppColors.accent,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 34,
    letterSpacing: -0.5,
    color: AppColors.text,
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    lineHeight: 25,
    color: AppColors.textSecondary,
    marginTop: 14,
    maxWidth: 340,
  },
  promptCard: {
    marginTop: 34,
    padding: 18,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  promptLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  promptText: {
    fontFamily: 'SpecialElite',
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.text,
  },
});
