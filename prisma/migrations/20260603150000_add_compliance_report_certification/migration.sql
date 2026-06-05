-- Conformité Barreau (B-1 r.5) : déclaration de conformité signée par l'avocat
-- responsable sur le rapport annuel fidéicommis. Ajoute la traçabilité de la
-- certification (qui a signé, quand, texte de l'attestation) au modèle
-- TrustComplianceReport.
--
-- Migration CHIRURGICALE : n'ajoute que 3 colonnes + 1 clé étrangère.
-- Aucune autre modification (ne pas confondre avec la dérive DB existante).
--
-- Application : éditeur SQL Supabase, ou `psql "$DIRECT_URL" -f migration.sql`.

BEGIN;

ALTER TABLE "TrustComplianceReport"
  ADD COLUMN "certifiedAt" TIMESTAMP(3),
  ADD COLUMN "certifiedById" TEXT,
  ADD COLUMN "declarationText" TEXT;

ALTER TABLE "TrustComplianceReport"
  ADD CONSTRAINT "TrustComplianceReport_certifiedById_fkey"
  FOREIGN KEY ("certifiedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
