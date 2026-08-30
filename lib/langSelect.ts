/**
 * Pure decision logic for the profile screen's language switcher.
 *
 * Extracted out of app/(app)/profile.tsx's handleSelectLang so the
 * no-op guard and the persist-with-fallback wrapper are unit-testable
 * without a React Native screen-test harness.
 */

import { setLangOverride, type SupportedLang } from '@/i18n';

export interface LangSelectionResult {
  shouldApply: boolean;
  nextLang?: SupportedLang;
}

/**
 * Decides whether switching to `requestedLang` should actually take effect.
 * No-ops when the requested language is already active.
 */
export function resolveLangSelection(
  currentLang: SupportedLang,
  requestedLang: SupportedLang,
): LangSelectionResult {
  if (requestedLang === currentLang) {
    return { shouldApply: false };
  }
  return { shouldApply: true, nextLang: requestedLang };
}

/**
 * Persists the language override, swallowing any storage failure.
 * Returns whether the persist succeeded, so callers can log/track it
 * without needing to handle a thrown error themselves.
 */
export function persistLangOverride(lang: SupportedLang): boolean {
  try {
    setLangOverride(lang);
    return true;
  } catch {
    return false;
  }
}
