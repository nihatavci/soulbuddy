/**
 * useSpaceEvents — lightweight mutual signals in a private space (currently the
 * "slow down" pace nudge). Both members see them; realtime keeps them live so the
 * other person actually receives the nudge.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Database } from '@/services/database.types';

export type SpaceEvent = Database['resense']['Tables']['space_events']['Row'];

async function fetchEvents(spaceId: string): Promise<SpaceEvent[]> {
  const { data, error } = await supabase
    .from('space_events').select('*').eq('space_id', spaceId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SpaceEvent[];
}

export function useSpaceEvents(spaceId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.spaceEvents(spaceId ?? ''),
    queryFn: () => fetchEvents(spaceId as string),
    enabled: !!spaceId,
    networkMode: 'always',
    staleTime: 0,
  });

  useEffect(() => {
    if (!spaceId) return;
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token;
      if (t) { try { supabase.realtime.setAuth(t); } catch { /* non-fatal */ } }
    });
    const ch = supabase
      .channel(`events:${spaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'resense', table: 'space_events', filter: `space_id=eq.${spaceId}` },
        () => qc.invalidateQueries({ queryKey: queryKeys.spaceEvents(spaceId) }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [spaceId, qc]);

  return query;
}

export function useSendSlowDown(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!spaceId) throw new Error('Not ready.');
      const { error } = await supabase.from('space_events').insert({ space_id: spaceId, kind: 'slow_down' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.spaceEvents(spaceId) }),
  });
}

/**
 * FEAT-4: posts the visible "reveal" notice into `space_events`. Mirrors
 * `useSendSlowDown` exactly — `actor_id` defaults to `auth.uid()` (see the
 * `space_events.actor_id` column default in migration
 * `014_resense_reveal_slowdown.sql`; a symbol reference, not `file:line`, so
 * it cannot go stale if the migration is reformatted). `networkMode:
 * 'always'` so offline fails visibly rather than queuing silently. Requires
 * migration 023 (widens the `kind` CHECK to admit `'reveal'`) to be applied
 * first; `space_reveals` remains the sole source of truth for reveal state —
 * this only carries the visible notice.
 */
export function useSendRevealEvent(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!spaceId) throw new Error('Not ready.');
      const { error } = await supabase.from('space_events').insert({ space_id: spaceId, kind: 'reveal' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.spaceEvents(spaceId) }),
  });
}
