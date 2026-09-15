-- Migration: 022_resense_notify_space_opened
-- FILE EXISTS in this repo, but has NOT been applied to any database (no
-- local/branch/production run). Requires explicit user approval before it is
-- applied.
-- Mirror of the live message-push pipeline (013_resense_message_push_alias.sql:8-43),
-- lifted one level up: notify on SPACE CREATION, not on message insert.
--
-- Problem: when a reply opens a private space, the signal author (user_a) is told
-- NOTHING. The replier (user_b) needs no notification — they just acted.
--
-- Privacy line, identical to 013:3-6 and non-negotiable: the push body may name the
-- replier's ALIAS only. No signal text, no message text, no real name. Ever.

-- ── 1) Realtime publication (idempotent) ──────────────────────────────────────
-- 009:157 and 014:60-61 use a bare `alter publication … add table`, which raises
-- "relation is already member of publication" on a re-run. Guarded so replaying
-- this migration is a clean no-op.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publication supabase_realtime not found - skipping private_spaces add';
  elsif not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'private_spaces'
  ) then
    execute 'alter publication supabase_realtime add table public.private_spaces';
  end if;
end
$$;

-- REPLICA IDENTITY is deliberately LEFT AT 'd' (default). GATE-DB query 5 recorded
-- 'd' on private_spaces. That is correct and sufficient for an INSERT-only
-- subscription: for INSERT, WAL always carries the complete new tuple, so both the
-- payload and any server-side filter resolve. REPLICA IDENTITY only governs OLD-row
-- data for UPDATE/DELETE. Do NOT set FULL here - it would log every column of every
-- row change to WAL for no benefit to this feature.

-- ── 2) notify_space_opened() ──────────────────────────────────────────────────
create or replace function public.notify_space_opened()
returns trigger language plpgsql security definer set search_path = public, net as $$
declare
  v_alias text;
  v_token text;
begin
  -- Replier's alias. SECURITY DEFINER so profiles RLS cannot hide it. Mirrors 013:20-21.
  select alias into v_alias from public.profiles where user_id = new.user_b;
  v_alias := coalesce(nullif(btrim(v_alias), ''), 'someone');

  -- RECIPIENT IS new.user_a ONLY - the signal author, who currently hears nothing.
  -- new.user_b (the creator) never appears in this query, so the creator can never
  -- be notified about a space they just opened. 009:72 (`check (user_a <> user_b)`)
  -- makes user_a = user_b structurally impossible, so there is no self-notify edge.
  for v_token in
    select token from public.push_tokens where user_id = new.user_a
  loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'to',    v_token,
        'title', 're:sense',
        -- ALIAS-ONLY BODY. The only interpolated value is v_alias, read from
        -- profiles.alias. No signals row is read here. No messages row is read here.
        -- There is no code path by which signal text or message text can reach this.
        -- Deliberately hardcoded English, not localized per-recipient: Postgres
        -- has no access to the client's i18n bundle. `i18n/en.json` and
        -- `i18n/de.json` `notifications.spaceOpened.*` (title/body, same copy
        -- as this literal) are kept in the client bundle for the client-side
        -- consumers that will eventually need this exact copy translated —
        -- e.g. a foregrounded in-app confirmation, or a future move of body
        -- composition to the client (`lib/push.ts`) once server-side locale
        -- lookup is designed. Recorded per G5 F8 / G6 §8 rather than deleted.
        'body',  v_alias || ' added to your signal - a private space just opened',
        'sound', 'default',
        'badge', 1,                                  -- presence, not a count (013:5)
        'data',  jsonb_build_object('spaceId', new.id::text)
      )
    );
  end loop;

  -- TODO(consent-gate, stop-and-ask #7): a per-user "notify me when a space opens"
  -- preference would be checked here, before the loop. Intentionally NOT designed and
  -- NOT built. PROMPTS.txt:26 says notify, not gate; reveal.tsx's consent checkbox is
  -- only evidence the product leans consent-forward, not a mandate to build one.

  return new;

exception when others then
  -- INTENTIONAL DEVIATION from the 013 mirror (see section 4). This trigger fires
  -- inside the REPLY insert transaction: replies -> open_space() -> INSERT
  -- private_spaces -> here. Letting a push failure propagate would roll back the
  -- user's REPLY. A missed notification must never cost a reply.
  raise warning 'notify_space_opened failed for space %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- ── 3) Trigger ────────────────────────────────────────────────────────────────
-- `create trigger` is not idempotent; drop-if-exists first (portable across PG versions).
drop trigger if exists private_spaces_notify_push on public.private_spaces;
create trigger private_spaces_notify_push
  after insert on public.private_spaces
  for each row execute function public.notify_space_opened();

-- ── 4) Keep the RPC surface locked down (mirrors 013:41-43) ───────────────────
revoke execute on function public.notify_space_opened() from public, anon, authenticated;
