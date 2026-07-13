/**
 * InkBloom — the "seal press" moment, rendered with GPU Skia.
 *
 * When you press the seal to leave a signal, a drop of ink strikes the paper and
 * wicks through the fibers by capillary action:
 *   1. STRIKE  — a gold "signal" flash at the contact point.
 *   2. BLOOM   — a large soft ink blot saturates outward (a blurred cluster gives
 *                an organic, irregular edge — no perfect circle).
 *   3. CAPILLARY — thin ink tendrils draw outward through the page (Path `end`
 *                grows 0→1), like ink wicking along paper fibers.
 *   4. DRY     — it all fades as the ink sets, then onDone fires.
 *
 * Deterministic geometry (no runtime randomness). Non-interactive overlay.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Group, Circle, Path, Blur, vec } from '@shopify/react-native-skia';
import {
  useSharedValue, useDerivedValue, withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';

interface InkBloomProps {
  /** Increment this to fire the effect. */
  trigger: number;
  /** Contact point (screen coords). */
  x: number;
  y: number;
  onDone?: () => void;
  ink?: string;
  gold?: string;
}

const BASE = 120; // blot radius unit in the scaling group's local space

export function InkBloom({ trigger, x, y, onDone, ink = '#0D0D10', gold = '#FFD03A' }: InkBloomProps) {
  const { width, height } = useWindowDimensions();
  const maxR = Math.hypot(width, height) * 0.85;

  const p = useSharedValue(0);   // bloom growth 0→1
  const dry = useSharedValue(0); // set/fade 0→1

  useEffect(() => {
    if (!trigger) return;
    p.value = 0;
    dry.value = 0;
    p.value = withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) });
    dry.value = withDelay(
      680,
      withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }, (finished) => {
        'worklet';
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, [trigger]);

  // Soft blot cluster: scale a group of blurred circles up from the contact point.
  const blotTransform = useDerivedValue(() => [{ scale: Math.max(0.0001, (p.value * maxR) / BASE) }]);
  const blotOpacity = useDerivedValue(() => (1 - dry.value) * 0.92);

  // Gold signal core: flashes at the strike, then recedes as ink overtakes.
  const goldR = useDerivedValue(() => 8 + p.value * 52);
  const goldOpacity = useDerivedValue(() => (1 - p.value) * (1 - dry.value) * 0.95);

  // Capillary tendrils draw outward as the bloom grows.
  const veinEnd = useDerivedValue(() => Math.min(1, p.value * 1.18));
  const veinOpacity = useDerivedValue(() => (1 - dry.value) * 0.8);

  const veins = useMemo(() => {
    const N = 9;
    const out: string[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + 0.4;
      const L = maxR * (0.4 + ((i * 37) % 22) / 100); // deterministic varied length
      const perp = a + Math.PI / 2;
      const ex = x + Math.cos(a) * L;
      const ey = y + Math.sin(a) * L;
      const c1x = x + Math.cos(a) * L * 0.35 + Math.cos(perp) * 28;
      const c1y = y + Math.sin(a) * L * 0.35 + Math.sin(perp) * 28;
      const c2x = x + Math.cos(a) * L * 0.7 + Math.cos(perp) * -22;
      const c2y = y + Math.sin(a) * L * 0.7 + Math.sin(perp) * -22;
      out.push(`M${x} ${y} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`);
    }
    return out;
  }, [x, y, maxR]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* capillary tendrils wicking through the paper */}
      <Group opacity={veinOpacity}>
        {veins.map((d, i) => (
          <Path key={i} path={d} color={ink} style="stroke" strokeWidth={1.5} strokeCap="round" end={veinEnd} />
        ))}
      </Group>

      {/* soft ink blot — blurred cluster scaled up from the contact point */}
      <Group origin={vec(x, y)} transform={blotTransform}>
        <Group opacity={blotOpacity}>
          <Circle cx={x} cy={y} r={BASE * 0.62} color={ink}><Blur blur={26} /></Circle>
          <Circle cx={x + 34} cy={y - 22} r={BASE * 0.34} color={ink}><Blur blur={22} /></Circle>
          <Circle cx={x - 38} cy={y - 14} r={BASE * 0.36} color={ink}><Blur blur={22} /></Circle>
          <Circle cx={x + 18} cy={y + 30} r={BASE * 0.3} color={ink}><Blur blur={20} /></Circle>
          <Circle cx={x - 22} cy={y + 28} r={BASE * 0.28} color={ink}><Blur blur={20} /></Circle>
        </Group>
      </Group>

      {/* gold signal core */}
      <Group opacity={goldOpacity}>
        <Circle cx={x} cy={y} r={goldR} color={gold}><Blur blur={10} /></Circle>
      </Group>
    </Canvas>
  );
}
