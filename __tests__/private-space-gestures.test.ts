/**
 * __tests__/private-space-gestures.test.ts
 *
 * Pure-function unit tests for the swipe-to-reply gesture math in
 * app/(app)/private-space-gestures.ts (FEAT-2). Plain Jest, no RN rendering,
 * no gesture-handler/reanimated runtime — exercises exactly the boundary
 * values the FEAT-2 roadmap item's "Tests to write first" section calls out.
 */
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

import * as Haptics from 'expo-haptics';
import {
  clampDragTranslation,
  didCrossReplyThreshold,
  buildThreadBubbleGesture,
  buildThreadBubbleCallbacks,
  REPLY_SWIPE_MAX_OFFSET,
  REPLY_SWIPE_THRESHOLD,
} from '@/app/(app)/private-space-gestures';
import type { Message } from '@/services/supabase';

/** Flush the microtask queue `scheduleOnRN` hops through to reach the JS thread. */
async function flushScheduled(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setImmediate(r));
}

describe('clampDragTranslation', () => {
  const maxOffset = 60;

  it('clamps 0 to 0', () => {
    expect(clampDragTranslation(0, maxOffset)).toBe(0);
  });

  it('passes through a mid-range positive value unchanged', () => {
    expect(clampDragTranslation(30, maxOffset)).toBe(30);
  });

  it('passes through exactly at-max-offset unchanged', () => {
    expect(clampDragTranslation(60, maxOffset)).toBe(60);
  });

  it('clamps a value over max-offset down to max-offset', () => {
    expect(clampDragTranslation(120, maxOffset)).toBe(60);
  });

  it('clamps a negative (leftward) drag to 0', () => {
    expect(clampDragTranslation(-25, maxOffset)).toBe(0);
  });

  it('clamps a small negative drag to 0 (no partial leftward movement)', () => {
    expect(clampDragTranslation(-1, maxOffset)).toBe(0);
  });

  it('uses the real module constant as maxOffset', () => {
    expect(clampDragTranslation(999, REPLY_SWIPE_MAX_OFFSET)).toBe(REPLY_SWIPE_MAX_OFFSET);
  });
});

describe('didCrossReplyThreshold', () => {
  const threshold = 40;

  it('false at 0', () => {
    expect(didCrossReplyThreshold(0, threshold)).toBe(false);
  });

  it('false just under threshold', () => {
    expect(didCrossReplyThreshold(39, threshold)).toBe(false);
  });

  it('true exactly at threshold', () => {
    expect(didCrossReplyThreshold(40, threshold)).toBe(true);
  });

  it('true just over threshold', () => {
    expect(didCrossReplyThreshold(41, threshold)).toBe(true);
  });

  it('true at max offset (well over threshold)', () => {
    expect(didCrossReplyThreshold(60, threshold)).toBe(true);
  });

  it('false for a negative translation', () => {
    expect(didCrossReplyThreshold(-10, threshold)).toBe(false);
  });

  it('uses the real module constant as threshold', () => {
    expect(didCrossReplyThreshold(REPLY_SWIPE_THRESHOLD, REPLY_SWIPE_THRESHOLD)).toBe(true);
    expect(didCrossReplyThreshold(REPLY_SWIPE_THRESHOLD - 1, REPLY_SWIPE_THRESHOLD)).toBe(false);
  });
});

/**
 * buildThreadBubbleGesture — exercises the REAL react-native-gesture-handler
 * Gesture objects (Pan + LongPress raced together), invoking their actual
 * `.handlers.onUpdate/.onEnd/.onStart` functions directly. This is not a
 * mock: these are the exact worklet callbacks RNGH would call on a physical
 * touch, extracted from the real composed gesture and driven manually since
 * Jest/jsdom cannot simulate native touch/gesture recognition.
 */
describe('buildThreadBubbleGesture', () => {
  function setup(overrides?: { enabled?: boolean }) {
    const translateX = { value: 0 };
    const onSwipeCommit = jest.fn();
    const onLongPressCommit = jest.fn();
    const gesture = buildThreadBubbleGesture({
      enabled: overrides?.enabled ?? true,
      translateX,
      onSwipeCommit,
      onLongPressCommit,
    });
    return { translateX, onSwipeCommit, onLongPressCommit, ...gesture };
  }

  it('dragging past the threshold and releasing calls onSwipeCommit exactly once', async () => {
    const { panGesture, translateX, onSwipeCommit } = setup();
    (panGesture.handlers.onUpdate as any)({ translationX: 50 });
    expect(translateX.value).toBe(50);
    (panGesture.handlers.onEnd as any)({}, true);
    await flushScheduled();
    expect(onSwipeCommit).toHaveBeenCalledTimes(1);
  });

  it('dragging short of the threshold and releasing does NOT call onSwipeCommit, still springs back', async () => {
    const { panGesture, onSwipeCommit } = setup();
    (panGesture.handlers.onUpdate as any)({ translationX: 20 });
    (panGesture.handlers.onEnd as any)({}, true);
    await flushScheduled();
    expect(onSwipeCommit).not.toHaveBeenCalled();
  });

  it('clamps translateX at the configured max offset even for a much larger raw drag', () => {
    const { panGesture, translateX } = setup();
    (panGesture.handlers.onUpdate as any)({ translationX: 500 });
    expect(translateX.value).toBe(REPLY_SWIPE_MAX_OFFSET);
  });

  it('a leftward (negative) drag clamps to 0 and never commits', async () => {
    const { panGesture, translateX, onSwipeCommit } = setup();
    (panGesture.handlers.onUpdate as any)({ translationX: -30 });
    expect(translateX.value).toBe(0);
    (panGesture.handlers.onEnd as any)({}, true);
    await flushScheduled();
    expect(onSwipeCommit).not.toHaveBeenCalled();
  });

  it('evaluates commit against release-time translation, not a stale mid-gesture peak', async () => {
    const { panGesture, onSwipeCommit } = setup();
    // Drag past threshold mid-gesture...
    (panGesture.handlers.onUpdate as any)({ translationX: 55 });
    // ...then reverses back below threshold before release.
    (panGesture.handlers.onUpdate as any)({ translationX: 10 });
    (panGesture.handlers.onEnd as any)({}, true);
    await flushScheduled();
    expect(onSwipeCommit).not.toHaveBeenCalled();
  });

  it('long-press activating calls onLongPressCommit exactly once', async () => {
    const { longPressGesture, onLongPressCommit } = setup();
    (longPressGesture.handlers.onStart as any)({});
    await flushScheduled();
    expect(onLongPressCommit).toHaveBeenCalledTimes(1);
  });

  it('disabling (pending/deleted) sets enabled(false) on both gestures', () => {
    const { panGesture, longPressGesture } = setup({ enabled: false });
    expect(panGesture.config.enabled).toBe(false);
    expect(longPressGesture.config.enabled).toBe(false);
  });

  it('composes exactly panGesture and longPressGesture via Gesture.Race (mutual exclusivity)', () => {
    const { composedGesture, panGesture, longPressGesture } = setup();
    const raced = composedGesture.toGestureArray();
    expect(raced).toHaveLength(2);
    expect(raced).toContain(panGesture);
    expect(raced).toContain(longPressGesture);
  });

  it('pan requires real horizontal movement (minDistance) before it can win the race', () => {
    const { panGesture } = setup();
    expect(panGesture.config.minDist).toBe(10);
  });

  it('long-press fails once the finger travels past maxDistance, so a real drag cannot also win as a long-press', () => {
    const { longPressGesture } = setup();
    expect((longPressGesture.config as any).maxDist).toBe(10);
  });

  it('a touch that starts as a drag (crosses pan minDistance) never also fires the long-press commit', async () => {
    // Simulates the "touch A": horizontal movement past threshold — only the
    // pan gesture's onUpdate/onEnd handlers are ever invoked by the native
    // recognizer once Pan wins the Race; longPress's onStart handler is
    // never called for this touch (LongPress fails once past maxDistance).
    const { panGesture, onSwipeCommit, onLongPressCommit } = setup();
    (panGesture.handlers.onUpdate as any)({ translationX: 45 });
    (panGesture.handlers.onEnd as any)({}, true);
    await flushScheduled();
    expect(onSwipeCommit).toHaveBeenCalledTimes(1);
    expect(onLongPressCommit).not.toHaveBeenCalled();
  });

  it('a touch that starts as a stationary long-press never also fires the swipe commit', async () => {
    // Simulates "touch B": no meaningful horizontal movement — only the
    // long-press gesture's onStart handler is ever invoked by the native
    // recognizer once LongPress wins the Race; pan's onEnd handler is never
    // called for this touch (Pan never satisfies its own minDistance).
    const { longPressGesture, onSwipeCommit, onLongPressCommit } = setup();
    (longPressGesture.handlers.onStart as any)({});
    await flushScheduled();
    expect(onLongPressCommit).toHaveBeenCalledTimes(1);
    expect(onSwipeCommit).not.toHaveBeenCalled();
  });
});

/**
 * buildThreadBubbleCallbacks — the JS-thread wiring between the gesture's
 * "commit" callbacks and `ThreadBubble`'s own props (`onDeletePress`,
 * `onSwipeReply`) plus the haptic feedback each one fires. Tested in
 * isolation from both React rendering and the gesture-handler runtime.
 */
describe('buildThreadBubbleCallbacks', () => {
  const MESSAGE = { id: 'm1', text: 'hi', sender_id: 'user_a' } as unknown as Message;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('onSwipeCommit fires Medium haptic and calls onSwipeReply with the message', () => {
    const onDeletePress = jest.fn();
    const onSwipeReply = jest.fn();
    const { onSwipeCommit } = buildThreadBubbleCallbacks({ message: MESSAGE, onDeletePress, onSwipeReply });

    onSwipeCommit();

    expect(onSwipeReply).toHaveBeenCalledWith(MESSAGE);
    expect(onDeletePress).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('onLongPressCommit fires Medium haptic and calls onDeletePress, not onSwipeReply', () => {
    const onDeletePress = jest.fn();
    const onSwipeReply = jest.fn();
    const { onLongPressCommit } = buildThreadBubbleCallbacks({ message: MESSAGE, onDeletePress, onSwipeReply });

    onLongPressCommit();

    expect(onDeletePress).toHaveBeenCalledTimes(1);
    expect(onSwipeReply).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('onSwipeCommit is a no-op (besides haptics) when onSwipeReply is not provided', () => {
    const onDeletePress = jest.fn();
    const { onSwipeCommit } = buildThreadBubbleCallbacks({ message: MESSAGE, onDeletePress });

    expect(() => onSwipeCommit()).not.toThrow();
    expect(onDeletePress).not.toHaveBeenCalled();
  });
});
