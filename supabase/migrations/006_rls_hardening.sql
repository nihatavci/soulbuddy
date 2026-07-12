-- ============================================================
-- 006_rls_hardening.sql — RLS Policy Audit & Fix
--
-- Issues addressed:
--   1. profile_extended uses auth.jwt()->>'sub' instead of auth.uid()
--   2. profile_extended missing DELETE policy
--   3. couples missing DELETE policy
--   4. mood_entries uses permissive FOR ALL — replaced with explicit per-op policies
--   5. love_maps uses permissive FOR ALL — replaced with explicit per-op policies
--   6. messages missing UPDATE policy (003 added SELECT/INSERT/DELETE but not UPDATE)
--   7. Standardise all policies to use auth.uid()::text (Supabase Auth native)
--      instead of the legacy auth_user_id() helper that read BetterAuth JWT claims
-- ============================================================

-- ─── 1. Fix profile_extended: drop old policies, recreate with auth.uid() + add DELETE ──

DROP POLICY IF EXISTS "Users can read own extended profile"   ON profile_extended;
DROP POLICY IF EXISTS "Users can insert own extended profile" ON profile_extended;
DROP POLICY IF EXISTS "Users can update own extended profile" ON profile_extended;

CREATE POLICY "profile_ext_select_own" ON profile_extended
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "profile_ext_insert_own" ON profile_extended
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "profile_ext_update_own" ON profile_extended
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "profile_ext_delete_own" ON profile_extended
  FOR DELETE
  USING (auth.uid()::text = user_id);


-- ─── 2. Couples: add DELETE policy (only creator or member can dissolve) ─────

CREATE POLICY "couples_delete_member" ON couples
  FOR DELETE
  USING (
    user_id_1 = auth.uid()::text OR user_id_2 = auth.uid()::text
  );


-- ─── 3. Mood entries: replace permissive FOR ALL with explicit per-op policies ──

DROP POLICY IF EXISTS "mood_entries_own" ON mood_entries;

CREATE POLICY "mood_entries_select_own" ON mood_entries
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "mood_entries_insert_own" ON mood_entries
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "mood_entries_update_own" ON mood_entries
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "mood_entries_delete_own" ON mood_entries
  FOR DELETE
  USING (user_id = auth.uid()::text);


-- ─── 4. Love maps: replace permissive FOR ALL with explicit per-op policies ──

DROP POLICY IF EXISTS "love_maps_own" ON love_maps;

CREATE POLICY "love_maps_select_own" ON love_maps
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "love_maps_insert_own" ON love_maps
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "love_maps_update_own" ON love_maps
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "love_maps_delete_own" ON love_maps
  FOR DELETE
  USING (user_id = auth.uid()::text);


-- ─── 5. Messages: add missing UPDATE policy ─────────────────────────────────

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_sessions cs
      WHERE cs.id = messages.session_id
        AND cs.user_id = auth.uid()::text
    )
  );


-- ─── 6. Migrate core table policies from auth_user_id() to auth.uid() ───────
-- profiles: drop old, recreate with auth.uid()

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (user_id = auth.uid()::text);

-- couples: drop old, recreate with auth.uid()

DROP POLICY IF EXISTS "couples_select_member" ON couples;
DROP POLICY IF EXISTS "couples_insert_own"    ON couples;
DROP POLICY IF EXISTS "couples_update_member" ON couples;

CREATE POLICY "couples_select_member" ON couples
  FOR SELECT USING (
    user_id_1 = auth.uid()::text OR user_id_2 = auth.uid()::text
  );

CREATE POLICY "couples_insert_own" ON couples
  FOR INSERT WITH CHECK (user_id_1 = auth.uid()::text);

CREATE POLICY "couples_update_member" ON couples
  FOR UPDATE USING (
    user_id_1 = auth.uid()::text OR user_id_2 = auth.uid()::text
  );

-- conversation_sessions: drop old, recreate with auth.uid()

DROP POLICY IF EXISTS "conv_sessions_select_own" ON conversation_sessions;
DROP POLICY IF EXISTS "conv_sessions_insert_own" ON conversation_sessions;
DROP POLICY IF EXISTS "conv_sessions_update_own" ON conversation_sessions;
DROP POLICY IF EXISTS "conv_sessions_delete_own" ON conversation_sessions;

CREATE POLICY "conv_sessions_select_own" ON conversation_sessions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "conv_sessions_insert_own" ON conversation_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conv_sessions_update_own" ON conversation_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conv_sessions_delete_own" ON conversation_sessions
  FOR DELETE USING (user_id = auth.uid()::text);

-- messages: drop old, recreate with auth.uid()

DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_delete_own" ON messages;
DROP POLICY IF EXISTS "messages_update_own" ON messages;

CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_sessions cs
            WHERE cs.id = messages.session_id AND cs.user_id = auth.uid()::text)
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversation_sessions cs
            WHERE cs.id = messages.session_id AND cs.user_id = auth.uid()::text)
  );

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM conversation_sessions cs
            WHERE cs.id = messages.session_id AND cs.user_id = auth.uid()::text)
  );

CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversation_sessions cs
            WHERE cs.id = messages.session_id AND cs.user_id = auth.uid()::text)
  );


-- ─── 7. Ensure no table can be accessed without RLS ─────────────────────────
-- Force-deny access when no policy matches (this is the default, but explicit is safer)

ALTER TABLE profiles              FORCE ROW LEVEL SECURITY;
ALTER TABLE couples               FORCE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE messages              FORCE ROW LEVEL SECURITY;
ALTER TABLE mood_entries          FORCE ROW LEVEL SECURITY;
ALTER TABLE love_maps             FORCE ROW LEVEL SECURITY;
ALTER TABLE profile_extended      FORCE ROW LEVEL SECURITY;
ALTER TABLE growth_commitments    FORCE ROW LEVEL SECURITY;
