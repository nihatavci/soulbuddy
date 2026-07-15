---
slug: paperwhite-icons
date: 2026-07-15
status: complete
---

# Summary: Paperwhite pen-drawn icon set (app-wide)

Replaced ALL @expo/vector-icons usage (Feather + Ionicons) with a hand-drawn Paperwhite
set. Zero leftovers. Brand logos (Apple/Google/TikTok) untouched.

## What shipped
- `scripts/bake-icons.mjs` — offline baker: 38 canonical glyphs, wobble baked into path
  data via svg-path-properties (amp 0.5, single pass, integer/periodic noise so closed
  shapes seam, pen-lift detection so separate strokes don't bridge). `npm run bake:icons`.
- `components/icons/paperwhite.generated.ts` — generated GLYPHS + 24 ALIASES.
- `components/icons/Icon.tsx` — drop-in `<Icon name size color strokeWidth style/>` over
  react-native-svg; resolves legacy Feather/Ionicons names via ALIASES; dev-warns on unknown.
- 25 files converted (all 24 that imported @expo/vector-icons; profile.tsx had both imports,
  deduped to one). `<Feather>`/`<Ionicons>` → `<Icon>` (drop-in props); `keyof typeof
  Feather.glyphMap` / `React.ComponentProps<typeof Feather>['name']` → `string`.
- devDependency: svg-path-properties. package.json: `bake:icons` script.

## Verification
- `grep -r "@expo/vector-icons|<Feather|<Ionicons|typeof Feather" app components` → NONE.
- `npm run typecheck` passes.
- Spot-checked multi-line tags (Button, TabBar) and profile.tsx single import.

## Notes
- Wobble level = "Handwritten" (amp 0.5), single pass — the approved preview default. To
  change feel: edit AMP in scripts/bake-icons.mjs and re-run `npm run bake:icons`.
- New glyphs needed beyond the designed 19 were drawn in the same 24×24/1.6px style:
  zap, cpu, chevron-left/right, trash, star, eye, reply, bar-chart, alert-triangle,
  activity, pause, grid, heart, check-circle, arrow-right, clock, logout, card.
- Visual on-device pass still pending (headless change).
