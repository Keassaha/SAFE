-- CH-00 — Programme « Inspection Ready ».
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-00)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-17)
--
-- Trois objets :
--  1. Motif réglementaire obligatoire sur les retraits en fidéicommis.
--     B-1 r.5 art. 56 (QC) ne permet QUE trois retraits ; By-Law 9 s. 9(1) (ON)
--     en permet cinq. Jusqu'ici aucun motif n'était enregistré : un retrait était
--     indistinguable d'un autre à l'inspection.
--
--  2. Troisième voie du rapprochement (écart P-1). `soldeParDossier` était calculé
--     et stocké mais JAMAIS comparé — la « comparaison à trois voies » n'en
--     comparait que deux. `ecartCartesClients` matérialise la comparaison
--     manquante et devient bloquante à la certification.
--
--  3. Fin d'exercice financier du cabinet, sans laquelle aucune durée de
--     conservation ancrée sur l'exercice n'est calculable (art. 32 QC, s. 23 ON).
--
-- Migration STRICTEMENT ADDITIVE (PR-10) : toutes les colonnes sont nullables ou
-- portent une valeur par défaut. Aucune donnée existante n'est modifiée ni perdue.
-- L'historique antérieur reste sans motif de retrait, ce qui est le fait exact :
-- l'information n'a jamais été collectée, on ne l'invente pas rétroactivement.

-- 1. Motif réglementaire de retrait ------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrustWithdrawalMotive') THEN
    CREATE TYPE "TrustWithdrawalMotive" AS ENUM (
      'REMISE_CLIENT_OU_TIERS',
      'HONORAIRES_DEBOURS_FACTURES',
      'TRANSFERT_AUTRE_FIDEICOMMIS',
      'DEPOT_PAR_INADVERTANCE'
    );
  END IF;
END
$$;

ALTER TABLE "TrustTransaction"
  ADD COLUMN IF NOT EXISTS "withdrawalMotive" "TrustWithdrawalMotive";

-- 2. Troisième voie du rapprochement et attestation vérifiée -----------------
ALTER TABLE "TrustReconciliation"
  ADD COLUMN IF NOT EXISTS "ecartCartesClients" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "TrustReconciliation"
  ADD COLUMN IF NOT EXISTS "verifiedControlsJson" TEXT;

ALTER TABLE "TrustReconciliation"
  ADD COLUMN IF NOT EXISTS "declarationText" TEXT;

-- 3. Fin d'exercice financier ------------------------------------------------
ALTER TABLE "Cabinet"
  ADD COLUMN IF NOT EXISTS "fiscalYearEnd" TEXT;
