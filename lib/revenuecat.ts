/**
 * lib/revenuecat.ts — RevenueCat SDK wrapper
 *
 * Handles: SDK init, entitlement checks, offerings fetch, purchase, restore,
 * RevenueCat Paywall UI, and Customer Center.
 *
 * Dashboard checklist (one-time setup):
 *  1. Entitlement identifier: "MyApp Pro"
 *  2. Products: monthly, yearly, lifetime
 *  3. Attach products to an Offering named "default"
 *  4. Design paywall in RevenueCat dashboard → Paywalls
 *  5. Set up Customer Center in RevenueCat dashboard → Customer Center
 *
 * Expo Go note:
 *  react-native-purchases* are native modules that require a native build.
 *  When running in Expo Go (Constants.appOwnership === 'expo') all functions
 *  return safe no-op stubs so the rest of the app works without crashing.
 */

import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { logAppsFlyerEvent, AFEvent, getAppsFlyerId } from '@/lib/appsflyer';
import { logFacebookEvent, FBEvent, getFacebookAnonymousId } from '@/lib/facebook';
import { getMixpanelDistinctId } from '@/lib/mixpanel';

// ─── Expo Go detection ────────────────────────────────────────────────────────

export const IS_EXPO_GO = Constants.appOwnership === 'expo';

// ─── Native module stubs (Expo Go only) ──────────────────────────────────────

export const PAYWALL_RESULT_STUB = {
  NOT_PRESENTED: 'NOT_PRESENTED' as const,
  CANCELLED:     'CANCELLED'     as const,
  PURCHASED:     'PURCHASED'     as const,
  RESTORED:      'RESTORED'      as const,
  ERROR:         'ERROR'         as const,
};

const RevenueCatUIStub = {
  Paywall:              () => null,
  presentPaywall:       async () => PAYWALL_RESULT_STUB.NOT_PRESENTED,
  presentCustomerCenter: async () => {},
};

// ─── Conditional native module access ────────────────────────────────────────
// Only require() at call-time when not in Expo Go, to avoid the LINKING_ERROR
// that fires on module load in Expo Go.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNative(): { Purchases: any; RevenueCatUI: any; PAYWALL_RESULT: any } | null {
  if (IS_EXPO_GO) return null;
   
  const Purchases = require('react-native-purchases').default;
   
  const { default: RevenueCatUI, PAYWALL_RESULT } = require('react-native-purchases-ui');
  return { Purchases, RevenueCatUI, PAYWALL_RESULT };
}

// ─── Entitlement & Product IDs ────────────────────────────────────────────────
// These match the RevenueCat dashboard configuration exactly.

export const ENTITLEMENT_PRO = 'MyApp Pro';

export const PRODUCT_MONTHLY  = 'monthly';
export const PRODUCT_YEARLY   = 'yearly';
export const PRODUCT_LIFETIME = 'lifetime';

// ─── Types (re-exported from native package or inlined for Expo Go) ───────────

export type PurchasesPackage = import('react-native-purchases').PurchasesPackage;
export type CustomerInfo     = import('react-native-purchases').CustomerInfo;
export type PurchasesOffering = import('react-native-purchases').PurchasesOffering;

// ─── PAYWALL_RESULT export ────────────────────────────────────────────────────

export const PAYWALL_RESULT = IS_EXPO_GO
  ? PAYWALL_RESULT_STUB
   
  : require('react-native-purchases-ui').PAYWALL_RESULT;

// ─── Initialize ──────────────────────────────────────────────────────────────
// Call once in app/(app)/_layout.tsx when the authenticated user is known.

export function initRevenueCat(userId?: string): void {
  if (IS_EXPO_GO) {
    if (__DEV__) console.log('[RevenueCat] Skipping init in Expo Go');
    return;
  }

  const native = getNative()!;

  const apiKey = Platform.select({
    ios:     process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY     ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY     ?? '',
  });

  if (!apiKey) {
    if (__DEV__) console.warn('[RevenueCat] No API key found — check .env.local');
    return;
  }

  try {
    if (__DEV__) native.Purchases.setLogLevel(native.Purchases.LOG_LEVEL?.DEBUG ?? 'DEBUG');
    // Pass appUserID directly into configure() so RevenueCat has the correct
    // user identity from the first moment — avoids an anonymous→identified
    // race condition where a purchase fires before logIn() resolves.
    native.Purchases.configure({ apiKey, appUserID: userId ?? null });
  } catch (err) {
    // Native module may crash on dev builds with kotlinx-serialization missing
    if (__DEV__) console.warn('[RevenueCat] configure failed (native module issue):', err);
    return;
  }
}

// ─── Link attribution identifiers (server-side conversions) ──────────────────
// RevenueCat is the source of truth for revenue. Once RC knows each user's
// AppsFlyer / Mixpanel / Meta identity (+ ATT-gated device IDs), enabling RC's
// native AppsFlyer + Mixpanel integrations in the dashboard makes RC forward
// purchases/renewals/trials/refunds SERVER-SIDE — validated and far more
// reliable than the client-side events (which die on ATT-deny, app-kill, or
// network loss). AppsFlyer's Meta/Google/ASA partner configs then deliver the
// revenue onward to the ad networks.
//
// Reserved attributes: $appsflyerId, $mixpanelDistinctId, $fbAnonymousId, plus
// $idfa/$idfv/$ip via collectDeviceIdentifiers(). Call once per session after
// the AppsFlyer/Mixpanel/Meta SDKs have initialized AND ATT has resolved.

export async function linkRevenueCatIdentifiers(opts: { trackingAllowed: boolean }): Promise<void> {
  if (IS_EXPO_GO) return;
  const native = getNative();
  if (!native) return;
  const { Purchases } = native;

  try {
    // IDFA/IDFV/IP. RC only attaches IDFA when ATT is authorized, but we gate
    // explicitly so a denied user never has device identifiers collected.
    if (opts.trackingAllowed) {
      await Purchases.collectDeviceIdentifiers();
    }

    const [afId, mpId, fbId] = await Promise.all([
      getAppsFlyerId(),
      getMixpanelDistinctId(),
      getFacebookAnonymousId(),
    ]);

    if (afId) await Purchases.setAppsflyerID(afId);
    if (mpId) await Purchases.setMixpanelDistinctID(mpId);
    if (fbId) await Purchases.setFBAnonymousID(fbId);

    if (__DEV__) {
      console.log('[RevenueCat] linked identifiers', {
        appsflyer: !!afId, mixpanel: !!mpId, fbAnon: !!fbId, idfa: opts.trackingAllowed,
      });
    }
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] linkRevenueCatIdentifiers failed:', err);
  }
}

// ─── Login (alias anonymous → identified user) ─────────────────────────────
// Call after signup to associate the anonymous $RCAnonymousID with the real user.

export async function loginRevenueCat(userId: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const native = getNative();
  if (!native) return;
  try {
    await native.Purchases.logIn(userId);
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] logIn failed:', err);
  }
}

// ─── Logout (clear RC identity, reset to anonymous) ──────────────────────────
// Call on sign-out so the next user on the same device doesn't inherit
// the previous user's appUserID. RevenueCat assigns a fresh anon ID.

export async function logoutRevenueCat(): Promise<void> {
  if (IS_EXPO_GO) return;
  const native = getNative();
  if (!native) return;
  try {
    await native.Purchases.logOut();
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] logOut failed:', err);
  }
}

// ─── Entitlement check ───────────────────────────────────────────────────────

export function isProFromCustomerInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_PRO] !== undefined;
}

// ─── Fetch customer info ──────────────────────────────────────────────────────

export async function fetchCustomerInfo(): Promise<CustomerInfo> {
  if (IS_EXPO_GO) {
    return { entitlements: { active: {}, all: {} } } as unknown as CustomerInfo;
  }
  return getNative()!.Purchases.getCustomerInfo();
}

// ─── Get offerings ────────────────────────────────────────────────────────────

export async function fetchOfferings(): Promise<PurchasesPackage[]> {
  if (IS_EXPO_GO) return [];
  try {
    const offerings = await getNative()!.Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch (err) {
    if (__DEV__) console.error('[RevenueCat] fetchOfferings error:', err);
    return [];
  }
}

// ─── Get current offering (for RC Paywall UI) ────────────────────────────────

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (IS_EXPO_GO) return null;
  try {
    const offerings = await getNative()!.Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    if (__DEV__) console.error('[RevenueCat] fetchCurrentOffering error:', err);
    return null;
  }
}

// ─── Purchase ────────────────────────────────────────────────────────────────

/**
 * Free-trial length in days for a product, or 0 if it has no trial.
 * iOS: introPrice with price 0. Android: defaultOption.freePhase.
 */
export function trialDaysFor(product: any): number {
  if (!product) return 0;
  const toDays = (unit: string, n: number) =>
    unit === 'WEEK' ? n * 7 : unit === 'MONTH' ? n * 30 : unit === 'YEAR' ? n * 365 : n;
  if (Platform.OS === 'android') {
    const free = product?.defaultOption?.freePhase ?? product?.subscriptionOptions?.[0]?.freePhase;
    return free ? toDays(free.billingPeriod?.unit ?? 'DAY', free.billingPeriod?.value ?? 0) : 0;
  }
  const intro = product?.introPrice;
  return intro != null && intro.price === 0
    ? toDays(intro.periodUnit ?? 'DAY', intro.periodNumberOfUnits ?? 0)
    : 0;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (IS_EXPO_GO) throw new Error('[RevenueCat] Purchases not available in Expo Go');

  // af_add_payment_info — fires as the native purchase sheet is about to appear
  logAppsFlyerEvent(AFEvent.ADD_PAYMENT_INFO, {
    af_content_id: pkg.product.identifier,
    af_currency:   pkg.product.currencyCode,
  });
  // Meta — mirror as fb_mobile_add_payment_info (revenue is logged once at the
  // confirmed-purchase screen to avoid double-counting; see subscription-success).
  logFacebookEvent(FBEvent.ADD_PAYMENT_INFO, {
    content_id: pkg.product.identifier,
    currency:   pkg.product.currencyCode,
  });

  const result = await getNative()!.Purchases.purchasePackage(pkg);

  // Track purchase in AppsFlyer for install attribution & influencer reporting
  logAppsFlyerEvent(AFEvent.SUBSCRIBE_INITIATED, {
    af_revenue:       pkg.product.price,
    af_currency:      pkg.product.currencyCode,
    af_content_id:    pkg.product.identifier,
    af_content_type:  pkg.packageType,         // MONTHLY | ANNUAL | LIFETIME
    af_order_id:      result.customerInfo?.originalAppUserId ?? '',
  });
  logFacebookEvent(FBEvent.SUBSCRIBE, {
    content_id:   pkg.product.identifier,
    content_type: pkg.packageType,
    currency:     pkg.product.currencyCode,
  });

  // af_start_trial — predefined event; fires only when the plan includes a free trial
  const trialDays = trialDaysFor(pkg.product);
  if (trialDays > 0) {
    logAppsFlyerEvent(AFEvent.TRIAL_STARTED, {
      af_content_id: pkg.product.identifier,
      af_currency:   pkg.product.currencyCode,
      af_trial_days: trialDays,
    });
    logFacebookEvent(FBEvent.TRIAL_STARTED, {
      content_id:  pkg.product.identifier,
      currency:    pkg.product.currencyCode,
      trial_days:  trialDays,
    });
  }

  return result.customerInfo;
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<CustomerInfo> {
  if (IS_EXPO_GO) throw new Error('[RevenueCat] Restore not available in Expo Go');
  return getNative()!.Purchases.restorePurchases();
}

// ─── Redeem promo / offer code (iOS) ─────────────────────────────────────────
// Opens the native App Store code redemption sheet. Used for:
//   • Admin-granted Pro subscriptions via App Store offer/promo codes
//   • User-facing "Redeem code" on paywall
// Android: Google Play redemption is handled outside the app via a deep link.
// This wrapper safely no-ops on Android so a single CTA works cross-platform.

export async function presentCodeRedemption(): Promise<void> {
  if (IS_EXPO_GO) return;
  if (Platform.OS !== 'ios') {
    // Android users redeem via the Play Store directly; no in-app sheet.
    return;
  }
  const native = getNative();
  if (!native) return;
  try {
    await native.Purchases.presentCodeRedemptionSheet();
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] presentCodeRedemptionSheet failed:', err);
  }
}

// ─── RevenueCat Paywall UI ────────────────────────────────────────────────────

export async function presentPaywall(offering?: PurchasesOffering | null): Promise<typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT]> {
  if (IS_EXPO_GO) return PAYWALL_RESULT_STUB.NOT_PRESENTED;
  const { RevenueCatUI, PAYWALL_RESULT: RC_RESULT } = getNative()!;
  try {
    const result = offering
      ? await RevenueCatUI.presentPaywall({ offering })
      : await RevenueCatUI.presentPaywall();

    // Track conversion when paywall UI results in a purchase or restore.
    // RC Paywall UI doesn't return the purchased product directly, so we
    // look it up from CustomerInfo + Offerings to get the real price.
    if (result === RC_RESULT.PURCHASED || result === RC_RESULT.RESTORED) {
      try {
        const { Purchases: P } = getNative()!;
        const [info, offerings] = await Promise.all([
          P.getCustomerInfo(),
          P.getOfferings(),
        ]);
        const activeProductId = Array.from(info.activeSubscriptions ?? [])[0] as string | undefined;
        const packages: any[] = offerings?.current?.availablePackages ?? [];
        const matchedPkg = packages.find(
          (p: any) => p.product?.identifier === activeProductId,
        );
        logAppsFlyerEvent(AFEvent.SUBSCRIBE_INITIATED, {
          af_revenue:      matchedPkg?.product?.price ?? 0,
          af_currency:     matchedPkg?.product?.currencyCode ?? 'USD',
          af_content_id:   activeProductId ?? 'unknown',
          af_content_type: matchedPkg?.packageType ?? offering?.identifier ?? 'default',
          source:          'rc_paywall_ui',
        });
        logFacebookEvent(FBEvent.SUBSCRIBE, {
          content_id:   activeProductId ?? 'unknown',
          content_type: matchedPkg?.packageType ?? offering?.identifier ?? 'default',
          currency:     matchedPkg?.product?.currencyCode ?? 'USD',
          source:       'rc_paywall_ui',
        });
        // af_start_trial — only when the purchased plan includes a free trial
        const trialDays = trialDaysFor(matchedPkg?.product);
        if (trialDays > 0) {
          logAppsFlyerEvent(AFEvent.TRIAL_STARTED, {
            af_content_id: activeProductId ?? 'unknown',
            af_currency:   matchedPkg?.product?.currencyCode ?? 'USD',
            af_trial_days: trialDays,
            source:        'rc_paywall_ui',
          });
          logFacebookEvent(FBEvent.TRIAL_STARTED, {
            content_id: activeProductId ?? 'unknown',
            currency:   matchedPkg?.product?.currencyCode ?? 'USD',
            trial_days: trialDays,
            source:     'rc_paywall_ui',
          });
        }
      } catch {
        // Best-effort — don't block the purchase flow on analytics failure
        logAppsFlyerEvent(AFEvent.SUBSCRIBE_INITIATED, {
          af_content_type: offering?.identifier ?? 'default',
          af_currency:     'USD',
          source:          'rc_paywall_ui',
        });
        logFacebookEvent(FBEvent.SUBSCRIBE, {
          content_type: offering?.identifier ?? 'default',
          currency:     'USD',
          source:       'rc_paywall_ui',
        });
      }
    }

    return result;
  } catch (err) {
    if (__DEV__) console.error('[RevenueCat] presentPaywall error:', err);
    return PAYWALL_RESULT_STUB.ERROR;
  }
}

// ─── Customer Center ─────────────────────────────────────────────────────────

/**
 * Opens RevenueCat's Customer Center UI. If it fails (Customer Center not
 * configured in dashboard, native module throws, etc.) falls back to the
 * platform's native subscription-management URL so the user ALWAYS reaches
 * a working manage-subscriptions flow.
 */
export async function presentCustomerCenter(): Promise<void> {
  if (IS_EXPO_GO) {
    if (__DEV__) console.log('[RevenueCat] Customer Center not available in Expo Go');
    await openNativeSubscriptionsUrl();
    return;
  }

  const native = getNative();
  const rcUI = native?.RevenueCatUI;
  const fn = rcUI?.presentCustomerCenter;

  if (typeof fn !== 'function') {
    if (__DEV__) console.warn('[RevenueCat] presentCustomerCenter not available on this SDK — falling back to native URL');
    await openNativeSubscriptionsUrl();
    return;
  }

  try {
    // Call as a bound static method — avoids `this` loss on iOS bridgeless arch.
    await rcUI.presentCustomerCenter();
  } catch (err: any) {
    // "Failed to initialize Customer Center Proxy" = RC configured after native
    // module init (common on cold starts). Re-require the module fresh and retry once.
    if (__DEV__) console.warn('[RevenueCat] presentCustomerCenter threw:', err?.message ?? err);
    try {
      // Force a fresh require so the SDK re-reads NativeModules at call time.
       
      const freshUI = require('react-native-purchases-ui').default;
      await freshUI.presentCustomerCenter();
    } catch (err2: any) {
      if (__DEV__) console.warn('[RevenueCat] retry also failed:', err2?.message ?? err2);
      await openNativeSubscriptionsUrl();
    }
  }
}

/**
 * Native OS fallback — opens the App Store or Play Store subscription page.
 * Works on any device with the respective store app installed.
 */
async function openNativeSubscriptionsUrl(): Promise<void> {
  // https:// URL works on both simulator and device; App Store app handles the redirect.
  const url = Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Simulator or no store app — show the URL so user can open it manually
      Alert.alert(
        'Manage Subscription',
        Platform.OS === 'ios'
          ? 'Open Settings → Apple ID → Subscriptions to manage your subscription.'
          : 'Visit play.google.com/store/account/subscriptions to manage your subscription.',
      );
    }
  } catch (err) {
    if (__DEV__) console.error('[RevenueCat] Linking.openURL failed:', err);
  }
}

// ─── Win-Back Offer helpers ───────────────────────────────────────────────────

export const WIN_BACK_OFFER_ID = 'win_back_50_off';

export async function fetchWinBackOffering(): Promise<PurchasesOffering | null> {
  if (IS_EXPO_GO) return null;
  try {
    const offerings = await getNative()!.Purchases.getOfferings();
    return offerings.all?.win_back ?? null;
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] fetchWinBackOffering failed:', err);
    return null;
  }
}

export async function getPromoDiscount(pkg: PurchasesPackage): Promise<any | null> {
  if (IS_EXPO_GO || Platform.OS === 'android') return null;
  try {
    const discountOffer = (pkg.product as any).discounts?.find(
      (d: any) => d.identifier === WIN_BACK_OFFER_ID,
    );
    if (!discountOffer) return null;
    const { Purchases } = getNative()!;
    return await Purchases.getPromotionalOffer(pkg.product, discountOffer);
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] getPromoDiscount failed:', err);
    return null;
  }
}

export async function purchaseWithPromo(
  pkg: PurchasesPackage,
  discount: any | null,
): Promise<CustomerInfo> {
  if (IS_EXPO_GO) throw new Error('[RevenueCat] Purchases not available in Expo Go');
  const { Purchases } = getNative()!;
  const result = discount
    ? await Purchases.purchaseDiscountedPackage(pkg, discount)
    : await Purchases.purchasePackage(pkg);
  return result.customerInfo;
}

// ─── Re-export RevenueCatUI for inline Paywall component use ─────────────────

export const RevenueCatUI: any = IS_EXPO_GO
  ? RevenueCatUIStub
   
  : require('react-native-purchases-ui').default;
