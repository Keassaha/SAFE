-- Import intelligent de preuve de paiement (Interac) — lot L4.
-- Additif et sûr : 4 colonnes nullables, aucune réécriture de table sur PostgreSQL.
-- L'anti-doublon réutilise le couple provider/providerRef existant
-- (contrainte unique [cabinetId, providerRef]) : provider='interac',
-- providerRef = numéro de référence Interac. Pas de nouvelle contrainte ici.
ALTER TABLE "Payment" ADD COLUMN "preuveStorageKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN "preuveExtractedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "payerName" TEXT;
ALTER TABLE "Payment" ADD COLUMN "payerEmail" TEXT;
