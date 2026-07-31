-- CH-02 — Champs du journal de caisse, registre des chèques, pièces justificatives.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-02)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-13, M-04, M-07)
--
-- Trois manques qui, ensemble, rendaient le rapport comptable mensuel impossible.
--
-- 1. LES CHAMPS DE L'ART. 38.
--    L'art. 38 B-1 r.5 et la s. 18(1)(2) By-Law 9 énumèrent ce que CHAQUE ligne du
--    journal de caisse doit porter : de qui la somme est reçue, à qui le débours est
--    versé, l'objet, le numéro de chèque, l'indication « espèces », le solde après
--    chaque inscription. SAFE portait la date, le montant, le client, le dossier et
--    une description libre. Les cartes-clients de l'art. 39, qui reprennent les mêmes
--    champs, héritaient donc des mêmes trous.
--
-- 2. LE REGISTRE DES CHÈQUES.
--    Art. 61 : les chèques doivent être NUMÉROTÉS CONSÉCUTIVEMENT. Art. 41(2) : le
--    rapport mensuel exige la liste des chèques en circulation avec numéro, date
--    d'émission, montant, client et dossier. Sans registre, cette liste se réduisait
--    à un nombre saisi à la main — ce qu'elle était effectivement dans SAFE.
--
-- 3. LES PIÈCES JUSTIFICATIVES.
--    Art. 32 : conservation de « toutes les pièces justificatives ou de contrôle ».
--    s. 18(10) : relevés, chèques compensés, bordereaux de dépôt en double. Aucune
--    pièce n'était attachable à une opération en fidéicommis.
--
-- Migration STRICTEMENT ADDITIVE (PR-10). Toutes les colonnes sont nullables ou
-- portent une valeur par défaut. L'historique reste sans payeur ni bénéficiaire, ce
-- qui est le fait exact : l'information n'a jamais été collectée. On ne l'invente pas.

-- ── 1. Objet d'un mouvement ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustPurposeCode') THEN
    CREATE TYPE "TrustPurposeCode" AS ENUM (
      'AVANCE_HONORAIRES', 'AVANCE_DEBOURS', 'FONDS_CLOTURE', 'CONSIGNATION',
      'REGLEMENT', 'SUCCESSION', 'REMISE_CLIENT', 'PAIEMENT_TIERS', 'AUTRE'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustChequeStatus') THEN
    CREATE TYPE "TrustChequeStatus" AS ENUM ('ISSUED', 'CLEARED', 'VOIDED', 'STALE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustSupportingDocumentRole') THEN
    CREATE TYPE "TrustSupportingDocumentRole" AS ENUM (
      'CHEQUE_RECU', 'BORDEREAU_DEPOT', 'CHEQUE_COMPENSE',
      'CONFIRMATION_VIREMENT', 'RECU_ESPECES', 'RELEVE_BANCAIRE', 'AUTRE'
    );
  END IF;
END
$$;

-- ── 2. Champs de l'art. 38 sur le journal de caisse en fidéicommis ──────────
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "payerName"        TEXT;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "payeeName"        TEXT;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "purposeCode"      "TrustPurposeCode";
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "purposeText"      TEXT;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "chequeNumber"     INTEGER;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "isCash"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "receivedAt"       TIMESTAMP(3);
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "depositedAt"      TIMESTAMP(3);
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "fundAllocation"   TEXT;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "fromThirdParty"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrustTransaction" ADD COLUMN IF NOT EXISTS "clientNotifiedAt" TIMESTAMP(3);

-- Reprise minimale : les dépôts en espèces déjà enregistrés portent l'indicateur de
-- l'art. 38(1)g. C'est une déduction SÛRE (le mode de paiement est la source), à la
-- différence du payeur ou de l'objet, qui n'ont jamais été saisis.
UPDATE "TrustTransaction" SET "isCash" = true
WHERE "modePaiement" = 'ESPECES' AND "isCash" = false;

-- ── 3. Champs de l'art. 34 sur le journal d'administration ─────────────────
ALTER TABLE "journal_general" ADD COLUMN IF NOT EXISTS "payerName"          TEXT;
ALTER TABLE "journal_general" ADD COLUMN IF NOT EXISTS "payeeName"          TEXT;
ALTER TABLE "journal_general" ADD COLUMN IF NOT EXISTS "purposeText"        TEXT;
ALTER TABLE "journal_general" ADD COLUMN IF NOT EXISTS "isCash"             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "journal_general" ADD COLUMN IF NOT EXISTS "documentIdentifier" TEXT;

-- ── 4. Registre des chèques (art. 61, 41(2)) ───────────────────────────────
CREATE TABLE IF NOT EXISTS "TrustCheque" (
  "id"                 TEXT NOT NULL,
  "cabinetId"          TEXT NOT NULL,
  "trustBankAccountId" TEXT NOT NULL,
  "chequeNumber"       INTEGER NOT NULL,
  "issueDate"          TIMESTAMP(3) NOT NULL,
  "payeeName"          TEXT NOT NULL,
  "amount"             DOUBLE PRECISION NOT NULL,
  "clientId"           TEXT,
  "dossierId"          TEXT,
  "trustTransactionId" TEXT,
  "status"             "TrustChequeStatus" NOT NULL DEFAULT 'ISSUED',
  "clearedAt"          TIMESTAMP(3),
  "voidedAt"           TIMESTAMP(3),
  "voidReason"         TEXT,
  "signedById"         TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustCheque_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustCheque_trustBankAccountId_chequeNumber_key"
  ON "TrustCheque"("trustBankAccountId", "chequeNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "TrustCheque_trustTransactionId_key"
  ON "TrustCheque"("trustTransactionId");
CREATE INDEX IF NOT EXISTS "TrustCheque_cabinetId_idx" ON "TrustCheque"("cabinetId");
CREATE INDEX IF NOT EXISTS "TrustCheque_cabinetId_status_idx" ON "TrustCheque"("cabinetId", "status");
CREATE INDEX IF NOT EXISTS "TrustCheque_trustBankAccountId_issueDate_idx"
  ON "TrustCheque"("trustBankAccountId", "issueDate");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustCheque_cabinetId_fkey') THEN
    ALTER TABLE "TrustCheque" ADD CONSTRAINT "TrustCheque_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustCheque_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustCheque" ADD CONSTRAINT "TrustCheque_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── 5. Pièces justificatives (art. 32, s. 18(10)) ──────────────────────────
CREATE TABLE IF NOT EXISTS "TrustTransactionDocument" (
  "id"                 TEXT NOT NULL,
  "trustTransactionId" TEXT NOT NULL,
  "documentId"         TEXT NOT NULL,
  "role"               "TrustSupportingDocumentRole" NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustTransactionDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustTransactionDocument_tx_doc_role_key"
  ON "TrustTransactionDocument"("trustTransactionId", "documentId", "role");
CREATE INDEX IF NOT EXISTS "TrustTransactionDocument_trustTransactionId_idx"
  ON "TrustTransactionDocument"("trustTransactionId");
CREATE INDEX IF NOT EXISTS "TrustTransactionDocument_documentId_idx"
  ON "TrustTransactionDocument"("documentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustTransactionDocument_trustTransactionId_fkey') THEN
    ALTER TABLE "TrustTransactionDocument" ADD CONSTRAINT "TrustTransactionDocument_trustTransactionId_fkey"
      FOREIGN KEY ("trustTransactionId") REFERENCES "TrustTransaction"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : une pièce justificative ne disparaît jamais par effet de bord.
  -- Art. 32 impose 7 ans de conservation après la fin de l'exercice.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustTransactionDocument_documentId_fkey') THEN
    ALTER TABLE "TrustTransactionDocument" ADD CONSTRAINT "TrustTransactionDocument_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
