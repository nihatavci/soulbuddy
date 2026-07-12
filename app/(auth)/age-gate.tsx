/**
 * Age gate — blocking 18+ confirmation (AGE-01).
 *
 * No bypass affordance and no date-of-birth field (data minimization). Confirming
 * sets the MMKV flag `age_confirmed_18_plus` (persisted server-side as
 * profiles.age_confirmed_at on the first profile write in Plan 03) and routes to
 * sign-up. Declining does NOT proceed — it shows an inline, non-modal message.
 * Icon + text convey state (yellow never carries meaning alone).
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Prefs } from '@/store/mmkv';
import { useT } from '@/context/LanguageContext';

export default function AgeGateScreen() {
  const router = useRouter();
  const t = useT();
  const [declined, setDeclined] = useState(false);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Prefs.setBool('age_confirmed_18_plus', true);
    router.replace('/(auth)/sign-up');
  };

  const handleDecline = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeclined(true);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={26} color={AppColors.accent} />
          </View>
          <Text style={styles.title}>{t('ageGate.title')}</Text>
          <Text style={styles.copy}>{t('ageGate.body')}</Text>

          {declined && (
            <View style={styles.noticeBox}>
              <Ionicons name="alert-circle-outline" size={16} color={AppColors.error} />
              <Text style={styles.noticeText}>{t('ageGate.underageMessage')}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            label={t('ageGate.confirm')}
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            style={styles.cta}
          />
          <Pressable
            style={styles.decline}
            onPress={handleDecline}
            accessibilityRole="button"
          >
            <Text style={styles.declineText}>{t('ageGate.decline')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.fonts.heading,
    fontSize: 28,
    color: AppColors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  copy: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 24,
    backgroundColor: 'rgba(200,92,92,0.10)',
    borderWidth: 1, borderColor: 'rgba(200,92,92,0.30)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: 340,
  },
  noticeText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: AppColors.text,
  },
  actions: { paddingBottom: 24, gap: 16 },
  cta: { borderRadius: 999 },
  decline: { alignItems: 'center', paddingVertical: 12 },
  declineText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.textSecondary,
    textDecorationLine: 'underline',
  },
});
