/**
 * __tests__/UnreadContext.test.tsx
 *
 * comms-latency-fix (FEAT-1), H1 + H2:
 *  - H1: realtime channel subscribes only after setAuth is awaited.
 *  - H2: an INSERT from the other person invalidates ONLY the spaces query —
 *    NOT spaceMessages (that's now owned solely by useMessages' own channel,
 *    removing the redundant duplicate network refetch).
 *
 * F-6: the `unreadEpoch` watermark is persisted here (provider layer), not in
 * the pure predicate (context/spaceUnread.ts) — see that module's tests for
 * the predicate-side table. This file covers ONLY the storage side effect:
 * first launch writes it, subsequent launches reuse it without overwriting.
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

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/lib/push', () => ({
  setAppBadge: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/store/mmkv', () => ({
  Prefs: {
    get: jest.fn(() => null),
    set: jest.fn(),
    // F-6: default to "already set" (a non-zero stored ms) so tests that
    // don't care about the watermark never incidentally trip the first-launch
    // write path. Tests that DO care override this per-test (see the
    // 'unreadEpoch watermark persistence' describe block below).
    getInt: jest.fn(() => 1_700_000_000_000),
    setInt: jest.fn(),
  },
}));

// Keyed by `table` so a single channel can carry multiple `.on('postgres_changes', ...)`
// bindings (FEAT-3 adds a second one for `private_spaces`, alongside the existing
// `messages` binding) — each binding's handler is captured under its own table name
// instead of being clobbered by whichever `.on(...)` call happened to run last.
const postgresChangesHandlers: Record<string, (payload: unknown) => void> = {};
const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
let mockGetSession = jest.fn();
const mockSetAuth = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    realtime: { setAuth: (...args: unknown[]) => mockSetAuth(...args) },
    channel: jest.fn(() => {
      // Self-referencing so `.on(...).on(...).subscribe()` chains exactly like the
      // real supabase-js `RealtimeChannel` — `on()` returns `this`, not a narrower
      // `{ subscribe }` object that only tolerates a single binding.
      const mockChannel: {
        on: (event: string, filter: { table?: string }, handler: (payload: unknown) => void) => typeof mockChannel;
        subscribe: typeof mockSubscribe;
      } = {
        on: (_event, filter, handler) => {
          if (filter?.table) postgresChangesHandlers[filter.table] = handler;
          return mockChannel;
        },
        subscribe: mockSubscribe,
      };
      return mockChannel;
    }),
    removeChannel: jest.fn(),
  },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnreadProvider, useUnreadContext, useUnread } from '@/context/UnreadContext';
import { queryKeys } from '@/store/queryClient';
import { usePrivateSpaces } from '@/hooks/useSpaces';
import { Prefs } from '@/store/mmkv';
import { setAppBadge } from '@/lib/push';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(UnreadProvider, null, children));
}

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(postgresChangesHandlers)) delete postgresChangesHandlers[key];
  mockGetSession = jest.fn().mockResolvedValue({ data: { session: { access_token: 'tok_x' } } });
});

describe('UnreadContext realtime channel (H1 + H2 fixes)', () => {
  it('subscribes only after setAuth resolves', async () => {
    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    expect(mockSetAuth).toHaveBeenCalledWith('tok_x');
  });

  it('H2: an INSERT from another user invalidates spaces(myId) but NOT spaceMessages (no duplicate refetch)', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandlers.messages).toBeDefined());

    act(() => {
      postgresChangesHandlers.messages({ new: { sender_id: 'user_b', space_id: 'space_1' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.spaces('user_a') });
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.spaceMessages('space_1') }),
    );
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores INSERTs the current user sent themselves', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandlers.messages).toBeDefined());

    act(() => {
      postgresChangesHandlers.messages({ new: { sender_id: 'user_a', space_id: 'space_1' } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('UnreadContext realtime channel — private_spaces INSERT (FEAT-3: notify the signal author a space just opened)', () => {
  it('user_a === myId (I am the signal author, the space just opened for me) invalidates spaces(myId)', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandlers.private_spaces).toBeDefined());

    act(() => {
      postgresChangesHandlers.private_spaces({ new: { id: 'space_2', user_a: 'user_a', user_b: 'user_b' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.spaces('user_a') }),
    );
  });

  it('user_b === myId (I am the creator who just opened it myself) does NOT invalidate spaces() — the creator is never notified about their own action', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandlers.private_spaces).toBeDefined());

    act(() => {
      postgresChangesHandlers.private_spaces({ new: { id: 'space_2', user_a: 'other_user', user_b: 'user_a' } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('the messages binding is unaffected by the new private_spaces binding on the same channel (both bindings coexist)', async () => {
    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });
    await waitFor(() => {
      expect(postgresChangesHandlers.messages).toBeDefined();
      expect(postgresChangesHandlers.private_spaces).toBeDefined();
    });
    expect(postgresChangesHandlers.messages).not.toBe(postgresChangesHandlers.private_spaces);
  });
});

describe('useUnread — sender-aware unread derivation (BUG-4 fix)', () => {
  // Regression for: sending a message while actively in that thread still lit
  // up the app-icon badge and the Private-tab red dot, because the old
  // last_message_at-vs-lastRead comparison had no idea the "newer" message
  // was the user's own — a server created_at that lands a beat after the
  // client's optimistic lastRead stamp was enough to misfire it.
  const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;

  it('a space whose last message I sent myself is never unread, even with no lastRead stamp at all', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_1', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: 'user_a' }],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    expect(result.current.unreadSpaceIds.has('space_1')).toBe(false);
    expect(result.current.total).toBe(0);
  });

  it('the exact reported race: server created_at lands after the client lastRead stamp, but sender===me still wins', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_1', last_message_at: '2026-01-01T00:00:00.500Z', last_message_sender_id: 'user_a' }],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => {
      const ctx = useUnreadContext();
      const unread = useUnread();
      return { ctx, unread };
    }, { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    act(() => { result.current.ctx.markSpaceRead('space_1'); }); // stamps lastRead with "now" — earlier than the server timestamp above
    expect(result.current.unread.unreadSpaceIds.has('space_1')).toBe(false);
  });

  it('a space whose last message is from the OTHER person is unread when newer than lastRead', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_1', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: 'user_b' }],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    expect(result.current.unreadSpaceIds.has('space_1')).toBe(true);
    expect(result.current.total).toBe(1);
  });
});

describe('UnreadProvider — F-6 unreadEpoch watermark persistence (provider layer, not the pure predicate)', () => {
  const mockPrefsGetInt = Prefs.getInt as jest.Mock;
  const mockPrefsSetInt = Prefs.setInt as jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks(); // undo any Date.now() spy from a test below
  });

  it('first launch (no stored key — Prefs.getInt returns the falsy/absent sentinel) persists unreadEpoch = now() exactly once', async () => {
    mockPrefsGetInt.mockReturnValue(0); // absence-of-key sentinel, same convention as install_timestamp in app/(app)/_layout.tsx
    const fixedNowMs = new Date('2026-09-16T10:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(fixedNowMs);

    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    expect(mockPrefsSetInt).toHaveBeenCalledTimes(1);
    expect(mockPrefsSetInt).toHaveBeenCalledWith('unread_epoch_v1', fixedNowMs);
  });

  it('subsequent launch (epoch already stored) reuses it and never overwrites it', async () => {
    const storedMs = new Date('2026-01-01T00:00:00.000Z').getTime();
    mockPrefsGetInt.mockReturnValue(storedMs);

    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    expect(mockPrefsSetInt).not.toHaveBeenCalled();
  });

  it('exposes the persisted epoch on context value (as an ISO string) for isSpaceUnread/hasUnread to consume', async () => {
    const storedMs = new Date('2026-01-01T00:00:00.000Z').getTime();
    mockPrefsGetInt.mockReturnValue(storedMs);

    const qc = new QueryClient();
    const { result } = renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    expect(result.current.unreadEpoch).toBe(new Date(storedMs).toISOString());
  });

  it('F3 repair: a throwing Prefs.getInt fails open (unreadEpoch = "", no suppression) instead of crashing into the ErrorBoundary', async () => {
    mockPrefsGetInt.mockImplementation(() => { throw new Error('MMKV read failure'); });

    const qc = new QueryClient();
    const { result } = renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    expect(result.current.unreadEpoch).toBe('');
    expect(mockPrefsSetInt).not.toHaveBeenCalled();
  });
});

describe('UnreadProvider — F2 repair: end-to-end wiring proof for BOTH unreadEpoch call sites ' +
  '(UnreadContext.tsx:97 hasUnread, :199 isSpaceUnread). A mutation probe that reverted both call ' +
  'sites to the pre-fix 3-argument form left the full suite byte-identical before this block existed ' +
  '— these tests must go RED if that wiring is ever removed again.', () => {
  const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;
  const mockPrefsGetInt = Prefs.getInt as jest.Mock;
  const STORED_EPOCH_MS = new Date('2026-06-01T00:00:00.000Z').getTime();

  it(':199 call site (useUnread/isSpaceUnread) — a message-less space created well before the stored epoch (beyond the clock-skew margin) is suppressed end-to-end', async () => {
    mockPrefsGetInt.mockReturnValue(STORED_EPOCH_MS);
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_old', created_at: '2026-05-01T00:00:00.000Z', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.total).toBe(0));
    expect(result.current.unreadSpaceIds.has('space_old')).toBe(false);
  });

  it(':199 call site (useUnread/isSpaceUnread) — a message-less space created well after the stored epoch is still unread end-to-end', async () => {
    mockPrefsGetInt.mockReturnValue(STORED_EPOCH_MS);
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_new', created_at: '2026-06-05T00:00:00.000Z', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.total).toBe(1));
    expect(result.current.unreadSpaceIds.has('space_new')).toBe(true);
  });

  it(':97 call site (setAppBadge/hasUnread) — the app-icon badge also respects epoch suppression for a pre-epoch space', async () => {
    mockPrefsGetInt.mockReturnValue(STORED_EPOCH_MS);
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_old', created_at: '2026-05-01T00:00:00.000Z', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }],
    });
    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(setAppBadge).toHaveBeenCalledWith(0));
    expect(setAppBadge).not.toHaveBeenCalledWith(1);
  });

  it(':97 call site (setAppBadge/hasUnread) — the app-icon badge fires for a post-epoch message-less space', async () => {
    mockPrefsGetInt.mockReturnValue(STORED_EPOCH_MS);
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ id: 'space_new', created_at: '2026-06-05T00:00:00.000Z', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }],
    });
    const qc = new QueryClient();
    renderHook(() => useUnreadContext(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(setAppBadge).toHaveBeenCalledWith(1));
  });
});
