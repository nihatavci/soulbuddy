import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, Typography } from '../../constants/theme';
import { useUnread } from '../../context/UnreadContext';

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
 * re:sense tab bar — a floating rounded capsule (the shape) filled with the app's
 * EXACT paper background color (#F3EFE6). Pure RN views, so the color is exact and
 * never the OS's white liquid-glass material. A hairline border + soft shadow lift
 * it off the page; the active tab gets the signal-yellow pill.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { total: unreadTotal } = useUnread();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.capsule}>
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
  // The capsule itself: EXACT paper, rounded, lifted with a hairline + soft shadow.
  capsule: {
    backgroundColor: AppColors.background, // #F3EFE6 — exact match, never white
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    paddingVertical: 10,
    shadowColor: '#0D0D10',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
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
