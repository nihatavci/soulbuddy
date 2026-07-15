/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * Uses expo-router Native Tabs → a real UITabBar, so on iOS 26 we get the system
 * liquid-glass tab bar (morphing, scroll-edge transparency) for free, with a
 * native unread badge on Private. Selected tint is Signal-Yellow. SF Symbols on
 * iOS; the label/icon families are system-native (the tradeoff for real glass).
 */

import React from 'react';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnread } from '@/context/UnreadContext';
import { AppColors } from '@/constants/theme';

export default function TabsLayout() {
  const { total } = useUnread();
  const badge = total > 0 ? String(total) : undefined;

  return (
    <NativeTabs tintColor={AppColors.accent}>
      <NativeTabs.Trigger name="index">
        <Label>Board</Label>
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <Label>Create</Label>
        <Icon sf="square.and.pencil" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="private">
        <Label>Private</Label>
        <Icon sf={{ default: 'lock', selected: 'lock.fill' }} />
        <Badge>{badge}</Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="you">
        <Label>You</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
