# 2026-06-23 — Phases 2 et 3 du calendrier (onboarding + compta vendable)

Suite de l'exécution du calendrier éditorial. Phase 1 (design forêt/albâtre + sécurité) close.
Branche `release/2026-06-11-compta-admin-derisier`. tsc + 648 tests verts à chaque commit.

## Buildé

### Phase 2 — « Un cabinet neuf sait quoi faire »
- Faux formulaire `/onboarding` (5 étapes sans persistance) → redirige vers le tableau de bord.
- Checklist `GettingStarted` (pilotée par les données réelles : cabinet configuré → 1er client → 1er dossier → 1ʳᵉˢ heures → 1ʳᵉ facture) câblée dans `DashboardViewSafe`, affichée tant que l'onboarding est incomplet.
- États vides guidés : clients + dossiers (déjà), facturation (cabinet neuf → CTA « Nouvelle facture », distinct du « aucun résultat » de filtre). +2 clés i18n.

### Phase 3 — « L'argent est compréhensible » (4/5)
- **Hub `/comptabilité`** (`ComptabilitePageView`) : intro doctrinale (forêt, serif) qui clarifie « SAFE = comptabilité opérationnelle + export QuickBooks/Xero/Sage ; le comptable garde le grand livre ». 4 cartes d'action (Encaisser, Dépenses & débours, Contrôle mensuel → `/comptes/rapprochement`, Exporter). Journaux reframés « Mode expert » : ne sont plus le premier signal. +13 clés i18n.
- **Paiements orphelins** (`PaiementsView`) : bannière amber en tête (nombre + total non alloué). Rien d'important n'est invisible. +2 clés i18n.
- **Reçu visible** : bouton « Voir le reçu » par paiement → endpoint EXISTANT `/api/documents/payment-receipt/[paymentId]` (PDF consultable + imprimable). Réutilise l'existant, pas de doublon. +1 clé i18n.

## Décidé (CEO 2026-06-23)
- Surpaiements : **crédit reportable + option remboursement** (le bouton remboursement marque l'intention ; le virement reste manuel hors SAFE).
- Reçu : **léger à l'écran** — satisfait par le PDF existant ouvert en navigateur (consultable + imprimable).

## Observé
- Un **reçu PDF existait déjà** (`components/pdf/PaymentReceiptPDF.tsx` + API) mais n'était lié nulle part. Le « rendre visible » a juste demandé un bouton.
- Les modèles **`CreditNote` + `CreditNoteApplication` existent déjà** dans le schéma Prisma → les surpaiements doivent s'y intégrer (avoirs), pas réinventer.
- La vue Paiements portait déjà les données d'allocation (montant alloué/non alloué, statut, bouton allouer) ; il manquait juste la mise en évidence.

## Reste
- Phase 3 : **surpaiements** (détection soldes créditeurs + flux crédit/remboursement, via `CreditNote`). À faire proprement (touche données + persistance), pas en fin de marathon.
- Phases 4 (fermeture dossier) · 5 (connexion navette) · 6 (cohérence nav par rôle) · 7 (démo/QA).
