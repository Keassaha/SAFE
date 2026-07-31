-- CH-05 — Chaîne des sommes reçues en espèces.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-05)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-05)
--
-- L'audit relevait ici trois défauts SIMULTANÉS, dont deux opposés :
--
--   1. SUR-BLOCAGE — le code refusait toute somme de 7 500 $ ou plus en espèces,
--      alors que l'art. 69 prévoit six paragraphes d'exception et la s. 6 en prévoit
--      cinq. L'avance d'honoraires, l'exception la plus courante, était bloquée. Un
--      garde-fou qui refuse une opération licite pousse au contournement : la somme
--      est saisie en mode « AUTRE », et l'indication « espèces » de l'art. 38(1)g
--      disparaît des registres.
--
--   2. SOUS-BLOCAGE — la s. 4(1) vise un montant AGRÉGÉ par dossier client. Trois
--      versements de 3 000 $ franchissent le seuil et passaient tous les trois.
--
--   3. ABSENCE — art. 70 (reçu pour TOUTE somme, signé des deux parties), 71
--      (déclaration au directeur dans les 30 jours), 72 (remboursement obligatoirement
--      en espèces), 73 (conversion au taux de midi), s. 19(1) ON (carnet en double).
--
-- Une distinction de régime encodée ici : l'art. 69 vise la réception EN FIDÉICOMMIS,
-- la s. 4(1) vise toute somme rattachée à un dossier client. Des espèces reçues en
-- paiement direct d'une facture ne tombent pas sous l'art. 69, mais tombent sous la
-- s. 4(1). Aplatir les deux produirait soit un blocage illégitime, soit un trou.
--
-- Migration ADDITIVE (PR-10) : créations de tables uniquement.

CREATE TABLE IF NOT EXISTS "CashReceipt" (
  "id"                          TEXT NOT NULL,
  "cabinetId"                   TEXT NOT NULL,
  "receiptNumber"               INTEGER NOT NULL,
  "date"                        TIMESTAMP(3) NOT NULL,
  "payerName"                   TEXT NOT NULL,
  "amount"                      DOUBLE PRECISION NOT NULL,
  "currency"                    TEXT NOT NULL DEFAULT 'CAD',
  -- Art. 73 / s. 4(2) : c'est la valeur en dollars canadiens qui est agrégée et
  -- comparée au seuil. 6 000 USD ne sont pas 6 000 $ CAD.
  "cadAmount"                   DOUBLE PRECISION NOT NULL,
  "conversionRate"              DOUBLE PRECISION,
  "conversionRateDate"          TIMESTAMP(3),
  "clientId"                    TEXT NOT NULL,
  "dossierId"                   TEXT NOT NULL,
  "purpose"                     TEXT,
  "receivedByUserId"            TEXT NOT NULL,
  "licenseeSignatureDocumentId" TEXT,
  "payerSignatureDocumentId"    TEXT,
  "payerSignatureWaivedReason"  TEXT,
  "province"                    TEXT NOT NULL,
  "intoTrust"                   BOOLEAN NOT NULL DEFAULT true,
  "exemptionInvoked"            TEXT,
  "exemptionJustification"      TEXT,
  "refundMustBeCash"            BOOLEAN NOT NULL DEFAULT false,
  "declarationDueAt"            TIMESTAMP(3),
  "declarationSentAt"           TIMESTAMP(3),
  "declarationDocumentId"       TEXT,
  "trustTransactionId"          TEXT,
  "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashReceipt_pkey" PRIMARY KEY ("id")
);

-- Le carnet de reçus « en double » de la s. 19(1) suppose une séquence vérifiable :
-- un trou est ce qu'un inspecteur cherche.
CREATE UNIQUE INDEX IF NOT EXISTS "CashReceipt_cabinetId_receiptNumber_key"
  ON "CashReceipt"("cabinetId", "receiptNumber");
CREATE INDEX IF NOT EXISTS "CashReceipt_cabinetId_date_idx" ON "CashReceipt"("cabinetId", "date");
-- Le seuil s'apprécie sur le cumul PAR DOSSIER : cet index sert le contrôle.
CREATE INDEX IF NOT EXISTS "CashReceipt_cabinetId_dossierId_idx"
  ON "CashReceipt"("cabinetId", "dossierId");
-- Échéance de la déclaration de l'art. 71.
CREATE INDEX IF NOT EXISTS "CashReceipt_cabinetId_declarationDueAt_idx"
  ON "CashReceipt"("cabinetId", "declarationDueAt");

CREATE TABLE IF NOT EXISTS "CashRefund" (
  "id"                  TEXT NOT NULL,
  "cabinetId"           TEXT NOT NULL,
  "cashReceiptId"       TEXT NOT NULL,
  "date"                TIMESTAMP(3) NOT NULL,
  "amount"              DOUBLE PRECISION NOT NULL,
  "recipientName"       TEXT NOT NULL,
  "clientId"            TEXT NOT NULL,
  "dossierId"           TEXT NOT NULL,
  "signatureDocumentId" TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashRefund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CashRefund_cabinetId_idx" ON "CashRefund"("cabinetId");
CREATE INDEX IF NOT EXISTS "CashRefund_cashReceiptId_idx" ON "CashRefund"("cashReceiptId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CashReceipt_cabinetId_fkey') THEN
    ALTER TABLE "CashReceipt" ADD CONSTRAINT "CashReceipt_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : un reçu d'espèces est une pièce justificative conservée 7 ans
  -- (art. 32). Il ne disparaît jamais par effet de bord.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CashReceipt_clientId_fkey') THEN
    ALTER TABLE "CashReceipt" ADD CONSTRAINT "CashReceipt_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CashRefund_cabinetId_fkey') THEN
    ALTER TABLE "CashRefund" ADD CONSTRAINT "CashRefund_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CashRefund_cashReceiptId_fkey') THEN
    ALTER TABLE "CashRefund" ADD CONSTRAINT "CashRefund_cashReceiptId_fkey"
      FOREIGN KEY ("cashReceiptId") REFERENCES "CashReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
