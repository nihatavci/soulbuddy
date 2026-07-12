import type { ViewStyle, ScrollViewProps } from 'react-native';

export interface IScrollProgress extends ScrollViewProps {
  /** Content inside the scrollable area */
  children: React.ReactNode;
  /** Render the initial FAB content (before reaching end) */
  renderInitialContent: () => React.ReactNode;
  /** Render the FAB content after reaching end */
  renderEndContent: () => React.ReactNode;
  /** Scroll progress % to trigger "end reached" (default: 100) */
  endReachedThreshold?: number;
  /** Scroll progress % to reset back to initial state (default: 95) */
  endResetThreshold?: number;
  /** FAB width (default: 70% of screen width) */
  fabWidth?: number;
  /** FAB height (default: 50) */
  fabHeight?: number;
  /** FAB distance from bottom (default: 30) */
  fabBottomOffset?: number;
  /** FAB background color (default: white) */
  fabBackgroundColor?: string;
  /** FAB background color when end is reached (default: forestgreen) */
  fabEndBackgroundColor?: string;
  /** FAB border radius (default: 100) */
  fabBorderRadius?: number;
  /** Show FAB only after scrolling (default: true) */
  showFabOnScroll?: boolean;
  /** Scroll offset before FAB appears (default: 150) */
  fabAppearScrollOffset?: number;
  /** Scale multiplier at end (default: 1) */
  fabEndScale?: number;
  /** Style for the content container inside FAB */
  contentContainerStyle?: ViewStyle;
  /** Style for the initial content wrapper */
  initialContentContainerStyle?: ViewStyle;
  /** Style for the end content wrapper */
  endContentContainerStyle?: ViewStyle;
  /** Style for the outer FAB wrapper */
  fabStyle?: ViewStyle;
  /** Style for the inner FAB button */
  fabButtonStyle?: ViewStyle;
  /** Callback with current scroll progress (0-100) */
  onScrollProgressChange?: (progress: number) => void;
  /** Callback when scroll reaches the end threshold */
  onEndReached?: () => void;
  /** Callback when scroll resets below the reset threshold */
  onEndReset?: () => void;
}
