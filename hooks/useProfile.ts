/**
 * useProfile
 *
 * Fetches and updates the current user's Supabase profile.
 *
 * Offline-first:
 *   - Cached profile is shown immediately from MMKV on cold start.
 *   - Stale after 5 min → background refetch.
 *   - Profile updates are optimistically applied; rolled back on error.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Profile } from '@/services/supabase';

// ─── Fetchers ──────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

async function upsertProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Returns the current user's Supabase profile.
 * Automatically disabled when the user is not authenticated.
 */
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey:  queryKeys.profile(userId),
    queryFn:   () => fetchProfile(userId),
    enabled:   !!userId,
    staleTime: 1000 * 60 * 5,   // 5 min
  });
}

/**
 * Mutation to update profile fields.
 * Optimistically updates the cache; rolls back on server error.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
      upsertProfile(userId, updates),

    // ── Optimistic update ──────────────────────────────────────────────
    onMutate: async (updates) => {
      const key = queryKeys.profile(userId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Profile>(key);

      qc.setQueryData<Profile | null>(key, (old) =>
        old ? { ...old, ...updates, updated_at: new Date().toISOString() } : old,
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(queryKeys.profile(userId), context.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

/**
 * Mark onboarding as complete.
 * Convenience wrapper around useUpdateProfile.
 */
export function useCompleteOnboarding() {
  const { mutateAsync, ...rest } = useUpdateProfile();
  return {
    completeOnboarding: () => mutateAsync({ onboarded: true }),
    ...rest,
  };
}
