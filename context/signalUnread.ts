/**
 * signalUnread — pure derivation core for growth-1-unread-reply-indicator.
 *
 * Kept separable from context/SignalUnreadContext.tsx (which owns the
 * Provider/hook/realtime wiring) so this file's logic is unit-testable in
 * isolation, per the coverage floor on "changed lines in the pure-function
 * file" (>=95%).
 *
 * Signals/replies have no seen_by_author / last_reply_at / per-user-seen
 * column (confirmed against services/database.types.ts) — so "unseen" is
 * derived from a reply_count SNAPSHOT diff (has reply_count grown past the
 * count I last saw this signal at?), not a timestamp diff like
 * context/UnreadContext.tsx's hasUnread.
 */

export interface SignalLike {
  id?: string | null;
  reply_count?: number | null;
}

/**
 * How many replies on this signal I have not yet seen, i.e. how far the
 * current reply_count has grown past the count stored the last time I
 * viewed it. Never negative. Degrades to 0 for a deleted/missing signal
 * (unhappy path: signal deleted between reply and view) or a signal with
 * no id.
 */
export function unseenAdditionCount(
  signal: SignalLike | null | undefined,
  lastSeenCounts: Record<string, number>,
): number {
  if (!signal?.id) return 0;
  const count = signal.reply_count ?? 0;
  const seen = lastSeenCounts[signal.id] ?? 0;
  return Math.max(0, count - seen);
}

/** True if any signal in the list has at least one unseen addition. */
export function hasUnseenAdditions(
  signals: SignalLike[],
  lastSeenCounts: Record<string, number>,
): boolean {
  for (const s of signals) {
    if (unseenAdditionCount(s, lastSeenCounts) > 0) return true;
  }
  return false;
}
