import { resolveLangSelection, persistLangOverride } from './langSelect';
import { setLangOverride } from '@/i18n';

jest.mock('@/i18n', () => ({
  setLangOverride: jest.fn(),
}));

describe('resolveLangSelection', () => {
  it('no-ops when the requested language matches the current one', () => {
    expect(resolveLangSelection('en', 'en')).toEqual({ shouldApply: false });
  });

  it('applies when the requested language differs from the current one', () => {
    expect(resolveLangSelection('en', 'de')).toEqual({ shouldApply: true, nextLang: 'de' });
  });
});

describe('persistLangOverride', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true on successful persistence', () => {
    (setLangOverride as jest.Mock).mockImplementation(() => {});
    expect(persistLangOverride('de')).toBe(true);
    expect(setLangOverride).toHaveBeenCalledWith('de');
  });

  it('returns false and swallows the error when persistence throws', () => {
    (setLangOverride as jest.Mock).mockImplementation(() => {
      throw new Error('storage failure');
    });
    expect(() => persistLangOverride('en')).not.toThrow();
    expect(persistLangOverride('en')).toBe(false);
  });
});
