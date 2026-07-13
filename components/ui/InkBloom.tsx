/**
 * InkBloom — a grainy, misty ink circle that grows with a hold gesture.
 *
 * "sisli, dağınık" — misty and scattered, not a solid blob. It's the real
 * charcoal grain texture masked into a soft-edged circle (so it reads as
 * scattered ink specks) over a very faint ink haze. Both grow with `progress`
 * and stay low-opacity so the ink never looks solid.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Group, Circle, Blur, Mask, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const GRAIN = require('@/assets/textures/tex-charcoal.png');
const MAXR = 104;
const PAD = 24;

interface InkBloomProps {
  /** Hold progress 0→1. */
  progress: SharedValue<number>;
  x: number;
  y: number;
  ink?: string;
}

export function InkBloom({ progress, x, y, ink = '#0D0D10' }: InkBloomProps) {
  const grain = useImage(GRAIN);

  const rBody = useDerivedValue(() => 8 + progress.value * MAXR);
  const rMask = useDerivedValue(() => 8 + progress.value * (MAXR + 6));
  const bodyOpacity = useDerivedValue(() => Math.min(0.2, progress.value * 0.28)); // faint haze
  const grainOpacity = useDerivedValue(() => Math.min(0.5, progress.value * 0.62)); // scattered grain

  const g = MAXR + PAD;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* faint misty haze */}
      <Group opacity={bodyOpacity}>
        <Circle cx={x} cy={y} r={rBody} color={ink}><Blur blur={26} /></Circle>
      </Group>

      {/* scattered grain, masked to a soft (blurred) circle → misty, non-solid */}
      {grain && (
        <Group opacity={grainOpacity}>
          <Mask mode="alpha" mask={<Circle cx={x} cy={y} r={rMask} color="white"><Blur blur={16} /></Circle>}>
            <SkiaImage image={grain} x={x - g} y={y - g} width={g * 2} height={g * 2} fit="cover" />
          </Mask>
        </Group>
      )}
    </Canvas>
  );
}
