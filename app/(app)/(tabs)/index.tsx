/**
 * Board — the Signal Board (home tab).
 *
 * Reads short anonymous signals others have left and lets you add to one (→ reply
 * composer). Calm by design: a daily-cap line frames scarcity as intention, never
 * urgency ("2 signals left today", not "hurry"). No counters of likes/views, no
 * streaks. Tapping a card opens the reply composer. Reads live from the
 * alias-only `public_signals` view via useSignals().
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Wordmark } from '@/components/ui/Wordmark';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { useSignals } from '@/hooks/useSignals';
import { useAuth } from '@/context/AuthContext';
import type { PublicSignal } from '@/services/supabase';

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function SignalCard({ signal, onPress, isMine }: { signal: PublicSignal; onPress: () => void; isMine: boolean }) {
  const replyCount = signal.reply_count ?? 0;
  return (
    <Pressable style={styles.card} onPress={isMine ? undefined : onPress} accessibilityRole="button" disabled={isMine}>
      <View style={styles.cardHead}>
        <Text style={styles.alias}>{signal.alias}</Text>
        <Text style={styles.meta}>{signal.created_at ? timeAgo(signal.created_at) : ''}</Text>
      </View>
      <Text style={styles.signalText}>{signal.text}</Text>
      <View style={styles.cardFoot}>
        <Feather name="corner-up-left" size={14} color={AppColors.textSecondary} />
        <Text style={styles.footText}>
          {isMine ? 'your signal' : replyCount === 0 ? 'add to this' : `${replyCount} added`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BoardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: signals = [], isFetching, refetch } = useSignals();

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
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={AppColors.textSecondary} />
          }
        >
          <Text style={styles.title}>The board</Text>
          <Text style={styles.subtitle}>Short signals from others. Read, and add to one.</Text>

          {signals.map((s, i) => {
            const isMine = !!user?.id && s.author_id === user.id;
            return (
              <React.Fragment key={s.id ?? i}>
                {i > 0 && <View style={styles.rule} />}
                <SignalCard signal={s} onPress={() => s.id && openReply(s.id)} isMine={isMine} />
              </React.Fragment>
            );
          })}

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
