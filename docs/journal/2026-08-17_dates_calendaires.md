# 2026-08-17 — Le jour affiché n'était pas le jour saisi

## Ce qui a déclenché

Note laissée ouverte en marge du chantier d'annulation : « écart de date d'un jour au
journal (saisie le 17, affichage le 16), défaut préexistant d'interprétation UTC ».
Le plus petit des quatre points restants, et le seul visible par l'avocate.

## Ce que le code disait vraiment

La valeur en base était juste. Une saisie `"2026-08-17"` passe par `z.coerce.date()`
et devient `2026-08-17T00:00:00Z`, minuit UTC. C'est la **lecture** qui était fausse :
sans `timeZone`, `Intl` lit en heure locale, et minuit UTC tombe le 16 à 20 h côté
Montréal.

Trois découvertes en cherchant, toutes plus lourdes que le symptôme signalé.

**1. L'export comptable portait le même décalage.** `toIsoDate` lisait
`getFullYear/getMonth/getDate`, des getters locaux. Le 17 sortait en `2026-08-16`
dans les fichiers QuickBooks, Xero et Sage. Ce n'est plus un affichage, c'est une
écriture datée d'un autre jour chez le comptable, et près d'une fin de mois, d'une
autre période de TPS/TVQ. L'export CSV du journal avait le même défaut.

**2. Le décalage n'était pas propre au journal.** Environ 50 points d'affichage le
portaient : échéances et dates d'émission de facture, dates de débours, de dépenses,
d'honoraires, d'embauche, de périodes de paie, de transactions de fidéicommis, de
vérification d'identité, d'échéances de tâche.

**3. Un libellé relatif était faux avant même le formatage.** `formatRelative`
comparait un jour lu en local à un aujourd'hui lu en local, sur une valeur stockée en
UTC : une échéance **du jour** s'annonçait « il y a 1 jour ».

## La décision

`formatDate` n'a pas été corrigé sur place. 84 fichiers l'utilisent et une bonne part
lui passe de vrais horodatages (`createdAt`, `performedAt`), pour lesquels la lecture
locale est la bonne. Le corriger aurait réparé le journal et décalé ces 84 usages dans
l'autre sens.

La distinction manquait au projet, elle est posée dans `lib/utils/calendar-date.ts` :

- une **date calendaire** est un jour, pas un instant. Le 17 août reste le 17 d'où
  qu'on le regarde. Stockée à minuit UTC, relue en UTC ;
- un **horodatage** est un instant, et se lit en heure locale.

Trois outils : `formatCalendarDate` à l'affichage, `toIsoDay` à l'export,
`toCalendarDayUTC` à l'écriture.

## Classement site par site, pas de renommage en masse

Le suffixe `At` ne suffit pas à trancher dans ce code : `recordedAt`, `releasedAt`,
`requestReceivedAt` viennent d'un champ date, donc sont des jours. Chaque site a été
remonté jusqu'à son écriture. Trois familles en sont sorties :

- **jours** (bascule) : 42 sites sur 30 fichiers, plus 7 formateurs définis
  localement, où il fallait ajouter le fuseau sans toucher à leur mise en forme ;
- **instants** (inchangés) : `createdAt`, `updatedAt`, `performedAt`, les périodes
  Stripe, les dates de dernière activité, et les événements d'agenda, saisis en
  `datetime-local` avec une heure affichée ;
- **indéterminés** (laissés tels quels, volontairement) : voir plus bas.

## Livré

- `lib/utils/calendar-date.ts` : `CABINET_TIME_ZONE`, `toCalendarDayUTC`, `toIsoDay`.
- `formatCalendarDate` à côté de `formatDate`, qui garde son sens.
- Export comptable et export CSV du journal en UTC.
- Écritures : les `new Date()` alimentant une colonne de jour passent par
  `toCalendarDayUTC`, sinon une contrepassation du soir portait le lendemain.
- 42 sites d'affichage basculés, 7 formateurs locaux passés en UTC.
- `formatRelative` corrigé sur les deux bornes.

## Ce que les tests ont attrapé

`toCalendarDayUTC` n'était pas idempotente. Le test qui l'exigeait a échoué au premier
passage. Appliquée deux fois, elle reculait d'un jour à chaque passage, en silence,
avec exactement le symptôme qu'on répare. Avec 18 points d'écriture au journal, la
double application était une question de temps.

Le test d'export existant ne pouvait pas voir le défaut : son fixture utilise
`new Date(2026, 5, 15)`, minuit **local**, où les deux lectures tombent d'accord. Les
nouveaux cas passent la forme réelle de production, minuit UTC.

## Ce qui reste ouvert

- **`dateOuverture` de dossier** : provenance mixte. Un import écrit une date de
  formulaire (minuit UTC), la création directe écrit `new Date()` (un instant), et la
  colonne porte `@default(now())`. Corriger l'affichage seul réparerait les dossiers
  importés et casserait les autres. Le vrai correctif est de normaliser la colonne,
  écriture et défaut compris, avec reprise des données. C'est une migration, pas un
  changement d'affichage.
- **`eventDate` de `DossierDocketEntry`** : n'est écrit nulle part dans le code
  aujourd'hui, donc toujours nul à l'écran. Laissé tel quel plutôt que de spéculer.
- **Non vérifié à l'écran** : les pages demandent une session. Couvert au test
  unitaire avec l'`Intl` réel, et démontré en console sur les trois familles de
  formateurs.
