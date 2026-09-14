-- REMISE EN COHERENCE DE LA DERIVE `migrations` <-> `schema.prisma` <-> production.
--
-- Constat du 2026-09-14. Trois etats divergeaient :
--   - l'historique `prisma/migrations`,
--   - `prisma/schema.prisma`,
--   - la base de production (Supabase rsblxmmqlnywcjxztebu).
--
-- Cette migration eteint la seule divergence qui portait un risque reglementaire,
-- puis aligne les noms cosmetiques pour que `migrate diff` redevienne vide et cesse
-- de masquer la prochaine vraie derive dans son bruit.
--
-- Deux ecarts ne sont PAS traites ici, parce qu'ils se corrigent cote depot et non
-- cote base : l'unicite `CreditNote(cabinetId, creditNoteNumber)` et l'index
-- `Invoice_cabinetId_deliveryChannel_idx` existent bel et bien en production. Le
-- correctif est de les DECLARER dans `schema.prisma` (fait) et de restaurer le
-- dossier de migration 20260824120000, perdu sur la branche
-- feat/refonte-vitrine-et-dossier (fait, fichier identique au checksum enregistre
-- en base). Les faire tomber aurait supprime une protection reelle.


-- ---------------------------------------------------------------------------
-- 1. LE SEUL ECART A PORTEE REGLEMENTAIRE
-- ---------------------------------------------------------------------------
-- 20260427000000_derisier_baseline a cree l'unicite ainsi :
--
--     CREATE UNIQUE INDEX "TrustReconciliation_cabinetId_periode_key" ...
--
-- soit un INDEX, et non une CONTRAINTE. Le 2026-07-31, CH-01.3 a voulu la lever
-- pour autoriser un rapprochement par compte en fidéicommis, comme l'exigent la
-- s. 18(8)ii By-Law 9 (« of EACH trust bank account ») et l'art. 36 B-1 r.5. Elle
-- a ecrit :
--
--     ALTER TABLE "TrustReconciliation" DROP CONSTRAINT IF EXISTS "..._key";
--
-- `DROP CONSTRAINT IF EXISTS` ne voit pas un index nu. Le `IF EXISTS` a avale le
-- desaccord sans un mot : la migration est passee au vert, l'ancienne unicite est
-- restee, et elle est toujours en production aujourd'hui.
--
-- Consequence concrete : `createOrUpdateReconciliation` fait un findFirst puis un
-- create (lib/services/fideicommis/reconciliation-service.ts). Pour un cabinet a
-- deux comptes en fidéicommis, le rapprochement du second compte du meme mois ne
-- trouve rien, tente le create, et se heurte a l'ancien index. L'avocate recoit une
-- erreur de contrainte sans rapport avec son geste, et le rapprochement mensuel
-- que la loi lui impose devient impossible a produire.
--
-- Le bon outil cette fois, puisque l'objet est un index :
DROP INDEX IF EXISTS "TrustReconciliation_cabinetId_periode_key";

-- L'unicite voulue, `[cabinetId, trustBankAccountId, periode]`, est deja en place
-- en production. Rien a recreer : on retire un vestige, on n'ouvre aucune porte.


-- ---------------------------------------------------------------------------
-- 2. VALEURS PAR DEFAUT SUR `updatedAt`
-- ---------------------------------------------------------------------------
-- Les migrations ecrites a la main de la serie CH-xx (2026-07-30 au 2026-08-03)
-- ont pose `DEFAULT CURRENT_TIMESTAMP` sur `updatedAt`. Prisma, lui, n'en genere
-- jamais pour `@updatedAt` : il ecrit la valeur depuis le client a chaque ecriture.
-- L'ecart est sans effet sur les donnees, mais il revient a chaque diff.
--
-- Sans danger ici : verifie le 2026-09-14, aucun INSERT brut ni `$executeRaw`
-- n'ecrit dans ces tables. Toutes les ecritures passent par Prisma, qui fournit
-- `updatedAt`. Meme geste que 20260707100000 pour DossierDocketEntry.
ALTER TABLE "BeneficialOwner" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "CashReceipt" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ElectronicTrustTransferRequisition" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "InspectionAccessSession" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PracticeSuccessionPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustAnnualReport" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustBankAccount" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustCheque" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustInterestRemittance" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustMonthlyReport" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustProperty" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustShortfall" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "TrustSignatory" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Deux tables portent le meme defaut mais ne figurent pas dans le diff, parce que
-- leur colonne est modelisee autrement : InvoiceLine et PayerRule. On n'y touche pas.


-- ---------------------------------------------------------------------------
-- 3. NOMS ABREGES `ETTR_*` ET AUTRES RACCOURCIS
-- ---------------------------------------------------------------------------
-- 20260731170000_ch07_ontario_transfers a abrege les noms a la main pour rester
-- sous la limite Postgres de 63 caracteres. Prisma, lui, attend ses noms tronques
-- a lui. Purement cosmetique : renommer un index ou une contrainte ne touche pas
-- une ligne de donnee et ne prend qu'un verrou de catalogue, instantane.
ALTER TABLE "ElectronicTrustTransferRequisition" RENAME CONSTRAINT "ETTR_cabinetId_fkey" TO "ElectronicTrustTransferRequisition_cabinetId_fkey";
ALTER TABLE "ElectronicTrustTransferRequisition" RENAME CONSTRAINT "ETTR_trustBankAccountId_fkey" TO "ElectronicTrustTransferRequisition_trustBankAccountId_fkey";

ALTER INDEX "ETTR_account_signedAt_idx" RENAME TO "ElectronicTrustTransferRequisition_trustBankAccountId_signe_idx";
ALTER INDEX "ETTR_cabinetId_countersignedAt_idx" RENAME TO "ElectronicTrustTransferRequisition_cabinetId_countersignedA_idx";
ALTER INDEX "ETTR_cabinetId_idx" RENAME TO "ElectronicTrustTransferRequisition_cabinetId_idx";
ALTER INDEX "ETTR_trustTransactionId_key" RENAME TO "ElectronicTrustTransferRequisition_trustTransactionId_key";

-- Memes raccourcis, memes renommages, dans les autres migrations CH-xx.
ALTER INDEX "TrustAnnualMonthlyTotal_report_periode_key" RENAME TO "TrustAnnualMonthlyTotal_annualReportId_periode_key";
ALTER INDEX "TrustAnnualReport_account_periodStart_key" RENAME TO "TrustAnnualReport_trustBankAccountId_periodStart_key";
ALTER INDEX "TrustInterestRemittance_account_periode_beneficiary_key" RENAME TO "TrustInterestRemittance_trustBankAccountId_periode_benefici_key";
ALTER INDEX "TrustTransactionDocument_tx_doc_role_key" RENAME TO "TrustTransactionDocument_trustTransactionId_documentId_role_key";
