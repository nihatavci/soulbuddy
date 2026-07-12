-- ============================================================
-- CoupleAI — Initial Schema
-- Managed by: BetterAuth (user/session/account tables)
-- App tables: profiles, couples, conversation_sessions, messages,
--             mood_entries, love_maps
--
-- NOTE: BetterAuth creates its own `user`, `session`, `account`,
-- and `verification` tables. Run BetterAuth migrations first
-- (server/drizzle or via `auth.generateSchema()`), then run this.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Helper: updated_at trigger ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- One profile per BetterAuth user (user.id is TEXT/UUID from BetterAuth)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL UNIQUE,   -- FK → better-auth "user".id
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  birth_date    DATE,
  gender        TEXT,
  -- preferred mode when the user opens the app
  default_mode  TEXT        NOT NULL DEFAULT 'us'
                            CHECK (default_mode IN ('flirt', 'us', 'deep')),
  onboarded     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Couples ─────────────────────────────────────────────────────────────────
-- Connects two user_ids. invite_code lets partner join.
CREATE TABLE IF NOT EXISTS couples (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1     TEXT        NOT NULL,            -- FK → better-auth "user".id
  user_id_2     TEXT,                            -- NULL until partner accepts
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'active', 'dissolved')),
  invite_code   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate pairs (order-independent)
  CONSTRAINT couples_unique_pair UNIQUE NULLS NOT DISTINCT (user_id_1, user_id_2)
);

CREATE TRIGGER couples_updated_at
  BEFORE UPDATE ON couples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Conversation Sessions ────────────────────────────────────────────────────
-- Each time a user opens a feature (PulseMaster, TheCatalyst, etc.)
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,              -- FK → better-auth "user".id
  couple_id   UUID        REFERENCES couples(id) ON DELETE SET NULL,
  mode        TEXT        NOT NULL
              CHECK (mode IN ('flirt', 'us', 'deep')),
  -- feature slug: pulse_master | shadow_wingman | catalyst | resonance_chamber |
  --               reality_gap  | stoic_mentor
  feature     TEXT        NOT NULL,
  -- Persisted Gemini context (mood history, love map snippets, etc.)
  context     JSONB       NOT NULL DEFAULT '{}',
  -- vibe_score, timing, etc. from last AI response
  last_analysis JSONB     NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conv_sessions_user_idx
  ON conversation_sessions (user_id, created_at DESC);

CREATE TRIGGER conversation_sessions_updated_at
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL
              REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT        NOT NULL,
  -- store vibe score, bold/safe/ghost replies, timing etc.
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_session_idx
  ON messages (session_id, created_at ASC);

-- ─── Mood Entries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_entries (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  mood_score   SMALLINT    CHECK (mood_score BETWEEN 1 AND 10),
  mood_label   TEXT,                -- e.g. "Focused", "Connected", "Anxious"
  context_mode TEXT        CHECK (context_mode IN ('flirt', 'us', 'deep')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mood_entries_user_idx
  ON mood_entries (user_id, created_at DESC);

-- ─── Love Maps ────────────────────────────────────────────────────────────────
-- Gottman-inspired: open-ended questions answered by each user
CREATE TABLE IF NOT EXISTS love_maps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  category    TEXT        NOT NULL,  -- 'dreams' | 'fears' | 'values' | 'memories' | 'rituals'
  question    TEXT        NOT NULL,
  answer      TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, question)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- NOTE: With BetterAuth + Cloudflare Worker architecture, all client requests
-- go through the Worker which uses the service role key.
-- RLS here is a defence-in-depth layer using the custom JWT claim 'sub'.
-- The Worker must set `Authorization: Bearer <betterauth-jwt>` when calling
-- Supabase REST with the anon key.

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples               ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_maps             ENABLE ROW LEVEL SECURITY;

-- Helper: extract user_id from BetterAuth JWT (sub claim)
-- Supabase must be configured with the same JWT secret as BetterAuth.
-- Set: Dashboard → Auth → JWT Settings → JWT Secret = BETTER_AUTH_SECRET

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE sql STABLE;

-- Profiles: own row only
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth_user_id());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth_user_id());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (user_id = auth_user_id());

-- Couples: both members can read; only creator can insert
CREATE POLICY "couples_select_member" ON couples
  FOR SELECT USING (
    user_id_1 = auth_user_id() OR user_id_2 = auth_user_id()
  );

CREATE POLICY "couples_insert_own" ON couples
  FOR INSERT WITH CHECK (user_id_1 = auth_user_id());

CREATE POLICY "couples_update_member" ON couples
  FOR UPDATE USING (
    user_id_1 = auth_user_id() OR user_id_2 = auth_user_id()
  );

-- Conversation sessions: owner only
CREATE POLICY "conv_sessions_own" ON conversation_sessions
  FOR ALL USING (user_id = auth_user_id());

-- Messages: owner via session
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM conversation_sessions WHERE user_id = auth_user_id()
    )
  );

-- Mood entries: owner only
CREATE POLICY "mood_entries_own" ON mood_entries
  FOR ALL USING (user_id = auth_user_id());

-- Love maps: owner only
CREATE POLICY "love_maps_own" ON love_maps
  FOR ALL USING (user_id = auth_user_id());
