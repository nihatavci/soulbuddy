/**
 * useMessages — the 1:1 thread inside a private space. Reads history and subscribes
 * to Supabase Realtime INSERTs (RLS-gated by the authed token) so a message from the
 * other person appears live. Sends dedupe by id (realtime echoes your own insert).
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Message } from '@/services/supabase';

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
  });

  useEffect(() => {
    if (!spaceId) return;
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
