---
slug: compose-edgeframe-seal
date: 2026-07-15
project: re:sense
---

# Quick Task: Compose edge-frame + bigger seal + tap-hint

Create screen (`app/(app)/(tabs)/create.tsx`), two user wishes.

## 1. Edge-tracing frame (draws once on open)
`components/ui/EdgeFrame.tsx`: thin ink line that on mount draws down the left edge,
rounds the two bottom corners, up the right edge, settles at top — then stays. A U-path
revealed via animated `strokeDashoffset` (react-native-svg AnimatedPath + reanimated).
pointer-transparent, low-opacity ink, plays once. Rendered behind content in
PaperBackground. Writing zone left untouched.

## 2. Bigger seal + pulsing tap-hint
- `SealMark.tsx`: radii were hardcoded (didn't scale with `size`) → multiply blob/dot/
  orbit geometry by `k = size/96`, so a bigger `size` = a bigger seal. create passes 140 (was 96).
- Tap-hint: a breathing ink ring above the seal (`pulse` shared value, ripple scale+fade,
  looping) that only invites while NOT holding and fades out on hold.

## Verify
- typecheck ✓ (also fixed a latent Grain.tsx `pointerEvents`-on-Image type error).
- build on iPhone 17 / iOS 26.5. NOTE: compose screen is auth-gated + the frame/hint are
  animations, so build/boot verified but the screen itself not screenshot-verified headlessly.
