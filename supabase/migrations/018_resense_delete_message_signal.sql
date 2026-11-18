-- Migration: 018_resense_delete_message_signal
-- Adds the two RLS permissions "delete" needs, per explicit product decisions:
--
-- 1) Messages: "delete for everyone" is a SOFT delete (a `deleted_at` stamp),
--    not a row DELETE. The sender can mark their own message deleted; the
--    client then renders a "Message deleted" tombstone for both people
--    instead of the original text — no row disappears, so no realtime
--    DELETE-event plumbing is needed, and the poll-based fetch in
--    hooks/useMessages.ts picks up the stamped row on its next tick like any
--    other update. "Delete for me" (the other swipe option) is intentionally
--    client-side only (a locally-persisted hidden-id set) and needs no
--    backend change at all.
--
-- 2) Signals: a real DELETE, author-scoped. The user explicitly chose "always
--    deletable, cascade included" even when a signal already has replies or
--    an opened private space — acknowledging that deleting an old signal can
--    remove a private conversation the other person may still be in. The
--    existing FKs already cascade correctly (009_resense_signals_loop.sql):
--    replies.signal_id, private_spaces.signal_id → ON DELETE CASCADE, and
--    messages.space_id → private_spaces ON DELETE CASCADE, so deleting a
--    signals row cascades through replies, private_spaces, and messages
--    automatically. This migration only adds the missing RLS DELETE policy —
--    signals had insert/select policies only until now.

-- ── messages: soft-delete stamp ────────────────────────────────────────────
alter table public.messages
  add column if not exists deleted_at timestamptz;

-- Sender may update only their own message row (the app only ever sets
-- deleted_at through this path — no separate "edit text" feature exists).
create policy "messages_update_own" on public.messages
  for update
  using ((select auth.uid()) = sender_id)
  with check ((select auth.uid()) = sender_id);

-- ── signals: author-scoped delete ──────────────────────────────────────────
create policy "signals_delete_own" on public.signals
  for delete
  using ((select auth.uid()) = author_id);
