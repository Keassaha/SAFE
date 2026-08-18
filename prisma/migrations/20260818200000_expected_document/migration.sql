-- COLLECTE DE PIÈCES AUPRÈS DU CLIENT
-- Réf. docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
--     docs/research/RECHERCHE_divulgation_famille_QC_2026-08-18.md
--
-- LE PROBLÈME
--
-- Rien ne permet aujourd'hui de DEMANDER un document à un client ni de le RECEVOIR.
-- Tout entre par le cabinet, à la main : l'avocat réclame par courriel, relance de
-- mémoire, et cherche la pièce dans sa boîte de réception le jour où il en a besoin.
--
-- POURQUOI UNE ENTITÉ NEUVE, ET PAS `DossierPiece`
--
-- `DossierPiece` est le CARTABLE : la liste des pièces produites au tribunal, avec
-- partie, numéro et titre. Une pièce ATTENDUE est une DEMANDE. Une demande peut ne
-- jamais aboutir ; une production ne peut pas exister sans fichier.
--
-- Les confondre rendrait impossible de dire « je l'ai demandée trois fois et je ne
-- l'ai jamais reçue », qui est précisément ce que l'avocat doit pouvoir établir.
--
-- LES TROIS CHAMPS QUE LE DIVORCE IMPOSE
--
-- Une première version de la spec, écrite sur l'immigration, ne les avait pas :
--   `dossierPartieId`  une pièce appartient à Madame ou à Monsieur ;
--   `fournisseur`      la partie adverse n'est ni le client ni un tiers neutre, et
--                      c'est l'objet que la vérification de conflits cherche ;
--   `dossierPieceId`   une pièce reçue peut devenir P-12 au cartable.
--
-- En immigration, les trois restent nuls. C'est le bon sens de la généralité : le
-- modèle du divorce contient celui de l'immigration, l'inverse était faux.
--
-- LES DATES SUR LE DOSSIER
--
-- Six délais légaux commandent la divulgation en matière familiale, et SAFE n'en
-- calculait aucun faute de connaître leur point de départ. Voir
-- lib/dossiers/delais-famille.ts.
--
-- ENTIÈREMENT ADDITIVE : une table neuve, trois enums neufs, cinq colonnes NULLABLES
-- sur `Dossier`. Aucune colonne existante modifiée, aucune donnée réécrite.

CREATE TYPE "ExpectedDocumentEtat" AS ENUM (
  'A_DEMANDER',
  'DEMANDEE',
  'RECUE',
  'A_VERIFIER',
  'ACCEPTEE',
  'A_REMPLACER',
  'ECARTEE',
  'PRODUITE'
);

-- `PARTIE_ADVERSE` est distinct de `TIERS` volontairement. Ranger la partie adverse
-- dans « tiers » masquerait l'objet le plus sensible du dossier.
CREATE TYPE "ExpectedDocumentFournisseur" AS ENUM (
  'CLIENT',
  'CABINET',
  'PARTIE_ADVERSE',
  'TIERS'
);

CREATE TYPE "ExpectedDocumentObligation" AS ENUM (
  'OBLIGATOIRE',
  'CONDITIONNELLE',
  'FACULTATIVE'
);

CREATE TABLE "ExpectedDocument" (
  "id"                TEXT NOT NULL,
  "cabinetId"         TEXT NOT NULL,
  "dossierId"         TEXT NOT NULL,

  "libelle"           TEXT NOT NULL,
  -- Montrable au client, en une phrase. « Relevés du compte conjoint, du 1er janvier
  -- au 31 décembre 2025, toutes les pages ». Jamais « documents financiers ».
  "raison"            TEXT,
  "periodeCouverte"   TEXT,

  "fournisseur"       "ExpectedDocumentFournisseur" NOT NULL DEFAULT 'CLIENT',
  "obligation"        "ExpectedDocumentObligation"  NOT NULL DEFAULT 'OBLIGATOIRE',
  "etat"              "ExpectedDocumentEtat"        NOT NULL DEFAULT 'A_DEMANDER',

  -- Quelle partie du dossier la pièce concerne. NULL hors litige à parties multiples.
  "dossierPartieId"   TEXT,

  -- L'article qui impose la pièce, affichable. NULL pour une pièce d'appui : celles-ci
  -- ne figurent dans aucun règlement, elles servent à REMPLIR les autres. Afficher un
  -- délai légal sur une pièce d'appui donnerait une fausse assurance à l'avocat.
  "referenceLegale"   TEXT,
  "echeance"          TIMESTAMP(3),

  -- Requise pour la reddition à la Commission des services juridiques. En aide
  -- juridique, une pièce manquante fait REFUSER la facture, pas seulement retarder.
  "requisPourAideJuridique" BOOLEAN NOT NULL DEFAULT false,

  -- Le fichier reçu. L'original n'est jamais remplacé.
  "documentId"        TEXT,
  -- La pièce produite qui en découle, le cas échéant.
  "dossierPieceId"    TEXT,

  "motifRemplacement" TEXT,
  "demandeeLe"        TIMESTAMP(3),
  "recueLe"           TIMESTAMP(3),
  "traiteeParId"      TEXT,

  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExpectedDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExpectedDocument"
  ADD CONSTRAINT "ExpectedDocument_cabinetId_fkey"
    FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpectedDocument_dossierId_fkey"
    FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpectedDocument_dossierPartieId_fkey"
    FOREIGN KEY ("dossierPartieId") REFERENCES "DossierPartie"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpectedDocument_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpectedDocument_dossierPieceId_fkey"
    FOREIGN KEY ("dossierPieceId") REFERENCES "DossierPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpectedDocument_traiteeParId_fkey"
    FOREIGN KEY ("traiteeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ExpectedDocument_cabinetId_idx"           ON "ExpectedDocument"("cabinetId");
CREATE INDEX "ExpectedDocument_dossierId_etat_idx"      ON "ExpectedDocument"("dossierId", "etat");
-- Sert l'écran « ce qui manque » : sans index, le filtre balaie toutes les pièces
-- attendues du cabinet.
CREATE INDEX "ExpectedDocument_cabinetId_etat_echeance_idx"
  ON "ExpectedDocument"("cabinetId", "etat", "echeance");
CREATE INDEX "ExpectedDocument_dossierPartieId_idx"     ON "ExpectedDocument"("dossierPartieId");

-- ── Les dates qui commandent les délais ─────────────────────────────────────
--
-- Six délais en dépendent, et SAFE n'en connaissait aucune. C'est le plus petit ajout
-- de données du parcours, et il conditionne tout le reste.
ALTER TABLE "Dossier"
  ADD COLUMN "dateSignification"          TIMESTAMP(3),
  ADD COLUMN "datePresentation"           TIMESTAMP(3),
  ADD COLUMN "dateInstruction"            TIMESTAMP(3),
  ADD COLUMN "dateProtocole"              TIMESTAMP(3),
  ADD COLUMN "dateCommunicationPatrimoine" TIMESTAMP(3);
