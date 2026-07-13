import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, Typography } from '../../constants/theme';
import { Space } from '../../constants/spacing';

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
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
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
        {/* Active pill background */}
        {isFocused && <View style={styles.activePill} />}

        <View style={styles.iconWrap}>
          <Feather
            name={isFocused ? config.activeIcon : config.icon}
            size={20}
            color={isFocused ? AppColors.accent : AppColors.textSecondary}
          />
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

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => (
        <TabItem
          key={route.key}
          routeName={route.name}
          isFocused={state.index === index}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    paddingTop: Space.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.accentLight,
    borderRadius: 14,
  },
  iconWrap: {
    zIndex: 1,
  },
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
