/**
 * __tests__/reveal-screen-handle-reveal.test.tsx
 *
 * R1 goal-check repair: `app/(app)/reveal.tsx`'s `handleReveal` (the write
 * path that runs the real reveal mutation, THEN posts the FEAT-4 notice) had
 * zero test coverage. Mocks only `@/services/supabase` — exactly the pattern
 * `__tests__/useSignals.test.ts` and `__tests__/useSpaces.test.ts` already
 * use — plus collaborator screens/hooks that are genuinely out of scope
 * (`expo-router`, `expo-haptics`, `@/components/glow`, `@/context/AuthContext`,
 * `@/hooks/useSpaces`), mirroring `__tests__/private-space-swipe-reply.test.tsx`'s
 * full-screen mocking pattern.
 *
 * Deliberately NOT mocked: `@/hooks/useReveal` (`useReveal`, `useRevealActions`)
 * and `@/hooks/useSpaceEvents` (`useSendRevealEvent`) — those are the real
 * code under test. Every assertion below reads what the MOCKED SUPABASE
 * CLIENT was called with (table name + exact payload) or what the real i18n
 * instance produced — none of it is provable by a test asserting a mock back
 * at itself, because the mock never returns a value the assertions check;
 * it only records how the real hooks invoked it.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
  },
}));

const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: mockRouterBack })),
  useLocalSearchParams: jest.fn(() => ({ spaceId: 'space_1' })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Error: 'error' },
}));

const mockToastShow = jest.fn();
jest.mock('@/components/glow', () => ({
  Toast: { show: (...args: unknown[]) => mockToastShow(...args) },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_a' } })),
}));

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: jest.fn(() => ({
    data: [{ id: 'space_1', user_a: 'user_a', user_b: 'user_b', alias_a: 'Me', alias_b: 'Wren' }],
  })),
  otherAlias: (space: { user_a: string; alias_a: string | null; alias_b: string | null }, userId: string) =>
    space.user_a === userId ? (space.alias_b ?? '') : (space.alias_a ?? ''),
}));

// The real Button pulls in @shopify/react-native-skia (via Grain) which Jest
// cannot transform (see __tests__/checkin-safety-context.test.tsx for the
// same precedent). Stub with the minimal Pressable+Text surface reveal.tsx
// actually uses (label/onPress/disabled/loading) — irrelevant to this lane's
// scope, which is the mutation ordering, not button styling.
jest.mock('@/components/ui/Button', () => {
  const ReactLib = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    Button: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) =>
      ReactLib.createElement(
        Pressable,
        { accessibilityRole: 'button', onPress: disabled ? undefined : onPress, disabled },
        ReactLib.createElement(Text, null, label),
      ),
  };
});

// --- @/services/supabase: the only boundary allowed to be mocked for the
// hooks actually under test (`useReveal`/`useRevealActions`/`useSendRevealEvent`). ---
const mockFrom = jest.fn();
const mockSpaceRevealsEq = jest.fn(); // useReveal's fetchReveals() query
const mockRevealsUpsert = jest.fn(); // useRevealActions.reveal mutationFn
const mockProfilesMaybeSingle = jest.fn(); // age_confirmed_at lookup inside reveal mutationFn
const mockSpaceEventsInsert = jest.fn(); // useSendRevealEvent mutationFn
const mockGetSession = jest.fn();
const mockRemoveChannel = jest.fn();
const mockChannelInstance = {
  on: jest.fn(function (this: unknown) { return this; }),
  subscribe: jest.fn(function (this: unknown) { return this; }),
};

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    channel: jest.fn(() => mockChannelInstance),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import RevealScreen from '@/app/(app)/reveal';

function makeTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

async function renderRevealScreen(qc: QueryClient) {
  await i18nInstance.changeLanguage('en');
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(LanguageProvider, null, React.createElement(RevealScreen)),
    ),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockSpaceRevealsEq.mockResolvedValue({ data: [], error: null }); // nobody has revealed yet
  mockProfilesMaybeSingle.mockResolvedValue({ data: { age_confirmed_at: null }, error: null });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'space_reveals') {
      return {
        select: jest.fn(() => ({ eq: (...a: unknown[]) => mockSpaceRevealsEq(...a) })),
        upsert: (...a: unknown[]) => mockRevealsUpsert(...a),
      };
    }
    if (table === 'profiles') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ maybeSingle: (...a: unknown[]) => mockProfilesMaybeSingle(...a) })),
        })),
      };
    }
    if (table === 'space_events') {
      return { insert: (...a: unknown[]) => mockSpaceEventsInsert(...a) };
    }
    throw new Error(`reveal-screen-handle-reveal.test.tsx: unexpected table "${table}"`);
  });
});

describe('RevealScreen.handleReveal — FEAT-4 write path (R1)', () => {
  it('success: awaits the space_reveals upsert BEFORE posting the space_events notice, then shows only the success toast', async () => {
    mockRevealsUpsert.mockResolvedValue({ error: null });
    mockSpaceEventsInsert.mockResolvedValue({ error: null });
    const qc = makeTestQueryClient();

    const tree = await renderRevealScreen(qc);

    fireEvent.press(tree.getByRole('checkbox'));
    await act(async () => {
      fireEvent.press(tree.getByRole('button', { name: 'Choose to reveal' }));
    });

    await waitFor(() => expect(mockSpaceEventsInsert).toHaveBeenCalled());

    // Both real mutations genuinely ran, scoped to the real space/user data —
    // provable only if `reveal.mutateAsync` and `sendRevealEvent` executed.
    expect(mockRevealsUpsert).toHaveBeenCalledWith(
      { space_id: 'space_1', user_id: 'user_a', first_name: null, age_verified: false },
      { onConflict: 'space_id,user_id' },
    );
    expect(mockFrom).toHaveBeenCalledWith('space_events');
    expect(mockSpaceEventsInsert).toHaveBeenCalledWith({ space_id: 'space_1', kind: 'reveal' });

    // Ordering guarantee: the reveal write is awaited FIRST.
    const upsertOrder = mockRevealsUpsert.mock.invocationCallOrder[0];
    const insertOrder = mockSpaceEventsInsert.mock.invocationCallOrder[0];
    expect(upsertOrder).toBeLessThan(insertOrder);

    // Only the success toast fires — no notice-error, no outer "could not reveal".
    expect(mockToastShow).toHaveBeenCalledTimes(1);
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.stringContaining('You chose to reveal'),
      expect.objectContaining({ type: 'success' }),
    );

    tree.unmount();
    qc.clear();
  });

  it('the reveal itself succeeds and is NOT rolled back even when the notice insert fails (pre-023 CHECK violation) — distinct error toast shown instead', async () => {
    mockRevealsUpsert.mockResolvedValue({ error: null });
    mockSpaceEventsInsert.mockResolvedValue({
      error: { message: 'new row for relation "space_events" violates check constraint "space_events_kind_check"' },
    });
    const qc = makeTestQueryClient();

    const tree = await renderRevealScreen(qc);

    fireEvent.press(tree.getByRole('checkbox'));
    await act(async () => {
      fireEvent.press(tree.getByRole('button', { name: 'Choose to reveal' }));
    });

    await waitFor(() => expect(mockToastShow).toHaveBeenCalledTimes(2));

    // The reveal write itself genuinely completed — no compensating delete,
    // no retry, no rollback call of any kind was made against space_reveals.
    expect(mockRevealsUpsert).toHaveBeenCalledTimes(1);
    expect(mockRevealsUpsert).toHaveBeenCalledWith(
      { space_id: 'space_1', user_id: 'user_a', first_name: null, age_verified: false },
      { onConflict: 'space_id,user_id' },
    );

    // First toast: the real success message (reveal genuinely went through).
    expect(mockToastShow.mock.calls[0][0]).toEqual(expect.stringContaining('You chose to reveal'));
    expect(mockToastShow.mock.calls[0][1]).toEqual(expect.objectContaining({ type: 'success' }));

    // Second toast: the REAL i18n-interpolated notice-error string (proves
    // `t('reveal.noticeError', { alias })` actually ran against the real
    // i18n instance — a stub `t` returning the raw key would fail this).
    expect(mockToastShow.mock.calls[1][0]).toBe(
      "Your reveal went through, but the notice couldn't be posted. Wren may not see it yet.",
    );
    expect(mockToastShow.mock.calls[1][1]).toEqual(expect.objectContaining({ type: 'error' }));

    // The OUTER catch (generic "Could not reveal") must never fire — the
    // inner try/catch around sendRevealEvent() must fully swallow this
    // failure rather than letting it propagate past the reveal's own success.
    expect(mockToastShow).not.toHaveBeenCalledWith(
      expect.stringContaining('Could not reveal'),
      expect.anything(),
    );

    tree.unmount();
    qc.clear();
  });
});
