/**
 * Swipe-to-reply gesture logic for `ThreadBubble` (app/(app)/private-space.tsx).
 *
 * Two layers, per FEAT-2's mission-mandated split:
 *
 *  1. Plain, worklet-free, RN-free pure functions (`clampDragTranslation`,
 *     `didCrossReplyThreshold`) — unit-testable with zero runtime dependency.
 *  2. `buildThreadBubbleGesture` — a factory that constructs the real
 *     `react-native-gesture-handler` Gesture objects (Pan + LongPress,
 *     composed via `Gesture.Race`). It takes plain callback/shared-value
 *     dependencies rather than calling hooks itself, so a test can invoke the
 *     REAL exported gesture's `.handlers.onUpdate/.onEnd/.onStart` directly —
 *     the exact functions that would run on a physical touch — without
 *     mounting a component or simulating native touch events.
 *
 * Gesture-exclusivity design (mission's CRITICAL UNHAPPY-PATH requirement):
 * the existing long-press (delete-choice) and the new swipe-to-reply drag
 * MUST NOT both fire for one physical touch. This is enforced by:
 *   - Composing the two gestures with `Gesture.Race(pan, longPress)`: RNGH's
 *     Race semantics mean the FIRST gesture in the group to transition to the
 *     ACTIVE state wins and the native runtime cancels every other member of
 *     the race for that same touch — structurally impossible for both to
 *     reach their "commit" callback for one touch.
 *   - Tuning each gesture's own activation criteria so the *correct* one wins
 *     for each touch shape: `panGesture.minDistance(...)` requires real
 *     horizontal movement before Pan can even begin recognizing (a stationary
 *     press never activates it), while `longPressGesture.maxDistance(...)`
 *     makes LongPress FAIL the moment the finger travels past a small radius
 *     (a real drag disqualifies it before its `minDuration` timer matters).
 *     A stationary hold can only ever satisfy LongPress; a horizontal drag
 *     can only ever satisfy Pan — the Race then has at most one winner.
 */
import { Gesture } from 'react-native-gesture-handler';
import { withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import type { Message } from '@/services/supabase';

/** Max rightward drag distance (points) the bubble is allowed to visually move. */
export const REPLY_SWIPE_MAX_OFFSET = 60;

/** Rightward drag distance (points) that counts as "committed to reply". */
export const REPLY_SWIPE_THRESHOLD = 40;

/** Pan must travel this far before it starts competing for the touch at all. */
export const REPLY_SWIPE_PAN_MIN_DISTANCE = 10;

/** Matches the existing long-press `delayLongPress={350}` this replaces. */
export const REPLY_SWIPE_LONGPRESS_MIN_DURATION = 350;

/** LongPress fails once the finger travels past this many points. */
export const REPLY_SWIPE_LONGPRESS_MAX_DISTANCE = 10;

/**
 * Clamp a raw rightward drag distance to `[0, maxOffset]`. This is a
 * rightward-only gesture (WhatsApp-style reply reveal) — any non-positive
 * (leftward or zero) raw distance clamps to 0, never producing visual
 * movement past origin.
 */
export function clampDragTranslation(rawDx: number, maxOffset: number): number {
  if (rawDx <= 0) return 0;
  return Math.min(rawDx, maxOffset);
}

/**
 * Whether a translation value at release time has crossed the reply
 * threshold. Pure boolean — must be evaluated against the *release-time*
 * translation only (never a stale mid-gesture peak value), so a drag that
 * crosses the threshold then reverses before release correctly does NOT fire.
 */
export function didCrossReplyThreshold(translation: number, threshold: number): boolean {
  return translation >= threshold;
}

/** Minimal shape `useSharedValue<number>()` satisfies — kept generic for tests. */
export interface SharedNumberRef {
  value: number;
}

export interface BuildThreadBubbleGestureParams {
  /** false for pending/optimistic or already-deleted (tombstone) bubbles. */
  enabled: boolean;
  /** Live drag offset — mutated by the Pan gesture, read by the animated style. */
  translateX: SharedNumberRef;
  /** Called (on the JS thread) when a release crosses the reply threshold. */
  onSwipeCommit: () => void;
  /** Called (on the JS thread) when the long-press gesture activates. */
  onLongPressCommit: () => void;
}

export interface ThreadBubbleGesture {
  panGesture: ReturnType<typeof Gesture.Pan>;
  longPressGesture: ReturnType<typeof Gesture.LongPress>;
  composedGesture: ReturnType<typeof Gesture.Race>;
}

/**
 * Builds the real Pan + LongPress gestures and races them. Called from
 * inside `ThreadBubble` (where `translateX` is a real `useSharedValue`), and
 * directly from tests (where `translateX` is a plain `{ value: 0 }` object)
 * — this function itself calls no hooks, so both are valid.
 */
export function buildThreadBubbleGesture({
  enabled,
  translateX,
  onSwipeCommit,
  onLongPressCommit,
}: BuildThreadBubbleGestureParams): ThreadBubbleGesture {
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .minDistance(REPLY_SWIPE_PAN_MIN_DISTANCE)
    .onUpdate((event) => {
      'worklet';
      translateX.value = clampDragTranslation(event.translationX, REPLY_SWIPE_MAX_OFFSET);
    })
    .onEnd(() => {
      'worklet';
      const crossed = didCrossReplyThreshold(translateX.value, REPLY_SWIPE_THRESHOLD);
      // Always spring back to 0, whether or not the threshold was crossed.
      translateX.value = withSpring(0);
      if (crossed) {
        scheduleOnRN(onSwipeCommit);
      }
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(enabled)
    .minDuration(REPLY_SWIPE_LONGPRESS_MIN_DURATION)
    .maxDistance(REPLY_SWIPE_LONGPRESS_MAX_DISTANCE)
    .onStart(() => {
      'worklet';
      scheduleOnRN(onLongPressCommit);
    });

  return {
    panGesture,
    longPressGesture,
    composedGesture: Gesture.Race(panGesture, longPressGesture),
  };
}

export interface BuildThreadBubbleCallbacksParams {
  message: Message;
  onDeletePress: () => void;
  onSwipeReply?: (message: Message) => void;
}

export interface ThreadBubbleCallbacks {
  onSwipeCommit: () => void;
  onLongPressCommit: () => void;
}

/**
 * JS-thread wiring between the gesture's "commit" callbacks and the
 * component's own props — kept as a plain function (no hooks, no RN
 * rendering) so it's directly unit-testable, matching FEAT-2's mission
 * point 2 (haptic style) and point 6 (unit-testable without a component).
 */
export function buildThreadBubbleCallbacks({
  message,
  onDeletePress,
  onSwipeReply,
}: BuildThreadBubbleCallbacksParams): ThreadBubbleCallbacks {
  return {
    onSwipeCommit: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSwipeReply?.(message);
    },
    onLongPressCommit: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDeletePress();
    },
  };
}
