/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * expo-router Native Tabs → the real iOS 26 liquid-glass UITabBar. `backgroundColor`
 * is a TRANSLUCENT paper tint layered over the glass, so the bar keeps its glass
 * translucency/morphing but reads warm/paper instead of the default cool white
 * (tune the alpha to taste). Signal-Yellow selected tint; native unread badge on
 * Private from useUnread.
 */

import React from 'react';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnread } from '@/context/UnreadContext';
import { AppColors } from '@/constants/theme';

// Translucent paper laid over the liquid glass — keeps the glass, warms it to
// the app's paper background. Raise the alpha toward 1 for a more solid match,
// lower it for more glass.
const GLASS_PAPER_TINT = 'rgba(243,239,230,0.72)';

export default function TabsLayout() {
  const { total } = useUnread();
  const badge = total > 0 ? String(total) : undefined;

  return (
    <NativeTabs tintColor={AppColors.accent} backgroundColor={GLASS_PAPER_TINT}>
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
