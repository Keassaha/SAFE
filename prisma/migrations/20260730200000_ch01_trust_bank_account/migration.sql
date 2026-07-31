-- CH-01 — Compte bancaire en fidéicommis.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-01)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-02, A-1)
--
-- La dette de conception la plus lourde de l'audit.
--
-- `TrustAccount` n'est PAS un compte bancaire : c'est le sous-compte d'un client
-- pour un dossier, autrement dit la carte-client. SAFE ne modélisait donc nulle part
-- le compte bancaire lui-même, alors que tout le règlement raisonne par compte :
--
--   art. 36 QC    — livres, journaux et registres DISTINCTS pour chaque compte général
--   art. 41(7) QC — copie du relevé de l'institution pour CHAQUE compte général
--   art. 42(6)(7) — liste des comptes particuliers, et des comptes fermés dans l'année
--   art. 62-68 QC — comptes particuliers, qui n'existaient pas du tout
--   s. 7(5) ON    — « A licensee may keep one or more trust accounts »
--   s. 18(8)ii ON — « A detailed reconciliation made monthly of EACH trust bank account »
--   s. 9(3) ON    — jamais plus que ce qui est détenu pour ce client DANS CE COMPTE
--
-- Conséquence de l'absence : un cabinet à deux comptes mélangeait deux banques dans
-- un seul écart de rapprochement, et aucun rapport réglementaire n'était produisible.
--
-- REPRISE DE L'EXISTANT
-- Un compte général « à reconstituer » est créé pour chaque cabinet ayant déjà des
-- écritures fidéicommis, et toutes ses écritures y sont rattachées. Ce compte porte
-- un libellé explicite : il ne prétend pas être le vrai compte du cabinet, il tient
-- la place jusqu'à ce que le cabinet saisisse ses coordonnées réelles. Inventer un
-- numéro de compte serait pire que de laisser le champ à compléter.
--
-- Migration ADDITIVE (PR-10) : `trustBankAccountId` reste nullable en base. C'est le
-- service qui l'exige pour toute NOUVELLE écriture. Aucune donnée n'est modifiée
-- autrement que par le rattachement, aucune n'est supprimée.

-- ── 1. Types ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustBankAccountType') THEN
    CREATE TYPE "TrustBankAccountType" AS ENUM ('GENERAL', 'PARTICULIER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustInterestBeneficiary') THEN
    CREATE TYPE "TrustInterestBeneficiary" AS ENUM (
      'FONDS_ETUDES_JURIDIQUES', 'LAW_FOUNDATION_ONTARIO', 'CLIENT'
    );
  END IF;
END
$$;

-- ── 2. Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TrustBankAccount" (
  "id"                        TEXT NOT NULL,
  "cabinetId"                 TEXT NOT NULL,
  "type"                      "TrustBankAccountType" NOT NULL DEFAULT 'GENERAL',
  "accountLabel"              TEXT NOT NULL,
  "institutionName"           TEXT NOT NULL,
  "institutionBranch"         TEXT,
  "branchAddress"             TEXT,
  "branchProvince"            TEXT,
  "accountNumber"             TEXT NOT NULL,
  "accountNumberLast4"        TEXT NOT NULL,
  "currency"                  TEXT NOT NULL DEFAULT 'CAD',
  "barreauAgreementConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "regulatorNotifiedAt"       TIMESTAMP(3),
  "regulatorFormDocumentId"   TEXT,
  "clientCopySentAt"          TIMESTAMP(3),
  "openedAt"                  TIMESTAMP(3) NOT NULL,
  "closedAt"                  TIMESTAMP(3),
  "closureReason"             TEXT,
  "clientId"                  TEXT,
  "dossierId"                 TEXT,
  "initialDeposit"            DOUBLE PRECISION,
  "interestBeneficiary"       "TrustInterestBeneficiary" NOT NULL DEFAULT 'FONDS_ETUDES_JURIDIQUES',
  "currentBalance"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TrustBankAccount_cabinetId_idx" ON "TrustBankAccount"("cabinetId");
CREATE INDEX IF NOT EXISTS "TrustBankAccount_cabinetId_type_idx" ON "TrustBankAccount"("cabinetId", "type");
CREATE INDEX IF NOT EXISTS "TrustBankAccount_cabinetId_closedAt_idx" ON "TrustBankAccount"("cabinetId", "closedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustBankAccount_cabinetId_fkey') THEN
    ALTER TABLE "TrustBankAccount" ADD CONSTRAINT "TrustBankAccount_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : un compte en fidéicommis ne disparaît jamais par effet de bord.
  -- L'art. 42(7) exige la liste des comptes FERMÉS dans l'année : une suppression
  -- rendrait le rapport annuel impossible à produire.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustBankAccount_clientId_fkey') THEN
    ALTER TABLE "TrustBankAccount" ADD CONSTRAINT "TrustBankAccount_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── 3. Rattachement des écritures et des rapprochements ─────────────────────
ALTER TABLE "TrustTransaction"    ADD COLUMN IF NOT EXISTS "trustBankAccountId" TEXT;
ALTER TABLE "TrustReconciliation" ADD COLUMN IF NOT EXISTS "trustBankAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "TrustTransaction_trustBankAccountId_idx"
  ON "TrustTransaction"("trustBankAccountId");
CREATE INDEX IF NOT EXISTS "TrustTransaction_cabinetId_trustBankAccountId_date_idx"
  ON "TrustTransaction"("cabinetId", "trustBankAccountId", "date");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustTransaction_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustReconciliation_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustReconciliation" ADD CONSTRAINT "TrustReconciliation_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── 4. Reprise de l'existant ────────────────────────────────────────────────
-- Un compte « à reconstituer » par cabinet ayant déjà des écritures fidéicommis.
-- Le libellé est délibérément explicite : il satisfait la validation « en
-- fidéicommis » tout en signalant à l'utilisateur que les coordonnées réelles
-- restent à saisir. On n'invente NI nom d'institution NI numéro de compte : un faux
-- numéro dans un rapport réglementaire serait pire que l'absence de compte.
-- Idempotent : ne crée rien si un compte existe déjà pour le cabinet.
INSERT INTO "TrustBankAccount" (
  "id", "cabinetId", "type", "accountLabel", "institutionName",
  "accountNumber", "accountNumberLast4", "openedAt", "createdAt", "updatedAt"
)
SELECT
  'tba_legacy_' || c."id",
  c."id",
  'GENERAL',
  'Compte général en fidéicommis (coordonnées à compléter)',
  'À compléter',
  'À compléter',
  '0000',
  COALESCE(MIN(t."date"), CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Cabinet" c
JOIN "TrustTransaction" t ON t."cabinetId" = c."id"
WHERE NOT EXISTS (SELECT 1 FROM "TrustBankAccount" b WHERE b."cabinetId" = c."id")
GROUP BY c."id";

UPDATE "TrustTransaction" t
SET "trustBankAccountId" = b."id"
FROM "TrustBankAccount" b
WHERE b."cabinetId" = t."cabinetId"
  AND b."type" = 'GENERAL'
  AND t."trustBankAccountId" IS NULL;

UPDATE "TrustReconciliation" r
SET "trustBankAccountId" = b."id"
FROM "TrustBankAccount" b
WHERE b."cabinetId" = r."cabinetId"
  AND b."type" = 'GENERAL'
  AND r."trustBankAccountId" IS NULL;

-- Solde de contrôle aligné sur le registre append-only, qui reste l'autorité (PR-1).
UPDATE "TrustBankAccount" b
SET "currentBalance" = COALESCE((
  SELECT SUM(t."amount") FROM "TrustTransaction" t WHERE t."trustBankAccountId" = b."id"
), 0);
