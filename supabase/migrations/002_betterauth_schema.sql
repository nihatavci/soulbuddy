-- ============================================================
-- BetterAuth Core Tables
-- Run this in Supabase SQL Editor BEFORE running the app.
-- These tables are managed by BetterAuth — do not modify.
-- ============================================================

CREATE TABLE IF NOT EXISTS "user" (
  id               TEXT        PRIMARY KEY,
  name             TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  "emailVerified"  BOOLEAN     NOT NULL DEFAULT FALSE,
  image            TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  id           TEXT        PRIMARY KEY,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  token        TEXT        NOT NULL UNIQUE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "userId"     TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id                        TEXT        PRIMARY KEY,
  "accountId"               TEXT        NOT NULL,
  "providerId"              TEXT        NOT NULL,
  "userId"                  TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"             TEXT,
  "refreshToken"            TEXT,
  "idToken"                 TEXT,
  "accessTokenExpiresAt"    TIMESTAMPTZ,
  "refreshTokenExpiresAt"   TIMESTAMPTZ,
  scope                     TEXT,
  password                  TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id           TEXT        PRIMARY KEY,
  identifier   TEXT        NOT NULL,
  value        TEXT        NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS session_user_idx     ON "session" ("userId");
CREATE INDEX IF NOT EXISTS account_user_idx     ON "account" ("userId");
CREATE INDEX IF NOT EXISTS account_provider_idx ON "account" ("providerId", "accountId");
