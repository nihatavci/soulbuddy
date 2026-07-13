/**
 * GoldDisc — the re:sense gold-pigment "signal" accent (ink-gold-disc.png).
 *
 * A soft scatter of gold pigment used as the ONE scarce decorative accent on a
 * screen (per the design: signal yellow is punctuation, not wallpaper). Absolute-
 * positioned, non-interactive. Prefer this over flat rgba circles — it carries the
 * organic materiality of the "Signal Paper" art direction.
 */

import React from 'react';
import { Image, StyleSheet, type DimensionValue } from 'react-native';

const GOLD_DISC = require('@/assets/textures/ink-gold-disc.png');

export function GoldDisc({
  size = 360,
  top,
  bottom,
  left,
  right,
  opacity = 0.5,
}: {
  size?: number;
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  opacity?: number;
}) {
  return (
    <Image
      source={GOLD_DISC}
      resizeMode="contain"
      style={[
        styles.disc,
        { width: size, height: size, opacity },
        top !== undefined ? { top } : null,
        bottom !== undefined ? { bottom } : null,
        left !== undefined ? { left } : null,
        right !== undefined ? { right } : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  disc: { position: 'absolute' },
});
