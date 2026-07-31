-- CH-07 — Virements électroniques, signataires, frais de renvoi, transferts.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-07)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-06, M-12, M-14)
--
-- ⚠️ RÉGIME ASYMÉTRIQUE — le point à retenir de cette migration.
--
-- La s. 12 By-Law 9 impose un appareil complet autour de tout virement électronique
-- depuis un compte en fiducie : double contrôle à deux mots de passe (s. 12(2)1),
-- réquisition signée AVANT toute saisie sur formulaire prescrit (s. 12(2)4, 12(7)),
-- confirmation de l'institution portant six éléments (s. 12(2)3), contresignature
-- datée le jour bancaire suivant (s. 12(5)), conservation dix ans (s. 18(11), 23(2)).
--
-- B-1 r.5 n'a AUCUN équivalent. L'art. 58 permet le retrait d'honoraires « par
-- virement à un compte qui n'est pas un compte en fidéicommis, ouvert au nom de
-- l'avocat », sans réquisition, sans double contrôle, sans formulaire. Les tables
-- créées ici ne concernent donc QUE les cabinets ontariens : les servir à un cabinet
-- québécois inventerait une obligation, faute aussi grave que d'en omettre une.
--
-- Trois autres manques fermés au passage :
--
--   s. 11(b), 12(2)4ii — un non-titulaire ne peut signer que s'il a le pouvoir de
--     signature ET est cautionné « in an amount at least equal to the maximum
--     balance on deposit during the immediately preceding fiscal year ». Le montant
--     se calcule ; il n'était nulle part.
--
--   s. 18(4) — registre des transferts entre cartes-clients « explaining the purpose
--     for which each transfer is made ». SAFE INTERDISAIT ces transferts de façon
--     absolue, ce qui est plus strict que les deux règlements : la s. 18(4) en exige
--     le registre, donc les suppose. Le sur-blocage poussait au contournement par un
--     retrait suivi d'un dépôt, deux opérations qui cassent le lien et rendent ce
--     registre impossible à produire.
--
--   s. 19.1 — registre des frais de renvoi reçus et payés. Sans équivalent québécois.
--
-- Migration ADDITIVE (PR-10).

-- ── Statut de permis (s. 2, 2.2, 2.3) ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenceStatus') THEN
    CREATE TYPE "LicenceStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANKRUPT', 'REVOKED', 'RETIRED');
  END IF;
END
$$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenceNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenceStatus" "LicenceStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedFrom" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankruptSince" TIMESTAMP(3);

-- ── Réquisition de virement électronique — Formulaire 9A ────────────────────
CREATE TABLE IF NOT EXISTS "ElectronicTrustTransferRequisition" (
  "id"                                TEXT NOT NULL,
  "cabinetId"                         TEXT NOT NULL,
  "trustBankAccountId"                TEXT NOT NULL,
  "formType"                          TEXT NOT NULL DEFAULT '9A',
  "clientName"                        TEXT NOT NULL,
  "dossierRef"                        TEXT,
  "amount"                            DOUBLE PRECISION NOT NULL,
  "recipientName"                     TEXT NOT NULL,
  "recipientInstitution"              TEXT NOT NULL,
  "recipientBranch"                   TEXT,
  "recipientBranchAddress"            TEXT,
  "recipientAccountNumber"            TEXT NOT NULL,
  "purpose"                           TEXT NOT NULL,
  -- s. 12(2)4 : signée AVANT la saisie. L'ordre est la substance de la règle.
  "signedByUserId"                    TEXT NOT NULL,
  "signedAt"                          TIMESTAMP(3) NOT NULL,
  -- s. 12(2)1 : deux personnes distinctes, sauf praticien seul (s. 12(3)).
  "dataEnteredByUserId"               TEXT,
  "dataEnteredAt"                     TIMESTAMP(3),
  "authorizedByUserId"                TEXT,
  "authorizedAt"                      TIMESTAMP(3),
  "solePractitionerExemption"         BOOLEAN NOT NULL DEFAULT false,
  -- s. 12(2)3 : les six éléments de la confirmation.
  "confirmationDocumentId"            TEXT,
  "confirmationReceivedAt"            TIMESTAMP(3),
  "confirmationSourceAccount"         TEXT,
  "confirmationRecipientInstitution"  TEXT,
  "confirmationRecipientName"         TEXT,
  "confirmationRecipientAccount"      TEXT,
  "confirmationInstitutionReceivedAt" TIMESTAMP(3),
  "confirmationSentAt"                TIMESTAMP(3),
  -- s. 12(5) : imprimer, comparer, annoter, signer et dater.
  "countersignDueAt"                  TIMESTAMP(3),
  "printedAt"                         TIMESTAMP(3),
  "comparedAt"                        TIMESTAMP(3),
  "annotatedClientId"                 TEXT,
  "annotatedDossierId"                TEXT,
  "countersignedByUserId"             TEXT,
  "countersignedAt"                   TIMESTAMP(3),
  "trustTransactionId"                TEXT,
  "createdAt"                         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectronicTrustTransferRequisition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ETTR_trustTransactionId_key"
  ON "ElectronicTrustTransferRequisition"("trustTransactionId");
CREATE INDEX IF NOT EXISTS "ETTR_cabinetId_idx" ON "ElectronicTrustTransferRequisition"("cabinetId");
CREATE INDEX IF NOT EXISTS "ETTR_cabinetId_countersignedAt_idx"
  ON "ElectronicTrustTransferRequisition"("cabinetId", "countersignedAt");
CREATE INDEX IF NOT EXISTS "ETTR_account_signedAt_idx"
  ON "ElectronicTrustTransferRequisition"("trustBankAccountId", "signedAt");

-- ── Signataires et cautionnement (s. 11(b), 12(2)4ii) ───────────────────────
CREATE TABLE IF NOT EXISTS "TrustSignatory" (
  "id"                 TEXT NOT NULL,
  "cabinetId"          TEXT NOT NULL,
  "userId"             TEXT NOT NULL,
  "trustBankAccountId" TEXT NOT NULL,
  "isLicensee"         BOOLEAN NOT NULL DEFAULT true,
  "bondAmount"         DOUBLE PRECISION,
  "bondExpiryDate"     TIMESTAMP(3),
  "bondDocumentId"     TEXT,
  "authorizedFrom"     TIMESTAMP(3) NOT NULL,
  "authorizedTo"       TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustSignatory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustSignatory_userId_trustBankAccountId_key"
  ON "TrustSignatory"("userId", "trustBankAccountId");
CREATE INDEX IF NOT EXISTS "TrustSignatory_cabinetId_idx" ON "TrustSignatory"("cabinetId");

-- ── Transferts entre cartes-clients (s. 18(4) / art. 56(3)) ─────────────────
CREATE TABLE IF NOT EXISTS "ClientLedgerTransfer" (
  "id"                  TEXT NOT NULL,
  "cabinetId"           TEXT NOT NULL,
  "trustBankAccountId"  TEXT NOT NULL,
  "date"                TIMESTAMP(3) NOT NULL,
  "amount"              DOUBLE PRECISION NOT NULL,
  "fromClientId"        TEXT NOT NULL,
  "fromDossierId"       TEXT,
  "toClientId"          TEXT NOT NULL,
  "toDossierId"         TEXT,
  -- s. 18(4) : « explaining the purpose for which each transfer is made ».
  "purpose"             TEXT NOT NULL,
  "debitTransactionId"  TEXT,
  "creditTransactionId" TEXT,
  "createdById"         TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientLedgerTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientLedgerTransfer_debitTransactionId_key"
  ON "ClientLedgerTransfer"("debitTransactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClientLedgerTransfer_creditTransactionId_key"
  ON "ClientLedgerTransfer"("creditTransactionId");
CREATE INDEX IF NOT EXISTS "ClientLedgerTransfer_cabinetId_date_idx"
  ON "ClientLedgerTransfer"("cabinetId", "date");
CREATE INDEX IF NOT EXISTS "ClientLedgerTransfer_fromClientId_idx" ON "ClientLedgerTransfer"("fromClientId");
CREATE INDEX IF NOT EXISTS "ClientLedgerTransfer_toClientId_idx" ON "ClientLedgerTransfer"("toClientId");

-- ── Frais de renvoi (s. 19.1) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReferralFee" (
  "id"                   TEXT NOT NULL,
  "cabinetId"            TEXT NOT NULL,
  "direction"            TEXT NOT NULL,
  "date"                 TIMESTAMP(3) NOT NULL,
  "method"               TEXT NOT NULL,
  "amount"               DOUBLE PRECISION NOT NULL,
  "counterpartyLicensee" TEXT NOT NULL,
  "clientId"             TEXT,
  "documentIdentifier"   TEXT,
  "agreementDocumentId"  TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralFee_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReferralFee_cabinetId_date_idx" ON "ReferralFee"("cabinetId", "date");
CREATE INDEX IF NOT EXISTS "ReferralFee_cabinetId_direction_idx" ON "ReferralFee"("cabinetId", "direction");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ETTR_cabinetId_fkey') THEN
    ALTER TABLE "ElectronicTrustTransferRequisition" ADD CONSTRAINT "ETTR_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : une réquisition est conservée dix ans (s. 18(11), 23(2)). Elle ne
  -- disparaît jamais par effet de bord de la fermeture d'un compte.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ETTR_trustBankAccountId_fkey') THEN
    ALTER TABLE "ElectronicTrustTransferRequisition" ADD CONSTRAINT "ETTR_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustSignatory_cabinetId_fkey') THEN
    ALTER TABLE "TrustSignatory" ADD CONSTRAINT "TrustSignatory_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustSignatory_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustSignatory" ADD CONSTRAINT "TrustSignatory_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientLedgerTransfer_cabinetId_fkey') THEN
    ALTER TABLE "ClientLedgerTransfer" ADD CONSTRAINT "ClientLedgerTransfer_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralFee_cabinetId_fkey') THEN
    ALTER TABLE "ReferralFee" ADD CONSTRAINT "ReferralFee_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
