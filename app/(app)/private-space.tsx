/**
 * Private Space — the 1:1 conversation that unlocks after a mutual resonance.
 *
 * A calm, private-first thread between two aliases. Safety is not buried in a
 * menu: a persistent strip keeps Reveal, Slow down, and Report one tap away, and
 * the header carries a shield → check-in. No read receipts, no typing indicators,
 * no urgency — the pace belongs to the two people here. Messages are read from
 * and written to the `messages` table (Supabase Realtime keeps the thread live).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/icons/Icon';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LanguageContext';
import { useMessages, useSendMessage, useDeleteMessageForEveryone } from '@/hooks/useMessages';
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useUnreadContext } from '@/context/UnreadContext';
import { useReveal } from '@/hooks/useReveal';
import { useSpaceEvents, useSendSlowDown } from '@/hooks/useSpaceEvents';
import { hideMessageForMe, getHiddenIds } from '@/lib/localMessageHide';
import { Toast } from '@/components/glow';
import type { Message } from '@/services/supabase';

function ThreadBubble({
  message, mine, onDeleteForMe, onDeleteForEveryone,
}: {
  message: Message;
  mine: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}) {
  const t = useT();
  // Optimistic bubbles (not yet confirmed by the server) render at reduced
  // opacity with a small clock glyph — same bubble, no layout shift on confirm.
  const pending = (message as Message & { pending?: boolean }).pending === true;
  const deleted = !!message.deleted_at;

  const bubble = (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View
        style={[
          styles.bubble,
          styles.bubbleInnerRow,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          pending && styles.bubblePending,
          deleted && styles.bubbleDeleted,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            mine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
            deleted && styles.bubbleTextDeleted,
          ]}
        >
          {deleted ? t('messages.deletedPlaceholder') : message.text}
        </Text>
        {pending && !deleted && (
          <Icon
            name="clock"
            size={10}
            color={mine ? AppColors.text : AppColors.background}
            style={styles.bubblePendingIcon}
          />
        )}
      </View>
    </View>
  );

  // A pending (not-yet-confirmed) or already-deleted bubble offers no swipe —
  // nothing to delete yet, or already a tombstone.
  return (
    <SwipeToDelete
      disabled={pending || deleted}
      actions={[
        { key: 'me', label: t('messages.deleteForMe'), icon: 'trash', tone: 'neutral', onPress: onDeleteForMe },
        ...(mine
          ? [{ key: 'everyone', label: t('messages.deleteForEveryone'), icon: 'trash', tone: 'danger' as const, onPress: onDeleteForEveryone }]
          : []),
      ]}
    >
      {bubble}
    </SwipeToDelete>
  );
}

function SystemNote({ text }: { text: string }) {
  return (
    <View style={styles.sysNote}>
      <Icon name="pause" size={12} color={AppColors.textSecondary} />
      <Text style={styles.sysNoteText}>{text}</Text>
    </View>
  );
}

function SafetyPill({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.pill} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Icon name={icon} size={13} color={AppColors.textSecondary} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export default function PrivateSpaceScreen() {
  const router = useRouter();
  const t = useT();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const { user } = useAuth();
  const { data: spaces } = usePrivateSpaces();
  const { data: messages = [] } = useMessages(spaceId);
  const { mutateAsync: send, isPending } = useSendMessage(spaceId ?? '');
  const { mutateAsync: deleteForEveryone } = useDeleteMessageForEveryone(spaceId ?? '');

  const { markSpaceRead } = useUnreadContext();
  const space = spaces?.find((s) => s.id === spaceId);
  const alias = space && user?.id ? otherAlias(space, user.id) : '···';

  // Reveal state + pace signals
  const { iRevealed, bothRevealed, other } = useReveal(spaceId);
  const { data: events = [] } = useSpaceEvents(spaceId);
  const { mutateAsync: sendSlowDown } = useSendSlowDown(spaceId ?? '');
  // Header shows the real first name once both have revealed; otherwise the alias.
  const displayName = bothRevealed && other?.first_name?.trim() ? other.first_name.trim() : alias;

  // "Delete for me" (local-only, per lib/localMessageHide.ts) needs a bit of
  // local state to re-render the filtered timeline immediately — it never
  // touches the server or the React Query cache.
  const [locallyHiddenIds, setLocallyHiddenIds] = useState<Set<string>>(new Set());
  const handleDeleteForMe = (messageId: string) => {
    if (!spaceId) return;
    Haptics.selectionAsync();
    hideMessageForMe(spaceId, messageId);
    setLocallyHiddenIds((prev) => new Set(prev).add(messageId));
  };
  const handleDeleteForEveryone = (messageId: string) => {
    Alert.alert(
      t('messages.deleteConfirmTitle'),
      t('messages.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('messages.deleteConfirmConfirm'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteForEveryone(messageId).catch((e: any) => {
              Toast.show(e?.message || 'Could not delete. Try again.', { type: 'error', position: 'top', duration: 3200 });
            });
          },
        },
      ],
    );
  };

  // Messages + pace nudges woven into one time-ordered timeline. Locally
  // "deleted for me" messages are filtered out entirely — the other person's
  // copy is untouched (see lib/localMessageHide.ts).
  const timeline = React.useMemo(() => {
    const items: (
      | { kind: 'msg'; at: string; msg: Message }
      | { kind: 'event'; at: string; id: string; mine: boolean }
    )[] = [
      ...messages
        .filter((m) => !locallyHiddenIds.has(m.id))
        .map((m) => ({ kind: 'msg' as const, at: m.created_at, msg: m })),
      ...events
        .filter((e) => e.kind === 'slow_down')
        .map((e) => ({ kind: 'event' as const, at: e.created_at, id: e.id, mine: e.actor_id === user?.id })),
    ];
    items.sort((a, b) => a.at.localeCompare(b.at));
    return items;
  }, [messages, events, user?.id, locallyHiddenIds]);

  const [text, setText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Load this device's previously-hidden ids for this space (persisted across
  // app restarts) — re-runs if the user navigates between spaces.
  useEffect(() => {
    if (!spaceId) return;
    setLocallyHiddenIds(getHiddenIds(spaceId));
  }, [spaceId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [timeline.length]);

  // Reading the thread clears its unread state — on open and on each new message
  // that arrives while it's on screen.
  useEffect(() => {
    if (spaceId) markSpaceRead(spaceId);
  }, [spaceId, messages.length, markSpaceRead]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !spaceId) return;
    Haptics.selectionAsync();
    setSendError(null);
    setText('');
    try {
      await send(trimmed);
    } catch (e: any) {
      // Send failed — restore the draft so it isn't lost, and surface the error inline.
      console.warn('[private-space] send failed', e?.message ?? e);
      setText(trimmed);
      setSendError(e?.message ?? 'Could not send. Try again.');
    }
  };

  const openCheckIn = () => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(app)/check-in', params: { spaceId: spaceId ?? '' } } as any);
  };
  const openReveal = () => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(app)/reveal', params: { spaceId: spaceId ?? '' } } as any);
  };
  const slowDown = async () => {
    if (!spaceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendSlowDown();
      Toast.show(`You asked to slow down. ${alias} will see a gentle nudge — no pressure.`, {
        type: 'info', position: 'top', duration: 3400,
      });
    } catch (e: any) {
      Toast.show(e?.message || 'Could not send that. Try again.', { type: 'error', position: 'top', duration: 3200 });
    }
  };

  return (
    <PaperBackground style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
            >
              <Icon name="chevron-left" size={24} color={AppColors.text} />
            </Pressable>

            <View style={styles.headerCenter}>
              <View style={styles.headerAliasRow}>
                <Icon name={bothRevealed ? 'eye' : 'lock'} size={12} color={AppColors.textSecondary} />
                <Text style={styles.headerAlias} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              <Text style={styles.headerSub}>
                {bothRevealed ? 'revealed' : iRevealed ? 'you revealed · waiting' : 'anonymous'}
              </Text>
            </View>

            {/* right spacer — keeps the title centred (safety/report lives in the strip) */}
            <View style={styles.headerBtn} />
          </View>

          {/* Safety strip */}
          <View style={styles.safetyStrip}>
            <SafetyPill
              icon="eye"
              label={bothRevealed ? 'Revealed' : iRevealed ? 'Waiting…' : 'Reveal'}
              onPress={openReveal}
            />
            <SafetyPill icon="pause" label="Slow down" onPress={slowDown} />
            <SafetyPill icon="flag" label="Report" onPress={openCheckIn} />
          </View>

          {/* Thread */}
          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text style={styles.threadNote}>
              A private space. It moves at your pace — no rush, no one watching.
            </Text>
            {timeline.map((it) =>
              it.kind === 'msg' ? (
                <ThreadBubble
                  key={it.msg.id}
                  message={it.msg}
                  mine={it.msg.sender_id === user?.id}
                  onDeleteForMe={() => handleDeleteForMe(it.msg.id)}
                  onDeleteForEveryone={() => handleDeleteForEveryone(it.msg.id)}
                />
              ) : (
                <SystemNote
                  key={it.id}
                  text={`${it.mine ? 'You' : alias} asked to slow down — take your time.`}
                />
              ),
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            {sendError != null && (
              <Text style={styles.errorText}>{sendError}</Text>
            )}
            <AnimatedInputWrapper focused={inputFocused} style={styles.input}>
              <View style={styles.inputInnerRow}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Write something…"
                  placeholderTextColor={AppColors.textSecondary}
                  value={text}
                  onChangeText={setText}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  multiline
                  returnKeyType="default"
                />
                <Pressable
                  style={styles.sendBtn}
                  onPress={handleSend}
                  disabled={isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  hitSlop={8}
                >
                  <Icon name="send" size={20} color={AppColors.accent} />
                </Pressable>
              </View>
            </AnimatedInputWrapper>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ScreenPaddingH,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  headerBtn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Space.sm },
  headerAliasRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerAlias: {
    fontFamily: Typography.fonts.heading,
    fontSize: 16,
    color: AppColors.text,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  // Safety strip
  safetyStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: ScreenPaddingH,
    paddingVertical: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.elevated,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  // Thread
  thread: { flex: 1 },
  threadContent: { paddingHorizontal: ScreenPaddingH, paddingVertical: 16 },
  threadNote: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  sysNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(13,13,16,0.05)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
  },
  sysNoteText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bubbleInnerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  // Optimistic (not-yet-confirmed) bubble — same shape, quieter presence.
  bubblePending: { opacity: 0.55 },
  bubblePendingIcon: { marginBottom: 2 },
  // Tombstone (deleted-for-everyone) — same shape, quieter and italic, no tail color distinction needed.
  bubbleDeleted: { backgroundColor: 'transparent', borderColor: 'rgba(13,13,16,0.12)' },
  bubbleTextDeleted: { fontStyle: 'italic', color: AppColors.textSecondary },
  // Mine → right, paper with a subtle ink hairline, tail at bottom-right.
  bubbleMine: {
    backgroundColor: '#ECE5D9',
    borderWidth: 1,
    borderColor: 'rgba(13,13,16,0.1)',
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 16,
  },
  // Theirs → left, dark ink, tail at bottom-left.
  bubbleTheirs: {
    backgroundColor: '#212125',
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22 },
  bubbleTextMine: { color: '#0D0D10' },
  bubbleTextTheirs: { color: '#F3EFE6' },

  // Input bar
  inputBar: {
    paddingHorizontal: ScreenPaddingH,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  input: {
    backgroundColor: AppColors.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
  },
  inputText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: AppColors.text,
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.error,
    marginBottom: 8,
  },
});
