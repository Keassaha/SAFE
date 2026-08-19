# Doctrine d'ancrage : comment SAFE devient la colonne vertébrale d'un cabinet

> ℹ️ **Source de `REGLE_DE_BUILD.md`.** Reste la référence longue : en cas de doute
> sur une règle, c'est ce document qui explique pourquoi.

> Statut : doctrine active, opposable aux décisions de construction.
> Date : 2026-08-14. Auteur : co-direction CEO.
> Portée : priorisation produit, mise en route client, prévention du décrochage.
> À lire avant tout arbitrage « qu'est-ce qu'on construit ensuite ».

---

## 0. Énoncé

Un logiciel de cabinet ne devient jamais essentiel parce qu'il est bon.
Il devient essentiel le jour où **le quitter coûte plus cher que le garder**.

Tout le reste de ce document décrit comment fabriquer ce coût de sortie de façon
honnête, c'est-à-dire en donnant réellement quelque chose que le cabinet ne veut
plus perdre, jamais en retenant le cabinet contre son gré.

La formulation courte, celle qui sert de test :

> **SAFE est la colonne vertébrale d'un cabinet quand il détient seul un registre
> que le cabinet ne peut pas reconstituer ailleurs, et quand l'avocat pose au moins
> une question dont SAFE est la seule réponse.**

Deux conditions. Les deux sont nécessaires. Une seule ne suffit jamais.

---

## 1. La physique de l'abandon

### 1.1 L'abandon n'est presque jamais un jugement sur le produit

Un cabinet qui décroche ne se dit pas « ce logiciel est mauvais ». Il ne se dit rien
du tout. Il a simplement une journée chargée, il fait ce qu'il a toujours fait, et la
journée passe. Puis une autre. L'abandon est un non-événement, c'est ce qui le rend
difficile à voir et facile à mal diagnostiquer.

Conséquence directe : **le réflexe de construire une fonctionnalité en réponse à un
décrochage est presque toujours une erreur de diagnostic.** On ajoute de la valeur à
un endroit que personne ne visite.

### 1.2 Les six causes, dans l'ordre où elles tuent

| # | Cause | Signe observable | Ce qui la corrige |
|---|-------|------------------|-------------------|
| A1 | **L'écran vide** | Compte créé, 0 client, 0 dossier | Mise en route faite par SAFE, jamais par le cabinet |
| A2 | **La double saisie** | L'information existe déjà dans Outlook ou le classeur | Capture automatique, ou renoncer au registre |
| A3 | **L'absence de déclencheur** | Ouvre l'app « quand il pense » | Un écran quotidien qui rend aveugle s'il manque |
| A4 | **Le mandat manquant** | L'adjointe l'aime, l'avocat n'a rien demandé | La question de l'avocat (crochet du haut) |
| A5 | **Le mauvais moment unique** | Un bug, une lenteur, une donnée douteuse un jour de rush | La robustesse là où l'ancrage se joue, pas partout |
| A6 | **L'invisibilité du gain** | « Je ne sais pas trop si ça m'aide » | Le récapitulatif mensuel chiffré |

Ces causes sont ordonnées. Traiter A5 avant A1 ne sert à rien : un compte vide ne
plante jamais, personne ne l'ouvre.

### 1.3 La courbe des trois seuils

L'ancrage n'est pas un état, c'est un franchissement. Trois seuils, et le risque
d'abandon change de nature à chacun.

**Seuil 1 — Jour 0 : la mise en route.**
Le cabinet doit voir SAFE pour la première fois **avec ses propres dossiers dedans**.
Le premier écran doit être une reconnaissance, pas une découverte. Un cabinet qui
rencontre l'écran vide au jour 0 a déjà, statistiquement, décroché ; il ne le sait
pas encore. Risque dominant : A1.

**Seuil 2 — Jours 1 à 21 : l'habitude.**
Trois semaines de jours ouvrables consécutifs suffisent à installer un réflexe
d'ouverture. Pendant cette fenêtre, chaque jour manqué est un jour de recul, pas un
jour neutre. Risque dominant : A2 et A3.

**Seuil 3 — Jours 22 à 90 : la dépendance.**
Le cabinet cesse de se demander s'il utilise SAFE. La question devient « comment on
faisait avant ». À partir de là, un bug ne tue plus, il agace. Risque dominant : A4
et A6, c'est-à-dire des risques politiques internes au cabinet, plus des risques
d'usage.

**Règle dérivée :** la fragilité maximale se situe entre le jour 0 et le jour 21.
C'est là que doit aller l'effort humain, pas dans la construction.

---

## 2. La loi d'ancrage

> **Ce qui ancre, c'est la détention exclusive d'un registre irremplaçable.**

Un logiciel qui reflète une information détenue ailleurs est un miroir. On se
débarrasse d'un miroir sans y penser, parce que l'original est intact. Un logiciel
qui détient l'original devient une infrastructure.

Il faut donc **choisir délibérément ce que SAFE possède seul**, et l'assumer. Ce
choix est une décision produit majeure, pas une conséquence de ce qui a été construit.

### 2.1 Grille d'évaluation d'un registre

Cinq critères. Chacun noté de 0 à 3. Un registre est un candidat à l'ancrage à partir
de 11 sur 15.

1. **Irremplaçabilité.** Si SAFE disparaît demain, l'information est-elle perdue ou
   reconstituable ailleurs en une heure ?
2. **Coût de sortie.** Combien d'heures pour reconstruire ce registre à la main ?
3. **Fréquence de contact.** Combien de fois par semaine quelqu'un doit-il y toucher ?
4. **Sanction de l'oubli.** Que se passe-t-il si on se trompe ? Un inconfort, une
   perte d'argent, ou une faute déontologique ?
5. **Absence de détenteur concurrent.** Word, Outlook, le classeur ou la banque
   détiennent-ils déjà cette information ?

Le critère 5 est éliminatoire. Un registre déjà détenu ailleurs ne peut pas ancrer,
quelle que soit sa note sur les quatre autres. C'est la raison pour laquelle un
logiciel de cabinet ne s'ancre jamais par les documents.

### 2.2 Application aux registres d'un cabinet québécois

| Registre | Irrempl. | Sortie | Fréq. | Sanction | Concurrent | Total |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|
| **Fidéicommis** | 3 | 3 | 2 | 3 | 3 | **14** |
| **Délais et échéances** | 3 | 3 | 3 | 3 | 1 | **13** |
| **Temps facturable et facturation** | 3 | 3 | 3 | 2 | 2 | **13** |
| Comptes clients / recouvrement | 2 | 2 | 2 | 1 | 2 | 9 |
| Dossiers et parties | 2 | 2 | 3 | 1 | 1 | 9 |
| Notes de dossier | 1 | 1 | 3 | 1 | 0 | 6 |
| Documents | 1 | 1 | 3 | 1 | 0 | 6 |
| Contacts clients | 1 | 1 | 2 | 0 | 0 | 4 |

**Trois registres d'ancrage, et trois seulement : le fidéicommis, les délais, la
facturation.** Le reste est du support. Utile, nécessaire même, mais incapable de
retenir un cabinet.

### 2.3 Pourquoi le fidéicommis est le plus fort

C'est le seul registre du cabinet qui soit à la fois obligatoire, inspecté par un
tiers, sanctionné en cas d'erreur, et pénible à tenir. Le cabinet qui confie son
fidéicommis à SAFE ne le reprendra jamais à la main, parce que le reprendre veut dire
tout reconstruire avant la prochaine inspection.

C'est aussi le registre le plus lourd de responsabilité pour nous. **Un ancrage par le
fidéicommis impose un niveau de justesse et de traçabilité supérieur au reste de
l'application.** La doctrine de l'ancrage crée ici une obligation de qualité, pas une
licence de raccourci.

---

## 3. Les trois crochets et le socle

L'ancrage se construit avec quatre pièces. Trois crochets qui prennent à des endroits
différents du cabinet, et un socle sans lequel aucun ne tient.

### 3.0 Le socle : zéro écran vide

Le cabinet ne fait pas la mise en route. SAFE la fait. Ses dossiers réels sont dedans
avant la première connexion. C'est un coût de livraison assumé, pas une faveur.

Rappel de règle croisée : ce socle se remplit avec les **vraies** données du cabinet.
Jamais de client, de dossier ou de facture inventés, y compris en démonstration
(règle dure CEO 2026-08-14).

### 3.1 Crochet d'entrée : SAFE se remplit sans qu'on le remplisse

Le monde réel entre dans un cabinet par trois portes : le courriel, la pièce jointe,
l'appel. Tant que quelqu'un doit retaper ce qui est arrivé par une de ces portes,
SAFE est du travail en plus, et la cause A2 finira par gagner.

Le geste modèle existe déjà chez nous : l'import de preuve de paiement Interac.
Déposer la preuve, lecture automatique, rapprochement proposé, confirmation en un
clic. Aucune saisie. **Ce geste est le patron de conception de tout crochet d'entrée
futur**, et le prochain à traiter dans la même logique est le courriel entrant qui
devient un dossier ou une échéance.

Test du crochet d'entrée : *quelle quantité de frappe au clavier l'adjointe
économise-t-elle par rapport à sa méthode actuelle ?* Si la réponse est zéro ou
négative, ce n'est pas un crochet, c'est une charge.

### 3.2 Crochet quotidien : l'écran qui rend aveugle s'il manque

Pas un tableau de bord. Un tableau de bord se regarde, et ce qui se regarde
s'abandonne. Il faut une **liste de ce qui doit sortir aujourd'hui**, dans l'ordre de
priorité réel du cabinet, sur laquelle on agit.

La bonne mesure de réussite de cet écran n'est pas qu'elle l'aime. C'est qu'un jour
sans l'ouvrir la mette mal à l'aise.

Test du crochet quotidien : *si cet écran disparaissait sans prévenir, combien de
temps avant que quelqu'un appelle ?* Si la réponse dépasse une semaine, l'écran n'est
pas encore le crochet.

### 3.3 Crochet du haut : la question de l'avocat

L'adoption par le bas est la bonne stratégie d'entrée, et c'est une stratégie fragile
tant que le haut ne tire pas. Une adjointe seule à porter un outil que l'avocat n'a
pas demandé porte un risque professionnel sans mandat.

Il faut donc fabriquer **une question que l'avocat pose et à laquelle l'adjointe
répond mieux grâce à SAFE.** Par exemple : où en sont les comptes clients, est-ce
qu'on serait prêts pour une inspection, combien on a facturé ce mois-ci.

À partir du moment où cette question circule, le rapport de force s'inverse : ce n'est
plus l'adjointe qui justifie l'outil, c'est l'outil qui la valorise devant son patron.
C'est la traduction opérationnelle exacte du positionnement copilote du copilote.

Test du crochet du haut : *l'avocat a-t-il, de lui-même, posé une question dont la
réponse vient de SAFE ?* Tant que non, le cabinet reste à un seul fil.

### 3.4 Pourquoi les trois, et pas un seul

Chaque crochet couvre les défaillances des autres. L'entrée neutralise A2. Le
quotidien neutralise A3. Le crochet du haut neutralise A4. Un cabinet accroché par un
seul crochet tient par un fil : le départ de l'adjointe, un mois chargé ou un
changement d'avocat suffit à le détacher.

**Objectif de livraison : deux crochets plantés avant le jour 21, les trois avant le
jour 90.**

---

## 4. Règles de priorisation opposables

Ces règles s'appliquent à tout arbitrage de construction. Elles priment sur
l'enthousiasme du moment.

- **R-01.** Aucun travail de construction sur un cabinet qui n'a pas franchi le seuil
  du jour 0. On remplit d'abord, on construit ensuite.
- **R-02.** Toute fonctionnalité candidate doit nommer le registre d'ancrage qu'elle
  sert, ou le crochet qu'elle plante. Si elle ne sert ni l'un ni l'autre, elle attend.
- **R-03.** Entre deux fonctionnalités, celle qui **supprime de la saisie** passe
  toujours avant celle qui **ajoute une capacité**.
- **R-04.** Une fonctionnalité bâtie mais invisible à l'écran n'existe pas, et compte
  comme non faite. La rendre visible passe avant d'en bâtir une nouvelle.
- **R-05.** La justesse et la traçabilité des trois registres d'ancrage priment sur
  tout le reste du produit, y compris sur le design.
- **R-06.** Aucune fonctionnalité ne doit demander au cabinet de tenir la même
  information à deux endroits. En cas de conflit, SAFE cède ou SAFE prend tout ; jamais
  le milieu.
- **R-07.** Un cabinet qui décroche déclenche un appel, pas un chantier. Le diagnostic
  précède toujours le code.

---

## 5. Anti-patterns : ce qui n'ancre jamais

À écarter par défaut, malgré leur attrait apparent.

**Le stockage de documents comme porte d'entrée.** Détenu par le classeur, Word,
Outlook et le nuage du cabinet. Coût de sortie proche de zéro. Utile en support d'un
registre d'ancrage, jamais comme crochet.

**Le tableau de bord de statistiques.** Se regarde une fois, impressionne, puis
n'appelle aucune action. Confond preuve de valeur et usage.

**La richesse fonctionnelle.** Plus il y a de choses à faire, plus il faut décider
quoi faire, et plus la décision se remet. Un cabinet occupé a besoin d'une seule chose
évidente à faire, pas de douze possibles.

**La personnalisation offerte tôt.** Configurer, c'est du travail non payé demandé au
client avant la valeur. La configuration est notre travail.

**La formation.** Un outil qui demande à être appris pour rendre service perd contre
la méthode actuelle, qui est déjà apprise. La formation ne compense jamais un crochet
manquant.

**L'insistance.** Relances, notifications, rappels d'usage. Ils remplacent une
dépendance absente par une pression, et transforment un client tiède en client gêné.
Cohérent avec la règle de non-confrontation en vente.

---

## 6. Mesure

### 6.1 Le signal unique

**Le nombre de jours ouvrables consécutifs pendant lesquels le cabinet a ouvert SAFE.**

Pas le nombre de clics. Pas le nombre de fonctions touchées. Pas la satisfaction
déclarée, qui est polie et donc inutile. La régularité, et rien d'autre.

Lecture :

| Série en cours | État | Action |
|---|---|---|
| 15 jours et plus | Ancré | Ne rien faire. Documenter ce qui a marché. |
| 5 à 14 jours | En prise | Planter le crochet suivant. |
| 1 à 4 jours | Fragile | Vérifier lequel des six A bloque. |
| 2 jours de trou | Décrochage débutant | Appel le jour même. |
| 10 jours de trou | Décroché | Protocole de réanimation, section 7. |

### 6.2 Fiche d'ancrage par cabinet

À tenir pour chaque cabinet, mise à jour à chaque contact :

- Seuil franchi : 0 / 21 / 90
- Registre d'ancrage visé, et registre réellement détenu par SAFE aujourd'hui
- Crochets plantés : entrée / quotidien / haut
- Cause A dominante identifiée
- Série d'ouverture en cours
- L'avocat a-t-il posé sa question, oui ou non

Six lignes. Une fiche qui prend plus de temps que ça ne sera pas tenue.

### 6.3 Le récapitulatif mensuel

Une page, par cabinet, une fois par mois, en chiffres : ce qui est entré sans saisie,
ce qui a été facturé, ce qui n'a pas été oublié. Il traite la cause A6, et il donne à
l'adjointe l'argument qu'elle présentera à l'avocat le jour du renouvellement.

---

## 7. Protocole de réanimation d'un cabinet décroché

À suivre dans l'ordre. Ne jamais sauter à l'étape 4.

1. **Ne pas relancer.** Une relance demande au client de se justifier, et un client
   gêné se retire poliment. Ne pas confondre silence et refus.
2. **Retirer le travail de son côté.** Proposer de charger nous-mêmes ses vrais
   dossiers, et de lui montrer le résultat en quinze minutes. Elle ne prépare rien.
3. **Poser une seule question**, celle qui vaut plus que tout retour d'usage :
   *dans une semaine ordinaire, quelle est la tâche qui vous prend le plus de temps et
   que vous n'aimez pas faire ?*
4. **Comparer la réponse aux trois registres d'ancrage.** Si elle correspond, le
   problème est un crochet manquant, donc un problème de mise en route. Si elle ne
   correspond pas, c'est une information stratégique majeure, et elle vaut dix
   relances.
5. **Documenter dans `docs/journal/`**, y compris et surtout si le cabinet est perdu.

Un non est final et remercié. La seule chose qui survit à un refus est la permission
de garder le contact.

---

## 8. Ce que cette doctrine interdit

- Interpréter un décrochage comme une demande de fonctionnalité.
- Livrer un cabinet sur un écran vide.
- Créer un ancrage qu'on ne peut pas honorer par la qualité, en particulier sur le
  fidéicommis.
- Retenir un cabinet par la difficulté de sortir plutôt que par la valeur de rester.
  La sortie doit rester libre et l'export possible ; c'est le prix moral de la doctrine
  et c'est déjà notre engagement commercial.

---

## 9. État d'application

**Me Derisier (cabinet actif).** Message du 2026-08-14 : usage faible, retour reporté.
Causes probables par ordre : A1, A3, A4. Prochain geste : protocole section 7, étapes
1 à 3. Aucun chantier de construction déclenché par ce message.

**Me Dadié (Gatineau).** Espace en production, vidé le 2026-08-14, lead non converti
volontairement. Seuil 0 non franchi par construction : il n'y a pas de données réelles,
donc pas d'ancrage possible en l'état, et c'est cohérent avec le fait que rien n'a été
signé.

---

## Documents liés

- `docs/marketing/POSITIONNEMENT_copilote_avocat_assistant.md` (crochet du haut)
- `docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md` (patron du crochet d'entrée)
- `docs/product/SPEC_onboarding_persistant.md`, `SPEC_GUIDE_PREMIERS_PAS.md` (socle)
- `docs/audit/AUDIT_SCHEMA_CANONIQUE.md` (question de l'avocat sur l'inspection)
