-- ============================================================
-- Chat RLS hardening for conversation_sessions + messages
-- Makes INSERT/SELECT/UPDATE/DELETE checks explicit.
-- ============================================================

ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conv_sessions_own ON conversation_sessions;
DROP POLICY IF EXISTS messages_own ON messages;

-- Conversation sessions: owner-only access
CREATE POLICY "conv_sessions_select_own" ON conversation_sessions
  FOR SELECT
  USING (user_id = auth_user_id());

CREATE POLICY "conv_sessions_insert_own" ON conversation_sessions
  FOR INSERT
  WITH CHECK (user_id = auth_user_id());

CREATE POLICY "conv_sessions_update_own" ON conversation_sessions
  FOR UPDATE
  USING (user_id = auth_user_id())
  WITH CHECK (user_id = auth_user_id());

CREATE POLICY "conv_sessions_delete_own" ON conversation_sessions
  FOR DELETE
  USING (user_id = auth_user_id());

-- Messages: access only through owned sessions
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_sessions cs
      WHERE cs.id = messages.session_id
        AND cs.user_id = auth_user_id()
    )
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_sessions cs
      WHERE cs.id = messages.session_id
        AND cs.user_id = auth_user_id()
    )
  );

CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_sessions cs
      WHERE cs.id = messages.session_id
        AND cs.user_id = auth_user_id()
    )
  );
