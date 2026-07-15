/**
 * Grain — film-grain / paper-fiber texture overlay (re:sense Renkler).
 *
 * A small neutral-gray-ish noise tile (assets/textures/grain.png, see scripts/gen-grain.mjs)
 * tiled and alpha-blended. Charcoal-biased so it reads as grit on the light paper + gold.
 * Always pointer-transparent.
 *
 * Sized to the full window (not absoluteFill) so it covers the whole screen even when the
 * parent has no explicit bounds (e.g. a provider fragment). Inside a button it overflows
 * and is clipped by the button's `overflow:hidden` — so it fills there too.
 */
import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

const GRAIN = require('@/assets/textures/grain.png');

export function Grain({
  opacity = 0.06,
  style,
}: {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[styles.fill, { width, height }, style]}>
      {/* explicit window w/h (not absoluteFill) — repeat mode tiles evenly this way;
          absoluteFill left a denser patch in the top-left corner. */}
      <Image
        source={GRAIN}
        resizeMode="repeat"
        fadeDuration={0}
        style={{ width, height, opacity }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0 },
});

export default Grain;
