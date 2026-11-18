/**
 * __tests__/checkin-safety-context.test.tsx
 *
 * checkin-report-context-clarity: the Safety section in check-in.tsx must be
 * spaceId-aware. Written BEFORE the fix (TDD):
 *   - no spaceId  -> Safety section hidden entirely (self check-in unaffected).
 *   - spaceId present + alias resolves -> alias-aware labels.
 *   - spaceId present but unresolvable -> generic fallback, no crash.
 *   - onDone (haptic + router.back()) unaffected by spaceId presence.
 */

const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: jest.fn(), push: jest.fn() })),
  useLocalSearchParams: (...args: unknown[]) => mockUseLocalSearchParams(...args),
}));

const mockUsePrivateSpaces = jest.fn();
jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: (...args: unknown[]) => mockUsePrivateSpaces(...args),
  otherAlias: (space: { user_a: string; alias_a: string | null; alias_b: string | null }, userId: string) =>
    space.user_a === userId ? (space.alias_b ?? '') : (space.alias_a ?? ''),
}));

jest.mock('@/hooks/useSafety', () => ({
  useReport: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useBlockUser: jest.fn(() => ({ mutateAsync: jest.fn() })),
  REPORT_REASONS: ['spam', 'harassment', 'sexual', 'hate', 'other'],
}));

jest.mock('@/components/glow', () => ({ Toast: { show: jest.fn() } }));

const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

// The real Button pulls in @shopify/react-native-skia (via Grain) which Jest
// cannot transform. Stub with the minimal Pressable+Text surface check-in.tsx
// actually uses (label/onPress/disabled) — irrelevant to this lane's scope.
jest.mock('@/components/ui/Button', () => {
  const ReactLib = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) =>
      ReactLib.createElement(
        Pressable,
        { accessibilityRole: 'button', onPress: disabled ? undefined : onPress, disabled },
        ReactLib.createElement(Text, null, label),
      ),
  };
});

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import CheckInScreen from '@/app/(app)/check-in';

const CURRENT_USER_ID = 'user_a';

function mockSpaces(spaces: Array<Record<string, unknown>>) {
  mockUsePrivateSpaces.mockReturnValue({ data: spaces });
}

function getAllText(tree: ReturnType<typeof render>): string[] {
  return tree.UNSAFE_getAllByType(Text).map((n) => {
    const children = n.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('check-in.tsx — Safety section is spaceId-aware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: CURRENT_USER_ID } });
    mockUsePrivateSpaces.mockReturnValue({ data: [] });
  });

  it('no spaceId -> Safety section is hidden; self-check-in section still renders', () => {
    mockUseLocalSearchParams.mockReturnValue({});

    const tree = render(<CheckInScreen />);
    const texts = getAllText(tree);

    expect(texts).toContain('How does this feel?');
    expect(texts).not.toContain('Safety');
    expect(texts.some((t) => /report/i.test(t))).toBe(false);
    expect(texts.some((t) => /block/i.test(t))).toBe(false);
  });

  it('empty-string spaceId is treated equivalently to "no spaceId" (hidden, not looked up)', () => {
    mockUseLocalSearchParams.mockReturnValue({ spaceId: '' });
    mockSpaces([]);

    const tree = render(<CheckInScreen />);
    const texts = getAllText(tree);

    expect(texts).not.toContain('Safety');
  });

  it('spaceId present + resolvable alias -> Safety option labels include the alias', () => {
    mockUseLocalSearchParams.mockReturnValue({ spaceId: 'space_1' });
    mockSpaces([
      { id: 'space_1', user_a: CURRENT_USER_ID, alias_a: 'Me', alias_b: 'Wren' },
    ]);

    const tree = render(<CheckInScreen />);
    const texts = getAllText(tree);

    expect(texts).toContain('Safety');
    expect(texts.some((t) => t.includes('Wren') && /report/i.test(t))).toBe(true);
    expect(texts.some((t) => t.includes('Wren') && /block/i.test(t))).toBe(true);
    // Old ambiguous generic copy must be gone.
    expect(texts).not.toContain('Report this person');
    expect(texts).not.toContain('Block & end the conversation');
  });

  it('selecting an alias-aware Safety option flips the primary button to "Submit report"', () => {
    mockUseLocalSearchParams.mockReturnValue({ spaceId: 'space_1' });
    mockSpaces([
      { id: 'space_1', user_a: CURRENT_USER_ID, alias_a: 'Me', alias_b: 'Wren' },
    ]);

    const tree = render(<CheckInScreen />);
    const reportRow = tree.getByText(/report wren/i);
    let node: typeof reportRow.parent = reportRow.parent;
    while (node && typeof node.props.onPress !== 'function') {
      node = node.parent;
    }
    act(() => node!.props.onPress());

    expect(tree.getAllByText('Submit report').length).toBeGreaterThan(0);
  });

  it('spaceId present but unresolvable (no matching space) -> generic fallback, no crash', () => {
    mockUseLocalSearchParams.mockReturnValue({ spaceId: 'space_missing' });
    mockSpaces([
      { id: 'space_1', user_a: CURRENT_USER_ID, alias_a: 'Me', alias_b: 'Wren' },
    ]);

    expect(() => render(<CheckInScreen />)).not.toThrow();
    const tree = render(<CheckInScreen />);
    const texts = getAllText(tree);

    expect(texts).toContain('Safety');
    expect(texts.some((t) => t.includes('undefined'))).toBe(false);
    expect(texts.some((t) => /report this person/i.test(t))).toBe(true);
  });

  function pressPrimaryButton(tree: ReturnType<typeof render>, label: 'Done' | 'Submit report') {
    const textNode = tree.getByText(label);
    let node: typeof textNode.parent = textNode.parent;
    while (node && typeof node.props.onPress !== 'function') {
      node = node.parent;
    }
    if (!node) throw new Error(`no pressable ancestor found for "${label}"`);
    act(() => node!.props.onPress());
  }

  it.each([
    ['no spaceId', {}],
    ['spaceId present', { spaceId: 'space_1' }],
  ])('onDone (haptic + router.back()) fires identically — %s', (_label, params) => {
    const back = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ back, push: jest.fn() });
    mockUseLocalSearchParams.mockReturnValue(params);
    mockSpaces([{ id: 'space_1', user_a: CURRENT_USER_ID, alias_a: 'Me', alias_b: 'Wren' }]);

    const tree = render(<CheckInScreen />);
    // Select the self-check-in option (present + rendered identically in
    // both cases) to enable the primary button, then press it.
    const feelingOption = tree.getByText('This feels good');
    let feelingRow: typeof feelingOption.parent = feelingOption.parent;
    while (feelingRow && typeof feelingRow.props.onPress !== 'function') {
      feelingRow = feelingRow.parent;
    }
    act(() => feelingRow!.props.onPress());

    pressPrimaryButton(tree, 'Done');

    expect(back).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });
});
