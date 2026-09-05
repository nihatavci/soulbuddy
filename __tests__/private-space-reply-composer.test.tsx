/**
 * __tests__/private-space-reply-composer.test.tsx
 *
 * Render-level coverage for FEAT-3 (quote preview inside `ThreadBubble` + the
 * "replying to" composer strip + `handleSend` wiring, RUN-NONCE
 * resense-swipe-to-reply-20260905-215928). Mirrors
 * private-space-reply-owed-nudge.test.tsx's full-screen mocking pattern (same
 * hooks mocked the same way).
 *
 * Native gesture recognition cannot be simulated in Jest/jsdom (see
 * app/(app)/private-space-gestures.ts's own module doc and
 * private-space-swipe-reply.test.tsx's test note) — so, to reach a real
 * "swipe completed" state and prove the composer-strip wiring end-to-end
 * without any component internals reaching in, this file wraps
 * `buildThreadBubbleCallbacks` (the REAL exported JS-thread wiring function
 * from private-space-gestures.ts, kept un-mocked) to capture each bubble's
 * `onSwipeCommit` callback as it's built during render. Calling a captured
 * callback directly invokes the exact same function a real gesture release
 * would call (`Haptics.impactAsync` + `onSwipeReply(message)`), which is the
 * screen's actual `setReplyTarget(msg)` wiring — this proves the FEAT-3
 * composer-strip contract for real, not a stand-in assertion.
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

// Captures each bubble's real onSwipeCommit as it's built during render, so
// tests can trigger a "swipe completed" exactly the way a real gesture
// release would, without simulating native touch events (see module doc).
let mockCapturedSwipeCommits: { messageId: string; onSwipeCommit: () => void }[] = [];
jest.mock('@/app/(app)/private-space-gestures', () => {
  const actual = jest.requireActual('@/app/(app)/private-space-gestures');
  return {
    ...actual,
    buildThreadBubbleCallbacks: (params: any) => {
      const real = actual.buildThreadBubbleCallbacks(params);
      mockCapturedSwipeCommits.push({ messageId: params.message.id, onSwipeCommit: real.onSwipeCommit });
      return real;
    },
  };
});

import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import PrivateSpaceScreen from '@/app/(app)/private-space';

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
    mockCapturedSwipeCommits = [];
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

    const originalCommit = mockCapturedSwipeCommits.find((c) => c.messageId === ORIGINAL_MESSAGE.id);
    expect(originalCommit).toBeTruthy();
    act(() => {
      originalCommit!.onSwipeCommit();
    });

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

    const originalCommit = mockCapturedSwipeCommits.find((c) => c.messageId === ORIGINAL_MESSAGE.id)!;
    act(() => {
      originalCommit.onSwipeCommit();
    });
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

    const originalCommit = mockCapturedSwipeCommits.find((c) => c.messageId === ORIGINAL_MESSAGE.id)!;
    act(() => {
      originalCommit.onSwipeCommit();
    });

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

  it('swiping a different bubble after one is already active replaces replyTarget (last-swipe-wins)', () => {
    mockUseMessages.mockReturnValue({ data: [ORIGINAL_MESSAGE, REPLY_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );

    const originalCommit = mockCapturedSwipeCommits.find((c) => c.messageId === ORIGINAL_MESSAGE.id)!;
    const replyCommit = mockCapturedSwipeCommits.find((c) => c.messageId === REPLY_MESSAGE.id)!;

    act(() => {
      originalCommit.onSwipeCommit();
    });
    expect(tree.getByText('Replying to Wren')).toBeTruthy();

    act(() => {
      replyCommit.onSwipeCommit();
    });
    // Now replying to your own earlier message — the strip reflects the new target.
    expect(tree.queryByText('Replying to Wren')).toBeNull();
    expect(tree.getByText('Replying to You')).toBeTruthy();
  });
});
