-- Migration: 020_resense_fix_reply_insert_check_qualifier
-- Fixes a real bug in 019's messages_insert_member policy that broke every
-- reply insert in production ("new row violates row-level security policy
-- for table \"messages\"").
--
-- Root cause: inside the EXISTS subquery, the unqualified `reply_to_id` and
-- `space_id` were meant to refer to the NEW row being inserted, but Postgres
-- resolves unqualified column names against the innermost scope first — and
-- the subquery's own alias `m2` also has columns named `reply_to_id` and
-- `space_id`. Both references silently rebound to `m2.reply_to_id` and
-- `m2.space_id`, turning the check into effectively
--   m2.id = m2.reply_to_id AND m2.space_id = m2.space_id
-- which is only true for a message that replies to itself — so the EXISTS
-- was false (and the insert rejected) for every real reply. Confirmed via
-- `pg_policies` against the live database.
--
-- Fix: qualify the new row's columns with the target table name
-- (`messages.reply_to_id`, `messages.space_id`), which Postgres resolves to
-- the row being checked rather than the subquery alias.

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert with check (
  (select auth.uid()) = sender_id
  and private.is_space_member(space_id)
  and (
    messages.reply_to_id is null
    or exists (
      select 1 from public.messages m2
      where m2.id = messages.reply_to_id and m2.space_id = messages.space_id
    )
  )
);
