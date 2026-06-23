# 2026-06-23 — Re-skin pages détail (client + dossier) + Card partagé + facturation

Suite du re-skin écran par écran. Commits : `d5f726c` facturation, `2d7aba7` Card partagé, `d2045ca` fiche client, `ababa47` fiche dossier.

## Card + EmptyState partagés (gros levier)
- `components/ui/Card` (Card/CardHeader serif/CardContent) + `EmptyState` passés en si-surface/si-line. Propage la surface si à ~40 écrans utilisant `ui/Card` (comptes, conformité, employés, rapports, paramètres, pages détail, sous-pages facturation). Leurs coques sont donc déjà en si ; reste le contenu interne.

## Fiche détail client (`clients/[id]`)
- `ClientProfile` + onglets (Overview, Billing, Cases, Compliance, DossierFinancier, TrustAccount, HistoryTab), QuickActions, ProfileAlerts, DocumentRefs, ClientForm, IdentityVerificationSection → si.
- page : badge statut + bouton éditer en **clair-sur-forêt** (sur l'en-tête forêt) ; coque + section documents en si. Vérifié en aperçu isolé (cartes serif, fidéicommis, conflits).

## Fiche détail dossier (`dossiers/[id]`)
- ~35 composants (detail/, registry/ overview/billing/débours/events/notes/tasks/trust, briefcase, formulaires FINTRAC/background/immigration/immobilier, résumés) → si.
- page custom (header collant, sections, boutons emerald/slate → forêt) → si.

## Méthode
- Mapping littéral Python (sans regex) appliqué par écran (= ses composants), puis grep anti-artefact d'opacité (`/10/30` etc. corrigés), tsc + 648 tests verts. Amber **texte** = `si-amber-ink` ; rouge danger `#B84A3E` ; bleu info → neutre si ; amber/vert sur icônes = OK (3:1).

## Reste design
- Contenu interne : sous-pages facturation (7) + honoraires/paiements views, comptes/conformité, employés, rapports, paramètres (×7), sous-vues journaux compta (général/dépenses). Coques déjà si (Card partagé) ; reste tables/KPIs/textes.
- À confirmer CEO : la page dossier [id] garde son header clair custom (workspace dense) ou reçoit un bandeau forêt ?
- Puis bascule finale tokens globaux ; puis Phases 2-7 fonctionnelles.

## Vérif
- Fiche client vérifiée visuellement (aperçu isolé). Fiche dossier : tsc + tests + grep (swap mécanique, même mapping) ; vérif visuelle finale par le CEO sur navigateur (vrais dossiers).
