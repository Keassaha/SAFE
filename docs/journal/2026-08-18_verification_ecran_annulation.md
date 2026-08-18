# 2026-08-18 — Ce que l'écran a montré et que les tests ne pouvaient pas voir

## Contexte

Vérification à l'écran des trois commits du chantier comptable, sur le cabinet test
local. Migration d'annulation déjà en place depuis le 17, contrôlée objet par objet
(colonnes, enum à 7 valeurs, index UNIQUE, clé étrangère).

Note d'infrastructure : `safe_local` n'a **aucune table `_prisma_migrations`**. La base
a été montée par `db push`. C'est pourquoi `prisma migrate status` annonce 47
migrations non appliquées alors que tout est là. Ne pas lancer `migrate deploy` sur
cette base : il rejouerait tout depuis zéro et échouerait sur des objets existants.

## Ce qui marchait

- Date saisie = date affichée, dans le tableau comme dans la modale d'annulation.
- Contrepassation exacte, datée du jour, motif en clair.
- Les deux lignes quittent la vue courante et les totaux, et vivent dans Corrections.
- Motif obligatoire, `AUTRE` exige 10 caractères, bouton désactivé sinon.
- Double annulation refusée, annuler une annulation refusée.

## Deux défauts que seul l'écran pouvait révéler

### 1. Le formulaire proposait la date de DEMAIN

`toDateStr` faisait `d.toISOString().slice(0, 10)`. Après 20 h à Montréal, l'UTC est
déjà le lendemain : à 22 h 57 le 17 août, le champ Date affichait le 18.

C'est le même défaut de famille que celui corrigé la veille, mais du côté de
**l'écriture**, et c'est le plus dangereux des trois. Les deux premiers déformaient
la lecture d'une donnée juste. Celui-ci écrit une donnée fausse : une adjointe qui
travaille en soirée postdate ses écritures sans que rien ne le signale.

La manipulation de vérification en a été la preuve accidentelle. Écriture enregistrée
en croyant saisir le 18, contrepassation sortie au 17 par `toCalendarDayUTC`. Les deux
dates ne concordaient pas dans le registre des corrections, et c'est ce désaccord qui
a mis le défaut en évidence.

Effet de bord du correctif : la plage de filtre par défaut affichait « au 01/09 » pour
le mois d'août. Elle affiche maintenant le 31/08. Elle débordait d'un jour sur le mois
suivant, ce que personne n'avait relevé.

### 2. La précision d'un motif abandonné survivait

Choisir `AUTRE`, écrire un texte, puis changer d'avis pour un motif de la liste : le
texte restait en mémoire et partait au serveur. Le registre inscrivait
« Erreur de saisie · oups », une précision que l'utilisateur ne voit plus, ne peut
plus corriger, et n'a jamais voulu associer à ce motif.

Le champ n'est visible que sous `AUTRE`. Ce qui était enregistré n'était donc pas ce
qui était montré, exactement à l'endroit du produit qui sert à se défendre devant le
syndic.

## Ce que ça dit de la méthode

Les 1492 tests étaient au vert avant et après. Aucun ne pouvait attraper ces deux
défauts : le premier dépend de l'heure réelle au moment de la saisie, le second d'un
enchaînement de gestes. La vérification à l'écran n'est pas une formalité de fin de
chantier, c'est le seul filet pour cette classe de défauts.

## Reste ouvert

Le motif `new Date().toISOString().slice(0, 10)` comme « aujourd'hui » subsiste à
trois endroits, tous avec le même effet de bascule en soirée :

- `app/(app)/mes-heures/page.tsx:67`
- `app/(app)/gestion/lextrack/page.tsx:237`
- `app/(app)/employees/nouveau/page.tsx:24`

Non corrigés ici : hors du module comptable, et chacun mérite sa propre vérification
à l'écran.
