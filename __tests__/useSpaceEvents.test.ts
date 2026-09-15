/**
 * __tests__/useSpaceEvents.test.ts
 *
 * R1 goal-check repair: `useSendRevealEvent` (FEAT-4's write path) had zero
 * test coverage. Mocks only `@/services/supabase`, mirroring the exact
 * pattern `__tests__/useSignals.test.ts` (`useDeleteSignal`) and
 * `__tests__/useSpaces.test.ts` (`usePrivateSpaces`) already use — the real
 * hook, the real `useMutation` machinery, and the real `mutationFn` body all
 * run; only the network boundary is faked. Every assertion below can only
 * pass if the real code in `hooks/useSpaceEvents.ts` executed: the mock
 * records what it was CALLED WITH (table name, insert payload) rather than
 * asserting a value the test itself supplied.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
  },
}));

const mockFrom = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendRevealEvent } from '@/hooks/useSpaceEvents';
import { queryKeys } from '@/store/queryClient';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

function makeTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockImplementation(() => ({ insert: mockInsert }));
});

describe('useSendRevealEvent — FEAT-4 write path (R1)', () => {
  it('success: inserts kind="reveal" scoped to the space, then invalidates that space\'s events query', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const qc = makeTestQueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');

    const { result, unmount } = renderHook(() => useSendRevealEvent('space_1'), { wrapper: wrapper(qc) });
    await act(async () => {
      await result.current.mutateAsync();
    });

    // Proves the real mutationFn ran: it is the ONLY code path that calls
    // `.from('space_events').insert(...)` with this exact shape.
    expect(mockFrom).toHaveBeenCalledWith('space_events');
    expect(mockInsert).toHaveBeenCalledWith({ space_id: 'space_1', kind: 'reveal' });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.spaceEvents('space_1') }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    unmount();
    qc.clear();
  });

  it('failure: a PostgREST error (e.g. the live kind CHECK rejecting \'reveal\' pre-023) rejects the mutation and does NOT invalidate', async () => {
    mockInsert.mockResolvedValue({
      error: { message: 'new row for relation "space_events" violates check constraint "space_events_kind_check"' },
    });
    const qc = makeTestQueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');

    const { result, unmount } = renderHook(() => useSendRevealEvent('space_2'), { wrapper: wrapper(qc) });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        'new row for relation "space_events" violates check constraint "space_events_kind_check"',
      );
    });

    expect(mockInsert).toHaveBeenCalledWith({ space_id: 'space_2', kind: 'reveal' });
    expect(invalidateSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isError).toBe(true));
    unmount();
    qc.clear();
  });

  it('rejects with "Not ready." and never touches the network when spaceId is empty (the reveal.tsx `spaceId ?? \'\'` fallback)', async () => {
    const qc = makeTestQueryClient();

    const { result, unmount } = renderHook(() => useSendRevealEvent(''), { wrapper: wrapper(qc) });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Not ready.');
    });

    expect(mockFrom).not.toHaveBeenCalled();
    unmount();
    qc.clear();
  });
});
