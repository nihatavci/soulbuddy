/**
 * useSignals — the Signal Board.
 *
 * Reads the alias-only `public_signals` view (bounded, recent-first) and creates
 * new signals. author_id defaults to auth.uid() server-side, so inserts send only
 * { text, format }. Mirrors hooks/useProfile.ts conventions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import { useAuth } from '@/context/AuthContext';
import type { PublicSignal, Signal } from '@/services/supabase';
import type { SignalFormat } from '@/constants/signals';

const BOARD_LIMIT = 30;

async function fetchSignals(): Promise<PublicSignal[]> {
  const { data, error } = await supabase
    .from('public_signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(BOARD_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicSignal[];
}

export function useSignals() {
  return useQuery({
    queryKey: queryKeys.signals(),
    queryFn: fetchSignals,
    staleTime: 1000 * 60, // 1 min
  });
}

async function fetchSignal(id: string): Promise<PublicSignal | null> {
  const { data, error } = await supabase
    .from('public_signals').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as PublicSignal | null;
}

export function useSignal(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.signal(id ?? ''),
    queryFn: () => fetchSignal(id as string),
    enabled: !!id,
  });
}

export function useCreateSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { text: string; format: SignalFormat }): Promise<Signal> => {
      const { data, error } = await supabase
        .from('signals')
        .insert({ text: input.text.trim(), format: input.format })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Signal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
    },
  });
}

/**
 * Deletes one of the caller's own signals. `signals_delete_own` (migration
 * 018_resense_delete_message_signal.sql) scopes the DELETE to
 * author_id = auth.uid(), so the server rejects any other signal.
 *
 * Explicit product decision: this is a real, cascading delete — the FKs from
 * 009_resense_signals_loop.sql mean any replies AND any private space (and
 * its messages) that grew from this signal are removed too, even if the
 * other person is actively in that conversation. The UI must confirm before
 * calling this — see the Alert.alert in app/(app)/(tabs)/index.tsx.
 */
export function useDeleteSignal() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (signalId: string): Promise<void> => {
      const { error } = await supabase.from('signals').delete().eq('id', signalId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
      // A deleted signal can cascade-remove a private space (see docstring
      // above) — refresh the Private list too, in case one just vanished.
      if (user?.id) qc.invalidateQueries({ queryKey: queryKeys.spaces(user.id) });
    },
  });
}
