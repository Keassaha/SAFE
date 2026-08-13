# Les chiffres qui débordaient de leur carte

**2026-08-12** · déc. CEO

## Le constat

« Les chiffres débordent, ce n'est vraiment pas beau. » Sur `/rapports`, la carte
« Paiements reçus » affichait `47 077,20 $` et le symbole `$` disparaissait sous
le bord de la carte.

Ce n'est pas un défaut d'esthétique. Un montant amputé de son symbole est **un
chiffre faux à l'écran** : rien ne dit au lecteur qu'il manque quelque chose.

## La cause, mesurée

Un montant est composé en mono avec `tabular-nums` : chaque glyphe occupe la
largeur d'un chiffre, séparateurs et symbole compris.

| | |
|---|---|
| Corps du chiffre | `text-3xl md:text-4xl` = **36 px** |
| Chaîne « 47 077,20 $ » | 11 glyphes × ~0,6 em = **238 px** |
| Zone de texte de la carte | 4 colonnes → ~220 px moins 48 px de marge = **172 px** |

238 px dans 172 px, et la carte porte `overflow-hidden` pour ses coins arrondis :
le débordement était coupé net, silencieusement.

Le corps était fixe, donc le défaut ne dépendait pas de la donnée du jour mais
attendait simplement un montant assez long. Les tuiles du tableau de bord (26 px)
et les cartes de comptabilité (24 et 26 px) portaient le même piège, non déclenché
parce que le cabinet de test affichait des zéros.

## Le correctif

Un primitif dans `app/globals.css`. Le corps se mesure sur la **carte**, pas sur
la fenêtre : `cqw` vaut 1 % de la largeur du conteneur.

```css
.safe-carte-chiffre { container-type: inline-size; }
.safe-chiffre          { font-size: clamp(18px, 9cqw, 30px); }
.safe-chiffre-porteur  { font-size: clamp(22px, 11cqw, 38px); }
```

La carte se déclare conteneur, le chiffre s'y ajuste, et le plancher garantit la
lisibilité dans une colonne étroite. Un repli `@supports` couvre les navigateurs
sans requête de conteneur. Chaque chiffre porte en plus un `title` : même au
plancher, le montant complet reste récupérable au survol.

`formatCurrency` en fr-CA sépare les milliers par une espace **insécable** : la
chaîne ne peut pas se couper. Réduire le corps est le seul levier, il n'y a pas
de repli par le retour à la ligne — d'où le choix d'un corps fluide plutôt que
d'un corps plus petit choisi au jugé.

`/rapports` passe par ailleurs de quatre à **trois colonnes** : à quatre, la zone
de texte tombait sous 175 px, ce qui ne laisse pas la place d'un montant à sept
chiffres même réduit. Une carte doit pouvoir porter son pire chiffre, pas
seulement celui du jour.

## Vérification, au pire cas

Mesuré dans le navigateur avec `Range.getBoundingClientRect()` sur le nœud de
texte — pas `scrollWidth`, qui ne bouge pas quand un bloc déborde.

Carte de rapport à 266 px de zone de texte :

| Montant | Corps | Largeur du texte | Déborde |
|---|---|---|---|
| 47 077,20 $ | 23,9 px | 151 px | non |
| 1 234 567,89 $ | 23,9 px | 192 px | non |
| 12 345 678,90 $ | 23,9 px | 206 px | non |

Réponse à la largeur de carte, avec le pire montant à quinze glyphes :

| Carte | 420 px | 340 px | 280 px | 240 px | 200 px |
|---|---|---|---|---|---|
| Corps | 30 px | 26,4 px | 21 px | 18 px | 18 px |
| Déborde | non | non | non | non | non |

Quatre tuiles du tableau de bord contrôlées de la même manière : aucune ne
déborde, la tuile fidéicommis tient son pire montant à 38 px.

## Écrans repris

`/rapports` (Dashboard financier), les quatre tuiles du tableau de bord,
`ComptaKpiCard` et `SummaryCard` en comptabilité.

## Reste à faire

Trois autres endroits composent encore un montant en corps fixe et échapperont au
primitif tant qu'ils ne seront pas repris : `TrustCard` dans
`components/ds-safe/sections.tsx` (28 px), la console SAFE Inc.
(`app/(app)/console/page.tsx`, 28 px) et `InvoiceTemplateClean` (26 px, gabarit
de facture — largeur fixe, donc risque faible). Le correctif y tient en deux
classes.
