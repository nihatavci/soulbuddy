---
slug: reveal-slowdown
date: 2026-07-15
project: re:sense
---

# Quick Task: Mutual Reveal + Slow-down (were UI shells) + safety consolidation

## Root cause (diagnosed)
Reveal, Slow-down, Report, and the header shield were all UI shells with NO backend
(their own file headers said "mocked"). Reveal did haptic+router.back; Slow-down did only
a haptic; Report and shield both opened the same mocked check-in.

## Build (per user: "build them for real now"; keep Report pill, drop shield)
DB migration 014 (applied + verified on qzaieykseghxufjfgsmf):
- `space_reveals(space_id,user_id,first_name,age_verified,created_at)`. RLS: see your own
  row always; see the OTHER's ONLY once you've revealed too — mutual gate via SECURITY
  DEFINER `i_have_revealed()` (anon-revoked) to avoid RLS self-recursion. Role-simulation
  PROVED it: A sees 0 rows before revealing, 2 after. No one-sided leak.
- `space_events(slow_down)` member-RLS. Both tables → realtime.
- Regenerated services/database.types.ts.

Hooks: `useReveal` (my/other state + realtime), `useRevealActions` (reveal/withdraw,
carries own age_verified), `useSpaceEvents` + `useSendSlowDown`.

UI:
- reveal.tsx: real insert; optional first-name input; 3 states — consent / "waiting for
  <alias>" (+ undo) / "you've both revealed" (shows their first name + verified 18+); toasts.
- private-space.tsx: removed header shield (right spacer keeps title centred); Report pill
  kept; Reveal pill reflects state (Reveal / Waiting… / Revealed); header shows real first
  name + "revealed" once mutual; Slow-down posts a real event + toast; slow-down nudges
  render as centered system notes woven into the message timeline by time.

## Verify
- get_advisors: no new issues (i_have_revealed is the accepted RLS-helper pattern).
- RLS role-sim: mutual gate proven.
- typecheck ✓; build on iOS 26.5. (Private space is auth-gated → not screenshot-verified.)
