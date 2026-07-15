---
slug: nativetabs-glass
date: 2026-07-15
project: re:sense
---

# Quick Task: Restore NativeTabs liquid-glass tab bar (blog approach)

## Why it was "not there"
The blog approach (expo-router NativeTabs = real system liquid glass) was implemented
in commit 2b9fb8a, then reverted in 7a0fcda/333ab87 back to a custom `<TabBar>` that
only fakes glass via GlassView/BlurView. So the running app had the custom bar. Also:
a native↔custom navigator swap does NOT hot-reload, and glass only renders on iOS 26+.

## Change
Replace `app/(app)/(tabs)/_layout.tsx` with the NativeTabs version (restored from 2b9fb8a):
`NativeTabs` from `expo-router/unstable-native-tabs`, SF Symbol icons, Signal-Yellow
`tintColor`, `useUnread` badge on Private. Custom `components/ui/TabBar.tsx` becomes
unused (left in place as an easy fallback; not deleted).

Tradeoff: NativeTabs icons are SF Symbols (that's what makes it the *system* glass bar).
The Paperwhite set stays everywhere else in the app.

## Verify
- `npm run typecheck` passes.
- Env supports glass: Xcode 26.6 + iPhone 17 sim on iOS 26.5 (confirmed).
- Native build (`expo run:ios`) to confirm NativeTabs compiles/boots; screenshot if the
  session reaches the authenticated tabs.
