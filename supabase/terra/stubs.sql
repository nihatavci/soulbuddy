-- Local stand-ins for what Supabase/Terra provide, so 0001 can run on a plain Postgres. Test use only.
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create role pauci_app nologin; create role creator_guides_app nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, created_at timestamptz not null default now());
create table auth.audit_log_entries (id uuid primary key default gen_random_uuid(), payload jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema net;
create table net.calls (id bigserial primary key, url text, body jsonb);
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000)
  returns bigint language plpgsql as $$ begin insert into net.calls(url, body) values (url, body); return 1; end $$;
create publication supabase_realtime;
create schema creator_guides;  -- portfolio 0001 backfills from it
create table creator_guides.users (id uuid primary key, deleted_at timestamptz);
create schema t;               -- test helpers
create function t.assert(cond boolean, msg text) returns void language plpgsql as
  $$ begin if cond is not true then raise exception 'ASSERT FAILED: %', msg; end if; end $$;
grant usage on schema t to authenticated, anon;
grant execute on function t.assert(boolean, text) to authenticated, anon;
