-- CH-12 — Cycle de vie du cabinet : originaux du client et cessionnaire désigné.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-12)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md QC-08, QC-59 à QC-61
--
-- ART. 19 — LES ORIGINAUX DU CLIENT
--
-- « L'avocat ne peut détruire un document original appartenant au client sans son
-- autorisation, ou sans lui avoir donné la possibilité de le reprendre. »
--
-- L'audit relevait (QC-08) qu'aucune notion d'« original du client » n'existait dans
-- SAFE : un document appartenant au client était indiscernable d'une copie de travail.
--
-- DEUX PORTES DE SORTIE, PAS UNE. L'article admet l'autorisation OU l'offre de reprise.
-- N'admettre que l'autorisation bloquerait un cabinet dont le client ne répond plus, et
-- le pousserait à détruire sans rien consigner — ce qui est pire que les deux.
--
-- ⚠️ AUCUNE COLONNE DE DÉLAI après l'offre de reprise. L'art. 19 n'en fixe pas. Ajouter
-- « offre + 30 jours = destruction permise » fabriquerait une règle. La date est
-- conservée pour que l'avocat puisse justifier son jugement, pas pour qu'un compteur
-- décide à sa place.
--
-- ART. 78 — LE CESSIONNAIRE DÉSIGNÉ
--
-- C'est l'obligation la plus facile à manquer de tout le règlement : elle se tient à
-- froid, souvent des années avant qu'elle ne serve, et rien ne la rappelle. Elle
-- appartient donc au tableau de conformité COURANT, pas à une procédure de fin de vie.
--
-- ⚠️ QUÉBEC SEULEMENT. Le LSO impose un plan de succession, obligation relevée en
-- recherche web mais jamais lue dans un texte officiel. La table ne prétend pas la
-- couvrir, et le module pur renvoie une liste vide pour l'Ontario.
--
-- Migration ADDITIVE (PR-10). `isClientOriginal` par défaut FALSE : un document
-- existant n'est pas requalifié rétroactivement en original du client, ce qui
-- bloquerait des suppressions légitimes sans que personne ne comprenne pourquoi.

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "isClientOriginal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "clientAuthorizedDestroyAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "returnOfferedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "originalNote" TEXT;

CREATE TABLE IF NOT EXISTS "PracticeSuccessionPlan" (
  "id"                   TEXT NOT NULL,
  "cabinetId"            TEXT NOT NULL,
  "successorName"        TEXT NOT NULL,
  "successorBarreauNo"   TEXT,
  "successorEmail"       TEXT,
  "successorPhone"       TEXT,
  "successorConfirmedAt" TIMESTAMP(3),
  "lastReviewedAt"       TIMESTAMP(3),
  "notes"                TEXT,
  "province"             TEXT NOT NULL,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PracticeSuccessionPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PracticeSuccessionPlan_cabinetId_key"
  ON "PracticeSuccessionPlan"("cabinetId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PracticeSuccessionPlan_cabinetId_fkey') THEN
    ALTER TABLE "PracticeSuccessionPlan" ADD CONSTRAINT "PracticeSuccessionPlan_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ART. 7 — LA NATURE JURIDIQUE D'UNE ÉCHÉANCE
--
-- « L'avocat doit tenir un système à jour de rappel des dates de prescription et de
-- tout délai influant sur les recours. »
--
-- L'audit relevait (QC-01) que les échéances et le calendrier existaient, mais
-- qu'aucun champ « délai de prescription » n'était TYPÉ et qu'aucune alerte dédiée
-- n'existait. Une prescription était donc indiscernable d'un rappel de rendez-vous.
--
-- Le `type` existant dit à quoi ressemble l'événement. Cette colonne dit ce qu'il coûte
-- de le manquer : une prescription éteint le droit du client, ce n'est pas un retard.
--
-- ⚠️ NULLABLE, ET SANS REPRISE DE DONNÉES. Classer rétroactivement les échéances
-- existantes d'après leur intitulé afficherait un faux calme quand on se trompe dans un
-- sens, et noierait les vraies prescriptions sous des alertes critiques quand on se
-- trompe dans l'autre. Tant que la colonne est nulle, l'échéance est traitée comme un
-- rappel interne, sans effet juridique déclaré. C'est au cabinet de qualifier.
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "deadlineKind" TEXT;
