# 2026-07-26 — Landing : triangles du logo, rail de tirets, respiration de la scène tarification

## Demande CEO

Sur `localhost:3001`, page tarification :

1. Les « petites bulles » brassables au curseur doivent devenir **les triangles du logo SAFE**, un peu plus gros, même animation.
2. Garder les **indicateurs de défilement**.
3. Remettre sur cette page les **tirets d'état à droite** vus sur la page principale pendant le scroll.
4. **Ralentir et fluidifier** l'apparition et la disparition dans « Ce que vous ne verrez pas ici ».

## Ce qui a été fait

### 1. Galets → triangles du logo (`components/public-site/shared.tsx`)

`PaperDrift` dessinait des ellipses organiques. Il dessine maintenant le galet du mark
SAFE (`UPPER_PATH` de `components/branding/SafeLogo.tsx`) via `Path2D`, à l'échelle.

- Taille : 38 → 96 px de large (avant : ellipses de 27 → 73 px).
- Nombre : 14 → 11 pièces, les formes étant plus grosses.
- Un galet sur deux est retourné (`flip`) : on retrouve les deux moitiés convergentes du logo.
- Même physique qu'avant : dérive lente, répulsion au curseur (rayon 150 px), amortissement.
- Répartition revue : bande de droite + marge de gauche, jamais la colonne de texte, et
  hauteur répartie par index plutôt qu'au hasard (évite les paquets).

Le composant sert à toutes les pages publiques via `PageHeader` (fonctionnalités,
tarification, FAQ, démo) : le changement est cohérent partout.

### 2. Rail de tirets (`SceneRail`, nouveau, dans `shared.tsx`)

Un tiret par section, à droite, à mi-hauteur. Le tiret de la section en cours s'allonge
(12 → 26 px), passe au vert et se nomme. Transitions à 650 ms.

Branché sur la page tarification avec 5 arrêts : Un prix clair · Forfaits ·
Ce qui est compris · Cabinets fondateurs · Questions.

La page d'accueil (`ExperienceCinema`) avait des **points**. Ils deviennent des tirets
avec la même grammaire, et les transitions passent de 0,3 s à 0,65 s.

### 3. Indicateur de défilement (`ScrollHint`, nouveau)

« Faites défiler » en bas de la scène épinglée de la tarification, qui s'efface dès que
le défilement commence. Même typo mono que l'accueil.

### 4. Respiration de la scène « Ce que vous ne verrez pas ici »

| | Avant | Après |
|---|---|---|
| Hauteur de zone | 260 vh | 340 vh |
| Apparition d'un frais | fenêtre 0,10 | fenêtre 0,17 |
| Disparition d'un frais | fenêtre 0,16 | fenêtre 0,24 |
| Décalage entre frais | 0,04 / 0,06 | 0,035 / 0,055 |
| Courbe d'apparition | easeOutCubic | easeInOutQuad |
| Prix révélé | 0,58 → 0,80 | 0,76 → 0,94 |
| Légende | 0,84 → 0,95 | 0,93 → 1,00 |

Amortissement du scrub abaissé de 0,16 à 0,11 dans `useScrollScrub` : le suivi du
défilement est plus lent et plus soyeux sur toutes les scènes du site public.

## Vérification

- `tsc --noEmit` : propre. `next lint` sur les trois fichiers : propre.
- Vu à l'écran : les triangles du logo, leur taille, leur répartition autour du titre,
  et leur déplacement quand le curseur passe dedans.
- Vérifié dans le DOM : l'apparition échelonnée des frais (opacités 0,66 / 0,30 / 0,06 /
  0 / 0 sur la même image) correspond exactement aux fenêtres calculées.
- **Pas vérifié à l'écran** : le rail de tirets et l'indicateur de défilement. Le
  panneau d'aperçu s'est masqué en cours de session (`innerHeight` à 0, captures
  blanches). À regarder sur `localhost:3001/tarification`.

## Fichiers touchés

- `components/public-site/shared.tsx`
- `components/public-site/PricingPage.tsx`
- `components/public-site/ExperienceCinema.tsx`
