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
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
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
    <PaperBackground style={styles.root}>
      <GoldDisc size={400} top={-160} right={-150} opacity={0.5} />
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

          {MOCK_SIGNALS.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <View style={styles.rule} />}
              <SignalCard signal={s} onPress={() => openReply(s.id)} />
            </React.Fragment>
          ))}

          <Text style={styles.end}>You’ve reached the quiet at the end of the board.</Text>
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
  cap: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary },
  scroll: { paddingTop: 12, paddingBottom: 32 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 32, letterSpacing: -0.5, color: AppColors.text },
  subtitle: {
    fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22,
    color: AppColors.textSecondary, marginTop: 6, marginBottom: 20, maxWidth: 320,
  },
  // Borderless notebook entries — no boxes; separation is whitespace + a faint rule.
  card: { paddingVertical: 18 },
  rule: { height: 1, backgroundColor: AppColors.text, opacity: 0.07, marginVertical: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  alias: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.4,
    textTransform: 'uppercase', color: AppColors.textSecondary,
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
