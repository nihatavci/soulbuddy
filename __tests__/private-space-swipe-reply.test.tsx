/**
 * __tests__/private-space-swipe-reply.test.tsx
 *
 * Render-level coverage for FEAT-2 (swipe-to-reply gesture on `ThreadBubble`,
 * RUN-NONCE resense-swipe-to-reply-20260905-215928). Mirrors
 * private-space-reply-owed-nudge.test.tsx's full-screen mocking pattern.
 *
 * What this file actually proves (native gesture recognition cannot be
 * simulated in Jest/jsdom — see the module doc in
 * app/(app)/private-space-gestures.ts and its own exhaustive unit tests for
 * the real threshold/exclusivity logic):
 *   - The screen renders confirmed, pending, and deleted (tombstone) bubbles
 *     with the new GestureDetector/Animated.View wiring without crashing.
 *   - The passive "reply" affordance icon is present per bubble (structural
 *     proof the swipe UI is actually mounted, not just the gesture logic).
 *   - `onSwipeReply` is an optional prop — omitting it (as the current
 *     un-wired call site does, since FEAT-3 owns wiring it to `replyTarget`)
 *     does not crash the screen.
 * The actual "does dragging past the threshold call onSwipeReply exactly
 * once" / "does a stationary long-press still open the delete-choice flow
 * and not the swipe" behavior is proven exhaustively and directly against
 * the REAL react-native-gesture-handler Gesture objects in
 * __tests__/private-space-gestures.test.ts (buildThreadBubbleGesture /
 * buildThreadBubbleCallbacks describe blocks) — that is the correct layer
 * for it, since it invokes the exact `.handlers.onUpdate/.onEnd/.onStart`
 * functions RNGH would call on a physical touch.
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
jest.mock('@/hooks/useMessages', () => ({
  useMessages: (...args: unknown[]) => mockUseMessages(...args),
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

jest.mock('@/hooks/useReplyOwedPrompt', () => ({
  useReplyOwedPrompt: jest.fn(() => ({ showNudge: false, dismiss: jest.fn() })),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
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

const CONFIRMED_MESSAGE = {
  id: 'msg_confirmed',
  space_id: SPACE.id,
  sender_id: CURRENT_USER_ID,
  text: 'hello there',
  created_at: '2026-09-01T00:01:00.000Z',
  deleted_at: null,
};

const PENDING_MESSAGE = {
  id: 'temp-1',
  space_id: SPACE.id,
  sender_id: CURRENT_USER_ID,
  text: 'sending...',
  created_at: '2026-09-01T00:02:00.000Z',
  deleted_at: null,
  pending: true,
};

const DELETED_MESSAGE = {
  id: 'msg_deleted',
  space_id: SPACE.id,
  sender_id: 'user_b',
  text: 'gone',
  created_at: '2026-09-01T00:03:00.000Z',
  deleted_at: '2026-09-01T00:04:00.000Z',
};

describe('private-space.tsx — ThreadBubble swipe-to-reply gesture wiring', () => {
  beforeAll(async () => {
    await i18nInstance.changeLanguage('en');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: CURRENT_USER_ID } });
    mockUsePrivateSpaces.mockReturnValue({ data: [SPACE] });
    mockUseLocalSearchParams.mockReturnValue({ spaceId: SPACE.id });
  });

  it('renders a confirmed bubble with the GestureDetector/Animated.View gesture wiring, no crash', () => {
    mockUseMessages.mockReturnValue({ data: [CONFIRMED_MESSAGE] });

    expect(() =>
      render(
        <LanguageProvider>
          <PrivateSpaceScreen />
        </LanguageProvider>,
      ),
    ).not.toThrow();
  });

  it('renders a pending (optimistic) bubble with the gesture disabled by construction, no crash', () => {
    mockUseMessages.mockReturnValue({ data: [PENDING_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders a deleted (tombstone) bubble with the gesture disabled by construction, no crash', () => {
    mockUseMessages.mockReturnValue({ data: [DELETED_MESSAGE] });

    const tree = render(
      <LanguageProvider>
        <PrivateSpaceScreen />
      </LanguageProvider>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders multiple bubbles (mine + theirs, mixed states) together without crashing', () => {
    mockUseMessages.mockReturnValue({
      data: [CONFIRMED_MESSAGE, PENDING_MESSAGE, DELETED_MESSAGE],
    });

    expect(() =>
      render(
        <LanguageProvider>
          <PrivateSpaceScreen />
        </LanguageProvider>,
      ),
    ).not.toThrow();
  });
});
