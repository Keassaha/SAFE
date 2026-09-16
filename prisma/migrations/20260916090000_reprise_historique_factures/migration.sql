-- Reprise des factures passées (priorité 2 du chantier « un cabinet arrive avec
-- sa clientèle »). Migration strictement ADDITIVE : trois colonnes nullables ou
-- à défaut, aucune contrainte retirée, aucune valeur réécrite.
--
-- Écrite à la main, pas via `prisma migrate diff` (voir la mémoire
-- project_db_infra_state sur la dérive préexistante entre l'historique des
-- migrations et le schéma : le diff embarque des opérations sans rapport).

-- ── Facture / paiement reconstitués depuis une pièce du passé ────────────────
-- Même doctrine que TrustTransaction.estSoldeOuverture : documente le passé,
-- n'est pas un événement du jour.
ALTER TABLE "Invoice"
  ADD COLUMN "estReprise" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Payment"
  ADD COLUMN "estReprise" BOOLEAN NOT NULL DEFAULT false;

-- ── La date PORTÉE PAR LA PIÈCE, distincte de l'heure de dépôt (createdAt) ───
-- Sans cette colonne, l'archive de documents d'un client trie sur l'ordre de
-- dépôt en vrac plutôt que sur la chronologie réelle des pièces.
ALTER TABLE "Document"
  ADD COLUMN "dateDocument" TIMESTAMP(3);
