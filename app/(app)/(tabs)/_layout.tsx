/**
 * Tabs layout — re:sense bottom navigation: Board · Create · Private · You.
 *
 * Uses the standard JS <Tabs> with the custom re:sense <TabBar> on BOTH
 * platforms (outline icons, signal-yellow active pill) for consistent, design-
 * controlled navigation. We intentionally do NOT use expo-router's
 * unstable-native-tabs here.
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
