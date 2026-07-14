/**
 * useReplies — additions to a signal. Inserting a reply fires the DB trigger that
 * auto-opens a private_space; we read that space back (I'm user_b) so the caller can
 * route into the resonance-unlock moment.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Reply, PrivateSpace } from '@/services/supabase';

async function fetchReplies(signalId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from('replies').select('*').eq('signal_id', signalId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Reply[];
}

export function useReplies(signalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.replies(signalId ?? ''),
    queryFn: () => fetchReplies(signalId as string),
    enabled: !!signalId,
  });
}

export function useAddReply() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { signalId: string; text: string }):
      Promise<{ reply: Reply; space: PrivateSpace | null }> => {
      const { data: reply, error } = await supabase
        .from('replies')
        .insert({ signal_id: input.signalId, text: input.text.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);

      // the trigger opened a space with me (user_b) — read it back
      const { data: space } = await supabase
        .from('private_spaces').select('*')
        .eq('signal_id', input.signalId)
        .eq('user_b', user?.id ?? '')
        .maybeSingle();

      return { reply: reply as Reply, space: (space as PrivateSpace) ?? null };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.replies(vars.signalId) });
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
      if (user?.id) qc.invalidateQueries({ queryKey: queryKeys.spaces(user.id) });
    },
  });
}
