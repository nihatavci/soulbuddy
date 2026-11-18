/**
 * useReplyOwedPrompt — the calm, dismissible "your turn" nudge shown inline
 * in private-space.tsx when the other person sent the last message and the
 * current user hasn't replied in a while.
 *
 * Design (reply-owed-nudge, mission RUN-NONCE
 * resense-your-turn-nudge-20260904-181823): a space is "reply owed" once
 * `last_message_sender_id` (from `space_overview`, already fetched by
 * usePrivateSpaces() — no new query, no schema change) is NOT the current
 * user AND at least REPLY_OWED_HOURS have elapsed since `last_message_at`.
 * Dismissal is local-only, persisted in MMKV (mirrors
 * hooks/useSpaceClosurePrompt.ts's architecture) — never sent to the server,
 * never visible to the other person.
 *
 * Reset-on-new-activity (documented choice, mirrors the closure prompt): the
 * dismissed map stores the `last_message_at` value that was current AT THE
 * TIME of dismissal. If a new message arrives afterward (from either party),
 * `last_message_at` changes, so the old dismissal no longer matches and the
 * nudge is eligible to show again for the NEW owed period.
 */
import { useCallback, useMemo, useState } from 'react';
import { Prefs } from '@/store/mmkv';

/** Hours of silence, with a reply owed, after which the nudge is eligible to show. */
export const REPLY_OWED_HOURS = 48;

const DISMISSED_KEY = 'reply_owed_dismissed_v1';

/**
 * Whole hours elapsed between `lastMessageAtISO` and `now`. Returns null when
 * there is no last-message timestamp or when the timestamp can't be parsed,
 * rather than crashing or returning NaN. A future/clock-skewed timestamp
 * (negative elapsed) is clamped to 0.
 */
export function hoursSinceLastMessage(
  lastMessageAtISO: string | null | undefined,
  now: Date,
): number | null {
  if (!lastMessageAtISO) return null;
  const last = new Date(lastMessageAtISO).getTime();
  if (Number.isNaN(last)) return null;
  const elapsedMs = now.getTime() - last;
  if (elapsedMs < 0) return 0;
  return Math.floor(elapsedMs / (60 * 60 * 1000));
}

interface SpaceForReplyOwed {
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
}

/**
 * True when a reply is owed by `currentUserId`: the last message exists, was
 * sent by the OTHER person (never nudge someone about their own message),
 * and at least REPLY_OWED_HOURS have elapsed since it arrived.
 */
export function isReplyOwed(
  space: SpaceForReplyOwed,
  currentUserId: string | null | undefined,
  now: Date,
): boolean {
  if (space.last_message_sender_id === currentUserId) return false;
  const hours = hoursSinceLastMessage(space.last_message_at, now);
  if (hours === null) return false;
  return hours >= REPLY_OWED_HOURS;
}

/**
 * True when the nudge for `spaceId` was already dismissed for the space's
 * CURRENT owed period (i.e. the dismissed map holds exactly the current
 * `currentLastMessageAtISO`). See module doc for the reset-on-new-activity
 * rationale. A space with no current last-message timestamp is never
 * considered dismissed (there is nothing to dismiss).
 */
export function isReplyOwedDismissed(
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

interface SpaceForReplyOwedPrompt {
  id?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
}

/**
 * Screen-facing hook: given the space (as read from usePrivateSpaces()'s
 * space_overview rows — caller passes it in, this hook does not fetch) and
 * the current user's id, decides whether the reply-owed nudge should show,
 * and exposes `dismiss()`. Purely local state — never navigates, never
 * blocks send/read, invisible to the other person.
 */
export function useReplyOwedPrompt(
  space: SpaceForReplyOwedPrompt | null | undefined,
  currentUserId: string | null | undefined,
): {
  showNudge: boolean;
  dismiss: () => void;
} {
  const [dismissedMap, setDismissedMap] = useState<Record<string, string>>(() => loadDismissedMap());

  const spaceId = space?.id ?? null;
  const lastMessageAt = space?.last_message_at ?? null;
  const lastMessageSenderId = space?.last_message_sender_id ?? null;

  const showNudge = useMemo(() => {
    if (!spaceId) return false;
    const owed = isReplyOwed(
      { last_message_at: lastMessageAt, last_message_sender_id: lastMessageSenderId },
      currentUserId,
      new Date(),
    );
    if (!owed) return false;
    return !isReplyOwedDismissed(spaceId, dismissedMap, lastMessageAt);
  }, [spaceId, lastMessageAt, lastMessageSenderId, currentUserId, dismissedMap]);

  const dismiss = useCallback(() => {
    if (!spaceId || !lastMessageAt) return;
    setDismissedMap((prev) => {
      const next = { ...prev, [spaceId]: lastMessageAt };
      try { Prefs.set(DISMISSED_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
  }, [spaceId, lastMessageAt]);

  return { showNudge, dismiss };
}
