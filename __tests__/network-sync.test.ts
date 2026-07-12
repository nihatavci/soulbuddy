/**
 * __tests__/network-sync.test.ts
 *
 * UC-5: Offline / Network Sync
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@react-native-community/netinfo', () => {
  const addEventListener = jest.fn().mockReturnValue(jest.fn());
  const fetch = jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true });
  return {
    __esModule: true,
    default: { addEventListener, fetch },
    __mock: { addEventListener, fetch },
  };
});

jest.mock('@tanstack/react-query', () => {
  const resumePausedMutations = jest.fn();
  const invalidateQueries = jest.fn();
  return {
    QueryClient: jest.fn().mockImplementation(() => ({
      resumePausedMutations,
      invalidateQueries,
      getQueryCache: jest.fn(() => ({ getAll: jest.fn(() => []) })),
      getMutationCache: jest.fn(() => ({ getAll: jest.fn(() => []) })),
    })),
    useQueryClient: jest.fn(() => ({ resumePausedMutations, invalidateQueries })),
    __mock: { resumePausedMutations, invalidateQueries },
  };
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_123' } })),
}));

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
  setSupabaseSession: jest.fn(),
  clearSupabaseSession: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  withScope: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: jest.fn((c: any) => c),
}));

import { renderHook, act } from '@testing-library/react-native';
import { useNetworkSync } from '@/hooks/useNetworkSync';

const { addEventListener: mockAddEventListener } = require('@react-native-community/netinfo').__mock;
const { resumePausedMutations: mockResumePaused, invalidateQueries: mockInvalidate } =
  require('@tanstack/react-query').__mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAddEventListener.mockReturnValue(jest.fn());
});

describe('useNetworkSync', () => {
  it('registers a NetInfo event listener on mount', () => {
    renderHook(() => useNetworkSync());
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount (no memory leak)', () => {
    const mockUnsubscribe = jest.fn();
    mockAddEventListener.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useNetworkSync());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('calls resumePausedMutations when reconnecting after offline', async () => {
    let callback: ((state: any) => void) | null = null;
    mockAddEventListener.mockImplementation((cb: (state: any) => void) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() => useNetworkSync());

    await act(async () => {
      callback!({ isConnected: false, isInternetReachable: false });
      callback!({ isConnected: true, isInternetReachable: true });
    });

    expect(mockResumePaused).toHaveBeenCalled();
  });

  it('calls invalidateQueries when reconnecting', async () => {
    let callback: ((state: any) => void) | null = null;
    mockAddEventListener.mockImplementation((cb: (state: any) => void) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() => useNetworkSync());

    await act(async () => {
      callback!({ isConnected: false, isInternetReachable: false });
      callback!({ isConnected: true, isInternetReachable: true });
    });

    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('does NOT sync when already online throughout (no offline transition)', async () => {
    let callback: ((state: any) => void) | null = null;
    mockAddEventListener.mockImplementation((cb: (state: any) => void) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() => useNetworkSync());

    await act(async () => {
      callback!({ isConnected: true, isInternetReachable: true });
      callback!({ isConnected: true, isInternetReachable: true });
    });

    expect(mockResumePaused).not.toHaveBeenCalled();
  });
});
