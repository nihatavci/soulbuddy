/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * expo-router Native Tabs → the real iOS 26 liquid-glass UITabBar (the approach
 * from Expo's "liquid glass app" blog). Pure system glass — translucent, morphing,
 * scroll-edge — so it renders as the native frosted material (not recolorable).
 * Signal-Yellow selected tint; native unread badge on Private from useUnread.
 *
 * REQUIREMENTS to actually see the glass:
 *  - a fresh NATIVE build (swapping native↔custom tabs does NOT hot-reload), and
 *  - iOS 26+ at runtime (older iOS falls back to a normal opaque tab bar).
 * Tab icons here are SF Symbols — that is what makes it the *system* glass bar.
 * The Paperwhite icon set is still used everywhere else in the app.
 */

import React from 'react';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnread } from '@/context/UnreadContext';
import { AppColors } from '@/constants/theme';

export default function TabsLayout() {
  const { total } = useUnread();
  // Binary presence dot, never a count (product line: no unread counts, no
  // streaks — private.tsx:6). Per expo-router's NativeTabTrigger, a <Badge>
  // with no `children` and `hidden={false}` gets `badgeValue = ' '` (a single
  // space), which iOS/Android render as a small dot; `hidden={true}` omits
  // the badge entirely. Passing `String(total)` here would render the actual
  // unread count as a numbered pill — exactly what the roadmap forbids.
  const hasUnread = total > 0;

  return (
    <NativeTabs
      tintColor={AppColors.accent}
      badgeBackgroundColor={AppColors.ink}
      badgeTextColor={AppColors.background}
    >
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
        <Badge hidden={!hasUnread} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="you">
        <Label>You</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
