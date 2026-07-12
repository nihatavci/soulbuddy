# re:sense

## What This Is

re:sense is a privacy-first, text-forward, intentionally non-addictive adult (18+) social discovery app. Instead of swiping profiles, a user drops a short anonymous **signal** (a half-sentence, a feeling, a place, a memory — max 120 characters) onto a daily-capped **Signal Board**. Others read it and **reply** by *adding* to it, not just reacting. When two people genuinely contribute to each other's signal, a **mutual resonance** unlocks and they move into a **private space** to keep talking. Identity stays behind a chosen **alias** — real name is never shown by default. The whole product optimizes for early-stage relational *quality*, not time-in-app.

The product slug/package name is `resense`; the display brand is `re:sense`.

## Core Value

Two strangers move from **signal → response → mutual resonance → intentional private conversation** — feeling *heard* before being *judged*. If that arc feels alive, calm, and safe, everything else is secondary. The moat is behavioral design + privacy architecture, not a visual gimmick.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current v1 scope. Hypotheses until shipped. -->

- [ ] User must confirm they are 18+ before entering the app (age gate)
- [ ] User creates a public **alias** during onboarding — no real name required or displayed by default
- [ ] User selects **intent** (e.g. date / slow burn / conversation / maybe) and **boundary** tags to align expectations
- [ ] User can sign up / log in with email, stay logged in across restarts, and log out (Supabase Auth)
- [ ] User can compose a signal (≤120 chars, via a format prompt) and post it — capped at one per 24h
- [ ] User can browse a daily-capped Signal Board (a few surfaced signals) — no infinite scroll, no swipe deck
- [ ] User can write a structured reply that *adds to* a signal (not a low-effort "hey") — daily reply cap
- [ ] When both a signal's author and a replier meaningfully contribute, a **mutual resonance** unlocks between them
- [ ] Two resonant users move into a private 1-on-1 space and can exchange messages
- [ ] User can **report** and **block** within the private space and on signals/replies (store-minimum safety)

### Out of Scope

<!-- Explicit boundaries with reasoning to prevent re-adding. -->

- **Reveal / verification (share face, voice, video; selfie or ID)** — deferred; format is an open question best answered with real beta signal. Private space in v1 stays text + safety controls.
- **Trust levels 0–4 enforcement, selfie/ID verification, admin moderation console** — v1 ships minimum viable safety only (18+ gate + report/block + basic rate limits). Full trust/verification stack is a later milestone.
- **Localization (TR / DE copy)** — v1 is English-only. Screens are built i18n-*clean* (no hardcoded assumptions) but no translation layer is wired. TR/DE is a later phase for the Türkiye + Germany beta.
- **Swipe deck / photo-first browsing** — contradicts the text-first, controlled-visibility thesis.
- **Dark patterns** — no infinite scroll, no streaks, no read receipts by default, no expiring-match urgency, no "someone almost replied" pressure, no pay-for-visibility. This is a brand/ethics invariant, not a feature toggle.
- **External SDKs needing keys (RevenueCat/paywall, Sentry, Mixpanel/AppsFlyer, OneSignal push)** — kept in the boilerplate stack, guarded off (no-op on empty keys) for the beta scaffold. Not wired in v1.
- **AI in the human-to-human loop** — connection must be human-to-human to be real (Gemini stays available in the stack for non-loop utilities later).

## Context

- **Re-scoped from "SoulBuddy".** This repo began as a SoulBuddy (collaborative-writing dating) plan; the archived planning lives in `.planning/_archive-soulbuddy/`. re:sense keeps the text-first, anonymity-first spirit but changes the mechanic (signal/resonance, not co-authored poems), the identity model (alias + intent/bounds, not age/gender/location broadcast), and makes safety foundational.
- **Adult (18+), EU-sensitive product.** Markets are Türkiye + Germany. Dating/discovery touches sensitive data (GDPR special categories / KVKK "özel nitelikli"), so **data minimization and alias-by-default are legal design constraints, not just UX** — real identity is never default-visible; trust state is kept backend-side, separate from public alias. See `PRD/deep-research resense.md` for the full legal/competitor analysis.
- **Anti-addictive by design.** Scarcity is of *choice* (daily caps on signals/replies/surfaced board), never of *time* (no "your time is up" counters). App Store / Play both require an app to be meaningfully different to be approved in the saturated dating category, and both require robust safety (age gating, report/block) for UGC + dating apps.
- **Emotional/design bar is high.** Brand is "quiet intensity": obsidian dark base, paper-toned text, restrained signal-yellow accent, `re:` serif-italic + `sense` grotesk wordmark, minimal 140–220ms motion. This is a design/motion-sensitive product, not a CRUD app. Full system in `PRD/design.md`.
- **Backend is a live remote Supabase project.** Use the existing **`re:sense`** project (ref `qzaieykseghxufjfgsmf`, region `eu-west-1`) via the connected Supabase MCP for schema/migrations/queries. **Do not plan around local Docker.** EU region is deliberate (data residency).
- **Source of truth for the product is `PRD/`** — `PRD.md` (spec, objects, rules, metrics), `design.md` (UI system), `deep-research resense.md` (domain/legal/competitor research).

## Constraints

- **Tech stack**: Expo SDK 54 / React Native 0.81 / React 19, expo-router 6 — locked by the boilerplate.
- **UI**: NativeWind 4 (Tailwind 3) — locked. Do not introduce other UI libraries. Apply the `re:sense` design tokens from `PRD/design.md`.
- **Auth**: Supabase Auth (email + Google + Apple) — locked. Do not introduce other auth providers.
- **Database**: Supabase Postgres + RLS on the remote `re:sense` project (eu-west-1). RLS + alias/trust-state separation is the anonymity enforcement point.
- **Edge/Server**: Cloudflare Workers + teenybase available for server-side logic when needed.
- **AI**: Gemini via Cloudflare Worker proxy only — key never ships in the client. Not used in the human-to-human loop for v1.
- **Payments**: RevenueCat — the only source of payment status, when monetization is added (deferred).
- **Platform**: iOS + Android from one Expo codebase.

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Signal → reply-that-adds → mutual resonance → private space is THE loop | It's the entire differentiator; connection forms through mutual contribution, not one-sided likes | — Pending |
| Alias-first identity; real name never default-visible; trust state kept backend-side | Privacy-by-default + GDPR/KVKK data minimization for an adult product; alias + intent/bounds replace age/gender/location broadcast | — Pending |
| Scarcity of choice (daily caps), never scarcity of time | Kills choice overload + infinite scroll without paternalist timers or dark patterns | — Pending |
| Minimum viable safety in v1: 18+ gate + report/block + basic rate limits | Store-approval minimum for an adult UGC app; trust levels/verification/admin console deferred to keep beta focused | — Pending |
| Reveal / verification deferred out of v1 | Photo/voice/video reveal format is an open question; resolve with real beta feedback | — Pending |
| English-only v1; screens built i18n-clean; TR/DE copy is a later phase | Ships the beta faster while avoiding a costly localization retrofit | — Pending |
| No dark patterns (no infinite scroll/streaks/read-receipts/urgency/pay-for-visibility) | The brand's ethical spine and a market differentiator; EDPB/EU flag these as deceptive design | — Pending |
| Remote EU Supabase (`re:sense`, eu-west-1) via MCP; no local Docker | A live project already exists; EU region = data residency; avoids Docker dependency | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-12 after re-alignment from SoulBuddy to re:sense*
