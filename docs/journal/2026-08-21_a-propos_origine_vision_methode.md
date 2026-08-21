# « À propos » raconte maintenant une suite, plus seulement un fichier Excel

> 21 août 2026. Le texte verrouillé du 13 août est explicitement rouvert par le
> CEO. La page passe du récit de naissance à l'origine, la vision et la méthode.

## Ce qui change, et pourquoi

L'ancienne page répondait à une seule question : comment un fichier Excel est
devenu un logiciel. C'était juste, et c'était devenu trop étroit. SAFE se
présente désormais comme une suite (application centrale, outils autonomes,
accompagnement), et une page « à propos » qui s'arrête au classeur laisse
croire que le classeur est encore toute l'identité du produit.

La nouvelle page répond à trois questions dans l'ordre : d'où ça vient, où ça
va, comment c'est construit.

| Élément | Décision | Motif |
|---|---|---|
| Sommaire collant de cinq chapitres | **Retiré** | Trois mécanismes de lecture (sommaire, trace, réduction des titres) pour une page qui se lit en descendant. |
| Trace animée dans la marge | **Retirée** | Un dessin qu'il fallait légender pour qu'il veuille dire quelque chose. |
| Titres qui se réduisent une fois lus | **Retiré** | Coûteux à tenir (hauteurs figées au montage) pour un gain de lecture nul. |
| Chaîne horizontale de six domaines | **Retirée** | Détail de fonctionnalités : cela appartient à SAFE Cabinet. |
| Portrait au chapitre 05 | **Remonté au hero** | Le fondateur arrivait après quatre écrans. |
| « Excel est devenu SAFE » + « Le produit a changé » | **Fusionnés** | Deux fois la même idée, à deux chapitres d'écart. |
| Origine dans le quotidien d'un cabinet | **Conservée** | C'est la crédibilité de la page. |
| Le premier fichier Excel | **Conservé, avec preuve** | Voir plus bas. |
| Vision de suite, méthode de construction | **Ajoutés** | Les deux moitiés qui manquaient. |

## La grammaire visuelle vient du site, pas de la page

La page portait sa propre feuille de style injectée, ses propres jetons
(`--ap-t1` à `--ap-t5`) et sa propre mécanique de défilement. Elle emprunte
maintenant la grammaire de `FeaturesPage.tsx`, refondue la veille : sections
alternées `BG` / `SURFACE` posées sur un filet, exergue mono numérotée, titre
serif, prose Geist, preuves encadrées, une seule action pleine à la fin.
Aucune couleur en dur, aucun jeton local, aucune feuille injectée.

Six compositions, aucune répétée (A17) : titre à gauche et ruptures à droite,
colonne d'artefact étroite, preuve à droite, trois blocs de poids inégaux,
registre numéroté, colonne unique.

## L'artefact du classeur

`public/experience-assets/excel-avant.jpg` est la capture du classeur d'origine
fournie par le CEO (provenance au journal du 2026-07-25). Elle porte des noms
d'avocats et des montants. Elle est donc **recadrée sur le seul sommaire**, et
le recadrage est un fichier distinct, `public/images/a-propos/classeur-origine.png` :
la zone confidentielle ne quitte jamais le disque, alors qu'un recadrage en CSS
aurait servi l'image entière au navigateur.

Ce que le recadrage montre suffit à l'argument : le classeur avait déjà la forme
d'un système, tableau de bord, temps, facturation, paiements, dépenses et
débours, registres, rapports, paramètres.

## Ce qui n'est pas dit

- Aucun chiffre. « Trente minutes pour une facture » n'a jamais été démontré et
  n'apparaît pas.
- Aucun logiciel du marché nommé, aucun cabinet d'origine nommé.
- Le seul outil nommé est le patrimoine familial, le seul publié. La pension
  alimentaire existe dans l'arbre de travail mais reste « en construction » sur
  l'index : elle n'est pas annoncée ici.
- La formation du fondateur est citée telle qu'elle est documentée,
  administration et comptabilité de petite entreprise, sans ajout.
- La responsabilité professionnelle demeure celle du cabinet, écrit en toutes
  lettres à la fin.

## Vérifications

| Contrôle | Résultat |
|---|---|
| `tsc --noEmit` | propre |
| `eslint` (fichiers touchés) | propre |
| `vitest run` | 1865 tests, 151 fichiers, tout passe |
| `next build` | compile, `/a-propos` à 5,46 ko |
| Débordement horizontal à 320, 390, 820, 1280, 1440 px | 0 |
| Blocs restés invisibles, aux cinq largeurs | 0 |
| `prefers-reduced-motion: reduce` | 0 bloc invisible, page complète |
| **Sans JavaScript** | 0 bloc invisible, hauteur identique à la version avec script |
| Console | une seule alerte, CSP report-only, préexistante et hors page |

**Le repli sans script est nouveau.** `fadeUp` écrit `opacity:0` au rendu
serveur et framer-motion la relève au montage : sans script, la page serait
restée blanche. Un `<noscript>` local repose `[data-revele]` à l'opacité 1. Le
même trou existe sur toutes les autres pages de la vitrine.

## Ce qui reste ouvert

- **Contraste des étiquettes `FAINT`.** 18 éléments sous AA sur la page :
  numéros d'exergue, surtitre du hero, note de bas de page, plus six libellés
  internes à la maquette partagée. Mesuré à l'identique sur `/fonctionnalites` :
  c'est un usage de jeton commun à toute la vitrine, pas une dérive de cette
  page. Deux endroits propres à la page ont été remontés à `MUTED` (la légende
  de l'artefact, les trois étiquettes de dimension). Le reste est une décision
  de site à prendre en une fois.
- **Authenticité du classeur.** Elle repose sur le journal du 2026-07-25, qui
  la déclare fournie par le CEO. Non vérifiable autrement depuis le dépôt.
- **L'acronyme visible dans l'artefact** (« Système automatique de facturation
  et d'exploitation ») n'est documenté nulle part ailleurs. Il n'est donc pas
  repris en prose : il n'existe que dans l'image, comme détail d'époque.
