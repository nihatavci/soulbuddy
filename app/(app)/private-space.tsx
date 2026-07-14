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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { useAuth } from '@/context/AuthContext';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useUnreadContext } from '@/context/UnreadContext';
import type { Message } from '@/services/supabase';

function ThreadBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function SafetyPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.pill} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Feather name={icon} size={13} color={AppColors.textSecondary} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export default function PrivateSpaceScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const { user } = useAuth();
  const { data: spaces } = usePrivateSpaces();
  const { data: messages = [] } = useMessages(spaceId);
  const { mutateAsync: send, isPending } = useSendMessage(spaceId ?? '');

  const { markSpaceRead } = useUnreadContext();
  const space = spaces?.find((s) => s.id === spaceId);
  const alias = space && user?.id ? otherAlias(space, user.id) : '···';

  const [text, setText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

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
    router.push('/(app)/check-in' as any);
  };
  const openReveal = () => {
    Haptics.selectionAsync();
    router.push('/(app)/reveal' as any);
  };
  const slowDown = () => {
    Haptics.selectionAsync();
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
              <Feather name="chevron-left" size={24} color={AppColors.text} />
            </Pressable>

            <View style={styles.headerCenter}>
              <View style={styles.headerAliasRow}>
                <Feather name="lock" size={12} color={AppColors.textSecondary} />
                <Text style={styles.headerAlias} numberOfLines={1}>
                  {alias}
                </Text>
              </View>
              <Text style={styles.headerSub}>anonymous</Text>
            </View>

            <Pressable
              style={styles.headerBtn}
              onPress={openCheckIn}
              accessibilityRole="button"
              accessibilityLabel="Safety and check-in"
              hitSlop={8}
            >
              <Feather name="shield" size={20} color={AppColors.textSecondary} />
            </Pressable>
          </View>

          {/* Safety strip */}
          <View style={styles.safetyStrip}>
            <SafetyPill icon="eye" label="Reveal" onPress={openReveal} />
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
            {messages.map((m) => (
              <ThreadBubble key={m.id} message={m} mine={m.sender_id === user?.id} />
            ))}
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
                  <Feather name="send" size={20} color={AppColors.accent} />
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
