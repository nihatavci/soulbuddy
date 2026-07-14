-- Migration: 008_resense_profiles
-- re:sense Phase 1 identity backbone — MIRROR of the migration applied to the
-- remote re:sense project (ref qzaieykseghxufjfgsmf) via MCP `apply_migration`
-- (migration name: resense_profiles_v1). Source of truth is the applied remote
-- migration; this file exists for repo history. Do NOT re-apply 001..007 (archived
-- SoulBuddy migrations, never applied to this project).
--
-- Alias-first public.profiles + owner-only RLS + column-limited public_profiles
-- view. Establishes IDEN-04 at the schema level: another user's alias IS readable
-- via public_profiles while no query path exposes their email or identity.

-- ─── updated_at trigger fn ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Table: public.profiles (one row per user, alias-first, no identity) ───────
create table public.profiles (
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
    array_length(intent, 1) >= 1
    and intent <@ array['date','slow_burn','conversation','maybe']::text[]
  ),
  constraint profiles_boundaries_valid check (
    array_length(boundaries, 1) >= 1
    and boundaries <@ array['no_explicit_content','not_looking_to_meet_yet','go_slow','text_only']::text[]
  )
);

-- case-insensitive alias uniqueness
create unique index profiles_alias_lower_key on public.profiles (lower(alias));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── RLS: owner-only, keyed on auth.uid() = user_id (IDEN-04 spine) ───────────
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- (no delete policy in v1)

-- ─── Column-limited public view (DEFAULT security-definer — load-bearing) ─────
-- Default (security-definer) so it bypasses profiles' owner-only RLS and returns
-- EVERY user's alias row; exposes ONLY the 4 whitelisted columns; never joins auth.users.
-- An invoker-rights view would inherit the owner-only base policy and return only
-- the caller's own row, breaking the "read others' aliases" half of IDEN-04.
create view public.public_profiles as
  select user_id, alias, intent, boundaries
  from public.profiles;

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;
