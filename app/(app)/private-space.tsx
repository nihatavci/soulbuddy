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
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Icon } from '@/components/icons/Icon';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LanguageContext';
import { useMessages, useSendMessage, useDeleteMessageForEveryone } from '@/hooks/useMessages';
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useUnreadContext } from '@/context/UnreadContext';
import { useReveal } from '@/hooks/useReveal';
import { useSpaceEvents, useSendSlowDown } from '@/hooks/useSpaceEvents';
import { useReplyOwedPrompt } from '@/hooks/useReplyOwedPrompt';
import { hideMessageForMe, getHiddenIds } from '@/lib/localMessageHide';
import { Toast } from '@/components/glow';
import type { Message } from '@/services/supabase';
import {
  REPLY_SWIPE_MAX_OFFSET,
  buildThreadBubbleGesture,
  buildThreadBubbleCallbacks,
} from '@/app/(app)/private-space-gestures';

function ThreadBubble({
  message, mine, onDeletePress, onSwipeReply, allMessages, alias, currentUserId,
}: {
  message: Message;
  mine: boolean;
  /** Long-press opens the message-options Alert (delete choices — Reply is still there too, as a fallback). */
  onDeletePress: () => void;
  /** Swipe-right commit — starts a reply to this message. */
  onSwipeReply: (message: Message) => void;
  /** The already-loaded thread — used to resolve `message.reply_to_id` into a quote preview, no new query. */
  allMessages?: Message[];
  /** The other person's alias, for the quote preview's sender indicator. */
  alias?: string;
  currentUserId?: string;
}) {
  const t = useT();
  // Optimistic bubbles (not yet confirmed by the server) render at reduced
  // opacity with a small clock glyph — same bubble, no layout shift on confirm.
  const pending = (message as Message & { pending?: boolean }).pending === true;
  const deleted = !!message.deleted_at;
  const gestureEnabled = !pending && !deleted;

  // Swipe-to-reply drag offset. See private-space-gestures.ts for the
  // build-24-crash root-cause note and why this Pan gesture is safe to
  // reintroduce now (direction-constrained, no more raced LongPress).
  const translateX = useSharedValue(0);
  const { onSwipeCommit } = buildThreadBubbleCallbacks({ message, onSwipeReply });
  const { panGesture } = buildThreadBubbleGesture({
    enabled: gestureEnabled,
    translateX,
    onSwipeCommit,
  });
  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const replyIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, REPLY_SWIPE_MAX_OFFSET], [0, 1], Extrapolation.CLAMP),
  }));

  // Quote preview: resolve the replied-to message from the already-loaded
  // thread. Virtually always present (short-lived 1:1 spaces); if genuinely
  // not found, render nothing extra rather than crash or show a placeholder.
  const quoted = message.reply_to_id
    ? allMessages?.find((m) => m.id === message.reply_to_id)
    : undefined;

  // key={pending/deleted} forces a clean remount of this row instead of an
  // in-place reconcile when a bubble transitions pending -> confirmed (the
  // clock icon disappearing changes the row from 2 children to 1). Without
  // it, the Text node was sometimes reused with a stale, narrower measured
  // width left over from when the icon was still taking up row space —
  // visible on-device as short words hard-wrapping mid-character ("Hazir" /
  // "Iz" on two lines) even though the bubble had plenty of room.
  const bubbleBox = (
    <View
      key={pending ? 'pending' : deleted ? 'deleted' : 'confirmed'}
      style={[
        styles.bubble,
        mine ? styles.bubbleMine : styles.bubbleTheirs,
        pending && styles.bubblePending,
        deleted && styles.bubbleDeleted,
      ]}
    >
      {quoted && (
        <View style={styles.quotePreview}>
          <View style={styles.quotePreviewBar} />
          <View style={styles.quotePreviewBody}>
            <Text
              style={[styles.quotePreviewAlias, mine ? styles.quotePreviewTextMine : styles.quotePreviewTextTheirs]}
              numberOfLines={1}
            >
              {quoted.sender_id === currentUserId ? 'You' : alias}
            </Text>
            <Text
              style={[styles.quotePreviewText, mine ? styles.quotePreviewTextMine : styles.quotePreviewTextTheirs]}
              numberOfLines={1}
            >
              {quoted.deleted_at ? t('messages.deletedPlaceholder') : quoted.text}
            </Text>
          </View>
        </View>
      )}
      <View style={styles.bubbleInnerRow}>
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

  // Swipe right to reply (build-24 crash fixed — see the module doc in
  // private-space-gestures.ts). Long-press still opens the delete-choice
  // Alert on the plain `Pressable` below — a completely separate, native,
  // non-gesture-handler responder, so it can never contend with the Pan
  // gesture wrapping it.
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={styles.bubbleSwipeAnchor}>
        <Animated.View style={[styles.replyAffordanceIcon, replyIconAnimatedStyle]} pointerEvents="none">
          <Icon name="reply" size={16} color={AppColors.textSecondary} />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={bubbleAnimatedStyle}>
            <Pressable
              testID={`thread-bubble-${message.id}`}
              onLongPress={() => {
                if (!gestureEnabled) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDeletePress();
              }}
              delayLongPress={350}
            >
              {bubbleBox}
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

function SystemNote({
  text,
  icon = 'pause',
  onDismiss,
}: {
  text: string;
  icon?: string;
  onDismiss?: () => void;
}) {
  return (
    <View style={styles.sysNote}>
      <Icon name={icon} size={12} color={AppColors.textSecondary} />
      <Text style={styles.sysNoteText}>{text}</Text>
      {onDismiss != null && (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={8}
          style={styles.sysNoteDismiss}
        >
          <Icon name="x" size={12} color={AppColors.textSecondary} />
        </Pressable>
      )}
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
  const { showNudge: showReplyOwedNudge, dismiss: dismissReplyOwedNudge } = useReplyOwedPrompt(
    space,
    user?.id,
  );
  // Header shows the real first name once both have revealed; otherwise the alias.
  const displayName = bothRevealed && other?.first_name?.trim() ? other.first_name.trim() : alias;

  // "Delete for me" (local-only, per lib/localMessageHide.ts) needs a bit of
  // local state to re-render the filtered timeline immediately — it never
  // touches the server or the React Query cache.
  const [locallyHiddenIds, setLocallyHiddenIds] = useState<Set<string>>(new Set());
  const deleteForMe = (messageId: string) => {
    if (!spaceId) return;
    hideMessageForMe(spaceId, messageId);
    setLocallyHiddenIds((prev) => new Set(prev).add(messageId));
  };
  const runDeleteForEveryone = (messageId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteForEveryone(messageId).catch((e: any) => {
      Toast.show(e?.message || 'Could not delete. Try again.', { type: 'error', position: 'top', duration: 3200 });
    });
  };

  // Swipe right on a bubble to reply directly (see ThreadBubble's own
  // comment + private-space-gestures.ts for the build-24 crash root cause
  // and why the gesture is safe now). Long-press stays as a fallback that
  // still offers Reply alongside the delete choice(s).
  const handleSwipeReply = (message: Message) => {
    setReplyTarget(message);
  };

  // One long-press per bubble opens a single native Alert offering every
  // action for that message — Reply first (also reachable via swipe, see
  // handleSwipeReply above), then the delete choice(s), matching how
  // iMessage really behaves rather than stacking colored buttons behind a
  // swipe.
  const handleLongPress = (message: Message, mine: boolean) => {
    Haptics.selectionAsync();
    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.reply'), onPress: () => setReplyTarget(message) },
    ];
    if (mine) {
      buttons.push(
        { text: t('messages.deleteForMe'), onPress: () => deleteForMe(message.id) },
        { text: t('messages.deleteForEveryone'), style: 'destructive', onPress: () => runDeleteForEveryone(message.id) },
      );
    } else {
      // Nothing to choose between for someone else's message — you can only
      // ever hide it locally, never delete it for them.
      buttons.push({ text: t('messages.deleteForMe'), onPress: () => deleteForMe(message.id) });
    }
    Alert.alert(t('messages.messageOptionsTitle'), undefined, buttons);
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
  // The message being replied to (set by a bubble's swipe-to-reply gesture,
  // cleared on cancel or after a successful send). Last-swipe-wins: swiping a
  // different bubble replaces the active target rather than stacking.
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
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
    // Capture the active reply target before optimistically clearing draft
    // state, so a failed send can restore both text AND the reply-target
    // (mirrors the existing text capture-before-clear/restore-on-error shape).
    const pendingReplyTarget = replyTarget;
    setText('');
    setReplyTarget(null);
    try {
      await send({ text: trimmed, replyToId: pendingReplyTarget?.id ?? null });
    } catch (e: any) {
      // Send failed — restore the draft so it isn't lost, and surface the error inline.
      console.warn('[private-space] send failed', e?.message ?? e);
      setText(trimmed);
      setReplyTarget(pendingReplyTarget);
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
            {showReplyOwedNudge && (
              <SystemNote
                text={t('messages.replyOwedNudge', { alias })}
                icon="pause"
                onDismiss={dismissReplyOwedNudge}
              />
            )}
            {timeline.map((it) =>
              it.kind === 'msg' ? (
                <ThreadBubble
                  key={it.msg.id}
                  message={it.msg}
                  mine={it.msg.sender_id === user?.id}
                  onDeletePress={() => handleLongPress(it.msg, it.msg.sender_id === user?.id)}
                  onSwipeReply={handleSwipeReply}
                  allMessages={messages}
                  alias={alias}
                  currentUserId={user?.id}
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
            {replyTarget != null && (
              <View style={styles.replyStrip}>
                <View style={styles.replyStripBar} />
                <View style={styles.replyStripBody}>
                  <Text style={styles.replyStripAlias} numberOfLines={1}>
                    {t('messages.replyingTo', {
                      alias: replyTarget.sender_id === user?.id ? 'You' : alias,
                    })}
                  </Text>
                  <Text style={styles.replyStripText} numberOfLines={1}>
                    {replyTarget.deleted_at ? t('messages.deletedPlaceholder') : replyTarget.text}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setReplyTarget(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reply"
                  hitSlop={8}
                  style={styles.replyStripDismiss}
                >
                  <Icon name="x" size={14} color={AppColors.textSecondary} />
                </Pressable>
              </View>
            )}
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
                  style={[styles.sendBtn, !text.trim() && styles.sendBtnDim]}
                  onPress={handleSend}
                  disabled={isPending || !text.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  hitSlop={8}
                >
                  <Icon name="send" size={18} color="#FFFFFF" />
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
  sysNoteDismiss: {
    marginLeft: 2,
  },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  // Wraps the reply-affordance icon + the swipeable bubble so the icon can be
  // absolutely positioned just to the bubble's left, fading in as the drag
  // (translateX, applied to the bubble only) moves the bubble away from it.
  bubbleSwipeAnchor: { position: 'relative', maxWidth: '92%' },
  replyAffordanceIcon: {
    position: 'absolute',
    left: -26,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '92%',
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
  bubbleText: { fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  bubbleTextMine: { color: '#0D0D10' },
  bubbleTextTheirs: { color: '#F3EFE6' },

  // Quote preview — a small, dimmer, left-accent-barred block above a reply
  // bubble's own text (WhatsApp-style). Additive only.
  quotePreview: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(13,13,16,0.12)',
  },
  quotePreviewBar: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
    backgroundColor: AppColors.accentDeep,
  },
  quotePreviewBody: { flex: 1 },
  quotePreviewAlias: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  quotePreviewText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  quotePreviewTextMine: { color: 'rgba(13,13,16,0.6)' },
  quotePreviewTextTheirs: { color: 'rgba(243,239,230,0.65)' },

  // "Replying to" composer strip — sits directly above the input bar.
  replyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.elevated,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  replyStripBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 8,
    backgroundColor: AppColors.accentDeep,
  },
  replyStripBody: { flex: 1 },
  replyStripAlias: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 1,
  },
  replyStripText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  replyStripDismiss: {
    marginLeft: 8,
    padding: 4,
  },

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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  // Nothing typed yet — same black circle, just quieter, so the button
  // doesn't disappear (still clearly "the send button") but reads as
  // not-yet-actionable until there's something to send.
  sendBtnDim: {
    opacity: 0.35,
  },
  errorText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.error,
    marginBottom: 8,
  },
});
