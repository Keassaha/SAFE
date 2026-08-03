# 2026-07-31 — CH-10 livré : le solde débiteur et les intérêts

Onzième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **QC-45** et **ON-23**. Le Québec passe à 99, l'Ontario à 97.

## Le problème corrigé

Un solde débiteur sur une carte-client n'est pas un écart comptable : ce sont les
fonds d'un **autre client** qui servent ce dossier.

> art. 60 QC — « L'avocat doit combler **sans délai** tout solde débiteur en
> fidéicommis dans un dossier, quelle qu'en soit la raison. »
>
> s. 14 ON — « a licensee shall **at all times** maintain sufficient balances on
> deposit in his or her trust accounts. »

Jusqu'ici, SAFE ne voyait un découvert qu'au moment de certifier le rapprochement
mensuel. Un découvert survenu le 3 pouvait vivre jusqu'au 25 du mois suivant sans que
personne ne le sache. Détecter une fois par mois ne peut satisfaire ni « sans délai »
ni « at all times ». **La détection est désormais déclenchée à l'écriture.**

## Quatre décisions

**Aucun délai n'a été inventé.** Ni l'art. 60 ni la s. 14 ne chiffrent de nombre de
jours. Le module mesure l'ancienneté d'un découvert et l'affiche, mais ne la convertit
jamais en verdict. `statutoryDeadlineExists` vaut `false`, en dur, pour que personne
n'ajoute un seuil sans se demander d'où il viendrait. Afficher « conforme jusqu'au
jour 5 » fabriquerait une tolérance que le règlement ne donne pas.

**La détection ne bloque rien.** Les garde-fous du CH-00 refusent déjà de *créer* un
découvert. Ceux qui existent malgré eux viennent d'ailleurs : reprise de données,
écriture antérieure aux garde-fous, chèque retourné. Les refuser une deuxième fois ne
les ferait pas disparaître. Et faire échouer une écriture légitime parce que la
détection a planté transformerait un outil de surveillance en panne de caisse.

**Un incident comblé reste au dossier.** Un découvert survenu le 3 et comblé le 4
n'apparaîtrait nulle part si l'on ne regardait que les soldes de fin de mois. Or c'est
ce qu'un inspecteur cherche : non pas l'état à une date, mais **ce qui s'est passé**.
Masquer un incident résolu présenterait une comptabilité plus propre qu'elle ne l'a été.

**La détection est idempotente.** Un découvert déjà ouvert sur la même carte-client
voit son montant remis à jour, il n'en naît pas un second. Sans cela, dix consultations
de l'écran produiraient dix incidents pour un seul problème. En revanche, un découvert
comblé puis survenu de nouveau donne bien un **nouvel** incident : trois récidives sur
la même carte-client racontent autre chose qu'un incident unique.

## Le renflouement, et l'art. 52

L'art. 52 limite ce qui peut entrer au compte général : « l'argent reçu en fidéicommis
et celui requis pour couvrir les frais d'administration de ce compte ». Un dépôt de
renflouement par le cabinet n'entre littéralement dans aucune des deux catégories, et
pourtant l'art. 60 l'impose.

Les deux articles se lisent ensemble : l'obligation de combler prime. Ce raisonnement
est **écrit dans le code** plutôt que sous-entendu, parce qu'un inspecteur peut poser
la question et qu'il faut alors une réponse, pas une intuition.

Le service ne fait d'ailleurs pas le dépôt : celui-ci passe par `createTrustDeposit`
et ses propres contrôles. Les fusionner contournerait les garde-fous, ce qu'un
chantier de conformité ne doit pas faire.

## Les intérêts, et ce qu'on ne sait pas

| Compte | Bénéficiaire | Source |
|---|---|---|
| Général, QC | Fonds d'études juridiques du Barreau | art. 50, renvoyant à B-1, r. 10 |
| Général, ON | Law Foundation of Ontario | Law Society Act, s. 57 |
| Particulier | Le client | art. 62 |

SAFE **impose** le bénéficiaire au lieu de le laisser saisir : il découle des articles
lus, il est certain.

**Ce qui ne l'est pas.** Ni B-1 r.10 ni la s. 57 de la Law Society Act n'ont été lus.
Le taux, la fréquence, qui calcule, quel formulaire : rien de tout cela n'est connu.

La table ne porte donc **aucune colonne de calcul**. Pas de taux, pas d'échéance, pas
de périodicité. Elle consigne un versement constaté — période, montant, date, pièce.
Ajouter un taux fabriquerait une règle que personne n'a vérifiée, et un cabinet
verserait le chiffre obtenu. C'est la raison du 🟡 dans la matrice, et il est assumé.

Un versement n'est « complet » qu'avec une date **et** une pièce. Une date sans pièce
n'est qu'une affirmation, et c'est la pièce que l'inspecteur demande (art. 32).

## Vérification

`tsc --noEmit` propre. **113 fichiers de tests, 1 269 tests, tous verts.**
42 nouveaux tests sur ce chantier. Migration additive appliquée en local.

## Scores

| | Départ | CH-07 | CH-08 | CH-09 | CH-10 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 93 | 96 | 98 | **99** |
| Law Society of Ontario | 42 | 92 | 95 | 95 | **97** |
| Global | 45 | 93 | 96 | 97 | **98** |

## Reste

**CH-11** (rétention différenciée 7 ans QC / 6 et 10 ans ON, mode inspecteur en
lecture seule, trousse d'inspection en un clic), **CH-12** (activation et correction
de `lib/compliance/rules.ts`, rappels de prescription, cessation d'exercice). Et les
écrans, qui restent le vrai reste : le moteur est bâti, le cabinet ne le voit pas
encore.
