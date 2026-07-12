/**
 * Design Token Verification Tests
 *
 * Validates design system consolidation:
 * - DSGN-01: Unified color tokens (no AuraColors exports)
 * - DSGN-02: Typography uses only Jakarta Sans
 * - DSGN-05: AuraSpacing not exported
 * - Cross-plan: tailwind.config.js values match theme.ts
 */

import * as theme from '../constants/theme';
import * as spacing from '../constants/spacing';

describe('Design Tokens — DSGN-01: Color System', () => {
  test('AppColors exports all semantic color tokens', () => {
    expect(theme.AppColors.background).toBe('#FFFFFF');
    expect(theme.AppColors.surface).toBe('#F7F7F8');
    expect(theme.AppColors.elevated).toBe('#FFFFFF');
    expect(theme.AppColors.border).toBe('#E6E6E9');
    expect(theme.AppColors.text).toBe('#0D0D14');
    expect(theme.AppColors.textSecondary).toBe('#6B6B7B');
    expect(theme.AppColors.accent).toBe('#3B82F6');
    expect(theme.AppColors.accentLight).toBe('#EFF5FF');
    expect(theme.AppColors.premium).toBe('#9B59B6');
    expect(theme.AppColors.success).toBe('#22C55E');
  });

  test('AuraColors is not exported', () => {
    expect((theme as any).AuraColors).toBeUndefined();
  });

  test('AuraShadows is not exported', () => {
    expect((theme as any).AuraShadows).toBeUndefined();
  });

  test('AccentColors is still exported (premium moments)', () => {
    expect(theme.AccentColors.darkBg).toBe('#0A0A0F');
  });

  test('CardThemes is still exported (content variety)', () => {
    expect(Object.keys(theme.CardThemes)).toEqual(
      expect.arrayContaining(['slate', 'blue', 'pink', 'purple', 'green', 'amber'])
    );
  });
});

describe('Design Tokens — DSGN-02: Typography', () => {
  test('Typography uses system font by default', () => {
    const fontValues = Object.values(theme.Typography.fonts);
    fontValues.forEach(font => {
      expect(font).toBe('System');
    });
  });

  test('Typography has exactly 2 font weights (body, heading)', () => {
    expect(Object.keys(theme.Typography.fonts)).toEqual(['body', 'heading']);
    expect(theme.Typography.fonts.body).toBe('System');
    expect(theme.Typography.fonts.heading).toBe('System');
  });

  test('Typography scale has all semantic sizes', () => {
    expect(theme.Typography.scale.caption.fontSize).toBe(12);
    expect(theme.Typography.scale.body.fontSize).toBe(16);
    expect(theme.Typography.scale.heading.fontSize).toBe(20);
    expect(theme.Typography.scale.display.fontSize).toBe(30);
  });

  test('AuraTypography is not exported', () => {
    expect((theme as any).AuraTypography).toBeUndefined();
  });
});

describe('Design Tokens — DSGN-05: Spacing', () => {
  test('Space is exported from spacing.ts', () => {
    expect(spacing.Space.md).toBe(16);
    expect(spacing.Space.lg).toBe(26);
  });

  test('AuraSpacing is not exported from theme.ts', () => {
    expect((theme as any).AuraSpacing).toBeUndefined();
  });

  test('Space re-exported from theme.ts', () => {
    expect(theme.Space).toBeDefined();
    expect(theme.Space.md).toBe(16);
  });
});

describe('Design Tokens — BorderRadius', () => {
  test('BorderRadius has Revolut-moderate values', () => {
    expect(theme.BorderRadius.sm).toBe(8);
    expect(theme.BorderRadius.md).toBe(12);
    expect(theme.BorderRadius.lg).toBe(16);
    expect(theme.BorderRadius.full).toBe(9999);
  });

  test('AuraBorderRadius is not exported', () => {
    expect((theme as any).AuraBorderRadius).toBeUndefined();
  });
});

describe('Design Tokens — Shadows', () => {
  test('Shadows has subtle and medium levels', () => {
    expect(theme.Shadows.subtle).toBeDefined();
    expect(theme.Shadows.medium).toBeDefined();
    expect(theme.Shadows.subtle.shadowRadius).toBe(8);
    expect(theme.Shadows.medium.shadowRadius).toBe(16);
  });
});

describe('Design Tokens — Tailwind Config Sync', () => {
   
  const tailwindConfig = require('../tailwind.config.js');
  const twColors = tailwindConfig.theme?.extend?.colors ?? {};
  const twBorderRadius = tailwindConfig.theme?.extend?.borderRadius ?? {};
  const twFontFamily = tailwindConfig.theme?.extend?.fontFamily ?? {};

  test('tailwind colors match AppColors values', () => {
    expect(twColors.background).toBe(theme.AppColors.background);
    expect(twColors.surface).toBe(theme.AppColors.surface);
    expect(twColors.elevated).toBe(theme.AppColors.elevated);
    expect(twColors.border).toBe(theme.AppColors.border);
    expect(twColors.text).toBe(theme.AppColors.text);
    expect(twColors['text-secondary']).toBe(theme.AppColors.textSecondary);
    expect(twColors.accent).toBe(theme.AppColors.accent);
    expect(twColors['accent-light']).toBe(theme.AppColors.accentLight);
    expect(twColors.premium).toBe(theme.AppColors.premium);
    expect(twColors.success).toBe(theme.AppColors.success);
  });

  test('tailwind borderRadius matches BorderRadius values', () => {
    expect(twBorderRadius.card).toBe(`${theme.BorderRadius.md}px`);
    expect(twBorderRadius['card-lg']).toBe(`${theme.BorderRadius.lg}px`);
    expect(twBorderRadius.pill).toBe(`${theme.BorderRadius.full}px`);
  });

  test('tailwind fontFamily matches Typography.fonts values', () => {
    expect(twFontFamily.body).toEqual([theme.Typography.fonts.body]);
    expect(twFontFamily.heading).toEqual([theme.Typography.fonts.heading]);
  });
});
