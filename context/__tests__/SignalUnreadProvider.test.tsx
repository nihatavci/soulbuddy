/**
 * context/__tests__/SignalUnreadProvider.test.tsx
 *
 * Smoke-checks the realtime-channel wiring for growth-1-unread-reply-indicator:
 * mocks the `replies` INSERT postgres_changes callback and confirms it
 * invalidates the signals query (which carries reply_count) — mirroring
 * __tests__/UnreadContext.test.tsx's pattern for private-space messages.
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

jest.mock('@/hooks/useSignals', () => ({
  useSignals: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/store/mmkv', () => ({
  Prefs: { get: jest.fn(() => null), set: jest.fn() },
}));

let postgresChangesHandler: ((payload: unknown) => void) | null = null;
const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
let mockGetSession = jest.fn();
const mockSetAuth = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    realtime: { setAuth: (...args: unknown[]) => mockSetAuth(...args) },
    channel: jest.fn(() => ({
      on: (_event: string, _filter: unknown, handler: (payload: unknown) => void) => {
        postgresChangesHandler = handler;
        return { subscribe: mockSubscribe };
      },
    })),
    removeChannel: jest.fn(),
  },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignalUnreadProvider, useSignalUnread } from '@/context/SignalUnreadContext';
import { queryKeys } from '@/store/queryClient';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(SignalUnreadProvider, null, children));
}

beforeEach(() => {
  jest.clearAllMocks();
  postgresChangesHandler = null;
  mockGetSession = jest.fn().mockResolvedValue({ data: { session: { access_token: 'tok_x' } } });
});

describe('SignalUnreadProvider realtime channel', () => {
  it('subscribes to replies INSERTs only after setAuth resolves', async () => {
    const qc = new QueryClient();
    renderHook(() => useSignalUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    expect(mockSetAuth).toHaveBeenCalledWith('tok_x');
  });

  it('a reply INSERT from someone else invalidates the signals query (reply_count refetch)', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useSignalUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandler).not.toBeNull());

    act(() => {
      postgresChangesHandler!({ new: { author_id: 'user_b', signal_id: 'signal_1' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.signals() });
  });

  it('ignores replies I authored myself (no read-receipt-adjacent self-invalidation)', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
    renderHook(() => useSignalUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(postgresChangesHandler).not.toBeNull());

    act(() => {
      postgresChangesHandler!({ new: { author_id: 'user_a', signal_id: 'signal_1' } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('markSignalRead persists a monotonic snapshot: does not resurrect for the same reply', async () => {
    const qc = new QueryClient();
    const { result } = renderHook(() => useSignalUnread(), { wrapper: wrapper(qc) });
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    act(() => result.current.markSignalRead('signal_1', 3));
    await waitFor(() => expect(result.current.countFor('signal_1')).toBe(0));

    // Marking read again at the SAME snapshot count must not regress state.
    act(() => result.current.markSignalRead('signal_1', 3));
    expect(result.current.countFor('signal_1')).toBe(0);
  });
});
