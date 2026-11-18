---
phase: quick
plan: 260830-llm
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/push.ts
  - lib/pushDeepLink.ts
  - lib/pushDeepLink.test.ts
  - app/(app)/_layout.tsx
  - app/(app)/index.tsx
autonomous: false
requirements: [QUICK-260830-DEEPLINK]

must_haves:
  truths:
    - "Tapping a message push notification while the app is fully closed (cold start) opens the app and lands on the private-space thread for that spaceId"
    - "Tapping a message push notification while the app is backgrounded (warm) navigates to the private-space thread for that spaceId"
    - "After arriving via a notification tap, pressing back returns to the tabs, not to a blank/dead stack"
    - "An unauthenticated or not-yet-onboarded user who taps a notification is NOT dropped into private-space; the deep link is held until the gate resolves them into (app)"
    - "A consumed deep link does not re-fire on subsequent app opens"
  artifacts:
    - path: "lib/pushDeepLink.ts"
      provides: "Pure spaceId extraction + pending deep-link handoff store (set/consume/peek)"
      exports: ["extractSpaceId", "setPendingSpaceDeepLink", "consumePendingSpaceDeepLink"]
    - path: "lib/pushDeepLink.test.ts"
      provides: "Unit coverage for payload extraction across cold-start/warm/malformed shapes and single-consume semantics"
    - path: "app/(app)/index.tsx"
      provides: "AppGate consumes the pending deep link after resolving auth+onboarding instead of unconditionally replacing to (tabs)"
  key_links:
    - from: "lib/push.ts"
      to: "lib/pushDeepLink.ts"
      via: "extractSpaceId used by both getLastNotificationResponseAsync and addNotificationResponseReceivedListener"
      pattern: "extractSpaceId"
    - from: "app/(app)/_layout.tsx"
      to: "lib/pushDeepLink.ts"
      via: "listener stores pending spaceId when nav is not ready, navigates directly when it is"
      pattern: "PendingSpaceDeepLink"
    - from: "app/(app)/index.tsx"
      to: "/(app)/private-space"
      via: "router.replace to tabs then router.push private-space with spaceId param"
      pattern: "private-space"
---

<objective>
Notification taps open the app but never land on the private-space thread. Find the actual
root cause on a real build, then fix the cold-start deep-link handoff so a tapped message
notification reliably opens the correct private space.

Purpose: the push → thread arc is the retention spine of re:sense. A push that opens a
dead default screen makes every notification feel like noise.
Output: a testable pure extractor + pending deep-link handoff, wired through the existing
expo-router gate — no new navigation or deep-link libraries.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

@lib/push.ts
@app/(app)/_layout.tsx
@app/(app)/index.tsx
@app/_layout.tsx
@app/(app)/private-space.tsx
@supabase/migrations/011_resense_message_push_tokens.sql
</context>

<interfaces>
<!-- Current shape, already extracted. Do not re-explore the codebase for these. -->

lib/push.ts (current):
  export function addPushResponseListener(handler: (spaceId: string) => void): () => void
  — private `extract(resp)` reads `resp?.notification?.request?.content?.data?.spaceId`
  — calls `getLastNotificationResponseAsync?.().then(...)` for cold start
  — also registers `addNotificationResponseReceivedListener`

app/(app)/_layout.tsx (current consumer):
  useEffect(() => {
    configureNotifications();
    const unsubscribe = addPushResponseListener((spaceId) => {
      router.push({ pathname: '/(app)/private-space', params: { spaceId } } as any);
    });
    return unsubscribe;
  }, [router]);

app/(app)/index.tsx (AppGate) — runs navigation in an effect gated on
`useRootNavigationState().key`, and its terminal branch is an unconditional
`router.replace('/(app)/(tabs)')`.

app/_layout.tsx — the whole app tree (including the (app) group) only mounts once
`fontsLoaded && attReady`; an AnimatedSplash covers it until then.

app/(app)/private-space.tsx — reads `spaceId` from `useLocalSearchParams`.

Push payload from migration 011: `data: { spaceId: <uuid> }`.
</interfaces>

<primary_hypothesis>
Planner's pre-read of the code points at a gate-clobber race, not a payload-shape bug:

1. On cold start the (app) tree mounts late (after fonts + ATT).
2. `AppLayout`'s effect resolves `getLastNotificationResponseAsync()` and fires
   `router.push('/(app)/private-space')`.
3. `AppGate` ((app)/index.tsx) is the initial route and its effect then fires
   `router.replace('/(app)/(tabs)')` once auth + profile settle — which **replaces the
   current top route**, wiping the just-pushed private-space (or the push lands before the
   nav tree is hydrated and silently no-ops).

Secondary defects visible in the same code path:
- The handler can fire for an unauthenticated / not-onboarded user, pushing private-space
  behind the gate.
- `getLastNotificationResponseAsync()` returns the same stale response on later launches,
  so the deep link can re-fire.

Task 1 must CONFIRM or REFUTE this on a real build before Task 2 is written to code.
If instrumentation refutes it (e.g. `data` arrives empty on cold start), fix what the logs
actually show and record the divergence in the SUMMARY.
</primary_hypothesis>

<tasks>

<task type="auto">
  <name>Task 1: Instrument and confirm root cause of the cold-start deep-link loss</name>
  <files>lib/push.ts, app/(app)/_layout.tsx, app/(app)/index.tsx</files>
  <action>
Add temporary `__DEV__`-guarded instrumentation (do NOT change behavior yet) to trace the
exact ordering on a real device:
- In `lib/push.ts` `addPushResponseListener`: log the full raw response object returned by
  `getLastNotificationResponseAsync()` (JSON-stringified, including `notification.request.content.data`
  and the trigger payload), and log separately when the warm `addNotificationResponseReceivedListener`
  fires. Tag logs `[push-dl]` with a monotonic timestamp so ordering is unambiguous.
- In `app/(app)/_layout.tsx`: log `[push-dl] handler spaceId=<id>` immediately before the
  `router.push`, plus the current `useRootNavigationState()?.key` value at that moment.
- In `app/(app)/index.tsx` (AppGate): log `[push-dl] gate replace -> <target>` immediately
  before each `router.replace`, and log the gate's `authLoading` / `profileLoading` /
  `onboarded` values.

Then run the app on a real device (dev client or TestFlight-equivalent local build — push
requires a real device, the simulator cannot receive Expo pushes) and capture three traces:
  (a) cold start: force-quit the app, send a message from the other account, tap the push
  (b) warm background: background the app, tap the push
  (c) foreground: app open, message arrives (should produce no banner per configureNotifications)

Determine from the timestamps which of these is true:
  H1 — the handler fires with a valid spaceId but AppGate's `router.replace` runs afterwards
       and clobbers it (confirms primary hypothesis)
  H2 — the handler fires before the nav tree is hydrated (`rootState.key` undefined) and the
       push silently no-ops
  H3 — `spaceId` is missing/undefined in the cold-start payload only (payload-shape bug)
  H4 — the listener never fires at all on cold start (registration timing / module absent)

Record the confirmed cause (one or more of H1–H4) plus the raw cold-start payload in the
SUMMARY. Leave the instrumentation in place for Task 3 verification; strip it at the end of
Task 3.
  </action>
  <verify>
    <automated>npm run typecheck &amp;&amp; npm run lint</automated>
  </verify>
  <done>Instrumentation lands, typecheck+lint pass, and a real-device trace for cold start, warm background, and foreground is captured with an explicit H1–H4 verdict written down before any fix is coded.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Pending deep-link handoff — pure extractor + gate-aware navigation</name>
  <files>lib/pushDeepLink.ts, lib/pushDeepLink.test.ts, lib/push.ts, app/(app)/_layout.tsx, app/(app)/index.tsx</files>
  <behavior>
lib/pushDeepLink.test.ts (write first, must fail before implementation):
- `extractSpaceId` returns the id for a well-formed response
  (`{ notification: { request: { content: { data: { spaceId: 'abc' } } } } }`)
- `extractSpaceId` returns undefined for `null`, `undefined`, `{}`, and a response whose
  `data` is `{}` or missing
- `extractSpaceId` coerces a non-string id to a string and rejects empty string / whitespace
- `setPendingSpaceDeepLink('abc')` then `consumePendingSpaceDeepLink()` returns `'abc'`
- a second `consumePendingSpaceDeepLink()` returns undefined (single-consume — the link must
  not re-fire on a later gate pass or a later app open)
- `setPendingSpaceDeepLink(undefined)` is a no-op and does not clear an existing pending id
  </behavior>
  <action>
Create `lib/pushDeepLink.ts` with no react-native / expo imports (pure module, unit-testable):
`extractSpaceId(resp: unknown): string | undefined`, `setPendingSpaceDeepLink(id?: string): void`,
`consumePendingSpaceDeepLink(): string | undefined`, `peekPendingSpaceDeepLink(): string | undefined`.
Back the pending value with a module-level variable (in-memory only — a tap-to-open is always
within one process lifetime; do not persist to MMKV, which would resurrect stale links).

Refactor `lib/push.ts` `addPushResponseListener` to import `extractSpaceId` from the new module
(delete the inline `extract` closure). Keep the existing defensive dynamic-require no-op
behavior and the `() => {}` unsubscribe fallback exactly as-is.

Rewire `app/(app)/_layout.tsx`: in the `addPushResponseListener` handler, read
`useRootNavigationState()?.key`. If the nav tree is not hydrated OR the user is not yet
resolved past the gate (no `user?.id`), call `setPendingSpaceDeepLink(spaceId)` and return —
do not navigate. If nav is hydrated and the user is present, navigate directly
(`router.push({ pathname: '/(app)/private-space', params: { spaceId } })`) — this preserves
today's working warm-tap path.

Rewire `app/(app)/index.tsx` (AppGate) terminal branch: instead of an unconditional
`router.replace('/(app)/(tabs)')`, always `router.replace('/(app)/(tabs)')` first, then read
`consumePendingSpaceDeepLink()` and, if present, `router.push({ pathname: '/(app)/private-space',
params: { spaceId } })`. Replacing to tabs before pushing gives a real back target, satisfying
the "back returns to tabs" truth. Consume only on the authenticated + onboarded branch; the
unauthenticated and not-onboarded branches must leave the pending link untouched so it survives
signup/onboarding, and must never navigate to private-space themselves.

This is a routing-order fix inside the existing expo-router gate. Do NOT add a deep-link
library, do not convert the gate back to a render-phase `<Redirect>` (see the comments in both
files explaining the "Maximum update depth exceeded" bug that pattern caused), and do not
introduce a navigation-ready polling loop.

If Task 1 confirmed H3 or H4 instead of H1/H2, still land the pure module and its tests, and
additionally fix the payload/registration defect the trace identified (e.g. broaden
`extractSpaceId` to also read the alternate cold-start payload path observed, or hoist listener
registration earlier) — with a test case covering the exact raw payload captured in Task 1.
  </action>
  <verify>
    <automated>npx jest lib/pushDeepLink.test.ts --watchAll=false &amp;&amp; npm run typecheck &amp;&amp; npm run lint</automated>
  </verify>
  <done>`lib/pushDeepLink.test.ts` passes (and failed before the implementation existed), typecheck and lint are clean, `lib/push.ts` no longer contains an inline `extract` closure, and AppGate consumes the pending link only on the authenticated+onboarded branch.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
A pure `extractSpaceId` + single-consume pending deep-link store, wired so a notification tap
that arrives before the navigator/gate is ready is held and then replayed by AppGate after it
lands the user on the tabs. Unit tests cover extraction and consume semantics; the ordering fix
itself can only be proven on a real device.
  </what-built>
  <how-to-verify>
Install the new build on a real device (push does not work in the simulator) and, with the
`[push-dl]` logs still attached:

1. COLD START — force-quit the app. From the second account, send a message in a shared private
   space. Tap the push notification.
   Expect: the app opens and lands on the private-space thread for that space, with the correct
   messages loaded.
2. BACK BEHAVIOR — from that thread, press back / swipe back.
   Expect: you land on the tabs (Signal Board), not a blank screen or an app exit.
3. WARM BACKGROUND — background the app (do not quit). Send another message. Tap the push.
   Expect: navigates to the same private-space thread.
4. FOREGROUND — keep the app open on the tabs. Send another message.
   Expect: no OS banner (by design), message appears live in the thread / unread dot shows.
5. NO RE-FIRE — force-quit and reopen the app by tapping the app icon (not a notification).
   Expect: you land on the tabs and are NOT pulled into private-space.
6. GATE SAFETY — sign out, force-quit, then tap an older notification from the tray.
   Expect: you land on the welcome/age-gate flow, never inside private-space.

Report which steps passed. If all pass, strip the `[push-dl]` instrumentation added in Task 1,
re-run `npm run typecheck && npm run lint`, and commit the cleanup.
  </how-to-verify>
  <resume-signal>Type "approved" (all six steps pass), or describe which step failed and paste the `[push-dl]` log lines around the failure</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Expo push service → client | `data.spaceId` is attacker-influenceable in principle (a crafted push to a known token); it is a navigation parameter, not an authorization token |
| Deep link → private-space screen | Navigation must never bypass the auth / onboarding gate |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-QDL-01 | Elevation of Privilege | deep link into `/(app)/private-space` | mitigate | AppGate consumes the pending link only on the authenticated + onboarded branch; the layout handler holds instead of navigating when `user?.id` is absent |
| T-QDL-02 | Information Disclosure | `messages` read for an arbitrary `spaceId` | transfer | Row-level security on `messages` / `spaces` is the enforcement point — a non-member reaching the route sees an empty thread, not another pair's messages. Verified by step 6 of the checkpoint. |
| T-QDL-03 | Tampering | malformed / oversized `data.spaceId` | mitigate | `extractSpaceId` returns undefined for non-string, empty, and whitespace ids; no navigation on undefined |
| T-QDL-SC | Tampering | npm/pip/cargo installs | mitigate | No new dependencies are installed by this plan; if one becomes necessary, stop and add a blocking legitimacy checkpoint |
</threat_model>

<verification>
- `npx jest lib/pushDeepLink.test.ts --watchAll=false` passes
- `npm test` shows no new failures
- `npm run typecheck` and `npm run lint` clean
- `grep -n "extractSpaceId" lib/push.ts lib/pushDeepLink.ts` shows the shared extractor is imported, not duplicated
- Real-device: all six checkpoint steps pass
- `grep -rn "push-dl" lib app | grep -v '^#'` returns nothing after the Task 3 cleanup
</verification>

<success_criteria>
- Root cause is written down with a real-device trace, not inferred
- A cold-start notification tap lands on the correct private-space thread
- Back from that thread returns to the tabs
- Warm background taps still work (no regression)
- A pending deep link fires at most once and never bypasses the auth/onboarding gate
- No new navigation or deep-link dependency added
</success_criteria>

<output>
Create `.planning/quick/260830-llm-notification-tap-deeplink-not-routing-to/260830-llm-SUMMARY.md` when done,
including the confirmed H1–H4 verdict and the raw cold-start payload captured in Task 1.
</output>
</content>
</invoke>
