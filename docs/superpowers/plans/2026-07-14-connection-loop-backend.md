# Connection-Loop Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every post-onboarding mock with a real Supabase backend so a signal posts to a live board, a reply auto-opens a private space, and the two people message each other in realtime.

**Architecture:** One migration adds `signals → replies → private_spaces → messages` with RLS, a `SECURITY DEFINER` unlock trigger, and definer views for the alias-only board and space list. Four TanStack Query hooks (mirroring `hooks/useProfile.ts`) back the screens; `messages` uses Supabase Realtime. Mocks are deleted last.

**Tech Stack:** Supabase Postgres + RLS + Realtime, `@supabase/supabase-js`, TanStack Query, Expo/React Native. No new libraries.

## Global Constraints

- Remote Supabase project id: `qzaieykseghxufjfgsmf` (re:sense, eu-west-1). Migrations applied via MCP `apply_migration` **and** mirrored to `supabase/migrations/` (same pattern as `008`).
- **Anonymity invariant (load-bearing):** no query path may reach a user's email / `auth.users`. Cross-user reads expose **alias only**, via `public_profiles` (definer view, already exists).
- Signal & reply `text`: 1–120 chars after trim. Message `text`: 1–2000.
- Signal `format` ∈ `feeling | place | memory | thought`.
- Resonance rule = **auto-open on first reply**, implemented entirely in `public.open_space()` (the single swappable piece).
- **No daily cap** in this build (deferred). Keep `signals.created_at`.
- Hooks follow `hooks/useProfile.ts`: TanStack Query, `queryKeys` factory in `store/queryClient.ts`, `supabase` from `@/services/supabase`, throw `new Error(error.message)` on failure.
- Branch: `feat/connection-loop-backend` (already checked out).

---

### Task 1: Migration — schema, RLS, unlock trigger, views, realtime

**Files:**
- Create: `supabase/migrations/009_resense_signals_loop.sql`
- Apply: remote project `qzaieykseghxufjfgsmf` via MCP `apply_migration` (name `resense_signals_loop_v1`)

**Interfaces:**
- Produces (tables): `signals`, `replies`, `private_spaces`, `messages`
- Produces (views): `public_signals(id, author_id, alias, format, text, created_at, reply_count)`, `space_overview(id, signal_id, user_a, user_b, alias_a, alias_b, signal_text, created_at, last_message, last_message_at)`
- Produces (fns): `open_space()` trigger fn, `signal_author(uuid)`, `is_space_member(uuid)`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/009_resense_signals_loop.sql`:

```sql
-- Migration: 009_resense_signals_loop
-- Mirror of remote migration resense_signals_loop_v1 (project qzaieykseghxufjfgsmf).
-- signals → replies → resonance(private_spaces) → messages. Alias-first, RLS-gated,
-- Realtime on messages. Daily cap intentionally omitted (add later as BEFORE INSERT trigger).

-- ── SECURITY DEFINER helpers (bypass base-table RLS inside policies/views) ──
create or replace function public.signal_author(p_signal_id uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select author_id from public.signals where id = p_signal_id;
$$;

create or replace function public.is_space_member(p_space_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.private_spaces sp
    where sp.id = p_space_id and (sp.user_a = auth.uid() or sp.user_b = auth.uid())
  );
$$;

-- ── signals ────────────────────────────────────────────────────────────────
create table public.signals (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text             text not null,
  format           text not null,
  moderation_state text not null default 'visible',
  created_at       timestamptz not null default now(),
  expires_at       timestamptz,
  constraint signals_text_len check (char_length(btrim(text)) between 1 and 120),
  constraint signals_format_valid check (format in ('feeling','place','memory','thought')),
  constraint signals_moderation_valid check (moderation_state in ('visible','hidden'))
);
create index signals_created_idx on public.signals (created_at desc);
create index signals_author_idx on public.signals (author_id);

alter table public.signals enable row level security;
create policy "signals_insert_own" on public.signals for insert with check (auth.uid() = author_id);
create policy "signals_select_own" on public.signals for select using (auth.uid() = author_id);
-- public reads go through public_signals view, never the base table.

-- ── replies ──────────────────────────────────────────────────────────────
create table public.replies (
  id               uuid primary key default gen_random_uuid(),
  signal_id        uuid not null references public.signals(id) on delete cascade,
  author_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text             text not null,
  moderation_state text not null default 'visible',
  created_at       timestamptz not null default now(),
  constraint replies_text_len check (char_length(btrim(text)) between 1 and 120)
);
create index replies_signal_idx on public.replies (signal_id);
create index replies_author_idx on public.replies (author_id);

alter table public.replies enable row level security;
-- a reply is visible to its author OR to the parent signal's author
create policy "replies_select_participant" on public.replies for select using (
  auth.uid() = author_id or auth.uid() = public.signal_author(signal_id)
);
-- insert own, and never reply to your own signal
create policy "replies_insert_own" on public.replies for insert with check (
  auth.uid() = author_id and auth.uid() <> public.signal_author(signal_id)
);

-- ── private_spaces (resonance folded in) ──────────────────────────────────
create table public.private_spaces (
  id         uuid primary key default gen_random_uuid(),
  signal_id  uuid not null references public.signals(id) on delete cascade,
  user_a     uuid not null references auth.users(id) on delete cascade, -- signal author
  user_b     uuid not null references auth.users(id) on delete cascade, -- replier
  created_at timestamptz not null default now(),
  constraint private_spaces_distinct check (user_a <> user_b),
  constraint private_spaces_uniq unique (signal_id, user_b)
);
create index private_spaces_user_a_idx on public.private_spaces (user_a);
create index private_spaces_user_b_idx on public.private_spaces (user_b);

alter table public.private_spaces enable row level security;
create policy "private_spaces_select_member" on public.private_spaces for select
  using (auth.uid() = user_a or auth.uid() = user_b);
-- no insert/update/delete policy: rows are created ONLY by open_space() (definer).

-- ── messages ──────────────────────────────────────────────────────────────
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.private_spaces(id) on delete cascade,
  sender_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now(),
  constraint messages_text_len check (char_length(btrim(text)) between 1 and 2000)
);
create index messages_space_idx on public.messages (space_id, created_at);

alter table public.messages enable row level security;
create policy "messages_select_member" on public.messages for select
  using (public.is_space_member(space_id));
create policy "messages_insert_member" on public.messages for insert
  with check (auth.uid() = sender_id and public.is_space_member(space_id));

-- ── the ONE resonance policy: auto-open a space on first reply ─────────────
create or replace function public.open_space()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select author_id into v_author from public.signals where id = new.signal_id;
  if v_author is null or v_author = new.author_id then
    return new; -- signal gone or self-reply: no space
  end if;
  insert into public.private_spaces (signal_id, user_a, user_b)
  values (new.signal_id, v_author, new.author_id)
  on conflict (signal_id, user_b) do nothing;
  return new;
end;
$$;

create trigger replies_open_space
  after insert on public.replies
  for each row execute function public.open_space();

-- ── public_signals: the board feed (definer → all visible signals) ────────
create view public.public_signals with (security_invoker = false) as
  select
    s.id, s.author_id, p.alias, s.format, s.text, s.created_at,
    (select count(*) from public.replies r where r.signal_id = s.id) as reply_count
  from public.signals s
  join public.profiles p on p.user_id = s.author_id
  where s.moderation_state = 'visible';
revoke all on public.public_signals from anon;
grant select on public.public_signals to authenticated;

-- ── space_overview: the caller's spaces (definer + auth.uid() predicate) ───
create view public.space_overview with (security_invoker = false) as
  select
    sp.id, sp.signal_id, sp.user_a, sp.user_b,
    pa.alias as alias_a, pb.alias as alias_b,
    s.text as signal_text, sp.created_at,
    (select m.text       from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message,
    (select m.created_at from public.messages m where m.space_id = sp.id order by m.created_at desc limit 1) as last_message_at
  from public.private_spaces sp
  join public.profiles pa on pa.user_id = sp.user_a
  join public.profiles pb on pb.user_id = sp.user_b
  join public.signals  s  on s.id = sp.signal_id
  where sp.user_a = auth.uid() or sp.user_b = auth.uid();
revoke all on public.space_overview from anon;
grant select on public.space_overview to authenticated;

-- ── realtime: publish messages so subscribers get live inserts ─────────────
alter publication supabase_realtime add table public.messages;
```

- [ ] **Step 2: Apply to the remote project**

Use MCP `apply_migration` with `project_id: qzaieykseghxufjfgsmf`, `name: resense_signals_loop_v1`, and the SQL body above.

- [ ] **Step 3: Verify structure**

Run MCP `list_tables` (project `qzaieykseghxufjfgsmf`, schema `public`). Expected: `profiles`, `signals`, `replies`, `private_spaces`, `messages` all with `rls_enabled: true`.

- [ ] **Step 4: Verify constraints + trigger with the existing user**

Run via MCP `execute_sql` (runs as service role — bypasses RLS but triggers still fire). This proves the check constraints and `open_space` without needing two accounts:

```sql
-- grab the one existing user
with u as (select user_id from public.profiles limit 1)
-- valid signal insert
insert into public.signals (author_id, text, format)
select user_id, 'plan-test signal', 'feeling' from u
returning id;
```
Expected: one row returned. Then confirm a bad format is rejected:
```sql
insert into public.signals (author_id, text, format)
select user_id, 'bad', 'bogus' from public.profiles limit 1;
```
Expected: ERROR `signals_format_valid`. Then clean up:
```sql
delete from public.signals where text = 'plan-test signal';
```
Expected: DELETE succeeds. (Full two-user trigger + RLS path is verified live in Task 8.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/009_resense_signals_loop.sql
git commit -m "feat(db): signals→replies→spaces→messages schema, RLS, realtime"
```

---

### Task 2: Regenerate DB types + add typed row exports

**Files:**
- Modify: `services/database.types.ts` (regenerated)
- Modify: `services/supabase.ts` (add row/view type exports)

**Interfaces:**
- Produces: `Signal`, `Reply`, `PrivateSpace`, `Message`, `PublicSignal`, `SpaceOverview` types from `@/services/supabase`

- [ ] **Step 1: Regenerate types**

Run MCP `generate_typescript_types` for project `qzaieykseghxufjfgsmf` and write the output to `services/database.types.ts` (overwrite). Fallback CLI: `supabase gen types typescript --project-id qzaieykseghxufjfgsmf > services/database.types.ts`.

- [ ] **Step 2: Add convenience exports**

Append to `services/supabase.ts` (after the existing `Profile`/`PublicProfile` exports):

```ts
export type Signal        = Tables['signals']['Row'];
export type Reply         = Tables['replies']['Row'];
export type PrivateSpace  = Tables['private_spaces']['Row'];
export type Message       = Tables['messages']['Row'];
export type PublicSignal  = Views['public_signals']['Row'];
export type SpaceOverview = Views['space_overview']['Row'];
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS (new tables/views resolve; no errors introduced by this task).

- [ ] **Step 4: Commit**

```bash
git add services/database.types.ts services/supabase.ts
git commit -m "feat(types): regenerate DB types for signals loop"
```

---

### Task 3: Extract signal constants; delete mock data

**Files:**
- Create: `constants/signals.ts`
- Delete: `constants/mockSignals.ts`
- Modify: every importer of `@/constants/mockSignals`

**Interfaces:**
- Produces: `SIGNAL_FORMATS`, `SignalFormat`, `SIGNAL_MAX_CHARS`, `DAILY_SIGNAL_CAP`, `SIGNAL_PROMPTS?` re-export path `@/constants/signals`
- Consumes: nothing

- [ ] **Step 1: Create `constants/signals.ts` with the non-data constants only**

```ts
/** Signal domain constants (formats, limits). Data now comes from Supabase. */

export type SignalFormat = 'feeling' | 'place' | 'memory' | 'thought';

export const SIGNAL_FORMATS: { value: SignalFormat; label: string; hint: string }[] = [
  { value: 'feeling', label: 'A feeling', hint: 'something you can’t quite name yet' },
  { value: 'place',   label: 'A place',   hint: 'somewhere that stayed with you' },
  { value: 'memory',  label: 'A memory',  hint: 'a moment you keep returning to' },
  { value: 'thought', label: 'A thought', hint: 'a half-sentence, left open' },
];

export const SIGNAL_MAX_CHARS = 120;
export const DAILY_SIGNAL_CAP = 3; // not enforced server-side yet (deferred)
```

- [ ] **Step 2: Find all importers**

Run: `grep -rl "constants/mockSignals" app components constants hooks`
Expected: a list including `app/(app)/(tabs)/index.tsx`, `create.tsx`, `private.tsx`, `reply-composer.tsx`, `private-space.tsx`.

- [ ] **Step 3: Repoint the surviving constant imports**

In every file above, change `from '@/constants/mockSignals'` → `from '@/constants/signals'` for `SIGNAL_FORMATS`, `SignalFormat`, `SIGNAL_MAX_CHARS`, `DAILY_SIGNAL_CAP`. Leave the `MOCK_*` imports for now (Tasks 4–7 remove them per screen). If a file imports only `MOCK_*`, leave it untouched this task.

- [ ] **Step 4: Delete the mock file's DATA, keep it compiling**

Do NOT delete `constants/mockSignals.ts` yet (screens still import `MOCK_*`). Instead, re-export the moved constants from it so nothing breaks mid-migration. Replace the top constant block of `constants/mockSignals.ts` with:

```ts
export { SIGNAL_FORMATS, SIGNAL_MAX_CHARS, DAILY_SIGNAL_CAP } from '@/constants/signals';
export type { SignalFormat } from '@/constants/signals';
```
Keep the `MOCK_SIGNALS`, `MOCK_PRIVATE_SPACES`, `MOCK_THREAD` exports and their interfaces intact for now.

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add constants/signals.ts constants/mockSignals.ts app
git commit -m "refactor(signals): extract signal constants to constants/signals"
```

---

### Task 4: `useSignals` hook + wire Board & Compose

**Files:**
- Create: `hooks/useSignals.ts`
- Modify: `store/queryClient.ts` (add keys)
- Modify: `app/(app)/(tabs)/index.tsx` (board reads live)
- Modify: `app/(app)/(tabs)/create.tsx` (compose inserts live)

**Interfaces:**
- Consumes: `PublicSignal`, `Signal` (Task 2); `SignalFormat` (Task 3)
- Produces: `useSignals()`, `useSignal(id)`, `useCreateSignal()`

- [ ] **Step 1: Add query keys**

In `store/queryClient.ts`, inside the `queryKeys` object (before the closing `} as const;`), add:

```ts
  // re:sense connection loop
  signals:       ()                 => ['signals'] as const,
  signal:        (signalId: string) => ['signal', signalId] as const,
  replies:       (signalId: string) => ['replies', signalId] as const,
  spaces:        (userId: string)   => ['spaces', userId] as const,
  spaceMessages: (spaceId: string)  => ['spaceMessages', spaceId] as const,
```

- [ ] **Step 2: Create `hooks/useSignals.ts`**

```ts
/**
 * useSignals — the Signal Board.
 *
 * Reads the alias-only `public_signals` view (bounded, recent-first) and creates
 * new signals. author_id defaults to auth.uid() server-side, so inserts send only
 * { text, format }. Mirrors hooks/useProfile.ts conventions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { PublicSignal, Signal } from '@/services/supabase';
import type { SignalFormat } from '@/constants/signals';

const BOARD_LIMIT = 30;

async function fetchSignals(): Promise<PublicSignal[]> {
  const { data, error } = await supabase
    .from('public_signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(BOARD_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicSignal[];
}

export function useSignals() {
  return useQuery({
    queryKey: queryKeys.signals(),
    queryFn: fetchSignals,
    staleTime: 1000 * 60, // 1 min
  });
}

async function fetchSignal(id: string): Promise<PublicSignal | null> {
  const { data, error } = await supabase
    .from('public_signals').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as PublicSignal | null;
}

export function useSignal(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.signal(id ?? ''),
    queryFn: () => fetchSignal(id as string),
    enabled: !!id,
  });
}

export function useCreateSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { text: string; format: SignalFormat }): Promise<Signal> => {
      const { data, error } = await supabase
        .from('signals')
        .insert({ text: input.text.trim(), format: input.format })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Signal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
    },
  });
}
```

- [ ] **Step 3: Wire the Board (`app/(app)/(tabs)/index.tsx`)**

Replace the `MOCK_SIGNALS` import with `import { useSignals } from '@/hooks/useSignals';`. Inside the component, add `const { data: signals = [], isLoading, refetch } = useSignals();`. Map each `SignalCard` from `PublicSignal`: `signal.alias`, `signal.text`, `signal.reply_count` (replaces `signal.replies`), and a relative time derived from `signal.created_at` (use existing helper if present, else a small inline `timeAgo(created_at)`). Card `onPress` navigates to the reply composer with `signalId: signal.id`. Add a `<RefreshControl refreshing={isLoading} onRefresh={refetch} />` to the `ScrollView`. Keep all existing styles/JSX.

Add this helper near the top of the file (module scope):
```ts
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
```

- [ ] **Step 4: Wire Compose (`app/(app)/(tabs)/create.tsx`)**

Replace the `DAILY_SIGNAL_CAP`/`SIGNAL_MAX_CHARS` import source with `@/constants/signals`. Add `import { useCreateSignal } from '@/hooks/useSignals';` and `const { mutateAsync: createSignal, isPending } = useCreateSignal();`. In the seal-commit handler (where the page currently resets on the mock "sent" flow), call:
```ts
try {
  await createSignal({ text, format: selectedFormat });
  // existing "sent" bloom + reset UI stays
} catch (e: any) {
  // surface e.message via the existing Toast
}
```
Disable the seal while `isPending`. Keep all ink/seal animation code unchanged.

- [ ] **Step 5: Verify on simulator (post → board)**

Launch the app (`npm run ios` or the project run skill). Sign in, compose a signal, seal it. Navigate to the Board tab and pull to refresh. Expected: the new signal appears with your alias and "add to this". Confirm via MCP `execute_sql`: `select text, format from public.signals order by created_at desc limit 1;` shows the row.

- [ ] **Step 6: Commit**

```bash
git add hooks/useSignals.ts store/queryClient.ts "app/(app)/(tabs)/index.tsx" "app/(app)/(tabs)/create.tsx"
git commit -m "feat(signals): live Signal Board + compose insert"
```

---

### Task 5: `useReplies` hook + wire Reply composer & Resonance unlock

**Files:**
- Create: `hooks/useReplies.ts`
- Modify: `app/(app)/reply-composer.tsx`
- Modify: `app/(app)/resonance-unlock.tsx`

**Interfaces:**
- Consumes: `Reply`, `PrivateSpace` (Task 2); `useSignal` (Task 4); `useAuth` (`context/AuthContext`)
- Produces: `useReplies(signalId)`, `useAddReply()` → `{ reply, space }`

- [ ] **Step 1: Create `hooks/useReplies.ts`**

```ts
/**
 * useReplies — additions to a signal. Inserting a reply fires the DB trigger that
 * auto-opens a private_space; we read that space back (I'm user_b) so the caller can
 * route into the resonance-unlock moment.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Reply, PrivateSpace } from '@/services/supabase';

async function fetchReplies(signalId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from('replies').select('*').eq('signal_id', signalId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Reply[];
}

export function useReplies(signalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.replies(signalId ?? ''),
    queryFn: () => fetchReplies(signalId as string),
    enabled: !!signalId,
  });
}

export function useAddReply() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { signalId: string; text: string }):
      Promise<{ reply: Reply; space: PrivateSpace | null }> => {
      const { data: reply, error } = await supabase
        .from('replies')
        .insert({ signal_id: input.signalId, text: input.text.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);

      // the trigger opened a space with me (user_b) — read it back
      const { data: space } = await supabase
        .from('private_spaces').select('*')
        .eq('signal_id', input.signalId)
        .eq('user_b', user?.id ?? '')
        .maybeSingle();

      return { reply: reply as Reply, space: (space as PrivateSpace) ?? null };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.replies(vars.signalId) });
      qc.invalidateQueries({ queryKey: queryKeys.signals() });
      if (user?.id) qc.invalidateQueries({ queryKey: queryKeys.spaces(user.id) });
    },
  });
}
```

- [ ] **Step 2: Wire the reply composer (`app/(app)/reply-composer.tsx`)**

Replace `import { MOCK_SIGNALS, SIGNAL_MAX_CHARS } from '@/constants/mockSignals';` with:
```ts
import { SIGNAL_MAX_CHARS } from '@/constants/signals';
import { useSignal } from '@/hooks/useSignals';
import { useAddReply } from '@/hooks/useReplies';
```
Replace `const original = MOCK_SIGNALS.find(...) ?? MOCK_SIGNALS[0];` with `const { data: original } = useSignal(signalId);` and guard the read-only card for `original == null` (render nothing / a spinner until loaded). Add `const { mutateAsync: addReply, isPending } = useAddReply();`. In `handleSubmit`:
```ts
if (!signalId) return;
try {
  const { space } = await addReply({ signalId, text: addition });
  router.replace({ pathname: '/(app)/resonance-unlock', params: { spaceId: space?.id ?? '' } });
} catch (e: any) {
  // surface e.message (existing error UI / Alert)
}
```
Disable submit while `isPending`. Map the read-only original card fields to `original.alias` / `original.text`.

- [ ] **Step 3: Wire resonance-unlock to carry the space id (`app/(app)/resonance-unlock.tsx`)**

Add `import { useLocalSearchParams } from 'expo-router';` and read `const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();`. Change `openPrivateSpace` to:
```ts
const openPrivateSpace = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  router.replace({ pathname: '/(app)/private-space', params: { spaceId: spaceId ?? '' } });
};
```

- [ ] **Step 4: Verify on simulator**

With a signal on the board from account A, sign in as account B, tap the signal, add a reply, submit. Expected: routes to resonance-unlock, then "Open the private space" opens `private-space` with a real `spaceId`. Confirm via MCP `execute_sql`: `select * from public.private_spaces order by created_at desc limit 1;` shows a row with `user_a` = A, `user_b` = B.

- [ ] **Step 5: Commit**

```bash
git add hooks/useReplies.ts "app/(app)/reply-composer.tsx" "app/(app)/resonance-unlock.tsx"
git commit -m "feat(replies): live reply insert + auto-opened space handoff"
```

---

### Task 6: `useSpaces` hook + wire Private tab

**Files:**
- Create: `hooks/useSpaces.ts`
- Modify: `app/(app)/(tabs)/private.tsx`

**Interfaces:**
- Consumes: `SpaceOverview` (Task 2); `useAuth`
- Produces: `usePrivateSpaces()`, helper `otherAlias(space, userId)`

- [ ] **Step 1: Create `hooks/useSpaces.ts`**

```ts
/**
 * useSpaces — the caller's private spaces (opened resonances). Reads space_overview
 * (definer view scoped to auth.uid()), newest-activity first.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { SpaceOverview } from '@/services/supabase';

async function fetchSpaces(): Promise<SpaceOverview[]> {
  const { data, error } = await supabase
    .from('space_overview').select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SpaceOverview[];
}

export function usePrivateSpaces() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.spaces(userId),
    queryFn: fetchSpaces,
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

/** The alias of the OTHER person in a space, given my user id. */
export function otherAlias(space: SpaceOverview, userId: string): string {
  return space.user_a === userId ? (space.alias_b ?? '') : (space.alias_a ?? '');
}
```

- [ ] **Step 2: Wire the Private tab (`app/(app)/(tabs)/private.tsx`)**

Replace the `MOCK_PRIVATE_SPACES` import with:
```ts
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useAuth } from '@/context/AuthContext';
```
Add `const { user } = useAuth();` and `const { data: spaces = [], isLoading, refetch } = usePrivateSpaces();`. Map each `SpaceCard`: alias = `otherAlias(space, user!.id)`; `lastLine` = `space.last_message ?? 'no messages yet'`; `updatedAgo` = relative time of `space.last_message_at ?? space.created_at`; `fromSignal` = `space.signal_text`. `onPress` → `router.push({ pathname: '/(app)/private-space', params: { spaceId: space.id } })`. Add RefreshControl. Render an empty-state line when `spaces.length === 0` ("No private spaces yet — add to a signal to open one."). Keep styling.

- [ ] **Step 3: Verify on simulator**

As account A (whose signal got a reply in Task 5), open the Private tab. Expected: a card showing B's alias and the originating signal text. As B, the same space appears.

- [ ] **Step 4: Commit**

```bash
git add hooks/useSpaces.ts "app/(app)/(tabs)/private.tsx"
git commit -m "feat(spaces): live private-spaces list"
```

---

### Task 7: `useMessages` hook (Realtime) + wire Private space thread

**Files:**
- Create: `hooks/useMessages.ts`
- Modify: `app/(app)/private-space.tsx`

**Interfaces:**
- Consumes: `Message` (Task 2); `useAuth`; `spaceId` route param
- Produces: `useMessages(spaceId)` (query + realtime subscription), `useSendMessage(spaceId)`

- [ ] **Step 1: Create `hooks/useMessages.ts`**

```ts
/**
 * useMessages — the 1:1 thread inside a private space. Reads history and subscribes
 * to Supabase Realtime INSERTs (RLS-gated by the authed token) so a message from the
 * other person appears live. Sends dedupe by id (realtime echoes your own insert).
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { queryKeys } from '@/store/queryClient';
import type { Message } from '@/services/supabase';

async function fetchMessages(spaceId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages').select('*').eq('space_id', spaceId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

function upsertMessage(list: Message[] | undefined, msg: Message): Message[] {
  const cur = list ?? [];
  if (cur.some((m) => m.id === msg.id)) return cur;
  return [...cur, msg];
}

export function useMessages(spaceId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.spaceMessages(spaceId ?? ''),
    queryFn: () => fetchMessages(spaceId as string),
    enabled: !!spaceId,
  });

  useEffect(() => {
    if (!spaceId) return;
    const channel = supabase
      .channel(`messages:${spaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          qc.setQueryData<Message[]>(
            queryKeys.spaceMessages(spaceId),
            (old) => upsertMessage(old, payload.new as Message),
          );
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [spaceId, qc]);

  return query;
}

export function useSendMessage(spaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string): Promise<Message> => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ space_id: spaceId, text: text.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Message;
    },
    onSuccess: (msg) => {
      qc.setQueryData<Message[]>(
        queryKeys.spaceMessages(spaceId),
        (old) => upsertMessage(old, msg),
      );
    },
  });
}
```

- [ ] **Step 2: Wire the thread (`app/(app)/private-space.tsx`)**

Replace `import { MOCK_PRIVATE_SPACES, MOCK_THREAD, type MockThreadLine } from '@/constants/mockSignals';` with:
```ts
import { useLocalSearchParams } from 'expo-router'; // if not already imported
import { useAuth } from '@/context/AuthContext';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
```
Read `const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();`, `const { user } = useAuth();`, `const { data: messages = [] } = useMessages(spaceId);`, `const { mutateAsync: send, isPending } = useSendMessage(spaceId ?? '');`. Render `ThreadBubble` from each `Message`: `mine = m.sender_id === user?.id`, `text = m.text`. The composer's send handler:
```ts
const text = draft.trim();
if (!text || !spaceId) return;
setDraft('');
try { await send(text); } catch (e: any) { /* surface e.message */ }
```
Auto-scroll the ScrollView to the end on new messages (existing ref or add one). Keep the safety strip and all styling. The header alias can come from `usePrivateSpaces()` + `otherAlias` if needed, or leave the existing static header for now.

- [ ] **Step 3: Verify realtime on simulator (two accounts / two devices)**

Open the same space as A and B (two simulators, or one simulator + one device). As B, send a message. Expected: it appears in A's thread **without a manual refresh** (Realtime). Send back from A → appears for B. Confirm rows via MCP `execute_sql`: `select sender_id, text from public.messages order by created_at;`.

- [ ] **Step 4: Commit**

```bash
git add hooks/useMessages.ts "app/(app)/private-space.tsx"
git commit -m "feat(messages): realtime 1:1 thread in private space"
```

---

### Task 8: Delete remaining mocks, anonymity proof, auth + full-loop verification

**Files:**
- Delete: `constants/mockSignals.ts`
- Modify: `supabase/verify-anonymity.sql` (extend)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Confirm no live `MOCK_*` references remain**

Run: `grep -rn "MOCK_SIGNALS\|MOCK_PRIVATE_SPACES\|MOCK_THREAD" app components hooks`
Expected: no matches. If any remain, fix them before deleting the file.

- [ ] **Step 2: Delete the mock file and verify build**

```bash
git rm constants/mockSignals.ts
```
Run: `npm run typecheck`
Expected: PASS (all importers now use `@/constants/signals` and the hooks).

- [ ] **Step 3: Extend the anonymity proof**

Append to `supabase/verify-anonymity.sql` a section asserting the new tables never expose identity. Include (run each via MCP `execute_sql` and record expected results):

```sql
-- public_signals must NOT expose any email/identity column
select column_name from information_schema.columns
where table_schema='public' and table_name='public_signals';
-- Expected: id, author_id, alias, format, text, created_at, reply_count  (no email)

-- space_overview must expose aliases only, never email
select column_name from information_schema.columns
where table_schema='public' and table_name='space_overview';
-- Expected: id, signal_id, user_a, user_b, alias_a, alias_b, signal_text,
--           created_at, last_message, last_message_at  (no email)

-- no policy on any new table joins auth.users
select tablename, policyname from pg_policies
where schemaname='public' and tablename in ('signals','replies','private_spaces','messages')
order by tablename;
-- Expected: policies use auth.uid()/helpers only; manual read confirms no auth.users join
```

- [ ] **Step 4: Run the security advisor**

Run MCP `get_advisors` (project `qzaieykseghxufjfgsmf`, type `security`). Expected: no new ERROR-level findings for the added tables/views (RLS enabled on all four tables; views are definer-with-predicate by design — note any advisor warning about `security_invoker=false` views as accepted, matching the existing `public_profiles` decision).

- [ ] **Step 5: Auth verification (email + Apple)**

- Confirm sign-up returns a session (email confirmation disabled): sign up a fresh email in the app → lands in onboarding, not "check your email". If it stalls, the Supabase Auth "Confirm email" toggle must be OFF for beta.
- Confirm **Sign in with Apple** works on a real device/simulator with the Apple provider enabled in the Supabase dashboard (Auth → Providers → Apple). Tap the Apple button → completes → session present. (Code already exists in `AuthContext.signInWithApple`; this is a config/verification check.)

- [ ] **Step 6: Full-loop end-to-end (two accounts)**

Run the whole arc once, no mocks: A signs in → posts a signal → B signs in → sees it on the board → adds a reply → resonance unlock → both see the space in Private → they exchange messages that arrive in realtime. This is the acceptance test for the whole plan.

- [ ] **Step 7: Commit**

```bash
git add supabase/verify-anonymity.sql
git commit -m "chore(backend): remove mocks, extend anonymity proof, verify full loop"
```

---

## Notes for the executor
- Screens are visual shells with bespoke animation (ink seal, paper textures). **Only swap the data source and submit handlers** — do not restructure JSX or styles.
- If `npm run typecheck` isn't the script name, check `package.json` scripts (`tsc`), and for running the app prefer the project's run skill / `npm run ios`.
- Realtime returns nothing if the token isn't attached — the shared `supabase` client is already authed, so use it directly (do not create a second client).
- Daily cap is intentionally absent; do not add it.
