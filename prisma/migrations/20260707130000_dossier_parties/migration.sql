-- Plusieurs personnes sur un dossier (co-clients + parties).
-- Doctrine : docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md
-- Migration ADDITIVE : aucune colonne existante touchée, aucune FK existante modifiée.

-- CreateEnum
CREATE TYPE "DossierPartieNature" AS ENUM ('co_client', 'partie_externe');

-- CreateEnum
CREATE TYPE "DossierPartieRole" AS ENUM ('mandant_principal', 'co_client', 'partie_adverse', 'tiers');

-- CreateTable
CREATE TABLE "DossierPartie" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "nature" "DossierPartieNature" NOT NULL,
    "role" "DossierPartieRole" NOT NULL,
    "clientId" TEXT,
    "nomAffiche" TEXT,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierPartie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DossierPartie_cabinetId_idx" ON "DossierPartie"("cabinetId");

-- CreateIndex
CREATE INDEX "DossierPartie_dossierId_idx" ON "DossierPartie"("dossierId");

-- CreateIndex
CREATE INDEX "DossierPartie_dossierId_nature_idx" ON "DossierPartie"("dossierId", "nature");

-- CreateIndex
CREATE INDEX "DossierPartie_clientId_idx" ON "DossierPartie"("clientId");

-- AddForeignKey
ALTER TABLE "DossierPartie" ADD CONSTRAINT "DossierPartie_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierPartie" ADD CONSTRAINT "DossierPartie_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (RESTRICT : aligné sur le durcissement Barreau B-1 r.5 déjà en place)
ALTER TABLE "DossierPartie" ADD CONSTRAINT "DossierPartie_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariant nature <-> champs (spec §3.3-1) : garde-fou STRUCTUREL.
-- Rend impossible une partie externe portant un clientId (confusion adverse/client),
-- et un co-client sans fiche Client.
ALTER TABLE "DossierPartie" ADD CONSTRAINT "DossierPartie_nature_fields_chk" CHECK (
  ("nature" = 'co_client' AND "clientId" IS NOT NULL AND "nomAffiche" IS NULL)
  OR
  ("nature" = 'partie_externe' AND "nomAffiche" IS NOT NULL AND "clientId" IS NULL)
);

-- Backfill : chaque dossier existant reçoit son mandant principal (= Dossier.clientId).
-- id déterministe et unique (un seul principal par dossier), sans dépendance à une extension.
INSERT INTO "DossierPartie" ("id", "cabinetId", "dossierId", "nature", "role", "clientId", "estPrincipal", "createdAt", "updatedAt")
SELECT
  'dp_' || d."id",
  d."cabinetId",
  d."id",
  'co_client'::"DossierPartieNature",
  'mandant_principal'::"DossierPartieRole",
  d."clientId",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Dossier" d;
