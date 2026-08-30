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
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/icons/Icon';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Wordmark } from '@/components/ui/Wordmark';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { useSignals, useDeleteSignal } from '@/hooks/useSignals';
import { useFreshStart } from '@/hooks/useFreshStart';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LanguageContext';
import { SignalUnreadProvider, useSignalUnread } from '@/context/SignalUnreadContext';
import { Toast } from '@/components/glow';
import type { PublicSignal } from '@/services/supabase';

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function SignalCard({
  signal, onPress, isMine, unseenCount, onMarkSeen, onDelete,
}: {
  signal: PublicSignal;
  onPress: () => void;
  isMine: boolean;
  unseenCount: number;
  onMarkSeen: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const replyCount = signal.reply_count ?? 0;
  // My own signals aren't tappable into the reply composer (nothing to add to
  // your own signal) — but tapping still "opens" it, which is what clears the
  // unseen-addition marker (Zeigarnik-style unfinished state → resolved on view,
  // no read receipt is ever sent back to the replier — this only updates MY
  // local last-seen-count, nothing is written server-side or shown to them).
  const handlePress = isMine ? onMarkSeen : onPress;
  const card = (
    <Pressable style={styles.card} onPress={handlePress} accessibilityRole="button">
      <View style={styles.cardHead}>
        <Text style={styles.alias}>{signal.alias}</Text>
        <Text style={styles.meta}>{signal.created_at ? timeAgo(signal.created_at) : ''}</Text>
      </View>
      <Text style={styles.signalText}>{signal.text}</Text>
      <View style={styles.cardFoot}>
        <Icon name="corner-up-left" size={14} color={AppColors.textSecondary} />
        <Text style={styles.footText}>
          {isMine ? 'your signal' : replyCount === 0 ? 'add to this' : `${replyCount} added`}
        </Text>
        {isMine && unseenCount > 0 && (
          <View style={styles.unseenMarker} accessibilityLabel={t('board.unreadAddition', { count: unseenCount })}>
            <View style={styles.unseenDot} />
            <Text style={styles.unseenText}>{t('board.unreadAddition', { count: unseenCount })}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  // Only your own signal can be deleted — swiping someone else's card does nothing.
  if (!isMine) return card;
  return (
    <SwipeToDelete actions={[{ key: 'delete', label: t('board.deleteSignal'), icon: 'trash', tone: 'danger', onPress: onDelete }]}>
      {card}
    </SwipeToDelete>
  );
}

// SignalUnreadProvider is mounted here, scoped to the Board screen — the
// marker has no cross-tab surface (unlike UnreadContext's private-space
// badge), so there's no need to hoist it to the app-root layout.
export default function BoardScreen() {
  return (
    <SignalUnreadProvider>
      <BoardScreenInner />
    </SignalUnreadProvider>
  );
}

function BoardScreenInner() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
  const { data: signals = [], isFetching, refetch } = useSignals();
  const { isFreshStart, todayCount } = useFreshStart(signals, user?.id);
  const { countFor, markSignalRead } = useSignalUnread();
  const { mutateAsync: deleteSignal } = useDeleteSignal();

  const openReply = (id: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(app)/reply-composer', params: { signalId: id } } as any);
  };

  // Explicit product decision: always deletable, cascade included — if a
  // reply already opened a private space from this signal, deleting it
  // removes that conversation for the other person too (see migration
  // 018_resense_delete_message_signal.sql and hooks/useSignals.ts). The
  // confirm copy says so plainly rather than hiding the consequence.
  const confirmDeleteSignal = (id: string, hasReplies: boolean) => {
    Alert.alert(
      t('board.deleteConfirmTitle'),
      hasReplies ? t('board.deleteConfirmBodyWithConversation') : t('board.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('board.deleteConfirmConfirm'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSignal(id).catch((e: any) => {
              Toast.show(e?.message || 'Could not delete. Try again.', { type: 'error', position: 'top', duration: 3200 });
            });
          },
        },
      ],
    );
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
          <Text style={styles.subtitle}>
            {isFreshStart
              ? todayCount > 0
                ? t('board.freshStart.subtitleWithCount', { count: todayCount })
                : t('board.freshStart.subtitleEmpty')
              : 'Short signals from others. Read, and add to one.'}
          </Text>

          {signals.map((s, i) => {
            const isMine = !!user?.id && s.author_id === user.id;
            const replyCount = s.reply_count ?? 0;
            return (
              <React.Fragment key={s.id ?? i}>
                {i > 0 && <View style={styles.rule} />}
                <SignalCard
                  signal={s}
                  onPress={() => s.id && openReply(s.id)}
                  isMine={isMine}
                  unseenCount={countFor(s.id)}
                  onMarkSeen={() => s.id && markSignalRead(s.id, replyCount)}
                  onDelete={() => s.id && confirmDeleteSignal(s.id, replyCount > 0)}
                />
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
  // Calm, persistent "unseen addition" marker — a small ink dot + short label,
  // distinct from the "N added" popularity-flavored footText above. Signals
  // "not yet seen by you", never a streak/urgency/points callout.
  unseenMarker: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 8 },
  unseenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AppColors.text, opacity: 0.6 },
  unseenText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.text, fontStyle: 'italic' },
  end: {
    fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary,
    textAlign: 'center', marginTop: 16, opacity: 0.7,
  },
});
