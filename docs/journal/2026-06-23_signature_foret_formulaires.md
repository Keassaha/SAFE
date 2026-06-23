# 2026-06-23 — Signature forêt sur toutes les pages + formulaires cohérents

Demande CEO (en regardant le dashboard) : retrouver le **fond vert forêt `#0B1F19`** (bandeau + TrustCard) **sur toutes les pages**, de façon intelligente et belle ; et dans les **formulaires**, que le vert existe à la saisie avec une **typographie cohérente** (mêmes polices). Direction validée + « toutes les pages » + « formulaires de création d'abord ».

## Décision de design (ancrée sur le design adopté)
- Le forêt foncé ne va PAS en fond des champs (lisibilité). Il est présent via : **en-tête de page forêt**, cartes forêt (TrustCard), boutons, et le **focus vert quand on clique dans un champ**. Champs clairs = texte lisible.

## Buildé et vérifié en live (3010, routes isolées)
- **`PageHeader` partagé → forêt plat** (`#0B1F19`), titre **serif** albâtre, fil d'Ariane **mono**, description albâtre/70. Propagation immédiate à ~44 pages. Boutons d'action restent clairs sur le forêt (règle `.dash-header .pageheader-action` existante). Variante `dashboard` (non utilisée) inchangée.
- **Listes clients + dossiers** rebranchées sur ce `PageHeader` forêt.
- **`Input` partagé re-skinné** (`components/ui/Input.tsx`) : champ `si-surface`/`si-line`, Geist, **focus = bordure verte vérifiée + halo vert** (`focus:border-si-verified focus:ring-si-verified/25`). Touche TOUS les formulaires de l'app d'un coup.
- **Wizards de création client + dossier** re-skinnés : selects/textarea en champ si, libellés Geist `si-muted`, **titres d'étape en serif** `si-ink`, **onglets d'étapes** en forêt (`bg-si-forest/10 text-si-forest` actif), cases à cocher si, astérisques requis en amber. Logique 100% préservée (étapes, validation, conflit, server actions).
- Nouveaux composants de référence : `components/ds-safe/page-hero.tsx` (+ boutons clairs sur forêt) et `components/ds-safe/form.tsx` (Field/Input/Select/Textarea/AmountInput, montants en mono). Démo de la direction : `/ds-preview/forms`.
- Vérifs : champ montant confirmé **GeistMono** ; focus vert confirmé en CSS (`rgba(46,125,91,...)`) et visible au clic (capture wizard) ; en-tête forêt `rgb(11,31,25)` ; boutons d'action lisibles sur forêt. **tsc exit 0, 648/648 tests verts.**

## À noter / suite
- Bug corrigé en passant : le champ montant rendait en GeistSans (conflit `font-sans`/`font-mono` dans la base) → police posée par composant.
- Redondance mineure sur les pages `/nouveau` : titre dans le PageHeader forêt + titre de Card « Créer le … ». À simplifier.
- Animation `.dash-header` (respiration/shimmer) héritée s'applique aux en-têtes ; à confirmer si on la garde sur le forêt plat (calme) ou si on la retire.
- Décision CEO en attente : assombrir amber/verified pour AA petits glyphes (identité verrouillée).
- Le `<select>` du wizard pourrait recevoir un chevron custom (cosmétique).

## Prochaine action
- CEO vérifie sur son navigateur connecté (n'importe quelle page = en-tête forêt ; création client/dossier = focus vert + polices cohérentes). Puis commit du gros checkpoint, ou ajustements.
