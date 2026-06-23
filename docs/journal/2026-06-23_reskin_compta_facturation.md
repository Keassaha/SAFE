# 2026-06-23 — Re-skin compta (shell) + facturation (principal)

Re-skin écran par écran (décision CEO : design d'abord). Commits `4c3964a` (compta) et `d5f726c` (facturation).

## Comptabilité
- `ComptabilitePageView` : onglets en tokens si (indicateur forêt, texte ink/muted, bordure si-line).
- `ComptaKpiCard` (réutilisée dans les journaux) : surface/line si, chiffres **mono**, sémantiques credit→verified, debit→danger #B84A3E, warning→ink, alert→si-amber-ink (AA), pastilles forêt.

## Facturation (écran principal)
- `FacturationMainKpis` : 5 tuiles cliquables en si (mono, verified/amber-ink/ink/danger), pastille forêt.
- `page.tsx` : cartes sous-pages + coque `Card` ds-safe (titre serif).
- `FacturationTable` : liens forêt, n°/montants **mono**, dates muted, StatusBadge, zébrage albâtre.
- `FacturationFilters` : recherche + select + dates en champs si + **focus vert**.
- Vérifié via `/ds-preview/facturation` (données fictives) ; tsc + 648 tests verts ; zéro token ancien résiduel.

## Reste design (file)
- Facturation : 7 sous-pages (temps-non-facturé, débours/frais, taxes, aging créances, rentabilité, suivi, paiements) + nouvelle/vérification + facture [id] ; `HonorairesAFacturerView`.
- Comptes/fidéicommis, conformité, employés, rapports, paramètres (x7).
- Pages détail `clients/[id]` + `dossiers/[id]` (les plus grosses, ~14 comp. chacune).
- Sous-vues journaux compta (général, dépenses, paiements).
- Modals création (wrappers) + `ClientSuccessBanner`.
- Puis bascule finale tokens globaux ; puis Phases 2-7 fonctionnelles.
