-- 023_resense_space_events_reveal_kind.sql
--
-- FEAT-4: allow a second space_events kind, 'reveal', so a reveal can post a
-- visible, tappable notice into the private-space thread.
--
-- SCOPE DISCIPLINE — read before changing this file:
--   * public.space_reveals remains the SOLE source of truth for reveal state.
--     space_events carries only the visible notice. Exactly one reveal
--     mechanism exists after this migration.
--   * NO COLUMN IS ADDED. space_events stays content-free (id, space_id,
--     actor_id, kind, created_at — see 014:42-48) so a real first name can
--     never ride on an event row. That property is what makes the one-sided
--     disclosure acceptable at all; do not weaken it later without re-opening
--     FORK-4 Q2.
--   * No RLS policy is touched. space_reveals' mutual gate (015:98-102) is
--     unchanged, so the name stays gated until reciprocation.
--   * No `supabase gen types` re-run is required: services/database.types.ts:245
--     already types `kind` as plain `string`.

-- The CHECK at 014:46 is declared INLINE, so its name is server-assigned.
-- GATE-DB observed 'space_events_kind_check' live, but never issue a DROP
-- against a guessed name — resolve it from the catalog instead. The FOR loop
-- (rather than SELECT INTO) makes this safe when zero constraints match, and
-- correct if more than one ever does.
do $$
declare
  v_con text;
begin
  for v_con in
    select conname
    from pg_constraint
    where conrelid = 'public.space_events'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
      and pg_get_constraintdef(oid) ilike '%slow_down%'
  loop
    execute format('alter table public.space_events drop constraint %I', v_con);
  end loop;
end $$;

alter table public.space_events
  add constraint space_events_kind_check
  check (kind in ('slow_down', 'reveal'));
