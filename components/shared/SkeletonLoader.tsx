/**
 * SkeletonLoader
 *
 * Reusable loading skeleton with shimmer animation.
 * Used in data-heavy screens while content loads.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(201,168,76,0.12)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A row of skeleton lines mimicking a card's content */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <View style={skeletonStyles.row}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={skeletonStyles.textGroup}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 14 }} />
      <Skeleton width="75%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

/** Full-screen skeleton layout for list screens */
export function SkeletonList({ count = 4, style }: { count?: number; style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.list, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={i > 0 ? { marginTop: 12 } : undefined} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.14)',
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  textGroup: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
