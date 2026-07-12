/**
 * Attachment style types used by the infographic system.
 *
 * Extracted from services/onboardingScoring.ts during cleanup of
 * deprecated onboarding components (Phase 17 Plan 04).
 */

export type AttachmentStyle =
  | 'secure'
  | 'anxious_preoccupied'
  | 'dismissive_avoidant'
  | 'fearful_avoidant';

export interface AttachmentResult {
  style: AttachmentStyle;
  anxietyScore: number;    // 0.0 - 1.0
  avoidanceScore: number;  // 0.0 - 1.0
  secureScore: number;     // derived: 1 - max(anxiety, avoidance)
}
