/**
 * SealMark — the seal drawn in the SAME noisy ink style as the bloom.
 *
 * At rest it's a small ragged ink blob (fractal-noise displaced edge, ink-density
 * falloff) with two white colon dots. Press-and-hold (`hold` 0→1) grows the ink
 * bigger and rougher, and the two dots orbit like an atom (`spin`) and spiral in
 * to collide. Consistent with InkBloom so the seal and its spread read as one drop.
 */

import React from 'react';
import { Canvas, Group, Circle, DisplacementMap, Turbulence, Paint, RadialGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const INK = '#0D0D10';
const DOT = '#F5F1E8'; // white colon
const REST_ORBIT = 7;

interface SealMarkProps {
  hold: SharedValue<number>;
  spin: SharedValue<number>;
  enabled: boolean;
  size?: number;
}

export function SealMark({ hold, spin, enabled, size = 96 }: SealMarkProps) {
  const c = size / 2;

  // Ink blob grows + roughens with the hold.
  const rDisc = useDerivedValue(() => 18 + hold.value * 28);
  const disp = useDerivedValue(() => 4 + hold.value * 11);

  // White dots orbit and spiral inward to collide.
  const orbit = useDerivedValue(() => REST_ORBIT * (1 - hold.value * 0.85) + 0.8);
  const a1 = useDerivedValue(() => spin.value - Math.PI / 2);
  const a2 = useDerivedValue(() => spin.value + Math.PI / 2);
  const d1x = useDerivedValue(() => c + Math.cos(a1.value) * orbit.value);
  const d1y = useDerivedValue(() => c + Math.sin(a1.value) * orbit.value);
  const d2x = useDerivedValue(() => c + Math.cos(a2.value) * orbit.value);
  const d2y = useDerivedValue(() => c + Math.sin(a2.value) * orbit.value);

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Group opacity={enabled ? 1 : 0.34}>
        {/* noisy ink blob — same treatment as InkBloom */}
        <Group
          layer={
            <Paint>
              <DisplacementMap channelX="r" channelY="g" scale={disp}>
                <Turbulence freqX={0.08} freqY={0.09} octaves={3} seed={4} />
              </DisplacementMap>
            </Paint>
          }
        >
          <Circle cx={c} cy={c} r={rDisc}>
            <RadialGradient
              c={vec(c, c)}
              r={rDisc}
              colors={[INK, INK, 'rgba(13,13,16,0)']}
              positions={[0, 0.62, 1]}
            />
          </Circle>
        </Group>

        {/* white colon dots */}
        <Circle cx={d1x} cy={d1y} r={2.9} color={DOT} />
        <Circle cx={d2x} cy={d2y} r={2.9} color={DOT} />
      </Group>
    </Canvas>
  );
}
