# 2026-06-24 — Calendrier éditorial de la page Comptabilité

Demande CEO : un calendrier éditorial pour piloter la page Comptabilité, à partir des incohérences à corriger.

## Méthode
Audit ciblé du module compta (agent Explore) contre la doctrine (`SAFE_ACCOUNTING_DOCTRINE.md`) + l'audit anomalies existant, vérifié au code. Puis synthèse en calendrier éditorial : `docs/SAFE_COMPTABILITE_EDITORIAL_CALENDAR.md`.

## Déjà sain (vérifié)
- KPI « facturé » en HT, jamais compté comme trésorerie (`kpi.ts`).
- Fidéicommis isolé du solde opérationnel (`isTrustEntry`).
- Hub `/comptabilité` (intro doctrinale + actions, journaux en mode expert, livré Phase 3).
- Aucune promesse interdite dans l'UI (« remplace le comptable »).

## Incohérences identifiées (backlog du calendrier)
- COMPTA-01 (P1) : « Exporter au comptable » mène au journal sans signaler l'export (CSV mappable QB/Xero/Sage présent mais non mis en avant).
- COMPTA-04 (P1) : alertes anti-erreurs (`anti-erreurs.ts`) jamais affichées en UI.
- COMPTA-05 (P1) : profil cabinet A/B/C/D stocké mais ne pilote pas l'UI (cartes/onglets non filtrés).
- COMPTA-06 (P1) : verrouillage de période invisible/non actionnable.
- COMPTA-07 (P2) : onglet Paiements = réemballage de la vue facturation ; libellé « Encaisser » trompeur.
- COMPTA-08 (P2) : clés KPI ad hoc vs clés `kpi*` standard inutilisées.

Constat clé : 4 des 6 incohérences sont des « reliquats » (logique livrée en Lots 4/5/6 mais jamais branchée à l'écran).

## Calendrier produit (3 semaines)
1. « L'export et les alertes sont évidents » (COMPTA-01 + 04).
2. « SAFE s'adapte à chaque cabinet » (COMPTA-05 profils + 06 périodes).
3. « Cohérence et finition » (COMPTA-07 + 08 + taxes/province).

## Reste
Exécuter le calendrier (aucune correction de code faite ici : c'est un plan). L'audit anomalies province/taxe reste orthogonal (rappelé en Semaine 3).
