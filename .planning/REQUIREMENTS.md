# Requirements: SoulBuddy

**Defined:** 2026-07-12
**Core Value:** Two strangers can build something beautiful together through words — that shared creation is what makes them soulbuddies.

> **v1 scope note:** This is a primitive, local-only scaffold to prove the core loop (write → feed → reply → private thread). It must build and run locally. All external-SDK integrations that need keys or would block a local run — RevenueCat/paywall, Sentry, Mixpanel/AppsFlyer analytics, OneSignal push, i18n polish — are deliberately excluded from v1. Supabase (auth + Postgres) is core infrastructure, not a blocker, and stays in.

## v1 Requirements

Requirements for the initial primitive scaffold. Each maps to roadmap phases.

### Account & Profile

- [ ] **AUTH-01**: User can sign up and log in with email (Supabase Auth)
- [ ] **AUTH-02**: User stays logged in across app restarts (session persists)
- [ ] **AUTH-03**: User can log out
- [ ] **PROF-01**: User can set anonymous profile signals — age, gender, and location (ASL); no real name required
- [ ] **PROF-02**: User's real identity is never shown on the feed or in public replies (only ASL signals appear)

### Timeline & Posting

- [ ] **POST-01**: User can write a sentence and post it to the shared timeline
- [ ] **FEED-01**: User can browse a timeline of others' anonymous sentences, newest first
- [ ] **FEED-02**: Each timeline entry shows the sentence plus the author's ASL signals only (name hidden)
- [ ] **FEED-03**: User can open a single sentence to see it and the collaborative replies beneath it

### Collaborative Reply

- [ ] **REPLY-01**: User can write a public reply underneath a sentence to continue or complete it
- [ ] **REPLY-02**: User can see the ordered chain of replies under a sentence (the piece as it builds)
- [ ] **REPLY-03**: Replies show the responder's ASL signals only (anonymity preserved)

### Private Thread

- [ ] **THREAD-01**: Two users engaging on a post can move into a private 1-on-1 thread
- [ ] **THREAD-02**: Users can exchange messages back and forth in a private thread to keep building together
- [ ] **THREAD-03**: User can see a list of their private threads and reopen any of them

## v2 Requirements

Deferred to future release. Tracked but not in the current roadmap.

### Reveal

- **REVEAL-01**: Two users in a private thread can mutually consent to reveal name/photo (the "soulmate" payoff)

### Social Signals

- **SOCL-01**: User can react to / like a sentence or reply
- **SOCL-02**: User can save or bookmark a person or piece they connected with

### Safety & Moderation

- **MODR-01**: User can report a sentence, reply, or user
- **MODR-02**: User can block another user
- **MODR-03**: Basic content filtering on posts/replies

### Platform Services (post-scaffold wiring)

- **PLAT-01**: Push notifications for new replies / thread messages (OneSignal)
- **PLAT-02**: Subscription paywall (RevenueCat)
- **PLAT-03**: Error tracking (Sentry) and analytics (Mixpanel/AppsFlyer)
- **PLAT-04**: Localization (i18n: en, ro, tr)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Swipe-based matching / photo-first browsing | Contradicts the core "connection through words" thesis |
| Voice or video communication | v1 is text-only; the special method is collaborative writing |
| AI-mediated chat / AI writing on user's behalf | Connection must be human-to-human to feel real |
| Public group threads (many people co-writing one piece) | v1 narrows to 1-on-1 after public reply; communal poems deferred |
| Real-name social graph / follows | Anonymity-first; identity only via mutual reveal (v2) |
| Any external SDK needing keys in v1 (paywall, Sentry, analytics, push) | v1 is a local scaffold; bypass every setup blocker |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (to be filled by roadmapper) | | |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: TBD (roadmapper)
- Unmapped: TBD

---
*Requirements defined: 2026-07-12*
*Last updated: 2026-07-12 after initial definition*
