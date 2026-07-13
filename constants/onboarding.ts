/**
 * constants/onboarding.ts — locked intent + boundary vocabulary.
 *
 * `value`s MUST match the DB CHECK constraints applied in Plan 01
 * (008_resense_profiles.sql) exactly — the server rejects out-of-vocab arrays.
 * `labelKey`s resolve to English copy in i18n/en.json (i18n-clean for later TR/DE).
 */

export interface OnboardingOption {
  value: string;
  labelKey: string;
}

// intent CHECK: date | slow_burn | conversation | maybe
export const INTENT_OPTIONS: OnboardingOption[] = [
  { value: 'date', labelKey: 'onboarding.intent.date' },
  { value: 'slow_burn', labelKey: 'onboarding.intent.slow_burn' },
  { value: 'conversation', labelKey: 'onboarding.intent.conversation' },
  { value: 'maybe', labelKey: 'onboarding.intent.maybe' },
];

// boundaries CHECK: no_explicit_content | not_looking_to_meet_yet | go_slow | text_only
export const BOUNDARY_OPTIONS: OnboardingOption[] = [
  { value: 'no_explicit_content', labelKey: 'onboarding.boundary.no_explicit_content' },
  { value: 'not_looking_to_meet_yet', labelKey: 'onboarding.boundary.not_looking_to_meet_yet' },
  { value: 'go_slow', labelKey: 'onboarding.boundary.go_slow' },
  { value: 'text_only', labelKey: 'onboarding.boundary.text_only' },
];
