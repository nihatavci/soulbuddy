# Walking Skeleton — SoulBuddy

**Phase:** 1
**Generated:** 2026-07-12

## Capability Proven End-to-End

A user can launch the app locally (no external SDK keys), sign up / log in with
email via **local** Supabase Auth, set an anonymous ASL profile (age, gender,
location — no real name), have that profile persisted in local Postgres under
RLS, and have another user read only the ASL signals (never the real identity)
through a public-safe view. The session survives an app restart, and the user
can log out back to the signed-out state.

This exercises the full stack: Expo/expo-router UI → AuthContext → Supabase
client → local Postgres (profiles table + RLS + `public_profiles` view).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54 / React Native 0.81 / expo-router 6 (existing boilerplate) | Locked in CLAUDE.md; reuse existing app shell, routing groups `(auth)`/`(app)` |
| Data layer | Supabase Postgres, run LOCALLY via Supabase CLI (`supabase start`) | v1 is local-only scaffold; no hosted project or prod keys required |
| Auth | Supabase Auth (email + password), local, email confirmations disabled | Locked in CLAUDE.md; local dev returns a session immediately without email delivery |
| Session persistence | Existing encrypted-MMKV storage adapter in `services/supabase.ts` | Already wired; satisfies AUTH-02 with no new code |
| Anonymity enforcement | RLS owner-only on `profiles` base table + column-limited `public_profiles` view (ASL only) | Real identity (auth email) lives in `auth.users`, never exposed; other users read only age/gender/location |
| Excluded SDKs | RevenueCat, Sentry, Mixpanel, AppsFlyer, OneSignal, Facebook, i18n → no-op guards on missing keys | v1 must boot locally without any external keys |
| Directory layout | Existing folders: `app/`, `services/`, `hooks/`, `context/`, `supabase/migrations/` | Reuse boilerplate conventions; do not restructure |

## Stack Touched in Phase 1

- [x] Project scaffold — existing Expo app boots locally with excluded-SDK guards
- [x] Routing — `(auth)` sign-in/up + `(app)` onboarding/profile routes
- [x] Database — real WRITE (upsert own ASL profile) AND real READ (own profile + other users' ASL via `public_profiles` view)
- [x] UI — anonymous ASL onboarding form wired to `useProfile` upsert
- [x] Local full-stack run — `supabase start` + `npm start`; documented in Plan 01

## Out of Scope (Deferred to Later Slices)

- Timeline / posting a sentence (Phase 2)
- Public collaborative replies (Phase 3)
- Private 1-on-1 threads (Phase 4)
- Mutual identity reveal (v2, REVEAL-01)
- All external SDKs requiring keys: RevenueCat/paywall, Sentry, Mixpanel/AppsFlyer, OneSignal, i18n
- Hosted/remote Supabase project, production secrets, email delivery
- Avatars / photos / any real-name or display-name field

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering
its architectural decisions (local Supabase, RLS anonymity model, expo-router groups):

- Phase 2: User writes a sentence → shared timeline; browse newest-first with ASL-only attribution (reuses `public_profiles` view)
- Phase 3: Open a sentence → read/write the public reply chain (anonymity preserved via same view)
- Phase 4: Two users move from public riffing into a private 1-on-1 thread
