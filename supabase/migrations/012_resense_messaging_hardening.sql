-- Migration: 012_resense_messaging_hardening
-- Mirror of remote hardening applied to project qzaieykseghxufjfgsmf.
-- Remediates Supabase advisor findings on the messaging/loop tables with no
-- change to app-visible behavior. Three groups:
--   1. RLS initplan: wrap auth.uid() as (select auth.uid()) → evaluated once per
--      query instead of once per row (performance at scale).
--   2. set_updated_at(): pin search_path (was mutable).
--   3. SECURITY DEFINER RPC surface: revoke EXECUTE from public/anon on functions
--      that should not be callable via /rest/v1/rpc. RLS-helper functions keep
--      EXECUTE for `authenticated` (RLS policies call them). This also closes a
--      de-anonymization vector: signal_author(uuid) was RPC-callable by anon,
--      letting anyone map a signal to its author's uuid.

-- 1. RLS initplan --------------------------------------------------------------
alter policy profiles_select_own on public.profiles using ((select auth.uid()) = user_id);
alter policy profiles_insert_own on public.profiles with check ((select auth.uid()) = user_id);
alter policy profiles_update_own on public.profiles using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy signals_select_own on public.signals using ((select auth.uid()) = author_id);
alter policy signals_insert_own on public.signals with check ((select auth.uid()) = author_id);

alter policy replies_select_participant on public.replies using (((select auth.uid()) = author_id) OR ((select auth.uid()) = signal_author(signal_id)));
alter policy replies_insert_own on public.replies with check (((select auth.uid()) = author_id) AND ((select auth.uid()) <> signal_author(signal_id)));

alter policy private_spaces_select_member on public.private_spaces using (((select auth.uid()) = user_a) OR ((select auth.uid()) = user_b));

-- messages_select_member uses is_space_member(space_id) (no direct auth.uid()) — unchanged.
alter policy messages_insert_member on public.messages with check (((select auth.uid()) = sender_id) AND is_space_member(space_id));

alter policy push_tokens_select_own on public.push_tokens using ((select auth.uid()) = user_id);
alter policy push_tokens_insert_own on public.push_tokens with check ((select auth.uid()) = user_id);
alter policy push_tokens_update_own on public.push_tokens using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy push_tokens_delete_own on public.push_tokens using ((select auth.uid()) = user_id);

-- 2. Pin search_path on the timestamp trigger ---------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();  -- now() resolves from pg_catalog even with empty search_path
  return new;
end;
$$;

-- 3. Reduce SECURITY DEFINER RPC surface --------------------------------------
-- Pure trigger/event functions: revoke everywhere except owner/service roles.
-- Triggers still fire (invoked by the trigger mechanism, not the caller).
revoke execute on function public.notify_message_push() from public, anon, authenticated;
revoke execute on function public.open_space()          from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()     from public, anon, authenticated;

-- RLS-helper functions: revoke from public + anon; authenticated MUST retain
-- EXECUTE or the messages/replies RLS policies raise "permission denied".
revoke execute on function public.is_space_member(uuid) from public, anon;
revoke execute on function public.signal_author(uuid)   from public, anon;

-- NOTE (intentionally NOT changed here):
--   * public_profiles / public_signals / space_overview are SECURITY DEFINER views.
--     They self-filter on auth.uid() and are the intentional anonymity pattern; the
--     0010 advisor ERROR is accepted.
--   * pg_net-in-public and leaked-password-protection are handled outside SQL.
