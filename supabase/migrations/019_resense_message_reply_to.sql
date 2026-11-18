-- Migration: 019_resense_message_reply_to
-- Adds swipe-to-reply: a message can quote one earlier message in the same
-- space (WhatsApp/iMessage-style reply, not a thread — one level, no
-- reply-to-a-reply chains beyond what reply_to_id itself already allows by
-- pointing further back).
--
-- Soft-delete note: "delete for everyone" (018) never removes the row, only
-- stamps deleted_at — so reply_to_id never faces a real FK-breaking deletion
-- under this product's current delete model. A quoted message that gets
-- soft-deleted after being quoted stays a valid reference; the client is
-- expected to render "Message deleted" for the quote preview using the same
-- deleted_at check it already uses for the bubble itself.

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null;

create index if not exists messages_reply_to_id_idx on public.messages (reply_to_id);

-- Defense in depth: a client could otherwise set reply_to_id to any message
-- id it can guess, including one in a space it isn't a member of. RLS SELECT
-- already prevents ever reading that foreign message's content, so this
-- isn't a content-leak risk — but rejecting it outright at insert time keeps
-- reply_to_id meaningfully scoped to "a message in THIS conversation" rather
-- than a dangling cross-space reference, matching the sender_id/space
-- membership check the same policy already does.
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert with check (
  (select auth.uid()) = sender_id
  and private.is_space_member(space_id)
  and (
    reply_to_id is null
    or exists (
      select 1 from public.messages m2
      where m2.id = reply_to_id and m2.space_id = space_id
    )
  )
);
