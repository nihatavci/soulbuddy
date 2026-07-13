/**
 * Age gate — S02 "Adult / Privacy / PAPER" from the re:sense design (Ekranlar).
 *
 * A PAPER (light) surface with ink text — the inverse of the ink screens. AGE-01:
 * a blocking 18+ checkbox gates the primary CTA (no bypass, no date-of-birth).
 * Confirming sets the MMKV flag `age_confirmed_18_plus` (persisted server-side as
 * profiles.age_confirmed_at on the first profile write in Plan 03) and routes to
 * sign-up. A "Privacy summary" secondary reveals an inline privacy note.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Wordmark } from '@/components/ui/Wordmark';
import { Prefs } from '@/store/mmkv';
import { useT } from '@/context/LanguageContext';

// Paper-surface palette (inverse of the dark AppColors tokens); design tokens.
const PAPER = '#F3EFE6';
const INK = '#0D0D10';
const INK_MUTED = '#3A3A40';
const INK_FAINT = 'rgba(13,13,16,0.20)';
const GOLD = '#FFD03A';

export default function AgeGateScreen() {
  const router = useRouter();
  const t = useT();
  const [confirmed, setConfirmed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleContinue = () => {
    if (!confirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Prefs.setBool('age_confirmed_18_plus', true);
    router.replace('/(auth)/sign-up');
  };

  return (
    <View style={styles.root}>
      <View style={styles.disc} />
      <SafeAreaView style={styles.safe}>
        <Wordmark size={22} color={INK} accentColor={INK} />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t('ageGate.title')}</Text>
          <View style={styles.underline} />
        </View>

        <Text style={styles.body}>{t('ageGate.body')}</Text>

        {showPrivacy && (
          <Text style={styles.privacyNote}>{t('ageGate.privacyNote')}</Text>
        )}

        <View style={styles.spacer} />

        <Pressable
          style={styles.checkRow}
          onPress={() => { Haptics.selectionAsync(); setConfirmed((v) => !v); }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxOn]}>
            {confirmed && <Ionicons name="checkmark" size={16} color={INK} />}
          </View>
          <Text style={styles.checkLabel}>{t('ageGate.checkbox')}</Text>
        </Pressable>

        <Pressable
          style={[styles.primary, !confirmed && styles.primaryDisabled]}
          onPress={handleContinue}
          disabled={!confirmed}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{t('ageGate.confirm')}</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => setShowPrivacy((v) => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{t('ageGate.privacy')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER, overflow: 'hidden' },
  disc: {
    position: 'absolute', top: -120, right: -140, width: 360, height: 360,
    borderRadius: 180, backgroundColor: 'rgba(255,208,58,0.18)',
  },
  safe: { flex: 1, paddingHorizontal: 32, paddingBottom: 44, paddingTop: 26 },
  titleWrap: { alignSelf: 'flex-start', marginTop: 44 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 32, letterSpacing: -0.6, color: INK },
  underline: {
    height: 4, borderRadius: 2, backgroundColor: GOLD, marginTop: 6, width: '92%',
  },
  body: {
    fontFamily: 'Satoshi', fontSize: 16, lineHeight: 25, color: INK_MUTED,
    marginTop: 30, maxWidth: 320,
  },
  privacyNote: {
    fontFamily: 'Satoshi', fontSize: 14, lineHeight: 21, color: INK_MUTED,
    marginTop: 18, padding: 16, borderRadius: 16,
    backgroundColor: '#ECE5D9', borderWidth: 1, borderColor: INK_FAINT,
  },
  spacer: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 24 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 1.6, borderColor: INK,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: GOLD, borderColor: GOLD },
  checkLabel: { fontFamily: 'Satoshi', fontSize: 15, color: INK },
  primary: {
    height: 52, borderRadius: 999, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  primaryDisabled: { opacity: 0.42 },
  primaryText: { fontFamily: 'Satoshi-Bold', fontSize: 15, color: INK },
  secondary: {
    height: 48, borderRadius: 999, borderWidth: 1, borderColor: INK_FAINT,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { fontFamily: 'Satoshi-Medium', fontSize: 15, color: INK },
});
