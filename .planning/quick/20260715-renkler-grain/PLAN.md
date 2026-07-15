---
slug: renkler-grain
date: 2026-07-15
project: re:sense
---

# Quick Task: Renkler grain pass + invisible-button bug

## Bug
`app/(app)/account.tsx` Update Password button: `variant="primary"` forces ink text,
but `styles.btnOverride` repaints bg to ink → black-on-black invisible label.
Fix: `variant="dark"` (paper text on ink pill). Label i18n key exists ("Update Password").

## Renkler grain
Design uses paper-fiber (multiply), charcoal (soft-light) and gold-pigment (multiply)
grain overlays. The exact brand PNGs can't be pulled — DesignSync get_file caps output
at 256KB and truncates them (verified: no IEND). RN also lacks mix-blend-mode. So:
- Generate a small tileable neutral-gray noise PNG (`scripts/gen-grain.mjs` →
  `assets/textures/grain.png`, 128×128, no deps, seeded). Neutral gray alpha-blends as
  grain on BOTH light and dark surfaces (design's own top layer is likewise SVG noise).
- `components/ui/Grain.tsx`: pointer-transparent repeating overlay, opacity prop.
- Global grain over every screen via `app/_layout.tsx` (opacity 0.05, above Stack / below toasts).
- Button grain: gold (primary/gradient) 0.16, ink (dark) 0.12, clipped by overflow:hidden.
  Gold buttons keep NO gradient on `primary` (solid #FFD03A + grain = hand-applied pigment).

## Verify
- typecheck ✓
- build on iPhone 17 / iOS 26.5; screenshot public welcome + sign-in to confirm grain is
  visible-but-subtle and buttons are legible (no invisible text).
