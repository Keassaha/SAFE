-- CH-03 — Rapport comptable mensuel. LE livrable de l'inspection.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-03)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-01)
--
-- L'art. 40 B-1 r.5 impose un registre permanent des rapports comptables mensuels de
-- CHAQUE compte général. L'art. 41 en fixe le contenu : sept blocs, dont QUATRE sont
-- des listes détaillées ligne par ligne.
--
--   41(1) liste des soldes de cartes-clients + nom du client + dossier
--         + LA DATE DE LA DERNIÈRE INSCRIPTION
--   41(2) liste des chèques en circulation + montant + date d'émission
--         + numéro de chèque + client + dossier
--   41(3) liste des recettes en circulation + montant + date de réception
--         + client + dossier
--   41(4) total des recettes et des débours du mois
--   41(5) état comparatif journal ↔ relevé bancaire
--   41(6) liste des comptes particuliers + institution + n° + ouverture + dépôt initial
--   41(7) copie du relevé de l'institution pour le mois visé
--
-- Côté ontarien, la s. 18(8) exige la comparaison mensuelle « together with THE
-- REASONS for any differences », appuyée par une liste détaillée par client et un
-- rapprochement détaillé de chaque compte. La s. 22(2) fixe le délai à 25 jours.
--
-- Avant ce chantier, SAFE stockait `chequesEnCirculation` et `depotsEnTransit` comme
-- DEUX NOMBRES FLOTTANTS saisis à la main. Aucune ligne n'existait nulle part. C'est
-- précisément ce qui rendait l'inspection insurvivable : un inspecteur demande la
-- liste, pas le total.
--
-- Migration ADDITIVE (PR-10) : créations de tables uniquement, aucune modification
-- de l'existant.

CREATE TABLE IF NOT EXISTS "TrustMonthlyReport" (
  "id"                      TEXT NOT NULL,
  "cabinetId"               TEXT NOT NULL,
  "trustBankAccountId"      TEXT NOT NULL,
  "periode"                 TEXT NOT NULL,
  "status"                  TEXT NOT NULL DEFAULT 'draft',
  "totalReceipts"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalDisbursements"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bankStatementBalance"    DOUBLE PRECISION NOT NULL,
  "journalBalance"          DOUBLE PRECISION NOT NULL,
  "ledgerSumBalance"        DOUBLE PRECISION NOT NULL,
  "outstandingChequesTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "depositsInTransitTotal"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reconciledBalance"       DOUBLE PRECISION NOT NULL,
  "ecartBanque"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ecartCartesClients"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bankStatementDocumentId" TEXT,
  "snapshotJson"            TEXT,
  "verifiedControlsJson"    TEXT,
  "declarationText"         TEXT,
  "certifiedById"           TEXT,
  "certifiedAt"             TIMESTAMP(3),
  "lockedAt"                TIMESTAMP(3),
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustMonthlyReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustMonthlyReport_trustBankAccountId_periode_key"
  ON "TrustMonthlyReport"("trustBankAccountId", "periode");
CREATE INDEX IF NOT EXISTS "TrustMonthlyReport_cabinetId_periode_idx"
  ON "TrustMonthlyReport"("cabinetId", "periode");
CREATE INDEX IF NOT EXISTS "TrustMonthlyReport_cabinetId_status_idx"
  ON "TrustMonthlyReport"("cabinetId", "status");

-- Art. 41(1) — la liste des soldes de cartes-clients.
CREATE TABLE IF NOT EXISTS "TrustClientLedgerSnapshot" (
  "id"            TEXT NOT NULL,
  "reportId"      TEXT NOT NULL,
  "clientId"      TEXT NOT NULL,
  "clientName"    TEXT NOT NULL,
  "dossierId"     TEXT,
  "dossierRef"    TEXT,
  "balance"       DOUBLE PRECISION NOT NULL,
  -- « la date de la dernière inscription » : le champ que SAFE n'avait nulle part.
  "lastEntryDate" TIMESTAMP(3),
  CONSTRAINT "TrustClientLedgerSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrustClientLedgerSnapshot_reportId_idx"
  ON "TrustClientLedgerSnapshot"("reportId");

-- Art. 41(2) — la liste des chèques en circulation.
CREATE TABLE IF NOT EXISTS "TrustOutstandingChequeLine" (
  "id"           TEXT NOT NULL,
  "reportId"     TEXT NOT NULL,
  "chequeId"     TEXT,
  "chequeNumber" INTEGER NOT NULL,
  "issueDate"    TIMESTAMP(3) NOT NULL,
  "amount"       DOUBLE PRECISION NOT NULL,
  "payeeName"    TEXT NOT NULL,
  "clientName"   TEXT,
  "dossierRef"   TEXT,
  "stale"        BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TrustOutstandingChequeLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrustOutstandingChequeLine_reportId_idx"
  ON "TrustOutstandingChequeLine"("reportId");

-- Art. 41(3) — la liste des recettes en circulation.
CREATE TABLE IF NOT EXISTS "TrustDepositInTransitLine" (
  "id"            TEXT NOT NULL,
  "reportId"      TEXT NOT NULL,
  "transactionId" TEXT,
  "receivedDate"  TIMESTAMP(3) NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "payerName"     TEXT,
  "clientName"    TEXT,
  "dossierRef"    TEXT,
  CONSTRAINT "TrustDepositInTransitLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrustDepositInTransitLine_reportId_idx"
  ON "TrustDepositInTransitLine"("reportId");

-- s. 18(8) ON — « together with the reasons for any differences ».
CREATE TABLE IF NOT EXISTS "TrustDiscrepancyReason" (
  "id"           TEXT NOT NULL,
  "reportId"     TEXT NOT NULL,
  "kind"         TEXT NOT NULL,
  "amount"       DOUBLE PRECISION NOT NULL,
  "explanation"  TEXT NOT NULL,
  "raisedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"   TIMESTAMP(3),
  "resolvedById" TEXT,
  CONSTRAINT "TrustDiscrepancyReason_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrustDiscrepancyReason_reportId_idx"
  ON "TrustDiscrepancyReason"("reportId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustMonthlyReport_cabinetId_fkey') THEN
    ALTER TABLE "TrustMonthlyReport" ADD CONSTRAINT "TrustMonthlyReport_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : un rapport mensuel est un registre permanent (art. 40). Il ne
  -- disparaît jamais par effet de bord de la suppression d'un compte.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustMonthlyReport_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustMonthlyReport" ADD CONSTRAINT "TrustMonthlyReport_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustClientLedgerSnapshot_reportId_fkey') THEN
    ALTER TABLE "TrustClientLedgerSnapshot" ADD CONSTRAINT "TrustClientLedgerSnapshot_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "TrustMonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustOutstandingChequeLine_reportId_fkey') THEN
    ALTER TABLE "TrustOutstandingChequeLine" ADD CONSTRAINT "TrustOutstandingChequeLine_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "TrustMonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustDepositInTransitLine_reportId_fkey') THEN
    ALTER TABLE "TrustDepositInTransitLine" ADD CONSTRAINT "TrustDepositInTransitLine_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "TrustMonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustDiscrepancyReason_reportId_fkey') THEN
    ALTER TABLE "TrustDiscrepancyReason" ADD CONSTRAINT "TrustDiscrepancyReason_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "TrustMonthlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
