/**
 * Wordmark — the re:sense brand lockup.
 *
 * Renders `re:` in the display (serif-italic) family and `sense` in the heading
 * (grotesk) family as two Text spans, sized from a `size` prop.
 *
 * DESIGN RULE (PRD/design.md): this is the ONLY component permitted to use
 * `fontStyle: 'italic'`. Italic is reserved for the wordmark / hero accents —
 * never buttons, labels, body copy, or safety text. Do not set italic elsewhere.
 */

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { AppColors } from '@/constants/theme';

interface WordmarkProps {
  /** Font size for both spans, in px. Default 40 (Display XL). */
  size?: number;
  /** Color of the `re:` span. Defaults to the Signal Yellow accent. */
  accentColor?: string;
  /** Color of the `sense` span. Defaults to Paper text. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Wordmark({
  size = 40,
  accentColor = AppColors.accent,
  color = AppColors.text,
  style,
}: WordmarkProps) {
  const lineHeight = Math.round(size * 1.08);
  const base: TextStyle = { fontSize: size, lineHeight, includeFontPadding: false };

  return (
    <View style={[styles.row, style]} accessibilityRole="header" accessibilityLabel="re:sense">
      <Text style={[base, styles.re, { color: accentColor }]}>re:</Text>
      <Text style={[base, styles.sense, { color }]}>sense</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  // brandRe / brandSense tokens: Playfair Display italic (the ONLY italic surface).
  // Italic comes from the bundled italic font faces, not a synthesized fontStyle.
  re: {
    fontFamily: 'PlayfairDisplay-BlackItalic', // 900 italic
    letterSpacing: -1.6,
  },
  sense: {
    fontFamily: 'PlayfairDisplay-Italic', // 400 italic
    letterSpacing: -1.2,
  },
});
