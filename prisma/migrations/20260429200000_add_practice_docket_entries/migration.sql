-- SAFE — Cartables intelligents et cahiers par pratique
-- Doctrine: docs/product/PRACTICE_BRIEFCASE_AND_DOCKET_SYSTEM.md

ALTER TABLE "Document"
  ADD COLUMN "sectionKey" TEXT,
  ADD COLUMN "classificationSubtype" TEXT,
  ADD COLUMN "classificationConfidence" INTEGER,
  ADD COLUMN "classificationNeedsReview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "classificationReason" TEXT;

CREATE INDEX "Document_cabinetId_dossierId_sectionKey_idx"
  ON "Document" ("cabinetId", "dossierId", "sectionKey");

CREATE TABLE "DossierDocketEntry" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "dossierId" TEXT NOT NULL,
  "entryType" TEXT NOT NULL,
  "docketMode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'a_reviser',
  "eventDate" TIMESTAMP(3),
  "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
  "sectionKey" TEXT NOT NULL,
  "linkedDocumentId" TEXT,
  "linkedRichDocumentId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "confidence" INTEGER,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "metadata" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DossierDocketEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DossierDocketEntry_cabinetId_idx"
  ON "DossierDocketEntry" ("cabinetId");

CREATE INDEX "DossierDocketEntry_cabinetId_dossierId_idx"
  ON "DossierDocketEntry" ("cabinetId", "dossierId");

CREATE INDEX "DossierDocketEntry_cabinetId_dossierId_docketMode_idx"
  ON "DossierDocketEntry" ("cabinetId", "dossierId", "docketMode");

CREATE INDEX "DossierDocketEntry_linkedDocumentId_idx"
  ON "DossierDocketEntry" ("linkedDocumentId");

CREATE INDEX "DossierDocketEntry_linkedRichDocumentId_idx"
  ON "DossierDocketEntry" ("linkedRichDocumentId");

CREATE UNIQUE INDEX "DossierDocketEntry_linkedDocument_once"
  ON "DossierDocketEntry" ("linkedDocumentId")
  WHERE "linkedDocumentId" IS NOT NULL;

CREATE UNIQUE INDEX "DossierDocketEntry_linkedRichDocument_once"
  ON "DossierDocketEntry" ("linkedRichDocumentId")
  WHERE "linkedRichDocumentId" IS NOT NULL;

ALTER TABLE "DossierDocketEntry"
  ADD CONSTRAINT "DossierDocketEntry_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierDocketEntry"
  ADD CONSTRAINT "DossierDocketEntry_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierDocketEntry"
  ADD CONSTRAINT "DossierDocketEntry_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierDocketEntry"
  ADD CONSTRAINT "DossierDocketEntry_linkedDocumentId_fkey"
  FOREIGN KEY ("linkedDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DossierDocketEntry"
  ADD CONSTRAINT "DossierDocketEntry_linkedRichDocumentId_fkey"
  FOREIGN KEY ("linkedRichDocumentId") REFERENCES "RichDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
