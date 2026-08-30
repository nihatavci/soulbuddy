/**
 * __tests__/useSpaceClosurePrompt.test.ts
 *
 * growth-3-space-closure-ritual: pure-function coverage for the day-silence
 * calculation and the dismissal-state check that back the check-in.tsx
 * "this space quieted naturally" prompt. Written BEFORE the implementation
 * (TDD) — these must fail for "module not found" first, then pass once
 * hooks/useSpaceClosurePrompt.ts exists.
 */
import { act, renderHook } from '@testing-library/react-native';

const mockPrefsGet = jest.fn();
const mockPrefsSet = jest.fn();
jest.mock('@/store/mmkv', () => ({
  Prefs: {
    get: (...args: unknown[]) => mockPrefsGet(...args),
    set: (...args: unknown[]) => mockPrefsSet(...args),
  },
}));

import {
  daysSinceLastMessage,
  isClosurePromptDismissed,
  useSpaceClosurePrompt,
  SPACE_CLOSURE_SILENCE_DAYS,
} from '@/hooks/useSpaceClosurePrompt';

describe('daysSinceLastMessage', () => {
  const NOW = new Date('2026-08-30T12:00:00.000Z');

  it('returns null when lastMessageAtISO is null/missing (zero-message space)', () => {
    expect(daysSinceLastMessage(null, NOW)).toBeNull();
    expect(daysSinceLastMessage(undefined, NOW)).toBeNull();
  });

  it('returns 0 for a message sent just now', () => {
    expect(daysSinceLastMessage(NOW.toISOString(), NOW)).toBe(0);
  });

  it('returns exactly N for a message sent exactly N days ago (boundary)', () => {
    const n = SPACE_CLOSURE_SILENCE_DAYS;
    const exactlyN = new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
    expect(daysSinceLastMessage(exactlyN.toISOString(), NOW)).toBe(n);
  });

  it('returns N-1 for a message sent just under N days ago', () => {
    const n = SPACE_CLOSURE_SILENCE_DAYS;
    const justUnderN = new Date(NOW.getTime() - (n * 24 * 60 * 60 * 1000 - 1000));
    expect(daysSinceLastMessage(justUnderN.toISOString(), NOW)).toBe(n - 1);
  });

  it('returns null for an unparseable timestamp instead of NaN/crashing', () => {
    expect(daysSinceLastMessage('not-a-date', NOW)).toBeNull();
  });
});

describe('isClosurePromptDismissed', () => {
  it('is false when the space has no entry in the dismissed map', () => {
    expect(isClosurePromptDismissed('space_1', {}, '2026-08-01T00:00:00.000Z')).toBe(false);
  });

  it('is true when dismissed at the current last_message_at value (already-dismissed case)', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isClosurePromptDismissed('space_1', map, '2026-08-01T00:00:00.000Z')).toBe(true);
  });

  it('resets to false when new activity changes last_message_at after a dismissal', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    // Space went quiet again after new activity -- the previously dismissed
    // "state" (tied to the old last_message_at) no longer applies.
    expect(isClosurePromptDismissed('space_1', map, '2026-08-15T00:00:00.000Z')).toBe(false);
  });

  it('is false for a space with no current last_message_at, even if some stale dismissal exists', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isClosurePromptDismissed('space_1', map, null)).toBe(false);
  });

  it('does not affect other spaces (per-space independence)', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isClosurePromptDismissed('space_2', map, '2026-08-01T00:00:00.000Z')).toBe(false);
  });
});

describe('useSpaceClosurePrompt (hook)', () => {
  const OLD_TIMESTAMP = new Date(
    Date.now() - (SPACE_CLOSURE_SILENCE_DAYS + 1) * 24 * 60 * 60 * 1000,
  ).toISOString();

  beforeEach(() => {
    mockPrefsGet.mockReset().mockReturnValue(undefined);
    mockPrefsSet.mockReset();
  });

  it('does not show for a null/undefined space (no crash)', () => {
    const { result } = renderHook(() => useSpaceClosurePrompt(null));
    expect(result.current.showPrompt).toBe(false);
  });

  it('does not show for a space with no last_message_at (zero-message space)', () => {
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: null }),
    );
    expect(result.current.showPrompt).toBe(false);
  });

  it('does not show when silence is under the N-day threshold', () => {
    const recent = new Date().toISOString();
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: recent }),
    );
    expect(result.current.showPrompt).toBe(false);
  });

  it('shows when silence is at/over the N-day threshold and not dismissed', () => {
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: OLD_TIMESTAMP }),
    );
    expect(result.current.showPrompt).toBe(true);
  });

  it('hides after dismiss() and persists the dismissal to MMKV', () => {
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: OLD_TIMESTAMP }),
    );
    expect(result.current.showPrompt).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.showPrompt).toBe(false);
    expect(mockPrefsSet).toHaveBeenCalledWith(
      'space_closure_dismissed_v1',
      JSON.stringify({ space_1: OLD_TIMESTAMP }),
    );
  });

  it('loads a prior dismissal from MMKV on mount and stays hidden for the same silent period', () => {
    mockPrefsGet.mockReturnValue(JSON.stringify({ space_1: OLD_TIMESTAMP }));
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: OLD_TIMESTAMP }),
    );
    expect(result.current.showPrompt).toBe(false);
  });

  it('shows again once new activity changes last_message_at after a dismissal', () => {
    mockPrefsGet.mockReturnValue(JSON.stringify({ space_1: OLD_TIMESTAMP }));
    const NEWER_OLD_TIMESTAMP = new Date(
      Date.now() - (SPACE_CLOSURE_SILENCE_DAYS + 1) * 24 * 60 * 60 * 1000 + 60_000,
    ).toISOString();
    const { result } = renderHook(() =>
      useSpaceClosurePrompt({ id: 'space_1', last_message_at: NEWER_OLD_TIMESTAMP }),
    );
    expect(result.current.showPrompt).toBe(true);
  });
});
