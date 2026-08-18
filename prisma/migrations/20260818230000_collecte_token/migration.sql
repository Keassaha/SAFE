-- LIEN DE COLLECTE DES PIÈCES
-- Réf. docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
--
-- Le client doit pouvoir déposer ses pièces SANS créer de compte. Le patron du lien
-- signé existe déjà deux fois en production (`Invoice.shareToken` avec son expiration,
-- et l'invitation d'équipe) : on le reprend tel quel plutôt que d'en inventer un
-- troisième.
--
-- POURQUOI SUR `Dossier` ET PAS UNE ENTITÉ NEUVE
--
-- Une seule liste de pièces par dossier, donc un seul lien. Une entité « demande
-- d'envoi » séparée n'apporterait rien tant qu'on n'envoie pas plusieurs lots au même
-- client, et elle coûterait une jointure sur le chemin le plus chaud.
--
-- La révocation est le champ mis à NULL : c'est immédiat et sans état intermédiaire.
--
-- ENTIÈREMENT ADDITIVE : deux colonnes nullables.

ALTER TABLE "Dossier"
  ADD COLUMN "collecteToken"          TEXT,
  ADD COLUMN "collecteTokenExpiresAt" TIMESTAMP(3);

-- Le jeton est le seul identifiant que le client présente : il doit être unique, et
-- la recherche doit être indexée puisqu'elle porte chaque chargement de la page.
CREATE UNIQUE INDEX "Dossier_collecteToken_key" ON "Dossier"("collecteToken");
