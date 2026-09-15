/**
 * __tests__/signal-delete-space-survival.test.ts
 *
 * FEAT-2 characterization/regression guard — this file is GREEN ON ARRIVAL.
 * The cascade fix itself (migration 021_resense_signal_delete_preserves_space.sql,
 * `ON DELETE SET NULL` + a `LEFT JOIN` on `space_overview`) has NOT been proved
 * by any executed round-trip in this environment — there is no container
 * runtime and no local Postgres available here, so migration 021 has been
 * created but never applied anywhere. Its correctness has been reviewed by
 * inspection only (see the migration file's own comments); that review is not
 * a substitute for execution and this file does not claim it is. No mocked
 * "cascade" assertion is written as a stand-in either.
 *
 * What THIS file guards: once a space detaches from its signal
 * (`signal_id: null`, `signal_text: null`), the Private tab's mapper
 * (`app/(app)/(tabs)/private.tsx:97-108`) must keep rendering it correctly —
 * card visible, nothing throws, "from signal" line blank rather than the row
 * being dropped. `private.tsx` is FEAT-3's exclusive file, so this drives it
 * by RENDERING `PrivateScreen` (the `__tests__/private-refresh.test.tsx`
 * harness) — zero edits to `private.tsx`.
 */

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: jest.fn(),
  otherAlias: jest.fn(
    (space: { user_a: string | null; alias_a: string | null; alias_b: string | null }, userId: string) =>
      (space.user_a === userId ? space.alias_b : space.alias_a) ?? 'alias',
  ),
}));

jest.mock('@/context/UnreadContext', () => ({
  useUnread: jest.fn(() => ({ unreadSpaceIds: new Set(), markSpaceRead: jest.fn() })),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { usePrivateSpaces } from '@/hooks/useSpaces';
import { useAuth } from '@/context/AuthContext';
import PrivateScreen from '@/app/(app)/(tabs)/private';
import type { SpaceOverview } from '@/services/supabase';

const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

function isoOffsetSeconds(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

function renderedTexts(tree: ReturnType<typeof render>) {
  return tree.UNSAFE_getAllByType(Text).map((el) => el.props.children);
}

function cardCount(tree: ReturnType<typeof render>): number {
  return tree.queryAllByRole('button').length;
}

/** Second array element of the `from your signal · {fromSignal}` Text node. */
function fromSignalValue(tree: ReturnType<typeof render>): unknown {
  const match = tree
    .UNSAFE_getAllByType(Text)
    .find((el) => Array.isArray(el.props.children) && el.props.children[0] === 'from your signal · ');
  return match?.props.children[1];
}

// Sanity fixture (finding N3): assigning a `signal_id: null` / `signal_text:
// null` object literal to a `SpaceOverview`-typed const, with no cast, is
// the type-level assertion that services/database.types.ts:362-363 already
// declares both columns nullable TODAY. If a future `supabase gen types`
// regen tightens either column, this line — and `npm run typecheck` — fails
// loudly, exactly as intended.
const DETACHED_SPACE: SpaceOverview = {
  id: 'sp1',
  signal_id: null,
  signal_text: null,
  last_message: 'hey',
  last_message_at: isoOffsetSeconds(30),
  created_at: isoOffsetSeconds(120),
  user_a: 'user_a',
  user_b: 'user_b',
  alias_a: 'me',
  alias_b: 'them',
  last_message_sender_id: 'user_b',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'user_a' } });
});

describe('Private tab mapper — detached-space (post-021) fixtures', () => {
  it('still renders a detached space (signal_id/signal_text: null): card visible, "from signal" line blank', () => {
    mockUsePrivateSpaces.mockReturnValue({ data: [DETACHED_SPACE], refetch: jest.fn() });

    const tree = render(React.createElement(PrivateScreen));

    expect(cardCount(tree)).toBe(1);
    expect(renderedTexts(tree)).toContain('them');
    expect(renderedTexts(tree)).toContain('hey');
    expect(fromSignalValue(tree)).toBe('');
  });

  it('falls back to "no messages yet" when last_message is null', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ ...DETACHED_SPACE, last_message: null }],
      refetch: jest.fn(),
    });

    const tree = render(React.createElement(PrivateScreen));

    expect(renderedTexts(tree)).toContain('no messages yet');
  });

  it('falls back to created_at when last_message_at is null but created_at is present', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ ...DETACHED_SPACE, last_message_at: null, created_at: isoOffsetSeconds(2 * 86400) }],
      refetch: jest.fn(),
    });

    const tree = render(React.createElement(PrivateScreen));

    expect(renderedTexts(tree)).toContain('2d');
  });

  it('falls back to "now" when both last_message_at and created_at are null', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ ...DETACHED_SPACE, last_message_at: null, created_at: null }],
      refetch: jest.fn(),
    });

    const tree = render(React.createElement(PrivateScreen));

    expect(renderedTexts(tree)).toContain('now');
  });

  it('filters out a row with a null id, rendering exactly the one valid card', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [{ ...DETACHED_SPACE, id: null }, { ...DETACHED_SPACE, id: 'sp_valid' }],
      refetch: jest.fn(),
    });

    const tree = render(React.createElement(PrivateScreen));

    expect(cardCount(tree)).toBe(1);
  });

  it('renders an empty list with no crash when useAuth returns a null user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUsePrivateSpaces.mockReturnValue({ data: [DETACHED_SPACE], refetch: jest.fn() });

    const tree = render(React.createElement(PrivateScreen));

    expect(cardCount(tree)).toBe(0);
    expect(renderedTexts(tree)).toContain('No private spaces yet — add to a signal to open one.');
  });

  it('renders both cards when both participants have detached spaces (each deleted their own originating signal)', () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [
        { ...DETACHED_SPACE, id: 'sp1', alias_b: 'them-a' },
        { ...DETACHED_SPACE, id: 'sp2', alias_b: 'them-b' },
      ],
      refetch: jest.fn(),
    });

    const tree = render(React.createElement(PrivateScreen));

    expect(cardCount(tree)).toBe(2);
    expect(renderedTexts(tree)).toContain('them-a');
    expect(renderedTexts(tree)).toContain('them-b');
  });
});
