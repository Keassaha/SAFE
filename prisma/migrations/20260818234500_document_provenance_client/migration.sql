-- UN DOCUMENT PEUT VENIR D'AILLEURS QUE DU CABINET
-- Réf. docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
--
-- LE PROBLÈME
--
-- `Document.uploadedById` était NOT NULL : tout fichier devait être attribué à un
-- membre du cabinet. Or un client qui dépose une pièce par son lien n'est pas un
-- utilisateur de SAFE.
--
-- Attribuer son dépôt à l'avocate responsable aurait « marché », et aurait inscrit
-- une FAUSSE MENTION dans la piste d'audit : le jour d'une inspection, le registre
-- dirait que l'avocate a téléversé un document qu'elle n'a jamais vu.
--
-- CE QUE LA COLONNE DIT MAINTENANT
--
-- NULL signifie « déposé hors du cabinet ». Le blueprint §11 prévoit d'ailleurs la
-- provenance parmi les métadonnées canoniques : client, cabinet, tiers, tribunal ou
-- système. `provenance` la porte explicitement plutôt que de la déduire d'un NULL.
--
-- ÉLARGISSEMENT, PAS RÉÉCRITURE : aucune ligne existante ne change, toutes gardent
-- leur auteur. Seule la contrainte se relâche.

ALTER TABLE "Document" ALTER COLUMN "uploadedById" DROP NOT NULL;

CREATE TYPE "DocumentProvenance" AS ENUM (
  'CABINET',
  'CLIENT',
  'TIERS',
  'TRIBUNAL',
  'SYSTEME'
);

ALTER TABLE "Document"
  ADD COLUMN "provenance" "DocumentProvenance" NOT NULL DEFAULT 'CABINET';
