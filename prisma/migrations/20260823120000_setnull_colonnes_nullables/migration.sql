-- Deux relations portaient `onDelete: SET NULL` sur une colonne NON NULL.
--
-- Postgres refusait alors d'y ecrire NULL : supprimer un utilisateur ayant fait
-- une verification de conflits ou produit un rapport de conformite echouait, et
-- un cabinet ne pouvait plus etre purge. `prisma validate` l'annoncait en
-- avertissement depuis toujours.
--
-- Aucune donnee n'est touchee : on ne fait que retirer une contrainte. Les
-- lignes existantes gardent leur auteur.
--
-- Reversible tant qu'aucune ligne n'a la valeur NULL :
--   ALTER TABLE "ConflictCheck" ALTER COLUMN "checkedById" SET NOT NULL;
--   ALTER TABLE "TrustComplianceReport" ALTER COLUMN "generatedById" SET NOT NULL;

ALTER TABLE "ConflictCheck" ALTER COLUMN "checkedById" DROP NOT NULL;
ALTER TABLE "TrustComplianceReport" ALTER COLUMN "generatedById" DROP NOT NULL;
