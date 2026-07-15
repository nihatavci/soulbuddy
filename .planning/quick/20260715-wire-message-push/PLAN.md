---
slug: wire-message-push
date: 2026-07-15
project: re:sense
---

# Quick Task: Wire up live message push notifications

Make message push actually deliverable and WhatsApp-like, per product decisions:
alias-only content, presence badge (1/0), no foreground banner.

## The blocker
`expo-notifications` is not in `app.json` plugins, so `registerPushToken()` no-ops →
`push_tokens` never fills → the DB trigger has nothing to send to.

## Changes

**Client**
1. `app.json` — add `"expo-notifications"` to plugins (bare form; enables iOS
   aps-environment entitlement + Android setup on prebuild).
2. `lib/push.ts` — add:
   - `configureNotifications()` → `setNotificationHandler` returning
     `shouldShowBanner:false, shouldShowList:false, shouldPlaySound:false,
     shouldSetBadge:true` (suppress foreground banner; keep badge).
   - `setAppBadge(count)` → `setBadgeCountAsync` (null-guarded).
   - `addPushResponseListener(handler)` + initial `getLastNotificationResponseAsync`
     → extract `data.spaceId` for deep-linking.
3. `context/UnreadContext.tsx` — presence badge: derive hasUnread from spaces +
   lastRead, effect → `setAppBadge(hasUnread ? 1 : 0)`.
4. `app/(app)/_layout.tsx` — call `configureNotifications()` once; wire
   `addPushResponseListener` + last-response to
   `router.push({ pathname: '/(app)/private-space', params: { spaceId } })`.
5. `hooks/useMessages.ts` — stable ordering: secondary `.order('id')` in fetch, and
   sort `upsertMessage` by `(created_at, id)` so a realtime insert can't land out of order.

**DB (migration 013)**
6. `notify_message_push()` — look up sender alias, send
   `body = 'New message from ' || alias`, add `'badge', 1`; keep `data.spaceId`.

## Out of scope (user action)
- `npx expo prebuild` + native rebuild (EAS/dev-client) — required before push works.
- OneSignal — left as-is (deferred per build-1 decision).

## Verification
- `npm run typecheck` passes.
- DB: recreate trigger, confirm it fires (advisor still clean; function grants preserved).
- Manual (post-rebuild, user): send message from device A → device B gets
  "New message from <alias>" + icon badge; tapping opens the thread; foreground = no banner.
