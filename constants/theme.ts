// MyApp — Unified Design Token System
// Single source of truth for color, typography, border radius, and shadow tokens.
// Neutral starting palette — swap `accent` and the CardThemes for your brand.

export { Space, Relation, opticalPadding, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from './spacing';

// ─── Colors ──────────────────────────────────────────────────────────────────
// re:sense design system (claude.ai/design → resense.design-tokens.json).
// "Signal Paper" art direction — PAPER (light) theme: paper.50 surface, ink.950
// text, Signal Yellow as scarce punctuation (5–10% max, never wallpaper).
// surfaceTheme.paper from RESENSE_CLAUDE_DESIGN_SPEC_v1. Keep in sync with tailwind.config.js.
export const AppColors = {
  background:    '#F3EFE6',                  // paper.50  / surfaceLight
  surface:       '#ECE5D9',                  // paper.100 / raised cards & bubbles
  elevated:      '#E3DACD',                  // paper.200 / more-raised surface
  sand:          '#D9D2C3',                  // sand.300  / quiet bg, separators, inactive
  border:        'rgba(13,13,16,0.12)',      // borderOnLight (#0D0D101F)

  text:          '#0D0D10',                  // ink.950 / textOnLight
  textSecondary: '#5C5C64',                  // ink.500 / textMutedOnLight

  // Signal Yellow accent (primary action bg; ALWAYS ink text on it). Scarce.
  accent:        '#FFD03A',                  // signal.500
  accentLight:   'rgba(255,208,58,0.20)',    // signal tint surface (on paper)
  accentMuted:   'rgba(255,208,58,0.45)',    // signal tint border
  accentDeep:    '#E7B900',                  // signal.600 (accentPressed / focus)

  // Ink islands — for the few deliberately-dark elements on paper (e.g. an ink
  // button or the "mine" message bubble). Use paper text on these.
  ink:           '#0D0D10',                  // ink.950
  inkElevated:   '#212125',                  // ink.800

  premium:       '#7A7F5D',                  // moss.500
  success:       '#4F6A56',                  // status.success
  error:         '#A6453D',                  // status.danger
} satisfies Record<string, string>;

// ─── Typography ──────────────────────────────────────────────────────────────
// System font placeholder — register a custom font in fonts.ts and update here.
export const Typography = {
  fonts: {
    // re:sense brand fonts (resense.design-tokens.json), bundled as .ttf in
    // assets/fonts and registered in constants/fonts.ts. display = Playfair
    // Display (brand/wordmark, italic applied in Wordmark), heading/body =
    // Satoshi (UI), prompt = Special Elite (typewriter signal-composer face).
    // Family names must match the keys registered in loadFonts().
    display: 'PlayfairDisplay',
    heading: 'Satoshi-Bold',
    body:    'Satoshi',
    prompt:  'SpecialElite',
  },
  scale: {
    caption:    { fontSize: 12, lineHeight: 16 },
    body:       { fontSize: 16, lineHeight: 24 },
    subheading: { fontSize: 16, lineHeight: 22 },
    heading:    { fontSize: 20, lineHeight: 26 },
    display:    { fontSize: 30, lineHeight: 36 },
  },
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
// re:sense radii (design tokens): card 16, input 16, pill 999. Keep in sync with tailwind.config.js.
export const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, card: 16, input: 16, pill: 999, full: 9999 } as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  subtle: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, shadowOpacity: 0.04, elevation: 2 },
  medium: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, shadowOpacity: 0.08, elevation: 4 },
} as const;

// ─── Card Theme System (neutral pastel set) ──────────────────────────────────
export const CardThemes: Record<string, { bg: string; text: string; accent: string; accentLight: string }> = {
  slate:  { bg: '#F1F5F9', text: '#0F172A', accent: '#64748B', accentLight: '#CBD5E1' },
  blue:   { bg: '#E4EEFF', text: '#0A0E1A', accent: '#4D9FFF', accentLight: '#8CC4FF' },
  pink:   { bg: '#FFE4F3', text: '#1A0A14', accent: '#E8A0BF', accentLight: '#F4C4DA' },
  purple: { bg: '#F0E4FF', text: '#140A1A', accent: '#9B59B6', accentLight: '#C68FDB' },
  green:  { bg: '#E4FFE8', text: '#0A1A0E', accent: '#22C55E', accentLight: '#5EE890' },
  amber:  { bg: '#FFF6E0', text: '#1A140A', accent: '#F59E0B', accentLight: '#FFE08A' },
};

export const CARD_THEME_KEYS = ['slate', 'blue', 'pink', 'purple', 'green', 'amber'];
export type CardThemeKey = string;

export function getCardTheme(index: number) {
  return CardThemes[CARD_THEME_KEYS[index % CARD_THEME_KEYS.length]];
}

// ─── Dark Accent Colors (premium dark islands on light theme) ────────────────
export const AccentColors = {
  darkBg:        '#0A0A0F',
  darkElevated:  '#111118',
  darkSurface:   '#1A1A24',
  darkBorder:    'rgba(255,255,255,0.08)',
  darkText:      '#FFFFFF',
  darkTextMuted: '#9CA3AF',

  accentGradient:  ['#60A5FA', '#3B82F6', '#1E40AF'] as const,
  ctaGradient:     ['#60A5FA', '#3B82F6'] as const,
  premiumGlow:     ['#8B5CF6', '#C084FC', '#E879F9'] as const,
};
