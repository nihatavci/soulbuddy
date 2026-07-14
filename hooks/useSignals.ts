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
