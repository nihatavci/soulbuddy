/**
 * PaperBackground — the re:sense "Signal Paper" base surface.
 *
 * A single, flat paper.50 fill — ONE uniform color, no two-tone. (The bundled
 * paper/charcoal textures are fully opaque, so overlaying them shifted the hue
 * and their tiled seams left a warm band at the bottom; a proper transparent
 * grain asset can be layered back in later without changing the base color.)
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AppColors } from '@/constants/theme';

export function PaperBackground({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Deprecated no-op — kept for call-site compatibility. */
  grain?: number;
}) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
});
