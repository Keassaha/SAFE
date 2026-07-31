-- CH-01.3 — Un rapprochement PAR COMPTE bancaire et par période.
--
-- L'ancienne contrainte `[cabinetId, periode]` n'autorisait qu'un seul rapprochement
-- par mois et par cabinet. Or :
--
--   s. 18(8)ii By-Law 9 — « A detailed reconciliation made monthly of EACH trust
--                           bank account »
--   art. 36 B-1 r.5     — livres, journaux et registres DISTINCTS pour chaque
--                           compte général en fidéicommis
--
-- Un cabinet à deux comptes en fidéicommis doit produire deux rapprochements pour le
-- même mois. L'ancienne contrainte le rendait littéralement impossible : le second
-- écrasait le premier.
--
-- Aucune donnée n'est perdue : on remplace une contrainte par une plus fine, qui
-- accepte tout ce que l'ancienne acceptait.
--
-- Nuance Postgres : deux NULL sont considérés distincts par un index unique. La
-- contrainte ne protège donc pas les rapprochements antérieurs à la reprise, dont
-- le compte est NULL. Elle protège tous ceux créés une fois les comptes saisis.

ALTER TABLE "TrustReconciliation" DROP CONSTRAINT IF EXISTS "TrustReconciliation_cabinetId_periode_key";

CREATE UNIQUE INDEX IF NOT EXISTS "TrustReconciliation_cabinetId_trustBankAccountId_periode_key"
  ON "TrustReconciliation"("cabinetId", "trustBankAccountId", "periode");

CREATE INDEX IF NOT EXISTS "TrustReconciliation_trustBankAccountId_periode_idx"
  ON "TrustReconciliation"("trustBankAccountId", "periode");
