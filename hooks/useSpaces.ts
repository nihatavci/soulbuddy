/**
 * useSpaces — the caller's private spaces (opened resonances). Reads space_overview
 * (definer view scoped to auth.uid()), newest-activity first.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { SpaceOverview } from '@/services/supabase';

async function fetchSpaces(): Promise<SpaceOverview[]> {
  const { data, error } = await supabase
    .from('space_overview').select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SpaceOverview[];
}

export function usePrivateSpaces() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.spaces(userId),
    queryFn: fetchSpaces,
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

/** The alias of the OTHER person in a space, given my user id. */
export function otherAlias(space: SpaceOverview, userId: string): string {
  return space.user_a === userId ? (space.alias_b ?? '') : (space.alias_a ?? '');
}
