/**
 * __tests__/private-refresh.test.tsx
 *
 * private-tab-refresh-decouple: the pull-to-refresh spinner in the Private tab
 * must be driven by a LOCAL `refreshing` state, not the query's `isFetching`
 * flag. Background invalidations from other hooks (useMessages.ts /
 * UnreadContext.tsx) flip `isFetching` on usePrivateSpaces() at any time —
 * including while the user never touched the pull gesture — and previously
 * that spuriously spun the RefreshControl. TDD: written before the fix in
 * app/(app)/(tabs)/private.tsx.
 */

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: jest.fn(),
  otherAlias: jest.fn(() => 'alias'),
}));

jest.mock('@/context/UnreadContext', () => ({
  useUnread: jest.fn(() => ({ unreadSpaceIds: new Set(), markSpaceRead: jest.fn() })),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_a' } })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import { RefreshControl } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { usePrivateSpaces } from '@/hooks/useSpaces';
import PrivateScreen from '@/app/(app)/(tabs)/private';

const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;

function getRefreshControl(tree: ReturnType<typeof render>) {
  return tree.UNSAFE_getByType(RefreshControl);
}

describe('Private tab — pull-to-refresh decoupled from background isFetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does NOT spin the RefreshControl just because isFetching is true from a background invalidation', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [],
      isFetching: true, // e.g. useMessages/UnreadContext triggered a silent background refetch
      refetch: jest.fn(),
    });

    const tree = render(<PrivateScreen />);
    const control = getRefreshControl(tree);

    expect(control.props.refreshing).toBe(false);
  });

  it('spins the RefreshControl while onRefresh() is in flight, then stops once refetch resolves', async () => {
    let resolveRefetch: () => void = () => {};
    const refetch = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefetch = resolve;
        }),
    );
    mockUsePrivateSpaces.mockReturnValue({ data: [], isFetching: false, refetch });

    const tree = render(<PrivateScreen />);
    let control = getRefreshControl(tree);
    expect(control.props.refreshing).toBe(false);

    let onRefreshPromise: Promise<void> | undefined;
    act(() => {
      onRefreshPromise = control.props.onRefresh();
    });

    control = getRefreshControl(tree);
    expect(control.props.refreshing).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefetch();
      await onRefreshPromise;
    });

    control = getRefreshControl(tree);
    expect(control.props.refreshing).toBe(false);
  });

  it('still stops the spinner even if refetch() rejects (finally-guaranteed reset)', async () => {
    let rejectRefetch: (err: Error) => void = () => {};
    const refetch = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectRefetch = reject;
        }),
    );
    mockUsePrivateSpaces.mockReturnValue({ data: [], isFetching: false, refetch });

    const tree = render(<PrivateScreen />);
    let control = getRefreshControl(tree);

    let onRefreshPromise: Promise<void> | undefined;
    act(() => {
      onRefreshPromise = control.props.onRefresh().catch(() => undefined);
    });

    control = getRefreshControl(tree);
    expect(control.props.refreshing).toBe(true);

    await act(async () => {
      rejectRefetch(new Error('network down'));
      await onRefreshPromise;
    });

    control = getRefreshControl(tree);
    expect(control.props.refreshing).toBe(false);
  });
});
