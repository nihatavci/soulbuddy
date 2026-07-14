-- Migration: 010_resense_one_space_per_pair
-- Mirror of remote migration resense_one_space_per_pair (project qzaieykseghxufjfgsmf).
--
-- Bug: open_space() created a NEW private_space per signal reply, so the same two
-- people accumulated multiple disconnected threads — messages scattered across them
-- and users opened empty duplicate spaces. Collapse to ONE canonical space per
-- unordered user pair, merge existing duplicates, and make open_space() reuse it.

-- 1) Merge existing duplicates: keep the earliest space per pair, repoint its
--    messages to the keeper, then delete the extras. Repoint BEFORE delete because
--    messages.space_id cascades on delete.
with ranked as (
  select id,
    least(user_a::text, user_b::text) || '|' || greatest(user_a::text, user_b::text) as pk,
    row_number() over (
      partition by least(user_a::text, user_b::text) || '|' || greatest(user_a::text, user_b::text)
      order by created_at asc
    ) as rn
  from public.private_spaces
),
keepers as (select pk, id as keep_id from ranked where rn = 1)
update public.messages m
set space_id = k.keep_id
from ranked r
join keepers k on k.pk = r.pk
where r.rn > 1 and m.space_id = r.id;

with ranked as (
  select id,
    row_number() over (
      partition by least(user_a::text, user_b::text) || '|' || greatest(user_a::text, user_b::text)
      order by created_at asc
    ) as rn
  from public.private_spaces
)
delete from public.private_spaces ps
using ranked r
where ps.id = r.id and r.rn > 1;

-- 2) Canonical unordered-pair key + uniqueness (no two spaces share a pair).
alter table public.private_spaces
  add column pair_key text generated always as (
    least(user_a::text, user_b::text) || '|' || greatest(user_a::text, user_b::text)
  ) stored;

create unique index private_spaces_pair_key_uniq on public.private_spaces (pair_key);

-- 3) open_space() reuses the pair's existing space instead of creating a new one.
create or replace function public.open_space()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_author uuid;
  v_pair   text;
begin
  select author_id into v_author from public.signals where id = new.signal_id;
  if v_author is null or v_author = new.author_id then
    return new; -- signal gone or self-reply: no space
  end if;
  v_pair := least(v_author::text, new.author_id::text) || '|' || greatest(v_author::text, new.author_id::text);
  if exists (select 1 from public.private_spaces where pair_key = v_pair) then
    return new; -- these two already share a space; reuse it
  end if;
  insert into public.private_spaces (signal_id, user_a, user_b)
  values (new.signal_id, v_author, new.author_id)
  on conflict do nothing;
  return new;
end;
$$;
