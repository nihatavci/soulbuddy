-- Migration: 015_resense_security_hardening
-- Follow-up from a Postgres/RLS best-practices audit of qzaieykseghxufjfgsmf (re:sense).
--
-- 1) CRITICAL FIX: public_profiles was a plain single-table view (no joins), which
--    Postgres auto-generates INSERT/UPDATE/DELETE rules for. It's owned by `postgres`
--    (rolbypassrls = true) and `authenticated` had been granted INSERT/UPDATE/DELETE on
--    it — meaning any signed-in user could write/delete ANY other user's `profiles` row
--    through the view, completely bypassing profiles_update_own / profiles_insert_own
--    RLS. That's a real anonymity-model breach, not just lint noise. Locked to SELECT-only.
--    public_signals / space_overview are join views (not auto-updatable) so this specific
--    exploit path didn't apply to them, but grants are tightened for consistency anyway.
--
-- 2) public_profiles / public_signals / space_overview stay SECURITY DEFINER on purpose:
--    profiles/signals RLS is "own row only" (profiles_select_own, signals_select_own), so
--    these curated, column-limited views are how a user reads another user's safe fields
--    (alias, intent, boundaries; visible signals; a shared private_space). Confirmed via
--    role simulation. Flipping to security_invoker would break the signal board, replies,
--    and private-space partner-alias display entirely. Kept as-is, writes locked down.
--
-- 3) is_space_member / i_have_revealed / signal_author are internal RLS helpers only
--    (no client code calls them via supabase.rpc — checked). They were SECURITY DEFINER
--    functions living in `public`, which PostgREST exposes as directly callable RPC
--    endpoints. Moved to a `private` schema (not in PostgREST's exposed schema list) so
--    they're usable inside policies but no longer part of the public API surface.
--
-- 4) Missing FK indexes on messages.sender_id, space_events.actor_id, space_reveals.user_id.
--
-- Not covered here:
-- - pg_net stays in `public` — this instance's pg_net does not support `SET SCHEMA`
--   (ERROR 0A000), and dropping/recreating the extension to relocate it risks breaking
--   anything depending on its net.* functions. Left as an accepted low-severity WARN.
-- - "Leaked password protection" is an Auth > Policies dashboard toggle, no SQL equivalent.

-- ---------------------------------------------------------------------------
-- 1) Lock the public_* / space_overview views down to SELECT-only for authenticated.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on public.public_profiles, public.public_signals, public.space_overview
  from authenticated;

-- ---------------------------------------------------------------------------
-- 2) Move internal-only RLS helper functions out of the PostgREST-exposed `public`
--    schema and into a private one, then repoint the policies that call them.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_space_member(p_space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.private_spaces sp
    where sp.id = p_space_id and (sp.user_a = auth.uid() or sp.user_b = auth.uid())
  );
$$;

create or replace function private.i_have_revealed(p_space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.space_reveals r
    where r.space_id = p_space_id and r.user_id = auth.uid()
  );
$$;

create or replace function private.signal_author(p_signal_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select author_id from public.signals where id = p_signal_id;
$$;

revoke all on function private.is_space_member(uuid) from public;
revoke all on function private.i_have_revealed(uuid) from public;
revoke all on function private.signal_author(uuid) from public;
grant execute on function private.is_space_member(uuid) to authenticated;
grant execute on function private.i_have_revealed(uuid) to authenticated;
grant execute on function private.signal_author(uuid) to authenticated;

-- Repoint dependent policies at the private.* versions.
drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select using (
  private.is_space_member(space_id)
);

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert with check (
  (select auth.uid()) = sender_id and private.is_space_member(space_id)
);

drop policy if exists replies_select_participant on public.replies;
create policy replies_select_participant on public.replies for select using (
  (select auth.uid()) = author_id or (select auth.uid()) = private.signal_author(signal_id)
);

drop policy if exists replies_insert_own on public.replies;
create policy replies_insert_own on public.replies for insert with check (
  (select auth.uid()) = author_id and (select auth.uid()) <> private.signal_author(signal_id)
);

drop policy if exists space_reveals_select on public.space_reveals;
create policy space_reveals_select on public.space_reveals for select using (
  user_id = (select auth.uid())
  or (private.is_space_member(space_id) and private.i_have_revealed(space_id))
);

drop policy if exists space_reveals_insert on public.space_reveals;
create policy space_reveals_insert on public.space_reveals for insert with check (
  user_id = (select auth.uid()) and private.is_space_member(space_id)
);

drop policy if exists space_events_select on public.space_events;
create policy space_events_select on public.space_events for select using (
  private.is_space_member(space_id)
);

drop policy if exists space_events_insert on public.space_events;
create policy space_events_insert on public.space_events for insert with check (
  actor_id = (select auth.uid()) and private.is_space_member(space_id)
);

-- Now safe to drop the old public-schema (RPC-exposed) versions.
drop function if exists public.is_space_member(uuid);
drop function if exists public.i_have_revealed(uuid);
drop function if exists public.signal_author(uuid);

-- ---------------------------------------------------------------------------
-- 3) Missing FK indexes.
-- ---------------------------------------------------------------------------
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists space_events_actor_id_idx on public.space_events (actor_id);
create index if not exists space_reveals_user_id_idx on public.space_reveals (user_id);
