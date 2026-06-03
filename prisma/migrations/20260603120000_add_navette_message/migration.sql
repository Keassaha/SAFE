-- Navette — communication interne CENTRÉE DOSSIER (assistante↔avocate). N1.
--
-- Doctrine: docs/product/SPEC_aaliyah_home_navette.md
--
-- Migration ADDITIVE : crée l'enum `NavetteMessageType` et la table
-- `DossierNavetteMessage`. Ne touche à aucune table/donnée existante.
-- Le type `ready_for_review`/`approved` coexiste avec
-- `DossierReadyForReviewSignal` (pont applicatif côté service).

CREATE TYPE "NavetteMessageType" AS ENUM (
  'question',
  'info',
  'sent_back',
  'ready_for_review',
  'approved',
  'reply'
);

CREATE TABLE "DossierNavetteMessage" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "recipientId" TEXT,
    "type" "NavetteMessageType" NOT NULL,
    "body" TEXT,
    "dueDate" TIMESTAMP(3),
    "parentId" TEXT,
    "confidentiel" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "readById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierNavetteMessage_pkey" PRIMARY KEY ("id")
);

-- Index conventionnels (fil par dossier + inbox « needs me » + filtres).
CREATE INDEX "DossierNavetteMessage_cabinetId_dossierId_createdAt_idx"
  ON "DossierNavetteMessage" ("cabinetId", "dossierId", "createdAt");

CREATE INDEX "DossierNavetteMessage_cabinetId_recipientId_resolvedAt_idx"
  ON "DossierNavetteMessage" ("cabinetId", "recipientId", "resolvedAt");

CREATE INDEX "DossierNavetteMessage_cabinetId_type_resolvedAt_idx"
  ON "DossierNavetteMessage" ("cabinetId", "type", "resolvedAt");

-- Foreign keys (cabinet, dossier, auteur). Les autres champs *Id (recipient,
-- readBy, resolvedBy) sont des références applicatives, sans contrainte FK
-- (champs d'audit ; évite d'imposer des back-relations sur User).
ALTER TABLE "DossierNavetteMessage"
  ADD CONSTRAINT "DossierNavetteMessage_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierNavetteMessage"
  ADD CONSTRAINT "DossierNavetteMessage_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierNavetteMessage"
  ADD CONSTRAINT "DossierNavetteMessage_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
