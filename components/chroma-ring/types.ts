import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface IChromaRing {
  readonly width?: number;
  readonly height?: number;
  readonly borderRadius?: number;
  readonly borderWidth?: number;
  readonly speed?: number;
  readonly base?: string;
  readonly glow?: string;
  readonly background?: string;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export type { IChromaRing };
