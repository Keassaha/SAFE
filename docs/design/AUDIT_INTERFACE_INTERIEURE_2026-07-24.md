# Audit de l’interface intérieure SAFE

Date : 2026-07-24  
Portée analysée : `app/(app)/` et `components/`  
Références : `DOCTRINE_INTERFACE_INTERIEUR.md` §1 à §12 et `DESIGN_HUMAIN.md` §0, §10.

## Méthode

L’inventaire initial couvre 512 fichiers. Le scan statique initial a relevé 2 540
occurrences à examiner : palettes hors `si-*`, valeurs hexadécimales, ombres, flous,
grands rayons, pilules, animations continues et texte blanc. Une occurrence n’est
pas automatiquement une non-conformité : les superpositions, erreurs bloquantes,
logos de fournisseurs et surfaces réellement inversées doivent être validés selon
leur contexte.

## Classement par impact visuel

### P0, primitives partagées

| Dimension | Écart observé avant correction | Référence initiale |
|---|---|---|
| Contrôles | Palette `forest-*`, focus par ombre et destructif plein | `components/ui/Button.tsx:12-50` |
| Tableaux | Palette legacy, zébrage arbitraire, alignement unique à gauche | `components/ui/DataTable.tsx:44-107` |
| Motion | Squelette en pulsation continue | `components/ui/Skeleton.tsx:10` |
| Couleur | Badge neutre en `neutral-*` | `components/ui/StatusBadge.tsx:14` |
| Typographie | Variante d’en-tête intérieure en `slate-*`, sans serif éditorial | `components/ui/PageHeader.tsx:39-56` |

### P0, tableau de bord

| Dimension | Écart observé avant correction | Référence initiale |
|---|---|---|
| Élévation | Ombres sur chaque panneau et carte KPI dans le flux | `components/dashboard/DashboardView.tsx:533,567,626,690,743` |
| Densité | KPI distribués dans des cartes espacées au lieu d’une synthèse inline | `components/dashboard/DashboardView.tsx:521-558` |
| Couleur | Hexadécimales et `green-*` pour les statuts et icônes | `components/dashboard/DashboardView.tsx:54-58,444-499` |
| Motion | Stagger d’entrée et déplacement au survol | `components/dashboard/DashboardView.tsx:516-555,602` |
| Typographie | Valeurs tabulaires sans garantie de `font-mono` | `components/dashboard/DashboardView.tsx:540` |

### P0, Temps

| Dimension | Écart observé avant correction | Référence initiale |
|---|---|---|
| Couleur | En-tête en dégradé sombre à trois hexadécimales | `app/(app)/temps/TempsPageClient.tsx:112` |
| Élévation | Ombre de grande intensité sur un élément dans le flux | `app/(app)/temps/TempsPageClient.tsx:112` |
| Hiérarchie | Deux actions visuellement concurrentes | `app/(app)/temps/TempsPageClient.tsx:119-137` |
| Densité | Quatre cartes KPI avec icônes décoratives | `components/temps/TimeMetricsCards.tsx:52-78` |
| Motion | Trois squelettes en pulsation continue | `app/(app)/temps/TempsPageClient.tsx:197-199` |

### P1, écrans métier à traiter ensuite

| Écran ou groupe | Écarts dominants | Exemples initiaux |
|---|---|---|
| Sécurité | Hexadécimales d’erreur, `emerald-*`, cartes de synthèse | `app/(app)/securite/page.tsx:23-110` |
| Fidéicommis | Cartes de solde, `green/amber/blue`, mono incomplet | `components/fideicommis/SoldeCards.tsx:56-95`, `components/fideicommis/LSOReportGenerator.tsx:213-365` |
| Facturation | Couleurs legacy, grands rayons, tableaux numériques hétérogènes | `app/(app)/facturation/creances-aging/page.tsx:40-86`, `app/(app)/facturation/honoraires/[clientId]/HonorairesDetailClientView.tsx:444-557` |
| Employés | Hexadécimales de statut, boutons pleins concurrents, grands rayons | `components/employees/PendingHoursApproval.tsx:36-181` |
| Paramètres | Champs en `rounded-xl`, erreurs hexadécimales | `components/parametres/RetentionPolicyForm.tsx:33`, `components/parametres/PayeursReglesView.tsx:11-191` |
| Dossiers | Ombres au survol, `gray/emerald`, contrôles uniformes | `components/dashboard/DossierEvolutionPanel.tsx:47-329` |
| Composants historiques du dashboard | Glassmorphism, ombres, dégradés et palettes génériques | `components/dashboard/AlertsPanel.tsx:18-61`, `components/dashboard/MonthlyComparisonTable.tsx:19-86` |

### P2, composants hors parcours intérieur principal

Les composants de marketing, PDF, audit public et onboarding expliquent une part
importante du scan brut. Ils ne doivent pas être convertis mécaniquement : leurs
logos, surfaces imprimées ou expériences publiques suivent d’autres contraintes.
Toute utilisation réelle dans `app/(app)/` doit néanmoins être auditée avant
livraison.

## État des corrections

- Lot 1 terminé : `Button`, `DataTable`, `Skeleton`, `StatusBadge`, `PageHeader`.
- Lot 2 terminé : tableau de bord actif, synthèse KPI et panneaux.
- Lot 3 terminé : écran Temps et métriques.
- P1 et P2 restent ouverts. Ils ne sont pas déclarés conformes à la checklist §12.

## Validation

- Scan ciblé après correction : aucune occurrence interdite dans les fichiers
  intérieurs corrigés, à l’exception volontaire des variantes `landing-*` de
  `Button`.
- `git diff --check` : réussi sur les huit fichiers corrigés.
- TypeScript : bloqué par une erreur préexistante hors lot,
  `components/layout/AppChrome.tsx:69`, propriété `cabinetId` manquante.

