-- Migration: 016_resense_push_token_exclusivity
-- Fixes: a device that has ever signed in as a different account (test devices
-- switching between multiple Apple IDs, or a real reinstall/re-login) left its
-- OLD user's push_tokens row in place forever, since RLS (auth.uid() = user_id)
-- correctly stops the client from touching another user's row. Two users could
-- therefore end up with the same Expo push token registered simultaneously —
-- observed live: token 'ExponentPushToken[REDACTED]' registered to
-- BOTH user-one@example.com (2026-07-23) and user-two@example.com (2026-08-30,
-- same physical device, new Sign in with Apple identity). Whichever of those
-- users a private-space message trigger resolved as "the other person" could
-- then push straight back to whoever currently holds that physical device,
-- including the sender themselves in a multi-account-on-one-device test session.
--
-- Fix: a token is physically one device, so it can belong to at most one user
-- at a time. Add a real UNIQUE constraint on token, and a SECURITY DEFINER RPC
-- that lets an authenticated user "claim" a token — deleting any other user's
-- stale row for that same token — since a plain client upsert cannot do this
-- (RLS correctly blocks touching another user's row, which is exactly why the
-- stale row was never cleaned up in the first place).

-- Pre-existing duplicates must be resolved before the UNIQUE constraint can be
-- added. Keep the most recently updated row per token (the current holder of
-- that device); drop the stale one(s).
delete from public.push_tokens pt
where exists (
  select 1 from public.push_tokens newer
  where newer.token = pt.token
    and (newer.updated_at, newer.user_id) > (pt.updated_at, pt.user_id)
);

alter table public.push_tokens
  add constraint push_tokens_token_unique unique (token);

create or replace function public.claim_push_token(p_token text, p_platform text default 'ios')
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Drop any OTHER user's claim on this physical token first (a token belongs
  -- to whoever currently holds the device, never to two people at once).
  delete from public.push_tokens
  where token = p_token and user_id <> auth.uid();

  insert into public.push_tokens (user_id, token, platform, updated_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (user_id, token) do update
    set platform = excluded.platform, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.claim_push_token(text, text) from public;
-- Supabase's default privileges on newly created public-schema functions grant
-- EXECUTE to anon directly (not just via the PUBLIC pseudo-role), so revoking
-- from PUBLIC alone leaves anon still able to call this — revoke it
-- explicitly. There's no legitimate anonymous caller: the function only does
-- anything useful once auth.uid() is non-null.
revoke execute on function public.claim_push_token(text, text) from anon;
grant execute on function public.claim_push_token(text, text) to authenticated;
