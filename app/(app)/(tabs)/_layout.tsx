/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * expo-router Native Tabs → the real iOS 26 liquid-glass UITabBar (the approach
 * from Expo's "liquid glass app" blog). Pure system glass — translucent, morphing,
 * scroll-edge — so it renders as the native frosted material (not recolorable).
 * Signal-Yellow selected tint; native unread badge on Private from useUnread.
 *
 * NOTE: swapping between native and custom tabs is a navigator-type change that
 * does NOT hot-reload — it requires a fresh build to take effect.
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
