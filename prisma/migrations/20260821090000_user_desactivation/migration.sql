-- Désactivation d'un compte utilisateur, sans suppression.
--
-- Additives et nullables : tout compte existant reste actif (NULL = actif).
--
-- Réversible : effacer la date réactive le compte.
--   ALTER TABLE "User" DROP COLUMN "desactiveLe";
--   ALTER TABLE "User" DROP COLUMN "desactiveMotif";

ALTER TABLE "User" ADD COLUMN "desactiveLe" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "desactiveMotif" TEXT;
