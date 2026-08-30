/**
 * lib/pushDeepLink.ts — pure spaceId extraction + pending deep-link handoff.
 *
 * Purpose: `addPushResponseListener` (lib/push.ts) can resolve a notification
 * response before the (app) navigator is hydrated or before the auth/onboarding
 * gate (app/(app)/index.tsx AppGate) has settled — at which point navigating
 * directly is either a silent no-op or gets clobbered by AppGate's subsequent
 * unconditional `router.replace('/(app)/(tabs)')`. Instead of navigating in
 * that window, the consumer stashes the spaceId here; AppGate replays it once
 * it lands the user on the tabs, on the authenticated + onboarded branch only.
 *
 * No react-native / expo imports — pure module, unit-testable without mocks.
 * The pending value is in-memory only (module-level variable): a tap-to-open
 * is always within one process lifetime, and persisting to MMKV would risk
 * resurrecting a stale link across app opens.
 */

/** Extract the `data.spaceId` from an Expo notification response, defensively. */
export function extractSpaceId(resp: unknown): string | undefined {
  if (resp == null || typeof resp !== 'object') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (resp as any)?.notification?.request?.content?.data?.spaceId;
  if (raw == null) return undefined;
  const id = String(raw).trim();
  return id.length > 0 ? id : undefined;
}

let pendingSpaceId: string | undefined;

/**
 * Stash a spaceId to be consumed later (once the gate resolves the user).
 * Passing `undefined` is a no-op — it must NOT clear an existing pending id,
 * since a caller may call this defensively without knowing whether a real
 * spaceId is already pending.
 */
export function setPendingSpaceDeepLink(id?: string): void {
  if (id == null) return;
  pendingSpaceId = id;
}

/** Read and clear the pending spaceId — single-consume, never re-fires. */
export function consumePendingSpaceDeepLink(): string | undefined {
  const id = pendingSpaceId;
  pendingSpaceId = undefined;
  return id;
}

/** Read the pending spaceId without clearing it. */
export function peekPendingSpaceDeepLink(): string | undefined {
  return pendingSpaceId;
}
