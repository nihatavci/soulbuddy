# RN Boilerplate — Design Spec

**Date:** 2026-06-21
**Target location:** `/Users/nihat/DevS/rn-boilerplate`
**Source:** `/Users/nihat/fliq` (Expo SDK 54, RN 0.81)

## Goal

A runnable, app-agnostic Expo React Native template derived from the fliq
codebase by copy-and-strip. It keeps fliq's proven infrastructure and design-
system *structure* while removing all dating/coaching domain code and fliq's
visual identity. Cloned per future app; identity and schema filled in per app.

## Method

Clone fliq into the target, surgically strip domain features, neutralize
identity, blank all keys, regenerate native projects, reinitialize git.

## Tech stack (kept — matches what is actually installed)

| Category | Technology |
|---|---|
| Mobile SDK | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | expo-router 6 |
| UI | NativeWind 4 (Tailwind 3) |
| Auth | Supabase Auth — email/OTP + Google + Apple sign-in |
| Database | Supabase (Postgres + RLS) |
| Edge backend | Cloudflare Workers + teenybase (`server/`) — health endpoint only |
| Data/cache | TanStack Query + react-query-persist + MMKV |
| AI | Google Gemini, oriented toward the **Gemini Live API** (real-time) |
| Payments | RevenueCat (+ paywall UI) |
| Push | OneSignal (+ onesignal-expo-plugin) |
| Analytics | Mixpanel + AppsFlyer + Facebook SDK + consent flow |
| Error monitoring | Sentry |
| i18n | i18next + react-i18next (en baseline) |

> Note: fliq's `CLAUDE.md` had drifted (it described PostHog + HeroUI). The
> boilerplate's `CLAUDE.md` is rewritten to match the real stack above.

## What stays (reusable core)

- **Navigation shell**: `app/_layout.tsx`, `app/index.tsx`, `app/+not-found.tsx`,
  route groups `(auth)`, `(app)`, `(app)/(tabs)` with their `_layout.tsx` files.
- **Auth**: `context/AuthContext.tsx`, `services/supabase.ts`, Google/Apple sign-in,
  encrypted MMKV session persistence; `(auth)` screens: sign-in, sign-up,
  forgot-password, reset-password.
- **Data layer**: `store/queryClient.ts`, `store/mmkv.ts`, `hooks/useNetworkSync.ts`;
  `services/database.types.ts` reset to an empty/example schema.
- **Design system (structure only)**: `constants/spacing.ts`, `constants/theme.ts`,
  `constants/fonts.ts`, animation patterns (spring-press, FadeInDown, ChromaRing),
  reusable NativeWind components in `components/` — palette/font neutralized.
- **Monetization**: `lib/revenuecat.ts`, `hooks/useEntitlements.ts`,
  `app/(app)/paywall.tsx`, subscription-success/cancelled screens. Keys blanked.
- **Push**: `lib/onesignal.ts` + expo plugin config. Keys blanked.
- **Analytics**: `lib/mixpanel.ts`, `lib/appsflyer.ts`, `lib/facebook.ts`,
  `lib/consent.ts`, `app/(app)/consent.tsx`. Keys blanked.
- **AI**: `services/gemini.ts` scaffold reoriented toward the Gemini Live API,
  with a reference note to the Live API + coding-agent docs and an ephemeral-key/
  proxy seam left as a TODO.
- **Backend**: `server/` Cloudflare Workers + teenybase, stripped to a health
  endpoint.
- **Cross-cutting**: `lib/sentry.ts`, `i18n/` (en only, structure for more),
  generic screens: onboarding shell, account, profile.
- **Cross-cutting libs kept**: `lib/dataExport.ts`, `lib/review.ts`,
  `lib/launchFlags.ts`, `lib/imageResize.ts`, `hooks/useAccountDeletion.ts`,
  `hooks/useHapticOnFocus.ts`, `context/LanguageContext.tsx`.
- **Tooling**: eslint/prettier/jest/tsconfig/babel/metro configs, `__mocks__/`,
  generic `scripts/`, `eas.json`, `app.json` (placeholders).

## What gets stripped (fliq domain)

- **Screens**: `session`, `powerup-quiz`, `bio-scan`, `gift-offer`, `age-gate`,
  `intro`, `challenges/`, `messages/`, `lesson/`, `challenge/`, `debug-connections`.
- **Constants**: `archetypes`, `challengeData`, `intentThemes`, `psychology`.
- **Context**: `MentalStateContext`.
- **Hooks**: `useCouple`, `useLoveMaps`, `useMoodLog`, `useLessonProgress`,
  `useMultiToneGeneration`, `useGiftOffer`.
- **lib/services**: `conversationTitle`, `intentDetection`, `replyQuality`,
  `screenshotStorage`, `contextBuilder`, `geminiWithContext`,
  `paywallPersonalization`, `profileExtended.types`, `store/powerupProfile`.
- **Artifacts/cruft**: all `build-*.ipa/.aab/.apk`, `*.jks`/keystores, `.env.local`,
  all `.docx`/`.xlsx`, `screenshots/`, `Journal mockup/`, `aura/`, `landing/`,
  `dist/`, `logos/`, `src/`, `src-backend/`, `~/`, stray skill/lock files,
  fliq-specific `.planning/`, `docs/`.

## Neutralization

- Palette → neutral grayscale + a single swappable accent token; remove
  Plus Jakarta Sans → system/placeholder font; keep light-only; token structure
  intact.
- Rename `coupleai` / `Fliq` → placeholder `MyApp` / `com.yourorg.myapp` across
  `app.json`, `package.json`, and configs.
- New `CLAUDE.md` matching the real stack + folder conventions + "keys to fill"
  checklist.
- New `.env.local.example` listing every required key with empty values.
- Delete `android/` and `ios/`; regenerate via `expo prebuild` after the new
  bundle ID is set (avoids stale fliq native config/signing).
- Fresh git history (`git init`); `.gitignore` keeps native build outputs out.
- This spec is copied into the repo at
  `docs/superpowers/specs/2026-06-21-rn-boilerplate-design.md` and committed.

## Success criteria

1. `npm install` succeeds in the new repo.
2. `npm run typecheck` and `npm run lint` pass (after stripping leaves no dangling imports).
3. `npx expo prebuild` regenerates native projects with the placeholder bundle ID.
4. App boots to the auth screen with neutral theme; no fliq branding or domain screens remain.
5. `CLAUDE.md` + `.env.local.example` accurately document the kept stack and required keys.

## Out of scope

- Implementing any new app's actual features.
- Filling in real API keys/accounts.
- Re-theming to a specific brand identity (left neutral for per-app choice).
