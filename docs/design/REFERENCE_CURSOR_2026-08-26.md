# Référence Cursor — relevé mesuré du 2026-08-26

> Relevé fait dans le navigateur sur `cursor.com` et `cursor.com/pricing`, en
> 1440 × 900. **Tout ce qui suit est mesuré**, pas observé à l'œil. Ce qui est
> une déduction est écrit comme telle.
>
> Ce document sert de base à une révision de la vitrine SAFE page par page. Il
> ne dit pas de copier Cursor : il dit ce que Cursor fait, chiffres à l'appui,
> pour qu'on décide en connaissance de cause.

---

## 1 · La couleur

Cursor est **sombre et chaud**, jamais neutre.

| Rôle | Valeur | Remarque |
|---|---|---|
| Fond de page | `rgb(20, 18, 11)` | Un noir qui tire sur l'olive. R > V > B. |
| Texte | `rgb(237, 236, 236)` | Blanc cassé, jamais `#FFF`. |
| Surface levée | `rgb(27, 25, 19)` | +7 points seulement sur le fond. |
| Surface plus haute | `rgb(32, 30, 24)` puis `rgb(38, 36, 30)` | Une échelle, pas deux états. |
| Panneau chaud | `rgb(60, 57, 53)` et `rgb(74, 68, 59)` | Réservé aux grands blocs d'illustration. |
| Accent unique | `rgb(245, 78, 0)` | **8 occurrences sur toute la page d'accueil.** |
| Accent secondaire | `rgb(131, 200, 240)` | Presque toujours dans une capture, pas dans la page. |

**Deux enseignements chiffrables.**

Le contraste entre le fond et la première surface est de **7 points sur 255**.
C'est presque rien. Le relief ne vient pas du contraste, il vient de la
répétition : quatre paliers de gris chaud, chacun à sept ou huit points du
précédent.

L'accent orange sert **huit fois** sur une page de 8 337 px. Il ne colore aucun
fond, aucun bouton principal, aucun titre : seulement des liens de sortie de
section (« Découvrir les automatisations → »). Le bouton principal est blanc
sur fond sombre, sans couleur du tout.

## 2 · La typographie

Trois familles seulement : **CursorGothic** (sans), **berkeleyMono** (mono),
**EB Garamond** (serif, uniquement à l'intérieur des captures de produit).

L'échelle réelle, relevée sur les nœuds visibles :

| Emploi | Taille | Interligne | Graisse |
|---|---|---|---|
| Titre de la page d'accueil | **26 px** | 32,5 px (1,25) | 400 |
| Titre de section | **22 px** | 28,6 px (1,30) | 400 |
| Sous-titre dans une section | 16 px | 24 px | 400 |
| Texte courant | **15 px** | — | 400 |
| Exergue, méta, libellé | 12 px | 16 px | 400 |
| **Le seul grand caractère** | **72 px** | 79,2 px (1,10) | 400 |

**Le fait le plus important du relevé.** Le titre du héros fait **26 px**. Le
dernier titre de la page, « Commencez avec Cursor. », fait **72 px**, soit
**2,8 fois plus gros**. La page finit plus fort qu'elle ne commence.

**Le second.** 222 nœuds de texte sont à 15 px, et presque tout est en graisse
**400**. Il n'y a ni gras ni demi-gras dans la page : la hiérarchie tient à la
taille et à l'opacité du blanc, jamais au poids.

Sur `/pricing`, le titre est à **52 px et centré**, alors que tous les titres de
l'accueil sont à gauche. C'est le seul endroit où ils centrent un titre.

## 3 · La grille et le rythme

- Colonne de contenu : **1300 px**, marge de **70 px** de chaque côté en 1440.
- Rembourrage vertical des sections : **0, 31,5, 63, 105, 126 px**. Tous
  multiples de 10,5. Déduction : leur unité de base est 10,5 px (ou 21 px avec
  des demi-pas).
- 14 sections pour 8 337 px de page.
- Une seule section fait **3 966 px** et contient **12 images** : c'est la scène
  pilotée au défilement.

## 4 · Les images

C'est ce qui distingue le plus Cursor, et c'est mesurable.

**Les captures ne sont pas décorées.** Rayon de bord : **4 px**. Aucune bordure.
Aucune ombre portée. Rien du traitement « carte » habituel.

**Elles débordent volontairement.** La capture du héros fait 1 300 px de large
dans une colonne de 1 300 px, et se prolonge sous le pli. Plusieurs panneaux
contiennent une capture plus grande qu'eux, rognée par le bord du panneau.
L'image ne tient jamais entièrement dans son cadre.

**La densité est réelle.** Une capture mesurée : affichée en 241 × 135, servie
en 1 024 × 683, soit **4,26 fois** la densité affichée. Ils servent quatre fois
la résolution nécessaire plutôt que deux.

**Une seule vidéo sur toute la page d'accueil**, et aucun canvas. Le mouvement
vient du défilement, pas de fichiers lourds.

**Ce que les captures montrent.** Toujours un logiciel réel, avec sa barre de
titre macOS, ses pastilles, son texte lisible. Jamais un schéma, jamais une
illustration abstraite. La seule image non-produit est un paysage peint, et
c'est le fond d'écran DANS la capture.

## 5 · La page de tarifs

Relevée le même jour, et elle contredit ce que SAFE fait aujourd'hui.

- **Quatre paliers, aucune carte.** Fond transparent, bordure de 0 px, rayon de
  0 px. Les colonnes sont séparées par des filets verticaux, sur une bande
  légèrement levée. Pas de surface blanche, pas de coin arrondi.
- Colonnes de **288 px**, de hauteurs différentes (708, 507, 631, 579) : ils
  n'égalisent pas non plus.
- Nom du palier à **22 px**, la même mesure qu'un titre de section.
- Un sélecteur mensuel/annuel en pilule, centré sous le titre.
- **La section des questions est exactement celle qu'on vient de bâtir** : titre
  à gauche à 36 px, questions repliées à droite à 16 px, chevron à droite de
  chaque intitulé.
- La page se ferme sur le même très grand titre centré et deux boutons.

## 6 · Ce que SAFE fait autrement, sans jugement

| Point | Cursor | SAFE aujourd'hui |
|---|---|---|
| Fond | Sombre chaud, `rgb(20,18,11)` | Clair, albâtre |
| Écart fond / surface | 7 points | Plus marqué, avec bordure |
| Accent | 8 occurrences sur la page | Le vert forêt revient partout |
| Titre du héros | 26 px | 26 px — **identique** |
| Titre de section | 22 px | 22 px — **identique** |
| Dernier titre de la page | 72 px | 22 px, comme les autres |
| Cartes de forfait | Aucune carte, filets verticaux | Cartes blanches, rayon 14 px, bordure |
| Captures | Rayon 4 px, sans bordure ni ombre | Rayon plus fort, bordure, ombre portée |
| Débordement des images | Systématique | Les fenêtres tiennent dans leur cadre |
| Densité servie | 4,26× | 2,5× |

Les deux échelles de titre coïncident déjà. Les écarts réels sont **le grand
titre de fin**, **le traitement des cartes de forfait** et **le débordement des
images**.

---

## Ce qui reste à relever

`/agents`, `/enterprise`, `/models`, `/resources` n'ont pas été mesurés. Le
relevé a porté sur l'accueil et les tarifs, à la demande du CEO, pour ouvrir
une révision page par page.
