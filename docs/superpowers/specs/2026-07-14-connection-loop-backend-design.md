# re:sense — Connection-Loop Backend Design

**Date:** 2026-07-14
**Status:** Approved (pending spec review)
**Scope:** Replace every post-onboarding mock with a real Supabase backend for the
human-to-human loop: `signal → reply → resonance → private space → messages`.

---

## Context — what already works vs what is mocked

**Real today (no work needed, verification only):**
- **Auth** — email, native Sign in with Apple (`signInWithIdToken`), and Google, all
  implemented in `context/AuthContext.tsx` with encrypted MMKV session persistence.
- **Profiles** — `public.profiles` + owner-only RLS + column-limited `public_profiles`
  view live on the remote project `qzaieykseghxufjfgsmf` (migration `008`). Onboarding
  writes a real row via `hooks/useProfile.ts`.

**Mocked (this build):** the live DB has *only* `profiles`. Every screen after
onboarding reads `constants/mockSignals.ts`:
- Signal Board / feed — `app/(app)/(tabs)/index.tsx`
- Compose — `app/(app)/(tabs)/create.tsx` (resets locally, no insert)
- Reply composer — `app/(app)/reply-composer.tsx`
- Resonance unlock — `app/(app)/resonance-unlock.tsx`
- Private spaces list — `app/(app)/(tabs)/private.tsx`
- Message thread — `app/(app)/private-space.tsx`

## Locked decisions
- **Resonance rule:** *auto-open on first reply.* When someone adds a reply to a
  signal, a private space opens immediately for the signal author + the replier.
  (Softens the PRD "no one-sided" invariant — accepted by product owner. Isolated in a
  single DB function so switching to author-accept later is a one-line change.)
- **Scope:** full loop now — signals, replies, resonance, private-space messaging with
  Supabase Realtime — all real, all mocks removed.
- **Daily signal cap:** *deferred.* Not enforced in this build. `signals.created_at`
  stays so it can be added later as a pure `BEFORE INSERT` trigger, no schema change.
- **Stack:** Supabase Postgres + RLS + Realtime (locked). TanStack Query hooks mirror
  the existing `useProfile.ts` conventions. No new libraries.

---

## 1. Schema — one migration `009_resense_signals_loop.sql`

Applied to the remote project via MCP `apply_migration`, mirrored in-repo (same pattern
as `008`). All tables: `gen_random_uuid()` PK, `author_id`/`sender_id` default
`auth.uid()`, `created_at timestamptz default now()`.

| Table | Key columns | Notes |
|---|---|---|
| `signals` | `author_id`, `text` (check `char_length between 1 and 120`), `format` (check in `feeling/place/memory/thought`), `moderation_state` default `'visible'`, `created_at`, `expires_at nullable` | a dropped signal |
| `replies` | `signal_id → signals`, `author_id`, `text` (check 1–120), `created_at` | an "add" to a signal |
| `private_spaces` | `signal_id → signals`, `user_a` (signal author), `user_b` (replier), `created_at`, `unique(signal_id, user_b)` | resonance folded in |
| `messages` | `space_id → private_spaces`, `sender_id`, `text`, `created_at` | the 1:1 thread |

`resonances` from the roadmap is **folded into `private_spaces`** — under auto-open they
are the same object. Reveal columns omitted (v2). `expires_at` column is present but no
TTL job in this build.

## 2. The unlock — one `SECURITY DEFINER` function + trigger

`public.open_space(p_signal_id uuid, p_replier uuid)`:
1. Look up the signal's `author_id`.
2. Guard self-reply (`author_id = p_replier` → no-op).
3. `INSERT INTO private_spaces (signal_id, user_a=author, user_b=replier)
   ON CONFLICT (signal_id, user_b) DO NOTHING`.

Called by an `AFTER INSERT` trigger on `replies`. Idempotent. **This function is the
entire resonance policy** — the single swappable piece.

## 3. RLS + anonymity (load-bearing)

The invariant: another user's **alias** is readable; their **real identity (email)** is
never reachable by any query path. Pseudonymous `user_id ↔ alias` linkage already exists
via `public_profiles`; this build stays consistent with that.

- **`signals`** — `insert`: `author_id = auth.uid()`. No public direct `select`. The
  board reads a **`public_signals` view** (default/security-definer, like
  `public_profiles`): `id, author_id, alias, format, text, created_at, reply_count` —
  `alias` + `reply_count` joined/aggregated; `auth.users` never touched.
  Own signals selectable directly for "my signals".
- **`replies`** — `select` limited to the signal's author **or** the reply's author
  (not public). `insert`: `author_id = auth.uid()`. A `public_replies`-style read for a
  signal returns `alias + text` only, scoped to those two parties.
- **`private_spaces`** — all ops gated `auth.uid() IN (user_a, user_b)`. List reads join
  `public_profiles` for the *other* party's alias only.
- **`messages`** — `insert`/`select` gated to membership of the parent space
  (`auth.uid() IN (space.user_a, space.user_b)`).
- `verify-anonymity.sql` extended to prove no path from the new tables reaches email.

## 4. Realtime messaging

Supabase Realtime `postgres_changes` on `messages`, filtered by `space_id`, gated by the
authenticated token's RLS (Realtime respects RLS). `messages` added to the realtime
publication. `useMessages(spaceId)` subscribes and appends new rows live — this is what
makes "someone writes to my thread" appear instantly without a refetch.

## 5. Daily cap — deferred
Not built. Documented here so it is a known follow-up: add a `BEFORE INSERT` trigger on
`signals` counting the author's last-24h rows against `DAILY_SIGNAL_CAP`.

## 6. Data hooks (mirror `hooks/useProfile.ts` exactly)

TanStack Query + optimistic writes + existing MMKV persistence. Same file conventions,
same `queryKeys` extension in `store/queryClient.ts`.

- `hooks/useSignals.ts` — `useSignals()` (board, bounded ~30 recent), `useCreateSignal()`
  (optimistic insert, invalidate board), `useSignal(id)`.
- `hooks/useReplies.ts` — `useReplies(signalId)`, `useAddReply()` (insert → trigger opens
  space; invalidate replies + spaces).
- `hooks/useSpaces.ts` — `usePrivateSpaces()` (my spaces + other alias + last message).
- `hooks/useMessages.ts` — `useMessages(spaceId)` (query + realtime subscription),
  `useSendMessage(spaceId)` (optimistic insert).

## 7. Swap mocks → live

Each screen moves from `MOCK_*` to its hook:

| Screen | Hook |
|---|---|
| `(tabs)/index.tsx` (board) | `useSignals` |
| `(tabs)/create.tsx` (compose) | `useCreateSignal` |
| `reply-composer.tsx` | `useSignal`, `useAddReply` |
| `resonance-unlock.tsx` | reads the space returned by `useAddReply` |
| `(tabs)/private.tsx` (spaces) | `usePrivateSpaces` |
| `private-space.tsx` (thread) | `useMessages`, `useSendMessage` |

`constants/mockSignals.ts` **data** exports deleted. Non-data constants
(`SIGNAL_FORMATS`, `SignalFormat`, `SIGNAL_MAX_CHARS`, `DAILY_SIGNAL_CAP`) move to
`constants/signals.ts` and imports updated.

## 8. Types + verification

- Regenerate `services/database.types.ts` via MCP `generate_typescript_types` after the
  migration.
- **End-to-end on simulator, two real accounts:** A posts → appears on B's board →
  B adds a reply → space auto-opens for both → they message back and forth in realtime.
- **Auth pass (untested per TASKS.md):** confirm Supabase email-confirmation is off
  (sign-up returns a session) and the Apple provider is enabled in the dashboard; verify
  email + Apple sign-in on device.

## Out of scope (this build)
Daily/reply caps, moderation pipeline (column defaults `visible`), signal TTL/expiry job,
reveal flow, reply cap, spam detection. Columns/hooks left compatible with adding them.

## Risks
- **Realtime + RLS:** subscription must carry the authed token or it silently returns
  nothing — verify live, not just typecheck.
- **View security mode:** `public_signals` must be security-definer (like
  `public_profiles`) or it returns only the caller's own rows and the board is empty.
- **Self-reply / duplicate spaces:** guarded by the function + `unique(signal_id, user_b)`.
