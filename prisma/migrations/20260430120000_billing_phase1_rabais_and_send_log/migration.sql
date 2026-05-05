-- SAFE — Refonte module facturation, phase 1
-- Doctrine : rendre les rabais visibles dans le pipeline canonique InvoiceLine,
-- et tracer chaque envoi initial de facture officielle dans une table dédiée.

-- 1. Rabais canoniques sur InvoiceLine
--    parentLineId : self-reference vers la ligne parente d'honoraires/débours
--                   à laquelle s'applique le rabais (NULL pour rabais global).
--    discountReason : raison libre du rabais affichable au client.
ALTER TABLE "InvoiceLine"
  ADD COLUMN "parentLineId" TEXT,
  ADD COLUMN "discountReason" TEXT;

-- Index sur le parent pour pouvoir lister les rabais d'une ligne.
CREATE INDEX "InvoiceLine_parentLineId_idx" ON "InvoiceLine" ("parentLineId");

-- Self-FK avec ON DELETE SET NULL : si la ligne parente est supprimée,
-- le rabais subsiste comme ajustement orphelin pour ne pas perdre la trace
-- comptable d'un crédit déjà appliqué.
ALTER TABLE "InvoiceLine"
  ADD CONSTRAINT "InvoiceLine_parentLineId_fkey"
  FOREIGN KEY ("parentLineId")
  REFERENCES "InvoiceLine" ("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 2. Trace d'envoi initial des factures (séparé des relances InvoiceReminder).
--    Une entrée par tentative d'envoi : succès comme échec.
CREATE TABLE "InvoiceSendLog" (
  "id"             TEXT NOT NULL,
  "invoiceId"      TEXT NOT NULL,
  "cabinetId"      TEXT NOT NULL,
  "clientId"       TEXT NOT NULL,
  "dossierId"      TEXT,
  "sentById"       TEXT,
  "recipientEmail" TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "body"           TEXT,
  "status"         TEXT NOT NULL DEFAULT 'sent',
  "errorMessage"   TEXT,
  "pdfUrl"         TEXT,
  "attachmentName" TEXT,
  "attachmentSize" INTEGER,
  "sentAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceSendLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceSendLog_invoiceId_idx"             ON "InvoiceSendLog" ("invoiceId");
CREATE INDEX "InvoiceSendLog_cabinetId_idx"             ON "InvoiceSendLog" ("cabinetId");
CREATE INDEX "InvoiceSendLog_clientId_idx"              ON "InvoiceSendLog" ("clientId");
CREATE INDEX "InvoiceSendLog_dossierId_idx"             ON "InvoiceSendLog" ("dossierId");
CREATE INDEX "InvoiceSendLog_invoiceId_createdAt_idx"   ON "InvoiceSendLog" ("invoiceId", "createdAt");

ALTER TABLE "InvoiceSendLog"
  ADD CONSTRAINT "InvoiceSendLog_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceSendLog"
  ADD CONSTRAINT "InvoiceSendLog_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceSendLog"
  ADD CONSTRAINT "InvoiceSendLog_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceSendLog"
  ADD CONSTRAINT "InvoiceSendLog_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceSendLog"
  ADD CONSTRAINT "InvoiceSendLog_sentById_fkey"
  FOREIGN KEY ("sentById") REFERENCES "User" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
