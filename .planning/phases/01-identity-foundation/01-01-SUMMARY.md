---
phase: 01-identity-foundation
plan: 01
subsystem: identity-backbone
tags: [supabase, rls, schema, design-tokens, keyless-boot]
requires: []
provides:
  - "public.profiles (alias-first) + owner-only RLS on remote re:sense"
  - "public.public_profiles column-limited view (IDEN-04)"
  - "generated database.types.ts (profiles + public_profiles)"
  - "PublicProfile / Views typed exports"
  - "re:sense design tokens (theme.ts + tailwind synced) + Wordmark"
  - "keyless-safe AppsFlyer + .env.local (remote Supabase only)"
affects:
  - "services/database.types.ts"
  - "services/supabase.ts"
  - "constants/theme.ts"
  - "tailwind.config.js"
tech-stack:
  added: []
  patterns:
    - "Default security-definer view for cross-user readable alias window"
    - "Owner-only RLS keyed on auth.uid() = user_id"
    - "Keyless-boot SDK guards (early-return on empty env key)"
key-files:
  created:
    - supabase/migrations/008_resense_profiles.sql
    - supabase/verify-anonymity.sql
    - components/ui/Wordmark.tsx
    - .env.local
  modified:
    - services/database.types.ts
    - services/supabase.ts
    - lib/appsflyer.ts
    - constants/theme.ts
    - tailwind.config.js
    - constants/fonts.ts
    - hooks/useProfile.ts
    - hooks/useAccountDeletion.ts
    - app/(app)/profile.tsx
    - components/glow/context/ToastContext.tsx
    - components/shared/SplashScreen.tsx
    - nativewind-env.d.ts
  deleted:
    - lib/dataExport.ts
    - __tests__/account-deletion.test.ts
key-decisions:
  - "public_profiles uses the DEFAULT security-definer view (NOT security_invoker) so it returns every user's alias row while base profiles stays owner-only — load-bearing for the read-others half of IDEN-04."
  - "Simplified useAccountDeletion to the re:sense schema (edge-function delete cascades to profiles) instead of deleting it, preserving Apple 5.1.1(v) account deletion."
  - "Brand fonts fall back to system families (no ttf bundled) so boot never fails; Wordmark carries the only italic."
requirements-completed: [IDEN-04]
duration: ~1h
completed: 2026-07-12
---

# Phase 1 Plan 1: Identity Backbone Summary

Established the re:sense identity backbone on the **remote** Supabase project (`qzaieykseghxufjfgsmf`, eu-west-1): an alias-first `public.profiles` table with owner-only RLS (`auth.uid() = user_id`) and a column-limited, default security-definer `public.public_profiles` view exposing only `{user_id, alias, intent, boundaries}` to `authenticated`. Regenerated typed client bindings, wired the re:sense dark design tokens across `theme.ts` + `tailwind.config.js`, added the `Wordmark` component, and made the app keyless-safe. **IDEN-04 is enforced at the schema level** and proved automatically.

- **Tasks:** 3 auto + 1 human-action checkpoint (4 total)
- **Files:** 4 created, 12 modified, 2 deleted
- **Migration applied to remote:** `resense_profiles_v1` (mirrored as `008_resense_profiles.sql`)

## What was built

**Task 1 — Schema + RLS + view + types.** Applied the migration via MCP `apply_migration`; `public.profiles` (uuid `user_id` FK → `auth.users` on delete cascade; alias with case-insensitive unique index + 3–20 char check; `intent[]`/`boundaries[]` with locked-vocab CHECK constraints requiring ≥1; `age_confirmed_at`, `onboarded`, `trust_level` scaffold, timestamps + updated_at trigger). Three owner-only policies, no permissive `using(true)` select policy, no delete policy. `public_profiles` is the DEFAULT security-definer view (revoked from `anon`, granted to `authenticated`, no `auth.users` join). Regenerated `services/database.types.ts` via MCP.

**Task 2 — Client retype + anonymity proof + keyless boot.** Added `Views`/`PublicProfile` exports to `services/supabase.ts`. Wrote `supabase/verify-anonymity.sql` (5 assertions incl. a positive cross-user read that inserts two synthetic users in a plpgsql sub-block and rolls them back via a sentinel exception). AppsFlyer hardcoded key/app-id fallbacks removed + early-return on empty key. Created `.env.local` (remote Supabase URL + anon key; all other keys blank; gitignored).

**Task 3 — Design tokens + fonts + Wordmark.** re:sense dark palette + radii (card 20 / input 16 / pill 999) synced across `theme.ts` and `tailwind.config.js`; `Typography.fonts.display` added (serif fallback). `components/ui/Wordmark.tsx` renders `re:` serif-italic + `sense` grotesk — the only italic surface.

**Task 4 — Checkpoint (human-action).** Email confirmation disabled on the remote project (developer-confirmed via dashboard; no MCP tool exists to toggle GoTrue auth config).

## Verification

- MCP `execute_sql` on `verify-anonymity.sql` → `ok=true` for all 5 assertions (view = 4 cols, no leaked columns, RLS enabled + owner-only preserved, no anon grant, cross-user read count = 2).
- Schema introspection: `public_profiles` cols = `{user_id, alias, intent, boundaries}`; 3 policies on profiles; 0 security-invoker views; 0 permissive `using(true)` policies.
- `npm run typecheck` → exit 0 (clean).
- Palette synced (`0E0F12` present in both token files); italic confined to `Wordmark` (grep = 0 elsewhere).

## Deviations from Plan

- **[Rule 2 — Missing critical] Dependencies were never installed.** `node_modules` was absent, so `tsc` (a hard acceptance criterion here and in plans 02/03) had never actually run during planning. Ran `npm install` (no new packages added — boilerplate deps only). Found during: Task 2 verify.
- **[Rule 4 — Scope, user-approved] Stale SoulBuddy code + pre-existing TS errors.** Regenerating types to the re:sense schema surfaced 18 typecheck errors across files outside plan 01-01's declared list. Presented options; user chose "clean up now". Actions: removed `lib/dataExport.ts` (queried removed tables) + its usage in `profile.tsx`; **simplified** `useAccountDeletion.ts` to the re:sense schema (edge-function delete cascades to `profiles`; dropped removed-table cleanup + anonymous branch) rather than deleting it, preserving Apple 5.1.1(v) compliance; removed stale `__tests__/account-deletion.test.ts`; fixed pre-existing boilerplate errors (`nativewind-env.d.ts` type ref `react-native-css` → `nativewind/types`; `ToastContext` `NodeJS.Timeout` → `ReturnType<typeof setTimeout>`; `useProfile` upsert cast to generated Insert type); removed a stray italic tagline in `components/shared/SplashScreen.tsx` to honor the italic-only-in-Wordmark rule.

**Total deviations:** 2 (1 setup, 1 user-approved scope cleanup). **Impact:** typecheck is now genuinely green; a few out-of-scope files were touched to achieve it. Account-deletion feature preserved (re-targeted to re:sense schema).

## Issues Encountered

- **iOS device build fails on code-signing** (surfaced by the developer mid-plan): placeholder bundle id `com.yourorg.myapp` + OneSignal App Groups / Push / Sign In with Apple capabilities are unprovisioned, and no Apple ID is configured in Xcode. **Resolution:** verification will run on the iOS **Simulator** (user-chosen), which needs no signing. Native capability cleanup + real bundle id for device/TestFlight builds is deferred to a later native-setup pass.

## Authentication Gates

- Email-confirmation disable is a dashboard step (no Supabase MCP tool mutates GoTrue auth config). Handled as the plan's human-action checkpoint; developer confirmed "done". Will be exercised for real by Wave 2 sign-up.

## Next Phase Readiness

Ready for **01-02** (auth entry slice). Plans 02–03 have the generated types, `PublicProfile` export, re:sense tokens, and `Wordmark` to build against. Note: if email confirmation was not actually toggled, Wave 2 sign-up will return a null session — re-check the dashboard toggle if that occurs.
