-- ============================================================
-- EXPAC — Documents & Messages setup
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ── 1. Table Document ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Document" (
  id            TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  url           TEXT NOT NULL,
  "shipmentId"  TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Document_pkey" PRIMARY KEY (id)
);

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON "Document" TO service_role;
GRANT SELECT ON "Document" TO authenticated;

-- RLS: users can see their own documents
CREATE POLICY "Own documents" ON "Document"
  FOR SELECT USING (
    "uploadedById" = auth.uid()::TEXT
  );

-- ── 2. Table Message ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Message" (
  id            TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  content       TEXT NOT NULL,
  "senderId"    TEXT NOT NULL,
  "receiverId"  TEXT NOT NULL,
  "shipmentId"  TEXT,
  "isRead"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Message_pkey" PRIMARY KEY (id)
);

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON "Message" TO service_role;
GRANT SELECT ON "Message" TO authenticated;

-- RLS: users can see messages they sent or received
CREATE POLICY "Own messages" ON "Message"
  FOR SELECT USING (
    "senderId" = auth.uid()::TEXT OR "receiverId" = auth.uid()::TEXT
  );

-- ── 3. Table Notification ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notification" (
  id          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  link        TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Notification_pkey" PRIMARY KEY (id)
);

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON "Notification" TO service_role;
GRANT SELECT ON "Notification" TO authenticated;

-- ── 4. Supabase Storage — bucket "expac-documents" ────────────
-- Créer le bucket via l'interface Supabase Storage
-- OU via SQL (nécessite l'extension storage) :

INSERT INTO storage.buckets (id, name, public)
VALUES ('expac-documents', 'expac-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Politique : lecture publique (URLs publiques)
CREATE POLICY "Public read expac-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expac-documents');

-- Politique : upload autorisé pour les rôles authentifiés (via service_role en API)
CREATE POLICY "Service role upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'expac-documents');

CREATE POLICY "Service role delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'expac-documents');
