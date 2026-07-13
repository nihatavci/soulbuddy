/**
 * Private — the list of private spaces (Private tab).
 *
 * Each space is a mutual resonance that opened into a private conversation:
 * two people genuinely added to each other's signal, so it moved off the board
 * and into here. Calm and private-first — no unread counts, no streaks, no
 * urgency. Real names stay behind aliases until both choose to reveal. Tapping a
 * card opens the private space. UI shell — MOCK_PRIVATE_SPACES stands in for the
 * future `resonances` table.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Wordmark } from '@/components/ui/Wordmark';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { MOCK_PRIVATE_SPACES, type MockPrivateSpace } from '@/constants/mockSignals';

function SpaceCard({ space, onPress }: { space: MockPrivateSpace; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHead}>
        <View style={styles.headLeft}>
          <Feather name="lock" size={12} color={AppColors.textSecondary} />
          <Text style={styles.alias}>{space.alias}</Text>
        </View>
        <Text style={styles.meta}>{space.updatedAgo}</Text>
      </View>

      <Text style={styles.lastLine}>{space.lastLine}</Text>

      <View style={styles.cardFoot}>
        <Text style={styles.footText}>from your signal · {space.fromSignal}</Text>
        <View style={styles.footRight}>
          {space.revealed ? (
            <View style={styles.revealPill}>
              <Feather name="eye" size={11} color={AppColors.success} />
              <Text style={styles.revealText}>revealed</Text>
            </View>
          ) : null}
          <Feather name="chevron-right" size={16} color={AppColors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function PrivateScreen() {
  const router = useRouter();

  const openSpace = (id: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(app)/private-space', params: { id } } as any);
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={400} top={-160} right={-150} opacity={0.5} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Wordmark size={24} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Private</Text>
          <Text style={styles.subtitle}>
            Conversations that grew from a mutual resonance. No one else can see these.
          </Text>

          {MOCK_PRIVATE_SPACES.map((s) => (
            <SpaceCard key={s.id} space={s} onPress={() => openSpace(s.id)} />
          ))}

          <Text style={styles.note}>You choose when — and whether — to reveal more.</Text>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 8,
  },
  scroll: { paddingTop: 12, paddingBottom: 32 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 32, letterSpacing: -0.5, color: AppColors.text },
  subtitle: {
    fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22,
    color: AppColors.textSecondary, marginTop: 6, marginBottom: 20, maxWidth: 320,
  },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: AppColors.border, padding: 18, marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alias: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.4,
    textTransform: 'uppercase', color: AppColors.textSecondary,
  },
  meta: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  lastLine: { fontFamily: 'SpecialElite', fontSize: 16, lineHeight: 24, color: AppColors.text },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  footText: { flex: 1, fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  footRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revealPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(79,106,86,0.18)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  revealText: { fontFamily: Typography.fonts.body, fontSize: 11, color: AppColors.success },
  note: {
    fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary,
    textAlign: 'center', marginTop: 16, opacity: 0.7,
  },
});
