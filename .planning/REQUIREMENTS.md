# Requirements: re:sense

**Defined:** 2026-07-12
**Core Value:** Two strangers move from signal → response → mutual resonance → intentional private conversation — feeling heard before being judged.

> **v1 scope note:** Closed-beta scaffold that proves the core loop — age gate → alias/intent onboarding → post a signal → browse a daily-capped Signal Board → reply-that-adds → mutual resonance unlock → private 1-on-1 space — with **minimum viable safety** (18+ gate, report, block, basic rate limits). English-only. Reveal/verification, trust levels 0–4, admin console, and TR/DE localization are deferred. Backend is the remote **`re:sense`** Supabase project (`qzaieykseghxufjfgsmf`, eu-west-1) via MCP — no local Docker. External SDKs (paywall, Sentry, analytics, push) stay guarded-off.

## v1 Requirements

### Age & Access

- [ ] **AGE-01**: User must confirm they are 18+ before entering the app (age gate blocks under-declared/unconfirmed users)

### Identity & Onboarding

- [ ] **IDEN-01**: User creates a public **alias** during onboarding — no real name required, and no real name is displayed by default
- [ ] **IDEN-02**: User selects **intent** tags (e.g. date / slow burn / conversation / maybe) to align expectations
- [ ] **IDEN-03**: User selects **boundary** tags (things they don't want) alongside intent
- [ ] **IDEN-04**: A user's real identity (auth email) is never exposed to another user via any screen or API — only alias + intent/boundary signals are readable (enforced by Supabase RLS + alias/trust-state separation)

### Authentication

- [ ] **AUTH-01**: User can sign up and log in with email (Supabase Auth)
- [ ] **AUTH-02**: User stays logged in across app restarts (session persists)
- [ ] **AUTH-03**: User can log out

### Signal Creation

- [ ] **SIG-01**: User can compose a signal of at most 120 characters via a format prompt (e.g. half-sentence / feeling / place / memory) and post it
- [ ] **SIG-02**: User can post at most one signal per 24h (creation cap, no time-based urgency messaging)

### Signal Board

- [ ] **BOARD-01**: User can browse a daily-capped Signal Board showing a small, bounded set of surfaced signals — no infinite scroll and no swipe deck

### Reply

- [ ] **REPLY-01**: User can write a reply that *adds to* a signal (structured composer that discourages low-effort "hey" replies)
- [ ] **REPLY-02**: User's meaningful replies are capped per day (choice-scarcity, not time-scarcity)

### Resonance

- [ ] **RES-01**: A **mutual resonance** unlocks between two users when both the signal's author and a replier have meaningfully contributed — no one-sided like creates a match

### Private Space

- [ ] **PRIV-01**: Two users with a mutual resonance can move into a private 1-on-1 space
- [ ] **PRIV-02**: Users can send and receive messages back and forth within a private space

### Safety (minimum viable)

- [ ] **SAFE-01**: User can report a signal, a reply, or another user
- [ ] **SAFE-02**: User can block another user (blocked users cannot resonate/message)

## v2 Requirements

Deferred to future milestones. Tracked, not in the current roadmap.

### Reveal & Verification
- **REVEAL-01**: Two users in a private space can, trust-gated and mutually, reveal (format TBD — photo/voice/video)
- **VERIF-01**: Optional selfie / ID-age verification that raises a user's trust level

### Trust & Moderation
- **TRUST-01**: Trust levels 0–4 that gate capabilities (browse → post → private space → reveal → off-app tools)
- **MOD-01**: Keyword/pattern content screening + behavioral abuse graph beyond basic rate limits
- **ADMIN-01**: Admin moderation console (severity queue, takedowns, account state, appeals, audit log)

### Localization
- **I18N-01**: Türkiye + Germany bilingual copy (TR + DE) across all screens

### Engagement & Learning
- **FEEDBACK-01**: Post-conversation check-in ("how did it go?") feeding the trust/learning system

### Platform Services (post-scaffold wiring)
- **PLAT-01**: Push notifications (OneSignal)
- **PLAT-02**: Subscription / privacy-utility monetization (RevenueCat)
- **PLAT-03**: Error tracking (Sentry) + analytics (Mixpanel/AppsFlyer)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Swipe deck / photo-first browsing | Contradicts the text-first, controlled-visibility thesis |
| Dark patterns (infinite scroll, streaks, read receipts, expiring-match urgency, pay-for-visibility, pressure notifications) | Brand/ethics invariant; EDPB/EU flag these as deceptive design |
| Real-name social graph / public follower counts | Anonymity-first; identity only via trust-gated reveal (v2) |
| AI in the human-to-human loop (AI-written signals/replies/chat) | Connection must be human-to-human to be real |
| Age/gender/location broadcast as a public profile | Replaced by alias + intent/boundary; broadcasting demographics leaks sensitive data |
| Any external SDK needing keys in v1 (paywall, Sentry, analytics, push) | Beta scaffold; guarded-off, wired later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| _(filled by roadmap)_ | — | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 0/16 (roadmap pending)

---
*Requirements defined: 2026-07-12 (re:sense re-alignment)*
