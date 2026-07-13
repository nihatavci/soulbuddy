/**
 * InkBloom — the "seal press" moment, rendered with GPU Skia.
 *
 * Pressing the seal strikes ink onto the paper and it wicks through the fibers:
 *   1. STRIKE     — a gold "signal" flash at the contact point.
 *   2. BLOOM      — a soft ink blot saturates outward. Its edge is warped by a
 *                   fractal-noise DisplacementMap (FIBER WICKING) so it spreads
 *                   along irregular paper fibers instead of as a clean circle.
 *   3. CAPILLARY  — thin ink tendrils draw outward (Path `end` 0→1).
 *   4. ABSORBED   — the words you wrote (rendered in Skia Special Elite) feather
 *                   and dissolve into the ink via ramping blur + displacement.
 *   5. DRY        — it all settles, then onDone fires.
 *
 * Deterministic geometry (no runtime randomness). Non-interactive overlay.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas, Group, Circle, Path, Blur, Paint, DisplacementMap, Turbulence, Text as SkText,
  vec, useFont,
} from '@shopify/react-native-skia';
import {
  useSharedValue, useDerivedValue, withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';

const SPECIAL_ELITE = require('@/assets/fonts/SpecialElite-Regular.ttf');

interface InkBloomProps {
  /** Increment this to fire the effect. */
  trigger: number;
  /** Contact point (screen coords). */
  x: number;
  y: number;
  onDone?: () => void;
  ink?: string;
  gold?: string;
  /** The words to absorb into the ink (optional). */
  text?: string;
  textX?: number;
  textY?: number;
  textW?: number;
}

const BASE = 120;         // blot radius unit in the scaling group's local space
const FONT_SIZE = 21;
const LINE_H = 32;

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 5);
}

export function InkBloom({
  trigger, x, y, onDone, ink = '#0D0D10', gold = '#FFD03A',
  text = '', textX = 40, textY = 180, textW = 260,
}: InkBloomProps) {
  const { width, height } = useWindowDimensions();
  const maxR = Math.hypot(width, height) * 0.85;
  const font = useFont(SPECIAL_ELITE, FONT_SIZE);

  const p = useSharedValue(0);   // bloom growth 0→1
  const dry = useSharedValue(0); // set/fade 0→1

  useEffect(() => {
    if (!trigger) return;
    p.value = 0;
    dry.value = 0;
    p.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    dry.value = withDelay(
      720,
      withTiming(1, { duration: 780, easing: Easing.inOut(Easing.quad) }, (finished) => {
        'worklet';
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, [trigger]);

  // ── Fiber-wicked ink blot ────────────────────────────────────────────────
  const blotTransform = useDerivedValue(() => [{ scale: Math.max(0.0001, (p.value * maxR) / BASE) }]);
  const blotOpacity = useDerivedValue(() => (1 - dry.value) * 0.94);
  const wickScale = useDerivedValue(() => 6 + p.value * 26); // displacement grows as it spreads

  // ── Gold signal core ───────────────────────────────────────────────────────
  const goldR = useDerivedValue(() => 8 + p.value * 52);
  const goldOpacity = useDerivedValue(() => (1 - p.value) * (1 - dry.value) * 0.95);

  // ── Capillary tendrils ──────────────────────────────────────────────────────
  const veinEnd = useDerivedValue(() => Math.min(1, p.value * 1.18));
  const veinOpacity = useDerivedValue(() => (1 - dry.value) * 0.8);

  // ── Words absorbed into the ink ──────────────────────────────────────────────
  const wordsBlur = useDerivedValue(() => p.value * 13);
  const wordsDisp = useDerivedValue(() => p.value * 20);
  const wordsOpacity = useDerivedValue(() =>
    p.value < 0.18 ? p.value / 0.18 : Math.max(0, 1 - (p.value - 0.18) / 0.6),
  );

  const veins = useMemo(() => {
    const N = 9;
    const out: string[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + 0.4;
      const L = maxR * (0.4 + ((i * 37) % 22) / 100);
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

  const maxChars = Math.max(8, Math.floor((textW || 260) / 11));
  const lines = useMemo(() => (text ? wrapLines(text, maxChars) : []), [text, maxChars]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* capillary tendrils wicking through the paper */}
      <Group opacity={veinOpacity}>
        {veins.map((d, i) => (
          <Path key={i} path={d} color={ink} style="stroke" strokeWidth={1.5} strokeCap="round" end={veinEnd} />
        ))}
      </Group>

      {/* soft ink blot with a fractal-noise displaced (fibered) edge */}
      <Group
        layer={
          <Paint>
            <DisplacementMap channelX="r" channelY="g" scale={wickScale}>
              <Turbulence freqX={0.015} freqY={0.02} octaves={3} seed={7} />
            </DisplacementMap>
          </Paint>
        }
      >
        <Group origin={vec(x, y)} transform={blotTransform}>
          <Group opacity={blotOpacity}>
            <Circle cx={x} cy={y} r={BASE * 0.62} color={ink}><Blur blur={24} /></Circle>
            <Circle cx={x + 34} cy={y - 22} r={BASE * 0.34} color={ink}><Blur blur={20} /></Circle>
            <Circle cx={x - 38} cy={y - 14} r={BASE * 0.36} color={ink}><Blur blur={20} /></Circle>
            <Circle cx={x + 18} cy={y + 30} r={BASE * 0.3} color={ink}><Blur blur={18} /></Circle>
            <Circle cx={x - 22} cy={y + 28} r={BASE * 0.28} color={ink}><Blur blur={18} /></Circle>
          </Group>
        </Group>
      </Group>

      {/* the words feather + dissolve into the ink */}
      {font && lines.length > 0 && (
        <Group
          layer={
            <Paint opacity={wordsOpacity}>
              <Blur blur={wordsBlur} />
              <DisplacementMap channelX="r" channelY="g" scale={wordsDisp}>
                <Turbulence freqX={0.02} freqY={0.03} octaves={2} seed={3} />
              </DisplacementMap>
            </Paint>
          }
        >
          {lines.map((ln, i) => (
            <SkText key={i} x={textX} y={textY + 18 + i * LINE_H} text={ln} font={font} color={ink} />
          ))}
        </Group>
      )}

      {/* gold signal core */}
      <Group opacity={goldOpacity}>
        <Circle cx={x} cy={y} r={goldR} color={gold}><Blur blur={10} /></Circle>
      </Group>
    </Canvas>
  );
}
