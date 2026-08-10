-- CH-09 — Rapport comptable annuel (art. 42 B-1 r.5).
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-09)
--
-- « Au moins une fois par an et dans les 30 jours suivant la réception d'une demande
-- par le directeur de l'inspection professionnelle, l'avocat doit transmettre à ce
-- dernier, en utilisant le formulaire prescrit par le Comité exécutif, un rapport
-- comptable annuel couvrant la période de 12 mois identifiée dans la demande. »
--
-- ⚠️ QUÉBEC SEULEMENT. By-Law 9, lu intégralement, n'impose AUCUN rapport comptable
-- annuel : ses obligations périodiques s'arrêtent à la comparaison mensuelle de la
-- s. 18(8), à produire dans les 25 jours (s. 22(2)).
--
-- INCERTITUDE DÉCLARÉE : le LSO impose par ailleurs un « Lawyer Annual Report ».
-- Cette obligation ne figure pas dans By-Law 9 et n'a pas été lue. Elle n'est donc
-- pas modélisée, et rien ici ne prétend la couvrir.
--
-- DEUX BLOCS SANS ÉQUIVALENT AU RAPPORT MENSUEL
--
--   42(4) le total des recettes et des débours au cours de CHAQUE MOIS de la période.
--         Douze couples de totaux, là où l'art. 41(4) n'en demande qu'un.
--
--   42(7) la liste de chacun des comptes généraux ET particuliers fermés au cours de
--         la période. C'est cette obligation qui explique qu'un compte fermé ne soit
--         jamais supprimé : il doit pouvoir figurer au rapport de la période de sa
--         fermeture, parfois des mois plus tard.
--
-- RÉUTILISATION PLUTÔT QUE DUPLICATION
--
-- Les blocs 42(1), 42(2) et 42(3) exigent exactement les mêmes listes que les
-- art. 41(1), 41(2) et 41(3). Plutôt que de créer trois tables jumelles, les trois
-- tables de lignes du rapport mensuel accueillent aussi le rapport annuel :
-- `reportId` devient nullable et `annualReportId` est ajouté. Dupliquer ferait
-- diverger deux définitions d'une même chose, et un inspecteur qui recoupe le
-- mensuel et l'annuel trouverait deux vérités.
--
-- Migration ADDITIVE (PR-10). `reportId` passe de NOT NULL à nullable : c'est un
-- ASSOUPLISSEMENT, aucune ligne existante n'est invalidée.

CREATE TABLE IF NOT EXISTS "TrustAnnualReport" (
  "id"                      TEXT NOT NULL,
  "cabinetId"               TEXT NOT NULL,
  "trustBankAccountId"      TEXT NOT NULL,
  "periodStart"             TEXT NOT NULL,
  "periodEnd"               TEXT NOT NULL,
  "requestReceivedAt"       TIMESTAMP(3),
  "status"                  TEXT NOT NULL DEFAULT 'draft',
  "journalBalance"          DOUBLE PRECISION NOT NULL,
  "bankStatementBalance"    DOUBLE PRECISION NOT NULL,
  "ledgerSumBalance"        DOUBLE PRECISION NOT NULL,
  "outstandingChequesTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "depositsInTransitTotal"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reconciledBalance"       DOUBLE PRECISION NOT NULL,
  "ecartPeriode"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ecartCartesClients"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bankStatementDocumentId" TEXT,
  "snapshotJson"            TEXT,
  "verifiedControlsJson"    TEXT,
  "declarationText"         TEXT,
  "certifiedById"           TEXT,
  "certifiedAt"             TIMESTAMP(3),
  "submittedAt"             TIMESTAMP(3),
  "submissionDocumentId"    TEXT,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustAnnualReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustAnnualReport_account_periodStart_key"
  ON "TrustAnnualReport"("trustBankAccountId", "periodStart");
CREATE INDEX IF NOT EXISTS "TrustAnnualReport_cabinetId_periodStart_idx"
  ON "TrustAnnualReport"("cabinetId", "periodStart");
CREATE INDEX IF NOT EXISTS "TrustAnnualReport_cabinetId_status_idx"
  ON "TrustAnnualReport"("cabinetId", "status");

-- Art. 42(4) — douze couples de totaux.
CREATE TABLE IF NOT EXISTS "TrustAnnualMonthlyTotal" (
  "id"                     TEXT NOT NULL,
  "annualReportId"         TEXT NOT NULL,
  "periode"                TEXT NOT NULL,
  "totalReceipts"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalDisbursements"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthlyReportCertified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TrustAnnualMonthlyTotal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TrustAnnualMonthlyTotal_report_periode_key"
  ON "TrustAnnualMonthlyTotal"("annualReportId", "periode");
CREATE INDEX IF NOT EXISTS "TrustAnnualMonthlyTotal_annualReportId_idx"
  ON "TrustAnnualMonthlyTotal"("annualReportId");

-- Art. 42(7) — comptes fermés durant la période.
CREATE TABLE IF NOT EXISTS "TrustAnnualClosedAccount" (
  "id"                 TEXT NOT NULL,
  "annualReportId"     TEXT NOT NULL,
  "trustBankAccountId" TEXT NOT NULL,
  "accountType"        TEXT NOT NULL,
  "accountLabel"       TEXT NOT NULL,
  "institutionName"    TEXT NOT NULL,
  "accountNumberLast4" TEXT NOT NULL,
  "clientName"         TEXT,
  "closedAt"           TIMESTAMP(3) NOT NULL,
  "closureReason"      TEXT,
  CONSTRAINT "TrustAnnualClosedAccount_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrustAnnualClosedAccount_annualReportId_idx"
  ON "TrustAnnualClosedAccount"("annualReportId");

-- Réutilisation des trois listes du rapport mensuel.
ALTER TABLE "TrustClientLedgerSnapshot"  ALTER COLUMN "reportId" DROP NOT NULL;
ALTER TABLE "TrustOutstandingChequeLine" ALTER COLUMN "reportId" DROP NOT NULL;
ALTER TABLE "TrustDepositInTransitLine"  ALTER COLUMN "reportId" DROP NOT NULL;

ALTER TABLE "TrustClientLedgerSnapshot"  ADD COLUMN IF NOT EXISTS "annualReportId" TEXT;
ALTER TABLE "TrustOutstandingChequeLine" ADD COLUMN IF NOT EXISTS "annualReportId" TEXT;
ALTER TABLE "TrustDepositInTransitLine"  ADD COLUMN IF NOT EXISTS "annualReportId" TEXT;

CREATE INDEX IF NOT EXISTS "TrustClientLedgerSnapshot_annualReportId_idx"
  ON "TrustClientLedgerSnapshot"("annualReportId");
CREATE INDEX IF NOT EXISTS "TrustOutstandingChequeLine_annualReportId_idx"
  ON "TrustOutstandingChequeLine"("annualReportId");
CREATE INDEX IF NOT EXISTS "TrustDepositInTransitLine_annualReportId_idx"
  ON "TrustDepositInTransitLine"("annualReportId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustAnnualReport_cabinetId_fkey') THEN
    ALTER TABLE "TrustAnnualReport" ADD CONSTRAINT "TrustAnnualReport_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : un rapport transmis au directeur ne disparaît pas parce qu'un compte
  -- est retiré. C'est précisément le rapport qui atteste de sa fermeture (42(7)).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustAnnualReport_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustAnnualReport" ADD CONSTRAINT "TrustAnnualReport_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustAnnualMonthlyTotal_annualReportId_fkey') THEN
    ALTER TABLE "TrustAnnualMonthlyTotal" ADD CONSTRAINT "TrustAnnualMonthlyTotal_annualReportId_fkey"
      FOREIGN KEY ("annualReportId") REFERENCES "TrustAnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustAnnualClosedAccount_annualReportId_fkey') THEN
    ALTER TABLE "TrustAnnualClosedAccount" ADD CONSTRAINT "TrustAnnualClosedAccount_annualReportId_fkey"
      FOREIGN KEY ("annualReportId") REFERENCES "TrustAnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustClientLedgerSnapshot_annualReportId_fkey') THEN
    ALTER TABLE "TrustClientLedgerSnapshot" ADD CONSTRAINT "TrustClientLedgerSnapshot_annualReportId_fkey"
      FOREIGN KEY ("annualReportId") REFERENCES "TrustAnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustOutstandingChequeLine_annualReportId_fkey') THEN
    ALTER TABLE "TrustOutstandingChequeLine" ADD CONSTRAINT "TrustOutstandingChequeLine_annualReportId_fkey"
      FOREIGN KEY ("annualReportId") REFERENCES "TrustAnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustDepositInTransitLine_annualReportId_fkey') THEN
    ALTER TABLE "TrustDepositInTransitLine" ADD CONSTRAINT "TrustDepositInTransitLine_annualReportId_fkey"
      FOREIGN KEY ("annualReportId") REFERENCES "TrustAnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
