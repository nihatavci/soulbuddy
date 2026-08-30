/**
 * context/__tests__/SignalUnreadContext.test.ts
 *
 * TDD for growth-1-unread-reply-indicator: pure derivation functions written
 * and tested BEFORE any Provider/hook wiring. Mirrors UnreadContext's
 * hasUnread tests, but the signal here is a reply_count SNAPSHOT diff
 * (no seen_by_author/last_reply_at column exists on signals/replies —
 * confirmed against services/database.types.ts), not a timestamp diff.
 */
import { hasUnseenAdditions, unseenAdditionCount } from '@/context/signalUnread';

describe('unseenAdditionCount', () => {
  it('is 0 when a signal has no replies', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: 0 }, {})).toBe(0);
  });

  it('is 0 when replies exist but were already seen at the current count', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: 2 }, { s1: 2 })).toBe(0);
  });

  it('is >0 when the stored seen-count is stale (behind the current reply_count)', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: 3 }, { s1: 1 })).toBe(2);
  });

  it('treats a missing seen-count entry as 0 (never viewed)', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: 1 }, {})).toBe(1);
  });

  it('is 0 for a null/undefined signal (e.g. deleted between reply and view)', () => {
    expect(unseenAdditionCount(null, { s1: 0 })).toBe(0);
    expect(unseenAdditionCount(undefined, { s1: 0 })).toBe(0);
  });

  it('is 0 for a signal with a missing/null id', () => {
    expect(unseenAdditionCount({ id: null, reply_count: 5 }, {})).toBe(0);
    expect(unseenAdditionCount({ reply_count: 5 }, {})).toBe(0);
  });

  it('treats a null reply_count as 0 (never negative)', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: null }, { s1: 5 })).toBe(0);
  });

  it('never goes negative when the seen-count is somehow ahead of reply_count', () => {
    expect(unseenAdditionCount({ id: 's1', reply_count: 1 }, { s1: 4 })).toBe(0);
  });
});

describe('hasUnseenAdditions', () => {
  it('is false for an empty signal list', () => {
    expect(hasUnseenAdditions([], {})).toBe(false);
  });

  it('is false when no signal has replies', () => {
    const signals = [{ id: 's1', reply_count: 0 }, { id: 's2', reply_count: null }];
    expect(hasUnseenAdditions(signals, {})).toBe(false);
  });

  it('is false when every signal with replies has already been seen at its current count', () => {
    const signals = [{ id: 's1', reply_count: 2 }, { id: 's2', reply_count: 5 }];
    expect(hasUnseenAdditions(signals, { s1: 2, s2: 5 })).toBe(false);
  });

  it('is true when at least one signal has a stale seen-count', () => {
    const signals = [{ id: 's1', reply_count: 2 }, { id: 's2', reply_count: 5 }];
    expect(hasUnseenAdditions(signals, { s1: 2, s2: 3 })).toBe(true);
  });

  it('handles mixed multi-signal states: seen, stale, never-viewed, no-replies', () => {
    const signals = [
      { id: 'seen', reply_count: 3 },
      { id: 'stale', reply_count: 4 },
      { id: 'never-viewed', reply_count: 1 },
      { id: 'no-replies', reply_count: 0 },
    ];
    const lastSeenCounts = { seen: 3, stale: 1 };
    expect(hasUnseenAdditions(signals, lastSeenCounts)).toBe(true);
  });

  it('ignores signals with a missing/null id', () => {
    const signals = [{ id: null, reply_count: 9 }, { reply_count: 9 }];
    expect(hasUnseenAdditions(signals, {})).toBe(false);
  });
});
