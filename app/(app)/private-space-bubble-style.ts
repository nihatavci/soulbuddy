/**
 * app/(app)/private-space-bubble-style.ts
 *
 * FEAT-1 — the thread-bubble width-constraint chain, extracted from
 * `private-space.tsx::ThreadBubble` and its `StyleSheet.create` block.
 *
 * ROOT CAUSE (see run evidence FEAT-1-DEPTH-PROBE.md and
 * FEAT-1-G1-DEPTH-PLAN.md, both independently converged): the old
 * `styles.bubble` carried its own `maxWidth: '92%'`. Every ancestor between
 * it and `bubbleRow` (`bubbleSwipeAnchor` -> `Animated.View` -> `Pressable`)
 * is shrink-to-fit, so in Yoga's final `performLayout` pass the percentage
 * resolved against the bubble's OWN natural width, not the row's — shaving
 * every bubble to 92% of itself, on every render, for every string length.
 * Because padding (30pt) and border (2pt, mine only) are absolute, the 8%
 * came almost entirely out of the text content box. A single unbreakable
 * grapheme just silently overflowed (looked fine); two or more glyphs had a
 * break opportunity and visibly broke mid-word.
 *
 * INVARIANT (INV-1) THIS MODULE ENFORCES: a percentage-valued width
 * constraint may only be declared on a node whose direct PARENT has a
 * definite width. `bubbleSwipeAnchor`'s parent is `bubbleRow`, which is
 * stretched to the row's definite width — that is the only node in the
 * chain where a percentage is well-defined. `bubble` therefore carries NO
 * width constraint at all; `bubbleSwipeAnchor` is the sole surviving one.
 *
 * `bubbleText.flexShrink: 1` is DELIBERATELY left in place — it is inert
 * under the real defect (proven empirically in the G1 plan's C1 experiment)
 * and is still needed so the pending clock icon doesn't force an extra
 * line. Do not "clean it up" as part of a future pass on this file.
 */
import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { AppColors, Typography } from '@/constants/theme';

export const bubbleStyles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  // Wraps the reply-affordance icon + the swipeable bubble so the icon can
  // be absolutely positioned just to the bubble's left. This is the SOLE
  // percentage width constraint in the whole chain — see INV-1 above. Its
  // direct parent, `bubbleRow`, is the only ancestor with a definite width.
  bubbleSwipeAnchor: { position: 'relative', maxWidth: '92%' },
  replyAffordanceIcon: {
    position: 'absolute',
    left: -26,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  // NOTE: intentionally no `maxWidth`/`width`/`minWidth` here. Every node
  // between this one and `bubbleRow` (`Animated.View`, `Pressable`) is
  // shrink-to-fit; a percentage declared here would resolve against this
  // node's own natural width, not the row's — that was the FEAT-1 defect.
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bubbleInnerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  // Optimistic (not-yet-confirmed) bubble — same shape, quieter presence.
  bubblePending: { opacity: 0.55 },
  bubblePendingIcon: { marginBottom: 2 },
  // Tombstone (deleted-for-everyone) — same shape, quieter and italic, no
  // tail color distinction needed.
  bubbleDeleted: { backgroundColor: 'transparent', borderColor: 'rgba(13,13,16,0.12)' },
  // Mine -> right, paper with a subtle ink hairline, tail at bottom-right.
  bubbleMine: {
    backgroundColor: '#ECE5D9',
    borderWidth: 1,
    borderColor: 'rgba(13,13,16,0.1)',
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 16,
  },
  // Theirs -> left, dark ink, tail at bottom-left.
  bubbleTheirs: {
    backgroundColor: '#212125',
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 6,
  },
  // flexShrink: 1 is DELIBERATELY out of scope for this fix — see the module
  // doc above and clause 5 of __tests__/private-space-bubble-layout.test.tsx.
  bubbleText: { fontFamily: Typography.fonts.body, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  bubbleTextMine: { color: '#0D0D10' },
  bubbleTextTheirs: { color: '#F3EFE6' },
  bubbleTextDeleted: { fontStyle: 'italic', color: AppColors.textSecondary },
});

export interface BubbleStyleState {
  mine: boolean;
  pending: boolean;
  deleted: boolean;
}

/**
 * RECORDED DEVIATION (R6, G5/G6-reviewed, ruled acceptable): the roadmap's
 * §4/FEAT-1 step 6 specifies `composeBubbleStyles` returning exactly
 * `{ container, text }`. This module returns a superset —
 * `{ row, anchor, replyIcon, bubbleContainer, innerRow, text, pendingIcon }`
 * — with the bubble's own container key named `bubbleContainer`, not
 * `container`. Left as-is rather than renamed: the shape is already a
 * superset of the roadmap's 2-key contract by COUNT (five extra keys, not
 * just one renamed one), so a rename buys no closer conformance to the
 * literal text; it would only add edit surface across every call site
 * (`private-space.tsx`'s `ThreadBubble` and every clause in
 * `__tests__/private-space-bubble-layout.test.tsx`) for a cosmetic label.
 * The INV-1 polarity invariant the roadmap actually cares about — that the
 * container stack carries zero width constraints and `bubbleSwipeAnchor` is
 * the sole survivor — holds regardless of this key's name (verified by both
 * G5 and G6's independent reviews).
 */
export interface ComposedBubbleStyles {
  /** `bubbleRow` node — the only ancestor with a definite width. */
  row: StyleProp<ViewStyle>;
  /** `bubbleSwipeAnchor` — the sole surviving percentage width constraint. */
  anchor: StyleProp<ViewStyle>;
  replyIcon: StyleProp<ViewStyle>;
  /** The bubble's own container — carries no width constraint (see INV-1). */
  bubbleContainer: StyleProp<ViewStyle>;
  innerRow: StyleProp<ViewStyle>;
  /** The message `<Text>` node — no width/minWidth of its own. */
  text: StyleProp<TextStyle>;
  pendingIcon: StyleProp<ViewStyle>;
}

/**
 * Composes the per-render style groups for one `ThreadBubble` instance.
 * Returns disjoint groups (container stack vs. text stack) so both the
 * production render and the test suite can inspect them independently —
 * see __tests__/private-space-bubble-layout.test.tsx.
 */
export function composeBubbleStyles({ mine, pending, deleted }: BubbleStyleState): ComposedBubbleStyles {
  return {
    row: [bubbleStyles.bubbleRow, mine ? bubbleStyles.bubbleRowMine : bubbleStyles.bubbleRowTheirs],
    anchor: bubbleStyles.bubbleSwipeAnchor,
    replyIcon: bubbleStyles.replyAffordanceIcon,
    bubbleContainer: [
      bubbleStyles.bubble,
      mine ? bubbleStyles.bubbleMine : bubbleStyles.bubbleTheirs,
      pending ? bubbleStyles.bubblePending : undefined,
      deleted ? bubbleStyles.bubbleDeleted : undefined,
    ],
    innerRow: bubbleStyles.bubbleInnerRow,
    text: [
      bubbleStyles.bubbleText,
      mine ? bubbleStyles.bubbleTextMine : bubbleStyles.bubbleTextTheirs,
      deleted ? bubbleStyles.bubbleTextDeleted : undefined,
    ],
    pendingIcon: bubbleStyles.bubblePendingIcon,
  };
}
