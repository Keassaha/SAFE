# 2026-08-18 — « Aujourd'hui » calculé en UTC, partout

## Ce qui a déclenché

Trois sites signalés la veille comme reste-à-faire : `mes-heures`, `lextrack`,
`employees/nouveau`. Le grep qui les avait produits était trop étroit.

## Ce que le balayage a réellement trouvé

Le motif `new Date().toISOString().slice(0, 10)` comme valeur d'« aujourd'hui »
existait à **22 endroits**, pas trois. Après 20 h à Montréal, l'UTC est déjà le
lendemain : chaque soir, ces formulaires proposaient la date de demain.

Le point aggravant : la plupart sont des **composants serveur**, et le serveur tourne
en UTC en production. Ce n'est donc pas un défaut de poste de travail, c'est un défaut
qui frappe tous les cabinets, quatre heures par jour, tous les jours.

Les plus lourds, par ordre de dégât :

| Site | Ce qui partait au lendemain |
| --- | --- |
| `fideicommis/DepotForm`, `RetraitForm` | date d'un mouvement de fidéicommis |
| `facturation/PaiementFormModal` | date d'un encaissement |
| `gestion/lextrack` | borne d'urgence des échéances |
| `temps/TimeEntryFormModal`, `mes-heures` | date d'une entrée de temps facturable |
| `DeboursAddForm`, `DeboursAddModal`, `DossierDebours` | date d'un débours |
| `closure-letter` | date de fermeture imprimée sur la lettre |
| `employees/nouveau` | date d'embauche |

Sur `lextrack`, la direction de l'erreur est la pire possible : la borne servant à
calculer l'urgence étant avancée d'un jour, **tout le tableau des délais s'annonçait un
jour moins urgent qu'en réalité**. Les délais sont l'un des trois registres d'ancrage.

## Une régression que j'avais introduite

`TrustStatementPDF` définit son propre formateur, passé en `timeZone: "UTC"` au commit
de la veille. C'était juste pour les dates de transaction, et faux pour la ligne
« Document généré le », qui est un instant. Le relevé de fidéicommis annonçait donc
une génération au lendemain en soirée. Corrigé en passant le tampon par le jour
calendaire au lieu de l'instant brut.

## Ce qui n'a pas été touché, volontairement

- **Les noms de fichiers d'export** (`journal-general-2026-08-18.csv`, les PDF de
  documents). La date n'y est pas une donnée métier.
- **Les vrais horodatages** : `checkedAt`, `startedAt`, `clientSignedAt`,
  `generatedAt`. Ce sont des instants, et `toISOString()` complet est correct.
- **`storedDate.toISOString().slice(0, 10)`** sur une date déjà stockée à minuit UTC.
  C'est la lecture correcte, et la confondre avec le défaut aurait tout cassé.

## Vérifié à l'écran

Formulaire de dépôt en fidéicommis et formulaire de retrait : date par défaut au
**17/08**, à 23 h le 17. Avant le correctif, les deux affichaient le 18.

Suite complète au vert à 1492 tests, `tsc --noEmit` propre, parité i18n intacte,
aucune alerte de lint nouvelle.

## Leçon de méthode

Le premier grep avait produit 3 sites, le second 22. La différence tient à une seule
chose : avoir cherché le **motif** (`new Date()` sérialisé en UTC) plutôt que la
**forme** rencontrée la première fois. Quand un défaut est trouvé une fois, chercher
sa famille avant de conclure.
