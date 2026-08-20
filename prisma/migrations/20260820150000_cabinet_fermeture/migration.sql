-- Fermeture d'un espace cabinet, sans suppression de données.
--
-- Additives et nullables : tout cabinet existant reste ouvert (NULL = ouvert).
--
-- Réversible de deux façons : effacer la date rouvre l'espace intact, et
--   ALTER TABLE "Cabinet" DROP COLUMN "fermeLe";
--   ALTER TABLE "Cabinet" DROP COLUMN "fermeMotif";
-- retire le mécanisme entier.

ALTER TABLE "Cabinet" ADD COLUMN "fermeLe" TIMESTAMP(3);
ALTER TABLE "Cabinet" ADD COLUMN "fermeMotif" TEXT;
