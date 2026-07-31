-- CH-06.7 — Confirmation manuelle de vérification, et dispense de pièce par cabinet.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-06)
--
-- Deux besoins distincts, à ne pas confondre.
--
-- 1. LA CONFIRMATION MANUELLE n'est pas un contournement.
--    L'art. 22 B-1 r.5 exige que les renseignements soient « consignés ou conservés
--    sur tout support papier ou faisant appel aux technologies de l'information,
--    pourvu que des copies puissent en être tirées facilement en tout temps ». La
--    s. 23(15) By-Law 7.1 dit la même chose : « documents may be kept in a
--    machine-readable or electronic form, if a paper copy can be readily produced ».
--    Ni l'un ni l'autre n'exige que la copie soit dans SAFE.
--
--    Un cabinet qui conserve ses pièces au papier, au coffre ou dans une GED externe
--    est donc conforme. Ce qu'il doit pouvoir produire, c'est la pièce — et pour cela
--    il faut savoir OÙ elle est. D'où `proofLocation`, obligatoire, et une attestation
--    nominative et datée : l'avocat engage sa signature, pas une case à cocher.
--
-- 2. LA DISPENSE DE CABINET, elle, est bien une dérogation.
--    Elle permet d'enregistrer une vérification sans pièce ni attestation. Elle est
--    donc ATTRIBUÉE : qui l'a levée, quand, et pourquoi. Une dispense anonyme est une
--    dispense que personne n'assume — et c'est exactement ce qu'un inspecteur cherche.
--    Défaut : `true` (pièce exigée). Aucun cabinet existant n'est dispensé par cette
--    migration ; la levée est un geste explicite.
--
-- Migration STRICTEMENT ADDITIVE (PR-10).

-- ── 1. Réglage cabinet : dispense de pièce justificative ────────────────────
ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "identityProofRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "identityProofWaivedById" TEXT;
ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "identityProofWaivedAt" TIMESTAMP(3);
ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "identityProofWaiverReason" TEXT;

-- ── 2. Mode de preuve et attestation manuelle ───────────────────────────────
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "proofMode" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "proofLocation" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "attestationStatement" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "attestedById" TEXT;
ALTER TABLE "ClientIdentityVerification" ADD COLUMN IF NOT EXISTS "attestedAt" TIMESTAMP(3);
