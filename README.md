# rn-boilerplate

A production-grade, app-agnostic **React Native (Expo) boilerplate** — the proven infrastructure of a shipped app, with all domain code stripped out and the visual identity neutralized. Click **"Use this template"** to start a new app with fresh git history.

## Stack

| Category | Technology |
|---|---|
| Mobile SDK | Expo SDK 54 · React Native 0.81 · React 19 |
| Navigation | expo-router 6 |
| UI | NativeWind 4 (Tailwind 3) + a tokenized design system |
| Auth | Supabase Auth — email/OTP + Google + Apple sign-in |
| Database | Supabase Postgres + RLS |
| Edge / Server | Cloudflare Workers + teenybase (`server/`) |
| Data / cache | TanStack Query + react-query-persist + MMKV |
| AI | Gemini, oriented toward the [Live API](https://ai.google.dev/gemini-api/docs/live-api) via a Worker proxy |
| Payments | RevenueCat (+ paywall) |
| Push | OneSignal |
| Analytics | Mixpanel + AppsFlyer |
| Error monitoring | Sentry |
| i18n | i18next |

## Starting a new app

1. **Use this template** on GitHub (or `gh repo create my-app --template nihatavci/rn-boilerplate`).
2. `npm install`
3. Copy env and fill keys: `cp .env.local.example .env.local`
4. Set your identity in `app.json`: `name`, `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, and replace the `REPLACE_ME` plugin placeholders (Google sign-in, Facebook).
5. Pick your brand: edit the accent + tokens in `constants/theme.ts` (and register a font in `constants/fonts.ts`).
6. Regenerate native projects: `npx expo prebuild`
7. Verify: `npm run typecheck && npm run lint && npm test`
8. Wire AI: see [`services/README-gemini-live.md`](services/README-gemini-live.md) — never ship the Gemini key in the client; mint an ephemeral token from the Worker.

## What's included

- Auth flow (sign-in / sign-up / forgot / reset) + `AuthContext` with encrypted MMKV session persistence.
- Tab + stack navigation shell with a neutral Home screen.
- Generic shells: onboarding, paywall, account, profile, consent, subscription success/cancelled.
- Tokenized design system (`constants/{theme,spacing,fonts}.ts`) — neutral palette, light theme.
- SDK wrappers in `lib/` (RevenueCat, OneSignal, Mixpanel, AppsFlyer, Facebook, Sentry, consent).
- Lean Gemini client (`services/gemini.ts`) with a Live-API seam.
- Cloudflare Worker skeleton (`server/`) with a `/health` endpoint.
- Tooling: TypeScript, ESLint, Prettier, Jest (passing infra tests).

## Notes

- `i18n/` still carries some leftover copy from the source app — replace strings per app.
- Architecture conventions and the "keys to fill" checklist live in [`CLAUDE.md`](CLAUDE.md).
- The original design spec and build plan are under `docs/superpowers/`.
