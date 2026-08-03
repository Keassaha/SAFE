-- CH-10 — Soldes débiteurs et versement des intérêts.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-10)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-16, M-18j)
--
-- LE SOLDE DÉBITEUR
--
-- Un solde débiteur sur une carte-client n'est pas un écart comptable : ce sont les
-- fonds d'un AUTRE client qui servent ce dossier.
--
--   art. 60 QC : « L'avocat doit combler SANS DÉLAI tout solde débiteur en
--                 fidéicommis dans un dossier, QUELLE QU'EN SOIT LA RAISON. »
--   s. 14 ON   : « a licensee shall AT ALL TIMES maintain sufficient balances on
--                 deposit in his or her trust accounts. »
--
-- Avant ce chantier, le seul filet était le refus de certifier le rapprochement. Un
-- découvert pouvait donc vivre trois semaines sans que personne ne le voie.
--
-- ⚠️ AUCUN DES DEUX TEXTES NE CHIFFRE DE DÉLAI. La table porte `detectedAt` et
-- `resolvedAt` pour mesurer l'ancienneté, mais AUCUNE colonne d'échéance : inventer
-- un seuil convertirait « sans délai » en une tolérance que le règlement ne donne
-- pas, et afficher « conforme jusqu'au jour 5 » serait faux.
--
-- L'incident RESTE après résolution. Un découvert survenu le 3 et comblé le 4
-- n'apparaîtrait nulle part si l'on ne regardait que les soldes de fin de mois. Or
-- c'est précisément ce qu'un inspecteur cherche : non pas l'état à une date, mais ce
-- qui s'est passé. Masquer un découvert résolu présenterait une comptabilité plus
-- propre qu'elle ne l'a été.
--
-- LES INTÉRÊTS
--
-- Compte général : Fonds d'études juridiques du Barreau au Québec (art. 50, renvoyant
-- à B-1, r. 10) ; Law Foundation of Ontario en Ontario (Law Society Act, s. 57).
-- Compte particulier : le client, c'est sa raison d'être (art. 62).
--
-- ⚠️ INCERTITUDE ASSUMÉE DANS LA FORME DE LA TABLE. Ni B-1 r.10 ni la s. 57 de la
-- Law Society Act n'ont été lus. Le BÉNÉFICIAIRE est certain — il découle des
-- articles lus. La MÉCANIQUE ne l'est pas : taux, fréquence, qui calcule, quel
-- formulaire.
--
-- La table ne porte donc AUCUN champ de calcul : ni taux, ni échéance, ni périodicité.
-- Elle consigne un versement CONSTATÉ — période, montant, date, preuve. Ajouter une
-- colonne « taux » reviendrait à fabriquer une règle que personne n'a vérifiée.
--
-- Migration ADDITIVE (PR-10).

CREATE TABLE IF NOT EXISTS "TrustShortfall" (
  "id"                       TEXT NOT NULL,
  "cabinetId"                TEXT NOT NULL,
  "trustBankAccountId"       TEXT,
  "clientId"                 TEXT NOT NULL,
  "dossierId"                TEXT,
  "amount"                   DOUBLE PRECISION NOT NULL,
  "detectedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "balanceAtDetection"       DOUBLE PRECISION NOT NULL,
  "resolvedAt"               TIMESTAMP(3),
  "remediationSource"        TEXT,
  "remediationTransactionId" TEXT,
  "remediationNote"          TEXT,
  "resolvedById"             TEXT,
  "province"                 TEXT NOT NULL,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustShortfall_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TrustShortfall_cabinetId_idx" ON "TrustShortfall"("cabinetId");
-- Les incidents OUVERTS sont ceux dont resolvedAt est nul : requête de l'alerte.
CREATE INDEX IF NOT EXISTS "TrustShortfall_cabinetId_resolvedAt_idx"
  ON "TrustShortfall"("cabinetId", "resolvedAt");
CREATE INDEX IF NOT EXISTS "TrustShortfall_clientId_idx" ON "TrustShortfall"("clientId");

CREATE TABLE IF NOT EXISTS "TrustInterestRemittance" (
  "id"                 TEXT NOT NULL,
  "cabinetId"          TEXT NOT NULL,
  "trustBankAccountId" TEXT NOT NULL,
  "periode"            TEXT NOT NULL,
  "beneficiary"        TEXT NOT NULL,
  "amount"             DOUBLE PRECISION NOT NULL,
  "remittedAt"         TIMESTAMP(3),
  "proofDocumentId"    TEXT,
  "note"               TEXT,
  "recordedById"       TEXT,
  "province"           TEXT NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustInterestRemittance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustInterestRemittance_account_periode_beneficiary_key"
  ON "TrustInterestRemittance"("trustBankAccountId", "periode", "beneficiary");
CREATE INDEX IF NOT EXISTS "TrustInterestRemittance_cabinetId_periode_idx"
  ON "TrustInterestRemittance"("cabinetId", "periode");
CREATE INDEX IF NOT EXISTS "TrustInterestRemittance_cabinetId_remittedAt_idx"
  ON "TrustInterestRemittance"("cabinetId", "remittedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustShortfall_cabinetId_fkey') THEN
    ALTER TABLE "TrustShortfall" ADD CONSTRAINT "TrustShortfall_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : l'incident survit au client. C'est un événement de la comptabilité du
  -- cabinet, pas une propriété de la fiche client.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustShortfall_clientId_fkey') THEN
    ALTER TABLE "TrustShortfall" ADD CONSTRAINT "TrustShortfall_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustInterestRemittance_cabinetId_fkey') THEN
    ALTER TABLE "TrustInterestRemittance" ADD CONSTRAINT "TrustInterestRemittance_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustInterestRemittance_trustBankAccountId_fkey') THEN
    ALTER TABLE "TrustInterestRemittance" ADD CONSTRAINT "TrustInterestRemittance_trustBankAccountId_fkey"
      FOREIGN KEY ("trustBankAccountId") REFERENCES "TrustBankAccount"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
