/**
 * InkBloom — the "seal press" moment, rendered with GPU Skia. CONTAINED by design.
 *
 * Pressing the seal stamps ink onto the paper — it does NOT wash the screen:
 *   1. STRIKE   — a gold "signal" flash at the seal.
 *   2. STAMP    — a small ink blot (~90px) blooms and settles into a faint stain.
 *                 Its edge is warped by fractal-noise displacement (fiber wicking)
 *                 so it spreads along paper fibers, not as a clean circle.
 *   3. RING     — a single gold signal-ring pulses outward once, then fades.
 *   4. CAPILLARY— short ink tendrils wick a little way out from the stamp.
 *
 * The written words are lifted + faded by the composer (drift to the board), not
 * dissolved here — keeps the moment calm and legible. Deterministic geometry.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas, Group, Circle, Path, Blur, Paint, DisplacementMap, Turbulence, vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue, useDerivedValue, withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';

interface InkBloomProps {
  /** Increment this to fire the effect. */
  trigger: number;
  /** Seal contact point (screen coords). */
  x: number;
  y: number;
  onDone?: () => void;
  ink?: string;
  gold?: string;
}

const BASE = 120;        // blot radius unit in the scaling group's local space
const STAMP_R = 92;      // final stamp radius in px — small + contained

export function InkBloom({ trigger, x, y, onDone, ink = '#0D0D10', gold = '#FFD03A' }: InkBloomProps) {
  const p = useSharedValue(0);   // stamp growth 0→1
  const dry = useSharedValue(0); // set/fade 0→1

  useEffect(() => {
    if (!trigger) return;
    p.value = 0;
    dry.value = 0;
    p.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    dry.value = withDelay(
      560,
      withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }, (finished) => {
        'worklet';
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, [trigger]);

  // Ink stamp — a small blot that saturates then settles to a faint stain.
  const stampTransform = useDerivedValue(() => [{ scale: Math.max(0.0001, (p.value * STAMP_R) / BASE) }]);
  const stampOpacity = useDerivedValue(() => (0.4 + p.value * 0.32) * (1 - dry.value));
  const wickScale = useDerivedValue(() => 3 + p.value * 7); // gentle fiber displacement

  // Gold signal-ring — one outward pulse.
  const ringR = useDerivedValue(() => 18 + p.value * 128);
  const ringWidth = useDerivedValue(() => Math.max(0.2, 3 * (1 - p.value)));
  const ringOpacity = useDerivedValue(() => (1 - p.value) * (1 - dry.value) * 0.9);

  // Gold strike core.
  const coreR = useDerivedValue(() => 6 + p.value * 20);
  const coreOpacity = useDerivedValue(() => (1 - p.value) * (1 - dry.value) * 0.95);

  // Short capillary tendrils from the stamp.
  const veinEnd = useDerivedValue(() => Math.min(1, p.value * 1.2));
  const veinOpacity = useDerivedValue(() => (1 - dry.value) * 0.55);

  const veins = useMemo(() => {
    const N = 7;
    const out: string[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + 0.5;
      const L = 60 + ((i * 29) % 34); // short, deterministic
      const perp = a + Math.PI / 2;
      const ex = x + Math.cos(a) * L;
      const ey = y + Math.sin(a) * L;
      const c1x = x + Math.cos(a) * L * 0.4 + Math.cos(perp) * 12;
      const c1y = y + Math.sin(a) * L * 0.4 + Math.sin(perp) * 12;
      const c2x = x + Math.cos(a) * L * 0.75 + Math.cos(perp) * -9;
      const c2y = y + Math.sin(a) * L * 0.75 + Math.sin(perp) * -9;
      out.push(`M${x} ${y} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`);
    }
    return out;
  }, [x, y]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* short capillary tendrils */}
      <Group opacity={veinOpacity}>
        {veins.map((d, i) => (
          <Path key={i} path={d} color={ink} style="stroke" strokeWidth={1.3} strokeCap="round" end={veinEnd} />
        ))}
      </Group>

      {/* ink stamp with a fibered (displaced) edge */}
      <Group
        layer={
          <Paint>
            <DisplacementMap channelX="r" channelY="g" scale={wickScale}>
              <Turbulence freqX={0.02} freqY={0.025} octaves={2} seed={7} />
            </DisplacementMap>
          </Paint>
        }
      >
        <Group origin={vec(x, y)} transform={stampTransform}>
          <Group opacity={stampOpacity}>
            <Circle cx={x} cy={y} r={BASE * 0.6} color={ink}><Blur blur={14} /></Circle>
            <Circle cx={x + 26} cy={y - 18} r={BASE * 0.3} color={ink}><Blur blur={12} /></Circle>
            <Circle cx={x - 28} cy={y - 12} r={BASE * 0.32} color={ink}><Blur blur={12} /></Circle>
            <Circle cx={x + 16} cy={y + 22} r={BASE * 0.26} color={ink}><Blur blur={10} /></Circle>
            <Circle cx={x - 18} cy={y + 20} r={BASE * 0.24} color={ink}><Blur blur={10} /></Circle>
          </Group>
        </Group>
      </Group>

      {/* gold signal ring pulse */}
      <Group opacity={ringOpacity}>
        <Circle cx={x} cy={y} r={ringR} color={gold} style="stroke" strokeWidth={ringWidth} />
      </Group>

      {/* gold strike core */}
      <Group opacity={coreOpacity}>
        <Circle cx={x} cy={y} r={coreR} color={gold}><Blur blur={6} /></Circle>
      </Group>
    </Canvas>
  );
}
