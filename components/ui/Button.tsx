/**
 * components/ui/Button.tsx
 *
 * Premium pill button — 4 variants (primary / secondary / ghost / dark),
 * 3 sizes (sm / md / lg), optional leading icon, spring-press animation.
 *
 * Design reference: cinematic app store buttons with generous padding,
 * high contrast, and icon + text side by side.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, AccentColors, Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_OUT = { damping: 15, stiffness: 300, mass: 0.8, overshootClamping: false };
const PRESS_SCALE = 0.97;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  style,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(PRESS_SCALE, { duration: 80, easing: Easing.out(Easing.quad) });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_OUT);
  }, []);

  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size];
  const isGradient = variant === 'gradient' || variant === 'primary';
  const variantStyle = VARIANT_STYLES[isGradient ? 'primary' : variant];
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
  // re:sense: primary/gradient are Signal Yellow → obsidian text (design.md);
  // dark variant keeps white text; others use their variant text color.
  const textColor = isGradient
    ? AppColors.background
    : variant === 'dark'
      ? '#FFFFFF'
      : variantStyle.text.color;

  const content = loading ? (
    <ActivityIndicator
      size="small"
      color={isGradient ? AppColors.background : variant === 'dark' ? '#FFFFFF' : AppColors.accent}
    />
  ) : (
    <View style={styles.inner}>
      {icon && (
        <Feather
          name={icon}
          size={iconSize}
          color={textColor}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[styles.label, sizeStyle.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );

  if (isGradient) {
    return (
      <AnimatedPressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          sizeStyle.container,
          isDisabled && styles.disabled,
          animStyle,
          { overflow: 'hidden' },
          style,
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={[...AccentColors.ctaGradient]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        isDisabled && styles.disabled,
        animStyle,
        style,
      ]}
      testID={testID}
    >
      {content}
    </AnimatedPressable>
  );
}

// --- Variant styles ---
const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: any }> = {
  primary: {
    container: {
      backgroundColor: AppColors.accent,
      ...Platform.select({
        ios: {
          shadowColor: AppColors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
      }),
    },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    container: {
      backgroundColor: AppColors.background,
      borderWidth: 1.5,
      borderColor: AppColors.border,
    },
    text: { color: AppColors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: AppColors.accent },
  },
  dark: {
    container: {
      backgroundColor: AppColors.text,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
      }),
    },
    text: { color: '#FFFFFF' },
  },
  gradient: {
    container: {
      backgroundColor: AppColors.accent,
      ...Platform.select({
        ios: {
          shadowColor: AppColors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
        },
        android: { elevation: 6 },
      }),
    },
    text: { color: '#FFFFFF' },
  },
};

// --- Size styles ---
const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: any }> = {
  sm: {
    container: { height: 40, paddingHorizontal: 20 },
    text: { fontSize: 13 },
  },
  md: {
    container: { height: 50, paddingHorizontal: 28 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { height: 56, paddingHorizontal: 36 },
    text: { fontSize: 16 },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.fonts.heading,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.4,
  },
});
