# La landing montrait tout, sans jamais rien proposer

> 13 août 2026. Audit de la page d'accueil (`components/public-site/ExperienceCinema.tsx`)
> conduit avec le prompt « Reconstruire le design system et l'interaction system »
> fourni par le CEO. Le prompt vise l'intérieur de l'application ; ses principes
> transposables à une vitrine ont été appliqués : hiérarchie de l'action,
> cohérence du vocabulaire, affordance, coût d'interaction, performance perçue,
> accessibilité.

## Ce qui se passait, mesuré

La page est déjà tenue : palette jetonnée, scènes construites sur des données
réelles du Cabinet Demo, commentaires qui justifient chaque décision. Les
défauts trouvés ne sont pas des défauts de goût, ce sont des défauts de
système.

| Constat | Mesure | Règle enfreinte |
|---|---|---|
| Le premier écran ne portait aucune action | 0 bouton dans le hero, l'unique appel vivait dans la barre de navigation | DIRECTION_LANDING §4 et §6.01, DESIGN_HUMAIN M2 |
| Au téléphone, la barre range son action dans le menu | `#nav .cta { display: none }` sous 860 px, donc **aucune** action visible avant le troisième écran | MB3 |
| Cinq libellés pour trois destinations | « Faire le diagnostic », « Diagnostic », « Demander un audit gratuit », « Découvrir SAFE », « Réserver une rencontre » | cohérence du système d'actions |
| Hiérarchie inversée à la synthèse | le bouton **plein** menait à `/fonctionnalites`, le diagnostic était relégué en fantôme | une page, une action dominante |
| Le bouton second n'avait aucun signifiant | ni fond, ni bord, ni ombre : seule sa position disait qu'on pouvait cliquer | DESIGN_HUMAIN P6 |
| Le rail de chapitres était inerte | `aria-hidden`, `pointer-events: none` : il dit où l'on est sans permettre d'y aller, sur 15 000 px | coût d'interaction |
| La boucle d'animation ne s'arrêtait jamais | 6 mesures de position par image, pour toute la visite, y compris là où plus rien n'est animé | DESIGN_HUMAIN M7 |
| **Sans mouvement, le titre disparaissait** | `prefers-reduced-motion` fige chaque scène à son état final ; l'état final du hero est celui où le titre a fini de s'estomper | WCAG, MB2 |

Le dernier point est le plus lourd. Une personne qui a coché « réduire les
animations » arrivait sur une page dont le titre, la promesse et l'action
étaient à opacité zéro. Le commentaire du fichier promettait l'inverse :
« une animation révèle un contenu qui serait là de toute façon ». Le code ne
tenait cette promesse que pour l'absence de script, pas pour l'absence de
mouvement.

## Ce qui a été fait

### L'action entre dans le premier écran

Sous le chapeau : « Faire le diagnostic » vers `/audit-gratuit`, un lien second
vers les fonctionnalités, et une ligne de réassurance reprise mot pour mot de
la page de destination (gratuit, sans carte de crédit, rapport sous 24 h).
Aucune affirmation nouvelle.

`#hero-copy` reste neutralisé pour ne pas avaler les clics destinés à
l'application ; seul le bloc d'action redevient saisissable, et le script le
retire du test de collision dès que le titre s'estompe.

### Un seul nom par action

Toutes les actions pleines de la page portent maintenant le même libellé et
mènent au même endroit. La synthèse a retrouvé le bon ordre : le diagnostic
devient l'action pleine, les fonctionnalités passent en second.

| Emplacement | Action pleine | Action seconde |
|---|---|---|
| Barre de navigation | Faire le diagnostic | Connexion |
| Premier écran | Faire le diagnostic | Voir ce que fait SAFE |
| Synthèse | Faire le diagnostic | Voir ce que fait SAFE |
| Appel final | Faire le diagnostic | Réserver une rencontre |

Le bouton second reçoit un filet : il se voit sans peser autant que l'action
principale.

### Le rail devient une navigation

Quatre ancres natives vers les chapitres, donc opérantes sans script et au
clavier. Cible de 30 px de haut, nom du jalon révélé au survol et au focus,
`aria-current` sur le chapitre courant, et `visibility: hidden` quand le rail
s'efface : un lien qu'on ne voit pas ne reçoit pas le focus.

### La boucle dort quand rien ne bouge

Les scènes hors de vue rejoignent leur état sans lissage, ce qui permet
d'endormir la boucle sans jamais figer une scène à mi-course. Elle se réveille
au défilement. Vérifié : tout en bas de page, la boucle ne tourne plus ; en
remontant dans un chapitre, elle repart.

### Le hero se lit quand rien ne bouge

Sans mouvement, plus aucune boucle : chaque chapitre est posé une fois à son
état final, et le hero reçoit une mise en page propre. L'assemblage disparaît,
le titre reste en place, l'application se pose dessous à une échelle qui la
garde lisible, la zone grandit pour les contenir tous les deux. Un recalcul au
chargement des polices et au redimensionnement.

Vérifié dans ce mode : titre, chapeau et action à pleine opacité, application
entière dans sa zone, légende sous l'application, et les cinq autres chapitres
lisibles.

## Second lot, même jour : la narration des piliers

> Retour du CEO sur les chapitres, capture à l'appui. Six demandes, toutes
> appliquées.

| Demande | Ce qui a été fait |
|---|---|
| « je n'ai pas besoin du texte qui vient après » | Le chapeau sous la promesse est supprimé. La phrase se suffit. |
| « une police plus petite » pour la seconde ligne | Elle passe de la taille de la première à un peu plus de la moitié. La promesse se lit en deux temps au lieu de deux blocs de même poids. |
| « je n'aime pas les tirets » | Les traits devant chaque argument sont retirés. Un chevron porte l'ouverture, rien d'autre. |
| « je n'aime pas l'illustration » | La carte de factures et son cadre quittent le chapitre « Simple ». Le propos occupe une colonne unique de 760 px, alignée à gauche. |
| « l'apparition du Simple au milieu du texte n'est pas beau » | Le marqueur n'est plus un mot géant qui traverse l'écran et s'efface. Il ouvre le chapitre au-dessus du titre, et il reste. Il n'arrive jamais depuis zéro : arriver par le rail ne doit pas donner un chapitre sans nom. |
| « menu déroulant, animation de zoom, rien qui disparaisse ni ne soit barré » | Chaque argument devient une surface qu'on ouvre et referme, avec le zoom souple du produit (échelle 1,006 et élévation). Le défilement continue de les ouvrir un à un, jusqu'au premier clic : à partir de là, le lecteur décide. |

### Deux corrections trouvées en chemin

**Le zoom au survol ne pouvait pas fonctionner.** Le script posait une
transformée en ligne sur chaque argument à chaque image, et un style en ligne
gagne sur toute règle CSS. L'arrivée passe maintenant par une classe, la
cascade fait le reste.

**La boucle d'animation pouvait mourir au milieu de la page.** La mise en veille
livrée au premier lot s'endormait dès la première image sans scène proche. Or
l'événement de défilement et l'image suivante tombent dans le même tour de
boucle : une demande de réveil pouvait arriver juste avant l'image qui décidait
de dormir, et se perdre. Mesuré en direct : après un saut par le rail, les
arguments ne s'ouvraient plus. La veille exige maintenant une dizaine d'images
consécutives sans scène proche, et tout défilement remet le compteur à zéro.

### Mesures

| Contrôle | Avant | Après |
|---|---|---|
| Hauteur de la page (écran de 800) | 15 282 px | 11 460 px |
| Course du chapitre « Simple » | 280 vh | 190 vh |
| Course de la promesse | 140 vh | 120 vh |
| Tirets devant les arguments | 6 | 0 |

Vérifié en direct : fermer un argument à la main le garde fermé au défilement
suivant, en rouvrir un autre fonctionne, la boucle dort toujours en bas de page
et repart au retour dans un chapitre.

## Troisième lot : l'émulateur du cabinet

> Idée du CEO, même jour. Le chapitre « Simple » ne doit pas seulement affirmer
> la simplicité, il doit la montrer dans le logiciel.

La carte de factures retirée quelques heures plus tôt est remplacée par une
**fenêtre de SAFE qui reste en place et change d'écran** selon l'argument en
cours. Trois arguments, trois écrans du Cabinet Demo.

| Argument | Écran | Bandeau |
|---|---|---|
| Vos chiffres, en langage clair | Lecture rapide : les quatre tuiles, Facturé 87 115,20 $, Encaissé 49 055,00 $, Reste à recevoir 38 060,20 $ en ambre, Fidéicommis 0,00 $ | Tableau de bord |
| Une prochaine action claire | À traiter maintenant : dix-sept factures, onze en retard, puis « Ensuite » avec le rapprochement et la relance Pelletier | Tableau de bord |
| Saisi une fois. Utilisé partout | Une consultation de 1 h 30 à sa source, puis la ligne qu'elle produit sur la facture 2026-031 | Temps |

Le troisième écran porte **675,00 $**, pas 450 $ : la chaîne du chapitre
« Complet » facture déjà cette consultation 1 h 30 à 450 $ l'heure. Deux
montants différents pour la même heure sur la même page se remarquent.

### Ce que cela change dans le comportement

L'ouverture des arguments devient **exclusive** dans « Simple », alors qu'elle
était cumulative. C'est mécanique : deux arguments ouverts voudraient dire deux
écrans à la fois. Les trois titres restent visibles, seule la justification se
replie. Le même geste est appliqué à « Fiable » pour que l'accordéon se
comporte pareil d'un chapitre à l'autre.

Le défilement fait défiler les écrans jusqu'au premier clic. Ensuite, les trois
arguments sont la navigation de la démonstration.

### Un piège de vérification à retenir

`window.scrollTo()` exécuté depuis l'outil d'inspection **ne déclenche aucun
événement de défilement** dans la page : compteur à zéro sur une remontée de
9 000 px. La boucle mise en veille ne se réveillait donc jamais pendant les
tests, ce qui donnait l'illusion que les écrans ne changeaient pas. Vérifié
ensuite à la molette : le passage d'un écran à l'autre fonctionne. **Toute
vérification de défilement sur cette page doit passer par un vrai geste, jamais
par `scrollTo`.**

## Quatrième lot : « Fiable » devient une section éditoriale

> Spécification détaillée du CEO, même jour. Le chapitre est refondu en
> narration séquentielle sur fond blanc, sans une seule carte.

La section raconte en quatre temps sur une course de 400 vh : trois moments,
puis la synthèse qui les rassemble. La colonne de gauche porte le récit, celle
de droite un écran de SAFE qui change avec lui.

| Temps | Ce qui se lit | Ce que montre l'écran |
|---|---|---|
| 1 | Vos chiffres restent cohérents. **Partout où vous les consultez.** | Les trois sources se posent l'une après l'autre, toutes à 21 000,00 $ |
| 2 | Chaque correction laisse une trace. **Rien d'important ne disparaît.** | Chronologie de deux entrées datées : l'écart constaté, puis la correction du 14 juin à 09 h 41 |
| 3 | Les incohérences sont détectées. **Avant qu'elles deviennent un problème.** | Un retrait de 1 200,00 $ sur un dossier qui n'en détient que 850,00 $, refusé |
| 4 | Les trois rangés, sans titre de synthèse | Retour à la concordance, certification possible |

### Les arguments changent de rang au lieu de se remplacer

Première version : chaque moment apparaissait en grand, disparaissait, puis les
trois étaient rappelés d'un coup en synthèse. On relisait au lieu de se
souvenir, et le rappel semblait sorti de nulle part.

Version retenue : **un seul jeu de trois arguments qui changent de taille.**
Le courant est en grand, ceux qui l'ont précédé sont rangés au-dessus avec leur
numéro, ceux qui viennent ne prennent pas encore de place. À la fin, les trois
sont là, empilés dans l'ordre où on les a lus. La synthèse n'est plus un bloc
séparé : c'est l'état final des arguments eux-mêmes.

Mesuré au défilement, sur un écran de 860 px :

| Position | 01 | 02 | 03 |
|---|---|---|---|
| 8 % | **grand**, 122 px | absent | absent |
| 36 % | rangé, 63 px | **grand**, 122 px | absent |
| 62 % | rangé | rangé | **grand**, 154 px |
| 92 % | rangé | rangé | rangé |

La réduction agit sur la taille du texte (28,8 px → 13,5 px), jamais sur une
échelle : une mise à l'échelle rendrait la lettre molle pendant toute la
course. La ligne « Ce que SAFE protège, chaque jour. » a été retirée, et
l'espace entre le titre du chapitre et le premier point a été resserré : la
pile démarre maintenant juste sous le titre au lieu d'être centrée dans le
vide.

Sur iPhone SE (375 × 667), au moment le plus chargé (deux rangés, un en grand,
plus l'écran de démonstration), tout tient : le bas de l'écran s'arrête à
623 px, le nom du chapitre reste sous la barre de navigation, aucun
débordement horizontal.

La seconde phrase de chaque moment porte l'accent typographique : c'est elle
qui dit le bénéfice.

### Le refus n'est pas une invention de vitrine

Le message affiché est celui du produit, mot pour mot depuis
`lib/services/fideicommis/errors.ts` : « Solde en fidéicommis insuffisant pour
ce dossier. Un retrait ne peut jamais dépasser le solde détenu pour ce
dossier. » Le moteur applique bien des blocages durs côté fidéicommis (solde
négatif, transfert sans facture, cross-client), ce qui autorise la promesse.

### Contraintes tenues

- **Aucune carte, aucun cadre, aucun filet** dans la narration. Le seul trait
  de la section relie les deux entrées de la chronologie, et il porte la
  continuité au lieu de décorer.
- **Une seule surface** : l'écran de démonstration, posé sur le canevas avec
  une ombre diffuse et sans bordure. Le contraste tonal remplace le cadre.
- **Le vert n'apparaît que** sur les numéros de la synthèse, le point de la
  correction et la phrase de concordance.
- **Aucun décalage de mise en page.** La colonne de récit réserve 336 px, la
  zone d'écran 236 px. Mesuré : la synthèse occupe 289 px, la plus haute vue
  174 px. Rien ne déborde, donc rien ne saute d'un temps à l'autre.

### Mesures d'accessibilité

Contrastes calculés sur les fonds réels. Deux échecs trouvés et corrigés : le
libellé d'écran et l'heure de la chronologie étaient à **3,03** en teinte
atténuée, sous le seuil AA pour du petit texte. Passés à l'encre secondaire,
ils sont à **4,78**. Le reste de la section va de 4,78 à 17,4.

Sans mouvement, les quatre temps retombent en flux et se lisent à la suite :
vérifié, les trois moments, les quatre vues et les trois entrées de la synthèse
sont tous à pleine opacité. Sans script, même chose, la section n'a jamais
dépendu du JavaScript pour exister.

À 320 px : une colonne, le moment en cours puis l'écran qui le prouve juste en
dessous. Aucun débordement horizontal, rien de coupé sous la barre de
navigation.

## Cinquième lot : « Complet » raconte le parcours d'un dossier

> Spécification du CEO. Le mot « Complet » cesse d'être un qualificatif : il
> désigne la couverture du parcours, de l'ouverture jusqu'aux rapports.

Même grammaire que « Fiable », deux différences voulues. La démonstration passe
à gauche, parce qu'on suit un dossier et qu'on le regarde avancer avant de lire
ce qu'on en conclut. Et le texte du point n'est pas celui du message : le bloc
porte les deux et bascule de l'un à l'autre pendant qu'il rétrécit, ancré au
même coin.

| Temps | Message en grand | Ce que montre l'écran | Devient |
|---|---|---|---|
| 1 | Le bon cadre, dès l'ouverture. | Le cartable monté seul, puis le domaine bascule et les sections changent avec lui | 01 Une ouverture adaptée |
| 2 | Le dossier avance. Chaque opération suit. | Échéance, temps, document, débours, facture, chacun avec son montant | 02 Un parcours relié |
| 3 | Le dossier se termine. Le cabinet reste à jour. | Facture, paiement, débours réglés, écriture, revenus et taxes | 03 Une vision complète |

### Le cartable n'est pas un décor

Les sections affichées viennent de `lib/dossiers/cartable-templates` : ce sont
celles que le produit monte réellement à l'ouverture, avec leurs sources.
En droit de la famille, Pièces Madame (P-) et Pièces Monsieur (D-) sous
Règl. Cour Qc art. 13. La bascule vers le litige civil remplace ces sections
par la phase préjudiciaire et les pièces demanderesse et défenderesse. Le
mandat, lui, ne bouge pas : il est commun aux deux. C'est ce qui prouve
l'adaptation au domaine plutôt qu'un simple changement d'étiquette.

### Ce qui a été retiré

Le jeton noir flottant qui portait le montant, et la ligne verticale du
parcours. Les montants vivent maintenant sur l'opération qui les produit :
675,00 $ sur le temps consigné, 195,00 $ sur le débours, 776,36 $ sur le
paiement reçu.

### Mesures

Séquence vérifiée au défilement : à 10 % le premier message est en grand seul ;
à 28 % le domaine a basculé ; à 50 % le premier est rangé et le deuxième en
grand ; à 80 % deux rangés et le troisième en grand ; à 96 % les trois rangés
et la conclusion affichée. Aucun récapitulatif ajouté.

Contrastes : un échec trouvé et corrigé. Le nom du domaine en vert de logo
tombait à **4,26** pour 19 px, sous le seuil AA. Passé au vert de validation,
il est à **5,88**. Le reste de la section va de 4,78 à 17,4. La confirmation de
fin porte une coche en plus de sa couleur.

### Le sticky abandonné au pouce, et pourquoi

Mesuré à 375 x 812 : le titre, l'introduction, les trois moments, leur
conclusion et un écran de parcours à cinq opérations demandent **926 px**. Les
faire tenir dans un écran voudrait dire couper des opérations ou rendre les
libellés illisibles. La spécification autorise à renoncer au sticky quand il
nuit à la lecture : le chapitre défile donc normalement au pouce, les trois
moments sont directement à leur forme finale et le parcours se lit en entier.
Vérifié à 320 px : rien ne déborde, tout est visible.

## Sixième lot : la synthèse referme le récit

La section « Conçu pour les petits cabinets » a été retirée. Elle s'intercalait
entre la dernière démonstration et la synthèse, et ajoutait un argument après
que la démonstration ait fini de parler. La synthèse conclut maintenant
directement.

Nouvelle grammaire de surfaces :

| Section | Fond |
|---|---|
| Fiable, Complet, Synthèse | blanc |
| Tarification | canevas |
| Questions | blanc |
| Appel final | canevas |

Le récit est blanc, l'offre revient au canevas : le changement de surface
marque le passage de l'un à l'autre. La synthèse descend d'un cran (lignes de
36 px au lieu de 44, chapeau de 16,5 au lieu de 18) : elle conclut, elle ne
rivalise plus avec les titres de chapitre.

**Point d'attention.** La page atteint **17 096 px** en écran de 860, contre
11 460 après le premier lot. Les courses des piliers 2 et 3 (400 vh et 420 vh)
portent l'essentiel de cette croissance. La direction landing fixe un repère à
10 000 px sans nécessité éditoriale. Les trois démonstrations en sont une, mais
l'écart mérite d'être arbitré.

## Septième lot : « Simple » adopte la progression cumulative

L'accordéon est retiré. Trois surfaces qu'on ouvrait et refermait : on revenait
en arrière pour relire, et un argument déjà lu pouvait se refermer sous les
yeux. Même mécanique que « Fiable » désormais, avec les écrans du cabinet qui
suivent l'argument en cours.

Mesuré au défilement, écran de 860 px :

| Position | 01 | 02 | 03 | Écran |
|---|---|---|---|---|
| 12 % | **grand**, 27,8 px | absent | absent | Lecture rapide |
| 42 % | rangé, 18 px | **grand** | absent | À traiter maintenant |
| 72 % | rangé | rangé | **grand** | Temps vers facture |
| 96 % | rangé | rangé | rangé | Temps (l'écran ne recule pas) |

L'écart entre le dernier point et « Moins de gestion. Plus de pratique. » passe
de 22 à **14 px** : la chute était détachée de ce qu'elle conclut.

La grammaire est dupliquée depuis « Fiable » plutôt que partagée. Les deux
chapitres n'ont ni les mêmes tailles ni les mêmes rythmes, et « Fiable » ne
doit pas bouger quand on règle « Simple ».

### Le coût de la progression cumulative sur mobile

Un argument en grand occupe **172 px** là où une fiche d'accordéon fermée en
prenait 60. La colonne de texte a donc doublé de hauteur. Mesuré à 375 x 812 :
la fenêtre du cabinet passait 35 px sous le pli au troisième argument, et
davantage sur un écran court.

« Simple » abandonne donc l'épinglage au pouce, comme « Complet » avant lui :
les trois arguments sont directement à leur forme finale et les trois écrans se
lisent à la suite. **Deux chapitres sur trois ne sont plus animés sur
téléphone.** Seul « Fiable » garde sa progression, parce que sa colonne de
droite est plus courte. C'est le prix de la mécanique cumulative sur une petite
hauteur, et cela mérite un arbitrage si le mobile devient prioritaire.

## Huitième lot : « Complet » repasse au gris

La page alterne maintenant franchement d'un chapitre à l'autre :

| Section | Fond |
|---|---|
| Simple | canevas |
| Fiable | blanc |
| **Complet** | **canevas** |
| Synthèse | blanc |
| Tarification | canevas |
| Questions | blanc |
| Appel final | canevas |

**La surface de démonstration a dû s'inverser avec elle.** L'écran de
« Complet » portait le canevas pour se détacher d'un fond blanc. Le fond
devenant lui-même le canevas, les deux avaient exactement la même teinte et la
fenêtre ne se distinguait plus que par son ombre. Elle passe donc au blanc :
sur le blanc de « Fiable » l'écran prend le canevas, sur le canevas de
« Complet » il prend le blanc. Contrastes revérifiés sur la nouvelle surface,
de 5,61 à 17,4.

## Ce qui n'a pas été touché, et pourquoi

- **La longueur de la page** (15 282 px en écran de 800). Les scènes épinglées
  consomment près de 12 000 px de course. C'est une décision éditoriale, pas un
  défaut : à trancher avec le CEO.
- **L'offre fondatrice n'apparaît nulle part.** La section prix montre 99 $ et
  149 $, cohérents avec `lib/tarification.ts` et `/tarification`. Les dix places
  à 50 $ et 75 $ ne sont pas mentionnées. C'est une décision d'offre.
- **Les deux boutons « Faire le diagnostic » visibles ensemble** dans le premier
  écran (barre et hero). C'est le motif courant du marché et la hiérarchie tient
  (36 px contre 44 px). Faire apparaître celui de la barre seulement après le
  hero est possible, au prix d'un mouvement de plus dans la barre.
