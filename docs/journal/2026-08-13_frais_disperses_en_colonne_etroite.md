# Les frais dispersés s'emboîtaient sur téléphone

> 13 août 2026. Signalé par le CEO sur `/tarification`, scène « Ce que vous ne
> verrez pas ici » : « les différents éléments s'emboîtent, ils ne sont pas
> tous correctement lisibles ».

## Ce qui se passait, mesuré

Les cinq pastilles de frais sont posées en pourcentages (`left: 58%`,
`top: 4%`…) dans une scène de hauteur fixe. Sur un écran large, la dispersion
dit ce qu'elle veut dire : des frais partout. En colonne étroite, elle ne dit
plus rien.

À **375 px**, avant correction :

| Contrôle | Résultat |
|---|---|
| Paires de pastilles qui se recouvrent | **3** |
| Pastilles passées à la ligne | **2** (112 px et 108 px de haut, contre 70) |
| Débordement hors écran | aucun |

Le chevauchement se lit comme un défaut, jamais comme une intention. Et une
pastille sur deux lignes reçoit une barre de rature qui n'en traverse qu'une.

## Ce qui a été fait

### Empilement en dessous, dispersion au-dessus

Sous le point de bascule, les cinq frais forment une colonne : une pastille par
ligne, centrée, sans rotation, 12 px d'écart.

La chorégraphie ne change pas. Les frais se posent un à un, se rayent un à un,
puis s'effacent, et le prix clair arrive. C'est la même démonstration, lue de
haut en bas au lieu d'être lue en désordre. Le CEO demandait précisément
qu'elle se laisse lire « au fur et à mesure que le scroll continue ».

Les pastilles gardent leur place dans le flux même à opacité nulle : la colonne
ne se réorganise donc jamais en cours de scène, et la carte de prix, posée en
absolu au centre de la pile, ne bouge pas d'un pixel.

### La bascule est à 768, pas à 640

Premier réglage à `sm` (640 px). Mesure : deux pastilles passaient encore sur
**trois** lignes à cette largeur, la dispersion revenant avec sa typographie de
17 px avant que la place suive.

Bascule remontée à `md` (768 px), et `md:whitespace-nowrap` interdit la coupure
une fois la dispersion active. Un frais se lit d'un trait ou pas du tout.

### Position et rotation en variables CSS

Un style en ligne ne répond pas à une requête de média. `left`, `top` et
`rotate` passent donc par `--fx`, `--fy`, `--fr`, et ne sont consommés qu'à
partir de `md`. La rotation reste sur la propriété `rotate`, séparée de
`transform`, que le scrub écrase à chaque image.

## Vérification

Cinq largeurs, chacune au tiers de la scène, là où les cinq pastilles sont
posées.

| Largeur | Mode | Chevauchements | Multi-lignes | Hors écran | Défilement horizontal |
|---|---|---:|---:|---:|---|
| 320 | empilement | 0 | 0 | 0 | non |
| 375 | empilement | 0 | 0 | 0 | non |
| 767 | empilement | 0 | 0 | 0 | non |
| 768 | dispersion | 0 | 0 | 0 | non |
| 1280 | dispersion | 0 | 0 | 0 | non |

À 1280, les cinq rotations d'origine sont intactes (−6°, 5°, 4°, −4°, 7°) :
l'écran large ne perd rien.
