# SoulBuddy

## What This Is

SoulBuddy is a mobile dating app where people find their soulmate through collaborative writing instead of swiping. You post an anonymous sentence to a shared timeline; others continue or complete it — building a poem, story, or thought together. When two people click through that co-creation, they move into a private thread, and can later mutually reveal their identities. It's connection-first romance: you fall for someone's words before you ever see their face.

## Core Value

Two strangers can build something beautiful together through words — and that shared creation is what makes them soulbuddies. If the write → feed → reply → private-thread loop feels alive and emotionally real, everything else is secondary.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. Hypotheses until shipped. -->

- [ ] User can create an account and set up an anonymous profile (no real name; shows ASL-style info — age, sex/gender, location)
- [ ] User can write a sentence and post it to a shared, anonymous timeline
- [ ] User can browse the timeline of others' anonymous sentences
- [ ] User can reply publicly underneath a sentence to continue/complete it (collaborative writing)
- [ ] Two users who are riffing can move from the public thread into a private 1-on-1 thread to keep building together
- [ ] Users can keep building a piece (poem/story) together in the private thread over time
- [ ] Two connected users can mutually consent to reveal identity (name/photo) — the "soulmate" payoff (may land in a later phase)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Swipe-based matching / photo-first browsing — contradicts the core "connection through words" thesis
- Voice or video communication — v1 is text-only; the special method is collaborative writing
- AI-mediated chat / AI writing on the user's behalf — connection must be human-to-human to be real (revisit later)
- Public group threads (many people co-writing one piece) — v1 narrows to 1-on-1 after the public reply; communal poems deferred
- Monetization / paywall — deferred until the core loop proves engaging (RevenueCat is in the stack, ready when needed)

## Context

- **Greenfield product on an existing boilerplate.** The repo ships with a React Native (Expo SDK 54) starter with a pre-wired stack (see Constraints). We are building SoulBuddy's product on top of it, not starting from an empty repo.
- **Anonymous public feed = moderation is a first-class concern.** An open, anonymous, romance-oriented timeline invites abuse, harassment, and unwanted content. Safety/reporting must be considered early, not bolted on.
- **"ASL" identity model.** Users are anonymous (no name) but surface light demographic signals (age, sex/gender, location) — a deliberate throwback to early-internet anonymous chat that gives just enough context without breaking anonymity.
- **Emotional/creative UX bar is high.** The product lives or dies on whether writing and replying *feels* intimate and inspiring. This is a design/motion-sensitive app, not a CRUD app.
- **First target is a primitive, local-only scaffold.** Right now the goal is the bare messaging/collaborative-writing loop that builds and runs locally. Deliberately bypass everything that needs external keys or setup or would block a local run: no paywall/RevenueCat, no Sentry, no analytics (Mixpanel/AppsFlyer), no push (OneSignal), no i18n polish. Those stay in the stack for later but are not wired up now.

## Constraints

- **Tech stack**: Expo SDK 54 / React Native 0.81 / React 19, expo-router 6 — locked by the boilerplate.
- **UI**: NativeWind 4 (Tailwind 3) — locked. Do not introduce other UI libraries.
- **Auth**: Supabase Auth (email OTP + Google + Apple) — locked. Do not introduce other auth providers.
- **Database**: Supabase Postgres + RLS — the anonymous feed, threads, and reveal state live here; row-level security protects identity.
- **Edge/Server**: Cloudflare Workers + teenybase for server-side logic.
- **AI**: Gemini via Cloudflare Worker proxy only — API key must never ship in the client. (No AI in the human-to-human loop for v1.)
- **Payments**: RevenueCat — the only source of subscription/payment status, when monetization is added.
- **Platform**: iOS + Android from one Expo codebase.

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Collaborative sentence-writing is THE mechanic (not swiping/chat) | It's the entire differentiator; connection forms through co-creation | — Pending |
| Anonymous by default, ASL-style signals instead of names | Preserves the "fall for the words first" premise while giving light context | — Pending |
| Public reply first, then private 1-on-1 thread | Lets connection form organically in the open, then deepen privately | — Pending |
| Identity reveal is mutual-consent and comes later in the relationship | The "soulmate" payoff; protects users and builds anticipation | — Pending |
| Text-only for v1 (no voice/video/AI) | Keep v1 focused on proving the core writing loop is emotionally real | — Pending |
| Target audience is romantic seekers (connection-first dating) | Shapes tone, matching, and moderation posture | — Pending |
| v1 = primitive local scaffold; bypass all external-SDK blockers | Prove the core loop fast, build/test locally without key setup | — Pending |

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
*Last updated: 2026-07-12 after initialization*
