/**
 * SealMark — the ink seal with the gold "re:" colon that comes alive on hold.
 *
 * The disc stays a solid ink circle. The two gold dots orbit the centre like an
 * atom (`spin`), and as you press-and-hold (`hold` 0→1) their orbit shrinks so
 * they spiral inward and collide. At rest (spin 0, hold 0) they sit as a calm
 * vertical colon.
 */

import React from 'react';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const INK = '#0D0D10';
const GOLD = '#FFD03A';
const REST_ORBIT = 7;

interface SealMarkProps {
  hold: SharedValue<number>;
  spin: SharedValue<number>;
  enabled: boolean;
  size?: number;
}

export function SealMark({ hold, spin, enabled, size = 56 }: SealMarkProps) {
  const c = size / 2;

  const orbit = useDerivedValue(() => REST_ORBIT * (1 - hold.value * 0.85) + 0.8);
  const a1 = useDerivedValue(() => spin.value - Math.PI / 2);
  const a2 = useDerivedValue(() => spin.value + Math.PI / 2);
  const d1x = useDerivedValue(() => c + Math.cos(a1.value) * orbit.value);
  const d1y = useDerivedValue(() => c + Math.sin(a1.value) * orbit.value);
  const d2x = useDerivedValue(() => c + Math.cos(a2.value) * orbit.value);
  const d2y = useDerivedValue(() => c + Math.sin(a2.value) * orbit.value);

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Group opacity={enabled ? 1 : 0.3}>
        <Circle cx={c} cy={c} r={c - 3} color={INK} />
        <Circle cx={d1x} cy={d1y} r={3} color={GOLD} />
        <Circle cx={d2x} cy={d2y} r={3} color={GOLD} />
      </Group>
    </Canvas>
  );
}
