-- Migration: 014_resense_reveal_slowdown
-- Mirror of remote change to project qzaieykseghxufjfgsmf.
-- Mutual identity reveal + a lightweight "slow down" pace signal for private spaces.
--
-- Reveal is STRICTLY mutual: you see your own reveal row always, but the OTHER member's
-- row (their first name + verified-18+) only once you've also revealed. Enforced in RLS
-- via i_have_revealed() — a SECURITY DEFINER helper (bypasses RLS to avoid the
-- space_reveals SELECT policy recursing on its own table). Verified by role simulation:
-- A sees 0 rows before revealing, 2 after — never one-sided.

create table public.space_reveals (
  space_id     uuid not null references public.private_spaces(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  first_name   text check (first_name is null or char_length(btrim(first_name)) between 1 and 40),
  age_verified boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (space_id, user_id)
);
alter table public.space_reveals enable row level security;

create or replace function public.i_have_revealed(p_space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.space_reveals r
    where r.space_id = p_space_id and r.user_id = auth.uid()
  );
$$;

create policy space_reveals_select on public.space_reveals for select using (
  user_id = (select auth.uid())
  OR (is_space_member(space_id) AND i_have_revealed(space_id))
);
create policy space_reveals_insert on public.space_reveals for insert with check (
  user_id = (select auth.uid()) AND is_space_member(space_id)
);
create policy space_reveals_update on public.space_reveals for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy space_reveals_delete on public.space_reveals for delete
  using (user_id = (select auth.uid()));

-- lightweight signals both members see (e.g. a 'slow down' nudge)
create table public.space_events (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.private_spaces(id) on delete cascade,
  actor_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('slow_down')),
  created_at timestamptz not null default now()
);
create index space_events_space_idx on public.space_events (space_id, created_at);
alter table public.space_events enable row level security;
create policy space_events_select on public.space_events for select using (is_space_member(space_id));
create policy space_events_insert on public.space_events for insert with check (
  actor_id = (select auth.uid()) AND is_space_member(space_id)
);

-- RLS-helper RPC lock-down (like is_space_member / signal_author): anon can't call it.
revoke execute on function public.i_have_revealed(uuid) from public, anon;
grant  execute on function public.i_have_revealed(uuid) to authenticated;

alter publication supabase_realtime add table public.space_reveals;
alter publication supabase_realtime add table public.space_events;
