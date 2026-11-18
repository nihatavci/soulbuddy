/**
 * "Delete for me" — hides one message from the thread on THIS device only.
 * Mirrors iMessage's swipe-to-delete semantics: the other person's copy is
 * untouched, nothing is sent to the server. Persisted per-space in Prefs
 * (the same MMKV-backed pattern as context/UnreadContext.tsx's lastRead map)
 * so it survives an app restart.
 */
import { Prefs } from '@/store/mmkv';

const KEY_PREFIX = 'local_hidden_messages_';

function keyFor(spaceId: string): string {
  return `${KEY_PREFIX}${spaceId}`;
}

/** All locally-hidden message ids for one space. Never throws on bad data. */
export function getHiddenIds(spaceId: string): Set<string> {
  const raw = Prefs.get(keyFor(spaceId));
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v) => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

/** Hide one message id for this space, on this device only. Idempotent. */
export function hideMessageForMe(spaceId: string, messageId: string): void {
  const ids = getHiddenIds(spaceId);
  ids.add(messageId);
  Prefs.set(keyFor(spaceId), JSON.stringify([...ids]));
}

/** True if this device has locally hidden `messageId` within `spaceId`. */
export function isHiddenForMe(spaceId: string, messageId: string): boolean {
  return getHiddenIds(spaceId).has(messageId);
}
