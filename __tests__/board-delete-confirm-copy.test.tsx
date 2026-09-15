/**
 * __tests__/board-delete-confirm-copy.test.tsx
 *
 * FEAT-2: the Signal Board's delete-confirm copy must never claim that
 * deleting a signal destroys the private space/conversation it opened.
 * Migration 021_resense_signal_delete_preserves_space.sql (`ON DELETE SET
 * NULL` + a `LEFT JOIN` on `space_overview`) makes that claim false — the
 * space survives, detached from its origin signal. Only the signal's public
 * replies are still removed (`replies.signal_id` keeps cascading, per the
 * user-approved answer to FORK-2 open question 1).
 *
 * The pre-021 claim that deleting a signal destroys the private space must
 * never return. Assertion group 2 below is RED today (before the i18n edit
 * lands) and is the actual TDD driver for this file; assertion group 1 is
 * green by construction and is the end-to-end proof that the corrected
 * strings are the ones the user actually sees, driven through the real
 * `SwipeToDelete` → `confirmDeleteSignal` → `Alert.alert` wiring.
 *
 * Harness: the pattern proven in-repo by `__tests__/private-refresh.test.tsx`
 * (module-mock the hooks/contexts BoardScreen depends on, then
 * `render(<BoardScreen />)` and drive it via `UNSAFE_getAllByType`).
 */

const mockMutateAsync = jest.fn();
jest.mock('@/hooks/useSignals', () => ({
  useSignals: jest.fn(),
  useDeleteSignal: jest.fn(() => ({ mutateAsync: mockMutateAsync })),
}));

jest.mock('@/hooks/useFreshStart', () => ({
  useFreshStart: jest.fn(() => ({ isFreshStart: false, todayCount: 0 })),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_a' } })),
}));

// SignalUnreadProvider is mounted directly by BoardScreen (index.tsx:91-97) —
// pass through its children with no state of its own. useSignalUnread is
// mocked separately because it is a plain hook, not a provider.
jest.mock('@/context/SignalUnreadContext', () => ({
  SignalUnreadProvider: ({ children }: { children: React.ReactNode }) => children,
  useSignalUnread: jest.fn(() => ({ countFor: jest.fn(() => 0), markSignalRead: jest.fn() })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Warning: 'warning' },
}));

// Not the SUT — mocking it is what makes the index.tsx:129-131 rejection
// branch assertable without a real toast overlay mounted.
jest.mock('@/components/glow', () => ({
  Toast: { show: jest.fn() },
}));

// Resolves against the REAL i18n/en.json resource by key path — deliberately
// NOT an identity stub (`t: (k) => k`), which would make every assertion
// below tautological and green today regardless of the actual copy.
jest.mock('@/context/LanguageContext', () => {
  const realEn = require('@/i18n/en.json');
  function getByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc !== null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  }
  return {
    useT: jest.fn(() => (key: string) => {
      const value = getByPath(realEn, key);
      return typeof value === 'string' ? value : key;
    }),
  };
});

import React from 'react';
import { Alert } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { useSignals } from '@/hooks/useSignals';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { Toast } from '@/components/glow';
import BoardScreen from '@/app/(app)/(tabs)/index';
import en from '@/i18n/en.json';
import de from '@/i18n/de.json';

const mockUseSignals = useSignals as jest.Mock;

// Both fixture signals must be authored by 'user_a' (matching the mocked
// useAuth) — SwipeToDelete only renders for isMine === true (index.tsx:80,
// computed at :163). A fixture authored by anyone else would make
// UNSAFE_getAllByType(SwipeToDelete) return [] and fail for the wrong reason.
const SIGNAL_WITH_REPLIES = {
  id: 'sig_with', author_id: 'user_a', alias: 'luna', text: 'a half-sentence',
  created_at: '2026-09-01T00:00:00.000Z', reply_count: 2, format: 'confession',
};
const SIGNAL_WITHOUT_REPLIES = {
  id: 'sig_without', author_id: 'user_a', alias: 'luna', text: 'a feeling',
  created_at: '2026-09-01T00:00:00.000Z', reply_count: 0, format: 'confession',
};

function getSwipeNodes(tree: ReturnType<typeof render>) {
  return tree.UNSAFE_getAllByType(SwipeToDelete);
}

describe('Board delete-confirm copy — the private space must never be claimed destroyed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignals.mockReturnValue({
      data: [SIGNAL_WITH_REPLIES, SIGNAL_WITHOUT_REPLIES],
      isFetching: false,
      refetch: jest.fn(),
    });
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it('wires both branches of the confirm-copy ternary, and the destructive button, through the real components', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const tree = render(<BoardScreen />);

    const nodes = getSwipeNodes(tree);
    expect(nodes).toHaveLength(2);

    act(() => {
      nodes[0].props.onPress();
    });
    act(() => {
      nodes[1].props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledTimes(2);

    // hasReplies === true branch (sig_with, reply_count: 2 → index.tsx:174)
    const [withTitle, withBody, withButtons] = alertSpy.mock.calls[0];
    expect(withTitle).toBe(en.board.deleteConfirmTitle);
    expect(withBody).toBe(en.board.deleteConfirmBodyWithConversation);

    // hasReplies === false branch (sig_without, reply_count: 0)
    const [, withoutBody] = alertSpy.mock.calls[1];
    expect(withoutBody).toBe(en.board.deleteConfirmBody);

    expect(withButtons?.[0]?.style).toBe('cancel');
    expect(withButtons?.[1]?.style).toBe('destructive');
    expect(withButtons?.[1]?.text).toBe(en.board.deleteConfirmConfirm);

    // Destructive button on the first (hasReplies) alert → :127-132
    await act(async () => {
      withButtons?.[1]?.onPress?.();
    });
    expect(mockMutateAsync).toHaveBeenCalledWith('sig_with');

    // Rejection branch → :129-131. Reuse the second alert's destructive
    // button (sig_without) so the toHaveBeenCalledWith('sig_with') assertion
    // above stays unambiguous.
    const [, , withoutButtons] = alertSpy.mock.calls[1];
    mockMutateAsync.mockRejectedValueOnce(new Error('could not delete'));
    await act(async () => {
      withoutButtons?.[1]?.onPress?.();
      await Promise.resolve();
    });
    expect(Toast.show).toHaveBeenCalledWith(
      'could not delete',
      expect.objectContaining({ type: 'error' }),
    );
  });

  // Assertion group 2 — RED today, the actual TDD driver.
  it('never claims, in EITHER locale, that deleting a signal ends the private conversation', () => {
    expect(en.board.deleteConfirmBodyWithConversation).not.toMatch(/end the private conversation/i);
    expect(de.board.deleteConfirmBodyWithConversation).not.toMatch(/beendet auch die private Unterhaltung/i);
  });
});
