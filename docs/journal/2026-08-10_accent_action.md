# 2026-08-10 — L'action perd sa couleur

Suite du socle de couleur. Palette **Ardoise** retenue, puis une observation du
CEO en regardant l'écran de connexion : « je vois que c'est plus du bleu qui a
été mis en valeur ».

## Ce qu'il regardait vraiment

Le bouton « Se connecter » portait, écrit à la main :

```
bg-text-primary text-canvas hover:bg-black border-none
```

par-dessus la variante `primary`, qui apporte déjà
`bg-si-forest hover:bg-si-forest-soft`. Les quatre classes coexistaient dans
l'attribut, et c'est l'ordre de la feuille générée qui départageait, pas
l'auteur. Résultat : encre froide au repos, vert au survol. Ce mélange
bleu/vert n'avait jamais été décidé.

Les deux boutons de soumission rendent maintenant la main à la variante.

## Étape intermédiaire : le bleu

Le vert forêt, même assombri, ne tient pas sur un canevas froid. Testé sur
`/ds-preview/accent` avec six candidats en contexte, puis écarté par le CEO :
« le vert assombri que je demandais ne correspond pas au thème ».

**Action = Bleu ardoise `#1C3A5A`, survol `#264C72`.**

Retenu contre Bleu nuit `#12283F` et Bleu encre `#16304C`, trop proches de
l'encre `#16202B` : un bouton plein s'y lisait comme noir, l'accent cessait
d'être une couleur. Contre Bleu acier `#21456B` et Pétrole `#10404A`, plus
présents que la consigne « pas trop vive » ne l'autorisait.

Le survol éclaircit d'un cran au lieu de saturer. Le changement se voit, rien
ne crie.

## Un effet de bord qui répare une faute

Le référentiel interdit que le vert d'action remplace le vert de validation.
Les deux étaient verts, donc confondus : un bouton et une pastille « rapproché »
racontaient la même chose.

Désormais **bleu = ce sur quoi on agit, vert = ce qui est validé**. La grammaire
se lit sans lire le libellé.

Le jeton garde le nom `forest` : il désigne le rôle « action et surface pleine
de marque », pas une teinte. Le renommer coûterait 297 usages pour zéro gain
visuel.

## Le schéma, propagé là où il se voyait le moins

Le CEO voulait « le même schéma partout ». Deux corrections invisibles dans le
diff mais visibles à l'œil :

- Le `body` du layout racine servait `bg-slate-50`, un blanc **chaud**
  (`#FAFAF8`), sous une interface froide. Il suit maintenant le canevas
  (`#F1F3F5`). Cela touche toutes les pages qui ne peignent pas leur propre fond.
- Les écrans d'authentification gardaient des verts hérités : lien « Oublié ? »,
  anneaux de focus des champs, bandeau de succès, exergue « Espace sécurisé ».
  Passés aux jetons `si-*`. Le bandeau de succès reste vert, mais par
  `si-verified` : c'est sémantique, pas décoratif.

Vérifié sur `/connexion` : bouton `rgb(28, 58, 90)`, lien `rgb(28, 58, 90)`,
fond `rgb(241, 243, 245)`, **zéro élément portant encore un vert hérité**.

## Ce qui reste pour « partout »

| Périmètre | Volume | Effort |
|---|---:|---|
| Intérieur de l'app (`si-*`) | 4 818 usages | déjà fait, suit le jeton |
| Écrans d'authentification | 23 usages | fait |
| Vitrine et résidus | ~914 usages · ~130 fichiers | à migrer par lots |

Le détail des résidus : `emerald-` 271, `forest-` 240, `green-` 118,
`gray-` 114, `zinc-` 112, `slate-` 82.

`/ds-preview/accent` reste en place, réduit aux cinq bleus, pour ajuster la
teinte si Bleu ardoise se révèle trop sombre ou trop clair à l'usage.


## Puis le noir

Le bleu n'a pas tenu vingt minutes. « Essayons le noir, étant donné qu'on a un
logo noir. »

**Action = `#16202B`, l'encre elle-même. Survol `#2A3746`.**

Un seul noir traverse maintenant le produit : le titre, le corps, le lien,
l'action. La couleur cesse complètement d'être décorative. Elle ne dit plus que
l'état : vert validé, ambre à vérifier, rouge bloquant.

### Ce que ça coûte

Les 135 usages de `text-si-forest` perdent leur teinte. Les liens se lisent
comme du texte courant, et c'est le soulignement qui porte seul l'affordance.
Défendable en registre éditorial, mais c'est un renoncement, pas un gain.

Vérifié : aucun des 139 fonds d'action n'était apparié à `text-si-ink`, donc
aucun texte n'est devenu invisible. Blanc sur l'action : 16,5:1.

### Les deux noirs qui ne s'accordent pas

Le logo peint `#222222`, un noir **neutre**. L'interface peint `#16202B`, un
noir **froid** : 21 points de bleu de plus que de rouge. Côte à côte sur un
canevas froid, le neutre tire légèrement vers le brun.

Trois issues, et c'est une décision de marque, pas de code :

1. refroidir le `mono-dark` du logo vers `#16202B` : un seul noir partout ;
2. réchauffer l'encre vers `#222222` : contredit le canevas Ardoise ;
3. laisser les deux : l'écart reste subtil, visible surtout en adjacence.

Le premier est recommandé. Il touche `components/brand/safe-mark.ts` et la
charte, donc il attend un arbitrage.

### Une note d'outillage

Turbopack a servi l'ancienne valeur malgré la modification du fichier source :
la valeur périmée était figée dans `.next/server/chunks/ssr/`. Ni un `touch` ni
plusieurs requêtes ne l'ont invalidée. Il a fallu relancer le serveur de
développement. À garder en tête pour tout changement de jeton : si la couleur
ne bouge pas à l'écran, vérifier le chunk avant de douter du code.

Retour au bleu, si besoin : deux valeurs dans `lib/ds/palettes.ts`, notées en
commentaire.

## Propagation : « assure-toi que toutes les pages reflètent la modif »

L'écran d'inscription était resté entièrement vert. Le produit charriait en
réalité **cinq verts différents**, hérités d'époques distinctes.

### Le levier : rebrancher, pas réécrire

Six vocabulaires passaient par `tailwind.config.ts`. Les réécrire aurait fait
130 diffs pour un résultat identique. Deux rampes ajoutées à
`lib/ds/palettes.ts`, et les échelles pointent dessus.

| Vocabulaire | Usages | Nouvelle cible |
|---|---:|---|
| `forest-*` | 240 | rampe froide de l'action |
| `primary-*` · `accent-*` | 74 | rampe froide de l'action |
| `slate-*` | 82 | rampe froide (il servait des neutres **chauds**) |
| `emerald-*` | 271 | rampe du vert de validation |
| `green-*` | 118 | rampe du vert de validation |

`green-*` n'était **pas déclaré du tout** : ses 118 usages retombaient sur le
vert vif par défaut de Tailwind, étranger à la palette. Personne ne l'avait vu.

`emerald` et `green` gardent une teinte : ils portent le plus souvent un sens
(bandeau de succès, montant rapproché). Les rendre achromatiques aurait effacé
ce sens. Trois verts deviennent un seul, celui de la validation.

### Le thème privé de la vitrine

L'accueil est `ExperienceCinema`, qui embarque sa propre feuille de 32 Ko avec
onze variables à lui, restées sur l'ancienne palette, dont `--green: #12A150`,
un vert vif déclaré trois fois dans le dépôt. Les onze pointent maintenant vers
la palette. Les 1 800 lignes de règles en dessous n'ont pas bougé.

### Les valeurs en dur

Environ 150 hexadécimaux hérités, mappés par rôle : ancien vert de marque vers
l'action, verts de validation vers `verified`, sauge vers un neutre translucide
(ce n'était pas une validation, c'était du texte secondaire sur fond sombre).

### Ce qu'il ne fallait pas toucher

Deux régressions évitées de justesse. Le passage automatique avait injecté
`var(--si-forest)` dans six fichiers de **courriel** et de **PDF**. Un client
de messagerie et `@react-pdf/renderer` n'ont pas de cascade : la variable y
rend transparent. Restaurés, puis portés à la valeur littérale `#16202B`, avec
un commentaire qui explique pourquoi elle est en dur et doit être tenue en
phase à la main.

La charte reste intacte : `components/brand/safe-mark.ts`, `lib/ds/tokens.ts`
et la page de contrôle `/marque` n'ont pas été modifiés.

### Vérification

Balayage des couleurs calculées sur dix pages, en distinguant trois familles :
logo, vert de validation, et le reste.

**Zéro vert hors palette.** Tout ce qui reste vert est soit le logo, soit un
état validé.

| Page | Logo | Validé | Hors palette |
|---|---:|---:|---:|
| `/` | 4 | 20 | 0 |
| `/fonctionnalites` | 5 | 35 | 0 |
| `/tarification` | 3 | 0 | 0 |
| `/a-propos` | 5 | 13 | 0 |
| `/audit-gratuit` | 3 | 2 | 0 |
| `/demo` · `/contact` · `/inscription-gate` | 3 · 3 · 2 | 0 | 0 |
| `/connexion` | 0 | 0 | 0 |
| registre clients | 0 | 17 | 0 |

### Ce qui reste

Le logo. Il peint encore `#1F3A2E` et `#2E7D5B`, et il est désormais le seul
élément chromatique de la vitrine. Décision de marque, en attente.

## La barre de navigation devient une surface flottante noire

Demande : « le menu d'en haut arrondi au niveau des bordures, un peu flottant
et surtout de couleur noir, fait matcher les écriture ».

### Deux barres, pas une

La vitrine en avait deux, jamais alignées : `Nav` dans
`components/public-site/shared.tsx` pour les pages intérieures, et un `#nav`
maison dans la feuille privée de `ExperienceCinema` pour l'accueil. Les deux
reçoivent la même spécification.

| | Avant | Après |
|---|---|---|
| Position | collée au bord, pleine largeur | détachée, retrait 14 px en haut, `max(12px, 3vw)` sur les côtés |
| Forme | rectangle, filet en bas | rayon 12 px, celui du plan flottant |
| Fond | albâtre translucide + flou | noir plein `var(--si-forest)` |
| Profondeur | filet | une ombre unique, discrète |
| Libellés | encre sur clair | blanc à 72 %, blanc franc au survol |
| Action | bouton vert | bouton **inversé** : fond blanc, texte encre |
| Logo | ton clair | `mono-light`, ton de charte pour fond sombre plein |

### Pourquoi plein et pas du verre

La barre traverse tout le défilement, y compris les scènes sombres de
l'accueil. Une surface translucide y aurait fait vibrer les libellés d'une
section à l'autre. Le verre exprime une superposition, pas une permanence
(P10) : ici c'est la lisibilité continue qui commande.

### Le texte qui « ne dérange pas »

Blanc pur au repos vibre sur un noir profond. Les libellés se posent à 72 %
d'opacité et passent au blanc franc au survol, avec un fond à 8 %. Contraste
mesuré : **9,1:1 au repos, 16,5:1 au survol**, tous deux au-dessus de AA.

Sur une barre noire, l'action ne peut plus être « plus sombre que le fond » :
elle s'inverse. Fond blanc, texte encre. Une seule action pleine dans la barre.

Les panneaux mobiles des deux navigations suivent : même noir, même rayon,
même détachement, filets internes à 12 % de blanc, voile de fond sur l'encre
de la palette.

### Vérification

À 1024 px : barre de 963 px à x = 31, rayon 12 px, fond `rgb(22, 32, 43)`,
action `rgb(255, 255, 255)` sur texte `rgb(22, 32, 43)`, libellés
`rgba(255, 255, 255, 0.72)`.

À 320 px : accueil et tarification reflowent sans défilement horizontal, barre
de 296 à 298 px, rayon conservé, cible tactile du menu à 44 px.

### Défaut repéré, hors périmètre

`/fonctionnalites` déborde de 3 px à 320 px. La cause est une section de
contenu (« 03 Le temps »), pas la barre, qui tient dans 309 px. Antérieur à
cette passe.

## Correction : ce n'était pas du noir

« Je pense que c'est du bleu foncé que tu as pris, je voulais du noir et du
vert forêt. »

Constat exact, et l'erreur est de mon fait. `#16202B` porte 22 de rouge, 32 de
vert et 43 de bleu : 21 points de bleu de plus que de rouge. C'est un bleu
marine très sombre, pas un noir. Je l'avais même mesuré et documenté en le
qualifiant de « noir froid ». Une couleur à 21 points d'écart n'est pas une
nuance de noir, c'est une autre couleur.

### Position retenue

| Jeton | Avant | Après |
|---|---|---|
| `ink` et action | `#16202B` bleu marine | **`#1A1A1A`**, R = G = B = 26, hue nulle |
| survol | `#2A3746` | `#2F3133` |
| `body` | `#33404E` | `#3C3E40` |
| `muted` | `#5A6775` | `#65686B` |
| `subtle` | `#7C8895` | `#85888C` |
| `canvas` | `#F1F3F5` | `#F1F2F4` |
| `verified` | `#1F7A57` émeraude | **`#26654A`** vert forêt |

Les surfaces gardent un souffle de froid, l'encre n'en a plus. La fraîcheur
que le CEO aimait venait du fond, pas du texte.

Le vert forêt revient, et à un seul endroit : l'état validé. C'est la part de
couleur que le produit s'autorise. « Je ne veux pas autant de couleur, je veux
vraiment du noir et un peu de vert forêt. »

Les deux rampes de retrait suivent : `ECHELLE_ACTION` devient neutre,
`ECHELLE_VALIDE` s'ancre sur le nouveau vert forêt.

### Contrastes, mesurés dans le navigateur

ink 15,5:1 · body 9,6:1 · muted 5,0:1 · verified 6,2:1 · blanc sur l'action
17,4:1, sur son survol 13,1:1.

`subtle` tombait à **2,9:1**, sous le seuil de 3:1 des éléments non textuels.
Assombri de `#8C8F93` à `#85888C` : 3,2:1.

## La barre passe au verre, et le logo retrouve sa teinte

« Le menu du haut peut être dans une couleur un peu plus transparente comme du
glassmorphisme, dans le but de garder la couleur du logo dans sa teinte
initiale. »

La barre noire imposait le ton `mono-light` au logo. En la rendant claire et
translucide, le duo de charte forêt et émeraude redevient lisible.

- fond `rgb(var(--si-surface-rgb) / 0.82)`, flou 18 px, saturation 1,35 ;
- filet à 10 % d'encre, une ombre discrète, rayon 12 px conservé ;
- libellés en `muted`, encre au survol ; action pleine en noir ;
- logo rendu à son ton par défaut, vérifié : `#1F3A2E` et `#2E7D5B`.

Le verre est justifié au sens de P10 : la barre passe au-dessus d'un contenu
qui doit rester perceptible pendant tout le défilement. Deux replis opaques
sont posés, pour les navigateurs sans `backdrop-filter` et pour
`prefers-reduced-transparency`.

### Un piège du pipeline CSS

Le flou ne s'appliquait pas malgré une règle correcte. Le minifieur CSS de la
chaîne de build **supprimait la propriété non préfixée** et ne conservait que
`-webkit-backdrop-filter`, sans effet sur les navigateurs actuels. Constaté en
lisant la feuille servie, pas la source.

Contourné en posant le flou en style en ligne, qui ne traverse pas le
minifieur. La barre de l'accueil n'était pas touchée : son CSS vit dans une
balise `<style>` injectée à l'exécution.

### Rappel d'outillage

Turbopack a de nouveau servi un chunk périmé après modification de
`palettes.ts`. Deux redémarrages du serveur ont été nécessaires. Le symptôme
est constant : la source change, l'écran non. Vérifier la valeur servie avant
de douter du code.

## Le logo, une seule teinte partout

Deux écarts, corrigés :

- `app/(auth)/layout.tsx` imposait `tone="mono-dark"`, un anthracite plein. La
  page de connexion affichait donc un logo noir pendant que la vitrine
  l'affichait vert. Ton par défaut rétabli.
- `components/marketing/Footer.tsx` employait `mono-light`, un blanc plein qui
  **retire** l'émeraude. Passé à `dark`, le ton de charte pour fond sombre, qui
  conserve le vert.

Vérifié sur neuf pages en lisant les remplissages SVG rendus : toutes peignent
`#1F3A2E` et `#2E7D5B`. Les pages à pied de page sombre ajoutent `#FAFAF8`,
c'est la pièce claire du ton inversé, pas une troisième teinte.

Les tons restants sont justifiés et conservés : `currentColor` pour le rapport
d'audit imprimé, `onBrand` sur la bulle de conversation, `mono-light` sur les
maquettes plein écran de `safe-linear-visual`.

## Accès à l'intérieur, en local

Le CEO ne parvenait pas à voir l'application connectée. Diagnostic complet du
chemin, sans jamais saisir de mot de passe :

| Point de contrôle | État |
|---|---|
| Utilisateur en base | présent, rôle avocat |
| Empreinte du mot de passe | présente, et le mot de passe du seed la valide |
| Nom du cabinet | comparé en minuscules après trim, correspondance exacte requise |
| Employé actif | oui |
| Garde d'abonnement | `stripeSubscriptionStatus = "active"` donc `active = true`, aucun blocage |

Un seul piège restait : le cabinet s'appelait « Cabinet Démo SAFE ». La
connexion exige le nom **exact**, et un accent à retaper dans un champ de
démonstration ne sert personne. Renommé en **« Cabinet Demo »**, en base et
dans `prisma/seeds/demo-cabinet.mjs` pour que le seed reste idempotent.
