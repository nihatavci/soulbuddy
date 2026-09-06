/**
 * __tests__/private-space-gestures.test.ts
 *
 * Pure-function unit tests for the swipe-to-reply gesture math in
 * app/(app)/private-space-gestures.ts. Plain Jest, no RN rendering, no
 * gesture-handler/reanimated runtime — exercises the real exported Pan
 * gesture's worklet handlers directly, plus the JS-thread callback wiring.
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
  REPLY_SWIPE_PAN_MIN_DISTANCE,
  REPLY_SWIPE_FAIL_OFFSET_Y,
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
 * Pan gesture, invoking its actual `.handlers.onUpdate/.onEnd` worklet
 * functions directly. Not a mock: these are the exact callbacks RNGH would
 * call on a physical touch, driven manually since Jest/jsdom cannot simulate
 * native gesture recognition.
 */
describe('buildThreadBubbleGesture', () => {
  function setup(overrides?: { enabled?: boolean }) {
    const translateX = { value: 0 };
    const onSwipeCommit = jest.fn();
    const gesture = buildThreadBubbleGesture({
      enabled: overrides?.enabled ?? true,
      translateX,
      onSwipeCommit,
    });
    return { translateX, onSwipeCommit, ...gesture };
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

  it('disabling (pending/deleted) sets enabled(false) on the gesture', () => {
    const { panGesture } = setup({ enabled: false });
    expect(panGesture.config.enabled).toBe(false);
  });

  it('requires real rightward movement (activeOffsetX) before it can activate at all — never fights vertical scroll', () => {
    const { panGesture } = setup();
    expect((panGesture.config as any).activeOffsetXEnd).toBe(REPLY_SWIPE_PAN_MIN_DISTANCE);
  });

  it('fails on vertical movement past the configured slop (failOffsetY) — yields the touch to the ScrollView', () => {
    const { panGesture } = setup();
    expect((panGesture.config as any).failOffsetYStart).toBe(-REPLY_SWIPE_FAIL_OFFSET_Y);
    expect((panGesture.config as any).failOffsetYEnd).toBe(REPLY_SWIPE_FAIL_OFFSET_Y);
  });

  it('is a single Pan gesture with no LongPress race — long-press lives entirely outside gesture-handler now', () => {
    const { panGesture } = setup();
    expect(panGesture).toBeDefined();
    // A lone (non-composed) gesture's own array is just itself — there is no
    // second (LongPress) gesture bundled in via Gesture.Race anymore.
    expect((panGesture as any).toGestureArray()).toEqual([panGesture]);
  });
});

/**
 * buildThreadBubbleCallbacks — the JS-thread wiring between the gesture's
 * "commit" callback and `ThreadBubble`'s own `onSwipeReply` prop, plus the
 * haptic feedback it fires. Tested in isolation from both React rendering
 * and the gesture-handler runtime.
 */
describe('buildThreadBubbleCallbacks', () => {
  const MESSAGE = { id: 'm1', text: 'hi', sender_id: 'user_a' } as unknown as Message;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('onSwipeCommit fires Medium haptic and calls onSwipeReply with the message', () => {
    const onSwipeReply = jest.fn();
    const { onSwipeCommit } = buildThreadBubbleCallbacks({ message: MESSAGE, onSwipeReply });

    onSwipeCommit();

    expect(onSwipeReply).toHaveBeenCalledWith(MESSAGE);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('onSwipeCommit is a no-op (besides haptics) when onSwipeReply is not provided', () => {
    const { onSwipeCommit } = buildThreadBubbleCallbacks({ message: MESSAGE });

    expect(() => onSwipeCommit()).not.toThrow();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });
});
