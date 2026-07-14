# Walking Skeleton — re:sense

**Phase:** 1 (Identity Foundation)
**Generated:** 2026-07-12

## Capability Proven End-to-End

A new person opens the app, confirms they are 18+, creates a real email account on the **remote** re:sense Supabase project, sets a public **alias** + intent + boundary tags that write a `profiles` row through owner-only RLS, is read back into the app shell, stays logged in across a full restart, and can log out — with their real identity (auth email) never reachable by any other user.

This exercises the full stack: Expo/expo-router UI → Supabase Auth (remote) → Postgres `profiles` table + RLS + `public_profiles` view (remote) → typed client → routed app shell.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54 / React Native 0.81 / React 19 / expo-router 6 | Locked by boilerplate; no change |
| UI system | NativeWind 4 (Tailwind 3) + `constants/theme.ts` tokens | Locked; re:sense obsidian/paper/signal-yellow palette wired into both `theme.ts` and `tailwind.config.js` (kept in sync) |
| Data layer | Remote Supabase Postgres (`re:sense`, ref `qzaieykseghxufjfgsmf`, eu-west-1) via MCP | Live EU project already exists; data residency; **no local Docker** — schema applied via MCP `apply_migration`, types via `generate_typescript_types` |
| Auth | Supabase Auth, email/password only (email confirmation disabled for beta) | Locked; session persisted in encrypted MMKV (`services/supabase.ts`); Google/Apple/OTP deferred out of Phase 1 |
| Anonymity enforcement | RLS `auth.uid() = user_id` on `profiles` (owner-only) + column-limited `public_profiles` view (alias/intent/boundaries only, `authenticated`-grant, no `auth.users` join) | IDEN-04 is a schema-level invariant, not a UI concern; real identity lives only in `auth.users` and is never selected by any app query |
| Identity model | Alias-first: `profiles` stores `alias`, `intent[]`, `boundaries[]`, `age_confirmed_at`, `onboarded`, `trust_level` (scaffold, unenforced). **No** real name / email / avatar / gender / location / DOB column (data minimization, GDPR/KVKK) | PROJECT + CONTEXT locked decision |
| Run target | Local full-stack dev run: `npx expo start` against remote Supabase; DB-side verification via MCP `execute_sql` (no Docker) | No deployment step in v1; remote backend already live |
| Directory layout | expo-router groups: `app/(auth)/*` (welcome, age-gate, sign-in, sign-up), `app/(app)/*` (index gate, onboarding, tabs, account); shared UI in `components/ui/*`; SDK wrappers in `lib/*`; data hooks in `hooks/*` | Existing boilerplate structure preserved |

## Stack Touched in Phase 1

- [x] Project scaffold — boilerplate reused; design tokens re-themed, keyless-boot guards audited so empty `.env.local` keys no-op (Plan 01)
- [x] Routing — `(auth)` welcome/age-gate/sign-in/sign-up + `(app)` AppGate rewrite (anonymous auto-session removed) (Plan 02)
- [x] Database — real write (`profiles` upsert during onboarding) AND real read (`useProfile` fetch + `public_profiles` anonymity proof via MCP `execute_sql`) (Plans 01 + 03)
- [x] UI — interactive age gate, email auth forms, alias field + intent/boundary chips wired to Supabase (Plans 02 + 03)
- [x] Run — `npx expo start` exercises the full flow against remote Supabase; `supabase/verify-anonymity.sql` asserts IDEN-04 via MCP

## Out of Scope (Deferred to Later Slices)

- Signal composer, Signal Board (Phase 2)
- Reply-that-adds, mutual resonance unlock (Phase 3)
- Private 1-on-1 space + messaging (Phase 4)
- Report / block safety net (Phase 5)
- Reveal / verification, trust-level *enforcement* (only an unenforced `trust_level` column is scaffolded), admin console, keyword/abuse moderation — v2
- Google / Apple / OTP sign-in — email-only this phase (providers stay in the stack, keyless-safe)
- TR / DE localization — build i18n-clean now, no translation layer
- All external SDKs needing keys (RevenueCat, Sentry, Mixpanel, AppsFlyer, OneSignal, Facebook) — guarded off, no-op on empty keys

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions (alias-first identity, owner-only RLS, `public_profiles` view, remote-Supabase-via-MCP, no dark patterns):

- Phase 2: Compose a ≤120-char signal via a format prompt (1/24h cap) and browse a bounded Signal Board.
- Phase 3: Write a structured reply-that-adds (daily cap) and unlock a mutual resonance between two users.
- Phase 4: Two resonant users enter a private 1-on-1 space and exchange messages (RLS-scoped to the two).
- Phase 5: Report + block across signals/replies/private spaces.
