/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * Custom <TabBar> — a COMPACT glass bar (GlassView / blur), slimmer than the tall
 * native UITabBar, with a small unread dot. The native tab bar's size (bar height
 * + badge) is fixed by iOS and can't be reduced, so a custom bar is the only way
 * to make it smaller while keeping the glass material.
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
