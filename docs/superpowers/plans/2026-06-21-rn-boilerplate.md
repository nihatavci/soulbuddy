# RN Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a runnable, app-agnostic Expo React Native template at `/Users/nihat/DevS/rn-boilerplate` by copy-and-stripping the fliq codebase — keeping infrastructure and design-system structure, removing all dating/coaching domain code and fliq's visual identity.

**Architecture:** Clone fliq, bulk-delete domain files, drive cleanup of dangling imports with the TypeScript compiler (`tsc --noEmit` is the test harness here), neutralize design tokens, blank all API keys, regenerate native projects via `expo prebuild`, reinitialize git.

**Tech Stack:** Expo SDK 54 / RN 0.81 / React 19, expo-router 6, NativeWind 4, Supabase, TanStack Query + MMKV, RevenueCat, OneSignal, Mixpanel/AppsFlyer/Facebook, Gemini (Live API), Sentry, i18next, Cloudflare Workers (teenybase).

## Global Constraints

- Target path is exactly `/Users/nihat/DevS/rn-boilerplate`. Source is `/Users/nihat/fliq`.
- Never copy fliq's git history, secrets, or build artifacts into the target.
- Placeholder identity: app name `MyApp`, slug `myapp`, bundle/package id `com.yourorg.myapp`.
- Keep light-only theme (no dark mode). Keep the token *structure*; only values change.
- `tsc --noEmit` (`npm run typecheck`) and `npm run lint` MUST pass before the final commit. They are the verification gate for every strip task.
- Do NOT delete: `services/supabase.ts`, `services/gemini.ts`, `store/`, `context/AuthContext.tsx`, `context/LanguageContext.tsx`, `constants/spacing.ts`, `lib/{revenuecat,onesignal,sentry,mixpanel,appsflyer,facebook,consent,dataExport,review,launchFlags,imageResize}.ts`.
- Commit after every task with the exact message given.

---

### Task 1: Clone fliq into target and purge cruft

**Files:**
- Create: `/Users/nihat/DevS/rn-boilerplate/` (whole tree, copied)
- Delete: build artifacts, secrets, docs, fliq-only dirs (see Step 2)

**Interfaces:**
- Produces: a clean working tree at the target with fresh git, ready to strip.

- [ ] **Step 1: Copy the source tree without git/node_modules/native build outputs**

```bash
mkdir -p /Users/nihat/DevS/rn-boilerplate
rsync -a --exclude='.git' --exclude='node_modules' --exclude='server/node_modules' \
  --exclude='.expo' --exclude='ios/build' --exclude='android/build' --exclude='android/.gradle' \
  /Users/nihat/fliq/ /Users/nihat/DevS/rn-boilerplate/
```

- [ ] **Step 2: Delete build artifacts, secrets, and fliq-only directories**

```bash
cd /Users/nihat/DevS/rn-boilerplate
# Build artifacts & signing
rm -f build-*.ipa build-*.aab build-*.apk Fliq.ipa *.jks CoupleAI.storekit
# Secrets & local env (example file is regenerated in Task 8)
rm -f .env.local .dev.vars google-services.json
# Office docs & analysis files
rm -f *.docx *.xlsx ".~lock."*
# fliq-only dirs and stray bundles
rm -rf "Journal mockup" aura landing dist logos src src-backend "~" \
  screenshots .planning docs .idea .cursor .agents .blitz \
  skill-feature-blueprint skill-feature-builder
rm -f *.skill skills-lock.json component.config.json zigtjhKC \
  onesignal-skill-review.html ios-sdk-logs.txt appsflyer-upwork-brief.md \
  DESIGN.md DESIGN_SYSTEM_PLAN.md ONBOARDING_PLAN.md PRIVACY_POLICY.md \
  SECURITY_REPORT.md
```

- [ ] **Step 3: Reinitialize git and create docs dirs**

```bash
cd /Users/nihat/DevS/rn-boilerplate
rm -rf .git && git init -q
mkdir -p docs/superpowers/specs docs/superpowers/plans
```

- [ ] **Step 4: Copy this spec and plan into the repo**

```bash
cp /private/tmp/claude-501/-Users-nihat/18942807-4891-4568-8990-531a62bcbab7/scratchpad/2026-06-21-rn-boilerplate-design.md \
   /Users/nihat/DevS/rn-boilerplate/docs/superpowers/specs/
cp /private/tmp/claude-501/-Users-nihat/18942807-4891-4568-8990-531a62bcbab7/scratchpad/2026-06-21-rn-boilerplate.md \
   /Users/nihat/DevS/rn-boilerplate/docs/superpowers/plans/
```

- [ ] **Step 5: Verify no secrets/artifacts remain**

Run: `cd /Users/nihat/DevS/rn-boilerplate && ls build-* *.jks *.docx .env.local 2>/dev/null; echo "exit:$?"`
Expected: no file listing; `exit:` line prints (non-zero from ls is fine — confirms absence).

- [ ] **Step 6: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "chore: import fliq tree, purge artifacts and secrets"
```

---

### Task 2: Strip domain screens and collapse navigation to one tab

**Files:**
- Delete: domain route files under `app/(app)/`
- Modify: `app/(app)/(tabs)/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`
- Create: `app/(app)/(tabs)/index/index.tsx` (placeholder Home — overwrite)

**Interfaces:**
- Produces: a nav shell with `(auth)`, `(app)`, and a single Home tab. Later tasks rely on `app/(app)/(tabs)/index/index.tsx` existing as the home route.

- [ ] **Step 1: Delete domain screens and tab routes**

```bash
cd /Users/nihat/DevS/rn-boilerplate
rm -f app/\(app\)/session.tsx app/\(app\)/powerup-quiz.tsx app/\(app\)/bio-scan.tsx \
      app/\(app\)/gift-offer.tsx app/\(app\)/age-gate.tsx app/\(app\)/intro.tsx \
      app/\(app\)/debug-connections.tsx app/\(app\)/signup.tsx
rm -rf app/\(app\)/challenge app/\(app\)/lesson
rm -rf "app/(app)/(tabs)/messages" "app/(app)/(tabs)/challenges"
```

- [ ] **Step 2: Replace the tabs layout with a single Home tab**

Overwrite `app/(app)/(tabs)/_layout.tsx`:

```tsx
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { TabBar } from '@/components/ui/TabBar';
import { AppColors } from '@/constants/theme';
import { useT } from '@/context/LanguageContext';

export default function TabsLayout() {
  const t = useT();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs minimizeBehavior="onScrollDown" tintColor={AppColors.accent}>
        <NativeTabs.Trigger name="index/index">
          <Label>{t('tabs.home')}</Label>
          <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index/index" options={{ title: t('tabs.home') }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Replace the Home tab screen with a neutral placeholder**

Overwrite `app/(app)/(tabs)/index/index.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, Typography, Space } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg }}>
        <Text style={{ ...Typography.scale.display, color: AppColors.text, fontFamily: Typography.fonts.heading }}>
          MyApp
        </Text>
        <Text style={{ ...Typography.scale.body, color: AppColors.textSecondary, marginTop: Space.sm, fontFamily: Typography.fonts.body }}>
          Boilerplate home. Build your app here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Remove deleted-route registrations from `app/(app)/_layout.tsx`**

Open `app/(app)/_layout.tsx`. Remove any `<Stack.Screen name="..." />` entries (and related imports) referencing the screens deleted in Step 1 (`session`, `powerup-quiz`, `bio-scan`, `gift-offer`, `age-gate`, `intro`, `debug-connections`, `signup`, `challenge/[id]`, `lesson/[lessonId]`). Keep: `(tabs)`, `paywall`, `account`, `profile`, `consent`, `onboarding`, `subscription-success`, `subscription-cancelled`, `index`.

- [ ] **Step 5: Neutralize `app/(app)/index.tsx` redirect logic**

Open `app/(app)/index.tsx`. If it routes into deleted domain screens (e.g. `intro`, `age-gate`), simplify so that after auth/onboarding it redirects to the tabs home (`/(app)/(tabs)/index/index`). Remove imports of deleted hooks.

- [ ] **Step 6: Verify the deleted routes are unreferenced**

Run: `cd /Users/nihat/DevS/rn-boilerplate && grep -rn "session\|powerup-quiz\|bio-scan\|gift-offer\|age-gate\|debug-connections" app/ | grep -v "session" ; echo done`
Expected: only legitimate matches (e.g. Supabase `session` objects), no route references. Manually confirm none point at deleted files.

- [ ] **Step 7: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: strip domain screens, collapse to single Home tab"
```

---

### Task 3: Strip domain hooks, constants, context, services, and components

**Files:**
- Delete: domain hooks, constants, context, services, components (see Step 1)

**Interfaces:**
- Produces: only infrastructure modules remain. Task 4 fixes resulting dangling imports.

- [ ] **Step 1: Delete domain modules**

```bash
cd /Users/nihat/DevS/rn-boilerplate
# Hooks
rm -f hooks/useCouple.ts hooks/useLoveMaps.ts hooks/useMoodLog.ts \
      hooks/useLessonProgress.ts hooks/useMultiToneGeneration.ts hooks/useGiftOffer.ts \
      hooks/useProfileExtended.ts hooks/useUserContext.ts hooks/usePostReplyNudge.ts \
      hooks/useShareCard.ts hooks/useShareReward.ts hooks/useSessions.ts hooks/useOnboardingFlow.ts
# Constants
rm -f constants/archetypes.ts constants/challengeData.ts constants/intentThemes.ts constants/psychology.ts
# Context
rm -f context/MentalStateContext.tsx
# Services
rm -f services/contextBuilder.ts services/geminiWithContext.ts \
      services/paywallPersonalization.ts services/profileExtended.types.ts
# lib (domain logic)
rm -f lib/conversationTitle.ts lib/intentDetection.ts lib/replyQuality.ts lib/screenshotStorage.ts
# store
rm -f store/powerupProfile.ts
# Domain component groups
rm -rf components/gift components/powerup components/practice components/progress \
       components/infographic components/intro components/onboarding components/share \
       components/PsychBackFace.tsx components/AiDisclaimer.tsx components/FliqLogo.tsx \
       components/aurora components/AuroraImageLite.tsx components/GoldBlobBackground.tsx
```

> Keep `components/ui`, `components/shared`, `components/icons`, `components/chroma-ring`,
> `components/elastic-slider`, `components/glow`, `components/mesh-gradient` — these are
> generic/reusable. Task 4 will prune any of these that turn out to depend on deleted code.

- [ ] **Step 2: Commit the deletions (compile errors expected, fixed next task)**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: delete domain hooks/constants/context/services/components"
```

---

### Task 4: Resolve dangling imports until typecheck passes

**Files:**
- Modify: any file flagged by `tsc` that imports a deleted module
- Delete: generic components/screens that are unsalvageably coupled to domain code

**Interfaces:**
- Consumes: the stripped tree from Tasks 2–3.
- Produces: a tree where `npm run typecheck` passes. Later tasks assume a compiling tree.

- [ ] **Step 1: Install dependencies (needed for typecheck)**

```bash
cd /Users/nihat/DevS/rn-boilerplate
npm install
```
Expected: install completes (postinstall runs `patch-package`). If a patch fails because the patched file is gone, note it for Task 8.

- [ ] **Step 2: Run typecheck to list all broken imports**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run typecheck 2>&1 | tee /tmp/tc.log`
Expected: FAIL — a list of `Cannot find module '@/...'` / unused-symbol errors pointing at files that referenced deleted modules.

- [ ] **Step 3: Fix each flagged file**

For every error in `/tmp/tc.log`, open the file and apply the smallest fix:
- If the file is a generic component/hook/screen that merely *imports* a deleted helper, remove the import and the now-dead code path (delete the prop, branch, or call). Keep the component working with neutral defaults.
- If the file exists *only* to serve a deleted domain feature (e.g. a component under a kept folder that wraps `useCouple`), delete the file and re-run typecheck so its own importers surface.
- Never stub with `any` to silence errors — remove the dead code instead.

Repeat: fix a batch, re-run `npm run typecheck`, repeat until clean.

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run typecheck`
Expected: PASS (no output, exit 0).

- [ ] **Step 5: Run lint and autofix**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run lint:fix && npm run lint`
Expected: PASS. Fix any remaining lint errors (likely unused imports) by hand.

- [ ] **Step 6: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: resolve dangling imports, tree compiles clean"
```

---

### Task 5: Neutralize design tokens and fonts

**Files:**
- Modify: `constants/theme.ts`, `constants/fonts.ts`
- Modify: any file importing removed exports (`MODE_CONFIG`, `ACTIVE_MODES`, `AppMode`)

**Interfaces:**
- Consumes: compiling tree from Task 4.
- Produces: neutral palette + system font. Exports kept: `AppColors`, `Typography`, `BorderRadius`, `Shadows`, `CardThemes`, `CARD_THEME_KEYS`, `getCardTheme`, `AccentColors`, plus all spacing re-exports. Removed: `MODE_CONFIG`, `ACTIVE_MODES`, `AppMode`, `MODE`-related types.

- [ ] **Step 1: Rewrite `constants/theme.ts` with neutral values**

Overwrite `constants/theme.ts`:

```ts
// MyApp — Unified Design Token System
// Single source of truth for color, typography, border radius, and shadow tokens.
// Neutral starting palette — swap `accent` and the CardThemes for your brand.

export { Space, Relation, opticalPadding, ScreenPaddingH, ScreenPaddingTop, ScreenPaddingBottom } from './spacing';

// ─── Colors ──────────────────────────────────────────────────────────────────
export const AppColors = {
  background:    '#FFFFFF',
  surface:       '#F7F7F8',
  elevated:      '#FFFFFF',
  border:        '#E6E6E9',

  text:          '#0D0D14',
  textSecondary: '#6B6B7B',

  // Single swappable accent — replace these four with your brand color scale.
  accent:        '#3B82F6',
  accentLight:   '#EFF5FF',
  accentMuted:   '#DBE8FF',
  accentDeep:    '#1E40AF',

  premium:       '#9B59B6',
  success:       '#22C55E',
  error:         '#EF4444',
} satisfies Record<string, string>;

// ─── Typography ──────────────────────────────────────────────────────────────
// System font placeholder — register a custom font in fonts.ts and update here.
export const Typography = {
  fonts: {
    body:    'System',
    heading: 'System',
  },
  scale: {
    caption:    { fontSize: 12, lineHeight: 16 },
    body:       { fontSize: 16, lineHeight: 24 },
    subheading: { fontSize: 16, lineHeight: 22 },
    heading:    { fontSize: 20, lineHeight: 26 },
    display:    { fontSize: 30, lineHeight: 36 },
  },
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const BorderRadius = { sm: 8, md: 12, lg: 16, full: 9999 } as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  subtle: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, shadowOpacity: 0.04, elevation: 2 },
  medium: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, shadowOpacity: 0.08, elevation: 4 },
} as const;

// ─── Card Theme System (neutral pastel set) ──────────────────────────────────
export const CardThemes: Record<string, { bg: string; text: string; accent: string; accentLight: string }> = {
  slate:  { bg: '#F1F5F9', text: '#0F172A', accent: '#64748B', accentLight: '#CBD5E1' },
  blue:   { bg: '#E4EEFF', text: '#0A0E1A', accent: '#4D9FFF', accentLight: '#8CC4FF' },
  pink:   { bg: '#FFE4F3', text: '#1A0A14', accent: '#E8A0BF', accentLight: '#F4C4DA' },
  purple: { bg: '#F0E4FF', text: '#140A1A', accent: '#9B59B6', accentLight: '#C68FDB' },
  green:  { bg: '#E4FFE8', text: '#0A1A0E', accent: '#22C55E', accentLight: '#5EE890' },
  amber:  { bg: '#FFF6E0', text: '#1A140A', accent: '#F59E0B', accentLight: '#FFE08A' },
};

export const CARD_THEME_KEYS = ['slate', 'blue', 'pink', 'purple', 'green', 'amber'];
export type CardThemeKey = string;

export function getCardTheme(index: number) {
  return CardThemes[CARD_THEME_KEYS[index % CARD_THEME_KEYS.length]];
}

// ─── Dark Accent Colors (premium dark islands on light theme) ────────────────
export const AccentColors = {
  darkBg:        '#0A0A0F',
  darkElevated:  '#111118',
  darkSurface:   '#1A1A24',
  darkBorder:    'rgba(255,255,255,0.08)',
  darkText:      '#FFFFFF',
  darkTextMuted: '#9CA3AF',

  accentGradient:  ['#60A5FA', '#3B82F6', '#1E40AF'] as const,
  ctaGradient:     ['#60A5FA', '#3B82F6'] as const,
  premiumGlow:     ['#8B5CF6', '#C084FC', '#E879F9'] as const,
};
```

- [ ] **Step 2: Rewrite `constants/fonts.ts` to drop Plus Jakarta**

Overwrite `constants/fonts.ts`:

```ts
import * as Font from 'expo-font';

// Custom UI fonts removed for the boilerplate (system font is the default).
// To add a brand font: install it, require the .ttf here, and update
// Typography.fonts in constants/theme.ts.
export async function loadFonts() {
  await Font.loadAsync({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
  });
}
```

- [ ] **Step 3: Remove the Plus Jakarta dependency**

```bash
cd /Users/nihat/DevS/rn-boilerplate
npm uninstall @expo-google-fonts/plus-jakarta-sans
```

- [ ] **Step 4: Fix references to removed mode exports**

Run: `cd /Users/nihat/DevS/rn-boilerplate && grep -rn "MODE_CONFIG\|ACTIVE_MODES\|AppMode" app/ components/ hooks/ services/ lib/ context/`
For each match, remove the mode-switching logic (the boilerplate has one mode). Default any `mode` prop/state to a single neutral value and delete the selector UI.

- [ ] **Step 5: Verify typecheck and lint pass**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: neutralize design tokens and fonts"
```

---

### Task 6: Reorient the Gemini service toward the Live API

**Files:**
- Modify: `services/gemini.ts`
- Create: `services/README-gemini-live.md`

**Interfaces:**
- Consumes: compiling tree.
- Produces: `services/gemini.ts` exporting a configured client + a documented `connectLive()` seam. No domain prompt logic.

- [ ] **Step 1: Read the current client**

Run: `cd /Users/nihat/DevS/rn-boilerplate && sed -n '1,60p' services/gemini.ts`
Expected: see how the client/key is currently constructed (uses `@google/genai`).

- [ ] **Step 2: Strip domain prompt logic and add a Live API seam**

Edit `services/gemini.ts`: remove any fliq-specific prompt builders / reply-generation helpers. Keep the `@google/genai` client construction reading the key from env. Append a documented stub:

```ts
// ─── Gemini Live API seam ─────────────────────────────────────────────────────
// Real-time, low-latency multimodal sessions. See services/README-gemini-live.md.
// SECURITY: never ship GEMINI_API_KEY in the app for production Live sessions —
// mint an ephemeral token from the Cloudflare Worker (server/) and pass it here.
export async function connectLive(_opts?: { ephemeralToken?: string }) {
  throw new Error('connectLive() not implemented — wire up per services/README-gemini-live.md');
}
```

- [ ] **Step 3: Add the reference doc**

Create `services/README-gemini-live.md`:

```markdown
# Gemini Live API — integration notes

- Live API docs: https://ai.google.dev/gemini-api/docs/live-api
- Coding-agent / MCP docs: https://ai.google.dev/gemini-api/docs/coding-agents

## Pattern for this app
1. Client requests an ephemeral token from the Cloudflare Worker (`server/`),
   which holds the real `GEMINI_API_KEY` and calls the Gemini token endpoint.
2. App opens a Live session with the ephemeral token via `connectLive()`.
3. The real API key never ships in the app bundle.

Implement `connectLive()` in `services/gemini.ts` against `@google/genai`'s
Live API once the worker token endpoint exists.
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: reorient gemini service to Live API scaffold"
```

---

### Task 7: Strip the Cloudflare Worker backend to a health endpoint

**Files:**
- Modify: `server/src/` (reduce to one handler)
- Modify: `server/wrangler.toml` (placeholder name/vars)

**Interfaces:**
- Produces: a minimal worker exposing `GET /health` → `{ ok: true }`.

- [ ] **Step 1: Inspect the worker source**

Run: `cd /Users/nihat/DevS/rn-boilerplate && find server/src -type f && sed -n '1,40p' server/src/*.ts 2>/dev/null | head -60`
Expected: see the entry file and current routes.

- [ ] **Step 2: Replace the worker entry with a health handler**

Overwrite the worker entry file (the one referenced as `main` in `server/wrangler.toml`, e.g. `server/src/index.ts`):

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true });
    }
    return new Response('Not found', { status: 404 });
  },
};
```

Delete any other handler/route files under `server/src` that are now unused.

- [ ] **Step 3: Neutralize `server/wrangler.toml`**

Edit `server/wrangler.toml`: set `name = "myapp-worker"`, remove fliq-specific routes/KV/DO bindings and secrets, leaving commented placeholders documenting where the Gemini token endpoint and bindings would go.

- [ ] **Step 4: Verify the worker typechecks**

Run: `cd /Users/nihat/DevS/rn-boilerplate/server && npm install && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "refactor: reduce worker backend to health endpoint"
```

---

### Task 8: Rename identity, regenerate native projects, write docs

**Files:**
- Modify: `package.json`, `app.json`, `eas.json`, `i18n/` locales, `patches/`
- Delete: `android/`, `ios/`
- Create: `.env.local.example`, `CLAUDE.md`, `services/database.types.ts` (reset)

**Interfaces:**
- Produces: placeholder identity, regenerated native projects, accurate docs.

- [ ] **Step 1: Rename in JS/JSON config**

Edit these files, replacing fliq identity with placeholders:
- `package.json`: `"name": "myapp"`.
- `app.json`: `expo.name` → `MyApp`, `expo.slug` → `myapp`, `expo.scheme` → `myapp`, `ios.bundleIdentifier` → `com.yourorg.myapp`, `android.package` → `com.yourorg.myapp`. Remove fliq-specific plugin config keys (OneSignal app id, AppsFlyer keys) — leave the plugin entries but blank the ids.
- `eas.json`: remove fliq submit/credentials specifics; keep build profiles generic.

- [ ] **Step 2: Delete native projects (regenerated below)**

```bash
cd /Users/nihat/DevS/rn-boilerplate
rm -rf ios android
```

If `patches/` or `scripts/patch-eas-keychain.sh` reference fliq-only native files, delete those patch files too: `ls patches/` then remove any clearly fliq/native-signing-specific ones.

- [ ] **Step 3: Reset the Supabase types to an example schema**

Overwrite `services/database.types.ts`:

```ts
// Generated Supabase types go here.
// Regenerate with: supabase gen types typescript --project-id <id> > services/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string };
        Insert: { id: string; created_at?: string };
        Update: { id?: string; created_at?: string };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
```

Then fix any typecheck errors from screens that referenced deleted tables (point them at `profiles` or remove the query).

- [ ] **Step 4: Trim i18n locales to an English baseline**

Keep `i18n/` setup and the `en` locale. Remove fliq domain-specific translation keys that reference deleted screens, OR keep them (harmless) — at minimum ensure `tabs.home` exists. Delete extra locale files beyond `en` if they only contain fliq domain strings.

- [ ] **Step 5: Write `.env.local.example`**

Create `.env.local.example`:

```bash
# ─── Supabase ───────────────────────────────────────────────
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# ─── Gemini ─────────────────────────────────────────────────
GEMINI_API_KEY=
# ─── RevenueCat ─────────────────────────────────────────────
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
# ─── OneSignal ──────────────────────────────────────────────
EXPO_PUBLIC_ONESIGNAL_APP_ID=
# ─── Analytics ──────────────────────────────────────────────
EXPO_PUBLIC_MIXPANEL_TOKEN=
EXPO_PUBLIC_APPSFLYER_DEV_KEY=
EXPO_PUBLIC_FACEBOOK_APP_ID=
# ─── Sentry ─────────────────────────────────────────────────
EXPO_PUBLIC_SENTRY_DSN=
```

(Adjust names to match what `services/`, `lib/` actually read — grep `process.env` and `Constants.expoConfig` to confirm exact keys.)

- [ ] **Step 6: Write a new `CLAUDE.md` matching the real stack**

Overwrite `CLAUDE.md` with: the stack table from the design spec (Expo 54, NativeWind, Supabase, TanStack+MMKV, Gemini Live, RevenueCat, OneSignal, Mixpanel/AppsFlyer/Facebook, Sentry, i18next, CF Workers), the folder-structure section reflecting the stripped tree, a "Keys to fill" checklist pointing at `.env.local.example`, and the locked decisions (NativeWind UI, Supabase auth, Gemini AI). Do NOT carry over fliq's dating-domain "Design Context".

- [ ] **Step 7: Regenerate native projects**

```bash
cd /Users/nihat/DevS/rn-boilerplate
npx expo prebuild --clean
```
Expected: fresh `ios/` and `android/` generated with bundle id `com.yourorg.myapp`.

- [ ] **Step 8: Commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "chore: placeholder identity, regenerate native, write docs"
```

---

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm run lint`
Expected: PASS.

- [ ] **Step 3: Tests**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npm test`
Expected: PASS, or remove fliq-domain test files under `__tests__/` that test deleted features; keep infra tests. Re-run until green.

- [ ] **Step 4: Boot the bundler**

Run: `cd /Users/nihat/DevS/rn-boilerplate && npx expo start --no-dev --max-workers 1 &` then watch for "Bundled" / no red errors; stop after confirming Metro builds the entry.
Expected: Metro bundles `expo-router/entry` without resolution errors.

- [ ] **Step 5: Confirm no fliq branding remains**

Run: `cd /Users/nihat/DevS/rn-boilerplate && grep -rin "fliq\|coupleai\|plus.jakarta\|FF4D6D\|C9A84C" --include='*.ts' --include='*.tsx' --include='*.json' app components constants services lib | grep -vi node_modules`
Expected: no matches (or only inside the design spec doc). Fix any stragglers.

- [ ] **Step 6: Final commit**

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add -A && git commit -q -m "chore: final verification — boilerplate compiles, lints, boots clean"
```

---

### Task 10: Publish to GitHub as a private template repo

**Files:** none (publishing only)

**Interfaces:**
- Produces: `nihtavci/rn-boilerplate` on GitHub, private, marked as a template
  (so new apps start via "Use this template").

- [ ] **Step 1: Confirm gh auth and account**

Run: `gh auth status`
Expected: logged in. If the active account is not `nihtavci`, switch with `gh auth switch` or stop and ask the user.

- [ ] **Step 2: Add a README for the template**

Create `README.md` describing: what the boilerplate is, the stack, how to start a new app from it (copy `.env.local.example` → `.env.local`, set name/bundle id in `app.json`, run `expo prebuild`, fill keys), and a pointer to `docs/superpowers/specs/`.

```bash
cd /Users/nihat/DevS/rn-boilerplate
git add README.md && git commit -q -m "docs: add template README"
```

- [ ] **Step 3: Create the private repo and push**

```bash
cd /Users/nihat/DevS/rn-boilerplate
gh repo create nihtavci/rn-boilerplate --private --source=. --remote=origin --push
```
Expected: repo created, `main` pushed.

- [ ] **Step 4: Mark the repo as a template**

```bash
gh repo edit nihtavci/rn-boilerplate --template
```
Expected: `is_template: true`. Verify: `gh repo view nihtavci/rn-boilerplate --json isTemplate`.

- [ ] **Step 5: Report the repo URL and the "Use this template" workflow to the user.**
