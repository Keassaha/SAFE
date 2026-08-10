# 2026-08-02 — Logo : source unique, et « Les Galets » confirmés

## Demande CEO

Sur la landing, les logos ne sont pas uniformes d'un endroit à l'autre. Trois demandes :

1. régler l'écart entre les logos ;
2. une marque plus intéressante pour SAFE ;
3. un document qui décrit SAFE, son style, et le genre d'application que c'est.

## Ce qu'on a trouvé

Le logo n'existait pas une fois, il existait huit fois.

| Endroit | Ce qu'il dessinait |
|---|---|
| `components/branding/SafeLogo.tsx` | mark + pastille + « SAFE » serif 22 px, avec pulsation permanente |
| `components/brand/Logo.tsx` | son propre mark + pastille sombre + « Safe » en bas de casse |
| `components/public-site/shared.tsx` | le galet recopié pour le canevas flottant |
| `FeaturesPage`, `AboutPage`, `mockups` (×2) | le galet recopié en puce, en `#12A150` |
| `components/audit-report/primitives.tsx` | le logo recopié pour le rapport client |
| `scripts/render-safe-dashboard-logo.mjs` | encore une copie |

Trois défauts en découlaient :

- **Le mot ne suivait pas le mark.** Il était figé à 22 px quelle que soit la taille du
  mark, donc le verrou de la barre de navigation (mark 20) et celui du pied de page
  (mark 16) n'avaient pas les mêmes proportions.
- **Trois teintes pour la même marque** : `#1F3A2E`, `#12A150`, `currentColor`.
- **Deux mots-symboles** : « SAFE » sur le site public, « Safe » dans l'app, l'auth, le
  rapport d'audit et la page d'invitation.

Le galet inférieur vivait à 55 % d'opacité : illisible en petit, perdu au monochrome.
Aucune favicon n'existait.

## Ce qui a été fait

### 1. Une source unique — `components/brand/safe-mark.ts`

Formes, encres et rapports du verrou. Aucun autre fichier ne redessine la marque.
Reste deux copies assumées et commentées : `app/icon.svg` (un SVG ne peut pas importer
du TypeScript) et le script d'archive `render-safe-dashboard-logo.mjs`.

### 2. Nouvelle marque — « La Voûte »

Deux piliers, un arc, une clé de voûte. L'arc porte, la clé tient : la promesse
« SAFE tient votre cabinet ensemble », dessinée plutôt qu'écrite. Lecture seconde,
le portail et la chambre forte.

- Arc et piliers **tracés** (épaisseur 4, bouts francs), clé **pleine**.
- **Une seule encre**, aucune opacité partielle : tient à 16 px, en monochrome et à
  l'impression. Sur une facture, la marque ne consomme qu'une des deux couleurs permises.
- Le dessin remplit le repère 24×24 pour peser autant que la hauteur de capitale du mot.
- L'ancienne marque reste disponible : `SAFE_MARK_DEFAULT = "galets"` la remet partout.

### 3. Le verrou réparé

`taille du mot = taille du mark × 1,15`, écart `× 0,42`. Un rapport, plus une valeur figée.
La pastille disparaît de la navigation et du pied de page : elle est réservée à l'icône
d'application et à la favicon.

### 4. Le logo ne bouge plus

La pulsation permanente est retirée (L3 du standard premium, `noPulse` devient sans effet).
Le composant n'importe plus framer-motion.

### 5. Propagation

18 fichiers alignés : site public, `ExperienceCinema`, maquettes, auth, invitation,
barre latérale, en-tête, rapport d'audit, diagnostic gratuit, prototypes `safe-linear-visual`.
Les puces maison deviennent la clé de voûte seule (`SafeKeystone`), les pièces flottantes
de `PaperDrift` aussi.

### 6. Favicon

`app/icon.svg` : variante plaque, aplat forêt, mark blanc. Il n'y en avait aucune.

### 7. Page de contrôle

`/marque`, non indexée : les deux marques à 16 / 20 / 24 / 32 / 48 / 96 px, sur clair,
sombre, monochrome, plaque et vert de marque.

### 8. Documents

- `docs/brand/IDENTITE_SAFE.md` — **nouveau, source de vérité** : ce qu'est SAFE, le genre
  d'application, les deux utilisateurs, la voix, le style visuel, la spécification complète
  du logo, les interdits.
- `docs/brand/SAFE_BRAND_CONTEXT.md` — section 4 réécrite, renvoie au nouveau document.
- `CLAUDE.md` — nouvelle section « Marque et logo ».
- `eslint.config.mjs` — `app/marque/**` exempté de PS-001 : la page de contrôle doit citer
  les encres littérales.

## Vérification

- `tsc --noEmit` propre.
- 12 routes touchées en 200 : `/`, `/marque`, `/fonctionnalites`, `/a-propos`, `/faq`,
  `/demo`, `/tarification`, `/audit-gratuit`, `/connexion`, `/safe-linear-visual`,
  `/safe-linear-visual/dashboard`, `/audit/demo`.
- Contrôle visuel : `/marque` aux six tailles et sur les cinq fonds, navigation de
  l'accueil, pied de page sombre, page de connexion, couverture du rapport d'audit,
  favicon rendue.
- DOM de `/fonctionnalites` : 9 puces clé de voûte à 11 × 9,2 px en `#12A150`, 3 marks
  d'arc (19 px navigation, 12 px maquette, 19 px pied de page).
- Lint : aucune infraction nouvelle. Ce qui reste dans `app/rejoindre/[token]/page.tsx`
  et les pages du rapport préexiste au chantier, et deux infractions y ont même disparu.

## Décidé, non fait

- Les anciens visuels de logo restent dans `public/` (`safe-logo-concept-1*.png`,
  `images/safe_logo_3d.*`). Plus référencés nulle part, à supprimer quand la marque est
  confirmée.
- Icône Apple et manifeste web : à faire.
- Identité illustrée « gravure sur parchemin » : toujours ouverte. La Voûte y est
  compatible, c'est un objet d'architecture.

---

## Arbitrage CEO, même jour : « Les Galets »

La proposition « La Voûte » a été montrée sur `/marque` puis **écartée**. La marque
servie reste **« Les Galets »**. Ce qui a été fait ensuite :

- `SAFE_MARK_DEFAULT = "galets"`.
- **Le système devient réellement pilotable par la forme.** Chaque marque déclare ses
  métriques dans `MARK_GEOMETRY` : mise à l'échelle, fragment décoratif, cadrage du
  fragment, poids sur canevas. Basculer la forme suffit désormais, le verrou et les
  usages dérivés suivent sans retouche. C'était le vrai défaut : la voûte était câblée
  en dur dans la favicon, le rapport d'audit, les puces et le canevas flottant.
- **Le dessin des galets est mis à l'échelle ×1,17** autour de (12, 12). Il n'occupait
  que 67,5 % du repère contre 79 % pour la voûte, donc le mark paraissait petit à côté
  du mot. La forme ne change pas, sa présence oui.
- `SafeKeystone` devient `SafeBullet` et rend le fragment de la marque servie, soit le
  galet supérieur. Alias déprécié conservé.
- `PaperDrift` reprend les galets et leurs tailles d'origine, via `fragmentWeight`.
- `components/audit-report/primitives.tsx` passe par `SafeMark` au lieu de dessiner ses
  propres chemins : le rapport client ne peut plus dériver du produit.
- `app/icon.svg` : plaque forêt, galets blancs, échelle 0,8424 (0,72 × 1,17).
- `/marque` inverse ses deux blocs : marque servie d'abord, piste écartée pour mémoire.
- Documents alignés : `IDENTITE_SAFE.md` §4 réécrit (dont un §4.9 sur le compromis
  assumé), `SAFE_BRAND_CONTEXT.md` §4, `CLAUDE.md`.

Vérifié après bascule : `tsc` propre, `/marque` et l'accueil contrôlés à l'œil.

**Le compromis reste posé, et il est assumé.** Le galet inférieur à 55 % d'opacité
s'efface en monochrome, à l'impression et sous 16 px. Là où la lisibilité prime,
favicon et icône d'application, la plaque rétablit le contraste.

## État du CEO

Marque tranchée, système en place. Les acquis du chantier restent valides quelle que
soit la forme : source unique, verrou proportionnel, plus de « Safe » en bas de casse,
plus de pulsation, une favicon.
