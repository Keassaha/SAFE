-- ANNULATION / CORRECTION AVEC MOTIF
-- Réf. docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md
--
-- LE PROBLÈME
--
-- Le journal général est append-only : c'est correct, et ça reste. Mais append-only
-- n'a jamais voulu dire « pas de retour en arrière ». Ça veut dire « on revient en
-- arrière en ÉCRIVANT, pas en effaçant ». Jusqu'ici SAFE n'appliquait que la moitié
-- de la règle : la saisie était possible, le retour en arrière ne l'était pas.
--
-- Incident du 2026-08-17 : une écriture d'AJUSTEMENT passée en croyant enregistrer un
-- paiement, sans aucun moyen de la retirer de la page. Ce n'est pas un cas limite,
-- c'est le régime normal d'un cabinet.
--
-- CE QUE CETTE MIGRATION AJOUTE
--
--   1. `JournalCorrectionMotive` — liste FERMÉE de motifs (doctrine §2). Un champ
--      libre par défaut se remplit avec « erreur » et ne prouve plus rien le jour de
--      l'inspection ; la liste force un classement exploitable.
--
--   2. `journal_general.annuleId` — porté par la CONTREPASSATION, jamais par
--      l'écriture d'origine. L'originale ne bouge JAMAIS : c'est toute la garantie de
--      l'append-only. L'UNIQUE interdit structurellement la double annulation d'une
--      même écriture, qui doublerait l'effet sur le solde.
--
--   3. `Payment.reversedAt/reversalMotive/...` — `allocationStatus = REVERSED`
--      existait dans l'enum, était LU à trois endroits, et n'était ÉCRIT nulle part.
--      Un statut mort. Ces colonnes lui donnent son motif, sa date et son auteur.
--
-- POURQUOI ON NE SUPPRIME RIEN, JAMAIS
--
-- Art. 34 et 38 B-1 r.5 (QC) / s. 18 By-Law 9 (ON) : les registres doivent être
-- CONSERVÉS et refléter chaque mouvement. Une ligne effacée est un trou dans la piste
-- d'audit, et un trou se plaide mal devant le syndic. Ce que le cabinet appelle
-- « supprimer », la base l'écrit comme une contrepassation motivée, datée et signée.
-- Les deux lignes quittent la vue courante et vivent dans le registre des corrections.
--
-- ENTIÈREMENT ADDITIVE : aucune colonne existante n'est modifiée ou supprimée,
-- aucune donnée n'est réécrite. Toutes les nouvelles colonnes sont NULLABLE, donc
-- l'historique antérieur reste valide tel quel (rien n'est annulé rétroactivement).

CREATE TYPE "JournalCorrectionMotive" AS ENUM (
  'ERREUR_SAISIE',
  'MAUVAIS_TYPE',
  'DOUBLON',
  'MONTANT_ERRONE',
  'TRANSACTION_ANNULEE',
  'MAUVAIS_DOSSIER',
  'AUTRE'
);

-- ── Journal général ─────────────────────────────────────────────────────────
ALTER TABLE "journal_general"
  ADD COLUMN "annuleId"   TEXT,
  ADD COLUMN "motifCode"  "JournalCorrectionMotive",
  ADD COLUMN "motifTexte" TEXT;

-- Une écriture ne peut être annulée qu'UNE FOIS. Sans cet index, deux annulations
-- concurrentes de la même ligne passeraient toutes les deux et retrancheraient le
-- montant en double. Le garde-fou est ici, pas seulement dans le service.
CREATE UNIQUE INDEX "journal_general_annuleId_key" ON "journal_general"("annuleId");

ALTER TABLE "journal_general"
  ADD CONSTRAINT "journal_general_annuleId_fkey"
  FOREIGN KEY ("annuleId") REFERENCES "journal_general"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Paiements ───────────────────────────────────────────────────────────────
ALTER TABLE "Payment"
  ADD COLUMN "reversedAt"     TIMESTAMP(3),
  ADD COLUMN "reversalMotive" "JournalCorrectionMotive",
  ADD COLUMN "reversalNote"   TEXT,
  ADD COLUMN "reversedById"   TEXT;
