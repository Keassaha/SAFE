# 2026-06-21 — Audit de préparation produit (Product Readiness)

## Buildé / produit
- `docs/SAFE_PRODUCT_READINESS_AUDIT.md` v2 : audit complet 11 sections (vision, état par module, bloquants, cohérence, UX, compta, admin, risques techniques, plan, calendrier).
- Méthode : 5 explorations parallèles (compta/facturation, parcours cabinet, admin/RBAC, UX, technique) + vérifications directes.

## Décidé / cadré
- Positionnement réaffirmé : SAFE = système d'exploitation de cabinet, compta juridique opérationnelle + export externe (pas QuickBooks).
- 6 correctifs bloquants identifiés avant vente pilote founder : B1 onboarding persistant, B2 états vides guidés, B3 équivalence facture (preview=PDF=public), B4 fermeture dossier réelle, B5 rotation secrets + console interne gatée, B6 rate-limit PDF audit.
- Jalons : vente pilote founder fin S3, vente publique encadrée fin S6.

## Observé (faits vérifiés)
- `tsc` exit 0 ; 644 tests verts ; parité i18n parfaite (3131 clés).
- **Correction d'une erreur de l'audit du matin** : le `.env` n'est PAS commité (gitignored). Pas de fuite git, mais clés réelles en clair local à faire tourner.
- Deux « onboarding » distincts : `/api/onboarding` = funnel audit public (emails), `app/onboarding/page.tsx` = mise en route in-app qui ne persiste rien.
- Aucun IDOR détecté ; fidéicommis réellement durci (verrou advisory, plafond espèces, anti-commingling, certif LSO).
- Modules esquissés exposés au même niveau que les matures : paie, impersonation (modèle vide), console (accès basé sur nom de cabinet).

## Prochaine action physique
- Choisir la priorité 1 entre B3 (test équivalence facture, plus fort impact confiance) et B1 (onboarding persistant). Recommandation : B3 d'abord (1 jour, verrouille la fiabilité commerciale).
