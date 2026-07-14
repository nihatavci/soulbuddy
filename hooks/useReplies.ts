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

      // Find the ONE private space between me and this signal's author (one space
      // per pair, either direction — a reply to an already-connected person reuses
      // the existing space rather than keying on this signal_id). The reply already
      // succeeded; if this read fails don't throw (a retry would duplicate the
      // reply) — return null and let the caller route via the Private tab.
      const me = user?.id ?? '';
      let space: PrivateSpace | null = null;
      const { data: sig } = await supabase
        .from('public_signals').select('author_id').eq('id', input.signalId).maybeSingle();
      const authorId = (sig as { author_id?: string } | null)?.author_id ?? '';
      if (me && authorId) {
        const { data: sp, error: spaceErr } = await supabase
          .from('private_spaces').select('*')
          .or(`and(user_a.eq.${authorId},user_b.eq.${me}),and(user_a.eq.${me},user_b.eq.${authorId})`)
          .maybeSingle();
        if (spaceErr) console.warn('[useReplies] space read-back failed:', spaceErr.message);
        space = (sp as PrivateSpace) ?? null;
      }

      return { reply: reply as Reply, space };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.replies(vars.signalId) });
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
      if (user?.id) qc.invalidateQueries({ queryKey: queryKeys.spaces(user.id) });
    },
  });
}
