/**
 * lib/consent.ts — GDPR Consent Management
 *
 * Stores and retrieves user consent preferences for analytics, crash reporting,
 * and AI data processing. Uses MMKV (Prefs) for persistent storage.
 *
 * Consent categories:
 *   - analytics:   Mixpanel event tracking
 *   - crashReport: Sentry error monitoring and session replay
 *   - aiProcessing: Gemini Flash AI data processing
 *
 * All categories default to false (opted out) until the user makes a choice.
 * Essential services (auth, core app functionality) do not require consent.
 */

import { Prefs } from '@/store/mmkv';

// ─── Keys ────────────────────────────────────────────────────────────────────

/** Set to true once the user has made any consent choice (accept/reject/customize). */
export const CONSENT_GIVEN_KEY = 'gdpr_consent_given';

/** Individual consent category keys */
export const CONSENT_ANALYTICS_KEY = 'gdpr_consent_analytics';
export const CONSENT_CRASH_KEY = 'gdpr_consent_crash_report';
export const CONSENT_AI_KEY = 'gdpr_consent_ai_processing';

/** CCPA: "Do Not Sell My Personal Information" preference */
export const CCPA_DO_NOT_SELL_KEY = 'ccpa_do_not_sell';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsentPreferences {
  analytics: boolean;
  crashReport: boolean;
  aiProcessing: boolean;
}

// ─── Read ────────────────────────────────────────────────────────────────────

/** Whether the user has ever been shown and responded to the consent prompt. */
export function hasGivenConsent(): boolean {
  return Prefs.getBool(CONSENT_GIVEN_KEY);
}

/** Read all consent preferences. Defaults to false for every category. */
export function getConsentPreferences(): ConsentPreferences {
  return {
    analytics: Prefs.getBool(CONSENT_ANALYTICS_KEY),
    crashReport: Prefs.getBool(CONSENT_CRASH_KEY),
    aiProcessing: Prefs.getBool(CONSENT_AI_KEY),
  };
}

// ─── Write ───────────────────────────────────────────────────────────────────

/** Save consent preferences and mark consent as given. */
export function saveConsentPreferences(prefs: ConsentPreferences): void {
  Prefs.setBool(CONSENT_ANALYTICS_KEY, prefs.analytics);
  Prefs.setBool(CONSENT_CRASH_KEY, prefs.crashReport);
  Prefs.setBool(CONSENT_AI_KEY, prefs.aiProcessing);
  Prefs.setBool(CONSENT_GIVEN_KEY, true);
}

/** Accept all non-essential data processing. */
export function acceptAllConsent(): void {
  saveConsentPreferences({
    analytics: true,
    crashReport: true,
    aiProcessing: true,
  });
}

/** Reject all non-essential data processing (essential services still run). */
export function rejectNonEssentialConsent(): void {
  saveConsentPreferences({
    analytics: false,
    crashReport: false,
    aiProcessing: false,
  });
}

// ─── CCPA ───────────────────────────────────────────────────────────────────

/** Whether user has opted out of data selling under CCPA. */
export function getCcpaDoNotSell(): boolean {
  return Prefs.getBool(CCPA_DO_NOT_SELL_KEY);
}

/** Set CCPA "Do Not Sell" preference. */
export function setCcpaDoNotSell(doNotSell: boolean): void {
  Prefs.setBool(CCPA_DO_NOT_SELL_KEY, doNotSell);
}
