/**
 * __tests__/useSpaces.test.ts
 *
 * G5/G6 targeted repair for FEAT-3's `hooks/useSpaces.ts`:
 *
 *  - F3: `hooks/useSpaces.ts:34` (`.sort(compareSpacesByActivity)` inside
 *    `fetchSpaces`) was the single uncovered changed line in the FEAT-2/
 *    FEAT-3 diff. This drives the REAL `usePrivateSpaces()` hook against a
 *    mocked `@/services/supabase` boundary — the same pattern
 *    `__tests__/useSignals.test.ts` already uses for `fetchSignals` — and
 *    asserts the RESULT comes back re-ordered, which only happens if the
 *    `.sort(...)` call actually runs. The mock deliberately returns rows in
 *    an order that does NOT already match the expected result, so this is
 *    not a mock asserting itself back.
 *
 *  - F4/F6: `activityKey` is exported so its NaN-safety can be driven
 *    directly. Its docstring says "Missing/unparseable values sort as epoch
 *    0 (oldest)"; before the fix, a truthy-but-unparseable string produced
 *    NaN instead, which made `Array.prototype.sort` non-transitive (see the
 *    comparator adversarial test below).
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_a' } })),
}));

const mockOrder = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: (...args: unknown[]) => mockOrder(...args),
      })),
    })),
  },
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrivateSpaces, activityKey, compareSpacesByActivity } from '@/hooks/useSpaces';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// retry: false and gcTime: 0 — these tests assert query behavior, not
// react-query's own retry/backoff/cache-eviction timing, and disabling both
// avoids leaving real timers open past the end of each test.
function makeTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchSpaces via usePrivateSpaces — the .sort(compareSpacesByActivity) wiring (F3, line 34)', () => {
  it('re-orders rows returned by PostgREST into activity order, proving the sort actually ran', async () => {
    // Deliberately returned in an order that does NOT already match the
    // expected activity order: if line 34's `.sort(...)` were removed, this
    // exact [old, new-msgless] order would come back unchanged and the
    // assertion below would fail.
    mockOrder.mockResolvedValue({
      data: [
        { id: 'old', last_message_at: '2026-01-01T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z' },
        { id: 'new-msgless', last_message_at: null, created_at: '2026-09-15T12:00:00.000Z' },
      ],
      error: null,
    });
    const qc = makeTestQueryClient();

    const { result, unmount } = renderHook(() => usePrivateSpaces(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((s) => s.id)).toEqual(['new-msgless', 'old']);
    expect(mockOrder).toHaveBeenCalledWith('last_message_at', { ascending: false, nullsFirst: false });
    unmount();
    qc.clear();
  });

  it('propagates a PostgREST error instead of silently returning an empty list', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const qc = makeTestQueryClient();

    const { result, unmount } = renderHook(() => usePrivateSpaces(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('permission denied');
    unmount();
    qc.clear();
  });
});

describe('activityKey — NaN-safety (F4)', () => {
  it('an unparseable-but-truthy last_message_at sorts as epoch 0, matching the docstring, not NaN', () => {
    expect(activityKey({ last_message_at: 'not-a-date', created_at: null })).toBe(0);
  });

  it('missing both timestamps sorts as epoch 0', () => {
    expect(activityKey({ last_message_at: null, created_at: null })).toBe(0);
  });

  it('a valid last_message_at parses to its real epoch millis (not degraded to 0)', () => {
    expect(activityKey({ last_message_at: '2026-01-01T00:00:00.000Z', created_at: null })).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
  });
});

describe('compareSpacesByActivity — adversarial cases (F4)', () => {
  it('two malformed rows compare equal (0), never NaN', () => {
    const bad1 = { id: 'bad1', last_message_at: 'not-a-date', created_at: null };
    const bad2 = { id: 'bad2', last_message_at: 'also-bad', created_at: null };
    expect(compareSpacesByActivity(bad1, bad2)).toBe(0);
    expect(Number.isNaN(compareSpacesByActivity(bad1, bad2))).toBe(false);
  });

  it('a malformed row never disturbs the relative order of the clean rows around it, regardless of input order (G6 B9/B10 regression)', () => {
    // This is the exact shape G6 proved non-transitive pre-fix: with NaN in
    // play, sorting the SAME four rows from two different input orders
    // produced two DIFFERENT results, burying the newly opened message-less
    // space below an old conversation in one of them. Post-fix, both input
    // orders must converge on the same, correctly-ranked-by-activity result.
    const bad = { id: 'bad', last_message_at: 'not-a-date', created_at: null };
    const oldRow = { id: 'old', last_message_at: '2026-01-01T00:00:00.000Z', created_at: null };
    const newRow = { id: 'new', last_message_at: '2026-09-15T12:00:00.000Z', created_at: null };

    const forward = [oldRow, bad, newRow].sort(compareSpacesByActivity).map((s) => s.id);
    const reversed = [newRow, bad, oldRow].sort(compareSpacesByActivity).map((s) => s.id);

    expect(forward).toEqual(['new', 'old', 'bad']);
    expect(reversed).toEqual(['new', 'old', 'bad']);
  });

  it('equal, valid, non-null last_message_at compares as 0 (stable order)', () => {
    const a = { id: 'a', last_message_at: '2026-01-01T00:00:00.000Z', created_at: null };
    const b = { id: 'b', last_message_at: '2026-01-01T00:00:00.000Z', created_at: null };
    expect(compareSpacesByActivity(a, b)).toBe(0);
  });
});
