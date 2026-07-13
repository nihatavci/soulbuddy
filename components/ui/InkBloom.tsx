/**
 * InkBloom — an ink DROP that spreads as you hold ("mürekkep damlamış gibi").
 *
 * Not a clean circle. The blob + its satellite spatter are warped by fractal-
 * noise displacement so the edge is irregular and organic; a radial ink-density
 * falloff makes the centre dense and the edge bleed; the real charcoal grain is
 * masked over the top for speckle. Everything grows with `progress` (0→1).
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas, Group, Circle, Blur, Paint, DisplacementMap, Turbulence, RadialGradient,
  Mask, Image as SkiaImage, useImage, vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const GRAIN = require('@/assets/textures/tex-charcoal.png');
const BASE = 100;   // main blob radius in the scaling group's local space
const MAXR = 92;    // final blob radius in px
const PAD = 60;     // extra room for satellites + displacement

// Deterministic satellite spatter (offsets in local space around the centre).
const SATELLITES = [
  { dx: 66, dy: -36, r: 15 },
  { dx: -60, dy: -22, r: 12 },
  { dx: 32, dy: 58, r: 11 },
  { dx: -42, dy: 50, r: 9 },
  { dx: 82, dy: 22, r: 8 },
  { dx: -78, dy: 10, r: 7 },
  { dx: 8, dy: -70, r: 8 },
];

interface InkBloomProps {
  /** Hold progress 0→1. */
  progress: SharedValue<number>;
  x: number;
  y: number;
  ink?: string;
}

export function InkBloom({ progress, x, y, ink = '#0D0D10' }: InkBloomProps) {
  const grain = useImage(GRAIN);

  const transform = useDerivedValue(() => [{ scale: 0.05 + progress.value * (MAXR / BASE) }]);
  const bodyOpacity = useDerivedValue(() => Math.min(0.85, 0.15 + progress.value * 0.85));
  const disp = useDerivedValue(() => 14 + progress.value * 34); // strong, ragged ink edge
  const rGrainMask = useDerivedValue(() => 10 + progress.value * (MAXR + 8));
  const grainOpacity = useDerivedValue(() => Math.min(0.8, progress.value * 0.95));

  const g = MAXR + PAD;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* irregular ink drop + spatter, warped by fractal-noise displacement */}
      <Group
        opacity={bodyOpacity}
        layer={
          <Paint>
            <DisplacementMap channelX="r" channelY="g" scale={disp}>
              <Turbulence freqX={0.06} freqY={0.075} octaves={4} seed={9} />
            </DisplacementMap>
            <Blur blur={1} />
          </Paint>
        }
      >
        <Group origin={vec(x, y)} transform={transform}>
          <Circle cx={x} cy={y} r={BASE}>
            <RadialGradient
              c={vec(x, y)}
              r={BASE}
              colors={[ink, ink, 'rgba(13,13,16,0)']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
          {SATELLITES.map((s, i) => (
            <Circle key={i} cx={x + s.dx} cy={y + s.dy} r={s.r} color={ink} />
          ))}
        </Group>
      </Group>

      {/* charcoal grain speckle over the drop */}
      {grain && (
        <Group opacity={grainOpacity}>
          <Mask mode="alpha" mask={<Circle cx={x} cy={y} r={rGrainMask} color="white"><Blur blur={14} /></Circle>}>
            <SkiaImage image={grain} x={x - g} y={y - g} width={g * 2} height={g * 2} fit="cover" />
          </Mask>
        </Group>
      )}
    </Canvas>
  );
}
