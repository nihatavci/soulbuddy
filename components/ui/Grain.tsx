/**
 * Grain — film-grain / paper-fiber texture overlay (re:sense Renkler).
 *
 * A small neutral-gray noise tile (assets/textures/grain.png, see scripts/gen-grain.mjs)
 * tiled and alpha-blended. Neutral gray reads as grain on BOTH light (paper / gold) and
 * dark (ink) surfaces. Always pointer-transparent.
 *
 * Sized to the full window (not absoluteFill) so it covers the whole screen even when the
 * parent has no explicit bounds (e.g. a provider fragment). Inside a button it overflows
 * the button and is clipped by the button's `overflow:hidden` — so it fills there too.
 */
import React from 'react';
import { Image, StyleSheet, useWindowDimensions, type StyleProp, type ImageStyle } from 'react-native';

const GRAIN = require('@/assets/textures/grain.png');

export function Grain({
  opacity = 0.06,
  style,
}: {
  opacity?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <Image
      source={GRAIN}
      resizeMode="repeat"
      fadeDuration={0}
      pointerEvents="none"
      style={[styles.fill, { width, height, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0 },
});

export default Grain;
