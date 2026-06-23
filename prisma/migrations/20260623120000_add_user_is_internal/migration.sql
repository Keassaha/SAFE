-- Ajoute le flag interne (équipe SAFE Inc.) pour gater la Console sans dépendre
-- du nom de cabinet ("SAFE"). Additif et sûr : colonne avec valeur par défaut,
-- aucune réécriture de table coûteuse sur PostgreSQL.
ALTER TABLE "User" ADD COLUMN "isInternal" BOOLEAN NOT NULL DEFAULT false;
