-- ============================================================
-- EXPAC — RLS + GRANTs
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. GRANT sur toutes les tables pour service_role et authenticated
-- (requis depuis le 30 mai 2026 pour les nouveaux projets)

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Pour les futures tables créées via Prisma
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

-- ============================================================
-- 2. Activer RLS sur toutes les tables
-- ============================================================

ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agency"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post"         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Policies RLS
-- Note : le rôle service_role bypass RLS automatiquement dans
-- Supabase — pas besoin de policy pour lui.
-- Ces policies s'appliquent aux appels via supabase-js (anon/authenticated).
-- ============================================================

-- ── User ──────────────────────────────────────────────────────
-- Un utilisateur peut lire et modifier uniquement son propre profil
CREATE POLICY "users_select_own" ON "User"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id);

-- ── Agency ────────────────────────────────────────────────────
-- Lecture publique des agences (pour les pages publiques)
CREATE POLICY "agencies_select_all" ON "Agency"
  FOR SELECT TO authenticated
  USING (true);

-- ── Shipment ──────────────────────────────────────────────────
-- Client : voit uniquement ses propres expéditions
CREATE POLICY "shipments_select_own_client" ON "Shipment"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "clientId");

-- Agence : voit les expéditions de son agence (join via User)
CREATE POLICY "shipments_select_own_agency" ON "Shipment"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
        AND u."agencyId" = "Shipment"."agencyId"
        AND u.role IN ('AGENCY', 'MANAGER', 'SUPER_ADMIN')
    )
  );

-- ── Milestone ─────────────────────────────────────────────────
-- Visible si l'utilisateur peut voir l'expédition associée
CREATE POLICY "milestones_select_via_shipment" ON "Milestone"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Shipment" s
      WHERE s.id = "Milestone"."shipmentId"
        AND (
          s."clientId" = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = auth.uid()::text
              AND u."agencyId" = s."agencyId"
              AND u.role IN ('AGENCY', 'MANAGER', 'SUPER_ADMIN')
          )
        )
    )
  );

-- ── Message ───────────────────────────────────────────────────
CREATE POLICY "messages_select_participant" ON "Message"
  FOR SELECT TO authenticated
  USING (
    "senderId" = auth.uid()::text
    OR "receiverId" = auth.uid()::text
  );

CREATE POLICY "messages_insert_own" ON "Message"
  FOR INSERT TO authenticated
  WITH CHECK ("senderId" = auth.uid()::text);

-- ── Document ──────────────────────────────────────────────────
CREATE POLICY "documents_select_via_shipment" ON "Document"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Shipment" s
      WHERE s.id = "Document"."shipmentId"
        AND (
          s."clientId" = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = auth.uid()::text
              AND u."agencyId" = s."agencyId"
              AND u.role IN ('AGENCY', 'MANAGER', 'SUPER_ADMIN')
          )
        )
    )
  );

-- ── Notification ──────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON "Notification"
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "notifications_update_own" ON "Notification"
  FOR UPDATE TO authenticated
  USING ("userId" = auth.uid()::text);

-- ── QuoteRequest ──────────────────────────────────────────────
-- Tout le monde peut créer (formulaire public)
CREATE POLICY "quote_requests_insert_anon" ON "QuoteRequest"
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Seul le demandeur peut relire la sienne (si connecté)
CREATE POLICY "quote_requests_select_own" ON "QuoteRequest"
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR "userId" IS NULL);

-- ── Post ──────────────────────────────────────────────────────
-- Articles publics visibles par tous
CREATE POLICY "posts_select_published" ON "Post"
  FOR SELECT TO anon, authenticated
  USING ("published" = true);
