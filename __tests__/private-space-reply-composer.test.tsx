/**
 * __tests__/private-space-reply-composer.test.tsx
 *
 * Render-level coverage for the quote preview inside `ThreadBubble` + the
 * "replying to" composer strip + `handleSend` wiring. Mirrors
 * private-space-reply-owed-nudge.test.tsx's full-screen mocking pattern (same
 * hooks mocked the same way).
 *
 * Build-25 hotfix note: a reply is now started via long-press → the
 * message-options Alert's "Reply" button (see private-space.tsx's
 * `handleLongPress`), NOT the drag gesture in private-space-gestures.ts
 * (which crashed on-device and was reverted to unused/dormant — see that
 * file's own module doc). This file drives the real trigger path: long-press
 * the bubble (`fireEvent(el, 'longPress')` on its `testID`), capture the
 * `Alert.alert` call, and invoke the "Reply" button's real `onPress` — no
 * component internals reached into, no gesture simulation needed.
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

const mockUseMessages = jest.fn();
const mockMutateAsync = jest.fn();
jest.mock('@/hooks/useMessages', () => ({
  useMessages: (...args: unknown[]) => mockUseMessages(...args),
  useSendMessage: jest.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
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

jest.mock('@/hooks/useReplyOwedPrompt', () => ({
  useReplyOwedPrompt: jest.fn(() => ({ showNudge: false, dismiss: jest.fn() })),
}));

import React from 'react';
import { Alert, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import PrivateSpaceScreen from '@/app/(app)/private-space';

/**
 * Long-presses the bubble for `messageId`, capturing the resulting
 * `Alert.alert(...)` call and pressing its "Reply" button — the real
 * end-to-end trigger path a physical long-press + Alert tap would produce.
 */
function replyToMessageViaLongPress(tree: ReturnType<typeof render>, messageId: string) {
  const alertSpy = jest.spyOn(Alert, 'alert');
  act(() => {
    fireEvent(tree.getByTestId(`thread-bubble-${messageId}`), 'longPress');
  });
  expect(alertSpy).toHaveBeenCalled();
  const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2] as
    { text: string; onPress?: () => void }[];
  const replyButton = buttons.find((b) => b.text === 'Reply');
  expect(replyButton?.onPress).toBeTruthy();
  act(() => {
    replyButton!.onPress!();
  });
  alertSpy.mockRestore();
}

const CURRENT_USER_ID = 'user_a';
const OTHER_USER_ID = 'user_b';
const SPACE = {
  id: 'space_1',
  user_a: CURRENT_USER_ID,
  alias_a: 'Me',
  alias_b: 'Wren',
  last_message_at: '2026-09-01T00:00:00.000Z',
  last_message_sender_id: OTHER_USER_ID,
};

const ORIGINAL_MESSAGE = {
  id: 'msg_original',
  space_id: SPACE.id,
  sender_id: OTHER_USER_ID,
  text: 'do you ever think about the sea at night',
  created_at: '2026-09-01T00:01:00.000Z',
  deleted_at: null,
  reply_to_id: null,
};

const REPLY_MESSAGE = {
  id: 'msg_reply',
  space_id: SPACE.id,
  sender_id: CURRENT_USER_ID,
  text: 'all the time actually',
  created_at: '2026-09-01T00:02:00.000Z',
  deleted_at: null,
  reply_to_id: ORIGINAL_MESSAGE.id,
};

const DANGLING_REPLY_MESSAGE = {
  id: 'msg_dangling',
  space_id: SPACE.id,
  sender_id: CURRENT_USER_ID,
  text: 'orphaned reply',
  created_at: '2026-09-01T00:03:00.000Z',
  deleted_at: null,
  reply_to_id: 'msg_not_in_thread',
};

const DELETED_ORIGINAL = {
  ...ORIGINAL_MESSAGE,
  id: 'msg_original_deleted',
  deleted_at: '2026-09-01T00:05:00.000Z',
};

const REPLY_TO_DELETED = {
  id: 'msg_reply_to_deleted',
  space_id: SPACE.id,
  sender_id: CURRENT_USER_ID,
  text: 'replying to something now gone',
  created_at: '2026-09-01T00:06:00.000Z',
  deleted_at: null,
  reply_to_id: DELETED_ORIGINAL.id,
};

function getAllText(tree: ReturnType<typeof render>): string[] {
  return tree.UNSAFE_getAllByType(Text).map((n) => {
    const children = n.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('private-space.tsx — quote preview + replying-to composer strip', () => {
  beforeAll(async () => {
    await i18nInstance.changeLanguage('en');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: CURRENT_USER_ID } });
    mockUsePrivateSpaces.mockReturnValue({ data: [SPACE] });
    mockUseLocalSearchParams.mockReturnValue({ spaceId: SPACE.id });
    mockMutateAsync.mockReset();
  });

  it('shows the quote preview with the alias + snippet when reply_to_id resolves in the loaded thread', () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    const texts = getAllText(tree);

    expect(texts).toContain('Wren');
    expect(texts).toContain(ORIGINAL_MESSAGE.text);
    expect(texts).toContain(REPLY_MESSAGE.text);
  });

  it('renders no extra quote block and does not crash when reply_to_id does not resolve in the loaded thread', () => {
    mockUseMessages.mockReturnValue({ data: [DANGLING_REPLY_MESSAGE] });

    expect(() =>
      render(
        <LanguageProvider>
          <PrivateSpaceScreen />
        </LanguageProvider>,
      ),
    ).not.toThrow();
  });

  it('shows "Message deleted" in the quote preview when the quoted message has deleted_at set', () => {
    mockUseMessages.mockReturnValue({ data: [DELETED_ORIGINAL, REPLY_TO_DELETED] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    const texts = getAllText(tree);

    expect(texts).toContain('This message was deleted');
    expect(texts).not.toContain(DELETED_ORIGINAL.text);
  });

  it('composer strip appears with correct content after a swipe-reply commit, and cancel clears it without sending', () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );

    expect(tree.queryByText('Replying to Wren')).toBeNull();
    expect(tree.queryByLabelText('Cancel reply')).toBeNull();

    replyToMessageViaLongPress(tree, ORIGINAL_MESSAGE.id);

    // Strip shows "Replying to <sender alias>" (the original message was
    // sent by the other person, so its alias — not "you") + a snippet.
    expect(tree.getByText('Replying to Wren')).toBeTruthy();
    expect(tree.getAllByText(ORIGINAL_MESSAGE.text).length).toBeGreaterThan(0);

    act(() => {
      fireEvent.press(tree.getByLabelText('Cancel reply'));
    });

    expect(tree.queryByText('Replying to Wren')).toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('sending while replyTarget is active includes replyToId in the mutateAsync call and clears the strip on success', async () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });
    mockMutateAsync.mockResolvedValueOnce({ id: 'srv_1' });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );

    replyToMessageViaLongPress(tree, ORIGINAL_MESSAGE.id);
    expect(tree.getByText('Replying to Wren')).toBeTruthy();

    const input = tree.getByPlaceholderText('Write something…');
    fireEvent.changeText(input, 'here is my reply');

    await act(async () => {
      fireEvent.press(tree.getByLabelText('Send'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ text: 'here is my reply', replyToId: ORIGINAL_MESSAGE.id });
    expect(tree.queryByText('Replying to Wren')).toBeNull();
  });

  it('a failed send restores both the draft text and the composer strip (same quoted content)', async () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });
    mockMutateAsync.mockRejectedValueOnce(new Error('network down'));

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );

    replyToMessageViaLongPress(tree, ORIGINAL_MESSAGE.id);

    const input = tree.getByPlaceholderText('Write something…');
    fireEvent.changeText(input, 'this will fail');

    await act(async () => {
      fireEvent.press(tree.getByLabelText('Send'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ text: 'this will fail', replyToId: ORIGINAL_MESSAGE.id });
    // Draft text restored (existing behavior) AND the strip is still visible
    // with the same quoted content (new FEAT-3 behavior) — nothing silently lost.
    expect((tree.getByPlaceholderText('Write something…') as any).props.value).toBe('this will fail');
    expect(tree.getByText('Replying to Wren')).toBeTruthy();
    expect(tree.getAllByText(ORIGINAL_MESSAGE.text).length).toBeGreaterThan(0);
  });

  it('replying to a different bubble after one is already active replaces replyTarget (last-reply-wins)', () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );

    replyToMessageViaLongPress(tree, ORIGINAL_MESSAGE.id);
    expect(tree.getByText('Replying to Wren')).toBeTruthy();

    replyToMessageViaLongPress(tree, REPLY_MESSAGE.id);
    // Now replying to your own earlier message — the strip reflects the new target.
    expect(tree.queryByText('Replying to Wren')).toBeNull();
    expect(tree.getByText('Replying to You')).toBeTruthy();
  });
});
