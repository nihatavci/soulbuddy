-- ============================================================
-- Drop dormant BetterAuth tables
-- These tables were created for BetterAuth but the app has
-- migrated to Clerk. They have no RLS policies and are unused.
-- ============================================================

-- Drop indexes first
DROP INDEX IF EXISTS session_user_idx;
DROP INDEX IF EXISTS account_user_idx;
DROP INDEX IF EXISTS account_provider_idx;

-- Drop tables in FK order (children before parents)
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
