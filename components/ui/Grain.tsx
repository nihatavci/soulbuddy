/**
 * Grain — procedural film / paper grain, rendered on the GPU with Skia.
 *
 * Replaces the old tiled-PNG overlay. A runtime (SkSL) shader emits symmetric,
 * high-frequency, ZERO-MEAN noise — equal light and dark specks at low alpha —
 * so it *modulates* the surface beneath instead of veiling it like a flat gray
 * scrim. That is the difference between grain sitting IN the paper and fog laid
 * ON top: half the specks lighten, half darken, so mean luminance is preserved.
 * No tiling seams, resolution-independent.
 *
 * `animated` reanimates the field ~24×/sec (throttled to ~30 redraws/sec) for a
 * real film-grain shimmer — use it for the one global overlay, leave it off for
 * small/static uses (buttons) so each stays a single cheap draw. Always
 * pointer-transparent.
 *
 * API is a superset of the old PNG version: <Grain opacity={...} style={...} />
 * still works unchanged; `animated` is new and defaults to off.
 */
import React from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type FrameInfo,
} from 'react-native-reanimated';

const SOURCE = Skia.RuntimeEffect.Make(`
uniform float u_time;
uniform float u_strength;

// cheap 2D hash -> [0, 1)
float hash(float2 p) {
  p = fract(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

half4 main(float2 fragCoord) {
  // reanimate the whole field ~24x/sec so it flickers like film, not scrolls
  float frame = floor(u_time * 24.0);
  float n = hash(fragCoord + frame * 71.7);
  float g = n - 0.5;                     // [-0.5, 0.5], zero-mean
  float a = abs(g) * 2.0 * u_strength;   // transparent at mid, speck at extremes
  float3 c = g > 0.0 ? float3(1.0) : float3(0.0); // light or dark speck
  return half4(c * a, a);                // premultiplied
}
`);

export function Grain({
  opacity = 0.06,
  animated = false,
  style,
}: {
  opacity?: number;
  /** Reanimate the grain each frame (film shimmer). Off = a single static draw. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Deprecated no-op — kept for call-site compatibility. */
  grain?: number;
}) {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);
  const acc = useSharedValue(0);

  useFrameCallback((f: FrameInfo) => {
    'worklet';
    const dt = f.timeSincePreviousFrame ?? 0;
    acc.value += dt;
    // throttle redraws to ~30/sec — grain flicker doesn't need 60fps
    if (acc.value >= 1000 / 30) {
      time.value += acc.value / 1000;
      acc.value = 0;
    }
  }, animated);

  const uniforms = useDerivedValue(
    () => ({
      u_time: time.value,
      u_strength: Math.max(0, Math.min(1, opacity)),
    }),
    [opacity, time],
  );

  if (!SOURCE) return null;

  return (
    <Canvas
      pointerEvents="none"
      style={[styles.fill, { width, height }, style]}
    >
      <Fill>
        <Shader source={SOURCE} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0 },
});

export default Grain;
