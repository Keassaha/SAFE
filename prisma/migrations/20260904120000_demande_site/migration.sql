-- Demandes venues du site public (contact, rendez-vous).
--
-- Strictement additive : une table neuve, deux types neufs, aucune colonne
-- existante touchée. Rien à rejouer sur les données en place.
-- La valeur SourceLead.SITE_WEB arrive par la migration qui précède.
--
-- Réversible :
--   DROP TABLE "DemandeSite";
--   DROP TYPE "DemandeSiteType"; DROP TYPE "DemandeSiteStatut";

CREATE TYPE "DemandeSiteType" AS ENUM ('CONTACT', 'RENDEZ_VOUS');
CREATE TYPE "DemandeSiteStatut" AS ENUM ('NOUVELLE', 'REPONDUE', 'PLANIFIEE', 'CLOSE');

CREATE TABLE "DemandeSite" (
    "id" TEXT NOT NULL,
    "type" "DemandeSiteType" NOT NULL,
    "statut" "DemandeSiteStatut" NOT NULL DEFAULT 'NOUVELLE',
    "page" TEXT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "cabinet" TEXT,
    "nbAvocats" TEXT,
    "raison" TEXT,
    "momentSouhaite" TEXT,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "ip" TEXT,
    "userAgent" TEXT,
    "accuseReceptionEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "aviseInterneEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "crmNote" TEXT,
    "leadId" TEXT,
    "traiteeLe" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeSite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DemandeSite_statut_idx" ON "DemandeSite"("statut");
CREATE INDEX "DemandeSite_type_idx" ON "DemandeSite"("type");
CREATE INDEX "DemandeSite_email_idx" ON "DemandeSite"("email");
CREATE INDEX "DemandeSite_createdAt_idx" ON "DemandeSite"("createdAt");
CREATE INDEX "DemandeSite_leadId_idx" ON "DemandeSite"("leadId");

ALTER TABLE "DemandeSite" ADD CONSTRAINT "DemandeSite_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
