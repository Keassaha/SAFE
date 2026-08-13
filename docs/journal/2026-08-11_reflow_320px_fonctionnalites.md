# 2026-08-11 — Les 3 px de `/fonctionnalites`

Clôture du défaut noté en fin de passe couleur : « `/fonctionnalites` déborde de
3 px à 320 px. La cause est une section de contenu, pas la barre ». Confirmé,
mesuré, corrigé. La barre de navigation était bien hors de cause.

## Ce que la piste initiale disait, et ce qui était vrai

La piste pointait `max-w-[48ch]` et le padding de section. Ni l'un ni l'autre.
La section fait bien 320 px avec ses 22,5 px de retrait de chaque côté, et la
grille intérieure fait bien 275 px. C'est sa **piste** qui en faisait 302,6.

```
conteneur : 275 px
piste     : 302,625 px   <- la piste est plus large que ce qui la contient
```

Sous `lg`, la grille n'a aucune classe `grid-cols-*`. La piste implicite vaut
donc `auto`, et une piste `auto` ne descend jamais sous la taille min-content de
ses éléments. Un enfant qui refuse de se compresser tire la piste avec lui, et la
piste déborde son propre conteneur. Le texte de gauche n'était pas coupable : il
mesurait 82,6 px en min-content mais s'affichait à 302,6 px, simplement parce
qu'il remplissait la piste que son voisin avait élargie.

Deux défauts empilés, pas un seul.

## Défaut 1 : la piste de grille

`min-w-0` sur les deux enfants de la grille. L'élément peut alors se compresser,
la piste retrouve la largeur de son conteneur.

Sans effet au-dessus de `lg` : `grid-cols-2` de Tailwind produit déjà
`repeat(2, minmax(0, 1fr))`. Le trou n'existait que sur la piste implicite, en
dessous de 1024 px. Vérifié à 1280 px : 540 px et 540 px, inchangé.

## Défaut 2 : la barre de menu de la maquette

Chaque maquette a été contrainte à 273 px pour voir laquelle débordait vraiment.
Cinq sur six tenaient. Seule `MockupAppComplete` dépassait, de 25,4 px, par la
barre de menu de l'application.

Les trois libellés ne rentrent pas, et aucun réglage de padding ne les fait
rentrer :

| Padding par bouton | Largeur nécessaire | Disponible |
|---|---:|---:|
| 9,375 px (actuel) | 329,4 px | 250,5 px |
| 7,5 px | 318,1 px | 250,5 px |
| 5,625 px | 306,9 px | 250,5 px |

À 320 px il faut donc replier. Le menu passe sous le logo, les trois onglets
restent entiers, rien n'est coupé.

### Le repli est borné à `max-[374px]`

Premier essai avec `flex-wrap` sans condition. Le repli se déclenchait alors
jusque vers 426 px, parce que le groupe est placé selon sa taille max-content.
À 375 px la barre passait de 64 px à 79,5 px de haut, avec le logo seul sur sa
ligne. Un écran de téléphone courant changeait d'allure pour un défaut qui ne
s'y produisait pas.

`max-[374px]:flex-wrap` confine la correction sous la ligne de flottaison des
375 px. Le seuil réel de coupure se situe vers 370 px, la marge est faite exprès.

Contrepartie assumée à 320 px : « Tableau de bord » se replie sur deux lignes
dans sa pastille. Le tableau ci-dessus dit pourquoi c'est inévitable.

## `/a-propos` débordait aussi

La note du 10 disait que seule `/fonctionnalites` échouait. C'est inexact :
`/a-propos` débordait de 3 px également, par la même grille `auto` et par une
autre maquette (`MockupFicheDeTemps`). Antérieur à cette passe, et sans rapport
avec la correction du menu. Même remède, `min-w-0` sur les deux enfants.

## Vérification

Six pages publiques, mesure de `scrollWidth` contre `clientWidth`, et relevé de
tout élément dont le bord droit sort du cadre de son parent.

| Page | 320 px |
|---|---|
| `/` | 320 / 320 |
| `/fonctionnalites` | 320 / 320 |
| `/tarification` | 320 / 320 |
| `/a-propos` | 320 / 320 |
| `/demo` | 320 / 320 |
| `/contact` | 320 / 320 |

Deux débordements subsistent et sont voulus : le rail `.excel-rail` de
`/a-propos` et le bandeau défilant de l'accueil, tous deux enfermés dans un
parent qui les rogne ou les fait défiler seuls. Aucun bouton de maquette n'est
coupé.

`/fonctionnalites` et `/a-propos` revérifiées à 375, 768 et 1280 px : aucun
écart. `tsc` sans erreur sur les trois fichiers touchés.

## Un piège de mesure

L'en-tête ressortait à 325 px et ressemblait à une cause. Il n'en était pas une.
Il est `fixed inset-x-0` : il s'étire sur la largeur du document, donc il grandit
avec le débordement qu'il subit. Son propre min-content vaut 167,2 px. Il est
revenu à 320 px sans qu'on y touche, dès que les sections ont cessé de pousser.

Règle utile : un élément en `fixed inset-x-0` plus large que la fenêtre est un
symptôme, jamais l'origine.

## Note d'outillage

Le volet du navigateur était masqué pendant la session. `document.visibilityState`
vaut alors `hidden`, les animations `whileInView` de framer-motion ne s'exécutent
pas, et les captures ressortent blanches sur un contenu resté à `opacity: 0`. La
mise en page, elle, est calculée normalement : les mesures restent valables.

## Fichiers

- `components/public-site/FeaturesPage.tsx` : `min-w-0` sur les deux enfants de `SectionFonction`
- `components/public-site/AboutPage.tsx` : `min-w-0` sur les deux enfants de la grille « Ce que ça change »
- `components/public-site/mockups.tsx` : `max-[374px]:flex-wrap` sur la barre de menu de `MockupAppComplete`
