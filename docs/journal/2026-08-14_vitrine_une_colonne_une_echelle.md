# La vitrine reprend une colonne et une échelle

> 14 août 2026. Application des constats de
> [AUDIT_VITRINE_2026-08-13.md](../design/AUDIT_VITRINE_2026-08-13.md).
> Demande du CEO : « tu peux effectuer les corrections ? »

## Mesuré avant et après, à 1440 px

| | Avant | Après |
|---|---:|---:|
| Bords gauches des sections alignées à gauche | 84 · 140 · 170 | **140** |
| Tailles des titres de section | 56 · 46 · 44 · 42 · 40 · 36 | **56** |
| Rampes `font-size: clamp()` | 20 | **0 ad hoc, 5 jetons** |
| Largeurs de contenu (`max-width`) | 1240 · 1160 · 1100 | **`var(--page)`** |
| Textes sous 11 px | 65 | **1** (hors ce fichier) |
| Textes sous le seuil AA | 54 | **0** |
| Emplois du mono sur de la prose | 50 | **15**, tous des valeurs de colonne |
| Écrans de défilement | 20,8 | 19,6 |

Vérifié à 375, 1280 et 1440 px. Aucun défilement horizontal. `tsc` propre,
1459 tests au vert.

## D1 · Une seule colonne

Le retrait ne se pose plus, il se déduit :

```css
--page: 1160px;
--gouttiere: min(6vw, 84px);
padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
```

La boîte de contenu vaut désormais `--page` au plus, donc une grille de `--page`
la remplit exactement et ne peut plus se recentrer. C'était la cause exacte de
l'écart Simple/Fiable : `.fi-grid` centrait 1160 px dans 1272, soit 56 px de
décalage, quand `.ch-pin` posait son contenu à même le retrait.

Trois largeurs concurrentes (1240 pour le hero et la bande de preuves, 1160
pour les chapitres, 1100 pour les sections plates) deviennent une seule. Les
170 px de Tarifs et Questions venaient du 1100 centré dans 1160.

**Ce qui reste volontairement hors colonne** : « Bâtissez votre succès » et
l'appel final sont centrés, « Complet » est en miroir. Trois écarts décidés,
contre six subis.

## D2 · Une échelle, pas un continuum

L'échelle existait déjà, nommée et commentée, **mais seulement sous 860 px**.
Au large, ses 26 appels retombaient sur cinq littéraux écrits dans les valeurs
de repli : le système était déclaré et jamais appliqué.

Le même vocabulaire monte donc en desktop, plutôt que d'en inventer un second :

```css
--t-affiche:  clamp(44px, 7.4vw, 92px)   /* l'ouverture, une seule fois */
--t-marque:   clamp(34px, 4.4vw, 56px)   /* tout titre de section */
--t-titre:    clamp(26px, 3.1vw, 40px)   /* le sous-titre qui le développe */
--t-argument: clamp(19px, 1.75vw, 24px)  /* la phrase mise en avant */
--t-corps:    clamp(16px, 1.25vw, 18px)  /* la prose */
--t-detail:   14px
--t-menu:     11px                        /* le plancher */
```

Les vingt rampes ad hoc disparaissent. Les six déclarations du rôle « titre de
section » n'en font plus qu'une, donc `.ch-mark`, `#cta h2`, `#tarifs`,
`#questions`, `.story h2` et `.pr-main` ne peuvent plus diverger au milieu de
la plage.

Déclarer `--t-menu` a réglé le plancher d'un coup : les quatorze
`var(--t-menu, 8,5px)` résolvaient leur repli faute de jeton. Les replis morts
ont été retirés, ils faisaient croire à cinq tailles là où il n'y en a qu'une.

## D3 · Le mono revient à son rôle

Treize règles portant de la prose repassent en sans : `.kicker`, le rail,
`#hero-hint`, les exergues des maquettes, les fils d'Ariane (« Cabinet Demo »,
« Tableau de bord », « Sans ressaisie »).

L'interlettrage se resserre de 0,12-0,18em à **0,09em** : le sans est plus
large à corps égal, correction que le bloc mobile appliquait déjà.

Restent 15 emplois : des dates (`14 juin · 09 h 12`), des prix, des tranches
d'âge (`90 j et plus`) et de courtes valeurs de colonne (`Ce mois`, `Tenu`).
Ces dernières partagent une colonne avec des montants ; le mono y garde
l'alignement. **La charte est tenue : chiffres, références, dates.**

## D6 · Plus rien sous le seuil

- `--faint` (`#85888C`) donnait 3,56 sur blanc et 3,03 sur le canvas, sous les
  4,5 exigés. Ses huit règles passent à `--muted` (5,61 et 4,78).
- Le menu de la maquette annonce ce que fait SAFE. Un visiteur y lit un
  argument produit, pas un contrôle désactivé : `.inerte` quitte `--si-subtle`
  pour `--si-muted`. C'est le curseur, pas la pâleur, qui dit qu'on ne clique
  pas.
- Les numéros 01/02/03 en vert de marque tombaient à 4,26. Le vert de
  validation donne 6,90 et dit la même chose.
- La pastille « En retard » du hero était à 4,48, deux centièmes sous le
  seuil, avec un rouge écrit en dur. Elle prend `--si-danger-ink` : elle tient
  AA et rend enfin ce que le produit rend vraiment.
- « Gratuit, sans carte de crédit », la phrase censée lever la dernière
  objection et la moins lisible de la page, passe de 13 px `--faint` à
  `--t-detail` `--muted`.

## La triade n'est plus dite trois fois

`#zone-synthese` passait un écran et demi à récapituler « Simple à utiliser,
Fiable au quotidien, Complet pour évoluer », après onze écrans qui venaient de
le démontrer. Les trois lignes disparaissent, **la phrase de clôture et
l'action restent** : la scène quitte l'épinglage et devient une section plate
qui touche la tarification. `drawSynthese` et son entrée dans la boucle de
défilement disparaissent avec elle.

## Ce qui n'est pas fait, et pourquoi

**D5, la maquette montrée deux fois.** L'écran « Lecture rapide » du hero est
rejoué à l'identique comme première preuve du pilier « Simple ». Le supprimer
casserait la correspondance un argument / un écran ; le remplacer demande de
décider quoi montrer à la place. C'est une décision éditoriale, pas une
correction.

**D4, les seize écrans avant le prix.** Le retrait de la synthèse en enlève
un. Le reste dépend du choix entre la direction 2 (le registre plutôt que le
film, page ramenée à ~8 écrans) et la direction 3 (garder le film, discipliner
la scène). Les deux sont décrites dans l'audit.

**D7, les 498 valeurs hors du pas de 4.** L'essentiel vit dans les maquettes,
où un `padding: 7px` sert à faire tenir une interface miniature. Les forcer sur
le pas de 4 les déformerait pour un gain de rythme nul, ces blocs étant lus
comme une image. À reprendre si la direction 2 est retenue, puisqu'elle refait
les preuves.
