# 2026-06-23 — Revue adversariale du re-skin + correctifs

Workflow multi-agents (19 agents) sur les 7 fichiers re-skinnés (banner + écran liste clients) : 15 findings bruts, **11 confirmés** après vérification adversariale. Triage et suite.

## Corrigé immédiatement (sûr, en périmètre, vérifié)
- **Header `bg-[var(--si-canvas)]/60` ne produisait AUCUN style** (Tailwind 3.4 ignore l'opacité sur une `var()` arbitraire). 3 occurrences (survol nav x2, en-tête menu avatar). Basculé sur le token `bg-si-canvas/60` → confirmé en live : produit `rgba(239,242,237,0.6)`. Le survol de nav et la teinte d'en-tête s'affichent enfin.
- **Header `text-text-subtle` (slate-500 #888780) sous AA** sur les nouveaux fonds si (placeholder recherche, hint ⌘K). Migré vers `text-si-muted` (#5A665F, passe AA).
- **ClientTable `border-si-line/80`** : le `/80` écrasait l'alpha déjà intégrée du token (0.10 → 0.8, séparateur 8x trop opaque). Retiré le `/80`. Artefact de la conversion mécanique `border-neutral-border/80` → `si-line`.
- Vérif : tsc exit 0, **648/648 tests verts**, zéro token cassé/ancien résiduel dans les fichiers touchés.

## À TRANCHER PAR LE CEO — HIGH (écran le plus consulté)
- **Tableau de bord : deux verts cohabitent.** `LawyerGlance` (ancien design, vert moyen sapin `#1F3A2E`, `bg-white`/`border-neutral`) est empilé juste au-dessus de `DashboardViewSafe` (si-forest `#0B1F19`, `si-surface`, `si-line`). Introduit quand le dashboard est passé en `DashboardViewSafe` sans re-skinner `LawyerGlance`. Correctif = re-skinner `components/navette/LawyerGlance.tsx` en `si-*`. Recommandé comme prochain chantier (ou avec le dashboard).

## À TRANCHER PAR LE CEO — accessibilité des tokens de marque (identité verrouillée)
Plusieurs petits textes/glyphes amber et verified du design adopté passent sous le seuil AA (4.5:1 petit texte) sur leurs propres teintes claires :
- `si-amber` #B07A1C : badge « warn » 11px = 3.13:1 ; glyphe « ! » Obligations 13px = 3.13:1 (LIVE) ; métrique amber PriorityCard 18px = 3.61:1 (LIVE, « À recevoir »).
- `si-verified` #2E7D5B : badge/pastille « ok » 11–13px ≈ 4.27:1 (glyphe ✓ Obligations LIVE).
- Correctif = assombrir légèrement amber (~#8A5E10) et verified pour usage texte/icône. **C'est un changement des couleurs de marque verrouillées → décision CEO**, pas un fix unilatéral. Alternative : agrandir/grossir ces glyphes.

## Mineur / différé
- `max-w-content` est une classe morte (token `maxWidth.content: 1180px` non porté) dans `ds-preview/page.tsx` et `tableau-de-bord/apercu/page.tsx`. Apercu est de toute façon à supprimer ; pour la démo, ajouter le token (1 ligne) si on garde la page.
- `tableau-de-bord/apercu/page.tsx` : `min-h-screen` + marges négatives mal calibrées vs le shell. Page non-live, **à supprimer** (déjà au backlog).
- `ds-safe` Logo (« S » seul sans alt) et Button (pas de focus-visible) : primitives neuves, à durcir avant usage hors démo. Le sceau du Header, lui, est déjà correct (aria-hidden + « Safe » visible).

## Prochaine action
- Décision CEO : (a) commiter le checkpoint (banner + liste clients + correctifs revue, tout vert), (b) attaquer `LawyerGlance` pour finir la cohérence du dashboard, (c) passer à l'écran dossier, (d) trancher l'assombrissement amber/verified.
