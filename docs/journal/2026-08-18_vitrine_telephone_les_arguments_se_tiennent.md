# Au téléphone, les arguments se tiennent enfin

> 18 août 2026. Demande du CEO : « la version téléphonique de SAFE n'est
> vraiment pas optimisée, la présentation des arguments est vraiment moche. »
> Suite de [2026-08-14_vitrine_une_colonne_une_echelle.md](2026-08-14_vitrine_une_colonne_une_echelle.md).

## Mesuré avant et après, à 375 px

| | Avant | Après |
|---|---:|---:|
| Blocs éditoriaux sous 300 px de large | 6 | **0** |
| Plus étroit d'entre eux | 169 px | **335 px** |
| Écart entre deux liens du pied de page | 18 à 41 px | **18 px** |
| Bloc de clôture avant les tarifs | invisible | **visible** |
| Mots coupés à 320 px | 1 | **0** |
| Débordement horizontal, de 320 à 430 px | 0 | 0 |

`tsc` propre, 1536 tests au vert.

## Ce que le téléphone faisait des points numérotés

Le chapitre « Simple » posait ses trois points ainsi : un numéro vert de 11 px,
une phrase en serif de 17 px, 9 px de dégagement, rien entre les deux.

Au large, ce n'est pas la mise en forme qui tient ces trois points ensemble.
C'est la colonne qu'ils partagent, l'écran de démonstration qui leur fait
face, et le défilement piloté qui met le point en cours en encre pleine
pendant que les autres reculent. Trois dispositifs, et aucun ne survit sur
335 px : le défilement piloté est coupé au téléphone, donc les trois points
sont « en cours » en même temps ; la démonstration passe dessous au lieu
d'être en face ; et le numéro, seul repère restant, est un détail deux fois
plus petit que le texte qu'il annonce.

Il restait trois phrases de même poids séparées par du vide. C'est ce vide qui
se lit comme un brouillon.

**Le filet remplace le vide.** Ce n'est pas une invention pour l'occasion : la
page s'en sert déjà pour les forfaits et pour les questions. Les points des
trois piliers prennent la même grammaire, le dernier filet ferme la liste et
la détache de la phrase de chute, qui conclut le chapitre sans en faire
partie. Le dégagement passe de 9 à 14 px, l'interligne de 1,24 à 1,36 : au
large un point tient sur une ligne, sur 335 px les trois points de « Fiable »
passent à deux, et le serrage d'origine en faisait un pavé.

## La mesure, ou la moitié d'écran perdue

Sept blocs portaient un plafond en `ch` calculé pour le large et jamais relevé
dans le bloc téléphone. Sur une colonne de 335 px :

| Bloc | Plafond | Largeur réelle |
|---|---|---:|
| `.pr-main` « Bâtissez votre succès professionnel » | 16ch | 169 px |
| `#questions h2` | 16ch | 169 px |
| `#cta h2` | 18ch | 190 px |
| `.co-fin` | 34ch | 227 px |
| `.co-comptable` | 42ch | 227 px |
| `.sy-claim` | 36ch | 240 px |
| `.pr-suite` | 26ch | 275 px |

« Des réponses précises aux questions importantes » tombait sur trois lignes
dans 169 px, avec la moitié de l'écran vide à sa droite.

Un plafond en `ch` protège d'une ligne trop longue. Sur un téléphone, la
largeur de l'écran est déjà ce plafond : 335 px donnent au plus 40 caractères,
très en deçà des 65 de PS-008. Il ne protège de rien, il ne fait que rogner.

## Le bloc de clôture n'existait plus

`#zone-synthese` porte la phrase qui referme la démonstration et les deux
actions qui précèdent les tarifs. Il ne s'affichait nulle part, ni au
téléphone ni au large, et la page passait de « Complet » aux tarifs par
307 px de blanc.

Cause : `drawSynthese` posait l'opacité de `.sy-end`, la scène a quitté la
boucle de défilement le 14 août, `drawSynthese` est parti avec elle, et la
règle `.xc.anime .sy-end { opacity: 0 }` est restée seule. Une déclaration
d'état initial sans le script qui la lève.

C'est le correctif le plus rentable des cinq : deux appels à l'action rendus
à une page qui n'en montrait aucun entre la fin du récit et le prix.

## Trois réglages plus petits

- **Le prix des forfaits** se centrait sur un bloc de deux lignes et venait se
  poser entre « Solo » et sa description : il ne chiffrait visuellement ni
  l'un ni l'autre. Aligné sur la ligne de base du nom, il chiffre le nom.
- **Le pied de page** répartissait quatre groupes en `space-between`. Passés à
  la ligne, ils gardaient cette répartition. Les groupes s'empilent. Il gardait
  aussi la gouttière du large, 22,5 px contre les 20 px de la page : deux
  virgules cinq qui ne se voient pas mais se sentent.
- **« FAQ »** mesure 21 px dans une cible tactile de 44 px minimum
  (`globals.css`). Les 23 px restants tombaient tous à sa droite et creusaient
  un trou de 41 px au milieu de la rangée. Le lien garde sa cible, le mot se
  centre dedans.
- **À 320 px**, « ENCAISSEMENTS » demandait 108 px dans une tuile qui en offre
  95, et son S final passait seul à la ligne. Le corps ne bouge pas, 11 px est
  le plancher de l'échelle : c'est l'interlettrage qui cède, plus trois pixels
  repris sur le retrait de la tuile.

## Vérifié

375, 430 et 320 px, plus 1280 pour la règle `.sy-end` qui touche les deux.
Aucun débordement horizontal, aucun bloc éditorial sous 300 px.

## Constaté au passage, pas corrigé

La vitrine affiche **99 $ et 149 $**. La décision CEO du 27 juillet 2026 fixe
l'offre fondatrice à 50 $ / 75 $ pendant douze mois puis 79 $ / 119 $ gelés.
Les deux peuvent coexister volontairement, prix affiché contre prix fondateur,
mais l'écart n'est écrit nulle part. À trancher.
