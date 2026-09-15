/**
 * useSpaces — the caller's private spaces (opened resonances). Reads space_overview
 * (definer view scoped to auth.uid()), newest-activity first.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { SpaceOverview } from '@/services/supabase';

type ActivityKeyed = Pick<SpaceOverview, 'last_message_at' | 'created_at'>;

/** Coalesced activity timestamp for sorting: last_message_at, falling back to
 * created_at. A brand-new message-less space has no last_message_at, so without
 * this fallback it would sort as if it had no activity at all and get buried at
 * the bottom — the actual FEAT-3 ordering bug (`nullsFirst: false` on a null
 * last_message_at). Missing/unparseable values sort as epoch 0 (oldest).
 * Exported (FEAT-3 §6.4 coverage floor) so it is directly unit-testable
 * without going through the full comparator. */
export function activityKey(space: ActivityKeyed): number {
  const iso = space.last_message_at ?? space.created_at ?? null;
  if (!iso) return 0;
  const parsed = new Date(iso).getTime();
  // An unparseable-but-truthy string (e.g. a malformed timestamp) must not
  // leak NaN into the comparator below: NaN - NaN and NaN - <number> are both
  // NaN, which Array.prototype.sort treats as "unordered", making the sort
  // input-order dependent (non-transitive) instead of the stable, deterministic
  // order this fix exists to guarantee.
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest activity first — pure, client-side, no DB column required. Exported
 * so it is directly unit-testable (roadmap FEAT-3 §6.4 coverage floor). */
export function compareSpacesByActivity(a: ActivityKeyed, b: ActivityKeyed): number {
  return activityKey(b) - activityKey(a);
}

async function fetchSpaces(): Promise<SpaceOverview[]> {
  const { data, error } = await supabase
    .from('space_overview').select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as SpaceOverview[]).sort(compareSpacesByActivity);
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
