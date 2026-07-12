// Stub — react-native-purchases-ui removed due to RN 0.81 New Architecture
// incompatibility (currentActivity unresolved). Will be re-added in Phase 5.
module.exports = {
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
};
