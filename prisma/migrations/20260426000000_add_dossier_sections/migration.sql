-- Migration idempotente : la table peut déjà exister (créée auparavant via
-- `prisma db push`). On utilise IF NOT EXISTS partout et un bloc DO pour
-- les contraintes FK qui ne supportent pas IF NOT EXISTS.

-- CreateTable
CREATE TABLE IF NOT EXISTS "DossierSection" (
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
CREATE INDEX IF NOT EXISTS "DossierSection_dossierId_idx" ON "DossierSection"("dossierId");
CREATE INDEX IF NOT EXISTS "DossierSection_cabinetId_idx" ON "DossierSection"("cabinetId");

-- AddForeignKey (ignore if already exists)
DO $$
BEGIN
    ALTER TABLE "DossierSection" ADD CONSTRAINT "DossierSection_dossierId_fkey"
        FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "DossierSection" ADD CONSTRAINT "DossierSection_cabinetId_fkey"
        FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
