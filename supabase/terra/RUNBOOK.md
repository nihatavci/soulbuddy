# re:sense on Terra: owner steps

re:sense moves from its own Supabase project (`qzaieykseghxufjfgsmf`, left untouched) to schema `resense` on the shared Terra
database. A fresh start: no data is copied, so existing re:sense accounts must sign up again.

Why the schema is exposed: Pauci and ReCurate keep their schemas off the Data API and sit behind their own server. re:sense
talks to Supabase straight from the phone (Data API, RLS, Realtime), so `resense` has to be exposed. It is built for that:
nothing is granted to `anon`, every table has RLS, other people's fields are only reachable through column-limited views, and
`resense_private` (helpers) is not exposed.

Already checked on Terra (read-only, 2026-11-18): `net.http_post`, the `supabase_realtime` publication, `portfolio.join_app` and
`portfolio.leave_app`, `auth.uid()` and the `authenticated` role exist; the `resense` schemas do not exist yet.

## 1. Check the schema locally (any time)

    PORTFOLIO_SQL=<master-template>/scripts/portfolio/sql/0001_app_memberships.sql supabase/terra/verify.sh

Runs 0001 on a throwaway Postgres 16 and checks blocking, reports, reveals, push, anon lockout and account deletion on a shared
sign-in. Expect `ALL CHECKS PASSED`.

## 2. Create the schema (database admin, once)

Same way as the other apps' schemas (`scripts/supabase/*-db.sh` show the container and host):

    psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres -f supabase/terra/0001_resense_schema.sql

It runs in one transaction. It must run as `supabase_admin`: the definer functions and views need an owner that bypasses RLS.

## 3. Expose the schema to the Data API

Add `resense` to `PGRST_DB_SCHEMAS` on the Supabase server (keep the existing values; do NOT add `pauci`, `creator_guides` or
`resense_private`), then restart PostgREST. Realtime needs no setting: the script adds the five tables to `supabase_realtime`.

## 4. Auth settings (GoTrue)

- `GOTRUE_EXTERNAL_APPLE_CLIENT_ID`: append `com.terra.resense` to the existing comma list (do not remove the others).
- `GOTRUE_URI_ALLOW_LIST`: add `resense://reset-password` (the password-reset email redirects there).
- Email sign-up and password reset use the shared SMTP settings; check the sender and templates read fine for re:sense.

## 5. Point the app at Terra and rebuild

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for re:sense to the Terra API URL and the Terra anon key (the
same values Pauci and ReCurate use for sign-in), then build 30 and upload. Builds up to 29 still talk to the old project.

## 6. Smoke test on a TestFlight build (two accounts)

Sign up both; post a signal; reply from the other; message back; report and block from the board and from the private space;
check the blocked person vanishes on both sides; delete one account. As admin, read `resense.reports` (clients cannot).

## After this

- Someone must act on `resense.reports` within 24 hours (Apple 1.2): `select * from resense.reports where status = 'open' order by created_at;`
  then set `status` to `actioned` or `dismissed` and, for a hidden signal, `update resense.signals set moderation_state = 'hidden' where id = ...;`.
- The old project can be paused once builds up to 29 are gone from TestFlight.
- Not done here: text filter for harmful content, in-app support contact, Apple token revoke on deletion.
