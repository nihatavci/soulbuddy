/**
 * Reveal tap-transition table (FEAT-4).
 *
 * Pure module — zero React Native, zero Supabase, zero i18n imports. Follows
 * the existing co-located convention (lib/replyOutcome.ts, lib/freshStart.ts,
 * lib/alias.ts).
 *
 * `space_events` posts a visible "reveal" notice when someone chooses to
 * reveal. Tapping that notice must resolve to exactly one of four outcomes,
 * depending on three independent booleans:
 *
 *  - `iRevealed`     — the CURRENT VIEWER's own reveal row exists (reliable —
 *    always visible via RLS, see hooks/useReveal.ts `mine`).
 *  - `theyRevealed`  — the OTHER member has revealed, from the viewer's
 *    honest point of view (either RLS-confirmed mutual visibility, OR the
 *    bare fact of a `kind='reveal'` event authored by the other member —
 *    see the mandated derivation note on the caller side, private-space-timeline.ts).
 *  - `tapperIsActor` — whether the notice that was TAPPED was authored by the
 *    current viewer (`tappedEvent.actor_id === myUserId`).
 *
 * CRITICAL: `theyRevealed` must NOT be wired to `bothRevealed` alone. Because
 * `bothRevealed` (hooks/useReveal.ts) is `!!other`, and RLS only exposes the
 * other member's row once BOTH have revealed, `bothRevealed` is always false
 * while `iRevealed` is false — even when the other person really has
 * revealed. Doing that would make cell 3 below (the entire point of the
 * feature) permanently unreachable. See the caller-side derivation and its
 * anti-regression test in __tests__/private-space-timeline.test.ts.
 */

export type RevealTapOutcome = 'prompt-reciprocal' | 'already-mutual' | 'passive-confirm' | 'noop';

export interface RevealTapOutcomeParams {
  /** The current viewer's own reveal row exists. */
  iRevealed: boolean;
  /** The other member has revealed, from the viewer's honest point of view. */
  theyRevealed: boolean;
  /** Whether the tapped notice's actor is the current viewer. */
  tapperIsActor: boolean;
}

/**
 * All eight cells, frozen (FEAT-4-G1-PLAN.md §5.2):
 *
 * | iRevealed | theyRevealed | tapperIsActor | outcome            |
 * |-----------|--------------|----------------|--------------------|
 * | false     | false        | false          | noop               | <- defensive-unreachable, see note
 * | false     | false        | true           | noop               |
 * | false     | true         | false          | prompt-reciprocal  | <- the feature
 * | false     | true         | true           | noop               |
 * | true      | false        | false          | noop               | <- defensive-unreachable, see note
 * | true      | false        | true           | passive-confirm    |
 * | true      | true         | false          | already-mutual     |
 * | true      | true         | true           | already-mutual     |
 *
 * DEFENSIVE-UNREACHABLE NOTE (cells 1 and 5, both the
 * `theyRevealed=false && tapperIsActor=false` combination — G5 F2
 * corollary): this function's only caller today, `buildTimeline`
 * (`app/(app)/private-space-timeline.ts`), invokes it once per EXISTING
 * reveal event, with `tapperIsActor = event.actor_id === myUserId`. When
 * `tapperIsActor` is false for that call, the tapped event was authored by
 * the OTHER member — and that exact event is also a member of the `events`
 * array `theyRevealed` is derived from
 * (`revealEvents.some((e) => e.actor_id !== myUserId)`), which forces
 * `theyRevealed` true in that same call. So `theyRevealed=false &&
 * tapperIsActor=false` cannot occur through the caller that exists in this
 * app today — these two cells are unreachable in production.
 *
 * They are kept anyway (not deleted, not skipped) because this is a
 * general-purpose pure function over three independent booleans, not a
 * function typed to its one caller's reachable subset; deleting the cells
 * would leave the 2x2x2 input domain partially unspecified for any future
 * caller. `noop` is also the safe default for an input combination that
 * "shouldn't happen," matching every other undecided cell.
 *
 * Do NOT read either cell as describing a real withdrawal path — the
 * previous comments here ("their notice, but they withdrew" / "their stale
 * notice; I already revealed") were wrong about WHY these cells are
 * unreachable, and wrong in a privacy-relevant direction: `space_events`
 * rows are never deleted (no DELETE policy; FORK-4 Q3(i) — immutable
 * past-tense history), while `hooks/useReveal.ts`'s `withdraw` deletes only
 * `space_reveals`. So a withdrawal can NEVER flip a `theyRevealed` that was
 * already true (via an existing event) back to false — the two are
 * independent tables. The corrected reason these cells are unreachable is
 * purely structural (above), not because withdrawal makes them impossible.
 */
export function revealTapOutcome({
  iRevealed,
  theyRevealed,
  tapperIsActor,
}: RevealTapOutcomeParams): RevealTapOutcome {
  if (iRevealed && theyRevealed) return 'already-mutual';
  if (!iRevealed && theyRevealed && !tapperIsActor) return 'prompt-reciprocal';
  if (iRevealed && !theyRevealed && tapperIsActor) return 'passive-confirm';
  return 'noop';
}
