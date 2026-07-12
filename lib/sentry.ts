/**
 * lib/sentry.ts — Sentry Error Monitoring
 *
 * Captures unhandled errors, slow transactions, and breadcrumbs.
 * Privacy-first: never logs sensitive health data per CLAUDE.md constraints.
 *
 * Setup (one-time):
 *  1. Create a Sentry project at https://sentry.io
 *  2. Add DSN to .env.local as EXPO_PUBLIC_SENTRY_DSN
 *  3. Add SENTRY_AUTH_TOKEN as EAS secret (for source map uploads):
 *       eas secret:create --name SENTRY_AUTH_TOKEN --value <token>
 *  4. Run: npm install @sentry/react-native
 */

import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, Scope } from '@sentry/react-native';
import { getConsentPreferences, hasGivenConsent } from '@/lib/consent';

// ─── Initialize ──────────────────────────────────────────────────────────────
// Call once at the very top of app/_layout.tsx BEFORE any other code runs.

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

  if (!dsn) {
    if (__DEV__) console.warn('[Sentry] No DSN found — error monitoring disabled. Add EXPO_PUBLIC_SENTRY_DSN to .env.local');
    return;
  }

  // Respect GDPR consent: if the user has explicitly rejected crash reporting,
  // Sentry stays disabled. If consent hasn't been given yet (first launch),
  // Sentry initializes but will be reconfigured after the consent screen.
  const consentGiven = hasGivenConsent();
  const crashConsent = consentGiven ? getConsentPreferences().crashReport : true;

  Sentry.init({
    dsn,

    // Performance monitoring — sample 20% of transactions in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Disabled in dev, or when user has rejected crash reporting consent
    enabled: !__DEV__ && crashConsent,

    // Environment tag for filtering in Sentry dashboard
    environment: __DEV__ ? 'development' : 'production',

    // ── Privacy: NEVER send PII (emails, IPs, usernames, cookies) ──────
    sendDefaultPii: false,

    // Session Replay — captures screen recordings for error context
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,

    // Integrations: mobile replay for session recordings, feedback widget
    integrations: [
      Sentry.mobileReplayIntegration({
        // Mask all text and images in session replays by default
        maskAllText: true,
        maskAllImages: true,
      }),
      Sentry.feedbackIntegration(),
    ],

    // ── Privacy: strip sensitive data from breadcrumbs ────────────────────
    beforeBreadcrumb(breadcrumb: Breadcrumb) {
      // Strip any breadcrumb that might contain mood/journal/therapy content
      const sensitiveCategories = ['mood', 'journal', 'therapy', 'session_content'];
      if (breadcrumb.category && sensitiveCategories.includes(breadcrumb.category)) {
        return null; // Drop the breadcrumb entirely
      }

      // Redact user input from UI breadcrumbs (TextInput values)
      if (breadcrumb.category === 'ui.input') {
        breadcrumb.message = '[redacted]';
      }

      // Redact fetch/xhr URLs that might contain user IDs or tokens
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          try {
            const url = new URL(breadcrumb.data.url);
            url.search = ''; // Strip query parameters (may contain tokens/IDs)
            breadcrumb.data.url = url.toString();
          } catch {
            // Not a valid URL, leave as-is
          }
        }
        // Never log request/response bodies in network breadcrumbs
        delete breadcrumb.data?.body;
        delete breadcrumb.data?.response_body;
      }

      return breadcrumb;
    },

    // ── Privacy + Consent: check at send time so runtime toggle changes take effect ─
    beforeSend(event: any) {
      // Respect crash report consent — checked dynamically so in-session toggles work
      if (hasGivenConsent() && !getConsentPreferences().crashReport) {
        return null;
      }

      // Strip user PII — only keep anonymous user ID
      if (event.user) {
        const safeUser: { id?: string } = {};
        if (event.user.id) safeUser.id = event.user.id;
        event.user = safeUser;
        // Explicitly remove fields that sendDefaultPii might add
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }

      // Strip IP address from SDK context
      if (event.sdk?.packages) {
        delete event.sdk.client_ip;
      }

      // Remove request body data that might contain user content
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        // Strip query strings from URLs (may contain tokens)
        if (event.request.url) {
          try {
            const url = new URL(event.request.url);
            url.search = '';
            event.request.url = url.toString();
          } catch {
            // Not a valid URL, leave as-is
          }
        }
        // Remove headers that may contain auth tokens or PII
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['cookie'];
          delete event.request.headers['X-Forwarded-For'];
          delete event.request.headers['x-forwarded-for'];
        }
      }

      // Strip conversation/chat content from extra context
      if (event.extra) {
        const piiKeys = ['moodText', 'journalEntry', 'sessionContent', 'therapyNotes',
                         'chatMessage', 'userMessage', 'aiResponse', 'conversationHistory'];
        for (const key of piiKeys) {
          delete event.extra[key];
        }
      }

      return event;
    },

    // Attach stack traces to all messages (not just errors)
    attachStacktrace: true,

    // Limit breadcrumb buffer
    maxBreadcrumbs: 50,
  });
}

// ─── User identification ─────────────────────────────────────────────────────
// Call when the user signs in / session becomes available.
// Only sends user ID — never email, name, or health data to Sentry.

export function identifySentryUser(userId: string): void {
  Sentry.setUser({ id: userId });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

// ─── Manual error capture ────────────────────────────────────────────────────
// For caught errors that should still be reported.

export function captureError(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope: Scope) => {
      // Never include health data in extra context
      const safeContext = { ...context };
      delete safeContext.moodText;
      delete safeContext.journalEntry;
      delete safeContext.sessionContent;
      delete safeContext.therapyNotes;

      scope.setExtras(safeContext);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

// ─── Manual message capture ──────────────────────────────────────────────────
// For non-error events you still want to track.

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

// ─── Navigation tracking ─────────────────────────────────────────────────────
// Expo Router integration for automatic screen transaction tracking.

export const sentryRoutingInstrumentation = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

// ─── Sentry wrap for root component ─────────────────────────────────────────
// Wraps the root component to enable performance monitoring and error boundary.

export const SentryWrap = Sentry.wrap;

// ─── Re-export for convenience ───────────────────────────────────────────────
export { Sentry };
