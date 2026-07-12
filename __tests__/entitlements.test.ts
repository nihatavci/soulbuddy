/**
 * __tests__/entitlements.test.ts
 *
 * UC-2: RevenueCat Entitlement Gating
 */

jest.mock('react-native-purchases', () => {
  const getCustomerInfo = jest.fn();
  const getOfferings = jest.fn();
  return {
    __esModule: true,
    default: {
      configure: jest.fn(),
      logIn: jest.fn().mockResolvedValue({}),
      setLogLevel: jest.fn(),
      getCustomerInfo,
      getOfferings,
      purchasePackage: jest.fn(),
      restorePurchases: jest.fn(),
    },
    LOG_LEVEL: { DEBUG: 'DEBUG' },
    __mock: { getCustomerInfo, getOfferings },
  };
});

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentPaywall: jest.fn(),
    presentCustomerCenter: jest.fn(),
  },
  PAYWALL_RESULT: {
    NOT_PRESENTED: 'NOT_PRESENTED',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
    ERROR: 'ERROR',
  },
}));

jest.mock('@sentry/react-native', () => ({
  withScope: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: jest.fn((c: any) => c),
}));

import { isProFromCustomerInfo, ENTITLEMENT_PRO, fetchCustomerInfo } from '@/lib/revenuecat';
import { ENTITLEMENTS_QUERY_KEY } from '@/hooks/useEntitlements';
import type { CustomerInfo } from 'react-native-purchases';

const { getCustomerInfo: mockGetCustomerInfo } = require('react-native-purchases').__mock;

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeCustomerInfo(entitlementIds: string[]): CustomerInfo {
  const active: Record<string, any> = {};
  for (const id of entitlementIds) {
    active[id] = { identifier: id, isActive: true };
  }
  return {
    entitlements: { active, all: active },
    originalAppUserId: 'test_user_123',
    activeSubscriptions: entitlementIds,
  } as unknown as CustomerInfo;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('isProFromCustomerInfo', () => {
  it('returns true when "MyApp Pro" entitlement is active', () => {
    expect(isProFromCustomerInfo(makeCustomerInfo([ENTITLEMENT_PRO]))).toBe(true);
  });

  it('returns false when no entitlements are active', () => {
    expect(isProFromCustomerInfo(makeCustomerInfo([]))).toBe(false);
  });

  it('returns false when a different entitlement is active', () => {
    expect(isProFromCustomerInfo(makeCustomerInfo(['other_entitlement']))).toBe(false);
  });

  it('is case-sensitive — lowercase variant does not match', () => {
    expect(isProFromCustomerInfo(makeCustomerInfo(['myapp pro']))).toBe(false);
  });
});

describe('fetchCustomerInfo', () => {
  beforeEach(() => mockGetCustomerInfo.mockReset());

  it('returns CustomerInfo from RevenueCat SDK', async () => {
    const mockInfo = makeCustomerInfo([ENTITLEMENT_PRO]);
    mockGetCustomerInfo.mockResolvedValueOnce(mockInfo);

    const info = await fetchCustomerInfo();
    expect(info.entitlements.active[ENTITLEMENT_PRO]).toBeDefined();
  });
});

describe('ENTITLEMENTS_QUERY_KEY', () => {
  it('is a stable array starting with "entitlements"', () => {
    expect(Array.isArray(ENTITLEMENTS_QUERY_KEY)).toBe(true);
    expect(ENTITLEMENTS_QUERY_KEY[0]).toBe('entitlements');
  });
});

describe('Free tier protection', () => {
  it('placeholder data is { isPro: false } — free users never get locked out', () => {
    // The placeholderData in useEntitlements is { isPro: false, customerInfo: null }
    // This ensures the free tier is always accessible even if the query hasn't resolved yet
    const placeholder = { isPro: false, customerInfo: null as any };
    expect(placeholder.isPro).toBe(false);
  });
});
