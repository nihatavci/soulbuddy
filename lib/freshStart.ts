/**
 * "Fresh start" framing — pure boundary/count logic for the Signal Board's
 * daily-reset moment. Copy-only reframing, NOT a new cap-enforcement mechanic:
 * `DAILY_SIGNAL_CAP` (constants/signals.ts) remains unenforced. These helpers
 * only decide (a) whether this is the first Board view of a new local day,
 * and (b) how many of the user's own signals were created since local
 * midnight — used purely to make the framing copy reflect real state.
 */

/** Local calendar-day key (respects host timezone, DST-safe by construction). */
function localDateKey(d: Date): string {
  return d.toDateString();
}

/**
 * True when `lastSeenISO` is missing, unparsable, or falls on an earlier
 * local calendar day than `now` — i.e. this is the first Board view of a
 * new local day.
 */
export function isNewLocalDaySince(
  lastSeenISO: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastSeenISO) return true;
  const last = new Date(lastSeenISO);
  if (Number.isNaN(last.getTime())) return true;
  return localDateKey(last) !== localDateKey(now);
}

/** ISO string for local midnight (00:00:00.000) of the day containing `now`. */
export function getLocalMidnightISO(now: Date = new Date()): string {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return midnight.toISOString();
}

/**
 * Count of `authorId`'s own signals created on/after `boundaryISO`.
 * Client-side filter over an already-fetched signal list — no new query.
 */
export function countSignalsSinceBoundary(
  signals: { author_id?: string | null; created_at?: string | null }[],
  authorId: string | null | undefined,
  boundaryISO: string,
): number {
  if (!authorId) return 0;
  const boundary = new Date(boundaryISO).getTime();
  if (Number.isNaN(boundary)) return 0;

  let count = 0;
  for (const s of signals) {
    if (s.author_id !== authorId || !s.created_at) continue;
    const created = new Date(s.created_at).getTime();
    if (!Number.isNaN(created) && created >= boundary) count++;
  }
  return count;
}
