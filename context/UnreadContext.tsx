/**
 * UnreadContext — global unread-message tracking for the Private tab badge.
 *
 * A single app-wide realtime subscription on `messages` (RLS-scoped, so it only
 * receives messages in spaces I belong to) invalidates the spaces query the moment
 * the OTHER person sends — so the red badge appears immediately, on any tab. Unread
 * is derived by comparing each space's last_message_at against a per-space
 * "last read" timestamp persisted in MMKV; opening a thread marks it read.
 *
 * F-6: also owns the `unreadEpoch` watermark for the message-less-unread
 * extension (context/spaceUnread.ts). Storage access lives here, not in the
 * pure predicate — same split as `lastRead` above. First launch of a build
 * carrying this feature is detected the same way `install_timestamp` already
 * is in app/(app)/_layout.tsx: absence of the stored key, not a build-number
 * comparison, so a fresh install also correctly gets `unreadEpoch = now()`.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/store/queryClient';
import { usePrivateSpaces } from '@/hooks/useSpaces';
import { setAppBadge } from '@/lib/push';
import { Prefs } from '@/store/mmkv';
import { isSpaceUnread, hasUnread } from '@/context/spaceUnread';

const LAST_READ_KEY = 'unread_last_read_v1';
const UNREAD_EPOCH_KEY = 'unread_epoch_v1';

function loadLastRead(): Record<string, string> {
  try {
    const raw = Prefs.get(LAST_READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * F-6: read the persisted `unreadEpoch` watermark, or set it to "now" the
 * first time this ever runs on a device. "First time" is the absence of the
 * stored key (falsy `Prefs.getInt` result — an epoch of exactly Unix time 0
 * never occurs in practice, mirroring the `install_timestamp` convention in
 * app/(app)/_layout.tsx), never a build-number comparison, so a fresh install
 * also correctly gets `unreadEpoch = now()` rather than an already-elapsed
 * cutoff. Subsequent calls (later launches) find the key already set and
 * only read it — they never overwrite it.
 *
 * F3 repair: the whole body is now wrapped, matching `loadLastRead` above —
 * a throwing `Prefs.getInt`/`toISOString` must degrade to no suppression
 * (fail open), never propagate into the provider render and hit the
 * ErrorBoundary. `''` is the correct fail-open return: `predatesUnreadEpoch`
 * in context/spaceUnread.ts already treats a falsy `unreadEpoch` as "cannot
 * prove it predates anything" and never suppresses.
 *
 * F4: if the epoch can't persist at all (Expo Go's in-memory Prefs, or a
 * `setInt` that throws below), every cold start recomputes `Date.now()` as
 * the cutoff, which would re-suppress spaces opened before that particular
 * launch. `CLOCK_SKEW_MARGIN_MS` (context/spaceUnread.ts) neutralises this
 * for any device that is cold-started at least once within a 24h window —
 * the effective cutoff is always at least 24h behind the latest launch. Only
 * a device that both loses persistence AND is cold-started no more than once
 * per 24h+ would see any residual re-arm effect; that combination has no
 * known occurrence path in this app (MMKV is available in every production
 * build) and is not worth additional machinery to close.
 */
function loadOrInitUnreadEpoch(): string {
  try {
    const storedMs = Prefs.getInt(UNREAD_EPOCH_KEY);
    if (storedMs) return new Date(storedMs).toISOString();
    const nowMs = Date.now();
    try {
      Prefs.setInt(UNREAD_EPOCH_KEY, nowMs);
    } catch {
      /* non-fatal: the watermark just won't persist across restarts this time */
    }
    return new Date(nowMs).toISOString();
  } catch {
    return ''; // fail open: no epoch means no suppression, ever
  }
}

interface UnreadContextValue {
  lastRead: Record<string, string>;
  unreadEpoch: string;
  markSpaceRead: (spaceId: string) => void;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [lastRead, setLastRead] = useState<Record<string, string>>(() => loadLastRead());
  const [unreadEpoch] = useState<string>(() => loadOrInitUnreadEpoch());

  const { data: spaces = [] } = usePrivateSpaces();

  const markSpaceRead = useCallback((spaceId: string) => {
    if (!spaceId) return;
    setLastRead((prev) => {
      const next = { ...prev, [spaceId]: new Date().toISOString() };
      try { Prefs.set(LAST_READ_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
  }, []);

  // App-icon badge (presence model): 1 when anything is unread, 0 otherwise.
  // Kept in sync as spaces update (realtime/poll) and as threads are marked read.
  useEffect(() => {
    if (!user?.id) { void setAppBadge(0); return; }
    void setAppBadge(hasUnread(spaces, lastRead, user.id, unreadEpoch) ? 1 : 0);
  }, [user?.id, spaces, lastRead, unreadEpoch]);

  // One global realtime subscription. RLS ensures we only receive INSERTs for
  // messages in spaces we're a member of. A message from the other person
  // refreshes the spaces list (→ badge). The open thread itself is refreshed by
  // useMessages' own per-space channel (direct cache write) — invalidating
  // spaceMessages here too would just be a redundant network refetch.
  useEffect(() => {
    if (!user?.id) return;
    const myId = user.id;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Authorize the realtime socket with the current JWT BEFORE subscribing:
      // subscribing first can race the auth handshake and the RLS-gated
      // postgres_changes subscription is then silently rejected/never joins.
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) supabase.realtime.setAuth(token);
      } catch { /* non-fatal */ }

      if (cancelled) return;
      channel = supabase
        .channel('unread:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'resense', table: 'messages' },
          (payload) => {
            const msg = payload.new as { sender_id?: string; space_id?: string };
            if (!msg?.sender_id || msg.sender_id === myId) return; // ignore my own
            qc.invalidateQueries({ queryKey: queryKeys.spaces(myId) });
          },
        )
        .on(
          // FEAT-3: a reply just opened a private space. The signal author
          // (user_a) currently hears nothing in-app until this — invalidate
          // their spaces() so the new (message-less) space and its badge
          // appear immediately. This binding is INERT unless `private_spaces`
          // is a member of the `supabase_realtime` publication — see
          // `supabase/migrations/022_resense_notify_space_opened.sql` §1 (the
          // guarded `alter publication supabase_realtime add table
          // public.private_spaces`). `messages`, `space_reveals` and
          // `space_events` were already published before this migration
          // (009_resense_signals_loop.sql:157,
          // 014_resense_reveal_slowdown.sql:60-61); `private_spaces` was the
          // one table 022 needed to add. No server-side `filter:` on purpose —
          // the recipient check stays client-side, mirroring the messages
          // guard directly above.
          'postgres_changes',
          { event: 'INSERT', schema: 'resense', table: 'private_spaces' },
          (payload) => {
            const space = payload.new as { user_a?: string; user_b?: string };
            if (space?.user_a !== myId) return; // I'm not the notified party (I'm the creator, or unrelated)
            qc.invalidateQueries({ queryKey: queryKeys.spaces(myId) });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const value = useMemo<UnreadContextValue>(
    () => ({ lastRead, unreadEpoch, markSpaceRead }),
    [lastRead, unreadEpoch, markSpaceRead],
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

/** Low-level access — mostly for markSpaceRead from the thread screen. */
export function useUnreadContext(): UnreadContextValue {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnreadContext must be used within <UnreadProvider>');
  return ctx;
}

/**
 * Derived unread state: which of my spaces have a newer message than I've read,
 * plus the total (for the tab badge). A space counts as unread when its
 * last_message_at is newer than my stored last-read time for it.
 */
export function useUnread(): {
  unreadSpaceIds: Set<string>;
  total: number;
  markSpaceRead: (spaceId: string) => void;
} {
  const { user } = useAuth();
  const { lastRead, unreadEpoch, markSpaceRead } = useUnreadContext();
  const { data: spaces = [] } = usePrivateSpaces();
  const myUserId = user?.id ?? '';

  const unreadSpaceIds = useMemo(() => {
    const set = new Set<string>();
    if (!myUserId) return set;
    for (const s of spaces) {
      if (s.id && isSpaceUnread(s, lastRead, myUserId, unreadEpoch)) set.add(s.id);
    }
    return set;
  }, [spaces, lastRead, myUserId, unreadEpoch]);

  return { unreadSpaceIds, total: unreadSpaceIds.size, markSpaceRead };
}
