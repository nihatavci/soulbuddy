---
slug: reveal-slowdown
date: 2026-07-15
status: complete
---

# Summary: Mutual Reveal + Slow-down built for real + safety consolidation

## Diagnosis
Reveal / Slow-down / Report / header-shield were UI shells with no backend (mocked).
That's why Reveal "didn't work", Slow-down gave no feedback, and Report duplicated the shield.

## Built
- **Migration 014** (applied + verified): `space_reveals` (mutual-gate RLS via SECURITY
  DEFINER `i_have_revealed()`, anon-revoked, no self-recursion) + `space_events` (slow_down),
  both realtime. Regenerated `services/database.types.ts`.
- **Security proof:** role-simulation — user A sees 0 reveal rows before revealing, 2 after.
  Identity is never disclosed one-sided. `get_advisors` clean (no new findings).
- **Hooks:** `useReveal` / `useRevealActions` (reveal carries own verified-18+; withdraw),
  `useSpaceEvents` / `useSendSlowDown`. All realtime.
- **reveal.tsx:** real reveal; optional first-name; 3 states (consent → waiting for <alias>
  with undo → both-revealed showing their first name + verified 18+); success/error toasts.
- **private-space.tsx:** removed the redundant header shield (kept Report pill); Reveal pill
  shows Reveal/Waiting…/Revealed; header shows the real first name + "revealed" once mutual;
  Slow-down posts a real event + toast + renders as a centered "asked to slow down" note
  woven into the message timeline by time.
- Feedback added on every safety action (toasts).

## Verification
- RLS mutual gate proven (role-sim). typecheck ✓. Build exit 0 + installed/launched on
  iPhone 17 / iOS 26.5. Private space is auth-gated, so the screens weren't screenshot-
  verified headlessly — visible after sign-in with two accounts in a space.

## Deferred
- check-in.tsx "Submit report" / block are still mocked (report persistence is a separate
  backend piece). Reveal/slow-down — the parts the user called out — are now real.
