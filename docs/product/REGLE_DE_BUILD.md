# La règle de build SAFE

Date : 2026-08-19
Statut : **opposable**. Prime sur tout autre document de construction.
Remplace : les ordres de construction du blueprint Neolegal et du modèle SAFE Lead.
Amendé le 2026-08-19 : ajout du but B (acquisition) et de la suite d'outils.

> Ce document tient en une page exprès. Si vous devez en lire un seul avant de
> décider quoi construire, c'est celui-là. Il n'ajoute aucune idée neuve : il
> tranche entre celles qui existent déjà et qui se contredisent.

---

## 1. À quoi sert SAFE

Un cabinet d'avocats perd de l'argent et du sommeil sur trois choses : l'argent des
clients qu'il détient en fiducie, les délais qu'il ne doit pas manquer, et les heures
qu'il oublie de facturer.

SAFE tient ces trois registres à sa place, et les tient assez bien pour qu'on n'ait
plus envie de les tenir ailleurs.

Tout le reste du produit sert ces trois registres ou les prépare.

Une seule famille échappe à cette phrase, et elle est nommée exprès : la **suite
d'outils** (calculateurs de patrimoine familial, de pension alimentaire, et la
suite). Ceux-là ne servent pas les trois registres, ils servent à faire entrer un
cabinet. Ils vivent à côté du produit, jamais dedans, et le §5bis dit à quelles
conditions.

---

## 2. Les deux buts

Il y en a deux. Ils ne se remplacent pas, et chacun a son propre test.

### But A — Ancrer le cabinet qui est déjà là

**Qu'un cabinet ouvre SAFE quinze jours ouvrables de suite.**

Pas dix fonctionnalités livrées. Pas un module terminé. Pas une démonstration
réussie. Quinze jours d'affilée où quelqu'un a ouvert l'application parce qu'il en
avait besoin.

Un cabinet qui fait ça a ancré. Un cabinet qui ne le fait pas n'a rien ancré, quelle
que soit la quantité de code livrée pour lui.

### But B — Faire venir le cabinet qui n'est pas encore là

**Qu'un build produise une preuve montrable qui fasse lever la main quelqu'un.**

Chaque outil construit est documenté et testé, puis publié. Le post n'est pas une
retombée du build : c'est une moitié du livrable. Un outil qui marche et que personne
ne voit ne fait venir personne, exactement comme une fonctionnalité invisible ne
compte pas comme faite.

C'est le seul motif qui autorise à construire pour un cabinet qui n'est pas encore
client. Et il a son propre test, au §5bis, aussi dur que celui du but A.

---

## 3. Où on en est vraiment, au 2026-08-19

Mesuré en production, tous cabinets confondus, sur les 30 derniers jours :

| | créés en 30 jours |
|---|---|
| Clients | 6 |
| Dossiers | 33, dont 33 le même jour (import) |
| Factures | 3 |
| Entrées de temps | 3 |
| Écritures comptables | 4 |
| Paiements | 1 |
| Documents | 0 |

Le cabinet le plus fourni compte 43 clients, 41 dossiers, **1 facture et 1 entrée de
temps**. Le journal d'audit enregistre 6 actions en un mois sur toute la production.

En face : 90 écrans, 122 tables, 52 migrations, 1682 tests, 397 documents.

**Aucun cabinet n'a franchi le jour 0.** C'est le seul chiffre qui compte, et il
gouverne tout ce qui suit.

---

## 4. La règle de décision

Avant d'écrire une ligne, la fonctionnalité candidate doit répondre oui à **une** de
ces deux questions :

1. Elle **supprime une saisie** que quelqu'un fait aujourd'hui à la main.
2. Elle rend **visible et utilisable** quelque chose qui est déjà construit mais que
   personne ne voit.

Si la réponse est non aux deux, elle attend. Sans exception, et sans égard au fait
qu'elle soit déjà spécifiée, déjà commencée, ou déjà promise dans un blueprint.

Trois précisions, parce que c'est là qu'on se ment :

- **Supprimer une saisie** veut dire qu'une personne réelle tapait quelque chose hier
  et ne le tapera plus demain. Pas « ça évitera une saisie plus tard ».
- **Rendre visible** veut dire qu'un écran existant montre une chose qu'il ne montrait
  pas. Pas un nouvel écran pour une chose neuve.
- Entre les deux, **la 2 passe avant la 1**. On a déjà trop de moteur sans bouton.

---

## 5. Ce qui interdit de construire

**Aucun chantier d'ancrage pour un cabinet qui n'a pas franchi le jour 0.**

Le jour 0, c'est le jour où le cabinet ouvre SAFE et y trouve ses vraies données :
ses dossiers, son solde de fiducie, ses délais. Avant ça, on remplit. On ne construit
pas *pour lui*.

Aujourd'hui aucun cabinet n'a franchi ce seuil. Donc la question « quel module
ajoute-t-on » n'est pas la bonne question. La bonne est : **qu'est-ce qui manque pour
qu'un cabinet ouvre SAFE demain matin et y trouve son travail.**

Cette interdiction ne vise QUE les chantiers d'ancrage. Un outil de démonstration qui
passe le §5bis reste autorisé, parce qu'il ne sert pas le même but et qu'il ne touche
pas au même code.

Corollaire : **un cabinet qui décroche déclenche un appel, pas un chantier.** Le
diagnostic précède toujours le code. On a écrit trois doctrines et cinq modules en
réaction à des silences qu'un appel aurait expliqués.

---

## 5bis. Ce qui autorise un outil de démonstration

Un outil de démonstration est un instrument autonome qu'un avocat comprend sans qu'on
lui explique SAFE : un calculateur, un vérificateur, un générateur. La suite visée
commence par le patrimoine familial et la pension alimentaire.

Il est autorisé s'il passe **les quatre** conditions. Trois sur quatre, il attend.

1. **Montrable en moins de trois minutes**, à un avocat qui ne connaît pas SAFE, sur
   des données réelles, sans préambule. Si la démonstration exige de comprendre le
   reste du produit, ce n'est pas un ouvre-porte.

2. **Autonome.** Il ne touche ni aux trois registres d'ancrage, ni à une table
   existante. Un calcul est une fonction pure : entrées, sortie, aucun état partagé.
   Le jour où un outil exige de modifier le schéma commun, ce n'est plus un outil,
   c'est un chantier, et il repasse par le §4.

3. **Sourcé, chiffre par chiffre.** Chaque montant produit renvoie à un article, un
   barème ou un formulaire citable, et l'écran le montre. Un calculateur de pension
   alimentaire qui se trompe engage la responsabilité professionnelle de l'avocate,
   pas la nôtre : c'est elle qui signe. La documentation n'est donc pas la finition,
   c'est la fonctionnalité.

4. **Le post est écrit avant le code.** Au moins la phrase qu'on publiera et le
   problème qu'elle nomme. Si on ne sait pas quoi publier, l'outil ne sert pas
   l'acquisition : il sert l'envie de construire, et il attend.

Et une limite de volume, qui est ce qui empêche la suite d'outils de redevenir 90
écrans : **un seul outil ouvert à la fois, publié avant que le suivant commence.**
Publié veut dire en production, utilisable, et le post parti.

---

## 6. Ce que veut dire « terminé »

Une chose est terminée quand **une personne du cabinet peut l'utiliser à l'écran, sur
ses propres données, sans que personne de SAFE n'intervienne.**

Ce n'est pas terminé si :

- ça ne marche qu'avec des données de démonstration ;
- c'est bâti mais invisible à l'écran ;
- ça compile, les tests passent, et personne ne l'a ouvert dans un navigateur ;
- l'intelligence artificielle décide au lieu de suggérer ;
- ça détruit ou remplace un original au lieu de corriger en ajoutant ;
- ça promet une conformité qu'on n'a pas démontrée ;
- c'est un outil de démonstration et le post n'est pas parti.

Et le test qui tranche quand tous les autres sont passés : **si cet écran
disparaissait sans prévenir, combien de temps avant que quelqu'un appelle ?** Si la
réponse dépasse une semaine, ce n'est pas terminé, c'est décoré.

Pour un outil de démonstration, la question se pose autrement, parce que personne ne
l'ouvre tous les jours : **est-ce qu'un avocat qui ne nous connaît pas a répondu au
post ?** Si le post est parti et que rien n'est revenu, l'outil est terminé mais
l'angle était mauvais. On change l'angle, pas l'outil.

---

## 7. Un seul chantier à la fois, dans chaque file

Deux files, parce que les deux buts ne s'annulent pas :

- **File ancrage** : un chantier ouvert, un seul. Bloquée tant qu'aucun cabinet n'a
  franchi le jour 0.
- **File démonstration** : un outil ouvert, un seul, publié avant le suivant.

Jamais plus de deux chantiers vivants en tout. « Fermé » se mesure au §6, pas au
commit.

---

## 8. Ce que ce document tranche

Six documents donnaient des instructions de construction et se contredisaient. Voici
ce qui est décidé.

| Question | Ce qui était contradictoire | Décision |
|---|---|---|
| Les documents d'abord ? | Le blueprint met « unifier les documents » en phase 0. La doctrine d'ancrage note les documents 6/15 avec un critère éliminatoire : un cabinet ne s'ancre jamais par ses documents. | **La doctrine gagne.** On ne construit pas de socle documentaire pour ancrer. |
| Quelle métrique ? | Une doctrine dit « un seul signal : les jours consécutifs d'ouverture ». Deux autres proposent dix familles d'indicateurs, dont la satisfaction déclarée. | **Un seul signal.** La satisfaction déclarée est polie, donc inutile. |
| La formation ? | Une doctrine la nomme comme un aveu d'échec. Un autre document en fait un levier et une source de revenu. | **Pas un levier.** Un outil qui doit être appris pour rendre service perd contre la méthode actuelle, déjà apprise. |
| Les relances ? | Interdites d'un côté comme substitut à une dépendance absente, prévues de l'autre. | **Interdites vers le cabinet.** Autorisées vers le client du cabinet, qui est un autre sujet. |
| Le cabinet pilote ? | Un même document nomme Me Cayard puis Me Derisier huit lignes plus bas. Me Cayard n'est pas cliente. | **Me Derisier**, seule cliente réelle. À rouvrir quand une deuxième signe. |
| Construire pour un non-client ? | La doctrine d'ancrage l'interdit (R-01, R-02 : servir un registre ou un crochet, sinon attendre). Mais l'acquisition passe par des preuves montrables, et une preuve se construit. | **Autorisé, dans une file séparée.** Un outil de démonstration qui passe les quatre conditions du §5bis. Un seul à la fois, publié avant le suivant. |
| Appeler avant ou après la spec ? | « Ne rien construire avant validation par un cabinet » d'un côté, « trancher par hypothèses écrites, l'appel valide la spec » de l'autre. | **Appeler d'abord**, tant qu'aucun cabinet n'a franchi le jour 0. La spec par hypothèses était un raccourci pour éviter un appel. |

## 9. Ce qui reste valable, et à quel titre

- `DOCTRINE_ANCRAGE_COLONNE_VERTEBRALE.md` — **source de ce document.** Reste la
  référence longue. En cas de doute sur une règle ci-dessus, c'est elle qui explique
  pourquoi.
- `BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md` — **catalogue d'idées, pas un
  ordre de marche.** Ses douze capacités restent une bonne carte de ce qu'un cabinet
  fait. Son ordre de construction ne s'applique plus.
- `MODELE_DEVELOPPEMENT_SAFE_LEAD_UNIFIE.md` — **concerne SAFE Inc., pas le produit
  cabinet.** Jamais validé, et il ne cite pas la doctrine d'ancrage. Ses chantiers
  attendent qu'un cabinet ait ancré.
- `PLAN_CONSTRUCTION_MODULE_NEOLEGAL.md` — **son arbitrage était juste** (la doctrine
  prime sur le blueprint), son ordre de construction est suspendu par le §5.
- Les doctrines de module (comptabilité, annulation, dépenses) — **inchangées.** Elles
  disent comment construire, pas quoi construire.

---

## 10. Les deux prochaines actions

**File ancrage, et elle n'est pas dans le code.** Ouvrir SAFE avec Me Derisier, sur
ses vraies données, et regarder ce qu'elle fait pendant trente minutes. Noter ce
qu'elle tape à la main, ce qu'elle cherche sans trouver, et ce qu'elle continue de
faire ailleurs. Ce relevé décide du prochain chantier d'ancrage. Pas ce document, pas
un blueprint, et pas moi.

**File démonstration : le calculateur de patrimoine familial.** Il est le premier
parce qu'il passe les quatre conditions mieux que tout autre candidat, et parce que
le code le réclame déjà :

- `lib/catalog/catalog.ts` DÉCLARE l'outil `calc-patrimoine-familial`, route
  `/outils/patrimoine-familial`, référence « art. 414 et s. C.c.Q. ». La route
  n'existe pas. C'est du moteur sans bouton, donc aussi un cas du §4.2.
- `lib/documents/famille/wizard-data.ts` documente la méthode actuelle : « Calcul du
  patrimoine familial, form : **Excel Montréal** ». Une saisie réelle à supprimer,
  donc aussi un cas du §4.1.
- Le calcul est une fonction pure, sans état partagé : condition 2 satisfaite par
  construction.
- Les articles 414 à 426 C.c.Q. donnent une règle citable ligne par ligne :
  condition 3 atteignable, à condition de faire la recherche avant le code.

La pension alimentaire vient ensuite, et pas en même temps. Elle est plus risquée :
le barème québécois de fixation des pensions pour enfants a ses propres tables et ses
propres exceptions, et un mauvais nombre se retrouve dans une procédure signée.
