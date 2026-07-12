import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { TabBar } from '@/components/ui/TabBar';
import { AppColors } from '@/constants/theme';
import { useT } from '@/context/LanguageContext';

export default function TabsLayout() {
  const t = useT();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs minimizeBehavior="onScrollDown" tintColor={AppColors.accent}>
        <NativeTabs.Trigger name="index/index">
          <Label>{t('tabs.home')}</Label>
          <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index/index" options={{ title: t('tabs.home') }} />
    </Tabs>
  );
}
