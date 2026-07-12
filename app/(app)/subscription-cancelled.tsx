import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/theme';
import { Space } from '@/constants/spacing';
import { logAppsFlyerEvent } from '@/lib/appsflyer';
import { trackMixpanel } from '@/lib/mixpanel';
import {
  fetchWinBackOffering, getPromoDiscount, purchaseWithPromo,
} from '@/lib/revenuecat';
import type { PurchasesPackage } from 'react-native-purchases';
import { useT } from '@/context/LanguageContext';

 
const HERO_VIDEO = require('@/assets/videos/paywall-hero-hq.mp4');

const COUNTDOWN_SECONDS = 900; // 15 minutes

const C = {
  bg:     '#0A0A0F',
  sheet:  '#0F0F15',
  card:   '#1A1A22',
  text:   '#FFFFFF',
  sub:    '#B3B3BA',
  desc:   '#7A7A82',
  gold:   '#3B82F6',
  goldLight: '#60A5FA',
};

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export default function SubscriptionCancelledScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ source: string; plan: string }>();
  const { height: H } = useWindowDimensions();

  const [secondsLeft, setSecondsLeft]     = useState(COUNTDOWN_SECONDS);
  const [pkg, setPkg]                     = useState<PurchasesPackage | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<any | null>(null);
  const [discountPriceStr, setDiscountPriceStr] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroPlayer = useVideoPlayer(HERO_VIDEO, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Analytics on mount
  useEffect(() => {
    const source = params.source ?? 'unknown';
    const plan   = params.plan   ?? 'unknown';
    logAppsFlyerEvent('subscription_cancelled', { source, plan });
    trackMixpanel('subscription_cancel_screen_viewed', { source, plan });
  }, []);

  // Fetch win-back offering + promo discount
  useEffect(() => {
    (async () => {
      try {
        const offering = await fetchWinBackOffering();
        const monthly  = offering?.availablePackages?.[0] ?? null;
        if (!monthly) return;
        setPkg(monthly);

        // Price for display comes from the discount offer on the product,
        // not from the signed PurchasesPromotionalOffer (which has no price field).
        const discountOffer = (monthly.product as any).discounts?.find(
          (d: any) => d.identifier === 'win_back_50_off',
        );
        if (discountOffer?.priceString) {
          setDiscountPriceStr(discountOffer.priceString);
        }

        const discount = await getPromoDiscount(monthly);
        setPromoDiscount(discount);
        trackMixpanel('win_back_offer_viewed', {
          has_promo: !!discount,
          source: params.source ?? 'unknown',
        });
        logAppsFlyerEvent('win_back_offer_viewed', { has_promo: discount ? 1 : 0 });
      } catch { /* falls back to dismiss-only UI */ }
    })();
  }, []);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => (s <= 1 ? (clearInterval(timerRef.current!), 0) : s - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Pulsing CTA glow — same breathing animation as paywall
  const ctaPulse = useSharedValue(0);
  useEffect(() => {
    ctaPulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);
  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ctaPulse.value * 0.035 }],
    shadowOpacity: 0.32 + ctaPulse.value * 0.28,
    shadowRadius: 18 + ctaPulse.value * 14,
  }));

  const handleClaim = useCallback(async () => {
    if (!pkg || isPurchasing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsPurchasing(true);
    trackMixpanel('win_back_offer_claimed', { has_promo: !!promoDiscount });
    try {
      await purchaseWithPromo(pkg, promoDiscount);
      router.replace('/(app)/subscription-success' as any);
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert(t('subscription.cancelled.purchaseFailedTitle'), t('subscription.cancelled.purchaseFailedBody'));
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [pkg, isPurchasing, promoDiscount, router]);

  const handleDismiss = useCallback(() => {
    Haptics.selectionAsync();
    trackMixpanel('win_back_offer_dismissed', { source: params.source ?? 'unknown' });
    router.replace('/(app)/(tabs)' as any);
  }, [router, params.source]);

  // Price strings
  const regularPrice = pkg?.product?.priceString ?? '';
  const offerPrice   = discountPriceStr && discountPriceStr !== regularPrice
    ? discountPriceStr
    : null;
  const hasPromo = !!offerPrice;

  const heroHeight = Math.round(H * 0.48);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero — same looping video as paywall ───────────────────────── */}
      <View style={[s.hero, { height: heroHeight }]}>
        {(() => {
          const VIDEO_ASPECT = 1280 / 720;
          const videoHeight  = heroHeight * 1.1;
          const videoWidth   = videoHeight * VIDEO_ASPECT;
          const videoLeft    = -(videoWidth * 0.22);
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
        {/* Dark gradient tint over video */}
        <View style={s.heroTint} />

        {/* Countdown + badge overlaid on hero */}
        <View style={[s.heroOverlay, { paddingTop: insets.top + 16 }]}>
          <Animated.View entering={FadeIn.delay(100)} style={s.timerRow}>
            <Ionicons name="time-outline" size={14} color={C.gold} />
            <Text style={s.timerLabel}>{t('subscription.cancelled.offerExpiresIn')} </Text>
            <Text style={s.timerValue}>{formatTime(secondsLeft)}</Text>
          </Animated.View>
        </View>
      </View>

      {/* ── Sheet — same dark card style as paywall ─────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={[s.sheet, { paddingBottom: insets.bottom + Space.lg }]}
      >
        {/* Heading */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.headingWrap}>
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{t('subscription.cancelled.badge')}</Text>
            </View>
          </View>
          <Text style={s.heading}>{t('subscription.cancelled.heading')}</Text>
          <Text style={s.subheading}>{t('subscription.cancelled.subheading')}</Text>
        </Animated.View>

        {/* Price card */}
        {pkg && (
          <Animated.View entering={FadeInDown.delay(300).duration(380)} style={s.priceCard}>
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>{t('subscription.cancelled.firstMonth')}</Text>
              <View style={s.priceRight}>
                {hasPromo && (
                  <Text style={s.originalPrice}>{regularPrice}</Text>
                )}
                <Text style={s.offerPrice}>{hasPromo ? offerPrice : regularPrice}</Text>
              </View>
            </View>
            <Text style={s.priceSub}>
              {hasPromo
                ? t('subscription.cancelled.thenPerMonth', { price: regularPrice })
                : t('subscription.cancelled.cancelAnytime')}
            </Text>
          </Animated.View>
        )}

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(360).duration(380)} style={s.featureBox}>
          <FeatureRow text={t('subscription.cancelled.features.replies')} />
          <FeatureRow text={t('subscription.cancelled.features.challenges')} />
          <FeatureRow text={t('subscription.cancelled.features.scanner')} />
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* CTA */}
        {pkg && (
          <Animated.View
            entering={FadeInUp.delay(460).duration(380)}
            style={s.ctaWrap}
          >
            <Animated.View style={[s.ctaGlow, ctaAnimStyle]}>
              <TouchableOpacity
                onPress={handleClaim}
                disabled={isPurchasing}
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
                  {isPurchasing ? t('subscription.cancelled.processing') : t('subscription.cancelled.cta')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        <TouchableOpacity
          style={s.dismissBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Text style={s.dismissText}>{t('subscription.cancelled.noThanks')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={s.featureRow}>
      <Ionicons name="checkmark-circle" size={16} color={C.gold} />
      <Text style={s.featureText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Hero ──
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.35)',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Space.lg,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  timerLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  timerValue: {
    fontFamily: Typography.fonts.heading,
    fontSize: 13,
    color: C.gold,
    letterSpacing: 1,
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
  badgeRow: {
    flexDirection: 'row',
    marginBottom: Space.sm,
  },
  badge: {
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 13,
    color: '#0A0A0A',
    letterSpacing: 1.5,
  },
  heading: {
    fontFamily: Typography.fonts.heading,
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.sub,
  },

  // Price card
  priceCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: Space.md,
    marginBottom: Space.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: C.sub,
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.desc,
    textDecorationLine: 'line-through',
  },
  offerPrice: {
    fontFamily: Typography.fonts.heading,
    fontSize: 18,
    color: C.gold,
  },
  priceSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: C.desc,
  },

  // Features
  featureBox: {
    gap: 10,
    marginBottom: Space.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  featureText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.sub,
  },

  // CTA
  ctaWrap: {
    marginBottom: Space.sm,
  },
  ctaGlow: {
    borderRadius: 100,
    shadowColor: '#F7D96E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 12,
  },

  // Dismiss
  dismissBtn: {
    paddingVertical: Space.sm,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: C.desc,
  },
});
