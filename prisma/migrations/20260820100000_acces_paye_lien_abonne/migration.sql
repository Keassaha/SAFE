-- Pont entre un encaissement et l'accès qu'il paie (dog food, ADR-006).
--
-- Trois colonnes additives et nullables. Aucune ligne existante n'est touchée,
-- aucun accès existant n'est modifié : toute fiche client dont
-- `cabinetAbonneId` reste NULL ne déclenche jamais la mécanique d'accès.
--
-- Réversible :
--   ALTER TABLE "Client"  DROP COLUMN "cabinetAbonneId";
--   ALTER TABLE "Invoice" DROP COLUMN "accesMoisCouverts";
--   ALTER TABLE "Invoice" DROP COLUMN "accesProlongeJusquau";

ALTER TABLE "Client" ADD COLUMN "cabinetAbonneId" TEXT;

-- Deux fiches clients ne peuvent pas facturer le même abonné : sans cette
-- contrainte, deux factures payées prolongeraient le même accès deux fois.
CREATE UNIQUE INDEX "Client_cabinetAbonneId_key" ON "Client"("cabinetAbonneId");

ALTER TABLE "Client" ADD CONSTRAINT "Client_cabinetAbonneId_fkey"
  FOREIGN KEY ("cabinetAbonneId") REFERENCES "Cabinet"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD COLUMN "accesMoisCouverts" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "accesProlongeJusquau" TIMESTAMP(3);
