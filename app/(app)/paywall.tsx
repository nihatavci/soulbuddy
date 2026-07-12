import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { VideoView, useVideoPlayer } from 'expo-video';
import { AppColors, Typography } from '@/constants/theme';
import { Space } from '@/constants/spacing';
import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  isProFromCustomerInfo,
  presentCodeRedemption,
} from '@/lib/revenuecat';
import type { PurchasesPackage, CustomerInfo } from '@/lib/revenuecat';
import { ENTITLEMENTS_QUERY_KEY, useEntitlements } from '@/hooks/useEntitlements';
import {
  trackMixpanelPaywallViewed as trackPaywallViewed,
  trackMixpanelSubscriptionStartedFull as trackSubscriptionStarted,
  trackMixpanelPurchasesRestored as trackPurchasesRestored,
  trackMixpanelPurchaseCancelled as trackPurchaseCancelled,
  trackMixpanelTrialStarted,
} from '@/lib/mixpanel';
import { logAppsFlyerEvent, AFEvent } from '@/lib/appsflyer';
import { logFacebookEvent, FBEvent } from '@/lib/facebook';
import { launchFlags } from '@/lib/launchFlags';
import { Prefs } from '@/store/mmkv';
import { useT } from '@/context/LanguageContext';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

 
const HERO_VIDEO = require('@/assets/videos/paywall-hero-hq.mp4');

const C = {
  bg:          '#0A0A0F',
  sheet:       '#0F0F15',
  card:        '#1A1A22',
  black:       '#0A0A0A',
  heading:     '#FFFFFF',
  sub:         '#B3B3BA',
  desc:        '#7A7A82',
  dot:         '#FFFFFF',
  dotLine:     'rgba(255,255,255,0.22)',
  gold:        '#3B82F6',
  goldLight:   '#60A5FA',
};

// Converts a RC Period object (Android) or iOS periodUnit/periodNumberOfUnits
// into a number of days. Returns 0 if the period is unknown.
function periodToDays(unit: string, value: number): number {
  switch (unit) {
    case 'DAY':   return value;
    case 'WEEK':  return value * 7;
    case 'MONTH': return value * 30;
    case 'YEAR':  return value * 365;
    default:      return 0;
  }
}

// Returns { hasTrial, trialDays, trialEndDate } derived from the RC package.
// Handles both iOS (introPrice) and Android (defaultOption.freePhase).
function getTrialInfo(pkg: PurchasesPackage | null): {
  hasTrial: boolean;
  trialDays: number;
  trialEndDate: string;
} {
  let hasTrial = false;
  let trialDays = 0;

  if (pkg) {
    const product = pkg.product as any;

    if (Platform.OS === 'android') {
      // Android: free trial lives in defaultOption.freePhase (SubscriptionOption).
      // freePhase is the first PricingPhase where amountMicros === 0.
      const freePhase = product?.defaultOption?.freePhase
        ?? product?.subscriptionOptions?.[0]?.freePhase;
      if (freePhase) {
        hasTrial = true;
        trialDays = periodToDays(
          freePhase.billingPeriod?.unit ?? 'DAY',
          freePhase.billingPeriod?.value ?? 3,
        );
      }
    } else {
      // iOS: free trial is introPrice with price === 0.
      const intro = product?.introPrice;
      if (intro != null && intro.price === 0) {
        hasTrial = true;
        trialDays = periodToDays(
          intro.periodUnit ?? 'DAY',
          intro.periodNumberOfUnits ?? 3,
        );
      }
    }

    // Fallback: if either platform returned 0 days but hasTrial is true, show 3.
    if (hasTrial && trialDays === 0) trialDays = 3;
  }

  const d = new Date();
  if (hasTrial) d.setDate(d.getDate() + trialDays);
  const trialEndDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return { hasTrial, trialDays, trialEndDate };
}

// ─── Pricing helper ──────────────────────────────────────────────────────────
// Reads the price string from the RC package when available, falls back to default.
function priceString(pkg: PurchasesPackage | null): string {
  if (!pkg) return '$5.99/mo';
  const product = (pkg as any).product;
  if (product?.priceString) return product.priceString + '/mo';
  return '$5.99/mo';
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYWALL UI
// ═════════════════════════════════════════════════════════════════════════════

function PaywallUI({
  onPurchase,
  onRestore,
  onRedeemCode,
  onSkip,
  loading,
  pkg,
  trialInfo,
}: {
  onPurchase: () => void;
  onRestore: () => void;
  onRedeemCode: () => void;
  onSkip: () => void;
  loading: boolean;
  pkg: PurchasesPackage | null;
  trialInfo: { hasTrial: boolean; trialDays: number; trialEndDate: string };
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const { hasTrial, trialDays, trialEndDate: endDate } = trialInfo;
  const price = useMemo(() => priceString(pkg), [pkg]);

  const heroHeight = Math.round(H * 0.5);

  // Hero video — true-quality MP4 replaces the old quantized 2.8MB GIF.
  // Configured to loop silently like a GIF would.
  const heroPlayer = useVideoPlayer(HERO_VIDEO, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleCTA = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPurchase();
  }, [onPurchase]);

  // Pulsing attention — breathing scale + shadow to draw the eye to the CTA.
  const ctaPulse = useSharedValue(0);
  useEffect(() => {
    ctaPulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);
  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 1 + ctaPulse.value * 0.035, // 1.000 ↔ 1.035
      },
    ],
    shadowOpacity: 0.32 + ctaPulse.value * 0.28, // 0.32 ↔ 0.60
    shadowRadius: 18 + ctaPulse.value * 14,      // 18 ↔ 32
  }));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Restore link (top-left, over hero) ───────────────────────── */}
      <TouchableOpacity
        style={[s.restoreBtn, { top: insets.top + 12 }]}
        onPress={() => { Haptics.selectionAsync(); onRestore(); }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={s.restoreText}>{t('paywall.restore')}</Text>
      </TouchableOpacity>

      {/* ── Skip link (top-right, over hero) ──────────────────────────── */}
      <TouchableOpacity
        style={[s.skipBtn, { top: insets.top + 12 }]}
        onPress={() => { Haptics.selectionAsync(); onSkip(); }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={s.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero (dark, looping HQ video) ───────────────────────────
            Video sized to fill the hero's HEIGHT (so the subject is always
            max-vertical on every device), then shifted horizontally to keep
            the original composition (subject framed slightly right-of-centre).
            Aspect ratio 1096:630 preserved. */}
        <View style={[s.hero, { height: heroHeight }]}>
          {(() => {
            // Source: final-render-ai-woman.mp4 — 1280 × 720 (16:9 HD).
            const VIDEO_ASPECT = 1280 / 720; // 1.7778
            // Fill the hero vertically with light overscan — the subject is
            // always max-size, never shrunk by letterboxing.
            const videoHeight = heroHeight * 1.1;
            const videoWidth  = videoHeight * VIDEO_ASPECT;
            // Keep the subject slightly right-of-centre (matches original
            // composition direction). Cropping ~20 % of the left edge.
            const videoLeft = -(videoWidth * 0.22);
            return (
              <VideoView
                player={heroPlayer}
                contentFit="cover"
                nativeControls={false}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: videoLeft,
                  width: videoWidth,
                  height: videoHeight,
                }}
              />
            );
          })()}
          <View style={s.heroTint} />
        </View>

        {/* ── Bottom sheet ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[s.sheet, { paddingBottom: insets.bottom + Space.lg }]}
        >
          {/* Heading */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.headingWrap}>
            <Text style={s.heading}>{t('paywall.readyToGoPro')}</Text>
            <Text style={s.subheading}>{t('paywall.noCommitment')}</Text>
          </Animated.View>

          {/* Product card */}
          <Animated.View entering={FadeInDown.delay(300).duration(380)} style={s.productCard}>
            <Text style={s.productName}>MYAPP PRO</Text>
            <Text style={s.productDesc}>
              {t('paywall.productDesc')}
            </Text>
          </Animated.View>

          {/* Timeline pricing — conditional on whether RC package has a trial */}
          {hasTrial ? (
            <Animated.View entering={FadeInDown.delay(380).duration(380)} style={s.timeline}>
              <View style={s.timelineRow}>
                <View style={s.dotCol}>
                  <View style={s.dot} />
                  <View style={s.dotConnector} />
                </View>
                <Text style={s.timelineLabel}>{t('paywall.today')}</Text>
                <View style={s.timelineRight}>
                  <Text style={s.trialFree}>{t('paywall.daysFree', { count: trialDays })}</Text>
                  <Text style={s.timelinePrice}>USD 0.00</Text>
                </View>
              </View>
              <View style={s.timelineRow}>
                <View style={s.dotCol}>
                  <View style={s.dot} />
                </View>
                <Text style={s.timelineLabel}>{t('paywall.due', { date: endDate })}</Text>
                <Text style={s.timelinePrice}>{price}</Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(380).duration(380)} style={s.timeline}>
              <View style={s.timelineRow}>
                <View style={s.dotCol}>
                  <View style={s.dot} />
                </View>
                <Text style={s.timelineLabel}>{t('paywall.billedToday')}</Text>
                <Text style={s.timelinePrice}>{price}</Text>
              </View>
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(520).duration(380)} style={s.ctaWrap}>
            <Animated.View style={[s.ctaGlow, ctaAnimStyle]}>
              <TouchableOpacity
                onPress={handleCTA}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#1C140A',
                  borderRadius: 100,
                  paddingVertical: 20,
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <Text style={{
                  fontFamily: Typography.fonts.heading,
                  fontSize: 18,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  color: '#E8C84A',
                }}>
                  {loading ? t('paywall.loading') : hasTrial ? t('paywall.tryDaysFree', { count: trialDays }) : t('paywall.subscribe')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(600).duration(400)} style={s.footer}>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onRedeemCode(); }}>
              <Text style={s.footerLink}>{t('paywall.redeem')}</Text>
            </TouchableOpacity>
            <Text style={s.footerDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}>
              <Text style={s.footerLink}>{t('common.terms')}</Text>
            </TouchableOpacity>
            <Text style={s.footerDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}>
              <Text style={s.footerLink}>{t('common.privacy')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN (RevenueCat logic)
// ═════════════════════════════════════════════════════════════════════════════

export default function PaywallScreen() {
  const t           = useT();
  const router      = useRouter();
  const params      = useLocalSearchParams<{ source?: string }>();
  const queryClient = useQueryClient();
  const { data: entitlements } = useEntitlements();

  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    launchFlags.markFirstRunPaywallSeen();
    trackPaywallViewed(params.source ?? 'onboarding');
    logAppsFlyerEvent('paywall_viewed', { source: params.source ?? 'onboarding' });
    logFacebookEvent(FBEvent.VIEWED_CONTENT, { content_name: 'paywall', source: params.source ?? 'onboarding' });
  }, []);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    (async () => {
      try {
        const packages = await fetchOfferings();
        const monthly = packages.find(
          (p) => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly',
        );
        if (monthly) setMonthlyPkg(monthly);
        else if (packages.length > 0) setMonthlyPkg(packages[0]);
      } catch (err) {
        if (__DEV__) console.warn('[Paywall] Failed to fetch offerings:', err);
      }
    })();
  }, []);

  const handleTransactionComplete = useCallback(async (customerInfo: CustomerInfo, pkg?: PurchasesPackage | null) => {
    await queryClient.invalidateQueries({ queryKey: ENTITLEMENTS_QUERY_KEY });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: '/(app)/subscription-success' as any,
      params: {
        plan:     pkg?.packageType ?? 'unknown',
        revenue:  String(pkg?.product?.price ?? 0),
        currency: pkg?.product?.currencyCode ?? 'USD',
        source:   params.source ?? 'onboarding',
      },
    });
  }, [queryClient, router, params.source]);

  const handlePurchase = useCallback(async () => {
    if (IS_EXPO_GO) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(tabs)' as any);
      return;
    }
    if (!monthlyPkg) {
      Alert.alert(t('paywall.alerts.notReadyTitle'), t('paywall.alerts.notReadyBody'));
      return;
    }
    setLoading(true);
    // af_initiated_checkout — user signalled intent to buy (before purchase resolves)
    logAppsFlyerEvent(AFEvent.CHECKOUT_INITIATED, {
      af_content_id:   monthlyPkg.product.identifier,
      af_content_type: monthlyPkg.packageType ?? 'MONTHLY',
      af_revenue:      monthlyPkg.product.price ?? 0,
      af_currency:     monthlyPkg.product.currencyCode ?? 'USD',
    });
    // Meta — fb_mobile_initiated_checkout (no revenue here; revenue logged on confirm)
    logFacebookEvent(FBEvent.CHECKOUT_INITIATED, {
      content_id:   monthlyPkg.product.identifier,
      content_type: monthlyPkg.packageType ?? 'MONTHLY',
      currency:     monthlyPkg.product.currencyCode ?? 'USD',
    });
    try {
      const customerInfo = await purchasePackage(monthlyPkg);
      const { hasTrial } = getTrialInfo(monthlyPkg);
      const installSource = (monthlyPkg as any)?.product?.installSource
        ?? Prefs.get('install_source') ?? undefined;
      trackSubscriptionStarted({
        product_id:     monthlyPkg.product.identifier,
        plan:           monthlyPkg.packageType ?? 'MONTHLY',
        revenue:        (monthlyPkg as any).product?.price ?? 0,
        currency:       (monthlyPkg as any).product?.currencyCode ?? 'USD',
        is_trial:       hasTrial,
        install_source: installSource,
      });
      if (hasTrial) {
        trackMixpanelTrialStarted(monthlyPkg.packageType ?? 'MONTHLY');
      }
      await handleTransactionComplete(customerInfo, monthlyPkg);
    } catch (err: any) {
      if (err?.userCancelled) {
        trackPurchaseCancelled();
        router.replace({
          pathname: '/(app)/subscription-cancelled' as any,
          params: {
            source: params.source ?? 'onboarding',
            plan:   monthlyPkg?.packageType ?? 'unknown',
          },
        });
      } else {
        // Demoted to warn so StoreKit "problem with the App Store" errors
        // (expected in sandbox before product is approved, or when not signed
        // into a sandbox tester) don't trip the red LogBox overlay.
        if (__DEV__) console.warn('[Paywall] Purchase error:', err?.message ?? err);
        Alert.alert(
          t('paywall.alerts.purchaseFailedTitle'),
          err?.message?.includes('App Store')
            ? t('paywall.alerts.purchaseFailedAppStore')
            : t('paywall.alerts.purchaseFailedGeneric'),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [monthlyPkg, handleTransactionComplete, router]);

  const handleRestore = useCallback(async () => {
    Haptics.selectionAsync();
    if (IS_EXPO_GO) {
      router.replace('/(app)/(tabs)' as any);
      return;
    }
    setLoading(true);
    try {
      const customerInfo = await restorePurchases();
      trackPurchasesRestored();
      if (isProFromCustomerInfo(customerInfo)) {
        await handleTransactionComplete(customerInfo);
      } else {
        Alert.alert(t('paywall.alerts.noSubscriptionTitle'), t('paywall.alerts.noSubscriptionBody'));
      }
    } catch (err) {
      if (__DEV__) console.warn('[Paywall] Restore error:', err);
      Alert.alert(t('paywall.alerts.restoreFailedTitle'), t('paywall.alerts.restoreFailedBody'));
    } finally {
      setLoading(false);
    }
  }, [handleTransactionComplete, router]);

  const handleRedeemCode = useCallback(async () => {
    try {
      await presentCodeRedemption();
      await queryClient.invalidateQueries({ queryKey: ENTITLEMENTS_QUERY_KEY });
    } catch (err) {
      if (__DEV__) console.warn('[Paywall] Redeem code error:', err);
    }
  }, [queryClient]);

  const handleSkip = useCallback(() => {
    Prefs.setBool('paywall_deferred', true);
    router.replace({
      pathname: '/(app)/subscription-cancelled' as any,
      params: { source: 'paywall_skip' },
    });
  }, [router]);

  const trialInfo = useMemo(() => getTrialInfo(monthlyPkg), [monthlyPkg]);

  if (entitlements?.isPro) {
    return <Redirect href={'/(app)/(tabs)' as any} />;
  }

  return (
    <PaywallUI
      onPurchase={handlePurchase}
      onRestore={handleRestore}
      onRedeemCode={handleRedeemCode}
      onSkip={handleSkip}
      loading={loading}
      pkg={monthlyPkg}
      trialInfo={trialInfo}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Restore ──
  restoreBtn: {
    position: 'absolute',
    left: Space.lg,
    zIndex: 10,
  },
  restoreText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },

  // ── Skip ──
  skipBtn: {
    position: 'absolute',
    right: Space.lg,
    zIndex: 10,
  },
  skipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },

  // ── Hero ──
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.12)',
  },

  // ── Sheet ──
  sheet: {
    backgroundColor: C.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: Space.lg,
    paddingHorizontal: Space.lg,
    flex: 1,
  },

  // Heading
  headingWrap: {
    marginBottom: Space.md,
  },
  heading: {
    fontFamily: Typography.fonts.heading,
    fontSize: 28,
    color: C.heading,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.sub,
  },

  // Product card
  productCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: Space.md,
    marginBottom: Space.sm,
  },
  productName: {
    fontFamily: Typography.fonts.heading,
    fontSize: 20,
    color: C.heading,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.desc,
    lineHeight: 20,
  },

  // Timeline
  timeline: {
    paddingHorizontal: 2,
    marginBottom: Space.md,
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 36,
  },
  dotCol: {
    alignItems: 'center',
    width: 10,
    paddingTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.dot,
  },
  dotConnector: {
    width: 1.5,
    height: 20,
    backgroundColor: C.dotLine,
    marginTop: 3,
  },
  timelineLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.sub,
    flex: 1,
    paddingTop: 3,
  },
  timelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 3,
  },
  trialFree: {
    fontFamily: Typography.fonts.heading,
    fontSize: 13,
    color: AppColors.accent,
  },
  timelinePrice: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.heading,
    paddingTop: 3,
  },

  // CTA — Skia RadiantButton wrapped in a gold-glow shadow so it pops on cream
  ctaWrap: {
    marginBottom: Space.md,
  },
  ctaGlow: {
    borderRadius: 100,
    shadowColor: AppColors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.sm,
  },
  footerLink: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: C.sub,
  },
  footerDot: {
    fontSize: 13,
    color: C.desc,
  },
});
