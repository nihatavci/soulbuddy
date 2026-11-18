/**
 * __tests__/i18n.test.ts
 *
 * Covers i18n/index.ts language resolution:
 *   - device-locale detection ('de', 'en', unsupported locales)
 *   - override precedence over device locale (both directions)
 *   - invalid override value falls through to device-locale-then-fallback
 *   - malformed/empty getLocales() result falls back safely (try/catch)
 *   - setLangOverride write path persists to the Prefs store and is
 *     reflected by a subsequent read
 */

type MMKVLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | boolean | number) => void;
  getBoolean: (key: string) => boolean | undefined;
  delete: (key: string) => void;
};

/** Builds a fresh in-memory MMKV mock backed by a real Map, so writes are observable by reads. */
function makeMockMMKV(): MMKVLike {
  const map = new Map<string, string | boolean | number>();
  return {
    getString: (key: string) => {
      const v = map.get(key);
      return typeof v === 'string' ? v : undefined;
    },
    set: (key: string, value: string | boolean | number) => {
      map.set(key, value);
    },
    getBoolean: (key: string) => {
      const v = map.get(key);
      return typeof v === 'boolean' ? v : undefined;
    },
    delete: (key: string) => {
      map.delete(key);
    },
  };
}

/** Sets up mocks for react-native-mmkv and expo-localization, then requires a fresh @/i18n module. */
function loadI18nModule(locales: Array<{ languageCode: string | null }>) {
  jest.resetModules();

  const mockMMKV = makeMockMMKV();

  jest.doMock('react-native-mmkv', () => ({
    MMKV: jest.fn().mockImplementation(() => mockMMKV),
  }));
  jest.doMock('expo-localization', () => ({
    getLocales: jest.fn(() => locales),
  }));

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@/i18n');
  return { mod, mockMMKV };
}

describe('i18n module', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('device-locale detection', () => {
    it("resolves to 'de' when device locale is 'de' and no override is set", () => {
      const { mod } = loadI18nModule([{ languageCode: 'de' }]);
      expect(mod.resolveLang()).toBe('de');
      expect(mod.default.language).toBe('de');
    });

    it("resolves to 'en' when device locale is 'en' and no override is set", () => {
      const { mod } = loadI18nModule([{ languageCode: 'en' }]);
      expect(mod.resolveLang()).toBe('en');
      expect(mod.default.language).toBe('en');
    });

    it("falls back to 'en' when device locale is unsupported (e.g. 'ja')", () => {
      const { mod } = loadI18nModule([{ languageCode: 'ja' }]);
      expect(mod.resolveLang()).toBe('en');
    });
  });

  describe('override precedence over device locale', () => {
    it("override 'de' wins over device locale 'en'", () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'en' }]);
      mockMMKV.set(mod.LANG_OVERRIDE_KEY, 'de');
      expect(mod.resolveLang()).toBe('de');
    });

    it("override 'en' wins over device locale 'de'", () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'de' }]);
      mockMMKV.set(mod.LANG_OVERRIDE_KEY, 'en');
      expect(mod.resolveLang()).toBe('en');
    });
  });

  describe('invalid override value', () => {
    it('does not crash and falls through to device locale when override is unsupported', () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'de' }]);
      mockMMKV.set(mod.LANG_OVERRIDE_KEY, 'fr');
      expect(mod.getLangOverride()).toBeUndefined();
      expect(() => mod.resolveLang()).not.toThrow();
      expect(mod.resolveLang()).toBe('de');
    });

    it('falls through to fallback \'en\' when override is unsupported and device locale is also unsupported', () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'ja' }]);
      mockMMKV.set(mod.LANG_OVERRIDE_KEY, 'fr');
      expect(mod.resolveLang()).toBe('en');
    });
  });

  describe('malformed/empty getLocales() result', () => {
    it("falls back to fallback 'en' when getLocales() returns an empty array", () => {
      const { mod } = loadI18nModule([]);
      expect(() => mod.resolveLang()).not.toThrow();
      expect(mod.resolveLang()).toBe('en');
    });

    it('falls back to the override when set, even if getLocales() returns an empty array', () => {
      const { mod, mockMMKV } = loadI18nModule([]);
      mockMMKV.set(mod.LANG_OVERRIDE_KEY, 'de');
      expect(mod.resolveLang()).toBe('de');
    });

    it('does not throw when getLocales() itself throws', () => {
      jest.resetModules();
      const mockMMKV = makeMockMMKV();
      jest.doMock('react-native-mmkv', () => ({
        MMKV: jest.fn().mockImplementation(() => mockMMKV),
      }));
      jest.doMock('expo-localization', () => ({
        getLocales: jest.fn(() => {
          throw new Error('native module unavailable');
        }),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@/i18n');
      expect(() => mod.resolveLang()).not.toThrow();
      expect(mod.resolveLang()).toBe('en');
    });
  });

  describe('setLangOverride write path', () => {
    it('writes the override to the Prefs store and a subsequent read reflects it', () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'en' }]);

      expect(mod.getLangOverride()).toBeUndefined();

      mod.setLangOverride('de');

      expect(mockMMKV.getString(mod.LANG_OVERRIDE_KEY)).toBe('de');
      expect(mod.getLangOverride()).toBe('de');
      expect(mod.resolveLang()).toBe('de');
    });

    it('clears the override when called with null', () => {
      const { mod, mockMMKV } = loadI18nModule([{ languageCode: 'en' }]);

      mod.setLangOverride('de');
      expect(mod.getLangOverride()).toBe('de');

      mod.setLangOverride(null);

      expect(mockMMKV.getString(mod.LANG_OVERRIDE_KEY)).toBeUndefined();
      expect(mod.getLangOverride()).toBeUndefined();
      expect(mod.resolveLang()).toBe('en');
    });
  });
});
