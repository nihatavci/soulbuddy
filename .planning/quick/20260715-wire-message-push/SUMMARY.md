---
slug: wire-message-push
date: 2026-07-15
status: complete
---

# Summary: Wire up live message push notifications

## Changes
- `app.json`: added `expo-notifications` to plugins (unblocks token registration on
  the next native build).
- `lib/push.ts`: `configureNotifications()` (foreground handler — no banner, badge on),
  `setAppBadge()`, `addPushResponseListener()` (tap + cold-start deep link via `data.spaceId`).
- `context/UnreadContext.tsx`: presence badge — effect sets app icon badge to 1 when any
  space is unread, 0 otherwise; clears on sign-out.
- `app/(app)/_layout.tsx`: calls `configureNotifications()` once and routes notification
  taps to `/(app)/private-space`.
- `hooks/useMessages.ts`: stable `(created_at, id)` ordering in fetch + realtime upsert.
- DB migration 013: `notify_message_push()` now sends "New message from <alias>" + `badge:1`;
  RPC lock-down re-asserted.

## Product decisions applied
Alias-only push content · presence badge (1/0) · no foreground banner.

## Verification
- `npm run typecheck` passes.
- DB: trigger recreated on remote; `has_function_privilege` confirms anon/authenticated
  still cannot execute it (lock-down preserved across CREATE OR REPLACE).

## REQUIRED user action (not in this task)
Push does NOT work until the app is rebuilt natively:
`npx expo prebuild` then an EAS/dev-client build. Expo Go and OTA updates cannot add the
`expo-notifications` native module. iOS also needs the APNs key configured for the EAS project.
Test after rebuild: message from device A → device B gets alias push + icon badge; tap opens
the thread; foreground shows no banner.
