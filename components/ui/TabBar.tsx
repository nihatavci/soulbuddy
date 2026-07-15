import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, Typography } from '../../constants/theme';
import { useUnread } from '../../context/UnreadContext';

// Paper tint laid over the glass so the capsule reads warm/cream instead of the
// OS's cool white. Higher alpha = warmer & more solid; lower = glassier.
const PAPER_TINT = 'rgba(243,239,230,0.6)';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

const TAB_CONFIG: Record<string, { label: string; icon: FeatherIcon; activeIcon: FeatherIcon }> = {
  index:     { label: 'Board',   icon: 'grid',   activeIcon: 'grid'   },
  create:    { label: 'Create',  icon: 'edit-3', activeIcon: 'edit-3' },
  'private': { label: 'Private', icon: 'lock',   activeIcon: 'lock'   },
  you:       { label: 'You',     icon: 'user',   activeIcon: 'user'   },
};

function TabItem({
  routeName,
  isFocused,
  onPress,
  badge = false,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  badge?: boolean;
}) {
  const config = TAB_CONFIG[routeName];

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  if (!config) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={config.label}
    >
      <View style={styles.tabInner}>
        {isFocused && <View style={styles.activePill} />}
        <View style={styles.iconWrap}>
          <Feather
            name={isFocused ? config.activeIcon : config.icon}
            size={20}
            color={isFocused ? AppColors.accent : AppColors.textSecondary}
          />
          {badge && <View style={styles.badgeDot} />}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? AppColors.accent : AppColors.textSecondary },
            isFocused && styles.tabLabelActive,
          ]}
        >
          {config.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * re:sense tab bar — a floating rounded capsule of real glass (iOS 26 liquid glass
 * via GlassView, frosted blur fallback) warmed with a paper tint so it reads cream,
 * NOT the OS's white. Custom view = we control the tint (the native tab bar can't
 * be recolored). Active tab gets the signal-yellow pill; small unread dot.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { total: unreadTotal } = useUnread();
  const liquid = isLiquidGlassAvailable();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.capsule}>
        {liquid ? (
          <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" />
        ) : (
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        )}
        {/* warm the glass toward paper so it isn't white */}
        <View style={[StyleSheet.absoluteFill, styles.paperTint]} pointerEvents="none" />
        <View style={styles.row}>
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={state.index === index}
              badge={route.name === 'private' && unreadTotal > 0}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent positioning layer — the screen's paper shows behind the floating
  // capsule.
  wrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  // The capsule: real glass, clipped to the rounded shape, warmed by the paper tint.
  capsule: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    paddingVertical: 10,
  },
  paperTint: { backgroundColor: PAPER_TINT },
  row: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -2,
    left: 6,
    right: 6,
    bottom: -2,
    backgroundColor: AppColors.accentLight,
    borderRadius: 16,
  },
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5484D',
  },
  iconWrap: { zIndex: 1 },
  tabLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
    zIndex: 1,
  },
  tabLabelActive: {
    fontFamily: Typography.fonts.heading,
  },
});
