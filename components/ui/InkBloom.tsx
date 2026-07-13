/**
 * InkBloom — a single soft ink blot that grows with a hold gesture.
 *
 * Simple by intent: as you press-and-hold the seal, `progress` (0→1) drives the
 * ink bigger. No rings, no tendrils, no word-dissolve — just ink finding paper.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Group, Circle, Blur } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

interface InkBloomProps {
  /** Hold progress 0→1. */
  progress: SharedValue<number>;
  x: number;
  y: number;
  ink?: string;
}

export function InkBloom({ progress, x, y, ink = '#0D0D10' }: InkBloomProps) {
  const rOuter = useDerivedValue(() => 8 + progress.value * 92);
  const rInner = useDerivedValue(() => 3 + progress.value * 42);
  const opacity = useDerivedValue(() => Math.min(0.55, progress.value * 0.7));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group opacity={opacity}>
        <Circle cx={x} cy={y} r={rOuter} color={ink}><Blur blur={22} /></Circle>
        <Circle cx={x} cy={y} r={rInner} color={ink}><Blur blur={10} /></Circle>
      </Group>
    </Canvas>
  );
}
