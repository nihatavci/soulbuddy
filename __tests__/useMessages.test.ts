/**
 * __tests__/useMessages.test.ts
 *
 * comms-latency-fix (FEAT-1): optimistic send (onMutate/onSuccess/onError),
 * upsertMessage ordering, and the realtime-subscribe-after-setAuth ordering.
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

const mockChannelOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();
let mockGetSession = jest.fn();
const mockSetAuth = jest.fn();
const mockInsertSingle = jest.fn();
// fetchMessages' terminal `.order(...).order(...)` call — resolves the initial
// useQuery read. Defaults to an empty list so the optimistic-update tests
// (which don't care about the initial fetch) aren't affected.
let mockFetchRows = jest.fn().mockResolvedValue({ data: [], error: null });

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    realtime: { setAuth: (...args: unknown[]) => mockSetAuth(...args) },
    channel: jest.fn(() => ({
      on: (...args: unknown[]) => {
        mockChannelOn(...args);
        return { subscribe: mockSubscribe };
      },
    })),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(() => ({
        order: (...args: unknown[]) => mockFetchRows(...args),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: (...args: unknown[]) => mockInsertSingle(...args),
        })),
      })),
    })),
  },
}));

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendMessage } from '@/hooks/useMessages';
import { queryKeys } from '@/store/queryClient';

const SPACE_ID = 'space_1';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
  mockSubscribe.mockReturnValue({ unsubscribe: jest.fn() });
  mockFetchRows = jest.fn().mockResolvedValue({ data: [], error: null });
});

describe('useSendMessage — optimistic update (H3 fix)', () => {
  it('onMutate: writes a pending temp bubble into the cache synchronously, before the network call resolves', async () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), []);
    let resolveInsert: (v: unknown) => void = () => {};
    mockInsertSingle.mockReturnValue(new Promise((res) => { resolveInsert = res; }));

    const { result } = renderHook(() => useSendMessage(SPACE_ID), { wrapper: wrapper(qc) });

    act(() => {
      result.current.mutate('hello there');
    });

    // Synchronously (before the mutationFn's promise ever resolves) the cache
    // already contains a pending bubble — this is the latency fix under test.
    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached).toHaveLength(1);
    expect(cached![0]).toMatchObject({ text: 'hello there', pending: true, sender_id: 'user_a' });
    expect(cached![0].id).toMatch(/^temp-/);

    resolveInsert({
      data: { id: 'real_1', space_id: SPACE_ID, sender_id: 'user_a', text: 'hello there', created_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('onSuccess: replaces the temp bubble with the server-confirmed message (no duplicate)', async () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), []);
    mockInsertSingle.mockResolvedValue({
      data: { id: 'real_2', space_id: SPACE_ID, sender_id: 'user_a', text: 'confirmed msg', created_at: '2026-01-01T00:00:01.000Z' },
      error: null,
    });

    const { result } = renderHook(() => useSendMessage(SPACE_ID), { wrapper: wrapper(qc) });

    await act(async () => {
      await result.current.mutateAsync('confirmed msg');
    });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached).toHaveLength(1);
    expect(cached![0]).toMatchObject({ id: 'real_2', text: 'confirmed msg' });
    expect(cached!.some((m) => String(m.id).startsWith('temp-'))).toBe(false);
  });

  it('onError: removes the temp bubble, leaving no orphaned optimistic entries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), []);
    mockInsertSingle.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    const { result } = renderHook(() => useSendMessage(SPACE_ID), { wrapper: wrapper(qc) });

    await act(async () => {
      await expect(result.current.mutateAsync('will fail')).rejects.toThrow('insert failed');
    });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached).toEqual([]);
  });

  it('onSuccess: invalidates the spaces list so the sender\'s own Private-tab entry reorders immediately (BUG-1: previously only UnreadContext invalidated spaces(), and it deliberately skips self-authored inserts, so the sender never saw their own send reflected until staleTime expired)', async () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), []);
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    mockInsertSingle.mockResolvedValue({
      data: { id: 'real_4', space_id: SPACE_ID, sender_id: 'user_a', text: 'hi', created_at: '2026-01-01T00:00:03.000Z' },
      error: null,
    });

    const { result } = renderHook(() => useSendMessage(SPACE_ID), { wrapper: wrapper(qc) });
    await act(async () => { await result.current.mutateAsync('hi'); });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.spaces('user_a') }),
    );
  });

  it('does not clobber an existing message list — only appends/replaces its own temp entry', async () => {
    const qc = new QueryClient();
    const existing = [{ id: 'm0', space_id: SPACE_ID, sender_id: 'user_b', text: 'earlier', created_at: '2025-12-31T23:59:00.000Z' }];
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), existing);
    mockInsertSingle.mockResolvedValue({
      data: { id: 'real_3', space_id: SPACE_ID, sender_id: 'user_a', text: 'reply', created_at: '2026-01-01T00:00:02.000Z' },
      error: null,
    });

    const { result } = renderHook(() => useSendMessage(SPACE_ID), { wrapper: wrapper(qc) });
    await act(async () => { await result.current.mutateAsync('reply'); });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached).toHaveLength(2);
    expect(cached!.map((m) => m.id)).toEqual(['m0', 'real_3']);
  });
});

describe('useMessages poll-vs-optimistic race (BUG-2)', () => {
  it('a poll refetch that resolves before the send confirms does NOT wipe the pending temp bubble', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok_y' } } });
    // Initial fetch: empty thread.
    mockFetchRows.mockResolvedValueOnce({ data: [], error: null });
    const { useMessages } = require('@/hooks/useMessages');
    const qc = new QueryClient();

    const { result } = renderHook(() => useMessages(SPACE_ID), { wrapper: wrapper(qc) });
    await waitFor(() => expect(result.current.data).toEqual([]));

    // Simulate onMutate having already written a pending temp bubble (as
    // useSendMessage's onMutate does synchronously on send) — the INSERT is
    // still in flight, not yet visible to a server-side SELECT.
    const tempId = 'temp-12345-abc';
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), [
      { id: tempId, space_id: SPACE_ID, sender_id: 'user_a', text: 'hello', created_at: '2026-01-01T00:00:00.000Z', pending: true },
    ]);

    // A poll tick (refetchInterval) fires now, BEFORE the insert is committed —
    // the server SELECT still returns the pre-send list (empty), same as the
    // real-world race: the poll's queryFn result must not blindly replace the
    // cache and erase the not-yet-confirmed optimistic bubble.
    mockFetchRows.mockResolvedValueOnce({ data: [], error: null });
    await act(async () => { await result.current.refetch(); });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached).toHaveLength(1);
    expect(cached![0]).toMatchObject({ id: tempId, pending: true });
  });

  it('once the poll sees the real row, the temp bubble is superseded (no duplicate, no stuck pending)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok_z' } } });
    mockFetchRows.mockResolvedValueOnce({ data: [], error: null });
    const { useMessages } = require('@/hooks/useMessages');
    const qc = new QueryClient();

    const { result } = renderHook(() => useMessages(SPACE_ID), { wrapper: wrapper(qc) });
    await waitFor(() => expect(result.current.data).toEqual([]));

    const tempId = 'temp-67890-xyz';
    qc.setQueryData(queryKeys.spaceMessages(SPACE_ID), [
      { id: tempId, space_id: SPACE_ID, sender_id: 'user_a', text: 'hi', created_at: '2026-01-01T00:00:01.000Z', pending: true },
    ]);

    // Next poll tick: the server now has the real, committed row.
    mockFetchRows.mockResolvedValueOnce({
      data: [{ id: 'real_9', space_id: SPACE_ID, sender_id: 'user_a', text: 'hi', created_at: '2026-01-01T00:00:01.000Z' }],
      error: null,
    });
    await act(async () => { await result.current.refetch(); });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached!.map((m) => m.id)).toEqual(['real_9']);
  });
});

describe('useMessages realtime subscribe ordering (H1 fix)', () => {
  it('awaits setAuth to resolve BEFORE calling channel().subscribe() (no fire-and-forget race)', async () => {
    const order: string[] = [];
    let resolveSession: (v: unknown) => void = () => {};
    mockGetSession.mockReturnValue(new Promise((res) => {
      resolveSession = (v) => { order.push('setAuth-resolved'); res(v); };
    }));
    mockSubscribe.mockImplementation(() => { order.push('subscribed'); return { unsubscribe: jest.fn() }; });

    const { useMessages } = require('@/hooks/useMessages');
    const qc = new QueryClient();
    renderHook(() => useMessages(SPACE_ID), { wrapper: wrapper(qc) });

    // subscribe() must NOT have been called yet — it's gated behind the
    // awaited getSession()/setAuth call, unlike the pre-fix fire-and-forget .then().
    expect(mockSubscribe).not.toHaveBeenCalled();

    await act(async () => {
      resolveSession({ data: { session: { access_token: 'tok_123' } } });
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    expect(mockSetAuth).toHaveBeenCalledWith('tok_123');
    expect(order).toEqual(['setAuth-resolved', 'subscribed']);
  });

  it('the INSERT handler upserts the realtime payload into the cache (deduped + ordered)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok_x' } } });
    mockFetchRows.mockResolvedValue({
      data: [{ id: 'm1', space_id: SPACE_ID, sender_id: 'user_b', text: 'first', created_at: '2026-01-01T00:00:00.000Z' }],
      error: null,
    });
    const { useMessages } = require('@/hooks/useMessages');
    const qc = new QueryClient();

    const { result } = renderHook(() => useMessages(SPACE_ID), { wrapper: wrapper(qc) });
    // Wait for the initial fetchMessages() read (the seeded 'm1') to land before
    // simulating the realtime INSERT, so we assert the upsert onto real data.
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    await waitFor(() => expect(mockChannelOn).toHaveBeenCalled());
    const insertHandler = mockChannelOn.mock.calls[0][2] as (payload: unknown) => void;

    act(() => {
      insertHandler({
        new: { id: 'm2', space_id: SPACE_ID, sender_id: 'user_b', text: 'second', created_at: '2026-01-01T00:00:01.000Z' },
      });
      // A duplicate delivery (e.g. also caught by the poll) must not double-insert.
      insertHandler({
        new: { id: 'm2', space_id: SPACE_ID, sender_id: 'user_b', text: 'second', created_at: '2026-01-01T00:00:01.000Z' },
      });
    });

    const cached = qc.getQueryData<any[]>(queryKeys.spaceMessages(SPACE_ID));
    expect(cached!.map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});
