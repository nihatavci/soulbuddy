/**
 * Resonance Unlock — the mutual-resonance moment.
 *
 * The emotional core of re:sense: two people each genuinely *added* to the
 * other's signal, so a private space opens. Deliberately calm and ceremonial —
 * ink surface, a soft gold glow behind a single emblem, Playfair hero line, and
 * a quiet primary CTA. No confetti, no hearts, no slot-machine motion, no
 * urgency. The user is invited, never rushed.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';

export default function ResonanceUnlockScreen() {
  const router = useRouter();

  const openPrivateSpace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(app)/private-space' as any);
  };

  return (
    <PaperBackground style={styles.root}>
      {/* Soft gold pigment disc behind the hero */}
      <GoldDisc size={460} top={120} opacity={0.6} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.emblem}>
            <Feather name="zap" size={28} color={AppColors.accent} />
          </View>

          <Text style={styles.label}>A RESONANCE</Text>

          <Text style={styles.hero}>You met in the middle.</Text>

          <Text style={styles.body}>
            You both added something real to each other’s signal. That’s rare
            here. A private space is open — a quiet room, just the two of you. No
            pressure to fill it.
          </Text>

          <Button
            label="Open the private space"
            variant="primary"
            size="lg"
            onPress={openPrivateSpace}
            style={styles.primary}
          />

          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.notNow}>
            <Text style={styles.notNowText}>Not right now</Text>
          </Pressable>
        </View>

        <View style={styles.reassurance}>
          <Feather name="shield" size={13} color={AppColors.textSecondary} />
          <Text style={styles.reassuranceText}>
            You stay anonymous until you both choose otherwise.
          </Text>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emblem: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: AppColors.ink,
    borderWidth: 1, borderColor: AppColors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Space.lg,
  },
  label: {
    fontFamily: Typography.fonts.body, fontSize: 12,
    letterSpacing: 1, textTransform: 'uppercase',
    color: AppColors.accent, marginBottom: Space.md,
  },
  hero: {
    fontFamily: 'PlayfairDisplay', fontSize: 40, lineHeight: 46,
    letterSpacing: -0.6, color: AppColors.text, textAlign: 'center',
  },
  body: {
    fontFamily: Typography.fonts.body, fontSize: 16, lineHeight: 24,
    color: AppColors.textSecondary, textAlign: 'center',
    maxWidth: 320, marginTop: Space.md, marginBottom: Space.xl,
  },
  primary: { alignSelf: 'stretch', marginHorizontal: Space.sm },
  notNow: { marginTop: Space.lg },
  notNowText: {
    fontFamily: Typography.fonts.body, fontSize: 14,
    color: AppColors.textSecondary, textAlign: 'center',
  },
  reassurance: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingBottom: Space.md,
  },
  reassuranceText: {
    fontFamily: Typography.fonts.body, fontSize: 12,
    color: AppColors.textSecondary,
  },
});
