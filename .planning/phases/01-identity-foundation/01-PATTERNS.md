# Phase 01: Identity Foundation - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 16 (new + modified)
**Analogs found:** 13 / 16 (3 need net-new patterns)

> Source of file list: `01-CONTEXT.md`. No RESEARCH.md (research skipped) — all patterns are drawn from the real boilerplate codebase.
> Read-only mapping. The executor should COPY the excerpts below, not invent new conventions.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.env.local` | config | — | `.env.local.example` (if present) / `services/supabase.ts` env reads | role-match |
| `services/database.types.ts` | model (generated) | — | (MCP-generated; do not hand-edit) | n/a — regenerated |
| `services/supabase.ts` | service (client) | request-response | itself (only retype `Profile`, add `PublicProfile`) | exact (in-place) |
| `context/AuthContext.tsx` | provider | event-driven (auth state) | itself (edit in place) | exact (in-place) |
| `app/(app)/index.tsx` (AppGate) | route (gate) | request-response | itself (rewrite routing logic) | exact (in-place) |
| `app/(auth)/sign-in.tsx` | component (screen) | request-response | itself + `sign-up.tsx` | exact (restyle) |
| `app/(auth)/sign-up.tsx` | component (screen) | request-response | `sign-in.tsx` | exact (restyle) |
| `app/(app)/onboarding.tsx` (alias/intent/boundaries) | component (screen form) | CRUD (upsert) | `account.tsx` (form+card) + `hooks/useProfile.ts` (upsert) | role-match |
| age-gate screen (new) | component (screen) | request-response | `sign-in.tsx` card layout + `SplashScreen` | partial |
| welcome screen (new, per flow) | component (screen) | — | `sign-in.tsx` layout | partial |
| **selectable chip / chip-group (new primitive)** | component (UI) | — | `components/ui/TabBar.tsx` (segmented pill) + `Button.tsx` (pill styling) | partial — NO exact analog |
| `app/(app)/account.tsx` | component (screen) | request-response | itself (fix dead route + logout) | exact (in-place) |
| `hooks/useProfile.ts` | hook (data) | CRUD | itself (retype fields) | exact (in-place) |
| `lib/sentry.ts` | utility (SDK init) | — | itself (the reference guard pattern) | exact — this is the template |
| `app/_layout.tsx`, `app/(app)/_layout.tsx` | route (init sites) | — | themselves (keyless-audit the init calls) | exact (in-place) |
| `constants/theme.ts` + `tailwind.config.js` | config (design tokens) | — | themselves (swap palette; keep the two in sync) | exact (in-place) |
| `supabase/migrations/00X_profiles.sql` | migration | — | `supabase/migrations/002_profile_extended.sql` | role-match (but see RLS note) |

---

## Pattern Assignments

### `services/supabase.ts` (service — retype only)

**Analog:** itself. The client, MMKV-encrypted adapter, and auto-refresh are already correct — DO NOT rebuild. Only change the typed exports at the bottom.

Current (`services/supabase.ts:100-103`):
```typescript
export type Tables  = Database['public']['Tables'];
export type Profile = Tables['profiles']['Row'];
```

**Action:** after `generate_typescript_types` regenerates `database.types.ts` with the alias-first schema, `Profile` auto-picks up the new columns. ADD a view type export:
```typescript
export type Tables        = Database['public']['Tables'];
export type Views         = Database['public']['Views'];
export type Profile       = Tables['profiles']['Row'];
export type PublicProfile = Views['public_profiles']['Row']; // alias + intent + boundaries only
```
Env reads at the top (`services/supabase.ts:20-28`) already default to `''` and warn in `__DEV__` — this is the same keyless-safe pattern used for SDKs. No change needed there.

---

### `context/AuthContext.tsx` (provider — edit in place)

**Analog:** itself. Email `signIn`/`signUp`/`signOut`, `onAuthStateChange`, MMKV persistence, and AppState auto-refresh are all wired (`AuthContext.tsx:108-168`). **Verify AUTH-02, do not rebuild.**

**Change 1 — stop auto-invoking anonymous auth.** `signInAnonymously` is defined at `AuthContext.tsx:287-293`; the *invocation* to remove lives in the AppGate (see below), not here. Per CONTEXT it may remain in the provider unused.

**Change 2 — keyless-safe SDK side-effects.** These imports fire on auth transitions and MUST no-op on empty keys:
- `loginRevenueCat`/`logoutRevenueCat` (`AuthContext.tsx:30`, called at `:115`, `:131`, `:254`) — already guarded (RevenueCat returns early on Expo Go / empty `apiKey`, see `lib/revenuecat.ts:86-102`).
- `logAppsFlyerEvent` (`AuthContext.tsx:32`, called at `:189`) — guarded by `if (!appsflyer) return;` (`lib/appsflyer.ts:245`) BUT see the AppsFlyer hardcoded-key warning in **Shared Patterns → Keyless Boot**.
- `GoogleSignin.signOut()` (`AuthContext.tsx:261-265`) — already wrapped in try/catch; safe.

The existing signUp already handles the "email confirmation pending → null session" branch (`AuthContext.tsx:230-234`). With email confirmation disabled on remote (per CONTEXT), `signUp` returns a session immediately — verify this branch is not hit.

---

### `app/(app)/index.tsx` — AppGate (route — rewrite)

**Analog:** itself. Keep the declarative `<Redirect>` style; strip the anonymous auto-session + consent/paywall/entitlement gates.

**Remove:** the `useEffect` calling `signInAnonymously()` (`index.tsx:29-33`), the `hasGivenConsent()` consent gate (`:36-38`), the `Prefs.getBool('onboarding_v3_complete')` MMKV gate (`:41-44`), and the entitlements/paywall gate (`:48-66`).

**Replace with** the 4-step order from CONTEXT (uses `profile.onboarded`, not MMKV):
```typescript
export default function AppGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading) return <SplashScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;
  if (profileLoading) return <SplashScreen />;
  if (profile?.onboarded !== true) return <Redirect href="/(app)/onboarding" />;
  return <Redirect href={'/(app)/(tabs)/index/index' as any} />;
}
```
`SplashScreen` import stays (`index.tsx:17` → `@/components/shared/SplashScreen`). Note `app/_layout.tsx` `AuthGuard` (`app/_layout.tsx:62-82`) also has an anonymous-session comment (`:78-80`) — reconcile so unauthenticated users in `(app)` are redirected to `(auth)/sign-in` rather than allowed to sit and auto-create a session.

---

### `app/(auth)/sign-in.tsx` + `sign-up.tsx` (screens — restyle)

**Analog:** each other. They already call `supabase.auth.*` directly and handle errors with local state + Haptics — keep that logic. Restyle only.

**Screen scaffold to preserve** (`sign-in.tsx:206-217`): `View(root) → SafeAreaView → KeyboardAvoidingView → ScrollView(centered) → card`.

**Direct-supabase auth call pattern** (`sign-in.tsx:79-95`):
```typescript
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password,
});
if (signInError) { setError(signInError.message); Haptics.notificationAsync(...Error); }
// success → onAuthStateChange in AuthContext handles navigation
```

**Field + animated-border input pattern** (`sign-in.tsx:240-259`) — reuse `AnimatedInputWrapper` (`components/ui/AnimatedPressable.tsx:35`, prop `focused`) with a static label above:
```tsx
<View style={styles.fieldGroup}>
  <Text style={styles.label}>{t('auth.signIn.emailLabel')}</Text>
  <AnimatedInputWrapper focused={emailFocused} style={styles.input}>
    <TextInput ... onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} />
  </AnimatedInputWrapper>
</View>
```

**Restyle deltas for re:sense (from CONTEXT design section):**
- The card currently hardcodes `backgroundColor: '#fff'` (`sign-in.tsx:412`), title uses `AppColors.text` etc. Swap to the re:sense dark palette via `AppColors` tokens (see theme file below) — do NOT re-hardcode hex in the screen.
- Static labels above fields, CTA min-height 48px (current `Button size="lg"` is height 56 — OK, `Button.tsx:226`), body ≥16px.
- Phase 1 is **email-only**: the Google button (`sign-in.tsx:378-388`) and OTP/magic-link tabs (`:223-236`) are out of scope for the P1 slice — hide or remove per CONTEXT ("email-only for the Phase 1 slice"). Keep code keyless-safe if left in.
- i18n: keep the `t('auth.signIn.*')` keys (`context/LanguageContext.tsx:35` → `useT`); en strings live in `i18n/en.json`. No string concatenation.

---

### `app/(app)/onboarding.tsx` — alias + intent + boundaries form (screen — rebuild)

**Analog (layout/form):** `app/(app)/account.tsx` — a card-based form screen with header, `fieldGroup`, `AnimatedInputWrapper`, inline error box, and a primary `Button`.
**Analog (persistence):** `hooks/useProfile.ts` — the upsert mutation is exactly what "save alias + intent + boundaries" needs.

Current `onboarding.tsx` is a placeholder that redirects to paywall (`onboarding.tsx:13-25`) — replace entirely.

**Upsert pattern to reuse** (`hooks/useProfile.ts:31-46`, `70-102`):
```typescript
const { mutateAsync } = useUpdateProfile(); // optimistic upsert on onConflict:'user_id'
await mutateAsync({ alias, intent, boundaries, onboarded: true, age_confirmed_at: ... });
```
`useUpdateProfile` already does optimistic cache update + rollback (`useProfile.ts:80-100`). The convenience wrapper `useCompleteOnboarding` (`:108-114`) sets `{ onboarded: true }` — extend/rename its payload for re:sense.

**Alias uniqueness inline-error pattern:** mirror the auth screens' inline `errorBox` (`sign-in.tsx:332-336`, styles `:463-467`) — NOT a modal (per CONTEXT specific idea). On unique-violation from Supabase (`error.code === '23505'` or `.message` match), setError("That alias is taken — try another").

**Intent + boundary chips:** use the new `SelectableChip` primitive (below). Persist to `profiles.intent` / `profiles.boundaries` text[] arrays. Require ≥1 each before enabling the CTA.

**Field input for alias:** copy the `AnimatedInputWrapper` + static-label field pattern from `sign-in.tsx:240-259` (3–20 char, trimmed).

---

### Selectable chip / chip-group — NEW primitive (component — no exact analog)

**No chip/multi-select component exists in `components/`.** Closest patterns to copy from:
- **Segmented/selectable pill visuals:** `app/(auth)/sign-in.tsx:223-236` (the `tabs`/`tab`/`tabActive` mode selector) shows selected vs unselected pill styling with `Pressable`.
- **Pill shape + press animation:** `components/ui/Button.tsx` — `base` uses `borderRadius: 9999` (`Button.tsx:234`), spring press via reanimated (`:64-76`, `SPRING_OUT` at `:35`). Reuse this animation approach for chip press.
- **`components/ui/TabBar.tsx`** — the only existing "selection" component; reference for active-state theming.

**Guidance for planner:** create `components/ui/SelectableChip.tsx` (single chip, `selected` + `onPress` props, pill radius 999 per design, `AppColors` tokens) and a thin `ChipGroup` wrapper that manages a `string[]` selection. Follow `Button.tsx` prop/style structure (variant object + StyleSheet at bottom). Restrained 140–220ms motion per design.

---

### Age-gate + welcome screens — NEW screens (partial analog)

**Analog:** `sign-in.tsx` screen scaffold (`:206-217`) for safe-area + centered card, and `Button.tsx` for the 48px+ CTA. `SplashScreen` (`components/shared/SplashScreen`) for the branded splash.

**Age gate specifics (CONTEXT):** full-screen, blocking, no "skip". A single primary CTA ("I'm 18 or older") that records intent; persist `age_confirmed_at` on first profile write (via `useUpdateProfile`). The wordmark hero (`re:` serif-italic + `sense` grotesk) is the ONLY place italic is allowed (design rule) — build a small `Wordmark` text component or inline with two `Text` spans using the registered heading/body fonts (`constants/fonts.ts`, `Typography.fonts` in `constants/theme.ts`).

New screens must be registered in `app/(app)/_layout.tsx` `Stack` (see the existing `Stack.Screen` entries `app/(app)/_layout.tsx:224-262`).

---

### `app/(app)/account.tsx` (screen — fix in place)

**Analog:** itself. Keep the change-password + sign-out + delete cards.

**Bug to fix (dead route):** the anonymous/guest branch pushes `/(app)/signup` (`account.tsx:78`) which **does not exist** — the real route is `app/(auth)/sign-up.tsx`. Since anonymous sessions are removed this phase, the `if (isAnonymous)` guest block (`account.tsx:55-87`) can be deleted entirely; if any signup redirect remains, point it at `/(auth)/sign-up`.

**Sign-out pattern to keep** (`account.tsx:134-153`): `Alert.alert` confirm → `await signOut()` → `router.replace('/(app)/')` so AppGate re-evaluates. This is the log-out control the phase requires.

---

### `hooks/useProfile.ts` (hook — retype)

**Analog:** itself. Fetch/upsert logic is correct (`useProfile.ts:20-46`); only the `Partial<Omit<Profile, ...>>` payload types flow from the regenerated `Profile`. After schema regen, the mutation accepts `alias | intent | boundaries | onboarded | age_confirmed_at` and rejects removed fields (`display_name`, `avatar_url`) automatically. Update `useCompleteOnboarding` (`:108-114`) payload for re:sense.

---

### `supabase/migrations/00X_profiles.sql` (migration)

**Analog:** `supabase/migrations/002_profile_extended.sql` — copy its structure: `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`, per-op `CREATE POLICY`, index, timestamps.

**CRITICAL divergence — RLS key.** The old migrations key policies on `(auth.jwt() ->> 'sub') = user_id` with `user_id TEXT` (`002_profile_extended.sql:9`, `:61`). re:sense CONTEXT mandates:
- `user_id uuid ... references auth.users(id) on delete cascade`
- policies on `auth.uid() = user_id` (matches `services/supabase.ts:7` client comment).

So use the *shape* of `002_profile_extended.sql` but the *modern* `auth.uid()` + uuid FK, plus the `public_profiles` column-limited view (SELECT to `authenticated`, not `anon`; no `auth.users` join; no email/age/trust/timestamps). See Shared Patterns → RLS below. Apply via MCP `apply_migration`; keep a mirrored `.sql` in `supabase/migrations/`.

---

## Shared Patterns

### Keyless Boot (SDK init guards) — THE reference pattern
**Source of truth:** `lib/sentry.ts:22-28`
```typescript
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!dsn) {
    if (__DEV__) console.warn('[Sentry] No DSN found — error monitoring disabled...');
    return; // ← early-return no-op
  }
  ...
}
```
**Apply to / verify in these init sites** (called from `app/_layout.tsx` and `app/(app)/_layout.tsx`):

| SDK | Guard status | Location |
|-----|--------------|----------|
| Sentry | ✅ early-returns on empty DSN | `lib/sentry.ts:25-28` |
| Mixpanel | ✅ early-returns on empty `TOKEN` | `lib/mixpanel.ts:33-35` |
| OneSignal | ✅ early-returns on empty `appId` + native-module null-guard | `lib/onesignal.ts:36-40`, `:21` |
| RevenueCat | ✅ Expo-Go guard + empty `apiKey` early-return | `lib/revenuecat.ts:86-102` |
| Google Signin | ⚠️ `GoogleSignin.configure` runs at module load with `process.env...` possibly undefined | `app/(auth)/sign-in.tsx:31-36` — verify no throw on empty webClientId; also `sign-up.tsx` |
| **AppsFlyer** | ⚠️ **hardcoded fallback key + app IDs** — `DEV_KEY` defaults to a real string and `IOS_APP_ID`/`ANDROID_APP_ID` are hardcoded | `lib/appsflyer.ts:24-26` — replace fallbacks with empty-string + early-return to honor "keyless no-op" |

**Action:** audit `app/_layout.tsx:51,55` (`initSentry()`, `initMixpanel()` at module load) and `app/(app)/_layout.tsx:63-148` (OneSignal/RevenueCat/AppsFlyer/Facebook init `useEffect`s) — confirm each no-ops with blank `.env.local`. Fix AppsFlyer's hardcoded fallbacks.

### Row-Level Security (the anonymity spine, IDEN-04)
**Old pattern (do NOT copy verbatim):** `supabase/migrations/002_profile_extended.sql:57-69` uses `(auth.jwt() ->> 'sub') = user_id`.
**Use instead** (per CONTEXT + `services/supabase.ts:7`):
```sql
alter table public.profiles enable row level security;
create policy "select own" on public.profiles for select using (auth.uid() = user_id);
create policy "insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "update own" on public.profiles for update using (auth.uid() = user_id);
-- column-limited public view, authenticated-only, no auth.users join:
create view public.public_profiles as
  select user_id, alias, intent, boundaries from public.profiles;
-- grant to authenticated only (not anon)
```
Commit a `supabase/verify-anonymity.sql` proof script (per CONTEXT specifics) runnable via MCP `execute_sql`.

### Design tokens (keep two files in sync)
**Source:** `constants/theme.ts` (`AppColors`, `Typography`, `BorderRadius`) + `tailwind.config.js`. The tailwind config explicitly says "Keep in sync with constants/theme.ts" (`tailwind.config.js:10,23,29,41`).
**Apply to:** every screen this phase. Swap the current light neutral palette (`theme.ts:8-26`, currently `background:'#FFFFFF'`) for the re:sense dark palette from CONTEXT (Obsidian `#0E0F12`, Coal `#16181D`, Soft `#1D2026`, Paper `#F6F1E8`, Warm Grey `#B8B1A4`, Signal Yellow `#F2C94C`, Soft Error `#C85C5C`) in BOTH files, plus radius (cards 20 / inputs 16 / pills 999). Register serif-italic + grotesk fonts in `constants/fonts.ts` and map `Typography.fonts.heading/body` (`theme.ts:30-42`). Screens already consume `AppColors.*`/`Typography.fonts.*` tokens, so a token swap propagates without touching most screen code.

### Form field + inline error (reuse everywhere)
**Source:** `app/(auth)/sign-in.tsx` — field group (`:240-259`), inline error box (`:332-336` + styles `:463-467`), primary `Button` (`:339-348`). Reused by onboarding, age-gate, and auth restyle. Prefer this over building new input styles.

### Direct-supabase call + Haptics error feedback
**Source:** `sign-in.tsx:68-95` (and mirrored in `account.tsx:100-132`). Try `supabase.auth.*` / `supabase.from(...)`, on error `setError(msg)` + `Haptics.notificationAsync(Error)`, success handled by `onAuthStateChange`. Reuse for all auth + profile writes.

---

## No Analog Found

| File | Role | Data Flow | Reason / fallback |
|------|------|-----------|-------------------|
| `components/ui/SelectableChip.tsx` (+ ChipGroup) | UI primitive | — | No chip/multi-select exists. Build from `Button.tsx` pill+spring pattern + `sign-in.tsx:223-236` selected-pill visuals. |
| age-gate screen | screen | request-response | No blocking-gate screen exists; assemble from `sign-in.tsx` scaffold + `Button` + `Wordmark`. |
| welcome screen | screen | — | Same as above; new to the re:sense flow. |
| `public.public_profiles` view | model (SQL view) | — | No view exists in prior migrations (all are tables). Follow CONTEXT SQL in RLS shared pattern. |

---

## Metadata

**Analog search scope:** `services/`, `context/`, `hooks/`, `lib/`, `app/(app)/`, `app/(auth)/`, `components/ui/`, `components/shared/`, `constants/`, `supabase/migrations/`, `tailwind.config.js`, `i18n/`
**Files scanned:** ~20 read in full/part; grep sweeps across `components/`, `lib/`, `services/database.types.ts`
**Pattern extraction date:** 2026-07-12
