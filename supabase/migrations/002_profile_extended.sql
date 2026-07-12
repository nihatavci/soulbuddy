-- Migration: 002_profile_extended
-- Creates the profile_extended table for storing relationship DNA from smart onboarding.
-- Run via Supabase MCP or: supabase db push

-- ─── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,

  -- Section 1: The Spark
  dating_energy TEXT CHECK (dating_energy IN ('chaotic','dry','overwhelmed','intentional','emerging','abundant')),
  relationship_goals TEXT[] DEFAULT '{}',
  texting_style TEXT CHECK (texting_style IN ('eager','strategic','avoidant','expressive','variable')),

  -- Section 2: Attachment
  attachment_style TEXT CHECK (attachment_style IN ('secure','anxious_preoccupied','dismissive_avoidant','fearful_avoidant')),
  anxiety_score REAL CHECK (anxiety_score >= 0 AND anxiety_score <= 1),
  avoidance_score REAL CHECK (avoidance_score >= 0 AND avoidance_score <= 1),

  -- Section 3: Communication
  love_languages TEXT[] DEFAULT '{}',
  conflict_style TEXT CHECK (conflict_style IN ('confrontational','measured','passive','withdrawing','written','avoidant')),
  communication_tendency INTEGER CHECK (communication_tendency >= 0 AND communication_tendency <= 100),

  -- Section 4: Patterns
  relationship_history TEXT CHECK (relationship_history IN ('serial_monogamist','explorer','one_defining','novice','balanced')),
  recurring_patterns TEXT[] DEFAULT '{}',
  growth_intention TEXT,

  -- Section 5: Depth
  vulnerability_comfort INTEGER CHECK (vulnerability_comfort >= 1 AND vulnerability_comfort <= 10),
  dating_stage TEXT CHECK (dating_stage IN ('self_discovery','ready','healing','exploring','approach_avoidance')),
  top_partner_value TEXT,

  -- Section 6: Vibe
  social_energy TEXT CHECK (social_energy IN ('extroverted','ambivert','introverted')),
  date_vibe TEXT CHECK (date_vibe IN ('adventurous','intimate','social','active','cultural','homebody')),
  age INTEGER CHECK (age >= 18 AND age <= 120),

  -- Section 7: North Star
  success_metric TEXT CHECK (success_metric IN ('partnership','confidence','self_awareness','skills','healing')),
  coaching_preference INTEGER CHECK (coaching_preference >= 0 AND coaching_preference <= 100),

  -- Computed / derived
  archetype TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_version INTEGER DEFAULT 1,
  profile_completeness REAL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE profile_extended ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own extended profile"
  ON profile_extended FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own extended profile"
  ON profile_extended FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own extended profile"
  ON profile_extended FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ─── Index ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profile_extended_user_id ON profile_extended(user_id);

-- ─── Add onboarding_version to profiles ─────────────────────────────────────
-- Allows detecting users who need v2 re-onboarding.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_version INTEGER DEFAULT 0;
