-- Anti-doublon par contenu de fichier (import de preuve de paiement).
-- Additif : 1 colonne nullable + 1 index unique. Les NULL restent distincts en
-- Postgres, donc les paiements sans preuve ne sont pas contraints.
ALTER TABLE "Payment" ADD COLUMN "preuveHash" TEXT;
CREATE UNIQUE INDEX "Payment_cabinetId_preuveHash_key" ON "Payment"("cabinetId", "preuveHash");
