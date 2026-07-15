/**
 * useReveal — mutual identity reveal in a private space.
 *
 * `space_reveals` RLS returns your OWN row always, but the other member's row only
 * once you've also revealed (mutual gate). So: `iRevealed` = my row exists;
 * `bothRevealed` = the other row is visible (which, by RLS, only happens when mutual);
 * `other` carries their first name + verified-18+ once unlocked. Realtime keeps the
 * "waiting → both revealed" transition live.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/store/queryClient';
import type { Database } from '@/services/database.types';

export type RevealRow = Database['public']['Tables']['space_reveals']['Row'];

async function fetchReveals(spaceId: string): Promise<RevealRow[]> {
  const { data, error } = await supabase.from('space_reveals').select('*').eq('space_id', spaceId);
  if (error) throw new Error(error.message);
  return (data ?? []) as RevealRow[];
}

export function useReveal(spaceId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const myId = user?.id;

  const query = useQuery({
    queryKey: queryKeys.spaceReveals(spaceId ?? ''),
    queryFn: () => fetchReveals(spaceId as string),
    enabled: !!spaceId,
    networkMode: 'always',
    staleTime: 0,
  });

  const rows = query.data ?? [];
  const mine = rows.find((r) => r.user_id === myId) ?? null;
  const other = rows.find((r) => r.user_id !== myId) ?? null; // RLS: visible only when mutual

  useEffect(() => {
    if (!spaceId) return;
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token;
      if (t) { try { supabase.realtime.setAuth(t); } catch { /* non-fatal */ } }
    });
    const ch = supabase
      .channel(`reveals:${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_reveals', filter: `space_id=eq.${spaceId}` },
        () => qc.invalidateQueries({ queryKey: queryKeys.spaceReveals(spaceId) }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [spaceId, qc]);

  return {
    ...query,
    mine,
    other,
    iRevealed: !!mine,
    bothRevealed: !!other,
  };
}

export function useRevealActions(spaceId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const reveal = useMutation({
    networkMode: 'always',
    mutationFn: async (firstName?: string) => {
      if (!spaceId || !user?.id) throw new Error('Not ready.');
      // carry my own verified-18+ status so the other side can see it once mutual
      let ageVerified = false;
      try {
        const { data } = await supabase
          .from('profiles').select('age_confirmed_at').eq('user_id', user.id).maybeSingle();
        ageVerified = !!data?.age_confirmed_at;
      } catch { /* default false */ }
      const { error } = await supabase.from('space_reveals').upsert(
        {
          space_id: spaceId,
          user_id: user.id,
          first_name: firstName?.trim() || null,
          age_verified: ageVerified,
        },
        { onConflict: 'space_id,user_id' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.spaceReveals(spaceId) }),
  });

  const withdraw = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!spaceId || !user?.id) return;
      const { error } = await supabase
        .from('space_reveals').delete().eq('space_id', spaceId).eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.spaceReveals(spaceId) }),
  });

  return { reveal, withdraw };
}
