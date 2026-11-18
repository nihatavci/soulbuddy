/**
 * __tests__/report-block.test.tsx
 *
 * App Review Guideline 1.2: Report and Block in check-in.tsx must reach the backend (they used to be
 * a haptic + router.back()). Report needs a reason; block hides the pair and leaves the space.
 */

const mockReport = jest.fn();
const mockBlock = jest.fn();
jest.mock('@/hooks/useSafety', () => ({
  useReport: () => ({ mutateAsync: mockReport }),
  useBlockUser: () => ({ mutateAsync: mockBlock }),
  REPORT_REASONS: ['spam', 'harassment', 'sexual', 'hate', 'other'],
}));

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ spaceId: 'space_1' }),
}));

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: () => ({
    data: [{ id: 'space_1', user_a: 'me', user_b: 'them', alias_a: 'ME', alias_b: 'luna' }],
  }),
  otherAlias: () => 'luna',
}));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));
jest.mock('@/components/glow', () => ({ Toast: { show: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/components/ui/Button', () => {
  const ReactLib = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) =>
      ReactLib.createElement(
        Pressable,
        { accessibilityRole: 'button', onPress: disabled ? undefined : onPress, disabled, accessibilityLabel: `btn:${label}` },
        ReactLib.createElement(Text, null, label),
      ),
  };
});

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import CheckInScreen from '@/app/(app)/check-in';

describe('check-in report and block', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReport.mockResolvedValue(undefined);
    mockBlock.mockResolvedValue(undefined);
  });

  it('report is disabled until a reason is picked, then sends the space and reason', async () => {
    const tree = render(<CheckInScreen />);
    fireEvent.press(tree.getByText('Report luna'));
    // no reason yet: pressing the submit button does nothing
    await act(async () => { fireEvent.press(tree.getByText('Submit report')); });
    expect(mockReport).not.toHaveBeenCalled();

    fireEvent.press(tree.getByText('Harassment or threats'));
    await act(async () => { fireEvent.press(tree.getByText('Submit report')); });
    expect(mockReport).toHaveBeenCalledWith({ spaceId: 'space_1', reason: 'harassment' });
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('block sends the other person and leaves to the Private list', async () => {
    const tree = render(<CheckInScreen />);
    fireEvent.press(tree.getByText('Block & end conversation with luna'));
    await act(async () => { fireEvent.press(tree.getByText('Submit report')); });
    expect(mockBlock).toHaveBeenCalledWith('them');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/(tabs)/private');
  });

  it('a failed report keeps the screen open', async () => {
    mockReport.mockRejectedValue(new Error('network'));
    const tree = render(<CheckInScreen />);
    fireEvent.press(tree.getByText('Report luna'));
    fireEvent.press(tree.getByText('Spam or scam'));
    await act(async () => { fireEvent.press(tree.getByText('Submit report')); });
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
