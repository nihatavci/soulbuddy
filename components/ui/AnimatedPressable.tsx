/**
 * components/ui/AnimatedPressable.tsx
 *
 * AnimatedInputWrapper — animated border-color focus state for TextInputs.
 * Used by auth input fields.
 *
 * NOTE: The previous press-animation wrapper has been replaced by components/ui/Button.tsx.
 * This file retains only the AnimatedInputWrapper export.
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { AppColors } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// ─── AnimatedInputWrapper ──────────────────────────────────────────────────────
// Wrap any TextInput in this to get an animated border-color focus state.
// Usage:
//   <AnimatedInputWrapper focused={isFocused} style={styles.inputWrap}>
//     <TextInput onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} ... />
//   </AnimatedInputWrapper>

interface AnimatedInputWrapperProps {
  focused: boolean;
  style?: StyleProp<ViewStyle>;
  focusColor?: string;
  blurColor?: string;
  children: React.ReactNode;
}

export function AnimatedInputWrapper({
  focused,
  style,
  focusColor = AppColors.accent,
  blurColor  = 'rgba(0,0,0,0.07)',
  children,
}: AnimatedInputWrapperProps) {
  const border = useSharedValue(blurColor);

  React.useEffect(() => {
    border.value = focused
      ? withTiming(focusColor, { duration: 250 })
      : withTiming(blurColor,  { duration: 200 });
  }, [focused]);

  const wrapStyle = useAnimatedStyle(() => ({ borderColor: border.value }));

  return (
    <Animated.View style={[style, wrapStyle]}>
      {children}
    </Animated.View>
  );
}
