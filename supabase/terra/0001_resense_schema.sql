-- re:sense on Terra: 0001 - the whole backend in schema `resense` (final state of old migrations 008-024).
--
-- Why this file exists: re:sense talks to Supabase straight from the phone (Data API + RLS + Realtime), unlike Pauci and
-- ReCurate, which sit behind their own server. So unlike their schemas, `resense` IS exposed to the Data API
-- (PGRST_DB_SCHEMAS) - see RUNBOOK.md. Everything in it is therefore RLS-gated or reached through definer views/functions.
--
-- Run ONCE on the shared Terra database by the database admin, as supabase_admin (owner of the definer functions; it
-- bypasses RLS, which the views and helpers rely on). Agents never run it against a remote database:
--   psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -f supabase/terra/0001_resense_schema.sql
-- Needs: portfolio.join_app / portfolio.leave_app (scripts/portfolio/sql/0001 in master-template), the `net` schema (pg_net)
-- and the `supabase_realtime` publication. Tested locally against Postgres 16: supabase/terra/verify.sh.
--
-- Differences from the old project, on purpose:
--  * Helpers live in `resense_private` (not exposed), so they never become /rpc endpoints. Old name: `private`.
--  * Terra's `auth.users` is SHARED with other apps. Account deletion goes through portfolio.leave_app (resense_delete_my_account
--    below), never an admin deleteUser, so deleting a re:sense account cannot delete someone's Pauci or ReCurate sign-in.
--  * A profile row joins the user to the `resense` app (portfolio.join_app), so the weekly orphan sweep keeps them.
--  * Nothing is granted to anon. Every table grant below is the minimum the app uses; RLS does the row filtering.
begin;

create schema if not exists resense;
create schema if not exists resense_private;
revoke all on schema resense from public;
revoke all on schema resense_private from public;
grant usage on schema resense to authenticated;
grant usage on schema resense_private to authenticated;

-- ── profiles ──────────────────────────────────────────────────────────────
create table resense.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  alias            text not null,
  intent           text[] not null default '{}',
  boundaries       text[] not null default '{}',
  age_confirmed_at timestamptz,
  onboarded        boolean not null default false,
  trust_level      smallint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_alias_len check (char_length(btrim(alias)) between 3 and 20),
  constraint profiles_intent_valid check (
    array_length(intent, 1) >= 1 and intent <@ array['date','slow_burn','conversation','maybe']::text[]),
  constraint profiles_boundaries_valid check (
    array_length(boundaries, 1) >= 1
    and boundaries <@ array['no_explicit_content','not_looking_to_meet_yet','go_slow','text_only']::text[])
);
create unique index profiles_alias_lower_key on resense.profiles (lower(alias));

create function resense_private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_set_updated_at before update on resense.profiles
  for each row execute function resense_private.set_updated_at();

-- A profile means "this person uses re:sense": record it in the shared sign-in registry (see header).
create function resense_private.join_portfolio() returns trigger
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  perform portfolio.join_app(new.user_id, 'resense');
  return new;
end $$;
create trigger profiles_join_portfolio after insert on resense.profiles
  for each row execute function resense_private.join_portfolio();

alter table resense.profiles enable row level security;
create policy profiles_select_own on resense.profiles for select using ((select auth.uid()) = user_id);
create policy profiles_insert_own on resense.profiles for insert with check ((select auth.uid()) = user_id);
create policy profiles_update_own on resense.profiles for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── signals ───────────────────────────────────────────────────────────────
create table resense.signals (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text             text not null,
  format           text not null,
  moderation_state text not null default 'visible',
  created_at       timestamptz not null default now(),
  expires_at       timestamptz,
  constraint signals_text_len check (char_length(btrim(text)) between 1 and 120),
  constraint signals_format_valid check (format in ('feeling','place','memory','thought')),
  constraint signals_moderation_valid check (moderation_state in ('visible','hidden'))
);
create index signals_created_idx on resense.signals (created_at desc);
create index signals_author_idx on resense.signals (author_id);
alter table resense.signals enable row level security;
create policy signals_select_own on resense.signals for select using ((select auth.uid()) = author_id);
create policy signals_insert_own on resense.signals for insert with check ((select auth.uid()) = author_id);
create policy signals_delete_own on resense.signals for delete using ((select auth.uid()) = author_id);

create function resense_private.signal_author(p_signal_id uuid) returns uuid
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select author_id from resense.signals where id = p_signal_id;
$$;

-- ── blocks (before replies: their policies use it) ────────────────────────
create table resense.blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on resense.blocks (blocked_id);
alter table resense.blocks enable row level security;
create policy blocks_select_own on resense.blocks for select using ((select auth.uid()) = blocker_id);
create policy blocks_insert_own on resense.blocks for insert with check ((select auth.uid()) = blocker_id);
create policy blocks_delete_own on resense.blocks for delete using ((select auth.uid()) = blocker_id);

create function resense_private.is_blocked_pair(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select exists (
    select 1 from resense.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b) or (b.blocker_id = p_b and b.blocked_id = p_a));
$$;

-- ── replies ───────────────────────────────────────────────────────────────
create table resense.replies (
  id               uuid primary key default gen_random_uuid(),
  signal_id        uuid not null references resense.signals(id) on delete cascade,
  author_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text             text not null,
  moderation_state text not null default 'visible',
  created_at       timestamptz not null default now(),
  constraint replies_text_len check (char_length(btrim(text)) between 1 and 120)
);
create index replies_signal_idx on resense.replies (signal_id);
create index replies_author_idx on resense.replies (author_id);
alter table resense.replies enable row level security;
create policy replies_select_participant on resense.replies for select using (
  ((select auth.uid()) = author_id or (select auth.uid()) = resense_private.signal_author(signal_id))
  and not resense_private.is_blocked_pair((select auth.uid()), author_id));
create policy replies_insert_own on resense.replies for insert with check (
  (select auth.uid()) = author_id
  and (select auth.uid()) <> resense_private.signal_author(signal_id)
  and not resense_private.is_blocked_pair((select auth.uid()), resense_private.signal_author(signal_id)));

-- ── private_spaces: ONE space per pair, created by the first reply ────────
create table resense.private_spaces (
  id         uuid primary key default gen_random_uuid(),
  signal_id  uuid references resense.signals(id) on delete set null,
  user_a     uuid not null references auth.users(id) on delete cascade, -- signal author
  user_b     uuid not null references auth.users(id) on delete cascade, -- replier
  created_at timestamptz not null default now(),
  pair_key   text generated always as (least(user_a::text, user_b::text) || '|' || greatest(user_a::text, user_b::text)) stored,
  constraint private_spaces_distinct check (user_a <> user_b),
  constraint private_spaces_uniq unique (signal_id, user_b)
);
create unique index private_spaces_pair_key_uniq on resense.private_spaces (pair_key);
create index private_spaces_user_a_idx on resense.private_spaces (user_a);
create index private_spaces_user_b_idx on resense.private_spaces (user_b);
alter table resense.private_spaces enable row level security;
create policy private_spaces_select_member on resense.private_spaces for select
  using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);
-- no insert/update/delete policy: rows are created ONLY by open_space() below.

create function resense_private.is_space_member(p_space_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select exists (select 1 from resense.private_spaces sp
    where sp.id = p_space_id and (sp.user_a = auth.uid() or sp.user_b = auth.uid()));
$$;
create function resense_private.space_blocked(p_space_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select exists (select 1 from resense.private_spaces sp
    where sp.id = p_space_id and resense_private.is_blocked_pair(sp.user_a, sp.user_b));
$$;

create function resense_private.open_space() returns trigger
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_author uuid; v_pair text;
begin
  select author_id into v_author from resense.signals where id = new.signal_id;
  if v_author is null or v_author = new.author_id then return new; end if; -- signal gone or self-reply
  v_pair := least(v_author::text, new.author_id::text) || '|' || greatest(v_author::text, new.author_id::text);
  if exists (select 1 from resense.private_spaces where pair_key = v_pair) then return new; end if; -- reuse
  insert into resense.private_spaces (signal_id, user_a, user_b) values (new.signal_id, v_author, new.author_id)
  on conflict do nothing;
  return new;
end $$;
create trigger replies_open_space after insert on resense.replies
  for each row execute function resense_private.open_space();

-- ── messages ──────────────────────────────────────────────────────────────
create table resense.messages (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references resense.private_spaces(id) on delete cascade,
  sender_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  reply_to_id uuid references resense.messages(id) on delete set null,
  constraint messages_text_len check (char_length(btrim(text)) between 1 and 2000)
);
create index messages_space_idx on resense.messages (space_id, created_at);
create index messages_sender_id_idx on resense.messages (sender_id);
create index messages_reply_to_id_idx on resense.messages (reply_to_id);
alter table resense.messages enable row level security;
create policy messages_select_member on resense.messages for select using (resense_private.is_space_member(space_id));
create policy messages_insert_member on resense.messages for insert with check (
  (select auth.uid()) = sender_id
  and resense_private.is_space_member(space_id)
  and not resense_private.space_blocked(messages.space_id)
  and (messages.reply_to_id is null or exists (
    select 1 from resense.messages m2 where m2.id = messages.reply_to_id and m2.space_id = messages.space_id)));
create policy messages_update_own on resense.messages for update
  using ((select auth.uid()) = sender_id) with check ((select auth.uid()) = sender_id);

-- ── reveals and space events ──────────────────────────────────────────────
create table resense.space_reveals (
  space_id     uuid not null references resense.private_spaces(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  first_name   text check (first_name is null or char_length(btrim(first_name)) between 1 and 40),
  age_verified boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index space_reveals_user_id_idx on resense.space_reveals (user_id);
alter table resense.space_reveals enable row level security;

create function resense_private.i_have_revealed(p_space_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select exists (select 1 from resense.space_reveals r where r.space_id = p_space_id and r.user_id = auth.uid());
$$;
-- Reveal is STRICTLY mutual: you see the other member's row only once you have revealed too.
create policy space_reveals_select on resense.space_reveals for select using (
  user_id = (select auth.uid())
  or (resense_private.is_space_member(space_id) and resense_private.i_have_revealed(space_id)));
create policy space_reveals_insert on resense.space_reveals for insert with check (
  user_id = (select auth.uid()) and resense_private.is_space_member(space_id));
create policy space_reveals_update on resense.space_reveals for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy space_reveals_delete on resense.space_reveals for delete using (user_id = (select auth.uid()));

create table resense.space_events (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references resense.private_spaces(id) on delete cascade,
  actor_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null,
  created_at timestamptz not null default now(),
  constraint space_events_kind_check check (kind in ('slow_down', 'reveal'))
);
create index space_events_space_idx on resense.space_events (space_id, created_at);
create index space_events_actor_id_idx on resense.space_events (actor_id);
alter table resense.space_events enable row level security;
create policy space_events_select on resense.space_events for select using (resense_private.is_space_member(space_id));
create policy space_events_insert on resense.space_events for insert with check (
  actor_id = (select auth.uid()) and resense_private.is_space_member(space_id));

-- ── push tokens ───────────────────────────────────────────────────────────
create table resense.push_tokens (
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null,
  platform   text not null default 'ios',
  updated_at timestamptz not null default now(),
  primary key (user_id, token),
  constraint push_tokens_token_unique unique (token)
);
alter table resense.push_tokens enable row level security;
create policy push_tokens_select_own on resense.push_tokens for select using ((select auth.uid()) = user_id);
create policy push_tokens_insert_own on resense.push_tokens for insert with check ((select auth.uid()) = user_id);
create policy push_tokens_update_own on resense.push_tokens for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy push_tokens_delete_own on resense.push_tokens for delete using ((select auth.uid()) = user_id);

-- A token is one physical device: whoever holds it now owns it.
create function resense.claim_push_token(p_token text, p_platform text default 'ios') returns void
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from resense.push_tokens where token = p_token and user_id <> auth.uid();
  insert into resense.push_tokens (user_id, token, platform, updated_at) values (auth.uid(), p_token, p_platform, now())
  on conflict (user_id, token) do update set platform = excluded.platform, updated_at = excluded.updated_at;
end $$;

-- Push on a new message: alias only, never message content.
create function resense_private.notify_message_push() returns trigger
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_recipient uuid; v_alias text; v_token text;
begin
  select case when ps.user_a = new.sender_id then ps.user_b else ps.user_a end into v_recipient
  from resense.private_spaces ps where ps.id = new.space_id;
  if v_recipient is null then return new; end if;
  select alias into v_alias from resense.profiles where user_id = new.sender_id;
  v_alias := coalesce(nullif(btrim(v_alias), ''), 'someone');
  for v_token in select token from resense.push_tokens where user_id = v_recipient loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('to', v_token, 'title', 're:sense', 'body', 'New message from ' || v_alias,
                   'sound', 'default', 'badge', 1, 'data', jsonb_build_object('spaceId', new.space_id::text)));
  end loop;
  return new;
end $$;
create trigger messages_notify_push after insert on resense.messages
  for each row execute function resense_private.notify_message_push();

-- Push to the signal author when a reply opens a space. A failed push must never roll back the reply.
create function resense_private.notify_space_opened() returns trigger
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_alias text; v_token text;
begin
  select alias into v_alias from resense.profiles where user_id = new.user_b;
  v_alias := coalesce(nullif(btrim(v_alias), ''), 'someone');
  for v_token in select token from resense.push_tokens where user_id = new.user_a loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('to', v_token, 'title', 're:sense',
                   'body', v_alias || ' added to your signal - a private space just opened',
                   'sound', 'default', 'badge', 1, 'data', jsonb_build_object('spaceId', new.id::text)));
  end loop;
  return new;
exception when others then
  raise warning 'notify_space_opened failed for space %: %', new.id, sqlerrm;
  return new;
end $$;
create trigger private_spaces_notify_push after insert on resense.private_spaces
  for each row execute function resense_private.notify_space_opened();

-- ── reports: written only through resense.submit_report ──────────────────
create table resense.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  signal_id        uuid references resense.signals(id) on delete set null,
  space_id         uuid references resense.private_spaces(id) on delete set null,
  reason           text not null,
  note             text,
  content_snapshot text,
  status           text not null default 'open',
  created_at       timestamptz not null default now(),
  constraint reports_reason_valid check (reason in ('spam', 'harassment', 'sexual', 'hate', 'other')),
  constraint reports_status_valid check (status in ('open', 'actioned', 'dismissed')),
  constraint reports_one_target check ((signal_id is not null) <> (space_id is not null)),
  constraint reports_note_len check (note is null or char_length(note) <= 500)
);
create index reports_status_created_idx on resense.reports (status, created_at);
create index reports_reported_user_idx on resense.reports (reported_user_id);
alter table resense.reports enable row level security; -- no policy, no grant: clients cannot touch it

create function resense.submit_report(p_reason text, p_signal_id uuid default null, p_space_id uuid default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_me uuid := auth.uid(); v_reported uuid; v_snapshot text; v_id uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if (p_signal_id is null) = (p_space_id is null) then
    raise exception 'report exactly one of a signal or a private space';
  end if;
  if p_signal_id is not null then
    select s.author_id, left(s.text, 500) into v_reported, v_snapshot from resense.signals s where s.id = p_signal_id;
    if v_reported is null then raise exception 'signal not found'; end if;
  else
    if not resense_private.is_space_member(p_space_id) then raise exception 'not a member of this space'; end if;
    select case when sp.user_a = v_me then sp.user_b else sp.user_a end into v_reported
    from resense.private_spaces sp where sp.id = p_space_id;
    select left(string_agg(m.text, E'\n' order by m.created_at), 2000) into v_snapshot
    from (select text, created_at from resense.messages
          where space_id = p_space_id and deleted_at is null order by created_at desc limit 10) m;
  end if;
  if v_reported = v_me then raise exception 'you cannot report yourself'; end if;
  insert into resense.reports (reporter_id, reported_user_id, signal_id, space_id, reason, note, content_snapshot)
  values (v_me, v_reported, p_signal_id, p_space_id, p_reason, nullif(left(btrim(coalesce(p_note, '')), 500), ''), v_snapshot)
  returning id into v_id;
  return v_id;
end $$;

-- ── account deletion (Apple 5.1.1(v)) on a SHARED sign-in ─────────────────
-- Removes this user's re:sense data, then leaves the app in the portfolio registry. The shared auth.users row (and its
-- sessions) is deleted only when re:sense was the last app they used; otherwise it stays for Pauci / ReCurate.
-- Returns true when the sign-in record is gone too (the client signs out either way).
create function resense.delete_my_account() returns boolean
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  delete from resense.reports where reporter_id = v_me or reported_user_id = v_me;
  delete from resense.private_spaces where user_a = v_me or user_b = v_me; -- messages, reveals, events cascade
  delete from resense.signals where author_id = v_me;                       -- replies cascade
  delete from resense.replies where author_id = v_me;
  delete from resense.push_tokens where user_id = v_me;
  delete from resense.blocks where blocker_id = v_me or blocked_id = v_me;
  delete from resense.profiles where user_id = v_me;
  return portfolio.leave_app(v_me, 'resense');
end $$;

-- ── views: the only way to read other people's safe fields ────────────────
-- security_invoker = false on purpose: profiles/signals RLS is "own rows only"; these column-limited views self-filter on
-- auth.uid() and are how the board and the Private list work without exposing identity.
create view resense.public_profiles with (security_invoker = false) as
  select user_id, alias, intent, boundaries from resense.profiles;

create view resense.public_signals with (security_invoker = false) as
  select s.id, s.author_id, p.alias, s.format, s.text, s.created_at,
         (select count(*) from resense.replies r where r.signal_id = s.id) as reply_count
  from resense.signals s
  join resense.profiles p on p.user_id = s.author_id
  where s.moderation_state = 'visible'
    and not resense_private.is_blocked_pair((select auth.uid()), s.author_id);

create view resense.space_overview with (security_invoker = false) as
select
  sp.id, sp.signal_id, sp.user_a, sp.user_b,
  pa.alias as alias_a, pb.alias as alias_b,
  s.text as signal_text, sp.created_at,
  (select m.text from resense.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message,
  (select m.created_at from resense.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_at,
  (select m.sender_id from resense.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_sender_id
from resense.private_spaces sp
join resense.profiles pa on pa.user_id = sp.user_a
join resense.profiles pb on pb.user_id = sp.user_b
left join resense.signals s on s.id = sp.signal_id
where (sp.user_a = auth.uid() or sp.user_b = auth.uid())
  and not resense_private.is_blocked_pair(sp.user_a, sp.user_b);

-- ── grants: the minimum the app uses (nothing for anon) ───────────────────
revoke all on all tables in schema resense from public, anon, authenticated;
grant select, insert, update          on resense.profiles      to authenticated;
grant select, insert, delete          on resense.signals       to authenticated;
grant select, insert                  on resense.replies       to authenticated;
grant select                          on resense.private_spaces to authenticated;
grant select, insert, update          on resense.messages      to authenticated;
grant select, insert, update, delete  on resense.space_reveals to authenticated;
grant select, insert                  on resense.space_events  to authenticated;
grant select, insert, update, delete  on resense.push_tokens   to authenticated;
grant select, insert, delete          on resense.blocks        to authenticated;
grant select on resense.public_profiles, resense.public_signals, resense.space_overview to authenticated;

revoke all on all functions in schema resense from public, anon, authenticated;
revoke all on all functions in schema resense_private from public, anon, authenticated;
-- RLS helpers run inside policies as the caller, so authenticated needs EXECUTE (not anon).
grant execute on function resense_private.is_space_member(uuid), resense_private.i_have_revealed(uuid),
  resense_private.signal_author(uuid), resense_private.is_blocked_pair(uuid, uuid), resense_private.space_blocked(uuid)
  to authenticated;
-- The RPCs the app calls.
grant execute on function resense.claim_push_token(text, text), resense.submit_report(text, uuid, uuid, text),
  resense.delete_my_account() to authenticated;

-- ── realtime: the tables the app subscribes to ────────────────────────────
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime not found - add the tables by hand';
    return;
  end if;
  foreach t in array array['replies', 'private_spaces', 'messages', 'space_reveals', 'space_events'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'resense' and tablename = t) then
      execute format('alter publication supabase_realtime add table resense.%I', t);
    end if;
  end loop;
end $$;

commit;
