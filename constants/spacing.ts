/**
 * Golden Ratio Spacing System
 *
 * φ = 1.618  |  Base unit: 4px
 *
 * Each step is base × φ^n, rounded to nearest even/practical value.
 * Use these tokens everywhere — no raw numbers in StyleSheet.
 */

// ─── Core Scale ───────────────────────────────────────────────────────────────
export const Space = {
  '3xs':  2,   // Micro nudges, optical corrections
  '2xs':  4,   // Tight intra-element spacing
  xs:     6,   // Strong relationships (title ↔ subtitle)
  sm:     10,  // Label ↔ input, icon ↔ text gaps
  md:     16,  // Field groups, section sub-gaps
  lg:     26,  // Section breaks, card padding
  xl:     42,  // Major section separation
  '2xl':  68,  // Screen-level vertical padding
  '3xl':  110, // Hero spacing
} as const;

export type SpaceToken = keyof typeof Space;

// ─── Semantic Relation Scale ───────────────────────────────────────────────────
// Use these when spacing two related elements — conveys hierarchy visually.
export const Relation = {
  strong: Space.xs,   //  6px — title ↔ subtitle (same semantic unit)
  medium: Space.md,   // 16px — subtitle ↔ body, field ↔ field
  weak:   Space.lg,   // 26px — section ↔ section (new context)
  break:  Space.xl,   // 42px — major group separation
} as const;

// ─── Optical Padding Utility ──────────────────────────────────────────────────
/**
 * Compensates for line-height whitespace (~15% of font size) baked into
 * React Native Text components. Apply to containers wrapping text so visual
 * padding matches the intended value.
 *
 * Usage:
 *   <View style={[styles.card, opticalPadding(Space.lg, 14)]}>
 */
export function opticalPadding(basePadding: number, fontSize: number) {
  const correction = Math.round(fontSize * 0.15);
  return {
    paddingTop:        basePadding - correction,
    paddingBottom:     basePadding,
    paddingHorizontal: basePadding,
  };
}

// ─── Layout Helpers ───────────────────────────────────────────────────────────
/**
 * Standard screen horizontal padding.
 * Matches lg (26) which is 1 golden step above md (16).
 */
export const ScreenPaddingH = Space.lg; // 26

/**
 * Standard screen top padding.
 * Matches xl (42) — breathing room below safe area / nav.
 */
export const ScreenPaddingTop = Space.xl; // 42

/**
 * Standard screen bottom padding.
 * Matches lg (26) — lighter than top for thumb reach.
 */
export const ScreenPaddingBottom = Space.lg; // 26
