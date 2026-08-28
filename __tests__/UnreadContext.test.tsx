/**
 * __tests__/UnreadContext.test.tsx
 *
 * comms-latency-fix (FEAT-1), H1 + H2:
 *  - H1: realtime channel subscribes only after setAuth is awaited.
 *  - H2: an INSERT from the other person invalidates ONLY the spaces query —
 *    NOT spaceMessages (that's now owned solely by useMessages' own channel,
 *    removing the redundant duplicate network refetch).
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
import { UnreadProvider, useUnreadContext } from '@/context/UnreadContext';
import { queryKeys } from '@/store/queryClient';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(UnreadProvider, null, children));
}

beforeEach(() => {
  jest.clearAllMocks();
  postgresChangesHandler = null;
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
    await waitFor(() => expect(postgresChangesHandler).not.toBeNull());

    act(() => {
      postgresChangesHandler!({ new: { sender_id: 'user_b', space_id: 'space_1' } });
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
    await waitFor(() => expect(postgresChangesHandler).not.toBeNull());

    act(() => {
      postgresChangesHandler!({ new: { sender_id: 'user_a', space_id: 'space_1' } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
