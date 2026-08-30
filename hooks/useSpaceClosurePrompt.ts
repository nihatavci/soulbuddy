/**
 * useSpaceClosurePrompt — the gentle, dismissible "this space quieted
 * naturally" prompt shown as a THIRD path in check-in.tsx (distinct from the
 * self check-in "How does this feel?" section and the Safety/report section).
 *
 * Design (growth-3-space-closure-ritual, mission RUN-NONCE
 * resense-growth-features-2026-08-30): a space qualifies once
 * `last_message_at` (from `space_overview`, already fetched by
 * usePrivateSpaces() — no new query, no schema change) is at least
 * SPACE_CLOSURE_SILENCE_DAYS old. Dismissal is local-only, persisted in MMKV
 * (same architecture as UnreadContext's `lastRead` map, keyed by spaceId) —
 * never sent to the server, never visible to the other person.
 *
 * Reset-on-new-activity (documented choice): the dismissed map stores the
 * `last_message_at` value that was current AT THE TIME of dismissal. If the
 * space goes quiet, is dismissed, then gets new messages and later quiets
 * again, `last_message_at` has changed since the stored value — so the old
 * dismissal no longer matches and the prompt is eligible to show again for
 * the NEW silent period. This mirrors "this happened again" rather than
 * "you already told us once, forever" and avoids the prompt becoming stale
 * or confusing after real conversation resumes.
 */
import { useCallback, useMemo, useState } from 'react';
import { Prefs } from '@/store/mmkv';

/** Days of silence after which a space is eligible for the closure prompt. */
export const SPACE_CLOSURE_SILENCE_DAYS = 14;

const DISMISSED_KEY = 'space_closure_dismissed_v1';

/**
 * Whole days elapsed between `lastMessageAtISO` and `now`. Returns null when
 * there is no last-message timestamp (zero-message space — "quieted" implies
 * prior activity, so there is nothing to report) or when the timestamp can't
 * be parsed, rather than crashing or returning NaN.
 */
export function daysSinceLastMessage(
  lastMessageAtISO: string | null | undefined,
  now: Date,
): number | null {
  if (!lastMessageAtISO) return null;
  const last = new Date(lastMessageAtISO).getTime();
  if (Number.isNaN(last)) return null;
  const elapsedMs = now.getTime() - last;
  if (elapsedMs < 0) return 0;
  return Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
}

/**
 * True when the prompt for `spaceId` was already dismissed for the space's
 * CURRENT silent period (i.e. the dismissed map holds exactly the current
 * `currentLastMessageAtISO`). See module doc for the reset-on-new-activity
 * rationale. A space with no current last-message timestamp is never
 * considered dismissed (there is nothing to dismiss).
 */
export function isClosurePromptDismissed(
  spaceId: string,
  dismissedMap: Record<string, string>,
  currentLastMessageAtISO: string | null | undefined,
): boolean {
  if (!currentLastMessageAtISO) return false;
  return dismissedMap[spaceId] === currentLastMessageAtISO;
}

function loadDismissedMap(): Record<string, string> {
  try {
    const raw = Prefs.get(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

interface SpaceForClosurePrompt {
  id?: string | null;
  last_message_at?: string | null;
}

/**
 * Screen-facing hook: given the space (as read from usePrivateSpaces()'s
 * space_overview rows — caller passes it in, this hook does not fetch),
 * decides whether the closure prompt should show, and exposes `dismiss()`.
 * Not force-shown: this only ever returns a boolean the screen may use to
 * render an optional, dismissible section — it never navigates or blocks.
 */
export function useSpaceClosurePrompt(space: SpaceForClosurePrompt | null | undefined): {
  showPrompt: boolean;
  dismiss: () => void;
} {
  const [dismissedMap, setDismissedMap] = useState<Record<string, string>>(() => loadDismissedMap());

  const spaceId = space?.id ?? null;
  const lastMessageAt = space?.last_message_at ?? null;

  const showPrompt = useMemo(() => {
    if (!spaceId) return false;
    const days = daysSinceLastMessage(lastMessageAt, new Date());
    if (days === null || days < SPACE_CLOSURE_SILENCE_DAYS) return false;
    return !isClosurePromptDismissed(spaceId, dismissedMap, lastMessageAt);
  }, [spaceId, lastMessageAt, dismissedMap]);

  const dismiss = useCallback(() => {
    if (!spaceId || !lastMessageAt) return;
    setDismissedMap((prev) => {
      const next = { ...prev, [spaceId]: lastMessageAt };
      try { Prefs.set(DISMISSED_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
  }, [spaceId, lastMessageAt]);

  return { showPrompt, dismiss };
}
