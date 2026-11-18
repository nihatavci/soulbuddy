/**
 * SignalUnreadContext — persistent "unread addition" state for signals I authored,
 * shown on the Signal Board.
 *
 * Mirrors context/UnreadContext.tsx's architecture (Provider + MMKV persistence +
 * pure derivation function + realtime subscription + hook exposing derived state +
 * mark-read mutator) — but is NOT a copy: UnreadContext derives "unread" from a
 * last_message_at TIMESTAMP diff (private-space messages have that column).
 * Signals/replies have no seen_by_author / last_reply_at / per-user-seen column
 * (confirmed against services/database.types.ts), so this context derives "unseen"
 * from a reply_count SNAPSHOT diff instead: has the signal's reply_count grown past
 * the count I last saw it at?
 *
 * Scoped to the Board screen (not app-root) — unlike the private-space unread badge,
 * this marker has no cross-tab surface (no tab badge requirement in the mission), so
 * the Provider is mounted locally by app/(app)/(tabs)/index.tsx rather than the app
 * root layout.
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
import { useSignals } from '@/hooks/useSignals';
import { Prefs } from '@/store/mmkv';
import { unseenAdditionCount } from '@/context/signalUnread';

// Re-exported for callers that only need the pure derivation core (and for
// the unit tests, which target context/signalUnread.ts directly).
export { hasUnseenAdditions, unseenAdditionCount } from '@/context/signalUnread';

const LAST_SEEN_COUNTS_KEY = 'signal_unread_last_seen_counts_v1';

function loadLastSeenCounts(): Record<string, number> {
  try {
    const raw = Prefs.get(LAST_SEEN_COUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

interface SignalUnreadContextValue {
  lastSeenCounts: Record<string, number>;
  markSignalRead: (signalId: string, currentCount: number) => void;
}

const SignalUnreadContext = createContext<SignalUnreadContextValue | null>(null);

export function SignalUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [lastSeenCounts, setLastSeenCounts] = useState<Record<string, number>>(() =>
    loadLastSeenCounts(),
  );

  // Marks a signal read at its CURRENT reply_count snapshot — the marker will not
  // resurrect for the same reply, only for additions arriving after this count.
  const markSignalRead = useCallback((signalId: string, currentCount: number) => {
    if (!signalId) return;
    setLastSeenCounts((prev) => {
      if ((prev[signalId] ?? 0) >= currentCount) return prev; // already at/past this count
      const next = { ...prev, [signalId]: currentCount };
      try { Prefs.set(LAST_SEEN_COUNTS_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
  }, []);

  // Realtime: new replies INSERTed on signals I authored. RLS on `replies`
  // (replies_select_participant) scopes delivery to rows where I'm either the
  // reply's author OR the signal's author — so this channel naturally only
  // receives replies on MY signals plus replies I myself wrote to others (which
  // we ignore below). No client-side "mine" filtering needed for delivery, only
  // for ignoring my own outgoing replies. Degrades gracefully if the subscription
  // never joins: useSignals()'s own staleTime-based refetch (on refocus/refetch)
  // still eventually reflects new reply_count values without this channel.
  useEffect(() => {
    if (!user?.id) return;
    const myId = user.id;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) supabase.realtime.setAuth(token);
      } catch { /* non-fatal — subscribe still attempted, refetch fallback covers it */ }

      if (cancelled) return;
      channel = supabase
        .channel('unread:replies')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'resense', table: 'replies' },
          (payload) => {
            const reply = payload.new as { author_id?: string; signal_id?: string };
            if (!reply?.signal_id || reply.author_id === myId) return; // ignore my own replies
            qc.invalidateQueries({ queryKey: queryKeys.signals() });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const value = useMemo<SignalUnreadContextValue>(
    () => ({ lastSeenCounts, markSignalRead }),
    [lastSeenCounts, markSignalRead],
  );

  return (
    <SignalUnreadContext.Provider value={value}>{children}</SignalUnreadContext.Provider>
  );
}

function useSignalUnreadContext(): SignalUnreadContextValue {
  const ctx = useContext(SignalUnreadContext);
  if (!ctx) throw new Error('useSignalUnreadContext must be used within <SignalUnreadProvider>');
  return ctx;
}

/**
 * Derived unread-addition state for signals I authored: which signal ids have
 * an unseen addition, a per-signal unseen count (for plural-safe copy — NOT a
 * popularity callout), and the mark-read mutator.
 */
export function useSignalUnread(): {
  unseenSignalIds: Set<string>;
  countFor: (signalId: string | null | undefined) => number;
  markSignalRead: (signalId: string, currentCount: number) => void;
} {
  const { lastSeenCounts, markSignalRead } = useSignalUnreadContext();
  const { data: signals = [] } = useSignals();
  const { user } = useAuth();

  const unseenSignalIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of signals) {
      if (!s.id || s.author_id !== user?.id) continue; // only MY signals get the marker
      if (unseenAdditionCount(s, lastSeenCounts) > 0) set.add(s.id);
    }
    return set;
  }, [signals, lastSeenCounts, user?.id]);

  const countFor = useCallback(
    (signalId: string | null | undefined) => {
      if (!signalId) return 0;
      const signal = signals.find((s) => s.id === signalId);
      return unseenAdditionCount(signal, lastSeenCounts);
    },
    [signals, lastSeenCounts],
  );

  return { unseenSignalIds, countFor, markSignalRead };
}
