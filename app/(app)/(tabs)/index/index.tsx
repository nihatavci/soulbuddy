import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, Typography, Space } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg }}>
        <Text style={{ ...Typography.scale.display, color: AppColors.text, fontFamily: Typography.fonts.heading }}>
          MyApp
        </Text>
        <Text style={{ ...Typography.scale.body, color: AppColors.textSecondary, marginTop: Space.sm, fontFamily: Typography.fonts.body }}>
          Boilerplate home. Build your app here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
