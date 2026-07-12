# Phase 1: Identity Foundation - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Source:** Synthesized from PRD/ (PRD.md, design.md, deep-research resense.md) + boilerplate inspection

<domain>
## Phase Boundary

Phase 1 delivers the **identity foundation** for re:sense — the first four screens of the PRD flow (Welcome → Age gate → Alias → Intent & boundaries) plus real email auth, backed by the **remote** re:sense Supabase project. A new person: confirms they are 18+, creates an email account, chooses a public **alias** (no real name), picks intent + boundary tags, stays logged in across restarts, and can log out. The anonymity invariant is established here at the schema level: a user's real identity (auth email) is never reachable by another user — only alias + intent/boundary signals are.

**In scope:** age gate, email sign-up/login/logout/session-persistence, alias creation, intent + boundary selection, the `profiles` schema + RLS + a public alias view on remote Supabase, keyless app boot, and the AppGate routing that sends unauthenticated users to sign-in (NOT an anonymous auto-session).

**Out of scope (later phases):** signal composer / board (P2), reply + resonance (P3), private space (P4), report/block (P5). Also deferred entirely: reveal/verification, trust-level *enforcement*, admin console, TR/DE localization.

**Requirements:** AGE-01, AUTH-01, AUTH-02, AUTH-03, IDEN-01, IDEN-02, IDEN-03, IDEN-04.
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Backend & environment
- **Use the REMOTE Supabase project `re:sense`** (project ref `qzaieykseghxufjfgsmf`, region `eu-west-1`) via the connected Supabase MCP. **No local Docker, no `supabase start`.**
- The project's `public` schema is currently **empty** with **zero migrations** — Phase 1 creates the schema fresh.
- Apply schema via MCP `apply_migration` (named migrations). Regenerate client types via MCP `generate_typescript_types` into `services/database.types.ts`. This is the equivalent of the schema-push step — it is **[BLOCKING]** before verification (build/types pass off the generated file, so a false positive is possible without it).
- Keep a mirrored copy of each migration's SQL committed under `supabase/migrations/` for repo history (source of truth is what's applied to remote).
- `.env.local`: set `EXPO_PUBLIC_SUPABASE_URL` = the remote project URL (`https://qzaieykseghxufjfgsmf.supabase.co`) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` = the remote anon (publishable) key. Retrieve the anon key via MCP (`get_publishable_keys` / project settings). All excluded-SDK keys stay blank.
- **Disable email confirmation** on the remote project (auth settings) for the closed beta so `supabase.auth.signUp` returns a session immediately (supports AUTH-01 without an email round-trip). If this cannot be toggled via MCP, flag as a manual dashboard step (`autonomous: false`).

### Data model — `public.profiles` (alias-first, no identity)
- One row per user: `user_id uuid not null unique references auth.users(id) on delete cascade` (also usable as PK).
- `alias text not null` — the public handle. Enforce: 3–20 chars, trimmed, uniqueness (case-insensitive), and a basic reserved-word/profanity screen. **No real-name field.**
- `intent text[]` — chosen from a fixed set: `date | slow_burn | conversation | maybe`. Require **at least one**.
- `boundaries text[]` — chosen from a fixed starter set (Claude's discretion on exact vocabulary; e.g. `no_explicit_content | not_looking_to_meet_yet | go_slow | text_only`). Require **at least one** (per roadmap success criterion).
- `age_confirmed_at timestamptz` — set when the user passes the 18+ gate (declared adult; **do NOT collect date of birth** — data minimization). Non-null = confirmed adult.
- `onboarded boolean not null default false` — true once alias + ≥1 intent + ≥1 boundary are saved.
- `created_at / updated_at timestamptz` with triggers.
- **Deliberately OMIT** any `display_name`, real name, `email`, `avatar_url`, gender, location, or precise-demographic column.
- Add a `trust_level smallint not null default 0` column now (scaffolding only — **not enforced** in v1) so later phases can raise it without a migration. Kept server-side, never a gating check in Phase 1.

### Anonymity invariant (IDEN-04) — the security spine
- `alter table public.profiles enable row level security;`
- Owner-only policies keyed on `auth.uid() = user_id`: select/insert/update own row (no delete needed in v1).
- A column-limited view **`public.public_profiles`** (or `public_aliases`) exposing ONLY `user_id, alias, intent, boundaries` to `authenticated` (and not `anon`). It must NOT join `auth.users`, and must NOT expose email, age_confirmed_at, trust_level, or timestamps.
- Auth email lives only in `auth.users` and is never selected by any app query. Verify with a SQL check (as user A: `select * from public_profiles` returns others' aliases; `select * from profiles` returns only A's row; no email/name column anywhere in the view).

### Auth (reuse boilerplate)
- Reuse `context/AuthContext.tsx` (email `signIn`/`signUp`/`signOut`, encrypted-MMKV persistence via `services/supabase.ts`, `onAuthStateChange`). Session persistence (AUTH-02) is already wired — verify, don't rebuild.
- **Remove the anonymous auto-session path from routing.** The AppGate (`app/(app)/index.tsx`) must NOT call `signInAnonymously()`; unauthenticated users are redirected to `(auth)/sign-in`. (`signInAnonymously` can remain in AuthContext unused, or be removed — do not invoke it in the gate.) re:sense users have real accounts behind a chosen alias; alias ≠ anonymous auth.
- **Keyless boot:** guard every excluded-SDK init so an empty `EXPO_PUBLIC_*` key no-ops instead of throwing (RevenueCat, Sentry, Mixpanel, AppsFlyer, OneSignal, Google Signin). `lib/sentry.ts` already early-returns on empty DSN — mirror that pattern. `AuthContext.tsx` imports `loginRevenueCat`/`logoutRevenueCat`/`logAppsFlyerEvent`/`GoogleSignin` — ensure those are safe no-ops when unconfigured.
- AppGate routing order: (1) `isLoading` → splash; (2) `!isAuthenticated` → `<Redirect href="/(auth)/sign-in" />`; (3) authenticated + `profile.onboarded !== true` → `/(app)/onboarding`; (4) else → the app home. No paywall/consent/entitlement gates in v1.

### UI / design (apply, don't design from scratch)
Follow the re:sense design system in `PRD/design.md`:
- Palette: Obsidian `#0E0F12` base, Coal `#16181D` / Soft `#1D2026` surfaces, Paper `#F6F1E8` primary text, Warm Grey `#B8B1A4` secondary, Signal Yellow `#F2C94C` primary action (dark text on it), Soft Error `#C85C5C`.
- Wordmark `re:sense` — `re:` serif italic (Instrument Serif / Cormorant Italic), `sense` grotesk (Inter Tight / Geist). **Italic ONLY in wordmark/hero** — never buttons, labels, body, or safety text.
- Radius: cards 20, inputs 16, pills 999. Motion 140–220ms, restrained. Single-column forms, static labels above fields, CTA min-height 48px, body ≥16px, WCAG AA contrast, yellow never carries meaning alone.
- Phase 1 screens: **Welcome**, **Age gate** (18+ confirm), **Alias** (helper: "Your real name isn't needed"), **Intent & boundaries**. Microcopy: short, warm-but-not-flirty, no urgency, no startup slang.
- Tokens should be wired into NativeWind theme (Tailwind config) so later phases reuse them.

### Product invariants
- **No dark patterns**: no streaks, no read receipts, no infinite scroll, no urgency/countdowns, no pay-for-visibility. Applies even to onboarding copy.
- **English-only**, but keep copy centralized / i18n-clean (no string concatenation that would block later TR/DE).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & design source of truth
- `PRD/PRD.md` — product spec: objects (User/TrustState), key rules, screen flow, age gating, alias/intent/bounds
- `PRD/design.md` — full UI system: palette, wordmark, typography, components, screen hierarchy, forbidden patterns
- `PRD/deep-research resense.md` — legal (GDPR/KVKK data minimization), competitor lessons, dark-pattern analysis
- `.planning/PROJECT.md` — re:sense vision, locked decisions, constraints
- `.planning/REQUIREMENTS.md` — AGE/AUTH/IDEN requirement text

### Existing code to reuse / modify
- `context/AuthContext.tsx` — email auth API + MMKV persistence + onAuthStateChange (reuse; contains `signInAnonymously` to stop auto-invoking, and RC/AppsFlyer/Google imports to keep keyless-safe)
- `services/supabase.ts` — typed Supabase client, encrypted-MMKV adapter, `Profile = Tables['profiles']['Row']` export (retype after schema)
- `services/database.types.ts` — regeneration target (MCP `generate_typescript_types`)
- `app/(app)/index.tsx` — AppGate to rewrite (remove anon auto-session + paywall/consent gates)
- `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` — existing auth screens (restyle to re:sense; they call `supabase.auth.*` directly)
- `app/(app)/onboarding.tsx` — to rebuild as the alias + intent/boundary flow
- `lib/sentry.ts` — the empty-key early-return guard pattern to mirror
- `app/_layout.tsx`, `app/(app)/_layout.tsx` — excluded-SDK init sites to keep keyless

### Backend
- Remote Supabase project `re:sense` (`qzaieykseghxufjfgsmf`, eu-west-1) via MCP — `apply_migration`, `generate_typescript_types`, `execute_sql`, `get_publishable_keys`
</canonical_refs>

<specifics>
## Specific Ideas

- Age gate screen must **block** progression for anyone who doesn't confirm 18+ (no "skip"); record confirmation as `age_confirmed_at` only after account creation (or hold in-flow then persist on first profile write).
- Alias uniqueness collision must surface an inline, non-modal error ("That alias is taken — try another"), per design.md's "inline guidance, never modal by default".
- Intent options render as selectable chips; boundaries as a separate chip group. Both persist to `profiles.intent` / `profiles.boundaries` arrays.
- The anonymity SQL proof should live as a committed script (e.g. `supabase/verify-anonymity.sql`) runnable via MCP `execute_sql`, asserting the invariant automatically.
- `npm run typecheck` must pass off the regenerated `database.types.ts` at the end of every schema-touching task.
</specifics>

<deferred>
## Deferred Ideas

- Trust-level *enforcement*, selfie/ID verification, reveal tools — v2 (only a non-enforced `trust_level` column is scaffolded now).
- Signal composer, Signal Board, reply, resonance, private space — Phases 2–5.
- Admin moderation console, keyword/abuse-graph moderation — v2.
- TR/DE localization — later phase (build i18n-clean now, no translation layer).
- Google/Apple social sign-in — email-only for the Phase 1 slice (social providers exist in the stack but are not part of this phase's requirements).
</deferred>

---

*Phase: 01-identity-foundation*
*Context synthesized: 2026-07-12 from PRD/ (chosen over separate discuss-phase/ui-phase given the detailed PRD)*
