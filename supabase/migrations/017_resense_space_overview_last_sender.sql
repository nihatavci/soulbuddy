-- Migration: 017_resense_space_overview_last_sender
-- Fixes: the unread badge/dot on the Private tab treated ANY message newer
-- than the client's locally-stored "last read" timestamp as unread —
-- including the user's OWN just-sent message. markSpaceRead stamps
-- `lastRead[spaceId]` with a client-side "now" at send time, but the
-- server's `created_at` for that same message (assigned by the DB at
-- INSERT, after the network round trip) can land a few hundred ms LATER
-- than that client stamp. When spaces() refetches with the real
-- last_message_at, `last_message_at > lastRead` evaluates true even though
-- the "unread" message is the user's own — reported live: sending a message
-- while actively in that thread still fired the app-icon badge and the red
-- dot on the Private list row.
--
-- Root fix: "unread" should mean "a message from the OTHER person I haven't
-- seen," not "any message newer than my last visit" — the latter definition
-- is inherently exposed to this clock/latency skew for the sender's own
-- sends. Expose who sent the last message so the client can decide
-- correctly regardless of timestamp precision.

create or replace view public.space_overview as
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
join public.signals s on s.id = sp.signal_id
where sp.user_a = auth.uid() or sp.user_b = auth.uid();

-- Re-lock to SELECT-only for authenticated, matching migration 015's
-- public_profiles/public_signals/space_overview write-bypass fix — CREATE OR
-- REPLACE VIEW does not reset grants, but re-asserting this is cheap and
-- keeps the invariant self-evident from this migration alone.
revoke insert, update, delete, truncate, references, trigger
  on public.space_overview
  from authenticated;
