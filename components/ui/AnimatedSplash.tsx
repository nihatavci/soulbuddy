/**
 * AnimatedSplash — the re:sense launch screen.
 *
 * An elegant, unhurried brand reveal on an ink field: a single signal-gold line
 * writes itself across the screen (a hand-drawn ink gesture, not a spinner), and
 * the wordmark rises in behind it. It covers the app from the very first frame —
 * the native splash is a matching solid ink, so there is no white flash and no
 * gap — then cross-fades away once the app is ready and the line has finished
 * drawing.
 *
 * The "written" feel comes from animating strokeDashoffset over a normalized
 * pathLength, eased so the pen accelerates and settles like a real hand.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Wordmark } from './Wordmark';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const INK = '#0D0D10';
const GOLD = '#FFD03A';
const PAPER = '#F3EFE6';

// A single continuous, organic gold gesture that sweeps down past the wordmark.
// Irregular curvature (not a clean arc) so it reads as hand-drawn ink.
const SIGNAL_PATH =
  'M 302 128 C 168 232, 372 348, 198 408 S 44 542, 214 586 S 384 662, 146 724';

// Dash length in viewBox (user) units — a safe over-estimate of the path's
// arclength so the whole line reveals as strokeDashoffset animates to 0.
const DASH = 950;

export function AnimatedSplash({
  ready,
  onFinish,
}: {
  ready: boolean;
  onFinish: () => void;
}) {
  const draw = useSharedValue(DASH); // DASH = un-drawn, 0 = fully written
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(12);
  const fade = useSharedValue(1); // whole-splash opacity
  const [drawn, setDrawn] = useState(false);

  // Write the line + bring in the wordmark on mount.
  useEffect(() => {
    draw.value = withTiming(
      0,
      { duration: 1500, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setDrawn)(true);
      },
    );
    wordOpacity.value = withDelay(520, withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }));
    wordY.value = withDelay(520, withTiming(0, { duration: 720, easing: Easing.out(Easing.cubic) }));
  }, [draw, wordOpacity, wordY]);

  // Once the app is ready AND the line is fully written, hold a beat then fade
  // the whole splash away to reveal the app.
  useEffect(() => {
    if (!ready || !drawn) return;
    fade.value = withDelay(
      260,
      withTiming(0, { duration: 460, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [ready, drawn, fade, onFinish]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <StatusBar style="light" />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <AnimatedPath
          d={SIGNAL_PATH}
          stroke={GOLD}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
          strokeDasharray={DASH}
          animatedProps={lineProps}
        />
      </Svg>
      <Animated.View style={[styles.center, wordStyle]}>
        <Wordmark size={46} color={PAPER} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
