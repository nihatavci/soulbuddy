import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { AvatarImage } from './AvatarImage';
import { AppColors, Typography } from '@/constants/theme';
import { Space } from '@/constants/spacing';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
}

export function Header({
  title = 'myapp',
  showBack = false,
  onBackPress,
  onAvatarPress,
}: HeaderProps) {
  const { user } = useAuth();
  const btnScale = useSharedValue(1);

  const handleLeftPress = () => {
    btnScale.value = withSequence(
      withTiming(0.82, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress?.();
  };

  const leftBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <View style={styles.header}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      <View style={styles.borderBottom} />

      <View style={styles.container}>
        {/* Left button */}
        <View style={styles.side}>
          {showBack && (
            <Pressable onPress={handleLeftPress} style={styles.sideBtn}>
              <Animated.View style={leftBtnStyle}>
                <Ionicons name="chevron-back" size={24} color={AppColors.text} />
              </Animated.View>
            </Pressable>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Avatar */}
        <View style={[styles.side, styles.sideRight]}>
          {onAvatarPress && (
            <Pressable onPress={onAvatarPress}>
              <AvatarImage
                imageUrl={user?.image}
                email={user?.email ?? ''}
                name={user?.name ?? ''}
                size={36}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: Space.lg, // 26 — golden-ratio screen padding
  },
  side: {
    width: 40,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  sideBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fonts.heading,
    fontSize: 20,
    color: AppColors.text,
    letterSpacing: 0.3,
  },
});
