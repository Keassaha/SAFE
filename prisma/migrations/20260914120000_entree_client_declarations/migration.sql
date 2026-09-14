-- Entrée d'un client déjà servi par le cabinet : ce qu'il DÉCLARE avoir fait.
--
-- Migration strictement ADDITIVE. Aucune colonne déplacée, aucune valeur
-- réécrite, aucune contrainte retirée. Tout est nullable ou porte un défaut :
-- les fiches existantes restent valides sans reprise de données.
--
-- Écrite à la main volontairement. `prisma migrate diff` produisait en plus
-- une dizaine d'opérations sans rapport (suppression de l'unicité
-- TrustReconciliation_cabinetId_periode, suppression d'un index sur Invoice,
-- renommages de contraintes), reliquat d'une dérive entre l'historique des
-- migrations et le schéma. Ces opérations doivent être examinées pour
-- elles-mêmes, pas embarquées dans un chantier qui ne les demande pas.

-- ── Le mandat en trois temps, et l'auteur de chaque déclaration ──────────────
-- `retainerSigned` / `retainerDate`, déjà en service, portent l'état « signé ».
-- On ne les double pas : deux colonnes pour la même date font deux vérités.
ALTER TABLE "Client"
  ADD COLUMN "mandatEnvoyeAt"           TIMESTAMP(3),
  ADD COLUMN "mandatEnvoyeDeclareParId" TEXT,
  ADD COLUMN "mandatSigneDeclareParId"  TEXT,
  ADD COLUMN "mandatVerseAuDossierAt"   TIMESTAMP(3),
  ADD COLUMN "mandatVerseDeclareParId"  TEXT,
  ADD COLUMN "conflictDeclareParId"     TEXT,
  ADD COLUMN "entreeCommenceeAt"        TIMESTAMP(3),
  ADD COLUMN "entreeCompleteeAt"        TIMESTAMP(3);

-- ── La file de l'entrée : commencés, pas encore terminés ────────────────────
CREATE INDEX "Client_cabinetId_entreeCommenceeAt_entreeCompleteeAt_idx"
  ON "Client"("cabinetId", "entreeCommenceeAt", "entreeCompleteeAt");

-- ── Auteurs des déclarations ────────────────────────────────────────────────
-- SET NULL partout : la déclaration est la pièce, son auteur la métadonnée.
-- Un utilisateur supprimé n'emporte pas la déclaration et ne se rend pas
-- lui-même insupprimable.
ALTER TABLE "Client"
  ADD CONSTRAINT "Client_mandatEnvoyeDeclareParId_fkey"
    FOREIGN KEY ("mandatEnvoyeDeclareParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Client_mandatSigneDeclareParId_fkey"
    FOREIGN KEY ("mandatSigneDeclareParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Client_mandatVerseDeclareParId_fkey"
    FOREIGN KEY ("mandatVerseDeclareParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Client_conflictDeclareParId_fkey"
    FOREIGN KEY ("conflictDeclareParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Objectif d'entrée du cabinet ────────────────────────────────────────────
-- NULL = aucun objectif posé. L'écran compte alors sans promettre une fin,
-- plutôt que d'inventer un dénominateur.
ALTER TABLE "Cabinet"
  ADD COLUMN "objectifEntreeClients" INTEGER;

-- ── Solde d'ouverture en fidéicommis ────────────────────────────────────────
-- L'écriture compte dans le solde du client, sinon sa carte ne balance pas.
-- Le drapeau existe parce qu'elle n'est PAS un mouvement de fonds : rien n'est
-- entré au compte ce jour-là. Sans lui, le rapprochement bancaire du mois
-- chercherait à la banque une opération qui n'a jamais eu lieu.
ALTER TABLE "TrustTransaction"
  ADD COLUMN "estSoldeOuverture" BOOLEAN NOT NULL DEFAULT false;
