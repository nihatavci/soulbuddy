-- Migration: 024_resense_report_block
-- App Review Guideline 1.2: users can report objectionable content and block abusive users.
--
-- * public.blocks   - who blocked whom. Own rows only (RLS). Blocking is mutual in effect: neither
--                     side sees the other's signals, the pair's private space disappears from both
--                     Private lists, and neither can send messages or replies to the other.
-- * public.reports  - one row per report. Written ONLY through submit_report() (no insert policy),
--                     which validates the reporter, snapshots the reported text and reports the
--                     reported user's id. Nobody but the service role can read reports.
-- * Hiding is done in the database (views and policies), not in the client, so a stale or modified
--   client cannot show a blocked user's content.
--
-- NOT applied automatically: run it against the remote project after review.

-- ── blocks ────────────────────────────────────────────────────────────────
create table public.blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;
create policy blocks_select_own on public.blocks for select using ((select auth.uid()) = blocker_id);
create policy blocks_insert_own on public.blocks for insert with check ((select auth.uid()) = blocker_id);
create policy blocks_delete_own on public.blocks for delete using ((select auth.uid()) = blocker_id);

-- ── reports ───────────────────────────────────────────────────────────────
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  signal_id        uuid references public.signals(id) on delete set null,
  space_id         uuid references public.private_spaces(id) on delete set null,
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
create index reports_status_created_idx on public.reports (status, created_at);
create index reports_reported_user_idx on public.reports (reported_user_id);

-- RLS on with no policy: no client can read, insert, update or delete reports directly.
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

-- ── helpers (private schema, like 015) ────────────────────────────────────
create or replace function private.is_blocked_pair(p_a uuid, p_b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

create or replace function private.space_blocked(p_space_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.private_spaces sp
    where sp.id = p_space_id and private.is_blocked_pair(sp.user_a, sp.user_b)
  );
$$;

revoke all on function private.is_blocked_pair(uuid, uuid) from public;
revoke all on function private.space_blocked(uuid) from public;
grant execute on function private.is_blocked_pair(uuid, uuid) to authenticated;
grant execute on function private.space_blocked(uuid) to authenticated;

-- ── submit_report: the only way to write a report ─────────────────────────
create or replace function public.submit_report(
  p_reason    text,
  p_signal_id uuid default null,
  p_space_id  uuid default null,
  p_note      text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me       uuid := auth.uid();
  v_reported uuid;
  v_snapshot text;
  v_id       uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if (p_signal_id is null) = (p_space_id is null) then
    raise exception 'report exactly one of a signal or a private space';
  end if;

  if p_signal_id is not null then
    select s.author_id, left(s.text, 500) into v_reported, v_snapshot
    from public.signals s where s.id = p_signal_id;
    if v_reported is null then raise exception 'signal not found'; end if;
  else
    if not private.is_space_member(p_space_id) then raise exception 'not a member of this space'; end if;
    select case when sp.user_a = v_me then sp.user_b else sp.user_a end into v_reported
    from public.private_spaces sp where sp.id = p_space_id;
    -- the last 10 messages, oldest first, so the report stays usable if messages are deleted later
    select left(string_agg(m.text, E'\n' order by m.created_at), 2000) into v_snapshot
    from (
      select text, created_at from public.messages
      where space_id = p_space_id and deleted_at is null
      order by created_at desc limit 10
    ) m;
  end if;

  if v_reported = v_me then raise exception 'you cannot report yourself'; end if;

  insert into public.reports (reporter_id, reported_user_id, signal_id, space_id, reason, note, content_snapshot)
  values (v_me, v_reported, p_signal_id, p_space_id, p_reason, nullif(left(btrim(coalesce(p_note, '')), 500), ''), v_snapshot)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_report(text, uuid, uuid, text) from public, anon;
grant execute on function public.submit_report(text, uuid, uuid, text) to authenticated;

-- ── hide blocked users: board feed ────────────────────────────────────────
-- Body is 009 verbatim plus one predicate. security_invoker stays false (anonymity enforcement point).
create or replace view public.public_signals with (security_invoker = false) as
  select
    s.id, s.author_id, p.alias, s.format, s.text, s.created_at,
    (select count(*) from public.replies r where r.signal_id = s.id) as reply_count
  from public.signals s
  join public.profiles p on p.user_id = s.author_id
  where s.moderation_state = 'visible'
    and not private.is_blocked_pair((select auth.uid()), s.author_id);
revoke all on public.public_signals from anon;
revoke insert, update, delete, truncate, references, trigger on public.public_signals from authenticated;
grant select on public.public_signals to authenticated;

-- ── hide blocked users: the Private list ──────────────────────────────────
-- Body is 021 verbatim plus one predicate.
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
left join public.signals s on s.id = sp.signal_id
where (sp.user_a = auth.uid() or sp.user_b = auth.uid())
  and not private.is_blocked_pair(sp.user_a, sp.user_b);
revoke insert, update, delete, truncate, references, trigger on public.space_overview from authenticated;
revoke all on public.space_overview from anon;
grant select on public.space_overview to authenticated;

-- ── no replies or messages across a block ─────────────────────────────────
drop policy if exists replies_select_participant on public.replies;
create policy replies_select_participant on public.replies for select using (
  ((select auth.uid()) = author_id or (select auth.uid()) = private.signal_author(signal_id))
  and not private.is_blocked_pair((select auth.uid()), author_id)
);

drop policy if exists replies_insert_own on public.replies;
create policy replies_insert_own on public.replies for insert with check (
  (select auth.uid()) = author_id
  and (select auth.uid()) <> private.signal_author(signal_id)
  and not private.is_blocked_pair((select auth.uid()), private.signal_author(signal_id))
);

-- Body is 020 verbatim (qualified column names kept) plus the block check.
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert with check (
  (select auth.uid()) = sender_id
  and private.is_space_member(space_id)
  and not private.space_blocked(messages.space_id)
  and (
    messages.reply_to_id is null
    or exists (
      select 1 from public.messages m2
      where m2.id = messages.reply_to_id and m2.space_id = messages.space_id
    )
  )
);
