/**
 * components/ui/SelectableChip.tsx — multi-select pill primitive for re:sense.
 *
 * SelectableChip: a single pill ({ label, selected, onPress }) — Signal Yellow +
 * obsidian text + check when selected; Soft surface + Paper text + hairline border
 * when not. Selection is NOT color-only (a check icon + bold weight convey state,
 * WCAG 1.4.1). Restrained spring press mirrors components/ui/Button.tsx.
 *
 * ChipGroup: thin wrapper managing a string[] multi-select toggle.
 */

import React, { useCallback } from 'react';
import { Text, StyleSheet, Pressable, View, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_OUT = { damping: 15, stiffness: 300, mass: 0.8 };
const PRESS_SCALE = 0.96;

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SelectableChip({ label, selected, onPress, style }: SelectableChipProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(PRESS_SCALE, { duration: 80, easing: Easing.out(Easing.quad) });
  }, []);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_OUT);
  }, []);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff, animStyle, style]}
    >
      {selected && (
        <Ionicons name="checkmark" size={15} color={AppColors.background} style={styles.check} />
      )}
      <Text style={[styles.label, selected ? styles.labelOn : styles.labelOff]}>{label}</Text>
    </AnimatedPressable>
  );
}

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <View style={styles.group}>
      {options.map((opt) => (
        <SelectableChip
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onPress={() => toggle(opt.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999, // pill
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44, // touch target
  },
  chipOn: { backgroundColor: AppColors.accent },
  chipOff: {
    backgroundColor: AppColors.elevated,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  check: { marginRight: 6 },
  label: { fontSize: 15, letterSpacing: 0.1 },
  labelOn: { fontFamily: Typography.fonts.heading, color: AppColors.background },
  labelOff: { fontFamily: Typography.fonts.body, color: AppColors.text },
});
