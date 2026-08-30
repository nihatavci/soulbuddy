/**
 * UnreadContext — global unread-message tracking for the Private tab badge.
 *
 * A single app-wide realtime subscription on `messages` (RLS-scoped, so it only
 * receives messages in spaces I belong to) invalidates the spaces query the moment
 * the OTHER person sends — so the red badge appears immediately, on any tab. Unread
 * is derived by comparing each space's last_message_at against a per-space
 * "last read" timestamp persisted in MMKV; opening a thread marks it read.
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

type UnreadSpaceLike = {
  id?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
};

/**
 * A space counts as unread only when the last message is from the OTHER
 * person AND it's newer than my stored last-read time.
 *
 * BUG-4 fix: this used to compare last_message_at against lastRead alone,
 * with no awareness of who sent it. markSpaceRead stamps lastRead with a
 * client-side "now" at send time, but the server's created_at for that same
 * message (assigned at INSERT, after the network round trip) can land
 * slightly LATER than that client stamp — so the sender's own just-sent
 * message could read as "newer than lastRead" once spaces() refetched with
 * the real timestamp, firing the badge/dot for a message the user sent to
 * themselves. Checking the sender directly makes this immune to any clock
 * or latency skew, rather than just narrowing the race window.
 */
function isSpaceUnread(space: UnreadSpaceLike, lastRead: Record<string, string>, myUserId: string): boolean {
  if (!space.id || !space.last_message_at) return false;
  if (space.last_message_sender_id === myUserId) return false;
  const read = lastRead[space.id];
  return !read || new Date(space.last_message_at).getTime() > new Date(read).getTime();
}

/** True if any space has an unread message from the other person. */
function hasUnread(spaces: UnreadSpaceLike[], lastRead: Record<string, string>, myUserId: string): boolean {
  return spaces.some((s) => isSpaceUnread(s, lastRead, myUserId));
}

const LAST_READ_KEY = 'unread_last_read_v1';

function loadLastRead(): Record<string, string> {
  try {
    const raw = Prefs.get(LAST_READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

interface UnreadContextValue {
  lastRead: Record<string, string>;
  markSpaceRead: (spaceId: string) => void;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [lastRead, setLastRead] = useState<Record<string, string>>(() => loadLastRead());

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
    void setAppBadge(hasUnread(spaces, lastRead, user.id) ? 1 : 0);
  }, [user?.id, spaces, lastRead]);

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
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new as { sender_id?: string; space_id?: string };
            if (!msg?.sender_id || msg.sender_id === myId) return; // ignore my own
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
    () => ({ lastRead, markSpaceRead }),
    [lastRead, markSpaceRead],
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
  const { lastRead, markSpaceRead } = useUnreadContext();
  const { data: spaces = [] } = usePrivateSpaces();
  const myUserId = user?.id ?? '';

  const unreadSpaceIds = useMemo(() => {
    const set = new Set<string>();
    if (!myUserId) return set;
    for (const s of spaces) {
      if (s.id && isSpaceUnread(s, lastRead, myUserId)) set.add(s.id);
    }
    return set;
  }, [spaces, lastRead, myUserId]);

  return { unreadSpaceIds, total: unreadSpaceIds.size, markSpaceRead };
}
