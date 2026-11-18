-- Migration: 021_resense_signal_delete_preserves_space
--
-- Reverses the "cascade included" product decision recorded in
-- 018_resense_delete_message_signal.sql:14-23. A private space, once opened, is
-- never destroyed as a side effect of deleting the board signal that spawned it:
-- the space detaches (signal_id -> NULL) and keeps its messages, reveals and
-- events. Verified beforehand (GATE-DB queries 1/3/6 + supabase/migrations):
--   * the cascade is purely the FK action -- there is no DELETE policy on
--     private_spaces, messages, space_reveals or space_events, and no app-level
--     delete path;
--   * NO RLS policy anywhere dereferences private_spaces.signal_id (they key on
--     user_a/user_b or private.is_space_member(space_id)), so nothing below
--     needs a policy rewrite;
--   * private_spaces_uniq (signal_id, user_b) stops constraining detached rows
--     once signal_id is nullable, which is safe: one-space-per-pair is
--     independently enforced by private_spaces_pair_key_uniq (010:46);
--   * open_space() (010:49-68) is unaffected -- its ON CONFLICT DO NOTHING is
--     unqualified and still resolves against pair_key_uniq.
--
-- Deliberately NOT changed here: replies.signal_id (009:45) still cascades, so
-- deleting a signal still removes its public replies. Only the private space is
-- protected, per the mission.
--
-- Rerunnable: the FK lookup is name-agnostic and guarded, DROP NOT NULL is a
-- no-op when already nullable, and the view is CREATE OR REPLACE.

-- ── 1) Drop the existing FK on private_spaces.signal_id ───────────────────────
-- Live name is private_spaces_signal_id_fkey (GATE-DB query 1;
-- services/database.types.ts:96,:103). The lookup stays name-agnostic so a rerun
-- against a differently-named constraint still works.
do $$
declare
  v_con text;
begin
  select c.conname
    into v_con
    from pg_constraint c
   where c.conrelid = 'public.private_spaces'::regclass
     and c.contype  = 'f'
     and c.conkey   = array[(select a.attnum
                               from pg_attribute a
                              where a.attrelid = 'public.private_spaces'::regclass
                                and a.attname  = 'signal_id')];
  if v_con is not null then
    execute format('alter table public.private_spaces drop constraint %I', v_con);
  end if;
end $$;

-- ── 2) ON DELETE SET NULL requires a nullable column (009:68 made it NOT NULL) ─
alter table public.private_spaces
  alter column signal_id drop not null;

-- ── 3) Re-add the FK under the canonical name, with SET NULL ──────────────────
alter table public.private_spaces
  add constraint private_spaces_signal_id_fkey
  foreign key (signal_id) references public.signals(id)
  on delete set null;

-- ── 4) space_overview must stop inner-joining signals ─────────────────────────
-- Without this the detached space survives in the table but disappears from the
-- Private tab for BOTH users -- the same bug via a different mechanism.
-- Body is 017:20-37 verbatim except the one join keyword. security_invoker is
-- stated explicitly because CREATE OR REPLACE VIEW replaces the view's
-- reloptions wholesale, and this definer view is the anonymity enforcement
-- point -- it must not silently become an invoker view.
create or replace view public.space_overview
with (security_invoker = false) as
select
  sp.id,
  sp.signal_id,
  sp.user_a,
  sp.user_b,
  pa.alias as alias_a,
  pb.alias as alias_b,
  s.text as signal_text,
  sp.created_at,
  (select m.text from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message,
  (select m.created_at from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_at,
  (select m.sender_id from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_sender_id
from public.private_spaces sp
join public.profiles pa on pa.user_id = sp.user_a
join public.profiles pb on pb.user_id = sp.user_b
left join public.signals s on s.id = sp.signal_id   -- was: join   (017:36)
where sp.user_a = auth.uid() or sp.user_b = auth.uid();

-- ── 5) Re-assert SELECT-only, exactly as 017:43-45 and 009:153-154 do ─────────
-- CREATE OR REPLACE VIEW does not reset grants, but re-asserting keeps the
-- invariant self-evident from this migration alone.
revoke insert, update, delete, truncate, references, trigger
  on public.space_overview
  from authenticated;
revoke all on public.space_overview from anon;
grant select on public.space_overview to authenticated;
