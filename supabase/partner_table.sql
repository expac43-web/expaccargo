-- ============================================================
-- EXPAC — Table Partner
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS "Partner" (
  id         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  name       TEXT        NOT NULL,
  "logoUrl"  TEXT        NOT NULL,
  website    TEXT,
  "isActive" BOOLEAN     NOT NULL DEFAULT true,
  "order"    INTEGER     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Partner_pkey" PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- GRANTs
GRANT ALL ON "Partner" TO service_role;
GRANT SELECT ON "Partner" TO anon, authenticated;

-- RLS Policy: tout le monde peut lire les partenaires actifs
CREATE POLICY "Public read active partners"
  ON "Partner" FOR SELECT
  USING ("isActive" = true);
