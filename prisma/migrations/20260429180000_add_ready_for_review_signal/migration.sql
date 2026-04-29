-- Signal "dossier prêt pour revue avocat" — V1.
--
-- Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
--
-- Crée la table `DossierReadyForReviewSignal` + l'index unique partiel
-- `dedupeKey WHERE "readAt" IS NULL` qui garantit qu'un seul signal non lu
-- existe par couple (dossierId, avocatResponsableId).
--
-- Cohérent avec le pattern d'idempotence partielle déjà utilisé pour
-- `JournalGeneralEntry_idempotency_key`.

CREATE TABLE "DossierReadyForReviewSignal" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "avocatResponsableId" TEXT,
    "createdById" TEXT,
    "reason" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,

    CONSTRAINT "DossierReadyForReviewSignal_pkey" PRIMARY KEY ("id")
);

-- Index conventionnels (queries d'inbox).
CREATE INDEX "DossierReadyForReviewSignal_cabinetId_readAt_idx"
  ON "DossierReadyForReviewSignal" ("cabinetId", "readAt");

CREATE INDEX "DossierReadyForReviewSignal_cabinetId_avocatResponsableId_readAt_idx"
  ON "DossierReadyForReviewSignal" ("cabinetId", "avocatResponsableId", "readAt");

CREATE INDEX "DossierReadyForReviewSignal_dossierId_idx"
  ON "DossierReadyForReviewSignal" ("dossierId");

-- Déduplication structurelle: un seul signal non lu par dedupeKey.
CREATE UNIQUE INDEX "DossierReadyForReviewSignal_dedupe_unread_key"
  ON "DossierReadyForReviewSignal" ("dedupeKey")
  WHERE "readAt" IS NULL;

-- Foreign keys
ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_avocatResponsableId_fkey"
  FOREIGN KEY ("avocatResponsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DossierReadyForReviewSignal"
  ADD CONSTRAINT "DossierReadyForReviewSignal_acknowledgedById_fkey"
  FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
