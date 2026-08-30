/**
 * Derive the honest post-reply state to show the user, from the values
 * useAddReply() already resolves with — no new query, no schema change.
 *
 * - 'resonance': a private space with a real id came back — mutual resonance
 *   unlocked. The caller routes to the existing, unchanged resonance-unlock
 *   screen for this case.
 * - 'pending': no space id is available. This covers BOTH the true "no
 *   mutual resonance yet" case (space is null because the other person
 *   hasn't added back) AND the "space read-back failed" case (space is
 *   undefined/null because the post-insert read failed, per the comment in
 *   useAddReply). useAddReply's mutateAsync return value does not currently
 *   distinguish these two causes — both surface as a missing space id. This
 *   is still an honest status either way: the user has no unlocked space to
 *   show, and their addition really was sent. Distinguishing "not yet mutual"
 *   from "read-back failed" would require a change to useAddReply's return
 *   shape, which is out of this helper's file boundary.
 */
export type ReplyOutcome = 'resonance' | 'pending';

interface SpaceLike {
  id?: string | null;
}

export function describeReplyOutcome(space: SpaceLike | null | undefined): ReplyOutcome {
  return space?.id ? 'resonance' : 'pending';
}
