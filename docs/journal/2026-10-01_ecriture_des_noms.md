# 2026-10-01 · Une règle pour écrire le nom d'un client

## Décision CEO

« oui, adopte la règle, code-le » (image du Temps validée :
`captures/2026-10-01_noms_clients_proposition.png`).

- **Listes, registres, menus déroulants, filtres** : « Tremblay, Marie »
  (`clientNomListe`), pour lire et trier par nom de famille.
- **Documents et phrases** (factures, relevés, mandats, courriels, titres) :
  « Marie Tremblay » (`clientDisplayName`, alias `clientNomDocument`).

## Pourquoi

SAFE écrivait la même personne des deux façons selon l'écran : Dossiers et Facturation
« Tremblay, Marie », Temps et Fidéicommis « Marie Tremblay ». `lib/clients/normalize-name.ts`
se disait « source de vérité unique pour tous les écrans » pendant que d'autres fichiers
écrivaient l'inverse, et une vingtaine d'écrans assemblaient le nom à la main.

## Ce qui a changé

`lib/clients/normalize-name.ts` : `clientNomListe` ajoutée (6 tests), docblock de la règle.

Passés à l'écriture des listes : registre et chronomètre du Temps (`TimeEntriesTable`,
`SaisieRapideBlock`, `TimeEntryFormModal`, `temps/page`) ; registre et formulaires du
fidéicommis (`TransactionsTable`, `DepotForm`, `RetraitForm`, `ReleveModal`) ;
paiements (`PaiementsTable`, `PaiementFormModal`, `ImportPreuveModal`) ; débours
(`DeboursAddForm`, `DeboursAddModal`, `facturation/frais`) ; vérification des factures ;
carte du suivi (`InvoiceCard`) ; liste de la création de facture ; registre du forfait
(`RegistreTacheTable`, `AjouterTacheModal`) ; création de dossier et parties ; filtres des
rapports ; pages d'inspection (comptes, virements, cycle de vie, espèces, autres biens) ;
payeurs tiers ; liste des clients de l'Atelier.

Restent à l'écriture des documents : PDF et relevés, mandats, courriels, exports,
services de rapports réglementaires, rappel « pour qui » en tête de la création de
facture, titre du client choisi dans l'Atelier, titre de la page des honoraires d'un
client, dialogue « Terminer » de l'Édition.

Au passage : trois rouges en dur (`#B84A3E`) de `DeboursAddForm` passent au jeton
`text-si-danger-ink`.

## Vérification

`tsc` propre ; 2 441 tests verts ; lint propre sur les 30 fichiers. Navigateur : Temps,
Fidéicommis et création de facture écrivent « Tremblay, Marie ».
Non revu : le fil d'Ariane de la fiche dossier écrit déjà « Tremblay, Marie » (inchangé) ;
les écrans d'inspection et de payeurs tiers n'ont pas été ouverts, faute de données.
