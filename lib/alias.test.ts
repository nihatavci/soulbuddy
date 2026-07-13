import { validateAlias } from './alias';

describe('validateAlias', () => {
  it('rejects too-short aliases (<3)', () => {
    expect(validateAlias('ab').ok).toBe(false);
  });

  it('rejects too-long aliases (>20)', () => {
    expect(validateAlias('a'.repeat(21)).ok).toBe(false);
  });

  it('trims and accepts a valid alias', () => {
    const r = validateAlias('  good  ');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('good');
  });

  it('rejects reserved words (admin)', () => {
    expect(validateAlias('admin').ok).toBe(false);
  });

  it('rejects the brand/reserved word (resense)', () => {
    expect(validateAlias('resense').ok).toBe(false);
  });

  it('accepts a normal alias, normalized', () => {
    const r = validateAlias('luna');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('luna');
  });

  it('is case-insensitive for reserved words', () => {
    expect(validateAlias('Admin').ok).toBe(false);
    expect(validateAlias('RE:SENSE').ok).toBe(false);
  });

  it('rejects unsupported characters', () => {
    expect(validateAlias('bad name!').ok).toBe(false);
  });
});
