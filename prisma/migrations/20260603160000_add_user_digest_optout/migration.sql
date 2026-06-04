-- Notifications calmes — préférence digest quotidien par utilisateur (N7b).
--
-- Doctrine: docs/product/SPEC_aaliyah_home_navette.md §8
--
-- Migration ADDITIVE : ajoute une colonne booléenne avec valeur par défaut
-- (digest activé par défaut). Aucune donnée existante modifiée.

ALTER TABLE "User"
  ADD COLUMN "digestOptOut" BOOLEAN NOT NULL DEFAULT false;
