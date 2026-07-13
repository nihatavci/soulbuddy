/**
 * AuthContext
 *
 * Auth state management backed by Supabase Auth. Exposes the same public API
 * the rest of the app already uses -- nothing else in the codebase needs to
 * know about the auth provider directly.
 *
 * Public interface (unchanged):
 *   user, session, isLoading, isAuthenticated
 *   signIn(email, password)
 *   signUp(email, password, name)
 *   signOut()
 *   handleMagicLinkSession(token)   -- no-op stub for backward compat
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase, startAutoRefresh, stopAutoRefresh } from '@/services/supabase';
import { queryClient } from '@/store/queryClient';
import { loginRevenueCat, logoutRevenueCat } from '@/lib/revenuecat';
import { ENTITLEMENTS_QUERY_KEY } from '@/hooks/useEntitlements';
import { logAppsFlyerEvent, AFEvent } from '@/lib/appsflyer';

// ── Types ────────────────────────────────────────────────────────────────────

/** Minimal user shape -- preserved exactly for downstream consumers. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

/** Minimal session shape. */
export interface AuthSession {
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True when user has a Supabase session but is anonymous (no email/password). */
  isAnonymous: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  /** Native Sign in with Apple → Supabase signInWithIdToken (iOS). */
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Creates an anonymous Supabase session (valid JWT, no real account). */
  signInAnonymously: () => Promise<void>;
  /** No-op stub -- kept for backward compatibility. */
  handleMagicLinkSession: (token: string) => Promise<{ error: string | null }>;
}

type AuthContextValue = AuthState & AuthActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a Supabase User to the app's AuthUser shape. */
function mapUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      '',
    image: user.user_metadata?.avatar_url,
  };
}

/** Map a Supabase Session to the app's AuthSession shape. */
function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return { token: session.access_token };
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Track the last identified (non-anon) user we aliased in RevenueCat so
  // we only call Purchases.logIn on actual identity transitions, not every
  // token refresh.
  const lastRcUserIdRef = useRef<string | null>(null);

  // ── Initialize session + subscribe to auth changes ──────────────────────

  useEffect(() => {
    // 1. Get the persisted session (from MMKV)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
      if (initialSession?.user && !initialSession.user.is_anonymous) {
        lastRcUserIdRef.current = initialSession.user.id;
        loginRevenueCat(initialSession.user.id).catch(() => {});
      }
    });

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      // Keep RevenueCat identity in lock-step with Supabase identity so any
      // sign-in path (Google, Apple, email OTP, signUp/signIn) automatically
      // aliases the RC anon user to the real user. Idempotent.
      const user = newSession?.user;
      if (user && !user.is_anonymous && lastRcUserIdRef.current !== user.id) {
        lastRcUserIdRef.current = user.id;
        loginRevenueCat(user.id)
          .then(() => queryClient.invalidateQueries({ queryKey: ENTITLEMENTS_QUERY_KEY }))
          .catch(() => {});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Foreground / background auto-refresh management ─────────────────────

  useEffect(() => {
    // Start auto-refresh when the provider mounts (app is in foreground)
    startAutoRefresh();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        startAutoRefresh();
      } else if (
        appStateRef.current === 'active' &&
        nextState.match(/inactive|background/)
      ) {
        stopAutoRefresh();
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      stopAutoRefresh();
      sub.remove();
    };
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────

  const user = useMemo(() => mapUser(session?.user), [session?.user]);
  const authSession = useMemo(() => mapSession(session), [session]);

  // ── Sign In ─────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) return { error: error.message };
        logAppsFlyerEvent(AFEvent.LOGIN, { method: 'email' });
        return { error: null };
      } catch (err: any) {
        return {
          error: err?.message ?? 'Sign in failed. Check your credentials.',
        };
      }
    },
    [],
  );

  // ── Sign Up ─────────────────────────────────────────────────────────────

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
    ): Promise<{ error: string | null }> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) return { error: error.message };

        // Supabase may require email confirmation. If identities is empty,
        // it means the user already exists or confirmation is pending.
        if (
          data.user &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          return { error: 'An account with this email already exists.' };
        }

        // If email confirmation is required, session will be null
        if (data.user && !data.session) {
          return {
            error: 'Please check your email and confirm your account.',
          };
        }

        return { error: null };
      } catch (err: any) {
        return {
          error: err?.message ?? 'Sign up failed. Please try again.',
        };
      }
    },
    [],
  );

  // ── Sign in with Apple ──────────────────────────────────────────────────
  // Native Apple auth → Supabase signInWithIdToken. Nonce: the hashed nonce goes
  // to Apple, the raw nonce to Supabase (replay protection). Requires the Apple
  // provider to be enabled in the Supabase dashboard.

  const signInWithApple = useCallback(
    async (): Promise<{ error: string | null }> => {
      try {
        const rawNonce = Array.from(Crypto.getRandomBytes(16))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce,
        );

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });

        if (!credential.identityToken) {
          return { error: 'No identity token returned from Apple.' };
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });
        if (error) return { error: error.message };

        logAppsFlyerEvent(AFEvent.LOGIN, { method: 'apple' });
        return { error: null };
      } catch (err: any) {
        // User cancelled the native sheet — not an error.
        if (err?.code === 'ERR_REQUEST_CANCELED') return { error: null };
        return { error: err?.message ?? 'Apple sign in failed.' };
      }
    },
    [],
  );

  // ── Sign Out ────────────────────────────────────────────────────────────

  const signOutFn = useCallback(async () => {
    // 1. Clear Supabase session
    await supabase.auth.signOut();

    // 2. Clear RevenueCat identity so next user doesn't inherit prev appUserID
    try {
      await logoutRevenueCat();
    } catch {
      // Non-blocking
    }
    lastRcUserIdRef.current = null;

    // 3. Clear Google cached session so next sign-in shows account picker
    try {
      await GoogleSignin.signOut();
    } catch {
      // Google sign-out is best-effort — user may not have used Google
    }

    // 4. Wipe TanStack Query cache (no stale user data or entitlements)
    try {
      queryClient.clear();
    } catch {
      // Non-blocking
    }

    // Device-level flags (onboarding_v3_complete, intro_v1_seen, age_verified_18_plus,
    // paywall_deferred, onboarding_profile, review_prompt_shown) intentionally persist
    // across sign-out. They represent one-time device setup, not per-account state.
    // Signing out should NOT force the user back through onboarding they've already done.

    // Session/user state updated automatically via onAuthStateChange
  }, []);

  // ── Anonymous Sign-In ────────────────────────────────────────────────────
  // Creates a valid Supabase session without email/password. The JWT works
  // for Worker auth. When the user later signs up, the anonymous session
  // is replaced by the real one via onAuthStateChange.

  const signInAnonymously = useCallback(async () => {
    try {
      await supabase.auth.signInAnonymously();
    } catch (err) {
      if (__DEV__) console.warn('[Auth] signInAnonymously failed:', err);
    }
  }, []);

  // ── Magic Link (no-op stub) ─────────────────────────────────────────────

  const handleMagicLinkSession = useCallback(
    async (_token: string): Promise<{ error: string | null }> => {
      return { error: null };
    },
    [],
  );

  // ── Derived: is the current session anonymous? ─────────────────────────
  const isAnonymous = !!session?.user?.is_anonymous;

  // ── Context value ───────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session: authSession,
      isLoading,
      isAuthenticated: !!session,
      isAnonymous,
      signIn,
      signUp,
      signInWithApple,
      signOut: signOutFn,
      signInAnonymously,
      handleMagicLinkSession,
    }),
    [user, authSession, isLoading, session, isAnonymous, signIn, signUp, signInWithApple, signOutFn, signInAnonymously, handleMagicLinkSession],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
