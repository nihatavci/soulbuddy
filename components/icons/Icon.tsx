/**
 * Icon — the Paperwhite pen-drawn icon set.
 *
 * Drop-in replacement for <Feather>/<Ionicons>: same `name` / `size` / `color` props.
 * Glyph geometry is pre-wobbled offline (see scripts/bake-icons.mjs) and shipped as
 * static paths — no runtime filter, no torn strokes. `name` accepts the Paperwhite
 * canonical names AND every legacy Feather/Ionicons name we used (resolved via ALIASES).
 */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { GLYPHS, ALIASES, type Shape } from './paperwhite.generated';

export type { IconName } from './paperwhite.generated';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_COLOR = '#0D0D10'; // ink

export function Icon({
  name,
  size = 24,
  color = DEFAULT_COLOR,
  strokeWidth = 1.6,
  style,
}: IconProps) {
  const canonical = ALIASES[name] ?? name;
  const shapes: Shape[] | undefined = GLYPHS[canonical];

  if (!shapes) {
    if (__DEV__) {
      console.warn(`[Icon] no glyph for "${name}" (resolved "${canonical}") — add it to scripts/bake-icons.mjs`);
    }
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      {shapes.map((s, i) =>
        'dot' in s ? (
          <Circle key={i} cx={s.dot[0]} cy={s.dot[1]} r={s.dot[2]} fill={color} />
        ) : (
          <Path
            key={i}
            d={s.d}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </Svg>
  );
}

export default Icon;
