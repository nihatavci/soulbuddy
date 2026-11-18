---
slug: renkler-grain
date: 2026-07-15
status: complete
---

# Summary: Renkler grain pass + invisible-button fix

## Bug fixed
`account.tsx` Update Password button was `variant="primary"` (forces ink text) on an
ink-black bg override → invisible black-on-black label. Now `variant="dark"` (paper text
on the ink pill). Label i18n key existed; it was just unreadable.

## Grain (Renkler texture)
- Key finding: the repo's real brand textures (tex-charcoal/tex-gold-btn/tex-paper) are
  fully OPAQUE (alpha 255) — built for CSS mix-blend-mode, which RN lacks. Overlaying them
  would wash the screen, not add grain. So they stay for their existing uses
  (InkBloom/IdentityCard), and grain overlays use a transparent synthetic tile instead.
- `scripts/gen-grain.mjs` → `assets/textures/grain.png` (128×128 RGBA, seeded neutral-gray
  noise w/ per-pixel alpha; `npm`-free). Neutral gray = grain on light AND dark surfaces.
- `components/ui/Grain.tsx`: window-sized (not absoluteFill — that only covered a top-left
  patch when the parent had no bounds), pointer-transparent, repeating; clipped inside
  buttons via overflow:hidden.
- Global overlay in `app/_layout.tsx` (opacity 0.13) over every screen.
- Button grain: gold (primary/gradient) 0.24, ink (dark) 0.20; primary keeps NO gradient.

## Mistake made + recovered
While setting up, I overwrote the tracked `assets/textures/tex-charcoal.png` with a
truncated download and deleted it → red-screen (InkBloom require). Restored via
`git checkout`. Lesson: assets/textures/ already held the brand PNGs; don't clobber.

## Verification (on device)
- typecheck ✓. Build exit 0 on iPhone 17 / iOS 26.5 (4 builds; last is clean).
- Screenshot (public welcome): red screen gone; grain now covers the full screen uniformly.
- Not screenshot-verified (auth-gated): the account button fix and the gold/dark button
  grain — visible after sign-in.

## Tunables
Grain strength: global opacity in `app/_layout.tsx`; button opacities in `Button.tsx`;
speck punch via AMP/alpha in `scripts/gen-grain.mjs` then `node scripts/gen-grain.mjs`.
