---
quick_id: 260715-gzn
slug: harden-messaging-db
date: 2026-07-15
project: re:sense
---

# Quick Task: Harden the messaging DB (Supabase advisors)

Remediate `get_advisors` findings on the `re:sense` remote project (`qzaieykseghxufjfgsmf`)
without changing app-visible behavior. All changes are RLS/function hygiene.

## Scope

1. **RLS initplan (performance):** wrap every bare `auth.uid()` in RLS policies as
   `(select auth.uid())` so it is evaluated once per query, not per row. Tables:
   `profiles`, `signals`, `replies`, `private_spaces`, `messages` (insert only), `push_tokens`.
   `messages_select_member` uses `is_space_member()` (no direct `auth.uid()`) — left as-is.

2. **Function search_path (security):** recreate `public.set_updated_at()` with
   `SET search_path = ''` (was mutable). Body uses `now()` (pg_catalog) so empty path is safe.

3. **SECURITY DEFINER RPC exposure (security):**
   - Fully revoke EXECUTE from `anon, authenticated` on the pure trigger/event functions
     `notify_message_push()`, `open_space()`, `rls_auto_enable()` — they are never called
     via RPC and triggers fire regardless of caller EXECUTE.
   - Revoke EXECUTE from `anon` only on the RLS-helper functions `is_space_member(uuid)`
     and `signal_author(uuid)` — `authenticated` MUST retain EXECUTE or the `messages` /
     `replies` RLS policies error. Closes a de-anonymization vector: `signal_author` was
     RPC-callable by anon, mapping a signal to its author's uuid.

## Explicitly out of scope
- The 3 `security_definer_view` ERRORs (`public_profiles`, `public_signals`, `space_overview`)
  — verified they self-filter with `auth.uid()`; the definer property is the intentional
  anonymity pattern. Left as-is.
- `(created_at, id)` stable message ordering — a client `.order()` change; handled with the
  app/push work, not a DB migration (existing `messages_space_idx` already supports it).
- Leaked-password protection — a dashboard Auth toggle, not SQL.

## Verification
`get_advisors(security)` and `get_advisors(performance)` after apply: the 11 `auth_rls_initplan`
warnings, the `set_updated_at` mutable-search_path warning, and the anon-executable warnings
for the three trigger functions should clear.

## Artifact
- `supabase/migrations/012_resense_messaging_hardening.sql` (repo history, mirrors remote).
