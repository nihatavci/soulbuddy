/**
 * Swipe-to-reply gesture logic for `ThreadBubble` (app/(app)/private-space.tsx).
 *
 * Two layers:
 *
 *  1. Plain, worklet-free, RN-free pure functions (`clampDragTranslation`,
 *     `didCrossReplyThreshold`) — unit-testable with zero runtime dependency.
 *  2. `buildThreadBubbleGesture` — a factory that constructs the real
 *     `react-native-gesture-handler` Pan gesture. It takes plain
 *     callback/shared-value dependencies rather than calling hooks itself, so
 *     a test can invoke the REAL exported gesture's `.handlers.onUpdate/.onEnd`
 *     directly — the exact functions that would run on a physical touch —
 *     without mounting a component or simulating native touch events.
 *
 * Root-cause note (build 24 → 25): the first version of this gesture raced a
 * `Gesture.Pan` against a `Gesture.LongPress` via `Gesture.Race`, and shipped
 * a reproducible crash on swipe. No TestFlight crash log ever became
 * available to prove the exact native fault, but code review turned up a
 * concrete, well-documented gesture-handler defect: the Pan gesture had NO
 * direction constraint (`activeOffsetX`/`failOffsetY`) despite living inside
 * a vertically-scrolling `ScrollView` (the message thread) — so it could
 * activate on vertical movement too, putting it in direct, undirected
 * competition with the ScrollView's own native pan recognizer AND with the
 * raced LongPress gesture simultaneously. Two native gesture-handler
 * recognizers racing on the same view with no direction constraint, nested
 * inside a third (the ScrollView's own), is a known crash class on Fabric/New
 * Architecture. This rewrite removes the internal Race+LongPress entirely
 * (long-press stays on the plain, already-stable `Pressable` in
 * `private-space.tsx`, a completely different, non-gesture-handler responder)
 * and constrains Pan to near-horizontal motion only, mirroring the pattern
 * `react-native-gesture-handler`'s own `Swipeable` component uses to coexist
 * with a scrollable list and a tappable child.
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

/** Pan must travel this far rightward before it starts competing for the touch at all. */
export const REPLY_SWIPE_PAN_MIN_DISTANCE = 10;

/**
 * Vertical slop (points) allowed before a near-vertical drag disqualifies
 * Pan — keeps this gesture out of the ScrollView's way for anything that
 * isn't a deliberate horizontal swipe.
 */
export const REPLY_SWIPE_FAIL_OFFSET_Y = 10;

/**
 * Clamp a raw rightward drag distance to `[0, maxOffset]`. This is a
 * rightward-only gesture (WhatsApp-style reply reveal) — any non-positive
 * (leftward or zero) raw distance clamps to 0, never producing visual
 * movement past origin.
 *
 * Explicit `'worklet'` directive (root cause of the build-24/26 crash, found
 * via a real device crash log): this function is called from inside the Pan
 * gesture's `onUpdate` worklet on the UI thread. Without its own `'worklet'`
 * directive, calling it there throws Reanimated's "Tried to synchronously
 * call a non-worklet function on the UI thread" — an uncaught JS exception
 * inside the native gesture-event dispatch path, which Hermes/worklets has
 * no recovery for and aborts the process (SIGABRT). Confirmed via
 * `~/Library/Logs/DiagnosticReports/resense-*.ips`: the crashing thread's
 * backtrace runs UIGestureRecognizer → RNGestureHandler → Reanimated
 * event dispatch → WorkletEventHandler::process → HermesRuntimeImpl::call →
 * throwPendingError → abort. Same fix applies to didCrossReplyThreshold
 * below, called from `onEnd`.
 */
export function clampDragTranslation(rawDx: number, maxOffset: number): number {
  'worklet';
  if (rawDx <= 0) return 0;
  return Math.min(rawDx, maxOffset);
}

/**
 * Whether a translation value at release time has crossed the reply
 * threshold. Pure boolean — must be evaluated against the *release-time*
 * translation only (never a stale mid-gesture peak value), so a drag that
 * crosses the threshold then reverses before release correctly does NOT fire.
 * Explicit `'worklet'` directive — see clampDragTranslation's comment above.
 */
export function didCrossReplyThreshold(translation: number, threshold: number): boolean {
  'worklet';
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
}

export interface ThreadBubbleGesture {
  panGesture: ReturnType<typeof Gesture.Pan>;
}

/**
 * Builds the real Pan gesture for swipe-to-reply. Called from inside
 * `ThreadBubble` (where `translateX` is a real `useSharedValue`), and
 * directly from tests (where `translateX` is a plain `{ value: 0 }` object)
 * — this function itself calls no hooks, so both are valid.
 *
 * `.activeOffsetX(REPLY_SWIPE_PAN_MIN_DISTANCE)` — only starts competing for
 * the touch once the finger has moved this far rightward.
 * `.failOffsetY([-N, N])` — fails immediately (yields to the ScrollView) once
 * vertical movement exceeds the slop, before it can ever activate. Together
 * these keep Pan a strictly-horizontal gesture, so a vertical scroll on the
 * thread and a horizontal swipe on a bubble never contend for the same touch.
 */
export function buildThreadBubbleGesture({
  enabled,
  translateX,
  onSwipeCommit,
}: BuildThreadBubbleGestureParams): ThreadBubbleGesture {
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(REPLY_SWIPE_PAN_MIN_DISTANCE)
    .failOffsetY([-REPLY_SWIPE_FAIL_OFFSET_Y, REPLY_SWIPE_FAIL_OFFSET_Y])
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

  return { panGesture };
}

export interface BuildThreadBubbleCallbacksParams {
  message: Message;
  onSwipeReply?: (message: Message) => void;
}

export interface ThreadBubbleCallbacks {
  onSwipeCommit: () => void;
}

/**
 * JS-thread wiring between the gesture's "commit" callback and the
 * component's own props — kept as a plain function (no hooks, no RN
 * rendering) so it's directly unit-testable.
 */
export function buildThreadBubbleCallbacks({
  message,
  onSwipeReply,
}: BuildThreadBubbleCallbacksParams): ThreadBubbleCallbacks {
  return {
    onSwipeCommit: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSwipeReply?.(message);
    },
  };
}
