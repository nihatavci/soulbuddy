---
phase: quick
plan: 260830-llm
subsystem: push-notifications / expo-router deep-linking
tags: [push, deep-link, expo-router, auth-gate, retention]
dependency-graph:
  requires: []
  provides: [lib/pushDeepLink.ts]
  affects: [lib/push.ts, "app/(app)/_layout.tsx", "app/(app)/index.tsx"]
tech-stack:
  added: []
  patterns: [pure-extractor-module, module-level-single-consume-store, ref-backed-async-listener-closure]
key-files:
  created:
    - lib/pushDeepLink.ts
    - lib/pushDeepLink.test.ts
  modified:
    - lib/push.ts
    - "app/(app)/_layout.tsx"
    - "app/(app)/index.tsx"
decisions:
  - "Held the pending deep link in an in-memory module variable, not MMKV — a tap-to-open is always within one process lifetime, and persisting would risk resurrecting a stale link on a later app open."
  - "Used refs (navKeyRef/userIdRef) in app/(app)/_layout.tsx instead of adding rootState?.key/user?.id to the push-listener effect's dependency array, to avoid re-subscribing addNotificationResponseReceivedListener on every render while still reading live gate state when the async listener fires."
metrics:
  duration: "~40 minutes"
  completed: 2026-08-30
---

# Phase quick Plan 260830-llm: Notification tap deep-link not routing to private-space Summary

Fixed the cold-start gate-clobber race where AppGate's unconditional `router.replace` to the
tabs wiped a notification tap's `router.push` to private-space, by introducing a single-consume
pending deep-link handoff that AppGate replays only on the authenticated + onboarded branch.

## What Was Built

### Task 1 — Root-cause instrumentation + static trace confirmation

Added `__DEV__`-guarded `[push-dl]`-tagged logging (no behavior change) to:
- `lib/push.ts` `addPushResponseListener` — logs the raw `getLastNotificationResponseAsync()`
  payload and every `addNotificationResponseReceivedListener` fire.
- `app/(app)/_layout.tsx` — logs the handler's `spaceId` plus the nav-hydration key and resolved
  `userId` at the moment it decides whether to navigate or hold.
- `app/(app)/index.tsx` (AppGate) — logs the full gate state (navKey, authLoading,
  isAuthenticated, profileLoading, onboarded) and the target of every `router.replace`.

**Real-device capture was not performed by this agent** (see "Task 3 — Pending Human
Verification" below). Instead, the exact control flow was traced statically against the code
as-is, citing line numbers from the pre-fix state (commit 766994e):

1. `app/index.tsx` replaces to `/(app)` once `rootState.key` is set.
2. This mounts both `app/(app)/_layout.tsx` (`AppLayout`) and `app/(app)/index.tsx`
   (`AppGate`, the initial screen of the `(app)` group) at roughly the same time.
3. `AppLayout`'s push-listener effect (deps `[router]`, mount-once) immediately calls
   `Notifications.getLastNotificationResponseAsync()` — an async native-bridge round trip —
   and on resolution calls `router.push('/(app)/private-space', ...)` with **no check on
   auth/onboarding state or nav-hydration**.
4. `AppGate`'s effect (deps `[rootState?.key, authLoading, isAuthenticated, profileLoading,
   onboarded]`) waits on Supabase auth (`authLoading`) and the profile query
   (`profileLoading`) — both are async and can take longer than the native bridge call.
   Its terminal branch unconditionally calls `router.replace('/(app)/(tabs)')` once both
   resolve.
5. `router.replace()` in expo-router/react-navigation swaps whatever screen is currently
   **focused**, regardless of which component instance invoked it. So if step 3's push already
   landed private-space on top of the stack before step 4's auth/profile resolve, AppGate's
   replace directly overwrites it — **H1, gate-clobber race, confirmed by the code's own
   control flow**, matching the plan's primary hypothesis exactly.
6. A secondary, timing-dependent variant of the same defect (**H2**) is also supported: if the
   push's `getLastNotificationResponseAsync()` resolves and calls `router.push` while
   `rootState.key` is still unset (nav tree not yet hydrated) or before either navigator has
   settled, the push can silently no-op instead of clobbering — same root architectural cause
   (no coordination between the push handler and the gate), different observed symptom.
   The fix in Task 2 addresses both by making the push handler check nav-hydration and
   auth-resolution before deciding whether to navigate directly or hold.

No evidence in the code supports H3 (payload-shape bug — `extractSpaceId`, formerly the inline
`extract` closure, reads exactly the shape the push trigger (migration 011) sends and was
already correct) or H4 (listener never registers — the effect runs unconditionally on `(app)`
mount with no early-return besides the `!Notifications` native-module-absent guard).

**Verdict: H1 confirmed by static trace, with H2 as a secondary, timing-dependent variant of
the same root cause (no coordination between the push handler and AppGate). H3 and H4 refuted.**

### Task 2 — Pending deep-link handoff (TDD)

**RED (commit cf86418):** `lib/pushDeepLink.test.ts` — 13 tests covering `extractSpaceId`
(well-formed payload, `null`/`undefined`/`{}`/missing-`data` inputs, non-string coercion,
empty/whitespace rejection) and the pending-store's single-consume semantics (set→consume once,
a second consume returns `undefined`, `setPendingSpaceDeepLink(undefined)` is a no-op that does
not clear an existing pending id, `peek` does not consume). Confirmed failing
(`Cannot find module './pushDeepLink'`) before the module existed.

**GREEN (commit 6ce59c0):** `lib/pushDeepLink.ts` — pure module, no react-native/expo imports:
- `extractSpaceId(resp: unknown): string | undefined`
- `setPendingSpaceDeepLink(id?: string): void` — backed by a module-level variable (in-memory
  only, not MMKV)
- `consumePendingSpaceDeepLink(): string | undefined` — single-consume
- `peekPendingSpaceDeepLink(): string | undefined` — non-consuming read

All 13 tests pass.

**Rewiring (commit ddb305b):**
- `lib/push.ts` — `addPushResponseListener` now imports `extractSpaceId` from
  `lib/pushDeepLink` instead of the inline `extract` closure that used to live here.
- `app/(app)/_layout.tsx` — the push handler now reads `navKeyRef.current` / `userIdRef.current`
  (refs synced from `rootState?.key` / `user?.id` via small effects) instead of closing over
  stale values from the mount-time render. If the nav tree isn't hydrated (`navKeyRef.current ==
  null`) or the user hasn't cleared the auth gate (`userIdRef.current == null`), it calls
  `setPendingSpaceDeepLink(spaceId)` and returns instead of navigating. Otherwise it navigates
  directly exactly as before — preserving the working warm-tap path.
- `app/(app)/index.tsx` (AppGate) — the terminal branch now `router.replace('/(app)/(tabs)')`
  first (giving a real back target — satisfies the "back returns to tabs" truth), then calls
  `consumePendingSpaceDeepLink()` and, if a spaceId is present, `router.push` to private-space
  on top. This only happens on the authenticated + onboarded branch — the unauthenticated and
  not-onboarded branches return earlier and never touch the pending link, so it survives
  signup/onboarding and can never be consumed while the user is behind the gate.

Refs were used instead of adding `rootState?.key`/`user?.id` to the push-listener effect's
dependency array so the native listener subscription (`addNotificationResponseReceivedListener`)
is not torn down and re-registered on every render — it still reads live state via the refs when
it actually fires, however long after mount that is.

## Verification Performed

- `npx jest lib/pushDeepLink.test.ts --watchAll=false` — 13/13 pass.
- `npx jest --watchAll=false` (full suite) — 67/72 pass; the 2 failing suites
  (`__tests__/design-tokens.test.ts`, `__tests__/auth-flow-robustness.test.ts`) are pre-existing
  and unrelated (font-family platform mismatch; missing `@react-native-google-signin/google-signin`
  module in this environment) — **no new failures introduced**.
- `npm run typecheck` — clean.
- `npx eslint lib/push.ts lib/pushDeepLink.ts lib/pushDeepLink.test.ts app/(app)/_layout.tsx
  app/(app)/index.tsx` — 0 errors, 8 pre-existing-style warnings (`no-explicit-any`,
  `exhaustive-deps` on effects that predate this change).
- `grep -n "extractSpaceId" lib/push.ts lib/pushDeepLink.ts` — confirms the extractor is
  imported in `lib/push.ts`, not duplicated.
- `grep -rn "push-dl" lib app` — confirms the Task 1 instrumentation is still present (by
  design, for Task 3); it must be removed after human verification passes (see below).

## Task 3 — Pending Human Verification (NOT performed by this agent)

Task 3 is a `checkpoint:human-verify` gate requiring a real iOS/Android device (push does not
work in the simulator) and a human tapping actual notifications. This was not attempted by this
agent — it requires physical interaction with a device. **A human must perform the following
before this plan can be considered fully verified:**

1. **COLD START** — force-quit the app. From a second account, send a message in a shared
   private space. Tap the push notification.
   Expect: the app opens and lands on the private-space thread for that space, with the correct
   messages loaded.
2. **BACK BEHAVIOR** — from that thread, press back / swipe back.
   Expect: you land on the tabs (Signal Board), not a blank screen or an app exit.
3. **WARM BACKGROUND** — background the app (do not quit). Send another message. Tap the push.
   Expect: navigates to the same private-space thread.
4. **FOREGROUND** — keep the app open on the tabs. Send another message.
   Expect: no OS banner (by design), message appears live in the thread / unread dot shows.
5. **NO RE-FIRE** — force-quit and reopen the app by tapping the app icon (not a notification).
   Expect: you land on the tabs and are NOT pulled into private-space.
6. **GATE SAFETY** — sign out, force-quit, then tap an older notification from the tray.
   Expect: you land on the welcome/age-gate flow, never inside private-space.

Watch the `[push-dl]`-tagged console logs while running these steps — they trace the exact
ordering (handler fire time, nav key, resolved userId, gate replace targets) and will confirm or
refute the H1/H2 static-trace verdict above on real hardware.

**After all six steps pass:** strip the `[push-dl]` instrumentation added in the first commit of
this plan (`lib/push.ts`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`), re-run
`npm run typecheck && npm run lint`, and commit the cleanup as a follow-up.

**If any step fails:** report which step and paste the surrounding `[push-dl]` log lines so the
next agent can diagnose against the real trace instead of the static one.

## Deviations from Plan

None — plan executed as written for Tasks 1 and 2. Task 3 is, by design and by this agent's
explicit instructions, a pending human-verification checkpoint rather than something executable
by a coding agent.

## Known Stubs

None.

## Threat Flags

None — this plan's threat register (T-QDL-01/02/03/SC) was fully covered by the implementation:
- T-QDL-01 (elevation via deep link into private-space): mitigated — the push handler holds
  instead of navigating when `userIdRef.current` is `null`, and AppGate only consumes the
  pending link on the authenticated + onboarded branch.
- T-QDL-03 (malformed/oversized spaceId): mitigated — `extractSpaceId` rejects non-string,
  empty, and whitespace-only ids (covered by tests).
- T-QDL-SC (dependency legitimacy): no new dependencies were installed.
- T-QDL-02 (RLS enforcement on `messages`/`spaces`) is unchanged by this plan and remains the
  responsibility of the existing database policies — verified by checkpoint step 6, not by this
  code.

## Self-Check: PASSED

- `lib/pushDeepLink.ts` exists: FOUND
- `lib/pushDeepLink.test.ts` exists: FOUND
- Commit `766994e` (Task 1 instrumentation) exists: FOUND
- Commit `cf86418` (RED — failing pushDeepLink tests) exists: FOUND
- Commit `6ce59c0` (GREEN — pushDeepLink module) exists: FOUND
- Commit `ddb305b` (Task 2 rewiring) exists: FOUND
