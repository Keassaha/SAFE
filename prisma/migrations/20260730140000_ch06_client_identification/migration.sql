-- CH-06 — Identification et vérification du client.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-06)
--
-- ⚠️ Deux régimes distincts, à ne pas confondre :
--   Québec  : RLRQ c. B-1, r. 5, art. 13-14 (identification) et 20-27 (vérification).
--   Ontario : LSO **By-Law 7.1, Partie III** — PAS By-Law 9, qui ne traite que des
--             opérations et registres financiers.
--
-- Ce que la migration rend possible, et qui ne l'était pas :
--   1. `Client.occupation` — exigée pour toute personne physique dans les DEUX
--      régimes (art. 14(1)d QC / s. 23(1)5 ON). Le champ n'existait pas : l'obligation
--      était structurellement insatisfiable.
--   2. `Client.natureActivites` et les personnes autorisées — art. 14(2)d et e QC /
--      s. 23(1)6 et 7 ON.
--   3. Le tiers représenté — art. 14 al. 3 QC / s. 23(1)8 ON.
--   4. La propriété effective (25 % et plus) — art. 23(2) QC / s. 23(2.1) ON.
--   5. L'attestation de répondant — art. 24(2) QC, sans équivalent ontarien.
--   6. Les délais de vérification, qui divergent : 60 jours au Québec (art. 26(2)),
--      30 jours en Ontario (s. 23(6)) pour une organisation.
--
-- Migration STRICTEMENT ADDITIVE (PR-10). Toutes les colonnes sont nullables ou
-- portent une valeur par défaut. Aucune donnée existante n'est modifiée.

-- ── 1. Renseignements d'identification sur le client ────────────────────────
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "natureActivites" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "actsForThirdParty" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "thirdPartyDetails" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "identityExemption" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "identityExemptionJustification" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "firstFundsMovementAt" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "identityVerificationDueAt" TIMESTAMP(3);

-- ── 2. Enrichissement du dossier de vérification ────────────────────────────
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "methodCode" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "subjectKind" TEXT;
-- Source des fonds : Ontario seulement (s. 23(2)). Colonne présente partout, jamais
-- exigée au Québec — c'est la logique applicative qui porte la distinction.
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "sourceOfFunds" TEXT;
-- Date d'OBTENTION des renseignements, distincte de la date de vérification (s. 23(12.1)).
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "recordedAt" TIMESTAMP(3);
-- Confirmation d'exactitude de la propriété effective (s. 23(12.2)).
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "accuracyMeasures" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "accuracyConfirmedAt" TIMESTAMP(3);
-- Procédure de repli ontarienne (s. 23(2.2)) : trois éléments, tous à consigner avec leur date.
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "fallbackSeniorOfficer" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "fallbackConsistencyNote" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "fallbackRiskAssessment" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "fallbackRecordedAt" TIMESTAMP(3);
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;

-- ── 3. Propriété effective ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BeneficialOwnerRole') THEN
    CREATE TYPE "BeneficialOwnerRole" AS ENUM (
      'ADMINISTRATEUR',
      'DETENTEUR_25_PLUS',
      'PERSONNE_AUTORISEE',
      'FIDUCIE_PARTIE'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "BeneficialOwner" (
  "id"               TEXT NOT NULL,
  "cabinetId"        TEXT NOT NULL,
  "clientId"         TEXT NOT NULL,
  "role"             "BeneficialOwnerRole" NOT NULL,
  "nom"              TEXT NOT NULL,
  "adresse"          TEXT,
  "occupation"       TEXT,
  "poste"            TEXT,
  "telephone"        TEXT,
  "ownershipPercent" DOUBLE PRECISION,
  "verifiedAt"       TIMESTAMP(3),
  "sourceDocumentId" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BeneficialOwner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BeneficialOwner_cabinetId_idx" ON "BeneficialOwner"("cabinetId");
CREATE INDEX IF NOT EXISTS "BeneficialOwner_clientId_idx" ON "BeneficialOwner"("clientId");
CREATE INDEX IF NOT EXISTS "BeneficialOwner_clientId_role_idx" ON "BeneficialOwner"("clientId", "role");

-- Restrict sur le client : un registre de propriété effective ne doit jamais
-- disparaître par effet de bord, comme les pièces du fidéicommis.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BeneficialOwner_cabinetId_fkey') THEN
    ALTER TABLE "BeneficialOwner" ADD CONSTRAINT "BeneficialOwner_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BeneficialOwner_clientId_fkey') THEN
    ALTER TABLE "BeneficialOwner" ADD CONSTRAINT "BeneficialOwner_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── 4. Attestation de répondant (Québec seulement, art. 24(2)) ──────────────
CREATE TABLE IF NOT EXISTS "IdentityAttestation" (
  "id"                    TEXT NOT NULL,
  "cabinetId"             TEXT NOT NULL,
  "clientId"              TEXT NOT NULL,
  "attestorName"          TEXT NOT NULL,
  "attestorQuality"       TEXT NOT NULL,
  "attestorAddress"       TEXT NOT NULL,
  "documentType"          TEXT NOT NULL,
  "documentReference"     TEXT NOT NULL,
  "signedAt"              TIMESTAMP(3) NOT NULL,
  "attestationDocumentId" TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdentityAttestation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IdentityAttestation_cabinetId_idx" ON "IdentityAttestation"("cabinetId");
CREATE INDEX IF NOT EXISTS "IdentityAttestation_clientId_idx" ON "IdentityAttestation"("clientId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdentityAttestation_cabinetId_fkey') THEN
    ALTER TABLE "IdentityAttestation" ADD CONSTRAINT "IdentityAttestation_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdentityAttestation_clientId_fkey') THEN
    ALTER TABLE "IdentityAttestation" ADD CONSTRAINT "IdentityAttestation_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
