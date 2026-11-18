---
slug: paperwhite-icons
date: 2026-07-15
project: re:sense
---

# Quick Task: Paperwhite pen-drawn icon set (app-wide)

Replace ALL @expo/vector-icons (Feather 71× + Ionicons 30×) usage with a hand-drawn
"Paperwhite" set. No leftovers. Brand logos (Apple/Google/TikTok) untouched.

## Approach
RN can't measure paths at runtime, so wobble is BAKED offline into static path data.

1. `scripts/bake-icons.mjs` — 38 canonical base glyphs (24×24, geometric). Uses
   svg-path-properties to sample each stroke; applies smooth seeded PERIODIC noise
   (integer frequencies so closed shapes seam cleanly), amp 0.5, single pass. Detects
   pen-lifts (euclidean jumps) so separate strokes don't get bridged. Writes
   `components/icons/paperwhite.generated.ts` (GLYPHS, ALIASES, IconName).
2. `components/icons/Icon.tsx` — drop-in `<Icon name size color strokeWidth style/>`
   over react-native-svg; resolves ALIASES; dev-warns on unknown names.
3. Convert all 24 files: swap `@expo/vector-icons` import → `Icon`; `<Feather`/`<Ionicons`
   → `<Icon` (self-closing, drop-in props); `FeatherIcon` type → `IconName`.

## Alias coverage (every used name → canonical)
Feather: shield,lock,zap,x→close,chevron-left,check→confirm,cpu,chevron-right,user→person,
trash-2→trash,star,sliders→settings,slash→block,send,eye,eye-off→hide,corner-up-left→reply,
bar-chart-2→bar-chart,alert-triangle,activity,pause,grid,flag→report,edit-3→write,heart
Ionicons: chevron-forward→chevron-right,chevron-back→chevron-left,checkmark→confirm,
checkmark-circle→check-circle,arrow-forward→arrow-right,trash-outline→trash,time-outline→clock,
star-outline→star,pencil-outline→write,notifications-outline→notify,log-out-outline→logout,
lock-closed-outline→lock,card-outline→card,add

## Verify
- `grep -r "@expo/vector-icons\|<Feather\|<Ionicons" app components` → 0 hits.
- `npm run typecheck` passes.
