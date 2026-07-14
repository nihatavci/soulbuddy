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
import type { Message } from '@/services/supabase';

const POLL_MS = 2500;

async function fetchMessages(spaceId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages').select('*').eq('space_id', spaceId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

function upsertMessage(list: Message[] | undefined, msg: Message): Message[] {
  const cur = list ?? [];
  if (cur.some((m) => m.id === msg.id)) return cur;
  return [...cur, msg];
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
    // Best-effort: authorize the realtime socket with the current JWT so
    // postgres_changes on the RLS-protected messages table can be delivered.
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        try { supabase.realtime.setAuth(token); } catch { /* non-fatal */ }
      }
    });

    const channel = supabase
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
    return () => { supabase.removeChannel(channel); };
  }, [spaceId, qc]);

  return query;
}

export function useSendMessage(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
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
    onSuccess: (msg) => {
      qc.setQueryData<Message[]>(
        queryKeys.spaceMessages(spaceId),
        (old) => upsertMessage(old, msg),
      );
    },
  });
}
