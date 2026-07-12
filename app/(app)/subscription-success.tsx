/**
 * subscription-success.tsx — Post-purchase thank you screen
 *
 * Shown immediately after a successful subscription.
 * Fires analytics events to AppsFlyer + Mixpanel so we have a
 * clean, deduplicated "subscription confirmed" signal separate
 * from the purchase attempt event.
 *
 * Params (via router.replace):
 *   plan        — product identifier e.g. "monthly", "yearly"
 *   revenue     — purchase price as string e.g. "9.99"
 *   currency    — ISO currency code e.g. "USD"
 *   source      — where the purchase was initiated e.g. "onboarding", "settings"
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { AppColors, Typography, Space } from '@/constants/theme';
import { logAppsFlyerEvent } from '@/lib/appsflyer';
import { logFacebookPurchase } from '@/lib/facebook';
import { trackMixpanel } from '@/lib/mixpanel';
import { useT } from '@/context/LanguageContext';

export default function SubscriptionSuccessScreen() {
  const t        = useT();
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const params   = useLocalSearchParams<{
    plan:     string;
    revenue:  string;
    currency: string;
    source:   string;
  }>();

  useEffect(() => {
    // Haptic celebration on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const plan     = params.plan     ?? 'unknown';
    const revenue  = parseFloat(params.revenue ?? '0');
    const currency = params.currency ?? 'USD';
    const source   = params.source   ?? 'unknown';

    // AppsFlyer — the ONLY event mapped to in_app_purchase + revenue in Google partner config
    logAppsFlyerEvent('subscription_confirmed', {
      af_content_id: plan,
      af_revenue:    revenue,
      af_currency:   currency,
      source,
    });

    // Meta — the single revenue event (fb_mobile_purchase). Fired only here so
    // ad-side ROAS isn't double-counted against the funnel Subscribe events.
    if (revenue > 0) {
      logFacebookPurchase(revenue, currency, { content_id: plan, source });
    }

    // Mixpanel — for funnel & cohort analysis
    trackMixpanel('subscription_success_screen_viewed', {
      plan,
      revenue,
      currency,
      source,
    });
  }, []);

  const handleContinue = () => {
    trackMixpanel('subscription_success_cta_tapped');
    router.replace('/(app)/(tabs)' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Space.lg }]}>

      {/* Animated checkmark */}
      <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={88} color={AppColors.success} />
      </Animated.View>

      {/* Heading */}
      <Animated.Text entering={FadeInDown.delay(250)} style={styles.heading}>
        {t('subscription.success.heading')}
      </Animated.Text>

      {/* Subheading */}
      <Animated.Text entering={FadeInDown.delay(350)} style={styles.sub}>
        {t('subscription.success.subheading')}
      </Animated.Text>

      {/* Plan badge */}
      {params.plan ? (
        <Animated.View entering={FadeInDown.delay(450)} style={styles.badge}>
          <Text style={styles.badgeText}>
            {params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} Plan
          </Text>
        </Animated.View>
      ) : null}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.ctaWrap}>
        <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{t('subscription.success.cta')}</Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: AppColors.background,
    alignItems:      'center',
    paddingHorizontal: Space.lg,
  },
  iconWrap: {
    marginTop: Space['2xl'],
    marginBottom: Space.lg,
  },
  heading: {
    fontFamily: Typography.fonts.heading,
    fontSize:   28,
    color:      AppColors.text,
    textAlign:  'center',
    marginBottom: Space.sm,
  },
  sub: {
    fontFamily: Typography.fonts.body,
    fontSize:   16,
    color:      AppColors.textSecondary,
    textAlign:  'center',
    lineHeight: 24,
    marginBottom: Space.md,
  },
  badge: {
    backgroundColor: AppColors.accentLight,
    borderRadius:    20,
    paddingHorizontal: Space.md,
    paddingVertical:   Space.xs,
    marginTop: Space.xs,
  },
  badgeText: {
    fontFamily: Typography.fonts.heading,
    fontSize:   14,
    color:      AppColors.accentDeep,
  },
  ctaWrap: {
    width: '100%',
  },
  cta: {
    backgroundColor: AppColors.accent,
    borderRadius:    50,
    paddingVertical: Space.md,
    alignItems:      'center',
    shadowColor:     AppColors.accent,
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       8,
  },
  ctaText: {
    fontFamily: Typography.fonts.heading,
    fontSize:   16,
    color:      '#FFFFFF',
  },
});
