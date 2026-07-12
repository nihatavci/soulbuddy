import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function TikTokLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Cyan shadow layer */}
      <Path
        d="M9.37 3h3.73v11.4a3.73 3.73 0 1 0 3.73-3.73v-3.8A7.5 7.5 0 1 1 9.37 14.4V3z"
        fill="#69C9D0"
        opacity={0.9}
        transform="translate(-0.5, 0.5)"
      />
      {/* Red shadow layer */}
      <Path
        d="M9.37 3h3.73v11.4a3.73 3.73 0 1 0 3.73-3.73v-3.8A7.5 7.5 0 1 1 9.37 14.4V3z"
        fill="#EE1D52"
        opacity={0.9}
        transform="translate(0.5, -0.5)"
      />
      {/* Main black layer */}
      <Path
        d="M9.37 3h3.73v11.4a3.73 3.73 0 1 0 3.73-3.73v-3.8A7.5 7.5 0 1 1 9.37 14.4V3z"
        fill="#ffffff"
      />
    </Svg>
  );
}
