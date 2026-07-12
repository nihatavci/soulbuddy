/**
 * jest.setup.js — Global Jest setup for CoupleAI
 *
 * Runs after the jest-expo preset setup. Provides missing globals that
 * Expo SDK 54's winter runtime expects in a native context but are not
 * available in the Jest (jsdom/node) environment.
 */

// Expo SDK 54 lazily loads ImportMetaRegistry via a global getter.
// Pre-populate the global so the lazy getter never fires outside test scope.
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
  global.__ExpoImportMetaRegistry = {};
}

// Stub env vars used at module-load time (e.g. services/supabase.ts requires
// EXPO_PUBLIC_SUPABASE_URL or createClient throws "supabaseUrl is required").
process.env.EXPO_PUBLIC_SUPABASE_URL ||= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';
