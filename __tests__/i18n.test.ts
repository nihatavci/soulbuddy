/**
 * __tests__/i18n.test.ts
 *
 * L10N-04: Language detector always resolves to 'en' (English-only app).
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => undefined),
    getBoolean: jest.fn(() => false),
    set: jest.fn(),
  })),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('i18n module', () => {
  describe('L10N-04: Language detector', () => {
    it("resolves to 'en' when device locale is 'en'", () => {
      jest.resetModules();

      jest.mock('react-native-mmkv', () => ({
        MMKV: jest.fn().mockImplementation(() => ({
          getString: jest.fn(() => undefined),
          getBoolean: jest.fn(() => false),
          set: jest.fn(),
        })),
      }));
      jest.mock('expo-localization', () => ({
        getLocales: jest.fn(() => [{ languageCode: 'en' }]),
      }));

      const freshI18n = require('@/i18n').default;
      expect(freshI18n.language).toBe('en');
    });

    it("resolves to 'en' for any device locale (English-only app)", () => {
      jest.resetModules();

      jest.mock('react-native-mmkv', () => ({
        MMKV: jest.fn().mockImplementation(() => ({
          getString: jest.fn(() => undefined),
          getBoolean: jest.fn(() => false),
          set: jest.fn(),
        })),
      }));
      jest.mock('expo-localization', () => ({
        getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
      }));

      const freshI18n = require('@/i18n').default;
      expect(freshI18n.language).toBe('en');
    });
  });
});
