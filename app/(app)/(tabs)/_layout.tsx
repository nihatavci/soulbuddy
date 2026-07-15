/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * Custom <TabBar> — a floating paper capsule. iOS 26's NATIVE liquid-glass tab bar
 * is a system material that ignores a custom background color (always renders that
 * bright frosted white), so it can't match the paper background. The custom bar is
 * pure RN views → the fill is the EXACT #F3EFE6, with the floating-capsule shape.
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
