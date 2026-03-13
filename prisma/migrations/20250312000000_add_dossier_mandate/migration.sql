-- CreateTable
CREATE TABLE "DossierMandate" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "numeroDossier" TEXT,
    "dateOuverture" TIMESTAMP(3),
    "avocatResponsableId" TEXT,
    "avocatSubstitutId" TEXT,
    "typeCause" TEXT,
    "districtJudiciaire" TEXT,
    "tribunal" TEXT,
    "numeroRole" TEXT,
    "estimationHonoraires" DECIMAL(12,2),
    "provisionInitiale" DECIMAL(12,2),
    "statutDossier" TEXT,
    "checklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierMandate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierMandate_dossierId_key" ON "DossierMandate"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMandate_numeroDossier_key" ON "DossierMandate"("numeroDossier");

-- CreateIndex
CREATE INDEX "DossierMandate_dossierId_idx" ON "DossierMandate"("dossierId");

-- AddForeignKey
ALTER TABLE "DossierMandate" ADD CONSTRAINT "DossierMandate_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMandate" ADD CONSTRAINT "DossierMandate_avocatResponsableId_fkey" FOREIGN KEY ("avocatResponsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMandate" ADD CONSTRAINT "DossierMandate_avocatSubstitutId_fkey" FOREIGN KEY ("avocatSubstitutId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
