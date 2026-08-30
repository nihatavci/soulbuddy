/**
 * __tests__/useSignals.test.ts
 *
 * useDeleteSignal — deleting one of the caller's own signals. RLS
 * (`signals_delete_own`, migration 018) scopes the DELETE to the author, so
 * this hook's job is just: call it, and on success invalidate both the
 * signals list and (since a signal can cascade-remove a private space) the
 * spaces list too.
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

const mockDeleteEq = jest.fn();

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: (...args: unknown[]) => mockDeleteEq(...args),
      })),
    })),
  },
}));

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteSignal } from '@/hooks/useSignals';
import { queryKeys } from '@/store/queryClient';

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeleteSignal', () => {
  it('on success, invalidates both the signals list and the caller\'s spaces list', async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSignal(), { wrapper: wrapper(qc) });
    await act(async () => { await result.current.mutateAsync('signal_1'); });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'signal_1');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.signals() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.spaces('user_a') }),
    );
  });

  it('propagates an RLS rejection (e.g. attempting to delete someone else\'s signal) as an error', async () => {
    mockDeleteEq.mockResolvedValue({ error: { message: 'permission denied' } });
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSignal(), { wrapper: wrapper(qc) });
    await act(async () => {
      await expect(result.current.mutateAsync('not_mine')).rejects.toThrow('permission denied');
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
