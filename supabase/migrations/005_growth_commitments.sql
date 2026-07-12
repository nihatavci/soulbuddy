-- Migration: 005_growth_commitments
-- Creates the growth_commitments table for storing onboarding growth plan + finger signature.
-- One row per user (upsert on user_id conflict).

CREATE TABLE IF NOT EXISTS public.growth_commitments (
  user_id       TEXT        PRIMARY KEY,
  plan_items    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  signature_data TEXT       NOT NULL DEFAULT '',
  signed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.growth_commitments ENABLE ROW LEVEL SECURITY;

-- Users can only read their own commitment
CREATE POLICY "Users can view own commitment"
  ON public.growth_commitments
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own commitment
CREATE POLICY "Users can insert own commitment"
  ON public.growth_commitments
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own commitment
CREATE POLICY "Users can update own commitment"
  ON public.growth_commitments
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Index for fast lookups by user_id (PK already creates one, but explicit for clarity)
-- No extra index needed since user_id is PK.

COMMENT ON TABLE public.growth_commitments IS
  'Stores the personalized growth plan items and finger-drawn signature captured at end of onboarding.';
