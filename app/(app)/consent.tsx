/**
 * /(app)/consent — GDPR consent screen.
 *
 * Shown once before any non-essential data processing starts.
 * Mounted by AppGate after age verification and before intro/onboarding.
 *
 * Users can:
 *   - Accept all (analytics, crash reporting, AI processing)
 *   - Reject non-essential (only core app functionality)
 *   - Customize each category individually
 *
 * Consent is persisted in MMKV so the user is never asked again
 * (but can change preferences later in Profile → Privacy).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AppColors, Typography, BorderRadius } from '@/constants/theme';
import { Space } from '@/constants/spacing';
import { useT } from '@/context/LanguageContext';
import {
  acceptAllConsent,
  rejectNonEssentialConsent,
  saveConsentPreferences,
  type ConsentPreferences,
} from '@/lib/consent';
import {
  trackMixpanelConsentAcceptedAll,
  trackMixpanelConsentRejectedNonEssential,
  trackMixpanelConsentCustomized,
} from '@/lib/mixpanel';

const PRIVACY_POLICY_URL = 'https://example.com/privacy';

// ─── Consent category definitions ────────────────────────────────────────────

interface ConsentCategory {
  key: keyof ConsentPreferences;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

export default function ConsentScreen() {
  const router = useRouter();
  const t = useT();
  const CATEGORIES: ConsentCategory[] = [
    {
      key: 'analytics',
      icon: 'bar-chart-2',
      title: t('consent.categories.analytics.title'),
      description: t('consent.categories.analytics.description'),
    },
    {
      key: 'crashReport',
      icon: 'alert-triangle',
      title: t('consent.categories.crashReport.title'),
      description: t('consent.categories.crashReport.description'),
    },
    {
      key: 'aiProcessing',
      icon: 'cpu',
      title: t('consent.categories.aiProcessing.title'),
      description: t('consent.categories.aiProcessing.description'),
    },
  ];
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: true,
    crashReport: true,
    aiProcessing: true,
  });

  const handleAcceptAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    acceptAllConsent();
    trackMixpanelConsentAcceptedAll();
    router.replace('/(app)/' as any);
  };

  const handleRejectNonEssential = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rejectNonEssentialConsent();
    trackMixpanelConsentRejectedNonEssential();
    router.replace('/(app)/' as any);
  };

  const handleSaveCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveConsentPreferences(preferences);
    trackMixpanelConsentCustomized(preferences as unknown as Record<string, boolean>);
    router.replace('/(app)/' as any);
  };

  const toggleCategory = (key: keyof ConsentPreferences) => {
    Haptics.selectionAsync();
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  // ─── Customize view ──────────────────────────────────────────────────────

  if (showCustomize) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.customizeHeader}>
            <Pressable
              style={styles.backChip}
              onPress={() => {
                Haptics.selectionAsync();
                setShowCustomize(false);
              }}
            >
              <Feather name="chevron-left" size={18} color={AppColors.text} />
              <Text style={styles.backChipText}>{t('common.back')}</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.content}>
            <Text style={styles.title}>{t('consent.customizeTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('consent.customizeSubtitle')}
            </Text>
          </Animated.View>

          {/* Category toggles */}
          {CATEGORIES.map((cat, i) => (
            <Animated.View
              key={cat.key}
              entering={FadeInDown.delay(150 + i * 80).duration(300)}
              style={styles.categoryCard}
            >
              <View style={styles.categoryTop}>
                <View style={styles.categoryIconWrap}>
                  <Feather name={cat.icon} size={18} color={AppColors.accent} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                </View>
                <Switch
                  value={preferences[cat.key]}
                  onValueChange={() => toggleCategory(cat.key)}
                  trackColor={{ false: AppColors.border, true: AppColors.accent }}
                  thumbColor="#fff"
                />
              </View>
            </Animated.View>
          ))}

          {/* Essential note */}
          <Animated.View entering={FadeInDown.delay(450).duration(250)}>
            <View style={styles.essentialNote}>
              <Feather name="lock" size={14} color={AppColors.textSecondary} />
              <Text style={styles.essentialNoteText}>
                {t('consent.essentialNote')}
              </Text>
            </View>
          </Animated.View>

          {/* Save button */}
          <Animated.View entering={FadeInDown.delay(500).duration(250)} style={styles.buttons}>
            <Pressable
              onPress={handleSaveCustom}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.primaryBtnText}>{t('consent.savePreferences')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main consent view ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.logoWrap}>
          <View style={{ width: 80, height: 46 }} />
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="shield" size={28} color={AppColors.accent} />
          </View>

          <Text style={styles.title}>{t('consent.privacyTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('consent.privacySubtitle')}
          </Text>
        </Animated.View>

        {/* Summary chips */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.chipList}>
          {CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.chip}>
              <Feather name={cat.icon} size={14} color={AppColors.accentDeep} />
              <Text style={styles.chipText}>{cat.title}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.buttons}>
          <Pressable
            onPress={handleAcceptAll}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.primaryBtnText}>{t('consent.acceptAll')}</Text>
          </Pressable>

          <Pressable
            onPress={handleRejectNonEssential}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.secondaryBtnText}>{t('consent.rejectNonEssential')}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowCustomize(true);
            }}
            style={({ pressed }) => [styles.customizeBtn, pressed && styles.btnPressed]}
          >
            <Feather name="sliders" size={16} color={AppColors.accent} />
            <Text style={styles.customizeBtnText}>{t('consent.customize')}</Text>
          </Pressable>
        </Animated.View>

        {/* Legal footer */}
        <Animated.View entering={FadeInDown.delay(400).duration(250)}>
          <Text style={styles.legalNote}>
            {t('consent.legalNote')}{' '}
            <Text style={styles.privacyLink} onPress={handleOpenPrivacy}>
              {t('common.privacyPolicy')}
            </Text>
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Space.lg,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg,
    paddingBottom: Space.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Space.xl,
  },
  content: {
    alignItems: 'center',
    marginBottom: Space.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
  },
  title: {
    fontFamily: Typography.fonts.heading,
    fontSize: Typography.scale.heading.fontSize,
    lineHeight: Typography.scale.heading.lineHeight,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: Space.sm,
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },

  // ── Chips ──────────────────────────────────────────────────────────────────
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Space.xs,
    marginBottom: Space.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.accentLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  chipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.accentDeep,
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  buttons: {
    gap: Space.sm,
    marginBottom: Space.lg,
  },
  primaryBtn: {
    backgroundColor: AppColors.text,
    paddingVertical: Space.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.heading,
    fontSize: Typography.scale.body.fontSize,
    color: AppColors.background,
  },
  secondaryBtn: {
    backgroundColor: AppColors.surface,
    paddingVertical: Space.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  secondaryBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.scale.body.fontSize,
    color: AppColors.textSecondary,
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Space.sm,
  },
  customizeBtnText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 14,
    color: AppColors.accent,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // ── Legal note ─────────────────────────────────────────────────────────────
  legalNote: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.scale.caption.fontSize,
    lineHeight: Typography.scale.caption.lineHeight + 4,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Space.md,
  },
  privacyLink: {
    color: AppColors.accent,
    textDecorationLine: 'underline',
  },

  // ── Customize view ─────────────────────────────────────────────────────────
  customizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backChipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.text,
  },

  // ── Category cards ─────────────────────────────────────────────────────────
  categoryCard: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: Space.md,
    marginBottom: Space.sm,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  categoryText: {
    flex: 1,
    marginRight: 4,
  },
  categoryTitle: {
    fontFamily: Typography.fonts.heading,
    fontSize: 15,
    color: AppColors.text,
    marginBottom: 4,
  },
  categoryDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.textSecondary,
  },

  // ── Essential note ─────────────────────────────────────────────────────────
  essentialNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: Space.xs,
    marginBottom: Space.lg,
  },
  essentialNoteText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.scale.caption.fontSize,
    lineHeight: Typography.scale.caption.lineHeight + 4,
    color: AppColors.textSecondary,
  },
});
