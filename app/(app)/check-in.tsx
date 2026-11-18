/**
 * Check-in & report — two calm purposes in one screen.
 *
 * (1) A gentle self check-in about how a connection feels, and (2) a safety /
 * report path. Supportive and plain — not faux-therapy, not alarmist. One
 * single-select list spans both sections: choosing a Safety option flips the
 * primary action to "Submit report". Nothing is required; there is no wrong
 * answer. Report sends a report for the other person in the private space (reason picked below);
 * block ends the conversation and hides them both ways (migration 024).
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/icons/Icon';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { useT } from '@/context/LanguageContext';
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useSpaceClosurePrompt } from '@/hooks/useSpaceClosurePrompt';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/glow';
import { useBlockUser, useReport, type ReportReason } from '@/hooks/useSafety';

type FeatherIcon = string;

interface Option {
  value: string;
  label: string;
  icon: FeatherIcon;
  danger?: boolean;
}

const FEELING_OPTIONS: Option[] = [
  { value: 'good', label: 'This feels good', icon: 'heart' },
  { value: 'slower', label: 'I want to go slower', icon: 'pause' },
  { value: 'off', label: 'Something felt off', icon: 'shield' },
];

/** Stable `value`s for the Safety section — used by `isSafety` regardless of
 * whether the alias-aware labels below could be resolved. */
const SAFETY_VALUES = ['report', 'block'] as const;

const REASON_OPTIONS: (Option & { value: ReportReason })[] = [
  { value: 'harassment', label: 'Harassment or threats', icon: 'flag' },
  { value: 'sexual', label: 'Sexual or unwanted content', icon: 'flag' },
  { value: 'hate', label: 'Hate or discrimination', icon: 'flag' },
  { value: 'spam', label: 'Spam or scam', icon: 'flag' },
  { value: 'other', label: 'Something else', icon: 'flag' },
];

/**
 * Safety options are alias-aware (checkin-report-context-clarity): when a
 * `spaceId` is in context and the other participant's alias resolves, the
 * labels name them directly so the action is unambiguous. `alias` is `null`
 * when spaceId is present but the space/alias hasn't resolved yet (spaces
 * still loading, stale/deleted spaceId) — falls back to generic "this
 * person" wording rather than rendering `undefined`/empty text or crashing.
 * (Section is hidden entirely, not called with this, when spaceId is absent
 * — see `showSafety` in CheckInScreen.)
 */
function buildSafetyOptions(alias: string | null): Option[] {
  const who = alias && alias.trim().length > 0 ? alias : 'this person';
  return [
    { value: 'report', label: `Report ${who}`, icon: 'flag', danger: true },
    { value: 'block', label: `Block & end conversation with ${who}`, icon: 'pause', danger: true },
  ];
}

function OptionRow({
  option,
  selected,
  onPress,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
}) {
  const tint = option.danger ? AppColors.error : AppColors.text;
  const iconColor = option.danger ? AppColors.error : selected ? AppColors.accent : AppColors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.row, selected && styles.rowOn]}
    >
      <Icon name={option.icon} size={18} color={iconColor} />
      <Text style={[styles.rowLabel, { color: tint }]}>{option.label}</Text>
      {selected && (
        <Icon name="check" size={18} color={AppColors.accent} style={styles.rowCheck} />
      )}
    </Pressable>
  );
}

/**
 * Space-closure section — a THIRD path, deliberately separate from the
 * self-check-in "How does this feel?" list above and the Safety/report list
 * below: no OptionRow, no danger tint, no single-select tied to the
 * page-level Done/Submit action. It only renders when `useSpaceClosurePrompt`
 * says the space has been silent for SPACE_CLOSURE_SILENCE_DAYS+ and hasn't
 * been dismissed yet (see hooks/useSpaceClosurePrompt.ts). Dismissing it is
 * its own, independent, non-blocking action — it never becomes the
 * "selected" option and never changes the primary button's label.
 */
function SpaceClosureSection({ spaceId }: { spaceId: string | null }) {
  const t = useT();
  const { data: spaces } = usePrivateSpaces();
  const space = spaceId ? spaces?.find((s) => s.id === spaceId) ?? null : null;
  const { showPrompt, dismiss } = useSpaceClosurePrompt(space);

  if (!showPrompt) return null;

  const onDismiss = () => {
    Haptics.selectionAsync();
    dismiss();
  };

  return (
    <View style={styles.closureCard} accessibilityRole="summary">
      <View style={styles.closureHeader}>
        <Icon name="feather" size={16} color={AppColors.textSecondary} />
        <Text style={styles.closureTitle}>{t('checkIn.closureTitle')}</Text>
      </View>
      <Text style={styles.closureBody}>{t('checkIn.closureBody')}</Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t('checkIn.closureDismiss')}
        style={styles.closureDismissBtn}
      >
        <Text style={styles.closureDismissLabel}>{t('checkIn.closureDismiss')}</Text>
      </Pressable>
    </View>
  );
}

export default function CheckInScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const { user } = useAuth();
  const { data: spaces } = usePrivateSpaces();
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const report = useReport();
  const blockUser = useBlockUser();

  // Mirrors SpaceClosureSection's own `spaceId ? spaces?.find(...) : null`
  // lookup below — same pattern, not duplicated divergent logic.
  const space = spaceId ? spaces?.find((s) => s.id === spaceId) ?? null : null;
  const alias = space && user ? otherAlias(space, user.id) : null;

  // Option 1 (hide) per checkin-report-context-clarity: with no spaceId (or
  // an empty-string spaceId, treated equivalently to "no spaceId") there is
  // no conversation in context to report/block, so the Safety section is
  // hidden entirely rather than showing generic, ambiguous options.
  const showSafety = !!spaceId;
  const safetyOptions = useMemo(() => buildSafetyOptions(alias), [alias]);

  const isSafety = SAFETY_VALUES.some((v) => v === selected);
  const canSubmit = selected !== null && !busy && (selected !== 'report' || reason !== null);

  const choose = (value: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => (prev === value ? null : value));
  };

  // Safety submit is async (network); the plain check-in path stays synchronous.
  const submitSafety = async () => {
    // Report/block need the real conversation; never pretend it worked when it did not.
    if (!space || !user) {
      Toast.show('Could not find this conversation. Close and try again.', { type: 'error', position: 'top', duration: 3200 });
      return;
    }
    const other = space.user_a === user.id ? space.user_b : space.user_a;
    if (!other) {
      Toast.show('Could not find this conversation. Close and try again.', { type: 'error', position: 'top', duration: 3200 });
      return;
    }
    setBusy(true);
    try {
      if (selected === 'block') {
        await blockUser.mutateAsync(other);
      } else {
        await report.mutateAsync({ spaceId: space.id as string, reason: reason as ReportReason });
      }
    } catch (e: any) {
      setBusy(false);
      Toast.show(e?.message || 'Could not send. Try again.', { type: 'error', position: 'top', duration: 3200 });
      return;
    }
    setBusy(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show(selected === 'block' ? 'Blocked. You will not see each other again.' : 'Report sent. Thank you.', { type: 'success', position: 'top', duration: 3200 });
    // After a block the space is gone from the Private list, so leave it.
    if (selected === 'block') router.replace('/(app)/(tabs)/private' as any);
    else router.back();
  };

  const onDone = () => {
    if (isSafety) {
      void submitSafety();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={320} top={-120} right={-150} opacity={0.4} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            style={styles.closeBtn}
          >
            <Icon name="x" size={22} color={AppColors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Checking in</Text>
          <Text style={styles.body}>
            No wrong answer. This is just for you — and to keep re:sense safe.
          </Text>

          <Text style={styles.sectionLabel}>How does this feel?</Text>
          {FEELING_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              option={o}
              selected={selected === o.value}
              onPress={() => choose(o.value)}
            />
          ))}

          {showSafety && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Safety</Text>
              {safetyOptions.map((o) => (
                <OptionRow
                  key={o.value}
                  option={o}
                  selected={selected === o.value}
                  onPress={() => choose(o.value)}
                />
              ))}
              {selected === 'report' && (
                <>
                  <Text style={[styles.sectionLabel, styles.sectionSpaced]}>What happened?</Text>
                  {REASON_OPTIONS.map((o) => (
                    <OptionRow
                      key={o.value}
                      option={o}
                      selected={reason === o.value}
                      onPress={() => { Haptics.selectionAsync(); setReason((prev) => (prev === o.value ? null : o.value)); }}
                    />
                  ))}
                </>
              )}
            </>
          )}

          <SpaceClosureSection spaceId={spaceId ?? null} />

          <Button
            label={isSafety ? 'Submit report' : 'Done'}
            variant="primary"
            size="lg"
            onPress={onDone}
            disabled={!canSubmit}
            style={styles.doneBtn}
          />

          <Text style={styles.footer}>
            If you’re in danger, contact local emergency services.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  closeBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  scroll: { paddingTop: 8, paddingBottom: 40 },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 30,
    letterSpacing: -0.5,
    color: AppColors.text,
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textSecondary,
    marginTop: Space.xs,
    marginBottom: Space.xl,
    maxWidth: 320,
  },
  sectionLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: AppColors.textSecondary,
    marginBottom: Space.sm,
  },
  sectionSpaced: { marginTop: Space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    backgroundColor: AppColors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 14,
    marginBottom: Space.sm,
  },
  rowOn: {
    backgroundColor: 'rgba(255,208,58,0.14)',
    borderColor: AppColors.accent,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
  },
  rowCheck: { marginLeft: Space.sm },
  doneBtn: {
    marginTop: Space.xl,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  closureCard: {
    marginTop: Space.xl,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppColors.textSecondary + '55',
    padding: 14,
  },
  closureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    marginBottom: Space.xs,
  },
  closureTitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: AppColors.textSecondary,
  },
  closureBody: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textSecondary,
    marginBottom: Space.sm,
  },
  closureDismissBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closureDismissLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.textSecondary,
    textDecorationLine: 'underline',
  },
  footer: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: Space.lg,
  },
});
