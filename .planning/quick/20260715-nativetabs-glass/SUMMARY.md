---
slug: nativetabs-glass
date: 2026-07-15
status: complete
---

# Summary: NativeTabs liquid-glass tab bar + paper-ink badge

## Changes (app/(app)/(tabs)/_layout.tsx)
- Restored expo-router NativeTabs (blog approach) = real iOS 26 system liquid-glass bar,
  replacing the custom GlassView <TabBar> (which only faked glass). SF Symbol icons,
  Signal-Yellow tintColor, useUnread badge on Private.
- Paper-ink badge: `badgeBackgroundColor={AppColors.ink}` + `badgeTextColor={background}`,
  and badge value = '' (empty string → small DOT, not a red numbered circle). Calmer,
  on-brand, non-addictive.

## Native badge constraints (answer to "resize / restyle?")
- Size: NOT arbitrarily settable — iOS owns native tab-bar badge geometry. Mitigation:
  the empty-string "small dot" form is much smaller/quieter than a numbered circle.
- Color: IS settable via NativeTabs `badgeBackgroundColor` / `badgeTextColor` (+ per-tab
  `selectedBadgeBackgroundColor`). So the loud system red is replaced with ink-on-paper.

## Verification
- `npm run typecheck` passes.
- Native build on iPhone 17 / iOS 26.5 (Xcode 26.6): `expo run:ios` exit 0 — NativeTabs
  compiles, links, and boots without crashing (the navigator-type swap that previously
  "needed a build" now confirmed working).
- Screenshot confirms app boots + Paperwhite icons render. Tab bar itself is behind the
  auth gate (booted to Create-account), so the glass bar + ink dot were not screenshot-
  verified — visible after sign-in.

## Notes
- components/ui/TabBar.tsx now unused (kept as fallback).
- Tradeoff accepted: NativeTabs tab icons are SF Symbols (required for the *system* glass
  bar); Paperwhite set stays everywhere else.
- To tweak the badge: `badgeBackgroundColor` (color) in _layout.tsx; switch dot→count by
  using `String(total)` instead of `''`. Badge prop changes Fast-Refresh; the native↔custom
  navigator swap does not.
