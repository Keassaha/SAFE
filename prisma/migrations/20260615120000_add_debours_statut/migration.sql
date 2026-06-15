-- Lot 2 — Statuts de débours (doctrine §5/§9). Migration additive, sûre pour la prod.

-- 1. Type enum
CREATE TYPE "DeboursStatut" AS ENUM ('NON_FACTURE', 'FACTURE', 'RECOUVRE', 'RADIE');

-- 2. Colonne avec défaut (non bloquant : NON_FACTURE par défaut)
ALTER TABLE "DeboursDossier"
  ADD COLUMN "statutDebours" "DeboursStatut" NOT NULL DEFAULT 'NON_FACTURE';

-- 3. Backfill des lignes existantes
--    a) Portées sur une facture -> FACTURE
UPDATE "DeboursDossier" SET "statutDebours" = 'FACTURE'
  WHERE "factureId" IS NOT NULL;

--    b) Dont la facture est entièrement payée -> RECOUVRE
UPDATE "DeboursDossier" d SET "statutDebours" = 'RECOUVRE'
  FROM "Invoice" i
  WHERE d."factureId" = i."id" AND i."paymentStatus" = 'PAID';

-- 4. Index de support pour le KPI « Débours à récupérer »
CREATE INDEX "DeboursDossier_cabinetId_statutDebours_idx"
  ON "DeboursDossier" ("cabinetId", "statutDebours");
