# Programme de formation · système de design SAFE

> **Créé le 2026-08-08.** Huit semaines. Deux rendez-vous par semaine :
> **mercredi 15 h 30 à 16 h 15**, la notion, et **vendredi 13 h 15 à 14 h 45**, l'atelier.
> Voir [CALENDRIER_TRAVAIL.md](../operations/CALENDRIER_TRAVAIL.md).
>
> **Règle qui gouverne tout le programme : chaque atelier livre un écran.** On n'apprend
> pas le design en lisant sur le design, on l'apprend en notant un écran réel, en le
> corrigeant, et en le renotant. À la fin des huit semaines, six écrans de SAFE sont
> passés au standard et vous savez pourquoi.

---

## Les trois documents que ce programme vous apprend à utiliser

Vous les avez déjà. Le programme ne les remplace pas, il vous rend capable de les
appliquer sans les relire à chaque fois.

| Document | Ce qu'il contient | Comment il sert ici |
|---|---|---|
| [SAFE_PREMIUM_DESIGN_STANDARD.md](../design/SAFE_PREMIUM_DESIGN_STANDARD.md) | 7 lois, 93 règles avec seuils mesurables, grille sur 100 | Le référentiel. C'est lui qui note |
| [DESIGN_HUMAIN.md](../design/DESIGN_HUMAIN.md) | Base issue de créateurs humains, §10 anti-slop | Le garde-fou contre l'écran qui a l'air généré |
| [SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md](../design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md) | Le plan de fond, le plan de flux, le plan flottant | Résout 80 % des questions d'ombre et de matière |

---

## Le protocole d'atelier, identique chaque vendredi

Quatre-vingt-dix minutes, minutées. C'est un protocole, pas une intention.

| | Durée | Ce qu'on fait |
|---|---|---|
| 1 | 10 min | **Noter l'écran avant.** Grille §4 du standard, sur 100. Le score se pose par écrit, avant toute correction |
| 2 | 10 min | **Le test des cinq secondes.** Ouvrir l'écran, fermer les yeux au bout de 5 s, écrire ce dont on se souvient. Ce qu'on a retenu est la vraie hiérarchie |
| 3 | 15 min | **Le grep.** Les règles automatisables du jour, en ligne de commande. Le résultat est un nombre, pas une opinion |
| 4 | 40 min | **Corriger**, dans l'ordre de gravité : B, puis M, puis m. On s'arrête à l'heure, même à moitié |
| 5 | 10 min | **Renoter** et écrire l'écart dans le journal de l'atelier, annexe A |
| 6 | 5 min | **La règle manquante.** Si le défaut trouvé n'a pas d'identifiant PS, il en reçoit un. Le standard grandit |

**L'étape 6 est celle qui compose.** Un défaut corrigé disparaît. Un défaut transformé en
règle avec un seuil ne revient plus jamais.

---

## Semaine 1 · Le jeton, ou pourquoi une valeur recopiée finit toujours par mentir

**Loi visée : L5.** Aucune valeur brute.
**Écran de l'atelier : Facturation, liste.**

### La notion

Un système de design n'est pas une palette, c'est une **chaîne à sens unique** en trois
niveaux :

```
primitive        forest-600, space-4, dur-fast          la valeur, nommée par ce qu'elle EST
   ↓
sémantique       si-forest, si-alert, si-rule           le rôle, nommé par ce qu'il FAIT
   ↓
composant        bouton primaire, filet de total        l'usage
```

Un écran n'a le droit de connaître que le troisième niveau. Le jour où le vert de la marque
change, un seul fichier change. C'est tout l'intérêt, et c'est pour ça que les règles
PS-001 et PS-002 sont classées bloquantes et vérifiables au grep : une règle non
automatisable est une intention, pas une propriété.

La notion de jeton de design a été formalisée chez Salesforce autour de 2014 dans le cadre
du système Lightning, puis reprise partout ; Material Design 3 en fait aujourd'hui trois
couches explicites (référence, système, composant) 🟡. Le vocabulaire varie, le mécanisme
est le même partout.

### Le cas interne · le seuil d'espèces et le formateur monétaire

Deux exemples du même défaut, trouvés chez vous le 5 août, à deux heures d'intervalle.

**Le formateur.** Deux implémentations de `formatCurrency` coexistaient, plus un troisième
`money()` sur les écrans de conformité. Trois façons d'écrire un montant dans un produit
comptable. La règle PS-017 disait déjà « un seul composant de formatage de montant dans
tout le produit », et elle n'était pas appliquée.

**Le seuil.** La maquette publique du site testait `valeur > 7500` alors que la règle est
« 7 500 $ ou plus ». Le seuil avait été recopié au lieu d'être importé. Deux caractères,
sur une page publique, sur une règle dont vous faites votre argumentaire.

Ce que ces deux cas prouvent ensemble : **la duplication ne produit pas une erreur au
moment où on duplique.** Les deux copies sont d'accord le premier jour. Elles divergent
plus tard, quand personne ne regarde. C'est pour ça que la règle porte sur la duplication
elle-même, pas sur l'écart.

### L'atelier

```bash
grep -rn "#[0-9A-Fa-f]\{6\}" app components --include="*.tsx" | wc -l
```

```bash
grep -rEn "(bg|text|border|ring|fill|stroke)-(emerald|green|teal|slate|gray|zinc|neutral|stone|blue|indigo|violet|purple|pink|orange|cyan|sky|lime)-[0-9]{2,3}" app components --include="*.tsx" | wc -l
```

Les deux comptes doivent tomber à zéro sur l'écran travaillé. Pas sur tout le produit,
c'est un travail de plusieurs semaines : sur **l'écran du jour**, et le chiffre est noté.

### Critère de réussite

PS-001 et PS-002 à zéro sur l'écran Facturation. Score §4 noté avant et après.

### Le piège

Corriger les couleurs en inventant un nouveau jeton sémantique pour chaque cas. Un système
à quarante jetons sémantiques n'est plus un système. Si vous ne trouvez pas le rôle
existant qui convient, c'est souvent que l'élément ne devrait pas être là.

---

## Semaine 2 · Le chiffre est sacré

**Loi visée : L1.** Poids dans la grille : **14 points sur 100**, le plus lourd.
**Écran de l'atelier : Comptes, rapprochement.**

### La notion

Trois mécanismes, tous vérifiables.

**Les chiffres tabulaires.** Dans la plupart des polices, le 1 est plus étroit que le 8. Une
colonne de montants devient alors un peigne irrégulier, et l'œil ne peut plus comparer deux
lignes sans les lire. La propriété CSS `font-variant-numeric: tabular-nums` force toutes les
glyphes numériques à la même chasse. C'est une ligne de CSS, et c'est la différence visible
entre un tableur et un livre comptable.

**L'alignement à droite, en-tête compris.** On compare des montants par leur unité, leur
dizaine, leur centaine. Aligner à gauche détruit cette comparaison. L'en-tête suit la
colonne, sinon il désigne le vide.

**Le zéro et le négatif.** Un solde nul s'écrit `0,00` en gris, jamais un tiret : le tiret
veut dire « pas de donnée », et confondre « zéro dollar » avec « je ne sais pas » dans un
compte en fidéicommis est une faute de fond, pas de forme. Un négatif porte un signe moins
visible, jamais des parenthèses seules, qui ne se lisent pas à l'écran et pas du tout en
diagonale.

### Le cas externe · pourquoi les tableaux de bord financiers se ressemblent tous

Stripe, Xero, QuickBooks, les terminaux de marché : tous alignent à droite, tous utilisent
des chiffres à chasse fixe, tous séparent la ligne de total par un filet plutôt que par une
couleur de fond 🟠. Cette convergence n'est pas de l'imitation, c'est une contrainte de
lecture qui n'a qu'une solution correcte.

Conséquence pour vous : sur les chiffres, **l'originalité est un défaut**. C'est le seul
domaine du produit où vous devez ressembler aux autres, et c'est libérateur.

### L'atelier

```bash
grep -rn "toFixed\|Intl.NumberFormat" app components lib --include="*.ts*" | grep -v "lib/utils/format"
```

Toute occurrence hors du formateur unique est une violation de PS-017. Puis test de rendu
avec un montant à sept chiffres, un solde nul, un solde négatif, sur l'écran du jour.

### Critère de réussite

Critère 1 de la grille §4 à 14 sur 14 sur l'écran Comptes. C'est le seul critère où une
faute unique est éliminatoire.

### Le piège

Traiter la composition des chiffres comme de la finition qu'on fera à la fin. Elle pèse
14 points, plus que la couleur, le mouvement, les formulaires et l'élévation réunis.

---

## Semaine 3 · Une intention par écran

**Loi visée : L2.**
**Écran de l'atelier : Conformité, tableau de bord.**

### La notion

Un écran a une action principale et une seule. Un seul bouton plein. Tout le reste est
secondaire, discret ou destructif.

La raison n'est pas esthétique. Quand deux actions se présentent avec le même poids visuel,
l'utilisatrice doit **choisir**, et ce choix se paie en hésitation à chaque visite. Un écran
utilisé quarante fois par jour par une adjointe coûte alors quarante hésitations par jour.

Le test de vérification est gratuit : **le test des cinq secondes**. Ouvrir l'écran,
regarder cinq secondes, fermer les yeux, dire ce qu'on est censé y faire. Si la réponse
hésite, l'écran a deux intentions, quel que soit le soin apporté au reste.

### Le cas interne · deux actions primaires sur le rapport mensuel

Trouvé chez vous le 4 août, pendant les passes visuelles sur les nouveaux écrans de
conformité : « deux actions primaires concurrentes sur le rapport mensuel ». Sur l'écran
qui produit la pièce numéro un d'une inspection.

Le détail qui compte : ce défaut a été trouvé **en regardant l'écran dans un navigateur sur
des données volontairement imparfaites**, pas en relisant le code. Certaines fautes ne sont
visibles que rendues. C'est la raison d'être de l'étape 2 du protocole.

### L'atelier

Le test des cinq secondes sur l'écran du jour, puis comptage : combien de boutons pleins
`si-forest` visibles sans défilement ? La réponse attendue est exactement 1 (PS-020,
gravité bloquante).

Corriger, c'est presque toujours **rétrograder**, pas supprimer : la deuxième action devient
secondaire. La suppression est rarement la bonne réponse, elle enlève une capacité.

### Critère de réussite

Un seul bouton plein par écran, sur les six écrans déjà passés au design. Le comptage se
fait à l'œil, écran par écran, et se note.

### Le piège

Compter le bouton plein et oublier les autres appels à l'action déguisés : une carte
cliquable colorée, un lien en gras dans un encadré coloré. L'œil ne compte pas les
composants, il compte les zones qui attirent.

---

## Semaine 4 · Densité d'information contre densité de formes

**Loi visée : aucune directement, critère 5 de la grille (7 points).**
**Écran de l'atelier : Rapports.**

### La notion

Le réflexe est de croire qu'un écran professionnel est un écran chargé. C'est faux, et la
distinction se formule en une phrase : **augmentez la densité d'information, diminuez la
densité de formes.**

Une information est une donnée dont l'utilisatrice a besoin. Une forme est une boîte, une
bordure, une ombre, une icône, un badge, un fond, un séparateur.

🟢 Tuch, Presslaber, Stöcklin, Opwis et Bargas-Avila (International Journal of
Human-Computer Studies, 2012) ont montré que **17 millisecondes** suffisent pour qu'une
complexité visuelle élevée dégrade la première impression, et que cette dégradation est
nette par rapport à une complexité faible ou moyenne. Ce résultat prolonge celui de
Lindgaard et coll. (2006), qui établissait qu'un jugement esthétique stable se forme en
50 ms 🟢.

Traduction opérationnelle : **retirer un élément vaut mieux qu'en ajouter un**, et
l'arbitrage se fait sur le rapport entre éléments porteurs et éléments décoratifs.

### Le cas externe · le tableau dense contre le tableau de bord

Comparez mentalement deux familles d'outils. D'un côté les tableaux de bord d'agence :
grandes cartes, beaucoup d'espace, quatre chiffres à l'écran, des icônes partout. De
l'autre les outils d'opérateurs, terminaux de marché, outils de suivi de développement :
beaucoup de lignes, peu de formes, presque pas de couleur, des filets d'un pixel au lieu
de cartes 🟠.

Le second est jugé plus sérieux par des utilisatrices professionnelles. Non pas parce qu'il
est plus austère, mais parce que **chaque pixel y sert une donnée**. Un cabinet qui ouvre
son journal veut voir quarante lignes, pas quatre cartes.

### L'atelier

Sur l'écran du jour, compter deux nombres :

- **éléments porteurs** : chaque donnée réelle affichée ;
- **éléments décoratifs** : chaque bordure, fond, ombre, icône sans fonction, séparateur.

Puis retirer des formes jusqu'à ce que le second nombre soit au moins **trois fois plus
petit** que le premier. On ne retire jamais de donnée.

### Critère de réussite

Le nombre de lignes de données visibles sans défilement augmente, et le nombre de formes
diminue. Les deux chiffres sont notés.

### Le piège

Confondre densité et entassement. Retirer des formes sans corriger le rythme d'espacement
donne un écran nu et illisible. L'espace blanc est un élément porteur, il ne compte pas
comme forme.

---

## Semaine 5 · La couleur ne porte jamais seule une information

**Loi visée : L4.**
**Écran de l'atelier : Employés, accès et rôles.**

### La notion

Un statut se lit par **trois canaux simultanés** : une couleur, une forme, un mot. Retirez
la couleur, l'information doit survivre.

Trois raisons, et la troisième est celle qui vous concerne le plus :

1. Environ 8 % des hommes présentent une déficience de la vision des couleurs, très
   majoritairement sur l'axe rouge-vert 🟢, exactement l'axe qui porte partout le
   « conforme / non conforme ».
2. Un écran imprimé en noir et blanc perd toute la couleur, et vos écrans **sont** imprimés :
   les registres, la trousse d'inspection, le rapport mensuel.
3. Un dossier d'inspection est lu par un tiers qui ne connaît pas votre code couleur.

Le seuil de contraste applicable reste 4,5:1 pour le texte courant et 3:1 pour le texte
large et les éléments d'interface (WCAG 2.2, niveau AA) 🟢.

### Le cas interne · le correctif de contraste amber, 23 juin

Vous avez déjà rencontré ce mur : le journal du 23 juin porte un correctif de contraste sur
l'ambre, et la mémoire du projet en a tiré une règle durable, le texte sur `amber-ink`.
L'ambre est le piège classique : c'est la couleur qui a l'air lisible au concepteur et qui
ne l'est pas, parce que sa luminance est haute alors que sa saturation donne l'illusion de
la densité.

### Le cas interne · la grille de droits qui montrait ce qui n'était pas appliqué

Trouvé le 5 août. L'onglet « Accès et rôle » affichait une grille de permissions écrite à la
main, à côté du code qui bloque vraiment. Ce n'est pas un défaut de couleur, c'est le même
défaut que la semaine 1 sous un autre visage : **une vérité écrite deux fois.**

L'enseignement de design est réel : un écran qui affiche un état doit **dériver** cet état
de la source qui fait autorité, jamais le décrire. La solution retenue chez vous dérive la
grille en appelant les fonctions de garde elles-mêmes. C'est le principe des jetons de la
semaine 1, appliqué à un état plutôt qu'à une valeur.

### L'atelier

Passer l'écran du jour en niveaux de gris (capture d'écran, filtre de saturation nulle) et
vérifier que chaque statut reste identifiable. Puis vérifier les contrastes, texte et
éléments d'interface, avec l'audit automatisé du navigateur.

### Critère de réussite

Zéro information perdue en niveaux de gris. Zéro violation de contraste AA sur l'écran.

### Le piège

Ajouter une icône colorée pour « compléter » la couleur. Une icône rouge et une icône verte
qui ont la même forme ne complètent rien. La forme doit différer.

---

## Semaine 6 · Les trois états que tout le monde oublie, et la vitesse

**Lois visées : L6.** Critères 4 et 6 de la grille, 17 points ensemble.
**Écran de l'atelier : Paramètres.**

### La notion

Un écran a cinq états : plein, vide, en chargement, en erreur, désactivé. On en dessine un
et on subit les quatre autres. Or **l'état vide est le premier que voit un nouveau cabinet**,
c'est-à-dire exactement la personne qu'il faut convaincre.

Sur la vitesse, trois seuils, stables depuis quarante ans et repris dans le standard 🟢 :

| Seuil | Ce qui se passe dans la tête | Ce qu'il faut faire |
|---|---|---|
| **100 ms** | L'action semble instantanée, causée par soi | Rien, c'est gagné |
| **1 s** | Le fil de la pensée tient, mais on sent la machine | Aucun indicateur, le délai suffit |
| **10 s** | L'attention part ailleurs | Il fallait un état intermédiaire bien avant |

Ces seuils viennent de Miller (1968) et Card et coll. (1991), popularisés par Nielsen
(*Usability Engineering*, 1993). L'équivalent moderne mesurable côté web est l'INP, avec un
objectif de **200 ms** pour la réponse à une interaction 🟢.

Le point contre-intuitif : **un indicateur de chargement affiché trop tôt ralentit la
perception.** Sous 300 ms, ne rien montrer paraît plus rapide que montrer un tourniquet qui
apparaît et disparaît.

### Le cas interne · vos fichiers `loading.tsx`

Vous avez des états de chargement dédiés sur comptes, gestion, journal, outils, paramètres,
rapports et temps. Ils existent, ce qui vous met déjà devant la plupart des produits. La
question de l'atelier n'est donc pas « faut-il en ajouter », mais : **est-ce qu'ils ont la
forme de l'écran qu'ils annoncent ?** Un squelette qui reproduit la structure réelle rend
l'attente plus courte qu'un tourniquet centré, parce que l'œil commence à s'organiser avant
que la donnée arrive.

### L'atelier

Sur l'écran du jour, produire les cinq états à la main et les regarder :

- vide, avec la phrase qui dit quoi faire, pas « aucune donnée » ;
- chargement, avec un squelette qui a la forme du contenu ;
- erreur, avec une phrase qui dit quoi faire ensuite, jamais un code ;
- désactivé, avec la raison lisible à côté (PS-023) ;
- plein.

Puis mesurer : onglet Réseau, ralentissement à 3G lente, et noter le temps du premier rendu
utile.

### Critère de réussite

Les cinq états existent et sont vus. Premier rendu utile sous 1 s en conditions normales.

### Le piège

Écrire l'état vide comme un message d'erreur. « Aucun dossier » est un constat. « Créez
votre premier dossier pour commencer à saisir du temps » est un écran.

---

## Semaine 7 · Les formulaires, l'écran le plus fréquenté et le moins soigné

**Critère 11 de la grille.**
**Écran de l'atelier : formulaire d'événement et cartographie de colonnes à l'import.**

### La notion

Quatre règles, dans l'ordre d'effet.

**Le libellé se place au-dessus du champ**, pas à gauche, pas à l'intérieur. Les travaux
d'oculométrie de Penzo (2006) sur le placement des libellés montrent que le libellé au-dessus
produit les temps de remplissage les plus courts 🟡. Le libellé placé à l'intérieur du champ
disparaît à la saisie, ce qui oblige à se souvenir de ce qu'on est en train de remplir.

**La validation se fait en ligne, après le champ**, pas au moment de l'envoi. Une erreur
annoncée après vingt champs oblige à retrouver lequel.

**On ne perd jamais une saisie.** Une erreur serveur qui vide le formulaire est la faute la
plus coûteuse en confiance de toute l'interface.

**Un champ par ligne pour les montants et les dates.** Ce sont les champs où l'erreur coûte
le plus cher, et deux champs côte à côte se remplissent de travers.

### Le cas interne · la cartographie de colonnes à l'import

`ColumnMappingForm` est le formulaire le plus difficile du produit : il demande à quelqu'un
de faire correspondre les colonnes d'un fichier inconnu à des champs comptables. C'est le
moment où un cabinet décide s'il vous confie son historique, c'est-à-dire le moment le plus
décisif de toute la mise en route.

Question de l'atelier, une seule : **est-ce qu'on peut se tromper sans conséquence ?** Un
formulaire dangereux se répare par la réversibilité, pas par des avertissements.

### L'atelier

Remplir le formulaire du jour **avec de mauvaises données volontaires** : un montant avec
une virgule et un point, une date au format américain, un champ obligatoire vide, un fichier
d'import à colonnes décalées. Noter chaque endroit où l'interface accuse plutôt qu'aide.

### Critère de réussite

Aucune saisie perdue, aucune erreur formulée sans dire quoi faire ensuite.

### Le piège

Ajouter des astérisques rouges partout. Si presque tous les champs sont obligatoires,
marquez plutôt les facultatifs. C'est moins de bruit pour la même information.

---

## Semaine 8 · Comment un système de design meurt, et comment on l'empêche

**Critère 15 de la grille. Cette semaine ne corrige pas un écran, elle protège les sept
autres.**

### La notion

Un système de design ne meurt jamais d'un mauvais choix initial. Il meurt de **dérive** :
un composant à usage unique créé un vendredi soir, une valeur recopiée « juste pour cette
fois », une seconde définition d'une même liste.

Trois mécanismes de défense, par ordre d'efficacité croissante :

1. **La documentation.** Efficacité faible. Personne ne relit un document de 600 lignes
   avant d'écrire une classe CSS.
2. **La revue.** Efficacité moyenne, et nulle quand vous êtes seul.
3. **Le test qui échoue.** Efficacité totale. Une règle qui casse la suite de tests est la
   seule qui survit à un vendredi soir.

C'est la raison pour laquelle le standard exige un seuil mesurable pour chaque règle : une
règle sans seuil ne peut pas devenir un test, donc elle ne tiendra pas.

### Le cas interne · le test de parité des navigations

Le 5 août, vous découvrez que le menu du bureau et le tiroir mobile sont définis dans deux
fichiers, qu'ils ont divergé sur quatre destinations, et que la section Conformité était
donc **inatteignable depuis un ordinateur**. La fonction existait, elle était testée, elle
marchait, et personne ne pouvait y arriver.

La réponse retenue est exemplaire, et pour trois raisons.

Elle est **grossière et assumée** : le test lit le code source au lieu d'importer les
modules. Il ne vérifie pas un comportement, il vérifie qu'une même liste n'a pas été écrite
deux fois de deux façons.

Elle est **datée d'avance** : il est écrit dans le fichier que le jour où les deux
navigations partageront une source unique, ce test devient inutile et doit disparaître. Un
garde-fou qui porte sa propre date de péremption ne devient jamais de la dette.

Elle **nomme la classe de problème** plutôt que le cas : une vérité écrite deux fois finit
par diverger. Vous avez rencontré cette classe trois fois en une semaine, sous trois
visages, le seuil recopié, la grille de droits recopiée, le menu recopié.

### L'atelier

Trois choses, dans cet ordre.

1. **Relire les huit journaux d'atelier** et lister les défauts trouvés qui n'ont pas
   d'identifiant PS.
2. **Écrire la règle manquante** pour chacun : identifiant, seuil mesurable, méthode de
   vérification, gravité. Une règle sans seuil ne rentre pas dans le standard.
3. **Automatiser celles qui peuvent l'être**, en test ou en grep, dans le script d'audit du
   §6 du standard.

### Critère de réussite

Le standard contient au moins trois règles nouvelles issues de défauts réellement
rencontrés, et au moins une est vérifiée par un test qui échoue.

### Le piège

Écrire des règles à partir de ce qu'on a lu ailleurs. Une règle qui ne vient pas d'un défaut
observé chez vous n'a personne pour la défendre, et elle sera la première contournée.

---

## Annexe A · Le journal d'atelier

Une entrée par vendredi, dans `docs/journal/`, quatre lignes.

```
Écran : ______________________
Score avant : ___ / 100      Score après : ___ / 100
Le défaut le plus coûteux trouvé aujourd'hui : ______________________
Règle nouvelle proposée (ID, seuil) : ______________________
```

Après huit semaines, ce journal donne deux choses : une courbe de score qui prouve que le
produit s'améliore, et une liste de défauts récurrents qui dit où le système est faible. Les
deux sont publiables.

---

## Annexe B · Le calendrier des écrans

L'ordre suit la valeur commerciale : ce qu'un prospect voit en démo passe en premier.

| Semaine | Notion | Écran de l'atelier | Pourquoi celui-là |
|---|---|---|---|
| 1 | Le jeton | Facturation, liste | Le plus montré en démo |
| 2 | Le chiffre | Comptes, rapprochement | Le plus lourd en points, et le sujet du fidéicommis |
| 3 | Une intention | Conformité, tableau de bord | Écran neuf, défaut déjà identifié |
| 4 | La densité | Rapports | L'écran qui invite le plus à l'entassement |
| 5 | La couleur | Employés, accès et rôles | Statuts partout, et corrigé récemment sur le fond |
| 6 | Les états et la vitesse | Paramètres | Le plus riche en états vides |
| 7 | Les formulaires | Événement et import | Le moment décisif de la mise en route |
| 8 | La gouvernance | Aucun, on protège les sept | |

---

## Annexe C · Sources externes citées

| Source | Nature | Niveau |
|---|---|---|
| Lindgaard, Fernandes, Dudek, Brown (2006), jugement en 50 ms | Étude publiée, répliquée | 🟢 |
| Tuch et coll. (2012), complexité visuelle en 17 ms | Étude publiée | 🟢 |
| Miller (1968), Card et coll. (1991), Nielsen (1993), seuils 0,1 / 1 / 10 s | Corpus établi | 🟢 |
| WCAG 2.2, contrastes AA 4,5:1 et 3:1 | Norme | 🟢 |
| Core Web Vitals, INP < 200 ms | Standard industriel documenté | 🟢 |
| Prévalence de la déficience rouge-vert, ~8 % chez les hommes | Épidémiologie établie | 🟢 |
| Penzo (2006), placement des libellés de formulaire | Étude d'oculométrie unique | 🟡 |
| Jetons de design, Salesforce Lightning (2014), Material 3 | Standard industriel documenté | 🟡 |
| Convergence des interfaces financières sur l'alignement à droite | Observation convergente | 🟠 |

Toutes les preuves du §1 du standard restent la référence première. Ce tableau ne fait
qu'ajouter ce que le programme convoque en plus.
