/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * Uses the custom re:sense <TabBar> (paper-matched background, signal-yellow
 * active pill, small unread dot) rather than native tabs — the native liquid-
 * glass bar can't be a solid paper color or carry a small custom dot, both of
 * which the brand wants here.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Board' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="private" options={{ title: 'Private' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
