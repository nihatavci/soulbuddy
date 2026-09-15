/**
 * spaceUnread — pure derivation core for the Private-tab unread badge.
 *
 * Extracted out of context/UnreadContext.tsx (FEAT-3 step 1) so this logic is
 * directly unit-testable in isolation, mirroring context/signalUnread.ts's own
 * stated rationale (":4-8" — kept separable from the Provider/hook/realtime
 * wiring precisely so the pure predicate can carry its own coverage floor).
 *
 * FEAT-3 step 3 extension: a space with NO messages yet also counts as unread
 * for the signal author (user_a) the instant it opens — today that person is
 * told nothing by the reply that created it. The creator (user_b) is never
 * notified about a space they just opened themselves.
 */

export interface UnreadSpaceLike {
  id?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  user_a?: string | null;
  user_b?: string | null;
}

/**
 * A space counts as unread when:
 *  - it has a message, the last one is from the OTHER person, and it is newer
 *    than my stored last-read time for this space (pre-existing behaviour,
 *    including the BUG-4 sender guard — see context/UnreadContext.tsx's
 *    original header for the race this closes); OR
 *  - it has NO message yet, I am the signal author (user_a) — i.e. NOT the
 *    person whose reply just opened it — and I have never opened it before.
 *
 * Never unread for a null/missing space id.
 */
export function isSpaceUnread(
  space: UnreadSpaceLike,
  lastRead: Record<string, string>,
  myUserId: string,
): boolean {
  if (!space.id) return false;
  const read = lastRead[space.id];

  if (!space.last_message_at) {
    // Message-less: the only person who can be "unread" is the signal author
    // (user_a), who did not act and was never told. The creator (user_b) acted
    // moments ago and needs no badge for their own action.
    if (read) return false;
    return space.user_a === myUserId;
  }

  if (space.last_message_sender_id === myUserId) return false; // BUG-4 guard
  return !read || new Date(space.last_message_at).getTime() > new Date(read).getTime();
}

/** True if any space has an unread message from the other person, or a
 * freshly-opened message-less space I (as user_a) have never seen. */
export function hasUnread(
  spaces: UnreadSpaceLike[],
  lastRead: Record<string, string>,
  myUserId: string,
): boolean {
  return spaces.some((s) => isSpaceUnread(s, lastRead, myUserId));
}
