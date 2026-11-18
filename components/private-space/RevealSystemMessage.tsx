/**
 * RevealSystemMessage — the visible, tappable notice a reveal posts into the
 * private-space thread (FEAT-4).
 *
 * Deliberately styled to read as an EVENT, not a normal chat bubble and not
 * a pace nudge:
 *  - owns its own StyleSheet in this file — shares none of the relocated
 *    `bubbleStyles.bubble` / `bubbleMine` / `bubbleTheirs` keys (exported by
 *    `app/(app)/private-space-bubble-style.ts`, FEAT-1), so the "distinct
 *    from normal bubbles" contract holds by construction, not by
 *    convention. (Citation kept as a symbol/module reference, not a
 *    `file:line`, so a future relocation cannot make it stale again.)
 *  - visually distinct from `SystemNote`'s flat grey pill (the `sysNote`
 *    style in `private-space.tsx`'s `StyleSheet.create` block) — uses the
 *    `eye` icon (matching `private-space.tsx`'s header alias icon and
 *    `reveal.tsx`'s emblem icon) and an accent border treatment instead.
 *
 * Tap dispatch is driven entirely by the `outcome` prop (from
 * `lib/revealTransition.ts` via `app/(app)/private-space-timeline.ts`) —
 * this component makes no reveal-state decisions of its own:
 *  - `prompt-reciprocal` -> confirm/cancel Alert; confirming invokes
 *    `onConfirmReveal` (wired by the screen to its EXISTING `openReveal`,
 *    which pushes the real `/(app)/reveal` consent screen — never a
 *    bespoke inline action, so the consent checkbox is never bypassed).
 *  - `already-mutual` / `passive-confirm` -> informational alert only.
 *  - `noop` -> no alert at all.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { AppColors, Typography } from '@/constants/theme';
import { useT } from '@/context/LanguageContext';
import type { RevealTapOutcome } from '@/lib/revealTransition';

export interface RevealSystemMessageProps {
  /** True when the current viewer authored the underlying reveal event. */
  mine: boolean;
  /** The other participant's alias — interpolated into the "theirs" copy and prompts. */
  alias: string;
  outcome: RevealTapOutcome;
  /** Invoked only when the tapper confirms a `prompt-reciprocal` alert. */
  onConfirmReveal: () => void;
  /**
   * ISO-8601 `created_at` of the underlying `kind='reveal'` `space_events`
   * row (`TimelineRevealItem.at`, `app/(app)/private-space-timeline.ts`).
   * Used ONLY to render an immutable, point-in-time fact in the prompt
   * title ("revealed their name AT <time>") — never to infer whether the
   * other person's reveal is still active. `space_events` has no DELETE
   * policy (FORK-4 Q3(i)), so this timestamp never changes once posted,
   * even if the underlying `space_reveals` row is later withdrawn
   * (`hooks/useReveal.ts` `withdraw`, which touches only `space_reveals`).
   */
  at: string;
  /**
   * Test-only injection point for `formatEventTimeLocal` (R2 fix).
   * Production call sites never pass this — they get the real local-time
   * default. Tests inject a fixed-zone formatter instead of hardcoding a
   * zone into shipped code, so the suite stays deterministic on every
   * machine/CI runner regardless of its own local timezone.
   */
  formatEventTime?: (iso: string) => string;
}

/**
 * Default formatter for the immutable-fact prompt title — renders the
 * VIEWER'S OWN LOCAL time (device/host timezone), deliberately NOT a fixed
 * zone: a bare "at HH:MM" reading with no timezone label must match what the
 * reader's own clock would show, or it silently lies by up to +/-14 hours.
 * No `timeZone` option is passed, so `Intl.DateTimeFormat` falls back to its
 * runtime-resolved local zone (proven in
 * `__tests__/reveal-system-message.test.tsx` by spying on the constructor
 * call, not by trusting this comment). Test determinism is achieved by
 * INJECTING a fixed-zone formatter via the `formatEventTime` prop, never by
 * hardcoding a zone into this shipped default (R2 fix — the prior version
 * hardcoded `timeZone: 'UTC'` here purely for test convenience, which made
 * every non-UTC user see a wrong, unlabeled clock time).
 */
export function formatEventTimeLocal(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function RevealSystemMessage({
  mine,
  alias,
  outcome,
  onConfirmReveal,
  at,
  formatEventTime = formatEventTimeLocal,
}: RevealSystemMessageProps) {
  const t = useT();
  const label = mine ? t('reveal.eventMine') : t('reveal.eventTheirs', { alias });

  const handlePress = () => {
    if (outcome === 'noop') return;
    if (outcome === 'prompt-reciprocal') {
      // R2 fix: both the title and body must read as an immutable
      // historical fact and must NOT assert the other person's name is
      // currently available, nor promise reciprocating will definitely
      // reveal it — a withdrawal can make that false and this component has
      // no RLS-legible way to detect it (Option A, approved; see module doc).
      Alert.alert(t('reveal.promptTitle', { alias, time: formatEventTime(at) }), t('reveal.promptBody', { alias }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('reveal.promptConfirm'), onPress: onConfirmReveal },
      ]);
      return;
    }
    if (outcome === 'already-mutual') {
      Alert.alert(t('reveal.mutualTitle'), t('reveal.mutualBody', { alias }));
      return;
    }
    // 'passive-confirm'
    Alert.alert(t('reveal.passiveTitle'), t('reveal.passiveBody', { alias }));
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.container}
    >
      <View style={styles.pill}>
        <Icon name="eye" size={12} color={AppColors.accentDeep} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default RevealSystemMessage;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.accentLight,
    borderWidth: 1,
    borderColor: AppColors.accentMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: AppColors.text,
  },
});
