# SAFE — Spécification de l'interface

> **Statut** : décisions prises et appliquées les 10 et 11 août 2026, plus les
> règles qui en découlent et restent à propager.
> **Portée** : intérieur de l'application et vitrine.
> **Remplace** : la direction « Registre calme » proposée dans
> [REFONTE_DESIGN_SYSTEM_SAFE_2026.md](REFONTE_DESIGN_SYSTEM_SAFE_2026.md),
> dont la palette albâtre et l'accent vert ont été écartés à l'usage.

---

## 1. Ce qui rend cette interface premium

Quatre propriétés, et aucune n'est un effet.

**La couleur est rare et signifiante.** Un écran de travail est achromatique.
Le vert, l'ambre et le rouge n'apparaissent que sur un état : validé, à
vérifier, bloquant. Sur le registre clients, une seule couleur non neutre
subsiste sur toute la page. Le luxe, ici, c'est de ne pas avoir besoin de
couleur pour se repérer.

**Les surfaces ont une hiérarchie mesurable.** Page, carte, creux : trois
marches, un rôle chacune, et un bord de contrôle au-dessus du seuil de
perceptibilité. Un champ se voit sans qu'on le cherche.

**Le mouvement obéit à une seule courbe.** `cubic-bezier(0.16, 1, 0.3, 1)`.
Départ vif, arrêt long. C'est la décélération qui donne la sensation de
matière ; l'uniformité de la courbe donne celle d'un seul objet.

**Chaque écart se justifie par écrit.** Un rayon, une opacité, un retrait
optique portent un commentaire qui dit pourquoi. Une interface premium n'est
pas une interface décorée, c'est une interface où rien n'est arbitraire.

---

## 2. Fondations

### 2.1 Couleur

Source unique : `lib/ds/palettes.ts`. Aucune valeur littérale ailleurs.

| Rôle | Jeton | Valeur |
|---|---|---|
| Page | `canvas` | `#EBEDEF` |
| Carte | `surface` | `#FFFFFF` |
| Creux de champ | `surface2` | `#F4F5F7` |
| Filet de structure | `border` | `#D6D9DD` |
| Bord de contrôle | `border-strong` | `#888E94` |
| Encre, action | `ink` · `forest` | `#1A1A1A` |
| Survol d'action | `forest-soft` | `#2F3133` |
| Corps | `body` | `#3C3E40` |
| Métadonnée | `muted` | `#65686B` |
| Désactivé | `subtle` | `#85888C` |
| Validé | `verified` | `#26654A` |
| À vérifier | `amber` · `amber-ink` | `#8A6412` · `#6E4F0E` |
| Bloquant | `danger` · `danger-ink` | `#A83232` · `#862626` |
| Accent éditorial | `brand-green` | `#2E7D5B` |

**Règles de couleur**

1. L'action est achromatique. Une seule action pleine par écran.
2. `brand-green` ne dit jamais un état ; `verified` ne sert jamais d'accent.
3. Un état porte toujours un libellé et une forme, jamais la teinte seule.
4. Le décoratif n'a pas droit à la couleur.

**Contrastes mesurés sur `canvas`** : ink 15,5:1 · body 9,6:1 · muted 5,0:1 ·
verified 6,2:1 · bord de contrôle 3,31:1 sur carte et 3,03:1 sur creux · blanc
sur l'action 17,4:1.

### 2.2 Typographie

**Instrument Serif** pour les titres, **Geist Sans** pour tout le reste,
**Geist Mono** obligatoire pour montants, soldes, heures, dates comptables et
références. Duo de charte, inchangé.

Un titre serif exige un alignement optique : la capitale porte une approche
latérale qui la fait paraître rentrée. Retrait de `0,055em` sur les grands
titres éditoriaux.

### 2.3 Espacement

Base 4 px. Ce n'est pas l'échelle qui compte, c'est la relation.

| Relation | Écart |
|---|---:|
| Titre et sa description | 8 px |
| Libellé et son champ | 8 px |
| Deux champs d'un même groupe | 24 px |
| Deux sections | 48 px |
| Bord de page (mobile · tablette · bureau) | 16 · 24 · 32 px |

### 2.4 Formes

| Rôle | Rayon |
|---|---:|
| Tableau, section dans le flux | 0 à 4 px |
| Bouton, champ | 6 px |
| Panneau autonome | 8 px |
| Menu, dialogue, surface flottante | 12 px |
| Pastille d'état | plein |

Quatre rayons, quatre rôles. Un rayon identique partout est un défaut de
gabarit (A4).

### 2.5 Mouvement

Courbe unique `cubic-bezier(0.16, 1, 0.3, 1)`.

| Usage | Durée |
|---|---:|
| Couleur au survol | 140 ms |
| Ouverture locale | 180 ms |
| Déplacement d'indicateur | 280 ms |

Aucune animation continue. Aucun déplacement décoratif au survol dans les
registres. `prefers-reduced-motion` neutralise la loupe et l'indicateur sans
casser la navigation.

---

## 3. Le châssis

### 3.1 La barre supérieure

Surface flottante, pas bandeau.

- retrait de 12 à 16 px du haut, `max-w-[1320px]` centré ;
- rayon 12 px, filet à 10 % d'encre, **une** ombre ;
- verre : surface à 72 %, flou 20 px, saturation 1,35 à 1,4 ;
- deux replis opaques obligatoires : absence de `backdrop-filter`, et
  `prefers-reduced-transparency`.

**La marque ne se comprime jamais** (`shrink-0`). C'est la règle qui manquait,
et son absence avait écrasé la section gauche à 0 px de large.

**Sous 1 280 px, les libellés se replient sur leurs icônes**, `aria-label` et
`title` conservés. Six libellés ne tiennent pas sans écraser quelqu'un.

### 3.2 Sélection et loupe

Deux mécanismes distincts, complémentaires.

**L'indicateur** est une pastille unique qui se déplace vers l'entrée active ou
survolée. Un seul objet bouge, l'œil le suit au lieu de recommencer sa lecture.
280 ms sur la courbe unique.

**La loupe** grossit chaque entrée selon sa distance au curseur, suivant une
courbe en cloche : amplitude 1,14 au centre, rayon 150 px. Mesuré à l'usage,
les voisines reprennent 1,07, les suivantes 1,01. Les styles sont écrits dans
le DOM depuis une boucle d'animation, jamais par un rendu React : une position
de souris ne doit pas déclencher soixante rendus par seconde.

**Interdit** : `overflow-hidden` sur la navigation. Le garde-fou paraît sain et
rogne les panneaux déroulants, qui descendent sous la barre. Le repli des
libellés suffit à empêcher le débordement.

### 3.3 Le fond

Un seul aplat, `var(--si-canvas)`, identique sur la vitrine et dans
l'application. Aucun dégradé atmosphérique. Un verre tire sa matière du contenu
qui défile dessous, pas d'un dégradé peint sous lui.

---

## 4. Les écrans

### 4.1 Le registre

Une colonne porteuse large, des métadonnées comprimées, les montants à droite.

- identité sur deux lignes : nom en encre, contexte atténué en dessous ;
- montants en mono tabulaire, alignés à droite, comparables verticalement ;
- filets horizontaux seulement, jamais de grille complète ;
- **un** menu de ligne persistant, jamais quatre icônes ;
- en-tête de colonne uniquement s'il sert à trier ou filtrer ;
- temps relatif court, date complète au survol ;
- un solde négatif porte son signe, sa graisse et sa couleur d'urgence.

### 4.2 Le formulaire

- libellé en encre 13 px, pas en gris ;
- champ en creux gris sur la carte, bordure au-dessus de 3:1 ;
- au focus, le fond blanchit et un anneau apparaît : le champ s'ouvre ;
- 24 px entre deux champs, 48 px entre deux sections.

### 4.3 Le tableau de bord

L'ordre suit la décision, pas l'inventaire.

1. ce qu'il faut faire maintenant, avec son geste, en pleine largeur ;
2. l'état réglementaire, en une bande fine ;
3. les chiffres du mois ;
4. ce que le cabinet attend de vous ;
5. obligations, finances, activité, en **colonnes égales** ;
6. la configuration, en dernier : elle finira par disparaître.

### 4.4 L'éditorial

Seul endroit où la grille cède.

- alignement optique des titres serif ;
- largeurs de lecture qui varient légèrement d'un bloc à l'autre ;
- décalages horizontaux de 2 à 6 px entre exergue, titre et chapeau ;
- accent éditorial en `brand-green`, jamais en `verified`.

**Cette liberté s'arrête à l'éditorial.** Dans les registres et les
rapprochements, l'alignement sert à vérifier des chiffres : la grille y reste
rigoureuse (DESIGN_HUMAIN §11).

---

## 5. Ce qui reste à faire

| Chantier | Volume |
|---|---|
| Propager surfaces et champs écran par écran | l'intérieur suit le jeton, la respiration se règle à la main |
| Réorganiser les groupes de navigation | décision d'architecture, pas de style |
| Retirer les vocabulaires anciens du code | environ 900 usages neutralisés par rebranchement, à réécrire au fil de l'eau |
| Trancher la teinte du logo | seul élément chromatique de la vitrine |
| Retirer les routes `/ds-preview/*` | temporaires, à supprimer une fois validées |

---

## 6. Comment vérifier

Aucune de ces règles ne se juge à l'œil seul. Chacune se mesure.

- contraste : lire les couleurs calculées dans le navigateur, pas la source ;
- surfaces : rapport entre page, carte, champ et bord ;
- reflow : `scrollWidth === clientWidth` à 320 px ;
- débordement : largeur demandée contre largeur disponible sur chaque section ;
- couleur : compter les teintes non neutres rendues sur une page.

Le pipeline CSS ment parfois : le minifieur retire `backdrop-filter` non
préfixé, et Turbopack ressert des chunks périmés après modification d'un jeton.
**Toujours vérifier la valeur servie, jamais la valeur écrite.**
