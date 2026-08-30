/**
 * useFreshStart — "fresh start" framing state for the Signal Board.
 *
 * Copy-only reframing of the daily reset moment: NOT a cap-enforcement
 * mechanic (`DAILY_SIGNAL_CAP` stays unenforced). Persists a "last seen"
 * timestamp in MMKV (same architecture as `UnreadContext`'s per-space
 * `lastRead` map) and re-evaluates on every mount/focus — no live timer, so a
 * midnight/DST boundary crossed while the app stays open is simply picked up
 * on the next natural render, never a crash.
 */
import { useEffect, useMemo, useState } from 'react';
import { Prefs } from '@/store/mmkv';
import { getLocalMidnightISO, isNewLocalDaySince, countSignalsSinceBoundary } from '@/lib/freshStart';

const LAST_SEEN_KEY = 'board_fresh_start_last_seen_v1';

export function useFreshStart(
  signals: { author_id?: string | null; created_at?: string | null }[],
  authorId: string | null | undefined,
): { isFreshStart: boolean; todayCount: number } {
  const [isFreshStart, setIsFreshStart] = useState(false);

  useEffect(() => {
    const now = new Date();
    const lastSeen = Prefs.get(LAST_SEEN_KEY);
    setIsFreshStart(isNewLocalDaySince(lastSeen, now));
    try {
      Prefs.set(LAST_SEEN_KEY, now.toISOString());
    } catch {
      /* non-fatal: framing just won't persist across restarts this time */
    }
  }, []);

  const boundaryISO = useMemo(() => getLocalMidnightISO(new Date()), []);
  const todayCount = useMemo(
    () => countSignalsSinceBoundary(signals, authorId, boundaryISO),
    [signals, authorId, boundaryISO],
  );

  return { isFreshStart, todayCount };
}
