/**
 * Welcome — S01 "Entry / INK" from the re:sense design (Ekranlar).
 *
 * Ink surface, gold ink-disc accents, the Wordmark, an evocative Playfair
 * headline, and a gold circular CTA that begins the flow (→ age gate). A
 * returning user logs in via the secondary link. English copy; the only italic
 * is the Wordmark + the emphasised headline word (Playfair italic face).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors } from '@/constants/theme';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { Wordmark } from '@/components/ui/Wordmark';
import { useT } from '@/context/LanguageContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useT();

  const begin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/age-gate');
  };

  return (
    <PaperBackground style={styles.root}>
      {/* Gold pigment discs — the scarce "signal" accent (design art direction). */}
      <GoldDisc size={380} top={-150} right={-150} opacity={0.5} />
      <GoldDisc size={340} bottom={-120} left={-140} opacity={0.45} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Wordmark size={44} />
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </View>

        <View style={styles.headlineWrap}>
          <Text style={styles.headline}>
            {t('welcome.headlineLead')}
            <Text style={styles.headlineEmphasis}>{t('welcome.headlineEmphasis')}</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.fab}
            onPress={begin}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.primary')}
          >
            <Ionicons name="add" size={28} color={AppColors.ink} />
          </Pressable>
          <Text style={styles.primaryLabel}>{t('welcome.primary')}</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} hitSlop={12}>
            <Text style={styles.login}>{t('welcome.login')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const GOLD = '#FFD03A';

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1, paddingHorizontal: 32, paddingBottom: 44 },
  header: { marginTop: 34 },
  tagline: {
    fontFamily: 'Satoshi', fontSize: 13, color: AppColors.accentDeep, marginTop: 8, letterSpacing: 0.2,
  },
  headlineWrap: { flex: 1, justifyContent: 'center' },
  headline: {
    fontFamily: 'PlayfairDisplay', fontSize: 34, lineHeight: 41,
    letterSpacing: -0.6, color: AppColors.text,
  },
  headlineEmphasis: { fontFamily: 'PlayfairDisplay-Italic', color: GOLD },
  actions: { alignItems: 'center', gap: 16 },
  fab: {
    width: 64, height: 64, borderRadius: 999, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryLabel: { fontFamily: 'Satoshi', fontSize: 15, color: AppColors.text },
  login: { fontFamily: 'Satoshi', fontSize: 14, color: AppColors.textSecondary },
});
