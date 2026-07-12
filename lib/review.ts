/**
 * lib/review.ts — Native in-app review request, fired at a delight moment.
 *
 * Replaces the old onboarding ReviewPromptScreen. Instead of asking for a
 * rating before the user has experienced any value (which burned our one-shot
 * StoreReview prompt on cold users), we request the review the first time the
 * user copies a generated reply — a genuine "I got value" signal.
 *
 * Gated once per user via the `review_prompt_shown` MMKV flag (the same flag
 * the old onboarding screen used, so users who already saw it won't be asked).
 */

import * as StoreReview from 'expo-store-review';
import { Prefs } from '@/store/mmkv';

/**
 * Request the native App Store / Play in-app review dialog once, ever.
 * Safe to call repeatedly — it no-ops after the first successful request.
 * Fire-and-forget; never throws.
 */
export async function maybeRequestReview(): Promise<void> {
  if (Prefs.getBool('review_prompt_shown')) return;
  try {
    if (await StoreReview.isAvailableAsync()) {
      // Set the flag BEFORE requesting so a slow/duplicate call can't double-fire.
      Prefs.setBool('review_prompt_shown', true);
      StoreReview.requestReview();
    }
  } catch {
    // Simulator / unsupported device — leave the flag unset so a real device
    // still gets one shot later.
  }
}
