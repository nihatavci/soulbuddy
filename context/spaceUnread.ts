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
 *
 * F-6 fix: that extension has no lower time bound, so on the build that
 * introduces it, every pre-existing, never-opened, message-less space would
 * light up at once. `unreadEpoch` — a one-time local watermark set on first
 * launch of a build containing this feature (persisted by the provider layer,
 * see context/UnreadContext.tsx; this module stays pure and never reads
 * storage itself) — suppresses only spaces that predate it. A space created
 * at or after the epoch is completely unaffected: that is the feature and it
 * must keep working for every future space.
 *
 * F1 repair: `created_at` is stamped by Postgres (`timestamptz default now()`,
 * the SERVER clock); `unreadEpoch` is stamped from `Date.now()` on the DEVICE
 * (context/UnreadContext.tsx). Those are not the same clock. A device whose
 * clock runs even slightly ahead of the server pushes the epoch ahead of the
 * server's real "now", which would silently suppress a space that is in fact
 * brand new — the exact inverse of this feature's purpose. `CLOCK_SKEW_MARGIN_MS`
 * below exists to absorb that skew. The watermark MUST FAIL OPEN: showing the
 * dot for a space slightly older than the intended cutoff is harmless (worst
 * case, one stray dot on an old space); silently swallowing a genuinely new
 * space is the failure this feature exists to prevent. F-6's real target
 * population — spaces pre-existing at the moment this feature ships — is
 * days-to-weeks old at that point, so a 24h margin still suppresses
 * everything F-6 cares about while making any realistic clock skew harmless.
 * Production currently has zero message-less spaces, so widening this window
 * costs nothing today.
 */

/** See the F1 repair note above: absorbs device-vs-server clock skew so the
 * watermark never suppresses a genuinely new space. */
export const CLOCK_SKEW_MARGIN_MS = 24 * 60 * 60 * 1000;

export interface UnreadSpaceLike {
  id?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  user_a?: string | null;
  user_b?: string | null;
}

/**
 * True when a message-less space predates the local unread watermark and
 * therefore must NOT light up as unread on the upgrade that introduces the
 * message-less-unread extension (F-6). Requires BOTH `created_at` and
 * `unreadEpoch` to be present and parseable — missing data on either side
 * means we cannot prove the space predates the epoch, so it is left
 * unsuppressed (fails open toward the existing, pre-fix behaviour rather than
 * ever hiding a space we can't actually place in time).
 */
function predatesUnreadEpoch(createdAt: string | null | undefined, unreadEpoch: string | null | undefined): boolean {
  if (!createdAt || !unreadEpoch) return false;
  const created = new Date(createdAt).getTime();
  const epoch = new Date(unreadEpoch).getTime();
  if (Number.isNaN(created) || Number.isNaN(epoch)) return false;
  // F1: compare against (epoch - margin), not epoch itself — see the module
  // header for why device/server clock skew makes a bare `<` unsafe.
  return created < epoch - CLOCK_SKEW_MARGIN_MS;
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
 *
 * `unreadEpoch` (F-6) only ever narrows the message-less branch above — it is
 * never consulted once a space has a message, so the message-driven path
 * below is byte-for-byte unaffected by it.
 */
export function isSpaceUnread(
  space: UnreadSpaceLike,
  lastRead: Record<string, string>,
  myUserId: string,
  unreadEpoch?: string | null,
): boolean {
  if (!space.id) return false;
  const read = lastRead[space.id];

  if (!space.last_message_at) {
    // Message-less: the only person who can be "unread" is the signal author
    // (user_a), who did not act and was never told. The creator (user_b) acted
    // moments ago and needs no badge for their own action.
    if (read) return false;
    if (space.user_a !== myUserId) return false;
    if (predatesUnreadEpoch(space.created_at, unreadEpoch)) return false;
    return true;
  }

  if (space.last_message_sender_id === myUserId) return false; // BUG-4 guard
  return !read || new Date(space.last_message_at).getTime() > new Date(read).getTime();
}

/** True if any space has an unread message from the other person, or a
 * freshly-opened message-less space I (as user_a) have never seen (subject to
 * the F-6 `unreadEpoch` watermark on the message-less branch). */
export function hasUnread(
  spaces: UnreadSpaceLike[],
  lastRead: Record<string, string>,
  myUserId: string,
  unreadEpoch?: string | null,
): boolean {
  return spaces.some((s) => isSpaceUnread(s, lastRead, myUserId, unreadEpoch));
}
