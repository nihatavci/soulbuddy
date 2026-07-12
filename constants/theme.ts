// MyApp — Unified Design Token System
// Single source of truth for color, typography, border radius, and shadow tokens.
// Neutral starting palette — swap `accent` and the CardThemes for your brand.

export { Space, Relation, opticalPadding, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from './spacing';

// ─── Colors ──────────────────────────────────────────────────────────────────
// re:sense dark palette (PRD/design.md). Obsidian base + Paper text + Signal
// Yellow accent. Keep in sync with tailwind.config.js colors.
export const AppColors = {
  background:    '#0E0F12',                  // Obsidian
  surface:       '#16181D',                  // Coal
  elevated:      '#1D2026',                  // Surface Soft
  border:        'rgba(246,241,232,0.10)',   // Divider

  text:          '#F6F1E8',                  // Paper
  textSecondary: '#B8B1A4',                  // Warm Grey

  // Signal Yellow accent (primary action bg; use Obsidian text on it).
  accent:        '#F2C94C',                  // Signal Yellow
  accentLight:   'rgba(242,201,76,0.14)',    // yellow tint surface
  accentMuted:   'rgba(242,201,76,0.30)',    // yellow tint border
  accentDeep:    '#D9AB1F',                  // Signal Yellow Deep (focus ring)

  premium:       '#69725F',                  // Muted Olive
  success:       '#6E8F73',                  // Soft Success
  error:         '#C85C5C',                  // Soft Error
} satisfies Record<string, string>;

// ─── Typography ──────────────────────────────────────────────────────────────
// System font placeholder — register a custom font in fonts.ts and update here.
export const Typography = {
  fonts: {
    // re:sense: display = serif-italic (wordmark/hero only), heading/body = grotesk.
    // No brand ttf bundled yet → system fallbacks (keyless boot). The Wordmark
    // applies fontStyle:'italic' on `display` so `re:` reads italic even on the
    // system-serif fallback. Register Instrument Serif Italic + Inter Tight in
    // constants/fonts.ts loadFonts() when the ttf assets land.
    display: 'serif',
    heading: 'System',
    body:    'System',
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
// re:sense radii: cards 20, inputs 16, pills 999. Keep in sync with tailwind.config.js.
export const BorderRadius = { sm: 8, md: 12, lg: 16, card: 20, input: 16, pill: 999, full: 9999 } as const;

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
