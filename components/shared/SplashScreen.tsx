/**
 * components/shared/SplashScreen.tsx
 *
 * Apple-style animated splash.
 *
 * Sequence:
 *   0 ms   — everything invisible, background white
 *  80 ms   — app logo springs in (spring, damping 13, stiffness 110)
 * 500 ms   — gold pulse ring expands + fades
 * 820 ms   — tagline fades + slides up
 *
 * All motion runs on the native thread via react-native-reanimated.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
// ─── Brand tokens ─────────────────────────────────────────────────────────────
const GOLD  = '#E8C84A';
const GOLD_LIGHT = '#F7D96E';
const SAGE  = '#B2AC88';

// ─── Pulse geometry ──────────────────────────────────────────────────────────
const PULSE_START = 60;
const PULSE_END   = 180;

// ─── Spring preset (Apple-signature bounce) ───────────────────────────────────
const SPRING = { damping: 13, stiffness: 110, mass: 1 };

// ─── Pulse ring ───────────────────────────────────────────────────────────────
function PulseRing({ delay, color }: { delay: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const size = interpolate(progress.value, [0, 1], [PULSE_START, PULSE_END], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.15, 1], [0, 0.22, 0], Extrapolation.CLAMP);
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      opacity,
      position: 'absolute',
    };
  });

  return (
    <Animated.View
      style={[
        style,
        {
          borderWidth: 1.5,
          borderColor: color,
        },
      ]}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SplashScreen() {
  const markScale   = useSharedValue(0);
  const markOpacity = useSharedValue(0);
  const taglineY       = useSharedValue(10);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    // Logo springs in
    markOpacity.value = withDelay(80, withTiming(1, { duration: 200 }));
    markScale.value   = withDelay(80, withSpring(1, SPRING));

    // Tagline
    taglineOpacity.value = withDelay(820, withTiming(1, { duration: 480, easing: ease }));
    taglineY.value       = withDelay(820, withSpring(0, { damping: 22, stiffness: 160 }));
  }, []);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Pulse rings */}
      <View style={styles.pulseWrap}>
        <PulseRing delay={500}  color={GOLD} />
        <PulseRing delay={1200} color={GOLD_LIGHT} />
      </View>

      {/* Logo placeholder */}
      <Animated.View style={[styles.markWrap, markStyle]}>
        <View style={{ width: 180, height: 105 }} />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        your dating coach
      </Animated.Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 13,
    color: SAGE,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
    letterSpacing: 0.9,
    marginTop: 20,
  },
});
