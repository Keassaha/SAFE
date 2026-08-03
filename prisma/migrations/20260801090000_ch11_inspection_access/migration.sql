-- CH-11 — Accès d'inspection en lecture seule, et journal des consultations.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-11)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md QC-16
--
-- Art. 29 B-1 r.5 : les livres et registres sont accessibles EN TOUT TEMPS au syndic,
-- à ses enquêteurs, au directeur de l'inspection professionnelle et à ses experts,
-- sous réserve de leur confidentialité et de leur sécurité.
--
-- L'audit du 2026-07-30 relevait (QC-16) qu'aucun mode « accès inspecteur » n'existait :
-- ni accès en lecture seule, ni horodatage, ni journalisation d'une consultation.
--
-- ⚠️ POURQUOI L'INSPECTEUR N'EST PAS UN UTILISATEUR
--
-- La solution évidente — ajouter `inspecteur` à l'enum UserRole — a été écartée sur
-- une base mesurée : le dépôt compte plus de 330 endroits qui consultent le rôle, et
-- une partie des écritures ne vérifient que l'authentification, pas le rôle. Un rôle
-- en lecture seule ne serait étanche qu'au prix d'un audit exhaustif de ces 330 sites,
-- et le moindre oubli donnerait à un tiers extérieur le droit d'écrire dans la
-- comptabilité d'un cabinet.
--
-- La session ne crée donc aucun compte, ne porte aucun rôle, et n'emprunte aucun
-- chemin d'écriture. Ce qu'elle ne peut pas atteindre, elle ne peut pas le casser.
--
-- ⚠️ CE QUE L'ARTICLE N'IMPOSE PAS : la forme du dispositif. Il exige l'accès, pas un
-- « mode inspecteur ». La durée de 30 jours par défaut ne vient d'aucun texte.
--
-- Le jeton n'est jamais stocké en clair : seule son empreinte l'est. Un jeton lisible
-- en base rendrait un accès d'inspection réutilisable par quiconque lit la table.
--
-- Migration ADDITIVE (PR-10).

CREATE TABLE IF NOT EXISTS "InspectionAccessSession" (
  "id"                    TEXT NOT NULL,
  "cabinetId"             TEXT NOT NULL,
  "inspectorName"         TEXT NOT NULL,
  "inspectorOrganization" TEXT NOT NULL,
  "purpose"               TEXT NOT NULL,
  "tokenHash"             TEXT NOT NULL,
  "scopeFrom"             TIMESTAMP(3),
  "scopeTo"               TIMESTAMP(3),
  "grantedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "grantedByUserId"       TEXT NOT NULL,
  "expiresAt"             TIMESTAMP(3) NOT NULL,
  "revokedAt"             TIMESTAMP(3),
  "revokedByUserId"       TEXT,
  "revokedReason"         TEXT,
  "province"              TEXT NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InspectionAccessSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InspectionAccessSession_tokenHash_key"
  ON "InspectionAccessSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "InspectionAccessSession_cabinetId_idx"
  ON "InspectionAccessSession"("cabinetId");
CREATE INDEX IF NOT EXISTS "InspectionAccessSession_cabinetId_expiresAt_idx"
  ON "InspectionAccessSession"("cabinetId", "expiresAt");

-- Une consultation, une ligne. Append-only par construction : le service ne prévoit
-- ni mise à jour ni suppression. C'est ce qui permet de dire plus tard qui a vu quoi.
CREATE TABLE IF NOT EXISTS "InspectionAccessRead" (
  "id"         TEXT NOT NULL,
  "sessionId"  TEXT NOT NULL,
  "resource"   TEXT NOT NULL,
  "resourceId" TEXT,
  "detail"     TEXT,
  "readAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InspectionAccessRead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InspectionAccessRead_sessionId_readAt_idx"
  ON "InspectionAccessRead"("sessionId", "readAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InspectionAccessSession_cabinetId_fkey') THEN
    ALTER TABLE "InspectionAccessSession" ADD CONSTRAINT "InspectionAccessSession_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InspectionAccessRead_sessionId_fkey') THEN
    ALTER TABLE "InspectionAccessRead" ADD CONSTRAINT "InspectionAccessRead_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "InspectionAccessSession"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
