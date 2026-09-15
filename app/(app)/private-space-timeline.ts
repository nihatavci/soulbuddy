/**
 * buildTimeline — pure reducer for the private-space thread (FEAT-4).
 *
 * Extracted from the `React.useMemo` body in `private-space.tsx` (the
 * original region was `:306-320`; the union it produced carried no
 * event-kind field). Weaves messages, "slow down" pace nudges, and reveal
 * notices into one time-ordered timeline.
 *
 * One-way dependency only: this module imports from `lib/revealTransition`;
 * `private-space.tsx` imports THIS module. This module must never import
 * from `private-space.tsx`.
 *
 * §5.1 mandated `theyRevealed` derivation (the trap this file exists to
 * avoid): `bothRevealed` alone (hooks/useReveal.ts) is always false while
 * the viewer hasn't revealed — even when the other person really has — so
 * wiring `theyRevealed = bothRevealed` would make the reveal notice's tap
 * outcome a silent no-op. The correct derivation is:
 *
 *   theyRevealed = bothRevealed || events.some(
 *     (e) => e.kind === 'reveal' && e.actor_id !== myUserId
 *   )
 *
 * The `bothRevealed ||` term covers legacy mutual pairs (§5.4) where no
 * `kind='reveal'` event exists at all (both people revealed before
 * migration 023 shipped).
 *
 * §5.5 dedupe rule: `useRevealActions.reveal` is an upsert, so a double-tap
 * or a withdraw-then-re-reveal can insert a second `kind='reveal'` event for
 * the same actor. There is no unique index on `space_events` (adding one
 * would be another migration). Reveal events are collapsed to at most one
 * per `actor_id`, keeping the EARLIEST `created_at` — a stable, past-tense
 * fact must never jump forward when a later duplicate arrives.
 */
import { revealTapOutcome, type RevealTapOutcome } from '@/lib/revealTransition';
import type { Message } from '@/services/supabase';

/** Minimal shape `space_events` rows satisfy — kept structural for testability. */
export interface SpaceEventLike {
  id: string;
  space_id: string;
  actor_id: string;
  kind: string;
  created_at: string;
}

export interface TimelineMessageItem {
  kind: 'msg';
  at: string;
  msg: Message;
}

export interface TimelineSlowDownItem {
  kind: 'event';
  eventKind: 'slow_down';
  at: string;
  id: string;
  mine: boolean;
}

export interface TimelineRevealItem {
  kind: 'event';
  eventKind: 'reveal';
  at: string;
  id: string;
  mine: boolean;
  outcome: RevealTapOutcome;
}

export type TimelineEventItem = TimelineSlowDownItem | TimelineRevealItem;
export type TimelineItem = TimelineMessageItem | TimelineEventItem;

export interface BuildTimelineParams {
  messages: Message[];
  events: SpaceEventLike[];
  myUserId: string | undefined;
  /** ids hidden locally via lib/localMessageHide.ts — never touches the server copy. */
  locallyHiddenIds: Set<string>;
  /** The current viewer's own reveal row exists (hooks/useReveal.ts `iRevealed`). */
  iRevealed: boolean;
  /** RLS-confirmed mutual reveal visibility (hooks/useReveal.ts `bothRevealed`). */
  bothRevealed: boolean;
}

/** Collapse reveal events to at most one per actor_id, keeping the earliest. */
function dedupeRevealEvents(events: SpaceEventLike[]): SpaceEventLike[] {
  const earliestByActor = new Map<string, SpaceEventLike>();
  for (const e of events) {
    const existing = earliestByActor.get(e.actor_id);
    if (!existing || e.created_at < existing.created_at) {
      earliestByActor.set(e.actor_id, e);
    }
  }
  return [...earliestByActor.values()];
}

export function buildTimeline({
  messages,
  events,
  myUserId,
  locallyHiddenIds,
  iRevealed,
  bothRevealed,
}: BuildTimelineParams): TimelineItem[] {
  const msgItems: TimelineItem[] = messages
    .filter((m) => !locallyHiddenIds.has(m.id))
    .map((m) => ({ kind: 'msg' as const, at: m.created_at, msg: m }));

  const slowDownItems: TimelineItem[] = events
    .filter((e) => e.kind === 'slow_down')
    .map((e) => ({
      kind: 'event' as const,
      eventKind: 'slow_down' as const,
      at: e.created_at,
      id: e.id,
      mine: e.actor_id === myUserId,
    }));

  const revealEvents = dedupeRevealEvents(events.filter((e) => e.kind === 'reveal'));
  // §5.1 — the honest, pre-reciprocation source of `theyRevealed` is the
  // event itself, not `bothRevealed` alone. See module doc above.
  const theyRevealed = bothRevealed || revealEvents.some((e) => e.actor_id !== myUserId);

  const revealItems: TimelineItem[] = revealEvents.map((e) => {
    const mine = e.actor_id === myUserId;
    const outcome = revealTapOutcome({ iRevealed, theyRevealed, tapperIsActor: mine });
    return {
      kind: 'event' as const,
      eventKind: 'reveal' as const,
      at: e.created_at,
      id: e.id,
      mine,
      outcome,
    };
  });

  const items = [...msgItems, ...slowDownItems, ...revealItems];
  items.sort((a, b) => a.at.localeCompare(b.at));
  return items;
}
