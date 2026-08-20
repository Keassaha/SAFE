-- Montant mensuel et jour de facturation de l'abonnement d'un cabinet.
--
-- Additives et nullables : aucune ligne existante n'est touchée.
--
-- `numeric(10,2)` et non `double precision` : montant contractuel recopié tel
-- quel sur une facture, aucune raison de subir un arrondi binaire.
--
-- Réversible :
--   ALTER TABLE "Cabinet" DROP COLUMN "abonnementMontantMensuel";
--   ALTER TABLE "Cabinet" DROP COLUMN "abonnementJourFacturation";

ALTER TABLE "Cabinet" ADD COLUMN "abonnementMontantMensuel" DECIMAL(10,2);
ALTER TABLE "Cabinet" ADD COLUMN "abonnementJourFacturation" INTEGER;
