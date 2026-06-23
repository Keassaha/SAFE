# 2026-06-23 — Re-skin écran liste dossiers (Task 4, design safe-interface)

Même patron que l'écran liste clients (déjà revu/validé), appliqué à `/dossiers`.

## Buildé et vérifié en live (3010, aperçu isolé)
- 6 fichiers re-skinnés en `si-*` :
  - `DossierSummaryCards` : 7 cartes `si-surface`/`si-line`, labels uppercase `si-muted`, valeurs **mono** `si-ink`, sous-textes « % » en `si-verified`. Une seule pastille forêt calme (fini les 7 couleurs d'icônes). **KPI « Urgents/retard » : valeur en `si-amber` seulement si >0** (gros chiffre 22px → seuil AA grand texte 3:1 respecté, 3.61:1), **pas de badge rouge** (philosophie si).
  - `DossiersTable` : en-têtes de tri `si-muted`→hover `si-forest`, fond d'en-tête albâtre, **référence en mono `si-forest`**, liens client forêt, dates `si-muted`, statut via le composant partagé **`StatusBadge`** (cohérent avec clients : actif/ouvert=success, clôturé/archivé=neutral, autres=warning), menu kebab `DossierActionsMenu` en `si-*` (panneau `si-surface`/`si-line`/`shadow-si-card`).
  - `DossierSearchBar`, `DossierFilters` (3 selects + Actualiser), `DossierPagination` : tokens si, focus/hover forêt.
  - `page.tsx` : bannière dégradé `PageHeader` → en-tête si (titre serif `si-ink` + description), et coque `bg-white shadow-lg` + `Card` partagée → `Card` ds-safe (titre serif). Fix mobile recherche/filtres (empilement) appliqué.
- Tokens confirmés par styles calculés : urgent `rgb(176,122,28)` (si-amber), référence `rgb(11,31,25)` GeistMono.
- Vérifié desktop 1320px (7 cartes + table + filtres) et mobile 375px (cartes 2-col, en-tête empilé). Zéro erreur console, **tsc exit 0, 648/648 tests verts**, zéro token ancien résiduel.
- Leçons de la revue clients appliquées d'office : opacité en forme token (`bg-si-canvas/60`, pas `[var(--si-canvas)]/60`), pas d'opacité sur `si-line`, amber texte seulement en grand.
- Revue adversariale multi-agents relancée sur les 6 fichiers dossiers.

## Périmètre non touché
- `DossierCreateModal`/`DossierCreationWizard` (flux création), primitives partagées.
- **Page détail dossier `[id]`** (`components/dossiers/detail/*`, ~14 sections) : écran distinct, prochain gros chunk.

## Reste sur Task 4
- Pages détail : dossier `[id]`, profil client `[id]`.
- Écrans : comptabilité, facture, courriels.
- Flux de création (modals/wizards) clients + dossiers, `ClientSuccessBanner`.
- Décision CEO : assombrir amber/verified pour AA petits glyphes (identité verrouillée).
- Supprimer `/tableau-de-bord/apercu`. Bascule finale tokens globaux.

## Prochaine action
- Selon revue : corriger si besoin, puis commiter le checkpoint, ou enchaîner sur l'écran comptabilité / une page détail.
