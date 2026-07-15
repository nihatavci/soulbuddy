---
quick_id: 260715-gzn
slug: harden-messaging-db
date: 2026-07-15
status: complete
---

# Summary: Harden the messaging DB

Applied to remote project `qzaieykseghxufjfgsmf` and mirrored to
`supabase/migrations/012_resense_messaging_hardening.sql`.

## Changes
- Wrapped `auth.uid()` → `(select auth.uid())` in 13 RLS policies across profiles,
  signals, replies, private_spaces, messages (insert), push_tokens.
- Pinned `set_updated_at()` search_path to `''`.
- Revoked EXECUTE from public/anon (and authenticated for the pure trigger fns) on
  `notify_message_push`, `open_space`, `rls_auto_enable`, `is_space_member`, `signal_author`.

## Verification (get_advisors)
- Performance: all 11 `auth_rls_initplan` warnings cleared. Remaining are INFO-only
  (unindexed `messages.sender_id` FK, unused signal indexes) — out of scope.
- Security: `function_search_path_mutable` and all 5 `anon`-executable SECURITY DEFINER
  warnings cleared; 3 of 5 `authenticated`-executable warnings cleared.
- Functional check: ran `messages`/`replies` SELECT as role `authenticated` with a JWT
  claim set — no permission error, so RLS helpers remain callable. Privilege matrix
  confirms anon=false / authenticated=true for `is_space_member` and `signal_author`.

## Left by design / deferred
- `is_space_member` / `signal_author` still `authenticated`-executable — required by RLS.
- 3 SECURITY DEFINER views (public_profiles, public_signals, space_overview) — intentional
  anonymity pattern, verified self-filtering.
- `pg_net` in public schema (WARN) and Auth leaked-password protection (dashboard toggle).
- `(created_at, id)` stable message ordering — client `.order()` change, handled with the
  push/app work, not a migration.
