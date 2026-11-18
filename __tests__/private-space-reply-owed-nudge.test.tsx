/**
 * __tests__/private-space-reply-owed-nudge.test.tsx
 *
 * reply-owed-nudge (RUN-NONCE resense-your-turn-nudge-20260904-181823): the
 * ONLY gap G6 verification found was that no test renders private-space.tsx
 * at all, so the new hook-call + nudge render block was untested. This test
 * mirrors __tests__/checkin-safety-context.test.tsx's mocking/rendering
 * pattern (usePrivateSpaces/useAuth/expo-router mocked the same way) and adds
 * every other dependency private-space.tsx pulls in, so the screen can
 * actually render in Jest.
 *
 * Covers the three paths the roadmap item requires:
 *   - showNudge true  -> nudge renders with the interpolated alias.
 *   - showNudge false -> nudge is absent.
 *   - dismiss tap     -> hides the nudge and calls dismiss().
 */

const mockUseLocalSearchParams = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: mockRouterBack, push: mockRouterPush })),
  useLocalSearchParams: (...args: unknown[]) => mockUseLocalSearchParams(...args),
}));

const mockUsePrivateSpaces = jest.fn();
jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: (...args: unknown[]) => mockUsePrivateSpaces(...args),
  otherAlias: (space: { user_a: string; alias_a: string | null; alias_b: string | null }, userId: string) =>
    space.user_a === userId ? (space.alias_b ?? '') : (space.alias_a ?? ''),
}));

const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Screen-owned data hooks unrelated to the nudge — stubbed to empty/no-op so
// the rest of the screen renders without touching Supabase.
jest.mock('@/hooks/useMessages', () => ({
  useMessages: jest.fn(() => ({ data: [] })),
  useSendMessage: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useDeleteMessageForEveryone: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

const mockMarkSpaceRead = jest.fn();
jest.mock('@/context/UnreadContext', () => ({
  useUnreadContext: jest.fn(() => ({ markSpaceRead: mockMarkSpaceRead })),
}));

jest.mock('@/hooks/useReveal', () => ({
  useReveal: jest.fn(() => ({ iRevealed: false, bothRevealed: false, other: null })),
}));

jest.mock('@/hooks/useSpaceEvents', () => ({
  useSpaceEvents: jest.fn(() => ({ data: [] })),
  useSendSlowDown: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('@/lib/localMessageHide', () => ({
  hideMessageForMe: jest.fn(),
  getHiddenIds: jest.fn(() => new Set()),
}));

jest.mock('@/components/glow', () => ({
  Toast: { show: jest.fn() },
}));

// The reply-owed nudge hook itself is the one thing this test controls
// directly, per test — everything else asserts the screen actually wires
// showNudge/dismiss into the render.
const mockUseReplyOwedPrompt = jest.fn();
jest.mock('@/hooks/useReplyOwedPrompt', () => ({
  useReplyOwedPrompt: (...args: unknown[]) => mockUseReplyOwedPrompt(...args),
}));

import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import PrivateSpaceScreen from '@/app/(app)/private-space';

const CURRENT_USER_ID = 'user_a';
const SPACE = {
  id: 'space_1',
  user_a: CURRENT_USER_ID,
  alias_a: 'Me',
  alias_b: 'Wren',
  last_message_at: '2026-09-01T00:00:00.000Z',
  last_message_sender_id: 'user_b',
};

function getAllText(tree: ReturnType<typeof render>): string[] {
  return tree.UNSAFE_getAllByType(Text).map((n) => {
    const children = n.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('private-space.tsx — reply-owed nudge wiring', () => {
  // i18next's .init() resolves asynchronously even though the en/de resources
  // are supplied inline — without waiting, t() returns the raw key on the
  // first render in a fresh Jest module registry.
  beforeAll(async () => {
    await i18nInstance.changeLanguage('en');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: CURRENT_USER_ID } });
    mockUsePrivateSpaces.mockReturnValue({ data: [SPACE] });
    mockUseLocalSearchParams.mockReturnValue({ spaceId: SPACE.id });
  });

  it('renders the nudge with the interpolated alias when showNudge is true', () => {
    const dismiss = jest.fn();
    mockUseReplyOwedPrompt.mockReturnValue({ showNudge: true, dismiss });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    const texts = getAllText(tree);

    // Passed the SAME space + currentUserId the screen resolved.
    expect(mockUseReplyOwedPrompt).toHaveBeenCalledWith(SPACE, CURRENT_USER_ID);
    expect(texts.some((t) => t === "it's your turn — Wren is waiting to hear back")).toBe(true);
  });

  it('does not render the nudge when showNudge is false', () => {
    mockUseReplyOwedPrompt.mockReturnValue({ showNudge: false, dismiss: jest.fn() });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    const texts = getAllText(tree);

    expect(texts.some((t) => /is waiting to hear back/.test(t))).toBe(false);
  });

  it('tapping the dismiss affordance calls dismiss() and hides the nudge', () => {
    const dismiss = jest.fn();
    mockUseReplyOwedPrompt.mockReturnValue({ showNudge: true, dismiss });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    expect(tree.getByLabelText('Dismiss')).toBeTruthy();

    act(() => {
      fireEvent.press(tree.getByLabelText('Dismiss'));
    });

    expect(dismiss).toHaveBeenCalledTimes(1);

    // The hook is mocked, so the component won't re-render with showNudge
    // false on its own here — but the visible affordance IS the dismiss
    // control itself, and pressing it is the one behavior this screen owns
    // (calling dismiss()). Re-render with showNudge:false to confirm the
    // nudge (and its dismiss control) disappears, mirroring what dismiss()
    // drives via the real hook's state update.
    mockUseReplyOwedPrompt.mockReturnValue({ showNudge: false, dismiss });
    const treeAfter = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    expect(treeAfter.queryByLabelText('Dismiss')).toBeNull();
  });
});
