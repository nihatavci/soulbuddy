-- Migration: 009_resense_signals_loop
-- Mirror of remote migration resense_signals_loop_v1 (project qzaieykseghxufjfgsmf).
-- signals → replies → resonance(private_spaces) → messages. Alias-first, RLS-gated,
-- Realtime on messages. Daily cap intentionally omitted (add later as BEFORE INSERT trigger).
--
-- NOTE ON ORDERING: the task brief's SQL defines the SECURITY DEFINER helper
-- functions (signal_author, is_space_member) before the tables they query.
-- Postgres validates LANGUAGE SQL function bodies (incl. resolving referenced
-- relations) at CREATE FUNCTION time, so that ordering fails with
-- `relation "public.signals" does not exist`. This file preserves every
-- statement from the brief verbatim but reorders so each helper function is
-- created immediately after the table it queries, and before any policy that
-- calls it. No SQL statement's content was altered.

-- ── signals ────────────────────────────────────────────────────────────────
create table public.signals (
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
create index signals_created_idx on public.signals (created_at desc);
create index signals_author_idx on public.signals (author_id);

alter table public.signals enable row level security;
create policy "signals_insert_own" on public.signals for insert with check (auth.uid() = author_id);
create policy "signals_select_own" on public.signals for select using (auth.uid() = author_id);
-- public reads go through public_signals view, never the base table.

-- ── SECURITY DEFINER helper (bypasses base-table RLS inside policies/views) ─
create or replace function public.signal_author(p_signal_id uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select author_id from public.signals where id = p_signal_id;
$$;

-- ── replies ──────────────────────────────────────────────────────────────
create table public.replies (
  id               uuid primary key default gen_random_uuid(),
  signal_id        uuid not null references public.signals(id) on delete cascade,
  author_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text             text not null,
  moderation_state text not null default 'visible',
  created_at       timestamptz not null default now(),
  constraint replies_text_len check (char_length(btrim(text)) between 1 and 120)
);
create index replies_signal_idx on public.replies (signal_id);
create index replies_author_idx on public.replies (author_id);

alter table public.replies enable row level security;
-- a reply is visible to its author OR to the parent signal's author
create policy "replies_select_participant" on public.replies for select using (
  auth.uid() = author_id or auth.uid() = public.signal_author(signal_id)
);
-- insert own, and never reply to your own signal
create policy "replies_insert_own" on public.replies for insert with check (
  auth.uid() = author_id and auth.uid() <> public.signal_author(signal_id)
);

-- ── private_spaces (resonance folded in) ──────────────────────────────────
create table public.private_spaces (
  id         uuid primary key default gen_random_uuid(),
  signal_id  uuid not null references public.signals(id) on delete cascade,
  user_a     uuid not null references auth.users(id) on delete cascade, -- signal author
  user_b     uuid not null references auth.users(id) on delete cascade, -- replier
  created_at timestamptz not null default now(),
  constraint private_spaces_distinct check (user_a <> user_b),
  constraint private_spaces_uniq unique (signal_id, user_b)
);
create index private_spaces_user_a_idx on public.private_spaces (user_a);
create index private_spaces_user_b_idx on public.private_spaces (user_b);

alter table public.private_spaces enable row level security;
create policy "private_spaces_select_member" on public.private_spaces for select
  using (auth.uid() = user_a or auth.uid() = user_b);
-- no insert/update/delete policy: rows are created ONLY by open_space() (definer).

-- ── SECURITY DEFINER helper (bypasses base-table RLS inside policies/views) ─
create or replace function public.is_space_member(p_space_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.private_spaces sp
    where sp.id = p_space_id and (sp.user_a = auth.uid() or sp.user_b = auth.uid())
  );
$$;

-- ── messages ──────────────────────────────────────────────────────────────
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.private_spaces(id) on delete cascade,
  sender_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now(),
  constraint messages_text_len check (char_length(btrim(text)) between 1 and 2000)
);
create index messages_space_idx on public.messages (space_id, created_at);

alter table public.messages enable row level security;
create policy "messages_select_member" on public.messages for select
  using (public.is_space_member(space_id));
create policy "messages_insert_member" on public.messages for insert
  with check (auth.uid() = sender_id and public.is_space_member(space_id));

-- ── the ONE resonance policy: auto-open a space on first reply ─────────────
create or replace function public.open_space()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select author_id into v_author from public.signals where id = new.signal_id;
  if v_author is null or v_author = new.author_id then
    return new; -- signal gone or self-reply: no space
  end if;
  insert into public.private_spaces (signal_id, user_a, user_b)
  values (new.signal_id, v_author, new.author_id)
  on conflict (signal_id, user_b) do nothing;
  return new;
end;
$$;

create trigger replies_open_space
  after insert on public.replies
  for each row execute function public.open_space();

-- ── public_signals: the board feed (definer → all visible signals) ────────
create view public.public_signals with (security_invoker = false) as
  select
    s.id, s.author_id, p.alias, s.format, s.text, s.created_at,
    (select count(*) from public.replies r where r.signal_id = s.id) as reply_count
  from public.signals s
  join public.profiles p on p.user_id = s.author_id
  where s.moderation_state = 'visible';
revoke all on public.public_signals from anon;
grant select on public.public_signals to authenticated;

-- ── space_overview: the caller's spaces (definer + auth.uid() predicate) ───
create view public.space_overview with (security_invoker = false) as
  select
    sp.id, sp.signal_id, sp.user_a, sp.user_b,
    pa.alias as alias_a, pb.alias as alias_b,
    s.text as signal_text, sp.created_at,
    (select m.text       from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message,
    (select m.created_at from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_at
  from public.private_spaces sp
  join public.profiles pa on pa.user_id = sp.user_a
  join public.profiles pb on pb.user_id = sp.user_b
  join public.signals  s  on s.id = sp.signal_id
  where sp.user_a = auth.uid() or sp.user_b = auth.uid();
revoke all on public.space_overview from anon;
grant select on public.space_overview to authenticated;

-- ── realtime: publish messages so subscribers get live inserts ─────────────
alter publication supabase_realtime add table public.messages;
