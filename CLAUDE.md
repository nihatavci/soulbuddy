# CLAUDE.md

MyApp — React Native (Expo) boilerplate. Replace this with your app's description.

---

## Stack

| Category | Technology |
|---|---|
| Mobile SDK | Expo SDK 54 / React Native 0.81 / React 19 |
| Navigation | expo-router 6 |
| UI | NativeWind 4 (Tailwind 3) |
| Auth | Supabase Auth (email OTP + Google + Apple) |
| Database | Supabase Postgres + RLS |
| Edge / Server | Cloudflare Workers + teenybase (server/) |
| Data fetching | TanStack Query + react-query-persist + MMKV |
| AI | Gemini Live API, via Cloudflare Worker proxy |
| Payments | RevenueCat |
| Push | OneSignal |
| Analytics | Mixpanel + AppsFlyer |
| Error tracking | Sentry |
| i18n | i18next |

---

## Folder Structure

```
/
├── app/                    # Expo Router screens
│   ├── (app)/              # Authenticated app shell
│   │   ├── (tabs)/         # Main tab navigator
│   │   ├── account.tsx     # Account management screen
│   │   ├── consent.tsx     # Privacy consent screen
│   │   ├── onboarding.tsx  # Onboarding flow
│   │   ├── paywall.tsx     # Subscription paywall
│   │   ├── profile.tsx     # User profile screen
│   │   └── ...
│   ├── (auth)/             # Unauthenticated auth flows
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── _layout.tsx         # Root layout (providers)
│   └── +not-found.tsx
├── components/             # Reusable UI components (NativeWind)
│   ├── chroma-ring/        # Animated processing ring
│   ├── elastic-slider/     # Custom slider
│   ├── glow/               # Glow effect
│   ├── icons/              # Icon wrappers
│   ├── mesh-gradient/      # Mesh gradient background
│   ├── shared/             # Shared primitives
│   └── ui/                 # Core UI elements
├── constants/              # Design tokens (fonts, spacing, theme)
├── context/                # React contexts (Auth, Language)
├── hooks/                  # TanStack Query hooks and utilities
├── i18n/                   # i18next translations (en, ro, tr)
├── lib/                    # SDK wrappers (appsflyer, mixpanel, sentry, etc.)
├── plugins/                # Expo config plugins
├── server/                 # Cloudflare Worker (teenybase backend)
├── services/               # Supabase client + Gemini client + DB types
├── store/                  # MMKV persistent store + queryClient config
└── CLAUDE.md               # This file
```

---

## Locked Decisions

- **UI:** NativeWind (Tailwind 3). Do not suggest Tamagui, Gluestack, or other UI libs.
- **Auth:** Supabase Auth. Do not suggest Clerk, BetterAuth, Auth0, or other providers.
- **AI:** Gemini (via Cloudflare Worker proxy). Never ship the Gemini API key in the client — it must only be a Worker secret. Do not introduce OpenAI, Anthropic, or other models.
- **Payments:** RevenueCat. Do not query payment status from anywhere else.

---

## Getting Started / Keys to Fill

1. Copy `.env.local.example` to `.env.local` and fill all keys.
2. See `services/README-gemini-live.md` for Gemini proxy setup.
3. Update `app.json`:
   - Set `expo.name`, `expo.slug`, `expo.scheme` to your app name.
   - Set `expo.ios.bundleIdentifier` and `expo.android.package`.
   - Set `expo.extra.eas.projectId` (from `eas init`).
   - Set `@react-native-google-signin/google-signin` `iosUrlScheme`.
   - Set `react-native-fbsdk-next` `appID` and `clientToken` if using Facebook.
   - Set `@sentry/react-native/expo` `project` and `organization`.
   - Set `onesignal-expo-plugin` `devTeam` (Apple Team ID).
4. Run `npx expo prebuild` to regenerate native projects.
5. Run `npm run typecheck` to verify types pass.
6. Fill Supabase: create your schema, regenerate types with:
   ```
   supabase gen types typescript --project-id <id> > services/database.types.ts
   ```

<!-- GSD:project-start source:PROJECT.md -->
## Project

**re:sense**

re:sense is a privacy-first, text-forward, intentionally non-addictive adult (18+) social discovery app. Instead of swiping profiles, a user drops a short anonymous **signal** (a half-sentence, a feeling, a place, a memory — max 120 characters) onto a daily-capped **Signal Board**. Others read it and **reply** by *adding* to it, not just reacting. When two people genuinely contribute to each other's signal, a **mutual resonance** unlocks and they move into a **private space** to keep talking. Identity stays behind a chosen **alias** — real name is never shown by default. The whole product optimizes for early-stage relational *quality*, not time-in-app.

The product slug/package name is `resense`; the display brand is `re:sense`.

**Core Value:** Two strangers move from **signal → response → mutual resonance → intentional private conversation** — feeling *heard* before being *judged*. If that arc feels alive, calm, and safe, everything else is secondary. The moat is behavioral design + privacy architecture, not a visual gimmick.

### Constraints

- **Tech stack**: Expo SDK 54 / React Native 0.81 / React 19, expo-router 6 — locked by the boilerplate.
- **UI**: NativeWind 4 (Tailwind 3) — locked. Do not introduce other UI libraries. Apply the `re:sense` design tokens from `PRD/design.md`.
- **Auth**: Supabase Auth (email + Google + Apple) — locked. Do not introduce other auth providers.
- **Database**: Supabase Postgres + RLS on the remote `re:sense` project (eu-west-1). RLS + alias/trust-state separation is the anonymity enforcement point.
- **Edge/Server**: Cloudflare Workers + teenybase available for server-side logic when needed.
- **AI**: Gemini via Cloudflare Worker proxy only — key never ships in the client. Not used in the human-to-human loop for v1.
- **Payments**: RevenueCat — the only source of payment status, when monetization is added (deferred).
- **Platform**: iOS + Android from one Expo codebase.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| asc-app-create-ui | Create an App Store Connect app via iris API using web session from Blitz | `.claude/skills/asc-app-create-ui/SKILL.md` |
| asc-apple-ads | Use when managing Apple Ads with asc, including auth, org lookup, campaigns, ad groups, ads, keywords, reports, raw API calls, and safe live testing. | `.claude/skills/asc-apple-ads/SKILL.md` |
| asc-aso-audit | Run an offline ASO audit on canonical App Store metadata under `./metadata` and surface keyword gaps using Astro MCP. Use after pulling metadata with `asc metadata pull`. | `.claude/skills/asc-aso-audit/SKILL.md` |
| asc-build-lifecycle | Track build processing, find latest builds, and clean up old builds with asc. Use when managing build retention or waiting on processing. | `.claude/skills/asc-build-lifecycle/SKILL.md` |
| asc-cli-usage | Guidance for using asc cli in this repo (flags, output formats, pagination, auth, and discovery). Use when asked to run or design asc commands or interact with App Store Connect via the CLI. | `.claude/skills/asc-cli-usage/SKILL.md` |
| asc-crash-triage | Triage TestFlight crashes, beta feedback, and performance diagnostics using asc. Use when the user asks about TF crashes, TestFlight crash reports, beta tester feedback, app hangs, disk writes, launch diagnostics, or wants a crash summary for a build or app. | `.claude/skills/asc-crash-triage/SKILL.md` |
| asc-iap-attach | Attach in-app purchases and subscriptions to an app version for App Store review. Use when the user has IAPs or subscriptions in "Ready to Submit" state that need to be included with a first-time version submission. Works for both first-time and subsequent submissions. | `.claude/skills/asc-iap-attach/SKILL.md` |
| asc-id-resolver | Resolve App Store Connect IDs (apps, builds, versions, groups, testers) from human-friendly names using asc. Use when commands require IDs. | `.claude/skills/asc-id-resolver/SKILL.md` |
| asc-localize-metadata | Automatically translate and sync App Store metadata (description, keywords, what's new, subtitle) to multiple languages using LLM translation and asc CLI. Use when asked to localize an app's App Store listing, translate app descriptions, or add new languages to App Store Connect. | `.claude/skills/asc-localize-metadata/SKILL.md` |
| asc-metadata-sync | Sync, validate, and apply App Store metadata with the current asc canonical metadata workflow. Use when updating metadata, localizations, keywords, or migrating legacy fastlane metadata. | `.claude/skills/asc-metadata-sync/SKILL.md` |
| asc-notarization | Archive, export, and notarize macOS apps using xcodebuild and asc. Use when you need to prepare a macOS app for distribution outside the App Store with Developer ID signing and Apple notarization. | `.claude/skills/asc-notarization/SKILL.md` |
| asc-ppp-pricing | Set territory-specific pricing for subscriptions and in-app purchases using current asc setup, pricing summary, price import, and price schedule commands. Use when adjusting prices by country or implementing localized PPP strategies. | `.claude/skills/asc-ppp-pricing/SKILL.md` |
| asc-privacy-nutrition-labels | Set up App Store privacy nutrition labels (data collection declarations) for an app. Use when the user needs to declare what data their app collects, how it's used, and whether it's linked to the user. Handles both "no data collected" and full data collection declarations. | `.claude/skills/asc-privacy-nutrition-labels/SKILL.md` |
| asc-release-flow | Determine whether an app is ready to submit, then drive the current App Store release flow with asc, including validation, staging, review submission, first-time availability, subscriptions, IAP, Game Center, and App Privacy checks. | `.claude/skills/asc-release-flow/SKILL.md` |
| asc-revenuecat-catalog-sync | Reconcile App Store Connect subscriptions and in-app purchases with RevenueCat products, entitlements, offerings, and packages using asc and RevenueCat MCP. Use when setting up or syncing subscription catalogs across ASC and RevenueCat. | `.claude/skills/asc-revenuecat-catalog-sync/SKILL.md` |
| asc-screenshot-resize | Resize and validate App Store screenshots with current asc screenshot-size data and macOS sips. Use when preparing or fixing screenshots for App Store Connect submission. | `.claude/skills/asc-screenshot-resize/SKILL.md` |
| asc-shots-pipeline | Orchestrate iOS screenshot automation with xcodebuild/simctl for build-run, AXe for UI actions, JSON settings and plan files, Koubou-based framing (`asc screenshots frame`), and screenshot upload (`asc screenshots upload`). Use when users ask for automated screenshot capture, AXe-driven simulator flows, frame composition, or screenshot-to-upload pipelines. | `.claude/skills/asc-shots-pipeline/SKILL.md` |
| asc-signing-setup | Set up bundle IDs, capabilities, signing certificates, provisioning profiles, and encrypted signing sync with the asc cli. Use when onboarding a new app, rotating signing assets, or sharing them across a team. | `.claude/skills/asc-signing-setup/SKILL.md` |
| asc-submission-health | Validate App Store submission readiness, submit prepared versions, and monitor review status with current asc commands. Use when shipping or troubleshooting review submissions. | `.claude/skills/asc-submission-health/SKILL.md` |
| asc-subscription-localization | Bulk-localize subscription and in-app purchase display names across all App Store locales using asc. Use when you want to fill in subscription/IAP names for every language without clicking through App Store Connect manually. | `.claude/skills/asc-subscription-localization/SKILL.md` |
| asc-team-key-create | Create a new App Store Connect Team API Key with Admin permissions, download the one-time .p8 private key, and store it in ~/.blitz. Use when the user needs a new ASC API key for CLI auth, CI/CD, or external tooling. | `.claude/skills/asc-team-key-create/SKILL.md` |
| asc-testflight-orchestration | Orchestrate TestFlight distribution, groups, testers, and What to Test notes using asc. Use when rolling out betas. | `.claude/skills/asc-testflight-orchestration/SKILL.md` |
| asc-wall-submit | Submit or update a Wall of Apps entry in the App-Store-Connect-CLI repository using `asc apps wall submit`. Use when the user says "submit to wall of apps", "add my app to the wall", or "wall-of-apps". | `.claude/skills/asc-wall-submit/SKILL.md` |
| asc-whats-new-writer | Generate engaging, localized App Store release notes (What's New) from git log, bullet points, or free text using canonical metadata under `./metadata`. Optionally pairs with promotional text updates. | `.claude/skills/asc-whats-new-writer/SKILL.md` |
| asc-workflow | Define, validate, run, resume, and audit repo-local multi-step automations with current `asc workflow` and `.asc/workflow.json`, including step outputs and safe release/TestFlight workflows. | `.claude/skills/asc-workflow/SKILL.md` |
| asc-xcode-build | Build, archive, export, upload, and manage Xcode version/build numbers with the current asc xcode helpers before App Store Connect upload or submission. Use when creating an IPA or PKG for upload. | `.claude/skills/asc-xcode-build/SKILL.md` |
| aso-appstore-screenshots | Generate high-converting App Store screenshots by analyzing your app's codebase, discovering core benefits, and creating ASO-optimized screenshot images using Nano Banana Pro. | `.claude/skills/aso-appstore-screenshots/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
