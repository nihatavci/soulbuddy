# Roadmap: SoulBuddy

## Overview

SoulBuddy's v1 is a primitive, local-only scaffold that proves the core loop: sign in → set an anonymous ASL profile → write a sentence → it hits a shared timeline → others reply publicly to continue it → two people move into a private 1-on-1 thread to keep building together. Four vertical MVP slices carry the project from a bare authenticated shell to the full write-feed-reply-thread loop, each one buildable and testable locally against Supabase (Auth + Postgres + RLS) with no external SDK keys required.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Anonymous Account & Profile** - User can sign up, log in, stay logged in, log out, and set an ASL-only profile with no real name exposed
- [ ] **Phase 2: Write & Browse the Timeline** - User can post a sentence and browse the shared anonymous timeline, newest first
- [ ] **Phase 3: Collaborative Public Reply** - User can open a sentence and read/write the public reply chain that builds the piece together
- [ ] **Phase 4: Private 1-on-1 Thread** - Two users can move from public riffing into a private thread and keep exchanging messages there

## Phase Details

### Phase 1: Anonymous Account & Profile
**Goal**: Users can create an account, remain signed in across restarts, log out, and set anonymous ASL (age/sex-gender/location) profile signals — with real identity never exposed by the schema.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. User can sign up and log in with email via Supabase Auth
  2. User's session persists after closing and reopening the app
  3. User can log out and is returned to the signed-out state
  4. User can set age, gender, and location signals during onboarding, without providing a real name
  5. No API response or screen ever exposes a user's real name/identity — only ASL signals are readable by other users (enforced via Supabase RLS/column exposure)
**Plans**: TBD

### Phase 2: Write & Browse the Timeline
**Goal**: Users can write a sentence and post it to a shared, anonymous timeline, and browse others' sentences newest first with only ASL signals attached.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: POST-01, FEED-01, FEED-02
**Success Criteria** (what must be TRUE):
  1. User can compose and submit a sentence that is saved to the shared timeline
  2. User can browse a scrollable timeline of sentences ordered newest first
  3. Each timeline entry displays the sentence plus the author's ASL signals only, never a real name
**Plans**: TBD

### Phase 3: Collaborative Public Reply
**Goal**: Users can open any sentence to see it and its full reply chain, and add their own public reply to continue or complete the piece — anonymity preserved throughout.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: FEED-03, REPLY-01, REPLY-02, REPLY-03
**Success Criteria** (what must be TRUE):
  1. User can tap a timeline entry to open a detail view showing the original sentence and its replies
  2. User can write and submit a public reply underneath a sentence
  3. Replies render in ordered chain form, showing how the piece builds over time
  4. Each reply shows only the responder's ASL signals, never a real name
**Plans**: TBD

### Phase 4: Private 1-on-1 Thread
**Goal**: Two users who are riffing on a post can move into a private 1-on-1 thread, exchange messages to keep building together, and revisit any of their threads later.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: THREAD-01, THREAD-02, THREAD-03
**Success Criteria** (what must be TRUE):
  1. User can initiate a private thread with another user directly from a sentence or reply they engaged with
  2. Two users can send and receive messages back and forth within a private thread
  3. User can view a list of all their private threads and reopen any one to continue where they left off
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Anonymous Account & Profile | 0/? | Not started | - |
| 2. Write & Browse the Timeline | 0/? | Not started | - |
| 3. Collaborative Public Reply | 0/? | Not started | - |
| 4. Private 1-on-1 Thread | 0/? | Not started | - |
