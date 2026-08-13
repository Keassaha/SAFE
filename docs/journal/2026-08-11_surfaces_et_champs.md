# 2026-08-11 — Un champ qui ne se voyait pas

Le CEO entre enfin dans l'application et le dit sans détour : « les différents
fonds sont mêlés aux différents formulaires et les champs cliquables ».

Ce n'était pas une impression.

## La mesure

| Écart entre deux surfaces | Rapport |
|---|---:|
| page vs carte | 1,12 |
| carte vs creux du champ | 1,21 |
| champ vs sa propre bordure | **1,32** |
| carte vs bordure forte | 1,70 |

WCAG 1.4.11 exige **3,00** pour qu'un bord de composant soit perceptible.
Aucune valeur n'en approchait. Le champ portait `bg-si-surface`, c'est-à-dire
du blanc, posé sur une carte blanche, cerné d'un filet à 11 % d'encre. Il était
littéralement invisible, et c'est un manquement d'accessibilité, pas une
divergence de goût.

## L'échelle refaite

Trois marches franches, un rôle chacune.

| Jeton | Avant | Après | Rôle |
|---|---|---|---|
| `canvas` | `#F1F2F4` | **`#EBEDEF`** | la page |
| `surface` | `#FFFFFF` | `#FFFFFF` | la carte, posée dessus |
| `surface2` | `#E8EAEC` | **`#F4F5F7`** | le creux où l'on écrit |
| `border` | `#DEE0E3` | **`#D6D9DD`** | filet de structure |
| `border-strong` | `#C4C7CB` | **`#888E94`** | bord de contrôle |

`border-strong` atteint **3,31:1 sur la carte** et **3,03:1 sur le creux**. Le
seuil est franchi sur les deux fonds où un champ peut se poser, pas seulement
sur le plus favorable.

## Le champ

`components/ui/Input` change de logique. Il ne se distingue plus par un filet
qu'on devine, mais par un creux qu'on voit :

- fond `surface2`, distinct de la carte ;
- bordure `border-strong`, au-dessus du seuil ;
- au survol, la bordure fonce à 40 % d'encre ;
- au focus, le fond **blanchit** et un anneau de 2 px apparaît : le champ
  s'ouvre au lieu de se souligner ;
- libellé passé de `muted` 12 px à **encre 13 px** : c'est lui qui rend
  l'information facile à retrouver.

Les quatre règles de focus ont été lues dans la feuille servie et sont
correctes. Elles n'ont pas pu être capturées à l'écran : le panneau
d'aperçu ne reçoit pas le focus système, donc `:focus` n'y correspond jamais.
À vérifier à la tabulation dans un vrai navigateur.

## Le spécimen

`/ds-preview/champs` met l'ancienne et la nouvelle composition côte à côte, sur
les primitives réelles, avec la matrice d'états complète et une démonstration
de l'espacement : 8 px entre un titre et sa description, 24 px entre deux
champs, 48 px entre deux sections. L'écart fait la coupure, pas un filet de
plus.

## Ce qui reste de la demande

Le CEO demandait trois choses. Deux sont faites : la lisibilité des surfaces
et la respiration des formulaires. La troisième, « me concentrer sur une seule
teinte », attend un arbitrage : le produit porte encore le vert de validation,
l'ambre d'échéance et le rouge d'erreur. Les retirer rendrait un solde de
fidéicommis négatif indiscernable d'un solde ordinaire, ce que B-1 r.5 ne
permet pas de traiter à la légère. La question à trancher n'est pas
« combien de teintes » mais « quels états méritent encore d'être colorés ».

## Noir et vert seulement (déc. CEO 2026-08-11)

Option 1 retenue. L'ambre et le rouge quittent la couleur.

| Jeton | Avant | Après |
|---|---|---|
| `amber` | `#8A6412` | `#5A5D60` |
| `amber-ink` | `#6E4F0E` | `#3C3E40` |
| `danger` | `#A83232` | `#3C3E40` |
| `danger-ink` | `#862626` | `#1A1A1A` |

Les jetons hérités `--safe-status-warning*` et `--safe-status-error*` suivent.

### Ce que la couleur portait, la forme le reprend

Retirer une teinte sans rien mettre à la place, c'est retirer du sens.
`StatusBadge` passe donc de quatre couleurs à quatre **formes** :

| État | Traitement |
|---|---|
| validé | fond vert dilué, contour vert, point plein — la seule couleur du lot |
| à vérifier | fond transparent, contour d'encre, point creux |
| bloquant | fond d'encre plein, texte clair |
| neutre | gris très pâle |

Trois registres visuels distincts, lisibles sans percevoir la couleur. C'est
meilleur que la version colorée au regard de WCAG 1.4.1, pas moins bon.

### Le solde de fidéicommis négatif

Point de vigilance réel. Un solde négatif est un manquement à B-1 r.5, pas une
valeur basse. Sans rouge, il ne restait que la graisse et le signe moins :
signal trop mince pour un registre financier.

Le montant s'inverse désormais en pastille d'encre pleine à chiffres clairs.
Impossible à manquer, sans une once de couleur, et le signal survit au
daltonisme comme à l'impression en noir et blanc.

Vérification du registre clients : **une seule couleur non neutre sur toute la
page**, `rgb(38, 101, 74)`, le vert de validation, 17 occurrences. Tout le
reste est achromatique.

## Le vert du logo dans le hero

Nouveau jeton `brand-green` = `#2E7D5B`, repris tel quel de la charte
(`SAFE_PALETTE.emeraude`). Il ne sert qu'aux accents éditoriaux de la vitrine
et ne dit jamais un état, ce qui le distingue de `verified`.

Le mot « ensemble. » du hero le porte. Vérifié : `rgb(46, 125, 91)`, identique
au remplissage du logo posé au-dessus.

## Lignes légèrement irrégulières

Une serif de titrage se pose mal sur une grille parfaite : chaque bloc démarre
au même pixel, la colonne devient un mur, et la lettre paraît posée sur une
règle plutôt qu'écrite.

Trois écarts sur le hero, aucun décoratif :

1. **Alignement optique du titre.** Le « S » d'une Instrument Serif porte une
   approche latérale : aligné au pixel, il paraît rentré. Retrait de 0,055em.
2. **Largeurs de lecture qui varient** d'un bloc à l'autre au lieu d'une mesure
   unique. Le bord droit cesse d'être un mur.
3. **Décalages horizontaux minuscules** entre exergue, titre et chapeau.

Mesuré : bords gauches à 62,6 / 69,2 / 73,2 px. Une dizaine de pixels d'écart,
qu'on ne voit pas et qu'on sent.

**Cette liberté s'arrête à l'éditorial.** Dans les registres et les
rapprochements, l'alignement sert à vérifier des chiffres : la grille y reste
rigoureuse. C'est le conflit tranché en §11 de `DESIGN_HUMAIN.md`,
« anti-grille vs précision opérationnelle ».

## Le châssis : un seul fond, une barre qui flotte

« Je vois deux couches, un fond verdâtre et un fond plutôt bleuâtre. »

### Les deux couches

`.safe-atmosphere`, le fond du canvas applicatif, peignait :

- une base `#EFF2ED`, l'ancien albâtre, qui n'appartenait plus à la palette ;
- un dégradé radial **vert forêt** en haut à gauche (`rgba(45,107,71,0.07)`) ;
- un dégradé radial **beige chaud** en bas à droite (`rgba(198,178,140,0.14)`).

Trois teintes de blanc à l'écran, contre une seule sur la vitrine. Le
commentaire d'origine justifiait les dégradés : « rendre le verre lisible comme
matière ». L'argument ne tient pas ici. Un verre tire sa matière du contenu qui
défile dessous, pas d'un dégradé peint sous lui.

Un seul aplat désormais, `var(--si-canvas)`, exactement celui de la vitrine.
Vérifié : `rgb(235, 237, 239)`, `background-image: none`.

### L'urgence garde sa couleur

Retour en arrière assumé sur l'option 1. L'ambre et le rouge reviennent :
`#8A6412` et `#A83232`. La sobriété ne se gagne pas en aveuglant l'alerte, elle
se gagne en réservant la couleur à ce qui appelle un geste. Le décoratif reste
achromatique.

Les pastilles gardent le contour et le point gagnés au passage : la couleur ne
travaille jamais seule. Le solde de fidéicommis négatif reprend l'encre rouge
plutôt que la pastille inversée, qui n'était qu'une compensation.

### La barre

| | Avant | Après |
|---|---|---|
| Largeur | pleine, bord à bord | `max-w-6xl`, **100 px de retrait** de chaque côté à 1280 |
| Forme | rectangle, filet en bas | rayon 12 px |
| Fond | verre sur toute la largeur | verre à 72 %, flou 20 px, saturation 1,4 |
| Profondeur | filet | une ombre unique |
| Sélection | un fond allumé sous l'entrée active | **une pastille unique qui se déplace** |

### L'indicateur glissant

Une seule pastille vit derrière les entrées. Elle rejoint l'entrée active, ou
celle qu'on survole. Au lieu d'un rectangle qui s'allume et s'éteint sous
chaque libellé, un objet se déplace, et l'œil le suit au lieu de recommencer sa
lecture.

La souplesse tient à la courbe : `cubic-bezier(0.16, 1, 0.3, 1)` sur 280 ms
démarre vite et s'arrête doucement. C'est la décélération qui donne la
sensation de matière plutôt que de commutateur. `motion-reduce` la neutralise.

Vérifié : au survol de « Finances », la pastille se place à x = 333,7 pour
122,5 px de large, contre 334 et 123 mesurés sur la cible.

### Ce qui n'est pas fait

Le CEO demandait aussi de **réorganiser** le menu, pas seulement de le
rembellir. Les six groupes et leur ordre n'ont pas bougé : décider quoi
regrouper et dans quel ordre engage l'architecture de l'information, pas la
présentation. À traiter comme une décision propre.

La police n'a pas changé : Instrument Serif pour les titres, Geist Sans pour le
reste. Le duo est celui de la charte et il tient.

`/ds-preview/chassis` rend la vraie barre sur des données factices, hors
authentification, avec de la matière à faire défiler dessous.

## Le chevauchement de la barre

La barre resserrée à `max-w-6xl` faisait passer « Tableau de bord » par-dessus
le logo.

### La cause, mesurée

La section de marque était déclarée `flex items-center gap-4 min-w-0`, sans
`shrink-0`. Face à une navigation de 672 px et une zone droite de 469 px dans
1 080 px disponibles, flexbox a fait ce qu'on lui demandait : il a comprimé la
seule section autorisée à céder. **Largeur mesurée de la section gauche : 0 px.**
Le logo débordait alors de sa propre boîte, sous la navigation.

Ce n'est pas la barre qui était mal ajustée, c'est qu'on lui avait retiré la
place de son contenu sans rien retirer du contenu.

### Le correctif, en quatre points

1. **La marque ne se comprime jamais** : `shrink-0`. C'est elle qui doit gagner
   un arbitrage de place, pas le contraire.
2. **La barre retrouve de la place** : `max-w-[1320px]`. Soit 60 px de retrait
   par côté à 1 440, encore franchement flottante.
3. **La langue quitte la barre.** Deux boutons permanents pour un réglage qu'on
   change une fois. Elle rejoint le menu du compte, avec son libellé.
4. **Les libellés se replient sur leurs icônes sous 1 280 px**, avec `aria-label`
   et `title` conservés. Six libellés ne tiennent pas sans écraser quelqu'un.

Un garde-fou dur complète le tout : `overflow-hidden` sur la navigation, pour
qu'aucun débordement futur ne puisse plus recouvrir un voisin.

### Vérifié

| Fenêtre | Section gauche | Nav demandée / disponible | Chevauchement |
|---:|---:|---|---|
| 1 440 | 179 px | 719 / 732 | non |
| 1 180 | intacte | 309 / 714 | non |

Pastille glissante toujours juste : au survol d'« Outils » à 1 180 px, elle se
place à 411,3 px pour 61,9 de large, contre 411 et 62 mesurés sur la cible.

## Ce qui reste ouvert

La refonte de la présentation du **tableau de bord** est demandée et n'est pas
faite. Elle mérite mieux qu'une passe de fin de session : c'est une question de
hiérarchie de l'information, pas de style.

## L'ordre du tableau de bord

« Je ne veux pas voir la Navette et Pour commencer en premier. »

Les deux blocs occupaient les deux meilleures places de l'écran, et aucun ne
répond à la question qu'on se pose en l'ouvrant le matin. La Navette dit ce que
**quelqu'un d'autre** attend de vous. « Pour commencer » est une configuration
qui aura disparu dans un mois.

### Nouvel ordre

| | Bloc | Pourquoi là |
|---|---|---|
| 1 | À traiter maintenant | la décision, avec son geste, seule et en pleine largeur |
| 2 | Bande de conformité | l'état réglementaire, en une ligne fine |
| 3 | Les quatre chiffres | facturé, encaissé, à recevoir, fidéicommis |
| 4 | Navette | ce que le cabinet attend de vous |
| 5 | Obligations · lecture financière · activité | en **colonnes égales** |
| 6 | Pour commencer | après un filet, parce qu'il finira par disparaître |

La grille secondaire passe de `1.6fr 1fr` à deux colonnes égales : aucun de ces
blocs ne prime sur l'autre, rien ne justifiait de les déséquilibrer. C'est la
symétrie demandée.

### Mise en œuvre

`LawyerGlance` était rendu par la page, avant la vue. Il devient un emplacement
(`glance`) passé à `DashboardViewSafe`, qui décide seul de l'ordre. La page
fournit le contenu, la vue tient la composition.

### Non vérifié à l'écran

Le tableau de bord vit derrière une session. Le module compile et le typage
passe, mais la composition n'a pas été regardée. À confirmer par le CEO, ou à
brancher sur `/ds-preview` si un aller-retour de plus est nécessaire.

## La loupe, et un garde-fou qui rognait les menus

### Régression corrigée

Les panneaux déroulants de la barre ne s'ouvraient plus. Cause :
l'`overflow-hidden` que j'avais posé sur la navigation « pour qu'aucun
débordement futur ne puisse recouvrir un voisin ». Il rognait aussi les
panneaux, qui descendent **sous** la barre.

Le garde-fou était inutile : le repli des libellés sous 1 280 px suffit déjà,
mesuré à 309 px demandés pour 714 disponibles. Retiré.

Vérifié : `overflow: visible`, panneau présent, `aria-expanded="true"`, 320 px
de large, de y = 67 à y = 439, sous une barre qui s'arrête à 68.

### La loupe

Chaque entrée grossit selon sa distance au curseur, suivant une courbe en
cloche. Amplitude 1,14, rayon 150 px.

Mesuré, pointeur au centre de « Finances » :

| Entrée | Échelle |
|---|---:|
| Tableau de bord | 1,000 |
| Aujourd'hui | 1,011 |
| Pratique | 1,072 |
| **Finances** | **1,140** |
| Outils | 1,078 |
| Paramètres | 1,014 |

Trois précautions : les styles sont écrits dans le DOM depuis une boucle
d'animation et non par un rendu React, l'amplitude reste basse pour que la
barre respire au lieu de gondoler, et `prefers-reduced-motion` neutralise tout.

La loupe et l'indicateur glissant coexistent : l'un dit où l'on est, l'autre
répond au doigt.

## Spécification d'interface

[INTERFACE_SAFE_2026-08.md](../design/INTERFACE_SAFE_2026-08.md) consolide les
décisions des 10 et 11 août : ce qui rend cette interface premium, les
fondations chiffrées, le châssis, les quatre familles d'écrans, ce qui reste à
faire, et comment vérifier. Il remplace la direction « Registre calme », dont
la palette albâtre et l'accent vert ont été écartés à l'usage.

## Zoom souple, feuille, et une pastille qui s'efface

### Le zoom, sans altérer le texte

Une mise à l'échelle rééchantillonne le texte. Au-delà de 1 %, un libellé de
13 px devient visiblement mou. Deux utilitaires, deux traitements :

| Classe | Pour | Mouvement |
|---|---|---|
| `.safe-zoom` | cartes, tuiles, blocs cliquables | `scale(1.006)` + `translateY(-1px)` + ombre qui s'ouvre |
| `.safe-zoom-rang` | rangées de tableau | **aucune échelle** : fond + filet d'encre à gauche + ombre |

L'échelle reste sous le seuil de perception du flou. C'est l'**élévation** qui
porte la sensation, pas l'agrandissement. Sur une `<tr>`, aucune échelle du
tout : une rangée transformée décale ses bordures et fait vibrer la grille, et
l'alignement est sacré dans un registre.

`prefers-reduced-motion` neutralise les transformations, jamais le retour.

### La pastille de navigation

Elle suivait l'entrée active en l'absence de survol. Elle ne répond plus qu'au
curseur et s'efface quand il quitte la barre : l'entrée active se signale déjà
par son encre pleine face aux libellés atténués, et une pastille allumée sans
curseur n'est plus un retour, c'est une décoration.

Assouplie : 380 ms au lieu de 280, sur la même courbe. La loupe passe d'une
amplitude de 1,14 à **1,10** et d'un rayon de 150 à **170 px** : plus large,
plus douce, moins démonstrative.

**Un piège d'événement.** `onMouseLeave` de React est synthétisé à partir de
`mouseout` et ne se déclenchait pas dans tous les cas : la pastille restait
allumée après la sortie. Elle est désormais remise à zéro depuis le
`pointerleave` natif, celui-là même qui remet la loupe à plat.

Vérifié : au repos opacité 0, au survol opacité 1 sur 61,9 px, après sortie
opacité 0 et toutes les entrées revenues à l'échelle 1.

### La feuille

Le registre repose maintenant sur une surface blanche détachée du canvas :
rayon 14 px, filet à 11 % d'encre, **une** ombre longue plus un liseré d'un
pixel. La barre d'outils entre dans la feuille : elle appartient visiblement au
même objet que le tableau.

Cela revient sur le « le contenu possède la page » du document de refonte. Le
canvas est désormais un gris franc, et une liste posée dessus sans support
flottait. Une feuille se justifie quand le fond a assez de présence pour la
porter.

## Le sélecteur s'en va, le zoom reste

L'enregistrement d'écran montrait ce que « sélecteur » désignait : le filet
d'encre épais à gauche de la rangée survolée, doublé d'un fond plein. Deux
marques qui disent **sélectionné**, alors que rien ne l'est : on survole.

Retiré des deux endroits.

| | Avant | Après |
|---|---|---|
| Barre du haut | pastille grise glissante + loupe | **loupe seule** |
| Rangée de registre | filet d'encre à gauche + fond plein | **zoom seul**, `scale(1.005)` + ombre |

La rangée grandit par son milieu (`transform-origin: center`) et son ombre
passe au-dessus de ses voisines (`z-index` au survol). L'échelle reste sous le
seuil du flou : à 1,005 sur une rangée de 1 000 px, la croissance est de 5 px,
sensible sans rééchantillonner le texte.

La loupe s'élargit : amplitude 1,10, rayon 170 px. Mesuré au centre de
« Finances » : 1,100 · 1,087 · 1,062 · 1,041. La décroissance est plus longue,
le geste plus doux.

En mouvement réduit, le zoom disparaît et un fond discret prend le relais : un
survol doit rester perceptible même sans animation.

## Vérification de non-régression

Inquiétude légitime du CEO après un chantier de cette ampleur : que
l'application perde des qualités qu'il n'a pas demandé de changer.

Diff passé au crible sur les éléments interactifs. **Aucun retiré.** Chaque
`<Link>` et `<Button>` supprimé du diff réapparaît à la ligne suivante avec
d'autres classes. Deux éléments ont été ajoutés, aucun perdu.

| Élément | État |
|---|---|
| Nouveau client, création rapide, export CSV | intacts |
| Bouton de création de l'état vide | intact |
| Voir · Modifier · Ouvrir les dossiers · Archiver | intactes, regroupées dans le menu de ligne |
| Sélecteur de langue | déplacé dans le menu du compte, pas supprimé |
| Pages dossiers, facturation, temps, employés, nouveau client | **jamais modifiées** |

## Propagation à l'ensemble du produit

Demande : que toutes les pages reflètent le traitement de la page clients.
124 routes. La question n'est pas de les éditer une par une, c'est de trouver
ce qui propage tout seul.

### Le levier principal

`PageHeader` avait `variant = "default"`, c'est-à-dire la grande carte verte.
**63 écrans sur 76 ne précisaient aucune variante** : ils l'héritaient sans
l'avoir choisie. Le défaut bascule sur `dashboard`, l'en-tête posé sur la
surface de travail. Un mot changé, 63 écrans alignés.

Un défaut doit être ce qu'on veut la plupart du temps. Les écrans qui tiennent
encore à la carte verte doivent désormais l'écrire.

### Les autres leviers

- `animate-fade-in` retiré de **49 fichiers**. Entrée systématique des pages,
  listée « à supprimer » par le document de refonte : le mouvement doit guider,
  pas accueillir.
- Trois en-têtes de facturation peignaient leur propre dégradé sombre à la
  main, hors palette. Alignés sur la surface de travail.

### L'effet de bord, et il était prévisible

Retirer le fond sombre rend invisibles les contrôles qui avaient été peints
POUR lui. Sur la fiche client : « Modifier », la pastille de statut et « Voir
le dossier complet » étaient en clair translucide sur sombre. Sur fond clair,
ils disparaissaient.

Repeints en encre sur surface, avec filet et zoom. Puis balayage du reste de
`app/(app)` à la recherche du même motif : les seuls restants vivent dans des
conteneurs qui peignent eux-mêmes leur fond sombre, donc lisibles.

C'est la leçon du basculement d'un défaut : il faut chercher qui s'appuyait sur
l'ancien, sans attendre que l'utilisateur le trouve.

### Le zoom sur les panneaux déroulants

Les deux menus de la barre se déploient désormais avec un zoom léger, de 0,97
à 1, sur 240 ms. `originY: 0` sur le panneau centré et `originX: 1` sur celui
du compte : un menu doit croître depuis son point d'ancrage, sinon il paraît
remonter sous la barre. Les entrées du panneau reçoivent `.safe-zoom`.

### Vérification

`tsc` propre. **124 fichiers de tests, 1 439 tests, tous verts.** Neuf routes
protégées répondent 307, donc leurs modules compilent.

Une erreur de syntaxe introduite au passage, et corrigée : un commentaire JSX
inséré comme premier enfant d'une expression `{condition && (` casse la
compilation. Trouvée par `tsc`, pas par l'utilisateur.

### Ce qui reste

Les 58 fichiers contenant un `<table>` n'ont pas tous reçu `.safe-zoom-rang`,
et les cartes des écrans autres que clients n'ont pas encore `.safe-zoom`. La
feuille blanche n'est posée que sous le registre clients. C'est du travail
écran par écran, à faire en regardant, pas en scriptant.

## « Les boutons d'ajout ont disparu » — ils n'ont jamais été rendus

Alerte du CEO après la propagation. Vérification immédiate, et le diagnostic
n'est pas celui qu'on attendait.

### Ce qui a été vérifié

`ClientCreateModal`, `ClientQuickCreateModal` et `lib/auth/permissions.ts` :
**aucun des trois n'a été modifié** de tout le chantier. Les deux composants
sont toujours montés dans l'action de `PageHeader` et dans l'état vide de
`app/(app)/clients/page.tsx`.

### La vraie cause

Le compte de démonstration utilisé est `camille.demo@safecabinet.ca`, de rôle
**`avocat`**. Or le modèle de permissions donne :

| Permission | avocat | assistante | admin_cabinet |
|---|:--:|:--:|:--:|
| Créer un client | — | oui | oui |
| Gérer les dossiers | — | oui | oui |
| Gérer les factures | — | oui | oui |
| Gérer les documents | — | oui | oui |
| Saisir du temps | oui | — | oui |

Un avocat ne peut créer ni client, ni dossier, ni facture, ni document. Les
boutons ne sont pas cachés par le design, ils ne sont pas rendus du tout.

### La question de fond, non tranchée

Ce modèle est cohérent avec le positionnement « l'assistant fait l'intake, SAFE
est son copilote ». Il l'est beaucoup moins pour un **avocat seul sans
adjointe**, qui se retrouve alors incapable d'ouvrir un dossier client dans son
propre cabinet. Le beachhead comprend des praticiens solos.

Décision de produit, pas de design. Non modifiée unilatéralement : qui peut
ouvrir un dossier client touche à l'intake, donc au contrôle de conflits.

## Quatre passes globales

Instruction du CEO, et elle change la méthode : « assure-toi que tous les
réglages et corrections que je fais sur une page sont appliqués à toutes mes
pages ». Plus de correction écran par écran quand la cause est partagée.

### 1. La carte devient une feuille

`components/ui/Card` est monté dans **98 fichiers**. Rayon 8 → 14 px, ombre
permanente au lieu d'être réservée à `elevated`. Sur un canvas gris franc, une
carte blanche sans ombre flotte sans se poser.

« Arrondi, en relief, avec des ombres » se décide là, pas page par page.

### 2. L'action passe au dégradé

Le CEO a retenu le bouton « Télécharger en PDF » des rapports : un dégradé
sombre. Généralisé.

Nouveau jeton `action-vert` (`#16332A`) et un utilitaire
`.safe-action-degrade` : encre → vert forêt à 135°. Une déclaration.

- la primitive `Button` l'adopte sur `primary`, `dark` et `landing-primary` ;
- **26 fichiers** avaient un aplat noir écrit à la main, converti.

Le survol éclaircit les deux extrémités du même écart : le geste se sent, la
couleur ne change pas de nature.

### 3. Plus de gras

« Une police uniforme et pas bold. » **741 occurrences** de `font-bold` et
`font-semibold` ramenées à `font-medium`, dans **203 fichiers**. Il en reste
zéro dans l'interface.

Une seule graisse d'emphase. La hiérarchie se fait par la taille, l'espace et
la couleur, pas par l'épaisseur.

Courriels et PDF exclus : ils ont leurs propres contraintes de lisibilité et ne
partagent pas la cascade.

### 4. Le survol soulevé devient le zoom

19 fichiers portaient `hover:-translate-y` et une ombre au survol. Remplacés par
`.safe-zoom`, qui applique partout la même courbe et la même amplitude.

### Un test de contrat a fait son travail

`design-system-contract` exigeait `rounded-lg` sur la carte, pour réserver les
grands rayons aux pastilles et aux superpositions. Le passage à 14 px l'a fait
échouer.

Le contrat a été mis à jour, pas contourné : il vérifie désormais le rayon de
la feuille **et** la présence d'une ombre, tout en continuant d'interdire un
rayon d'élévation sur une carte. Une règle qui suit une décision reste une
règle ; une règle qu'on supprime pour faire passer un test n'en est plus une.

### Vérification

`tsc` propre. **124 fichiers de tests, 1 439 tests, tous verts.** Dix routes
répondent, dont huit protégées en 307.

## Permissions : l'avocat peut créer

`canCreateClients` et `canManageDossiers` acceptent désormais `avocat`.

L'exclusion supposait une adjointe pour faire l'intake. Hypothèse fausse pour
un praticien seul, qui ne pouvait ouvrir aucun dossier dans son propre cabinet.

`canManageClients` n'a **pas** été élargi : il gouverne aussi l'archivage, donc
la conservation des dossiers. Rien dans la demande ne portait là-dessus.

## L'éditeur de documents : deux fonds et une autre police

### La police, et la cause était nette

`EditionDashboard` et `EditionBibliotheque` déclaraient en dur :

```
fontFamily: '"Geist", -apple-system, system-ui, sans-serif'
```

`next/font` ne publie pas la famille sous le nom « Geist » : il génère un nom
unique et l'expose par `--font-geist-sans`. Le navigateur ne trouvait donc
rien et retombait sur `-apple-system`. La page ne ressemblait pas aux autres
parce qu'elle n'utilisait pas la même police du tout.

Corrigé en `var(--font-geist-sans)`. Un `Georgia, serif` en dur passe de même
à `var(--font-instrument-serif), Georgia, serif`.

### Les deux fonds

Le module empilait **quatre** échelles de gris :

| Source | Valeur | État |
|---|---|---|
| `--safe-neutral-bg` · `--safe-neutral-surface` | `#FBFCFA` blanc chaud | → `var(--si-surface)` |
| `--safe-neutral-page` | `#EFF2ED` albâtre verdâtre | → `var(--si-canvas)` |
| `--safe-neutral-{100..900}` | famille zinc de Tailwind | → jetons de la palette |
| `zinc-*` en classes | famille zinc par défaut | → rampe neutre, comme `slate` |

`zinc` était encore lié à `colors.zinc` : une quatrième teinte de gris, à côté
du canvas, de `slate` et des neutres hérités. Il rejoint la rampe.

### Portée

Ces variables ne servent pas qu'à l'éditeur : `--safe-neutral-*` alimente le
namespace `neutral` de Tailwind, soit **405 usages** dans le produit. Corriger
l'éditeur corrige tout ce qui puisait à la même source.

C'est la méthode que le CEO a demandée : chercher la cause partagée plutôt que
la page qui la révèle.

### Vérification

`tsc` propre, **1 439 tests verts**, routes protégées en 307.

## Comptabilité : sans bannière, et lisible

### La bannière

`PageHeader variant="compact"` peignait encore une carte forêt en haut de page.
Passé à `dashboard`. Un écran de comptabilité s'ouvre sur des chiffres, pas sur
un bandeau de marque : la hauteur gagnée sert à la lecture.

### La synthèse

Elle était une suite de lignes flottantes séparées par des filets, montants en
15 px collés à droite sans support.

Elle devient une **feuille** : surface blanche, rayon 14 px, ombre. Les
montants passent à 17 px en mono tabulaire, alignés à droite, donc comparables
verticalement d'un coup d'œil (L2). Le badge fidéicommis devient une vraie
pastille, avec contour, au lieu d'un mot en ambre posé après le titre.

Chaque ligne porte `.safe-zoom`.

### Le rythme

Deux sections de même rang portaient des titres de tailles différentes, 20 px
puis 18 px, ce qui suggérait une hiérarchie inexistante. Les deux passent à
22 px.

`space-y-6` uniforme remplacé par un rythme intentionnel : 32 px sous le titre
d'écran, **48 px entre les deux sections**. C'est l'écart qui dit qu'on change
de sujet, pas un filet de plus (E3).

### Les animations

- le méga-menu des journaux se déploie avec le zoom léger, `originY: 0` et
  `originX: 0` pour qu'il croisse depuis son bouton ;
- ses entrées, journaux comme raccourcis, reçoivent `.safe-zoom` ;
- l'entrée du contenu de journal glissait de 10 px sur 450 ms à chaque
  changement d'onglet. Supprimée : c'est une animation d'accueil, pas un retour
  d'état (MO2).

### Vérification

`tsc` propre, **1 439 tests verts**, route en 307.

## Conformité, et le zoom généralisé aux rangées

### Pourquoi le zoom ne marchait pas sur cette page

Il n'y était pas. Les obligations de `ReadinessOverview` étaient des `<li>` sans
aucun traitement de survol : ni fond, ni ombre, ni transition. Rien à corriger,
tout à poser.

- la liste monte sur une **feuille** ;
- chaque rangée reçoit `.safe-zoom-rang` ;
- l'état vide et le repli des domaines conformes suivent.

### Un détail de sens, corrigé au passage

Le lien « Corriger » était peint en `si-verified`, le vert de **validation**,
sur une ligne qui dit précisément le contraire : cette obligation n'est pas
remplie. Passé à l'encre avec soulignement au survol. Le vert ne doit annoncer
qu'une chose, et ce n'est pas « il reste à faire ».

### Rangée ou carte : deux variantes, deux usages

`.safe-zoom` porte un `translateY`. Juste pour une carte autonome, faux pour une
rangée bornée : elle se décalerait de sa voisine et romprait l'alignement.
`.safe-zoom-rang` grandit par son centre et passe au-dessus, sans jamais bouger
de sa ligne. Les listes prennent la seconde.

### Généralisation

Plutôt que d'attendre la page suivante, **34 rangées dans 32 fichiers** ont reçu
le traitement. Le passage ne touche que les `<tr>` qui portaient déjà un survol
de fond : c'est la signature d'une rangée de données, par opposition à un
en-tête ou à une ligne de total.

### Vérification

`tsc` propre, **1 439 tests verts**, sept routes en 307.

### Observé, non corrigé

`/conformite` s'affiche en anglais (« Compliance Dashboard », « By-Law 9 (LSO) »)
dans une interface française. C'est probablement voulu : la réglementation
affichée est localisée par province, et l'Ontario relève de la LSO en anglais.
À confirmer plutôt qu'à corriger à l'aveugle.

## Comptabilité : les boutons existaient, personne ne les voyait

« Il manque des boutons dans les pages de compta pour rajouter manuellement une
écriture. »

### Ce qui existait déjà

| Onglet | Actions | État |
|---|---|---|
| Journal général | Nouvelle écriture, Exporter CSV | présentes, branchées sur `createManualJournalEntryAction` |
| Dépenses | Importer un reçu | présente |
| Paiements | Enregistrer un paiement, Importer une preuve | présentes |

Rien ne manquait dans le code. Deux causes rendaient ces boutons invisibles ou
introuvables.

### Cause 1 : la permission

`canManageExpenseJournal` valait `admin_cabinet`, `comptabilite`, `assistante`.
L'avocat ne pouvait ni saisir une écriture, ni importer un reçu, ni enregistrer
un paiement dans son propre cabinet. Tenable avec une adjointe ou un comptable,
faux pour un solo. `avocat` ajouté, dans la continuité de la décision prise
pour les clients et les dossiers.

### Cause 2 : trois emplacements pour la même fonction

Le journal général projetait ses actions sur la ligne de titre de la section.
Les dépenses et les paiements les posaient dans leur propre barre, au-dessus de
leur contenu. Changer d'onglet déplaçait donc les commandes, et l'œil devait
les rechercher.

Un composant partagé, `ActionsSection`, porte désormais la projection. Les
trois onglets posent leurs actions au même endroit. Hors de la page
Comptabilité, chaque vue reste autonome et rend ses actions à sa place.

### Les raccourcis complétés

Trois destinations ajoutées au méga-menu : **Rapprochement**, **Taxes**,
**Rapports**. Chacune vérifiée contre `lib/routes.ts` et l'arborescence : les
neuf destinations du menu existent. Un lien vers une route absente coûte plus
cher qu'un lien manquant.

### Une lacune réelle, signalée et non comblée

Le journal des **dépenses** n'a aucune action de création manuelle côté
serveur. Ses écritures viennent d'un import bancaire ou d'un reçu, et les
actions disponibles sont valider, éditer, catégoriser, ignorer.

Aucun bouton n'a donc été ajouté là : il n'aurait mené nulle part. Si la saisie
manuelle d'une dépense doit exister, c'est une fonction à écrire, pas un bouton
à poser.

### Vérification

`tsc` propre, **1 442 tests verts**, six routes vérifiées.

## Simulation d'activité : un générateur, pas un jeu de données

Demande : au moins 25 clients dans le cabinet de Camille Roy, joignables à
`ptiahou@gmail.com` pour vérifier les envois et les rappels, avec toute
l'activité qui va avec. Et une contrainte explicite : **pas de code codé en
dur**.

### Ce qui est engendré plutôt qu'écrit

`scripts/simuler-activite.mjs`. Trois choix portent la contrainte :

- **les noms se composent** à partir de vocabulaires courts et combinatoires,
  pas d'une liste de vingt-cinq personnes recopiées ;
- **les montants se déduisent** du travail saisi : minutes × taux → sous-total
  → TPS 5 % → TVQ 9,975 % → total. Jamais un total tiré au hasard. C'est ce qui
  rend la simulation vérifiable : les chiffres de la facture correspondent aux
  heures du dossier ;
- **les dates remontent depuis aujourd'hui**, donc le jeu vieillit tout seul et
  les retards se creusent sans qu'on y touche.

Tout est paramétrable par variable d'environnement : cabinet, boîte de
réception, nombre de clients, profondeur d'historique, graine.

### Le tirage est déterministe

Même graine, même cabinet. On peut rejouer, comparer deux états, et décrire un
cas précis sans capture d'écran. Une simulation qu'on ne peut pas reproduire ne
sert qu'une fois.

### Le courriel

Toutes les adresses sont sous-adressées : `ptiahou+c01@gmail.com`,
`ptiahou+c02@…`. Les 25 arrivent dans la même boîte, chacune reste
identifiable, et les envois comme les relances sont réellement vérifiables.

Contrôlé : **25 adresses sur 25** se livrent dans `ptiahou@gmail.com`, et les
25 sont distinctes.

### Ce que le cabinet contient maintenant

| | |
|---|---:|
| Clients | 25 · 21 actifs, 4 inactifs, 2 archivés |
| Dossiers | 37, sur cinq matières |
| Heures | 171 entrées · 381 h · 108 875 $ |
| Factures | 24 · 11 payées, 6 partielles, 4 envoyées, **3 en retard** |
| Paiements | 17 |
| Fidéicommis | 122 475 $, dont **un solde négatif** |

Les trois factures en retard et les dix autres impayées donnent 13 cas
relançables. Le solde négatif est volontaire et unique : c'est un manquement à
B-1 r.5, il doit exister pour être visible, sans devenir la norme.

### Vérifié

**Zéro facture sur 24** dont l'arithmétique ne tombe pas juste : sous-total plus
taxes égale total, et total moins encaissé égale solde, à deux décimales près.

### Réversible

`PURGER=oui` retire tout ce que le script a créé, et rien d'autre : chaque
client engendré porte une marque dans ses notes confidentielles, et la purge
ne remonte que par elle.

## Aujourd'hui : ni la même police, ni la même palette

### Ce n'était pas un problème de chargement

Contrairement à l'éditeur, la police se chargeait correctement. L'écart venait
d'ailleurs : cette page **titrait en sans-serif** (`text-2xl` sur
`text-neutral-900`) quand tous les autres écrans titrent en Instrument Serif.
Passée à `font-serif text-[32px]`, comme le registre clients et la
comptabilité.

### Une palette privée de plus

`AaliyahTodayView` portait sa propre table de tons, six couleurs en
hexadécimal héritées d'une génération antérieure :

| Rôle | Valeur | Devient |
|---|---|---|
| erreur | `#8A3A2D` sur `#F3D8D2` | `danger-ink` sur tint danger |
| avertissement | `#8B6B1F` sur `#F5E6C8` | `amber-ink` sur tint amber |
| succès | vert sur `#D4E8D9` | `verified` sur tint verified |
| marque | vert sur `#EEF5F0` | encre sur `surface2` |
| atténué | `#71717A` sur `#FAFAFA` | `muted` sur `surface2` |

Plus sept classes `neutral-*` et un dégradé peint à la main
(`linear-gradient(180deg,#F4FAF6,#FFFFFF)`), devenu une feuille.

**Zéro hexadécimal restant** dans le fichier, zéro `neutral-*`.

### Les animations

Les cartes deviennent des feuilles, et tout ce qui se clique porte
`.safe-zoom` : entrées de la Navette, liens de dossiers, actions du jour.

### Un incident de compilation, et sa vraie cause

`tsc` a signalé quatre noms manquants dans `components/ui/registre.tsx`, à des
lignes au-delà de la fin du fichier. Ce fichier est **non suivi par git** :
il vient d'une session parallèle qui l'écrivait au moment du contrôle. Une
seconde exécution est passée sans rien changer.

À retenir : une erreur qui pointe hors des bornes d'un fichier signale un
fichier en cours d'écriture, pas un défaut de code.

### Vérification

`tsc` propre, **1 442 tests verts**, quatre routes en 307.

## Trois correctifs sur la facturation et les heures

### Le retour ne revenait nulle part

Le bouton de retour de « Nouvelle facture » appelait `router.back()`. Cette
fonction ne fait **rien** quand la page a été ouverte directement : il n'y a
pas d'entrée d'historique à remonter, et c'est exactement le cas d'un onglet
ouvert sur l'URL.

La destination est connue, on la nomme : un `Link` vers `/facturation`. En
prime, le clic du milieu et l'ouverture dans un onglet fonctionnent, ce qu'un
bouton ne permet pas. « Annuler » suit la même route.

### La pastille se coupait en deux

« Non facturée » passait à la ligne dans sa propre pastille. Un libellé d'état
n'est pas un paragraphe : `whitespace-nowrap` posé dans la primitive
`StatusBadge`, donc partout d'un coup.

### La table des heures rejoint la grammaire des registres

`TimeEntriesTable` n'avait pas été migrée : rangées en `border-si-line/80` sans
zoom, en-têtes en 12 px écrits à la main, aplat gris quand son menu s'ouvrait.

Elle emploie désormais les classes partagées de `components/ui/registre` :
`registreHeadRowClass`, `RegistrePlainHeader`, `registreRowClass` et les
cellules typées. Même survol, mêmes tailles, même alignement des montants que
le registre clients.

### Deux sessions sur le même dépôt

`tsc` a signalé une erreur de typage dans `NotesCreditView`, un fichier modifié
sept minutes plus tôt par une session parallèle : `res.json()` rend `any`, la
liste arrivait donc en `unknown[]`, le crochet générique se figeait sur
`unknown`, et l'annotation répétée dans le rappel de `map` ne pouvait plus
coller.

Corrigé à la source : le type se déclare une fois sur la liste, et le rappel
l'infère. C'est la deuxième fois aujourd'hui qu'un fichier d'une autre session
casse la compilation. Le risque de collision est réel.

### Vérification

`tsc` propre, **1 442 tests verts**, quatre routes en 307.

## Rapports : un titre faux, et des chiffres qui ne se parlaient pas

### « Dashboard financier » n'est pas du français

La clé `rapports.financialDashboard` valait littéralement « Dashboard
financier » en français, et « Financial dashboard » en anglais. Le mot anglais
avait simplement été laissé dans la traduction.

Devenu **« Tableau de bord financier »**, terme recommandé par l'Office
québécois de la langue française. Même correction sur la description de la
page.

### L'incohérence des chiffres venait de ma simulation

« Paiements reçus 47 077 $ » face à « Revenus facturés 0,00 $ » : deux nombres
qui ne peuvent pas coexister. Le CEO l'a vu, et il avait raison de s'en
inquiéter.

**Deux défauts de mon générateur**, pas de l'application :

1. **Le statut canonique manquait.** Les rapports filtrent sur `invoiceStatus`
   (`ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`). Le générateur ne remplissait
   que le champ hérité `statut` et laissait `invoiceStatus` à `DRAFT`. Les 24
   factures existaient donc pour le registre et n'existaient pas pour la
   comptabilité. Les paiements, eux, ne dépendent pas de ce statut : d'où
   l'encaissement sans facturation.

2. **Le fidéicommis n'avait aucun mouvement.** `getGlobalTrustBalance` additionne
   les `TrustTransaction` ; `client.trustAccountBalance` n'est qu'un cache. Le
   générateur remplissait le cache sans écrire les transactions.

Corrigé et rejoué. Réconciliation vérifiée :

| Mesure | Valeur |
|---|---:|
| Factures visibles au rapport | 31 |
| Revenus facturés HT | 75 769 $ |
| Paiements reçus | 49 055 $ |
| Factures impayées | 38 060 $ |
| Fidéicommis, somme des transactions | 89 275 $ |
| Fidéicommis, cache client | 89 275 $ |

**Les deux sources du fidéicommis concordent au dollar près.** C'est le
contrôle qui compte : un cache qui ment sur un compte en fiducie est un
manquement, pas un défaut d'affichage.

### Un point décimal en français

`354.25 h` : le gabarit interpolait le nombre brut. Les heures et le taux de
réalisation passent par `Intl.NumberFormat` avec la locale active, comme les
montants le faisaient déjà.

### Le zoom et le dégradé

Navigation latérale, boutons de filtre et de téléchargement, cartes de chiffre :
tous portent `.safe-zoom`. Le dégradé écrit à la main dans ce fichier rejoint
`.safe-action-degrade`, et le graphique peignait ses axes en `#5A665F`, l'ancien
gris, désormais `var(--si-muted)`.

### Vérification

`tsc` propre, **1 442 tests verts**, quatre routes en 307.
