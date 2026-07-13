/**
 * Board — the Signal Board (home tab).
 *
 * Reads short anonymous signals others have left and lets you add to one (→ reply
 * composer). Calm by design: a daily-cap line frames scarcity as intention, never
 * urgency ("2 signals left today", not "hurry"). No counters of likes/views, no
 * streaks. Tapping a card opens the reply composer. UI shell — MOCK_SIGNALS stands
 * in for the future `signals` table.
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
import { MOCK_SIGNALS, DAILY_SIGNAL_CAP, type MockSignal } from '@/constants/mockSignals';

function SignalCard({ signal, onPress }: { signal: MockSignal; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHead}>
        <Text style={styles.alias}>{signal.alias}</Text>
        <Text style={styles.meta}>{signal.postedAgo}</Text>
      </View>
      <Text style={styles.signalText}>{signal.text}</Text>
      <View style={styles.cardFoot}>
        <Feather name="corner-up-left" size={14} color={AppColors.textSecondary} />
        <Text style={styles.footText}>
          {signal.replies === 0 ? 'add to this' : `${signal.replies} added`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BoardScreen() {
  const router = useRouter();
  const remaining = DAILY_SIGNAL_CAP - 1; // mock: one dropped today

  const openReply = (id: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(app)/reply-composer', params: { signalId: id } } as any);
  };

  return (
    <View style={styles.root}>
      <View style={styles.disc} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Wordmark size={24} />
          <Text style={styles.cap}>{remaining} of {DAILY_SIGNAL_CAP} signals left today</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>The board</Text>
          <Text style={styles.subtitle}>Short signals from others. Read, and add to one.</Text>

          {MOCK_SIGNALS.map((s) => (
            <SignalCard key={s.id} signal={s} onPress={() => openReply(s.id)} />
          ))}

          <Text style={styles.end}>You’ve reached the quiet at the end of the board.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  disc: {
    position: 'absolute', top: -170, right: -150, width: 400, height: 400,
    borderRadius: 200, backgroundColor: 'rgba(255,208,58,0.05)',
  },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 8,
  },
  cap: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
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
  alias: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.4,
    textTransform: 'uppercase', color: AppColors.accent,
  },
  meta: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  signalText: { fontFamily: 'SpecialElite', fontSize: 17, lineHeight: 25, color: AppColors.text },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  footText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary },
  end: {
    fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary,
    textAlign: 'center', marginTop: 16, opacity: 0.7,
  },
});
