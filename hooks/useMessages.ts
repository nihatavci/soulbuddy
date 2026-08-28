/**
 * useMessages — the 1:1 thread inside a private space.
 *
 * Reliability model: the thread must never silently stop. So we do NOT rely on
 * realtime alone — we poll on a short interval as the source of truth and keep a
 * realtime subscription as a low-latency bonus. Both write the same cache (deduped
 * by id). Chat queries/mutations use networkMode 'always' so a flaky RN network
 * detector can never pause a send (which would leave the button stuck disabled) or
 * freeze the poll.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/services/supabase';

/** A message not yet confirmed by the server — shown as a pending bubble. */
export type PendingMessage = Message & { pending?: boolean };

const TEMP_ID_PREFIX = 'temp-';

// Realtime (authed socket) delivers new messages instantly; this poll is only a
// safety net for a dropped socket, so it can be brisk without being the main path.
const POLL_MS = 1500;

async function fetchMessages(spaceId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages').select('*').eq('space_id', spaceId)
    // id as a stable tiebreaker so two messages in the same instant never reorder.
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

function upsertMessage(list: Message[] | undefined, msg: Message): Message[] {
  const cur = list ?? [];
  if (cur.some((m) => m.id === msg.id)) return cur;
  // Insert then sort by (created_at, id): a realtime INSERT may arrive after a
  // later-polled message, so appending blindly could show it out of order.
  const next = [...cur, msg];
  next.sort((a, b) => {
    const t = a.created_at.localeCompare(b.created_at);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  return next;
}

/** Deterministic-enough temp id for one optimistic bubble in one send call. */
function makeTempId(): string {
  return `${TEMP_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Replace the temp bubble (if present) with the server-confirmed message. */
function replaceTemp(list: Message[] | undefined, tempId: string, real: Message): Message[] {
  const withoutTemp = (list ?? []).filter((m) => m.id !== tempId);
  return upsertMessage(withoutTemp, real);
}

/** Drop the temp bubble on send failure — nothing to reconcile with the server. */
function removeTemp(list: Message[] | undefined, tempId: string): Message[] {
  return (list ?? []).filter((m) => m.id !== tempId);
}

export function useMessages(spaceId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.spaceMessages(spaceId ?? ''),
    queryFn: () => fetchMessages(spaceId as string),
    enabled: !!spaceId,
    // Always hit the network; never serve-and-pause. Poll so new messages arrive
    // even if the realtime socket is down.
    networkMode: 'always',
    staleTime: 0,
    refetchInterval: spaceId ? POLL_MS : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!spaceId) return;
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
        .channel(`messages:${spaceId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `space_id=eq.${spaceId}` },
          (payload) => {
            qc.setQueryData<Message[]>(
              queryKeys.spaceMessages(spaceId),
              (old) => upsertMessage(old, payload.new as Message),
            );
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [spaceId, qc]);

  return query;
}

interface SendContext {
  tempId: string;
}

export function useSendMessage(spaceId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation<Message, Error, string, SendContext>({
    // 'always' so a transient offline reading can never pause the send and leave
    // isPending stuck true (which would permanently disable the send button).
    networkMode: 'always',
    mutationFn: async (text: string): Promise<Message> => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ space_id: spaceId, text: text.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Message;
    },
    // Optimistic: the bubble appears the instant the user taps send, instead of
    // waiting on the insert+select network round trip (see H3, comms-latency-fix).
    onMutate: (text: string): SendContext => {
      const tempId = makeTempId();
      const temp: PendingMessage = {
        id: tempId,
        space_id: spaceId,
        sender_id: user?.id ?? '',
        text: text.trim(),
        created_at: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<Message[]>(
        queryKeys.spaceMessages(spaceId),
        (old) => upsertMessage(old, temp),
      );
      return { tempId };
    },
    onSuccess: (msg, _text, context) => {
      qc.setQueryData<Message[]>(
        queryKeys.spaceMessages(spaceId),
        (old) => replaceTemp(old, context?.tempId ?? '', msg),
      );
    },
    onError: (_err, _text, context) => {
      if (!context?.tempId) return;
      qc.setQueryData<Message[]>(
        queryKeys.spaceMessages(spaceId),
        (old) => removeTemp(old, context.tempId),
      );
    },
  });
}
