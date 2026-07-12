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
