/**
 * EdgeFrame — an ambient hand-inked page frame.
 *
 * On mount, a thin ink line draws itself down the LEFT edge, curves around the two
 * bottom corners, and up the RIGHT edge, settling at the top — then stays as a full
 * drawn frame. Pure decoration: pointer-transparent, low-opacity ink, plays once.
 *
 * The "drawing" is a stroke-dashoffset reveal: dash the whole path off, then animate
 * the offset to 0 so the stroke appears to be inked in one continuous motion.
 */
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppColors } from '@/constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface EdgeFrameProps {
  topInset?: number;
  bottomInset?: number;
  sideInset?: number;
  radius?: number;
  duration?: number;
  delay?: number;
}

export function EdgeFrame({
  topInset = 70,
  bottomInset = 34,
  sideInset = 16,
  radius = 30,
  duration = 1700,
  delay = 200,
}: EdgeFrameProps) {
  const { width, height } = useWindowDimensions();

  const leftX = sideInset;
  const rightX = width - sideInset;
  const topY = topInset;
  const bottomY = height - bottomInset;
  const r = Math.min(radius, (rightX - leftX) / 2 - 1);

  // U-frame: start top-left → down left → round bottom-left → across bottom →
  // round bottom-right → up right → top-right (open along the top).
  const d =
    `M${leftX} ${topY}` +
    ` V${bottomY - r}` +
    ` Q${leftX} ${bottomY} ${leftX + r} ${bottomY}` +
    ` H${rightX - r}` +
    ` Q${rightX} ${bottomY} ${rightX} ${bottomY - r}` +
    ` V${topY}`;

  // Total path length (two verticals + bottom + two quarter-circle corners).
  const L = 2 * (bottomY - r - topY) + (rightX - leftX - 2 * r) + 2 * ((Math.PI * r) / 2);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withDelay(delay, withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) }));
  }, [width, height]); // re-draw if dimensions change (rotation)

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: L * (1 - draw.value),
  }));

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedPath
        d={d}
        stroke={AppColors.text}
        strokeWidth={1.2}
        strokeOpacity={0.16}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={[L, L]}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export default EdgeFrame;
