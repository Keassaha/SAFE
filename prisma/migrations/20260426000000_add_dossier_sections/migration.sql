-- CreateTable
CREATE TABLE "DossierSection" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "origine" TEXT NOT NULL DEFAULT 'template',
    "sourceReglementaire" TEXT,
    "icone" TEXT,
    "description" TEXT,
    "privilegiee" BOOLEAN NOT NULL DEFAULT false,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DossierSection_dossierId_idx" ON "DossierSection"("dossierId");

-- CreateIndex
CREATE INDEX "DossierSection_cabinetId_idx" ON "DossierSection"("cabinetId");

-- AddForeignKey
ALTER TABLE "DossierSection" ADD CONSTRAINT "DossierSection_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierSection" ADD CONSTRAINT "DossierSection_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
