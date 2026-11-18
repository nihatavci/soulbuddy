/**
 * useSafety — report and block (App Review Guideline 1.2).
 *
 * Reports go through the `submit_report` RPC (migration 024), which validates the reporter and
 * snapshots the text server-side. Blocks are one row in `blocks`; the database then hides the
 * blocked user's signals and the shared private space (views + RLS), so after a block we only
 * refetch the board and the Private list.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import { useAuth } from '@/context/AuthContext';

export const REPORT_REASONS = ['spam', 'harassment', 'sexual', 'hate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Exactly one target: a board signal or a private space. */
export type ReportTarget = { signalId: string; spaceId?: never } | { spaceId: string; signalId?: never };

export function useReport() {
  return useMutation<void, Error, ReportTarget & { reason: ReportReason; note?: string }>({
    mutationFn: async ({ reason, note, signalId, spaceId }) => {
      const { error } = await supabase.rpc('submit_report', {
        p_reason: reason,
        p_signal_id: signalId,
        p_space_id: spaceId,
        p_note: note,
      });
      if (error) throw new Error(error.message);
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation<void, Error, string>({
    mutationFn: async (blockedId: string) => {
      // blocker_id defaults to auth.uid() server-side. Blocking someone twice is a no-op.
      const { error } = await supabase.from('blocks').upsert({ blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
      if (user?.id) qc.invalidateQueries({ queryKey: queryKeys.spaces(user.id) });
    },
  });
}
