/**
 * __tests__/useReplyOwedPrompt.test.ts
 *
 * reply-owed-nudge: pure-function coverage for the hours-elapsed calculation,
 * the "reply owed" determination, and the dismissal-state check that back the
 * private-space.tsx "your turn" nudge. Written BEFORE the implementation
 * (TDD) — these must fail for "module not found" first, then pass once
 * hooks/useReplyOwedPrompt.ts exists.
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
  hoursSinceLastMessage,
  isReplyOwed,
  isReplyOwedDismissed,
  useReplyOwedPrompt,
  REPLY_OWED_HOURS,
} from '@/hooks/useReplyOwedPrompt';

describe('hoursSinceLastMessage', () => {
  const NOW = new Date('2026-09-04T12:00:00.000Z');

  it('returns null when lastMessageAtISO is null/missing', () => {
    expect(hoursSinceLastMessage(null, NOW)).toBeNull();
    expect(hoursSinceLastMessage(undefined, NOW)).toBeNull();
  });

  it('returns 0 for a message sent just now', () => {
    expect(hoursSinceLastMessage(NOW.toISOString(), NOW)).toBe(0);
  });

  it('returns exactly N for a message sent exactly N hours ago (boundary)', () => {
    const n = REPLY_OWED_HOURS;
    const exactlyN = new Date(NOW.getTime() - n * 60 * 60 * 1000);
    expect(hoursSinceLastMessage(exactlyN.toISOString(), NOW)).toBe(n);
  });

  it('returns N-1 for a message sent just under N hours ago', () => {
    const n = REPLY_OWED_HOURS;
    const justUnderN = new Date(NOW.getTime() - (n * 60 * 60 * 1000 - 1000));
    expect(hoursSinceLastMessage(justUnderN.toISOString(), NOW)).toBe(n - 1);
  });

  it('returns null for an unparseable timestamp instead of NaN/crashing', () => {
    expect(hoursSinceLastMessage('not-a-date', NOW)).toBeNull();
  });

  it('clamps a future/clock-skewed timestamp to 0 elapsed hours', () => {
    const future = new Date(NOW.getTime() + 60 * 60 * 1000);
    expect(hoursSinceLastMessage(future.toISOString(), NOW)).toBe(0);
  });
});

describe('isReplyOwed', () => {
  const NOW = new Date('2026-09-04T12:00:00.000Z');
  const OLD_ENOUGH = new Date(NOW.getTime() - (REPLY_OWED_HOURS + 1) * 60 * 60 * 1000).toISOString();
  const RECENT = new Date(NOW.getTime() - 1 * 60 * 60 * 1000).toISOString();

  it('is owed when last sender != me and elapsed >= threshold', () => {
    expect(
      isReplyOwed({ last_message_at: OLD_ENOUGH, last_message_sender_id: 'other' }, 'me', NOW),
    ).toBe(true);
  });

  it('is not owed when elapsed is under the threshold', () => {
    expect(
      isReplyOwed({ last_message_at: RECENT, last_message_sender_id: 'other' }, 'me', NOW),
    ).toBe(false);
  });

  it('is not owed when the last sender is the current user, regardless of elapsed time', () => {
    expect(
      isReplyOwed({ last_message_at: OLD_ENOUGH, last_message_sender_id: 'me' }, 'me', NOW),
    ).toBe(false);
  });

  it('is not owed when there is no last_message_at', () => {
    expect(
      isReplyOwed({ last_message_at: null, last_message_sender_id: 'other' }, 'me', NOW),
    ).toBe(false);
  });

  it('is not owed for a future/clock-skewed timestamp (clamped to 0 elapsed)', () => {
    const future = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
    expect(
      isReplyOwed({ last_message_at: future, last_message_sender_id: 'other' }, 'me', NOW),
    ).toBe(false);
  });

  it('is not owed for an unparseable last_message_at (no crash)', () => {
    expect(
      isReplyOwed({ last_message_at: 'not-a-date', last_message_sender_id: 'other' }, 'me', NOW),
    ).toBe(false);
  });
});

describe('isReplyOwedDismissed', () => {
  it('is false when the space has no entry in the dismissed map', () => {
    expect(isReplyOwedDismissed('space_1', {}, '2026-08-01T00:00:00.000Z')).toBe(false);
  });

  it('is true when dismissed at the current last_message_at value', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isReplyOwedDismissed('space_1', map, '2026-08-01T00:00:00.000Z')).toBe(true);
  });

  it('resets to false when new activity changes last_message_at after a dismissal', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isReplyOwedDismissed('space_1', map, '2026-08-15T00:00:00.000Z')).toBe(false);
  });

  it('is false for a space with no current last_message_at, even if a stale dismissal exists', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isReplyOwedDismissed('space_1', map, null)).toBe(false);
  });

  it('does not affect other spaces (per-space independence)', () => {
    const map = { space_1: '2026-08-01T00:00:00.000Z' };
    expect(isReplyOwedDismissed('space_2', map, '2026-08-01T00:00:00.000Z')).toBe(false);
  });
});

describe('useReplyOwedPrompt (hook)', () => {
  const OLD_TIMESTAMP = new Date(Date.now() - (REPLY_OWED_HOURS + 1) * 60 * 60 * 1000).toISOString();
  const RECENT_TIMESTAMP = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    mockPrefsGet.mockReset().mockReturnValue(undefined);
    mockPrefsSet.mockReset();
  });

  it('does not show for a null/undefined space (no crash)', () => {
    const { result } = renderHook(() => useReplyOwedPrompt(null, 'me'));
    expect(result.current.showNudge).toBe(false);
  });

  it('does not show for a space with no last_message_at', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt({ id: 'space_1', last_message_at: null, last_message_sender_id: null }, 'me'),
    );
    expect(result.current.showNudge).toBe(false);
  });

  it('does not show when the current user is the last sender', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'me' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(false);
  });

  it('does not show when elapsed time is under the threshold', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: RECENT_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(false);
  });

  it('shows when at/over the threshold, other person sent last, and not dismissed', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(true);
  });

  it('hides after dismiss() and persists the dismissal to the correct MMKV key', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.showNudge).toBe(false);
    expect(mockPrefsSet).toHaveBeenCalledWith(
      'reply_owed_dismissed_v1',
      JSON.stringify({ space_1: OLD_TIMESTAMP }),
    );
  });

  it('loads a prior dismissal from MMKV on mount and stays hidden for the same period', () => {
    mockPrefsGet.mockReturnValue(JSON.stringify({ space_1: OLD_TIMESTAMP }));
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(false);
  });

  it('shows again once new activity changes last_message_at after a dismissal', () => {
    mockPrefsGet.mockReturnValue(JSON.stringify({ space_1: OLD_TIMESTAMP }));
    const NEWER_OLD_TIMESTAMP = new Date(
      Date.now() - (REPLY_OWED_HOURS + 1) * 60 * 60 * 1000 + 60_000,
    ).toISOString();
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: NEWER_OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(true);
  });

  it('does not show for a space with no id, and dismiss() no-ops safely', () => {
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: undefined, last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(false);

    act(() => {
      result.current.dismiss();
    });

    expect(mockPrefsSet).not.toHaveBeenCalled();
  });

  it('degrades to an empty dismissed map on corrupt MMKV JSON, without crashing', () => {
    mockPrefsGet.mockReturnValue('{not valid json');
    const { result } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_1', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(result.current.showNudge).toBe(true);
  });

  it('keeps per-space independence — dismissing one space does not affect another', () => {
    const { result: resultA } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_a', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    act(() => {
      resultA.current.dismiss();
    });

    const { result: resultB } = renderHook(() =>
      useReplyOwedPrompt(
        { id: 'space_b', last_message_at: OLD_TIMESTAMP, last_message_sender_id: 'other' },
        'me',
      ),
    );
    expect(resultB.current.showNudge).toBe(true);
  });
});
