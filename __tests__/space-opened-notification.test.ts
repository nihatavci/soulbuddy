/**
 * __tests__/space-opened-notification.test.ts
 *
 * FEAT-3 acceptance-criteria tests that are pure-JS testable in this repo:
 *  - a newly opened, message-less space sorts near the TOP of the Private tab
 *    (hooks/useSpaces.ts's activity comparator), not buried at the bottom;
 *  - the in-app consequence of a space opening (Private-tab dot + app badge)
 *    fires for the signal author and stays a BINARY presence flag, never a
 *    count, and never fires for the creator of the space.
 *
 * The pg_net -> Expo push DELIVERY leg (migration 022's trigger) is NOT
 * unit-testable here — it requires a live Postgres trigger firing a real HTTP
 * call to Expo's push service, which this repo has no local harness for
 * (no container runtime, no dev-client/TestFlight build available in this
 * environment). It remains UNVERIFIED until such a run is performed.
 * Nothing in this file fakes or mocks that leg, and no report of that run
 * exists yet to cite.
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

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    realtime: { setAuth: jest.fn() },
    channel: jest.fn(() => {
      const mockChannel = {
        on: () => mockChannel,
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      };
      return mockChannel;
    }),
    removeChannel: jest.fn(),
  },
}));

jest.mock('@/lib/push', () => ({
  setAppBadge: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/store/mmkv', () => ({
  // F-6: getInt/setInt back the UnreadProvider's unreadEpoch watermark. A
  // fixed already-set epoch (rather than the absent/0 sentinel) keeps these
  // FEAT-3 badge/ordering assertions exactly as they were before F-6 existed.
  // F5 correction: this is NOT because none of this file's fixtures set
  // `created_at` — the `brandNewMessageLess` and `messageLessButOlder`
  // fixtures below do set it. Those two only ever feed
  // `compareSpacesByActivity`, which never consults the watermark. Every
  // fixture that actually flows through the unread predicate below relies on
  // the `space()` factory's default (`created_at: null`), which is what
  // actually keeps the watermark from ever suppressing them here — this
  // default is just the least surprising choice.
  Prefs: { get: jest.fn(() => null), set: jest.fn(), getInt: jest.fn(() => 1_700_000_000_000), setInt: jest.fn() },
}));

// Real `compareSpacesByActivity` preserved; only `usePrivateSpaces` is faked so
// the in-app-signal tests below can hand UnreadProvider fixed space fixtures.
jest.mock('@/hooks/useSpaces', () => ({
  ...jest.requireActual('@/hooks/useSpaces'),
  usePrivateSpaces: jest.fn(() => ({ data: [] })),
}));

// F1 repair: mock the `expo-router/unstable-native-tabs` boundary (same
// "mock the external module, drive the real code" pattern this repo uses for
// `@/services/supabase` elsewhere) so TabsLayout can be rendered here and its
// real <Badge> props inspected directly, instead of trusting `total`/
// `setAppBadge` (neither of which IS the tab badge) as a proxy for it.
jest.mock('expo-router/unstable-native-tabs', () => {
  const ReactForMock = require('react');
  function Badge() {
    return null;
  }
  function Icon() {
    return null;
  }
  function Label() {
    return null;
  }
  function Trigger({ children }: { children?: React.ReactNode }) {
    return ReactForMock.createElement(ReactForMock.Fragment, null, children ?? null);
  }
  function NativeTabs({ children }: { children?: React.ReactNode }) {
    return ReactForMock.createElement(ReactForMock.Fragment, null, children ?? null);
  }
  NativeTabs.Trigger = Trigger;
  return { NativeTabs, Icon, Label, Badge };
});

import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { compareSpacesByActivity, usePrivateSpaces } from '@/hooks/useSpaces';
import { UnreadProvider, useUnread } from '@/context/UnreadContext';
import { setAppBadge } from '@/lib/push';
import { Badge } from 'expo-router/unstable-native-tabs';
import TabsLayout from '@/app/(app)/(tabs)/_layout';
import type { SpaceOverview } from '@/services/supabase';

function space(overrides: Partial<SpaceOverview>): SpaceOverview {
  return {
    id: null, signal_id: null, user_a: null, user_b: null,
    alias_a: null, alias_b: null, signal_text: null,
    created_at: null, last_message: null, last_message_at: null,
    last_message_sender_id: null,
    ...overrides,
  } as SpaceOverview;
}

describe('compareSpacesByActivity (hooks/useSpaces.ts ordering fix)', () => {
  it('a message-less space created now sorts ABOVE an older conversation with an old last_message_at', () => {
    const brandNewMessageLess = space({ id: 'new', created_at: '2026-09-15T12:00:00.000Z', last_message_at: null });
    const oldConversation = space({ id: 'old', created_at: '2026-01-01T00:00:00.000Z', last_message_at: '2026-01-02T00:00:00.000Z' });

    const sorted = [oldConversation, brandNewMessageLess].sort(compareSpacesByActivity);

    expect(sorted[0].id).toBe('new');
    expect(sorted[1].id).toBe('old');
  });

  it('two messaged spaces still order by last_message_at, newest first (no regression)', () => {
    const older = space({ id: 'a', created_at: '2026-01-01T00:00:00.000Z', last_message_at: '2026-01-01T00:00:00.000Z' });
    const newer = space({ id: 'b', created_at: '2026-01-01T00:00:00.000Z', last_message_at: '2026-01-02T00:00:00.000Z' });

    const sorted = [older, newer].sort(compareSpacesByActivity);

    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('a');
  });

  it('a messaged space still outranks a space that is message-less but was opened earlier, if its message is more recent', () => {
    const messaged = space({ id: 'messaged', created_at: '2026-01-01T00:00:00.000Z', last_message_at: '2026-09-15T11:00:00.000Z' });
    const messageLessButOlder = space({ id: 'messageless-old', created_at: '2026-01-01T00:00:00.000Z', last_message_at: null });

    const sorted = [messageLessButOlder, messaged].sort(compareSpacesByActivity);

    expect(sorted[0].id).toBe('messaged');
  });

  it('two spaces with neither timestamp compare as equal (stable no-op ordering, no throw)', () => {
    const a = space({ id: 'a', created_at: null, last_message_at: null });
    const b = space({ id: 'b', created_at: null, last_message_at: null });
    expect(compareSpacesByActivity(a, b)).toBe(0);
  });
});

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(UnreadProvider, null, children));
}

describe('In-app signal when a space just opened (Private-tab dot + app badge)', () => {
  const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrivateSpaces.mockReturnValue({ data: [] });
  });

  it('a message-less space where I am user_a (the signal author) and never opened it -> dot + binary badge=1', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [space({ id: 'space_1', last_message_at: null, user_a: 'user_a', user_b: 'user_b' })],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.unreadSpaceIds.has('space_1')).toBe(true));
    expect(result.current.total).toBe(1);
    await waitFor(() => expect(setAppBadge).toHaveBeenCalledWith(1));
  });

  it('B, the creator (user_b === myId), is NEVER notified about the space they just opened — no dot, badge stays 0', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [space({ id: 'space_1', last_message_at: null, user_a: 'other_user', user_b: 'user_a' })],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(setAppBadge).toHaveBeenCalled());
    expect(result.current.unreadSpaceIds.has('space_1')).toBe(false);
    expect(result.current.total).toBe(0);
    expect(setAppBadge).toHaveBeenCalledWith(0);
    expect(setAppBadge).not.toHaveBeenCalledWith(1);
  });

  it('the already-connected-pair case (no new space at all) fires no badge: an empty spaces list is not unread', async () => {
    mockUsePrivateSpaces.mockReturnValue({ data: [] });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(setAppBadge).toHaveBeenCalledWith(0));
    expect(result.current.total).toBe(0);
  });

  it('the OS app-icon badge (setAppBadge) stays binary with multiple unread message-less spaces — the Set-sized `total` may report 2 for dot-per-card rendering, but that is NOT the tab badge; see the render-based test below for that', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [
        space({ id: 'space_1', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }),
        space({ id: 'space_2', last_message_at: null, user_a: 'user_a', user_b: 'user_c' }),
      ],
    });
    const qc = new QueryClient();
    const { result } = renderHook(() => useUnread(), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.total).toBe(2)); // the Set may report 2, for the dot-per-card use case
    expect(setAppBadge).toHaveBeenCalledWith(1); // but the app-icon badge itself never carries a count
    expect(setAppBadge).not.toHaveBeenCalledWith(2);
  });
});

// F1 repair: the previous test above only checked `total` (a Set size, used for
// dot-per-card rendering) and `setAppBadge` (the OS app-icon badge). Neither is
// the Private *tab* badge that `app/(app)/(tabs)/_layout.tsx` renders via
// NativeTabs' <Badge>. This block renders the REAL TabsLayout and inspects the
// actual props handed to the Private trigger's <Badge>, so a regression back
// to a numeric count is caught here directly.
describe('The Private TAB badge rendered by TabsLayout (F1) — must never be a numeric count', () => {
  const mockUsePrivateSpaces = usePrivateSpaces as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrivateSpaces.mockReturnValue({ data: [] });
  });

  function renderTabsLayout(qc: QueryClient) {
    return render(
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(UnreadProvider, null, React.createElement(TabsLayout))),
    );
  }

  it('with TWO unread message-less spaces, the rendered <Badge> never carries "2" (or any digit string) as its content', async () => {
    mockUsePrivateSpaces.mockReturnValue({
      data: [
        space({ id: 'space_1', last_message_at: null, user_a: 'user_a', user_b: 'user_b' }),
        space({ id: 'space_2', last_message_at: null, user_a: 'user_a', user_b: 'user_c' }),
      ],
    });
    const qc = new QueryClient();
    const tree = renderTabsLayout(qc);

    await waitFor(() => expect(tree.UNSAFE_getAllByType(Badge).length).toBeGreaterThan(0));
    const badgeProps = tree.UNSAFE_getAllByType(Badge).map((el) => el.props);

    for (const props of badgeProps) {
      expect(props.children).not.toBe('2');
      expect(typeof props.children === 'string' && /^\d+$/.test(props.children)).toBe(false);
    }

    // R5 repair: the sibling "ZERO unread" test below asserts `hidden ===
    // true`, but nothing previously asserted the other side — that the
    // Private trigger's <Badge> is actually SHOWN (`hidden === false`) when
    // there IS unread content. Without this, an always-`hidden={true}`
    // regression (the dot silently never showing, even with unread spaces)
    // would pass every existing assertion above.
    const privateBadgeProps = tree.UNSAFE_getAllByType(Badge)[0]?.props;
    expect(privateBadgeProps?.hidden).toBe(false);
  });

  it('with ZERO unread spaces, the Private tab badge is hidden (no presence dot)', async () => {
    mockUsePrivateSpaces.mockReturnValue({ data: [] });
    const qc = new QueryClient();
    const tree = renderTabsLayout(qc);

    await waitFor(() => {
      const props = tree.UNSAFE_getAllByType(Badge)[0]?.props;
      expect(props?.hidden).toBe(true);
    });
  });
});
