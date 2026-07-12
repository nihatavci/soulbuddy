/**
 * Welcome — first screen of the (auth) flow (initial route).
 *
 * Obsidian hero with the re:sense Wordmark, one warm tagline, and a primary CTA
 * into the age gate. A returning user can jump straight to sign-in via the
 * secondary link. No italic outside the Wordmark (design rule).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Wordmark';
import { useT } from '@/context/LanguageContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useT();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <Wordmark size={52} />
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label={t('welcome.continue')}
            variant="primary"
            size="lg"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/age-gate');
            }}
            style={styles.cta}
          />
          <Pressable
            style={styles.secondary}
            onPress={() => router.push('/(auth)/sign-in')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{t('welcome.haveAccount')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 320,
  },
  actions: { paddingBottom: 24, gap: 16 },
  cta: { borderRadius: 999 },
  secondary: { alignItems: 'center', paddingVertical: 12 },
  secondaryText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.textSecondary,
    textDecorationLine: 'underline',
  },
});
