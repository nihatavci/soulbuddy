---
slug: compose-edgeframe-seal
date: 2026-07-15
status: complete
---

# Summary: Compose edge-frame + bigger seal + tap-hint

## Shipped
- `components/ui/EdgeFrame.tsx` (new): ambient ink line that on mount draws down the left
  edge → rounds both bottom corners → up the right edge → settles at top, then stays.
  U-path revealed via animated `strokeDashoffset` (SVG AnimatedPath + reanimated).
  Pointer-transparent, low-opacity ink, plays once. Rendered behind content in create.tsx.
- `SealMark.tsx`: radii were hardcoded (bumping `size` only padded) → scaled blob/dots/
  orbit by `k = size/96`. create now passes `size={140}` (was 96) = a genuinely bigger seal.
- Tap-hint: breathing ink ring above the seal (`pulse` loop; ripple scale+fade) that invites
  while NOT holding and fades on hold.
- Fixed a latent `Grain.tsx` type error (`pointerEvents` on Image) AND a grain-tiling
  regression it caused (absoluteFill left a denser top-left patch) → explicit window w/h on
  the Image tiles evenly. Verified: grain now uniform full-screen.

## Verification
- typecheck ✓. Build exit 0 on iPhone 17 / iOS 26.5 (multiple builds; last clean).
- Screenshot: app boots clean, grain uniform (patch fixed).
- NOT screenshot-verified: the compose screen itself — it's auth-gated (welcome "Leave a
  sentence" routes to age-gate, not create) AND the frame-draw + hint are animations that a
  static screenshot can't show. Code-complete + typecheck + build verified; visible on device
  after sign-in.

## Tunables
- Frame: EdgeFrame props (insets, radius, duration, delay).
- Seal size: `size={140}` in create.tsx (+ styles.seal box).
- Hint: `styles.hintRing` (size/offset), `pulse` duration, hintStyle opacity/scale.
