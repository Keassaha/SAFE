-- Import intelligent de reçu de dépense (R0). Additif : reçu conservé + anti-doublon par contenu.
ALTER TABLE "CabinetExpense" ADD COLUMN "pieceStorageKey" TEXT;
ALTER TABLE "CabinetExpense" ADD COLUMN "pieceHash" TEXT;
CREATE UNIQUE INDEX "CabinetExpense_cabinetId_pieceHash_key" ON "CabinetExpense"("cabinetId", "pieceHash");
