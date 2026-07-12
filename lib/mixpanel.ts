/**
 * lib/mixpanel.ts — Mixpanel Analytics Client
 *
 * Wraps Mixpanel React Native SDK for event tracking.
 * Primary analytics platform — Mixpanel with EU data residency.
 *
 * Token: EU data residency (api-eu.mixpanel.com)
 *
 * Usage:
 *   1. Call initMixpanel() once on app mount (in app/_layout.tsx)
 *   2. Call identifyMixpanelUser() after sign-in
 *   3. Use track* helpers throughout the app
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Mixpanel } from 'mixpanel-react-native';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

// ─── Instance ────────────────────────────────────────────────────────────────

// trackAutomaticEvents: false — we control every event ourselves (no auto-capture)
const mixpanel = new Mixpanel(TOKEN, /* trackAutomaticEvents */ false);

// ─── Initialize ──────────────────────────────────────────────────────────────

/**
 * Initialize Mixpanel. Call once at app boot, before any other calls.
 * Uses EU data residency endpoint to match GDPR requirements.
 */
export async function initMixpanel(): Promise<void> {
  if (!TOKEN) {
    if (__DEV__) console.warn('[Mixpanel] No token configured — analytics disabled. Set EXPO_PUBLIC_MIXPANEL_TOKEN.');
    return;
  }
  try {
    // init(optOutTrackingDefault, superProperties, serverURL, useGzipCompression)
    await mixpanel.init(
      false,                           // optOutTrackingDefault — start tracking immediately
      {},                              // superProperties — set below after init
      'https://api-eu.mixpanel.com',  // EU data residency
      false                            // useGzipCompression
    );

    // ── Super properties — attached to EVERY event automatically ─────────────
    // These let you slice any event by platform, version, or subscription tier
    // without having to manually pass them each time.
    mixpanel.registerSuperProperties({
      platform:    Platform.OS,
      app_version: Constants.expoConfig?.version ?? 'unknown',
      // is_pro and install_source are set later via setSuperPropertyIsPro()
      // and identifyMixpanelUser() once we know the values
    });

    if (__DEV__) console.log('[Mixpanel] initialized ✓');
    if (__DEV__) mixpanel.track('app_opened', { debug: true });
  } catch (e: any) {
    if (__DEV__) console.warn('[Mixpanel] init failed:', e?.message ?? e);
  }
}

// ─── Super property helpers ───────────────────────────────────────────────────

/**
 * Update the is_pro super property after entitlements load.
 * Call from _layout.tsx whenever isPro changes.
 */
export function setSuperPropertyIsPro(isPro: boolean): void {
  mixpanel.registerSuperProperties({ is_pro: isPro });
}

/**
 * Update install_source super property after AppsFlyer attribution resolves.
 * Call from initAppsFlyer's onInstallConversionData callback.
 */
export function setSuperPropertyInstallSource(source: string): void {
  mixpanel.registerSuperProperties({ install_source: source });
}

/**
 * Get the Mixpanel distinct ID. Used to link RevenueCat → Mixpanel so RC can
 * forward subscription lifecycle events server-side onto the same profile.
 */
export async function getMixpanelDistinctId(): Promise<string | null> {
  try {
    const id = await mixpanel.getDistinctId();
    return id || null;
  } catch {
    return null;
  }
}

// ─── Identity ────────────────────────────────────────────────────────────────

/**
 * Associate all future events with the Supabase user ID.
 * Call after sign-in / sign-up.
 */
export function identifyMixpanelUser(
  userId: string,
  properties?: { email?: string; name?: string },
): void {
  mixpanel.identify(userId);
  if (properties) {
    if (properties.email) mixpanel.getPeople().set('$email', properties.email);
    if (properties.name)  mixpanel.getPeople().set('$name', properties.name);
  }
}

/**
 * Reset identity on sign-out. Generates a new anonymous ID.
 */
export function resetMixpanelIdentity(): void {
  mixpanel.reset();
}

// ─── Revenue Events ──────────────────────────────────────────────────────────

export function trackMixpanelPaywallViewed(source: string): void {
  mixpanel.track('paywall_viewed', { source });
}

export function trackMixpanelSubscriptionStarted(productId: string): void {
  mixpanel.track('subscription_started', { product_id: productId });
  // Also set a people property so you can filter by subscribers in Mixpanel
  mixpanel.getPeople().set('is_pro', true);
  mixpanel.getPeople().set('subscribed_product', productId);
}

export function trackMixpanelSubscriptionCancelled(reason?: string): void {
  mixpanel.track('subscription_cancelled', { reason: reason ?? null });
  mixpanel.getPeople().set('is_pro', false);
}

export function trackMixpanelPurchasesRestored(): void {
  mixpanel.track('purchases_restored');
}

export function trackMixpanelPurchaseCancelled(): void {
  mixpanel.track('purchase_cancelled');
}

// ─── Feature Usage ───────────────────────────────────────────────────────────

export function trackMixpanelToneSelected(tone: string, isPro: boolean): void {
  mixpanel.track('tone_selected', { tone, is_pro: isPro });
}

export function trackMixpanelReplyGenerated(action: string, tone: string, hasImage: boolean): void {
  mixpanel.track('reply_generated', { action, tone, has_image: hasImage });
  // Increment a lifetime counter on the user profile
  mixpanel.getPeople().increment('total_replies_generated', 1);
}

export function trackMixpanelReplyEdited(): void {
  mixpanel.track('reply_edited');
}

export function trackMixpanelReplyCopied(): void {
  mixpanel.track('reply_copied');
  mixpanel.getPeople().increment('total_replies_copied', 1);
}

// ─── Push Notifications ──────────────────────────────────────────────────────

export function trackMixpanelPushPermissionGranted(): void {
  mixpanel.track('push_permission_granted');
  mixpanel.getPeople().set('push_enabled', true);
}

export function trackMixpanelPushPermissionDenied(): void {
  mixpanel.track('push_permission_denied');
  mixpanel.getPeople().set('push_enabled', false);
}

export function trackMixpanelNotificationOpened(notificationId: string): void {
  mixpanel.track('notification_opened', { notification_id: notificationId });
}

// ─── Engagement ──────────────────────────────────────────────────────────────

export function trackMixpanelSessionStarted(): void {
  mixpanel.track('session_started');
  mixpanel.getPeople().increment('total_sessions', 1);
  mixpanel.getPeople().set('last_seen', new Date().toISOString());
}

export function trackMixpanelSessionEnded(durationSeconds: number): void {
  mixpanel.track('session_ended', { duration_seconds: durationSeconds });
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export function trackMixpanelReviewPromptShown(): void {
  mixpanel.track('review_prompt_shown');
}

export function trackMixpanelReviewPromptAccepted(): void {
  mixpanel.track('review_prompt_accepted');
}

export function trackMixpanelInstallAttributed(params: {
  af_status: string;
  media_source: string;
  campaign: string;
  adset: string;
}): void {
  mixpanel.track('install_attributed', params);
  mixpanel.getPeople().setOnce('install_source', params.media_source);
  mixpanel.getPeople().setOnce('install_campaign', params.campaign);
  // Also register as super property so every subsequent event carries it
  mixpanel.registerSuperProperties({ install_source: params.media_source });
}

// ─── Consent ──────────────────────────────────────────────────────────────────

export function trackMixpanelConsentAcceptedAll(): void {
  mixpanel.track('consent_accepted_all');
  mixpanel.getPeople().set('consent_level', 'all');
  mixpanel.getPeople().setOnce('consent_given_at', new Date().toISOString());
}

export function trackMixpanelConsentRejectedNonEssential(): void {
  mixpanel.track('consent_rejected_non_essential');
  mixpanel.getPeople().set('consent_level', 'essential_only');
  mixpanel.getPeople().setOnce('consent_given_at', new Date().toISOString());
}

export function trackMixpanelConsentCustomized(prefs: Record<string, boolean>): void {
  mixpanel.track('consent_customized', prefs);
  mixpanel.getPeople().set('consent_level', 'custom');
  mixpanel.getPeople().setOnce('consent_given_at', new Date().toISOString());
}

// ─── Onboarding steps ─────────────────────────────────────────────────────────

export function trackMixpanelOnboardingStepCompleted(step: string, stepIndex: number): void {
  mixpanel.track('onboarding_step_completed', { step, step_index: stepIndex });
}

export function trackMixpanelOnboardingCompleted(): void {
  mixpanel.track('onboarding_completed');
  mixpanel.getPeople().set('onboarding_completed', true);
  mixpanel.getPeople().setOnce('onboarding_completed_at', new Date().toISOString());
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export function trackMixpanelSignupCompleted(params: {
  method: 'google' | 'apple' | 'email' | 'anonymous';
  gender?: string;
  age_range?: string;
  intention?: string;
}): void {
  mixpanel.track('signup_completed', params);
  mixpanel.getPeople().set('signup_method', params.method);
  mixpanel.getPeople().setOnce('signup_completed_at', new Date().toISOString());
  if (params.gender)    mixpanel.getPeople().setOnce('gender', params.gender);
  if (params.age_range) mixpanel.getPeople().setOnce('age_range', params.age_range);
  if (params.intention) mixpanel.getPeople().setOnce('intention', params.intention);
}

export function trackMixpanelSignupSkipped(): void {
  mixpanel.track('signup_skipped');
  mixpanel.getPeople().set('signup_method', 'skipped');
}

// ─── Reply / Core feature ─────────────────────────────────────────────────────

export function trackMixpanelReplyGeneratedFull(params: {
  action: string;
  has_image: boolean;
  is_pro: boolean;
  is_first: boolean;
  tone?: string;
}): void {
  mixpanel.track('reply_generated', params);
  mixpanel.getPeople().increment('total_replies_generated', 1);
  if (params.is_first) {
    mixpanel.getPeople().setOnce('first_reply_at', new Date().toISOString());
    mixpanel.track('first_reply_generated', params);
  }
}

export function trackMixpanelReplyCopiedFull(params: {
  action: string;
  tone: string;
  is_pro: boolean;
}): void {
  mixpanel.track('reply_copied', params);
  mixpanel.getPeople().increment('total_replies_copied', 1);
}

export function trackMixpanelToneSelectedFull(params: {
  tone: string;
  action: string;
  is_pro: boolean;
}): void {
  mixpanel.track('tone_selected', params);
}

export function trackMixpanelImageUploaded(source: 'library' | 'camera'): void {
  mixpanel.track('image_uploaded', { source });
  mixpanel.getPeople().increment('total_images_uploaded', 1);
}

export function trackMixpanelDailyLimitHit(remaining: number): void {
  mixpanel.track('daily_limit_hit', { remaining });
  mixpanel.getPeople().increment('daily_limit_hit_count', 1);
}

export function trackMixpanelGenerateMoreTapped(action: string): void {
  mixpanel.track('generate_more_tapped', { action });
}

// ─── Bio Scan ─────────────────────────────────────────────────────────────────

export function trackMixpanelBioScanStarted(): void {
  mixpanel.track('bio_scan_started');
  mixpanel.getPeople().increment('total_bio_scans', 1);
}

export function trackMixpanelBioScanCompleted(suggestionCount: number): void {
  mixpanel.track('bio_scan_completed', { suggestion_count: suggestionCount });
}

export function trackMixpanelBioScanCopied(): void {
  mixpanel.track('bio_scan_reply_copied');
}

// ─── Challenges & Lessons ─────────────────────────────────────────────────────

export function trackMixpanelChallengeOpened(challengeId: string, isPro: boolean): void {
  mixpanel.track('challenge_opened', { challenge_id: challengeId, is_pro: isPro });
}

export function trackMixpanelChallengeLockedTapped(challengeId: string): void {
  mixpanel.track('challenge_locked_tapped', { challenge_id: challengeId });
}

export function trackMixpanelLessonStarted(params: {
  lesson_id: string;
  challenge_id: string;
  lesson_index: number;
}): void {
  mixpanel.track('lesson_started', params);
}

export function trackMixpanelLessonStepCompleted(params: {
  lesson_id: string;
  step_index: number;
  step_type: string;
}): void {
  mixpanel.track('lesson_step_completed', params);
}

export function trackMixpanelLessonCompleted(params: {
  lesson_id: string;
  challenge_id: string;
}): void {
  mixpanel.track('lesson_completed', params);
  mixpanel.getPeople().increment('total_lessons_completed', 1);
}

export function trackMixpanelQuizAnswered(params: {
  lesson_id: string;
  step_index: number;
  correct: boolean;
}): void {
  mixpanel.track('quiz_answered', params);
}

export function trackMixpanelMissionCompleted(lesson_id: string): void {
  mixpanel.track('mission_completed', { lesson_id });
  mixpanel.getPeople().increment('total_missions_completed', 1);
}

// ─── App lifecycle / Retention ───────────────────────────────────────────────

export function trackMixpanelAppOpened(params: {
  days_since_install: number;
  session_count: number;
  is_return_visit: boolean;
}): void {
  mixpanel.track('app_opened', params);
  mixpanel.getPeople().set('last_seen', new Date().toISOString());
  mixpanel.getPeople().increment('total_sessions', 1);
}

// ─── Paywall extras ───────────────────────────────────────────────────────────

export function trackMixpanelPaywallPlanSelected(plan: string): void {
  mixpanel.track('paywall_plan_selected', { plan });
}

export function trackMixpanelTrialStarted(plan: string): void {
  mixpanel.track('trial_started', { plan });
  mixpanel.getPeople().setOnce('trial_start_date', new Date().toISOString());
}

export function trackMixpanelSubscriptionStartedFull(params: {
  product_id: string;
  plan: string;
  revenue: number;
  currency: string;
  is_trial: boolean;
  install_source?: string;
}): void {
  mixpanel.track('subscription_started', params);
  mixpanel.getPeople().set('is_pro', true);
  mixpanel.getPeople().set('subscription_plan', params.plan);
  mixpanel.getPeople().setOnce('subscription_start_date', new Date().toISOString());
  // Revenue tracking — shows in Mixpanel's Revenue report
  mixpanel.getPeople().trackCharge(params.revenue, {});
}

// ─── Generic ─────────────────────────────────────────────────────────────────

/**
 * Fire any custom event. Use the typed helpers above when possible.
 */
export function trackMixpanel(event: string, properties?: Record<string, any>): void {
  mixpanel.track(event, properties);
}

// ─── Consent ─────────────────────────────────────────────────────────────────

export function optInMixpanel(): void {
  mixpanel.optInTracking();
}

export function optOutMixpanel(): void {
  mixpanel.optOutTracking();
}
