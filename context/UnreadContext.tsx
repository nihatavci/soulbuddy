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

/** True if any space has a message newer than its stored last-read time. */
function hasUnread(
  spaces: { id?: string | null; last_message_at?: string | null }[],
  lastRead: Record<string, string>,
): boolean {
  for (const s of spaces) {
    if (!s.id || !s.last_message_at) continue;
    const read = lastRead[s.id];
    if (!read || new Date(s.last_message_at).getTime() > new Date(read).getTime()) {
      return true;
    }
  }
  return false;
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
    void setAppBadge(hasUnread(spaces, lastRead) ? 1 : 0);
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
  const { lastRead, markSpaceRead } = useUnreadContext();
  const { data: spaces = [] } = usePrivateSpaces();

  const unreadSpaceIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of spaces) {
      if (!s.id) continue;
      const last = s.last_message_at;
      if (!last) continue;
      const read = lastRead[s.id];
      if (!read || new Date(last).getTime() > new Date(read).getTime()) {
        set.add(s.id);
      }
    }
    return set;
  }, [spaces, lastRead]);

  return { unreadSpaceIds, total: unreadSpaceIds.size, markSpaceRead };
}
