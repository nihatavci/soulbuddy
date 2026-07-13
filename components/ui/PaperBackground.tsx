/**
 * PaperBackground — the re:sense "Signal Paper" base surface.
 *
 * A paper.50 fill with the deterministic paper-fiber grain (tex-paper.png,
 * dark specks on transparent) tiled subtly on top. This is the light-theme
 * canvas for every product screen — wrap a screen's root in it instead of a
 * plain <View style={{backgroundColor: AppColors.background}}>.
 *
 * Optionally drops a gold pigment disc (the scarce "signal" accent) in a
 * corner via <GoldDisc/>. Texture only — no runtime randomness.
 */

import React from 'react';
import { View, Image, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AppColors } from '@/constants/theme';

const PAPER_GRAIN = require('@/assets/textures/tex-paper.png');

export function PaperBackground({
  children,
  style,
  grain = 0.5,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** grain opacity 0–1 (default 0.5) */
  grain?: number;
}) {
  return (
    <View style={[styles.root, style]}>
      <Image
        source={PAPER_GRAIN}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity: grain }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
});
