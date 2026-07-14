# Roadmap: re:sense

## Overview

re:sense proves one thing: two strangers can move from **signal → reply-that-adds → mutual resonance → intentional private conversation** while staying behind a chosen alias. The roadmap builds that loop as five vertical MVP slices, each an end-to-end, testable user capability. We start with the identity foundation (age gate, email auth, alias + intent/boundary onboarding, and the anonymity invariant), then layer the loop on top: post a signal and browse a daily-capped Signal Board, write a reply that adds and unlock a mutual resonance, move into a private 1-on-1 space, and finally wire the store-minimum safety net (report + block). Anonymity (real identity never reachable by other users) is enforced at the schema/RLS level in the remote EU Supabase project and re-checked in every UGC-bearing phase. Daily caps are choice-scarcity, never time-based urgency — no dark patterns.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Identity Foundation** - Age gate, email auth, alias + intent/boundary onboarding, anonymity invariant
- [ ] **Phase 2: Signal & Board** - Compose a capped ≤120-char signal and browse a bounded Signal Board
- [ ] **Phase 3: Reply & Resonance** - Reply-that-adds (capped) and mutual resonance unlock
- [ ] **Phase 4: Private Space** - Two resonant users enter a private 1-on-1 space and exchange messages
- [ ] **Phase 5: Safety** - Report and block across signals, replies, and private spaces

## Phase Details

### Phase 1: Identity Foundation

**Goal**: A new user confirms they are 18+, creates an email account, establishes a public alias with intent and boundary tags, and stays logged in — with real identity never reachable by other users.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AGE-01, AUTH-01, AUTH-02, AUTH-03, IDEN-01, IDEN-02, IDEN-03, IDEN-04
**Success Criteria** (what must be TRUE):

  1. A user must confirm they are 18+ before reaching any app content; an under-declared or unconfirmed user is blocked from entering.
  2. A user can sign up and log in with email, returns to the app still logged in after a full restart, and can log out.
  3. During onboarding a user sets a public alias plus at least one intent tag and one boundary tag, and that alias represents them in-app (no real name shown by default).
  4. No screen or API response exposes another user's real identity (auth email) — only alias + intent/boundary are readable, enforced by Supabase RLS + alias/trust-state separation on the remote re:sense project.

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Backbone: remote profiles schema + owner-only RLS + public_profiles view (IDEN-04), type regen, re:sense tokens/fonts/Wordmark, keyless boot

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Auth entry slice: welcome + blocking age gate + email-only sign-in/sign-up + AppGate rewrite + logout (AGE-01, AUTH-01/02/03)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — Onboarding slice: alias + intent + boundary chips writing a real profiles row, read back into app shell (IDEN-01/02/03, IDEN-04 re-verified)

**UI hint**: yes

### Phase 2: Signal & Board

**Goal**: A user can compose and post a ≤120-character signal via a format prompt (capped at one per 24h) and browse a small, bounded Signal Board of others' signals.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SIG-01, SIG-02, BOARD-01
**Success Criteria** (what must be TRUE):

  1. A user can compose a signal via a format prompt (half-sentence / feeling / place / memory), is held to at most 120 characters, and posts it to the board.
  2. After posting, a user is prevented from posting another signal within 24h — expressed as a choice cap, with no countdown timer or urgency messaging.
  3. A user browses a Signal Board showing a small, bounded set of surfaced signals — no infinite scroll and no swipe deck.
  4. Board signals display only alias + content — a reader can never see another user's real identity.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Reply & Resonance

**Goal**: A user can write a structured reply that adds to a signal (capped per day), and a mutual resonance unlocks between exactly two users when both the author and a replier have meaningfully contributed.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: REPLY-01, REPLY-02, RES-01
**Success Criteria** (what must be TRUE):

  1. A user can open a signal and write a reply that adds to it through a structured composer that discourages low-effort "hey" replies.
  2. A user's meaningful replies are capped per day as choice-scarcity, with no time-based urgency messaging.
  3. When both a signal's author and a replier have meaningfully contributed, a mutual resonance unlocks between exactly those two — no one-sided like creates a match.
  4. A user can see their unlocked mutual resonances.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Private Space

**Goal**: Two users with a mutual resonance can move into a private 1-on-1 space and exchange messages back and forth, still behind their aliases.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: PRIV-01, PRIV-02
**Success Criteria** (what must be TRUE):

  1. From a mutual resonance, a user can enter a private 1-on-1 space with that one person.
  2. Both users can send and receive messages back and forth within the private space.
  3. Only the two resonant users can read a private space (verified via Supabase RLS); aliases are shown and real identity stays hidden.

**Plans**: TBD
**UI hint**: yes

### Phase 5: Safety

**Goal**: Users can report and block across signals, replies, and private spaces, and a blocked user can no longer resonate or message — the store-minimum safety net for an adult UGC product.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: SAFE-01, SAFE-02
**Success Criteria** (what must be TRUE):

  1. A user can report a signal, a reply, or another user, and the report is recorded server-side.
  2. A user can block another user from a signal/reply or from within a private space.
  3. Once blocked, that user can no longer form a resonance with or send messages to the blocker.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Identity Foundation | 1/3 | In Progress|  |
| 2. Signal & Board | 0/TBD | Not started | - |
| 3. Reply & Resonance | 0/TBD | Not started | - |
| 4. Private Space | 0/TBD | Not started | - |
| 5. Safety | 0/TBD | Not started | - |
