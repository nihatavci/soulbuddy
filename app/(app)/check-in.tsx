/**
 * Check-in & report — two calm purposes in one screen.
 *
 * (1) A gentle self check-in about how a connection feels, and (2) a safety /
 * report path. Supportive and plain — not faux-therapy, not alarmist. One
 * single-select list spans both sections: choosing a Safety option flips the
 * primary action to "Submit report". Nothing is required; there is no wrong
 * answer. UI shell — onPress is mocked (haptic + router.back).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';

type FeatherIcon = keyof typeof Feather.glyphMap;

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

const SAFETY_OPTIONS: Option[] = [
  { value: 'report', label: 'Report this person', icon: 'flag', danger: true },
  { value: 'block', label: 'Block & end the conversation', icon: 'pause', danger: true },
];

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
      <Feather name={option.icon} size={18} color={iconColor} />
      <Text style={[styles.rowLabel, { color: tint }]}>{option.label}</Text>
      {selected && (
        <Feather name="check" size={18} color={AppColors.accent} style={styles.rowCheck} />
      )}
    </Pressable>
  );
}

export default function CheckInScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const isSafety = SAFETY_OPTIONS.some((o) => o.value === selected);
  const canSubmit = selected !== null;

  const choose = (value: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => (prev === value ? null : value));
  };

  const onDone = () => {
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
            <Feather name="x" size={22} color={AppColors.textSecondary} />
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

          <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Safety</Text>
          {SAFETY_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              option={o}
              selected={selected === o.value}
              onPress={() => choose(o.value)}
            />
          ))}

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
  footer: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: Space.lg,
  },
});
