-- ORIGINE DE LA TAXE PAYÉE SUR UNE DÉPENSE
-- Réf. docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.1 (lot 1)
--
-- LE PROBLÈME
--
-- `CabinetExpense` porte `montantHt`, `tps`, `tvq` depuis le début. Trois chemins
-- créent des dépenses et un seul les remplissait : l'import de reçu par IA, qui est le
-- chemin de plus FAIBLE volume. L'import bancaire, qui fait le gros du volume, écrivait
-- `montant = montantTtc = rawAmount` et s'arrêtait là.
--
-- Conséquence : le cabinet remet la taxe collectée sans déduire la taxe payée sur ses
-- achats. Il remet trop, tous les trimestres, sans jamais le voir.
--
-- POURQUOI UNE COLONNE ET PAS UN BOOLÉEN
--
-- Trois états, pas deux. Un booléen « estimée » ne distinguerait pas une dépense SANS
-- taxe d'une dépense dont on n'a pas su LIRE la taxe. Ce sont deux situations
-- opposées : la première est un fait qui s'affiche, la seconde est un trou qui se
-- comble avec la pièce.
--
--   DECLAREE  la pièce le dit. Vérité, et SEUL état réclamable en déclaration.
--   ESTIMEE   décomposée d'un TTC selon le régime du cabinet. Sert à la justesse des
--             états, jamais à la déclaration : le montant de taxe est exigé sur la
--             pièce dès le premier dollar pour la TVQ.
--   AUCUNE    la catégorie ne porte structurellement pas de taxe (salaires, primes
--             d'assurance, droits de greffe). Voir lib/expense-journal/tax-regime.ts.
--
-- ENTIÈREMENT ADDITIVE : nouvel enum, une colonne NULLABLE, aucune donnée réécrite.
-- Les dépenses existantes restent à NULL, ce qui se lit « origine inconnue » et non
-- « sans taxe ». Leur reprise est un lot distinct (spec §6, arbitrage CEO n° 4), et
-- elle marquera ESTIMEE, jamais DECLAREE.

CREATE TYPE "ExpenseTaxOrigin" AS ENUM (
  'DECLAREE',
  'ESTIMEE',
  'AUCUNE'
);

ALTER TABLE "CabinetExpense"
  ADD COLUMN "taxOrigin" "ExpenseTaxOrigin";

-- Sert le futur écran « dépenses dont la taxe reste à confirmer » : sans index, le
-- filtre balaie toute la table de dépenses du cabinet.
CREATE INDEX "CabinetExpense_cabinetId_taxOrigin_idx"
  ON "CabinetExpense"("cabinetId", "taxOrigin");
