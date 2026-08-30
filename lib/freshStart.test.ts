import { getLocalMidnightISO, isNewLocalDaySince, countSignalsSinceBoundary } from './freshStart';

describe('isNewLocalDaySince', () => {
  it('returns false when lastSeen is later the same local day', () => {
    const now = new Date(2026, 7, 30, 18, 0, 0); // Aug 30 2026, 18:00 local
    const lastSeen = new Date(2026, 7, 30, 9, 0, 0).toISOString(); // same day, 09:00
    expect(isNewLocalDaySince(lastSeen, now)).toBe(false);
  });

  it('returns true when lastSeen was the previous local day', () => {
    const now = new Date(2026, 7, 30, 8, 0, 0); // Aug 30 2026, 08:00 local
    const lastSeen = new Date(2026, 7, 29, 23, 59, 0).toISOString(); // Aug 29, 23:59
    expect(isNewLocalDaySince(lastSeen, now)).toBe(true);
  });

  it('returns true across a DST-adjacent boundary (consecutive calendar days)', () => {
    // Simulate a spring-forward-style short day: 23h gap crossing a calendar date.
    const now = new Date(2026, 2, 9, 1, 30, 0); // Mar 9 2026, 01:30 local (day after)
    const lastSeen = new Date(2026, 2, 8, 1, 30, 0).toISOString(); // Mar 8 2026, 01:30 local
    expect(isNewLocalDaySince(lastSeen, now)).toBe(true);
  });

  it('returns true when lastSeen is missing (first ever view)', () => {
    const now = new Date(2026, 7, 30, 8, 0, 0);
    expect(isNewLocalDaySince(undefined, now)).toBe(true);
    expect(isNewLocalDaySince(null, now)).toBe(true);
  });

  it('returns true when lastSeen is an unparsable string', () => {
    const now = new Date(2026, 7, 30, 8, 0, 0);
    expect(isNewLocalDaySince('not-a-date', now)).toBe(true);
  });

  it('returns false at exactly the same instant', () => {
    const now = new Date(2026, 7, 30, 12, 0, 0);
    expect(isNewLocalDaySince(now.toISOString(), now)).toBe(false);
  });
});

describe('getLocalMidnightISO', () => {
  it('returns an ISO string at 00:00:00.000 local for the given date', () => {
    const now = new Date(2026, 7, 30, 15, 42, 10);
    const midnight = new Date(getLocalMidnightISO(now));
    expect(midnight.getFullYear()).toBe(2026);
    expect(midnight.getMonth()).toBe(7);
    expect(midnight.getDate()).toBe(30);
    expect(midnight.getHours()).toBe(0);
    expect(midnight.getMinutes()).toBe(0);
    expect(midnight.getSeconds()).toBe(0);
    expect(midnight.getMilliseconds()).toBe(0);
  });
});

describe('countSignalsSinceBoundary', () => {
  const authorId = 'user-1';
  const boundaryISO = new Date(2026, 7, 30, 0, 0, 0, 0).toISOString();

  it('returns 0 for a user with zero own signals', () => {
    const signals = [
      { author_id: 'user-2', created_at: new Date(2026, 7, 30, 10, 0, 0).toISOString() },
    ];
    expect(countSignalsSinceBoundary(signals, authorId, boundaryISO)).toBe(0);
  });

  it('counts only the given author signals created on/after the boundary', () => {
    const signals = [
      { author_id: authorId, created_at: new Date(2026, 7, 30, 10, 0, 0).toISOString() },
      { author_id: authorId, created_at: new Date(2026, 7, 29, 23, 0, 0).toISOString() }, // before boundary
      { author_id: 'user-2', created_at: new Date(2026, 7, 30, 11, 0, 0).toISOString() },
      { author_id: authorId, created_at: new Date(2026, 7, 30, 12, 0, 0).toISOString() },
    ];
    expect(countSignalsSinceBoundary(signals, authorId, boundaryISO)).toBe(2);
  });

  it('includes a signal created exactly at the boundary timestamp', () => {
    const signals = [{ author_id: authorId, created_at: boundaryISO }];
    expect(countSignalsSinceBoundary(signals, authorId, boundaryISO)).toBe(1);
  });

  it('returns 0 when authorId is missing/undefined', () => {
    const signals = [{ author_id: authorId, created_at: boundaryISO }];
    expect(countSignalsSinceBoundary(signals, undefined, boundaryISO)).toBe(0);
    expect(countSignalsSinceBoundary(signals, null, boundaryISO)).toBe(0);
  });

  it('ignores signals with missing created_at', () => {
    const signals = [{ author_id: authorId, created_at: null }];
    expect(countSignalsSinceBoundary(signals, authorId, boundaryISO)).toBe(0);
  });

  it('returns 0 for an empty signals list', () => {
    expect(countSignalsSinceBoundary([], authorId, boundaryISO)).toBe(0);
  });
});
