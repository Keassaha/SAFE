# 2026-06-26 — Refonte du rapport d'audit : blanc, sobre, plus court

## Contexte
Le PDF de diagnostic envoyé aux cabinets (route `GET /api/audit-gratuit/[id]/pdf`,
rendu Playwright via la page `/audit/[id]/print` → composant `components/audit-report/`)
avait trois défauts signalés par le CEO :
- des schémas qui ne s'affichaient pas correctement,
- trop long (11 pages),
- fond crème chargé, trop de tailles de police, peu sobre.

## Décidé
Consolidation à ~7 pages (couverture + 6 numérotées), fond blanc par défaut, typo
resserrée, schémas simples. Validé par le CEO (option « ~6-7 pages »).

## Buildé
- **Bug jauge réparé** (`primitives.tsx` `HalfGauge`) : le viewBox faisait 140px de
  haut alors que « sur 100 », le libellé et le sous-libellé étaient positionnés
  jusqu'à y=179, donc coupés/invisibles. Jauge redessinée (viewBox 240×150, arc +
  score + « sur 100 » seulement) ; libellé et sous-libellé rendus en HTML par la page,
  hors SVG, donc plus aucun débordement possible.
- **Fond blanc par défaut** : variante `white` rendue pur blanc (suppression du dégradé),
  défaut de la route basculé `cream` → `white`, défaut du composant déjà `white`.
- **Halos retirés** en variante blanche (PageShell + CoverPage), conservés en crème.
- **Pages supprimées** (fichiers retirés) : `DetailPage`, `OpportunitesPage`,
  `AnnexePage`. *Détail du score* redondant avec *Analyse des risques* ; *Vos
  opportunités* redondant avec la colonne « ce que SAFE corrige » des risques ;
  *Annexe (vos réponses)* = data dump.
- **Prochaines étapes** fondues en bas de la page *Notre offre* (bande compacte 3 étapes,
  sans la citation fondateur), page `EtapesPage` retirée.
- **Renumérotation** : Risques 04→03, Barreau 05→04, Coût 07→05, Offre 08→06 ;
  total des pages `11` → `06` (PageShell).

## Vérifié
- `npx tsc --noEmit` : 0 erreur.
- Prévisualisation `/audit/demo?variant=white` : 7 pages, 0 erreur console, jauge nette
  et lisible, fond blanc, page Offre sans débordement (`scrollHeight - clientHeight = 0`),
  bande Étapes présente et dans les limites.

## Fichiers touchés
`components/audit-report/theme.ts`, `AuditReport.tsx`, `PageShell.tsx`, `primitives.tsx`,
`pages/{ScorePage,RisquesPage,BarreauPage,CoutPage,OffrePage,CoverPage}.tsx`,
`app/api/audit-gratuit/[id]/pdf/route.ts`. Supprimés :
`pages/{DetailPage,OpportunitesPage,EtapesPage,AnnexePage}.tsx`.

## Bug data corrigé (même session)
Champs `Contact` et `Localisation` vides/incomplets sur la couverture et la page Profil
(affichait « , QC » sans la ville, contact vide). Cause : la soumission stocke
`identite`, `localisation`, `contact` en **objets imbriqués** (`{ville, province}`,
`{nom_complet, titre}`), mais `buildCabinet`/`buildBarreau`/`buildAnnexe` lisaient des
clés **plates** (`localisation_ville`, `"localisation.ville"`) qui ne correspondaient
jamais. Correctif : helper `nestedStr(a, groupe, champ)` (lecture imbriquée + repli plat)
dans `lib/audit-report/rules.ts`, appliqué aux 3 fonctions. Bonus : la province Barreau
n'est plus figée sur « QC » par le fallback. Touche le moteur de données → vaut pour tous
les rapports futurs. `tsc` 0 erreur. PDF régénéré dans ~/Downloads.

## Restant / non fait
- La consolidation typographique fine (réduire encore le nombre de tailles : 7px → 11px
  varient toujours selon les pages) reste partielle ; faite surtout sur les pages touchées.
  Un passage dédié « échelle typographique unique » serait un chantier propre à part.
- L'ancienne génération `lib/audit-gratuit/pdf.tsx` (@react-pdf/renderer) est morte mais
  pas supprimée.
