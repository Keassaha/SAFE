# 2026-06-15 — Doctrine comptable opérationnelle + revue de code + SOP

## Buildé / produit
- **Réécriture** de `docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md` (v2026-06-15) : positionnement « comptabilité juridique opérationnelle avec export comptable externe », 10 sections (positionnement, fait / ne fait pas, 5 règles de non-mélange, distinction des 7 concepts, KPI autorisés, libellés UI, erreurs critiques, logique par événement, pointeur SOP).
- **Nouveau** `docs/accounting/SAFE_ACCOUNTING_CODE_REVIEW.md` : état des lieux A/B/C/D fidèle au code vérifié post-`df82243`.
- **Nouveau** `docs/accounting/SAFE_ACCOUNTING_IMPLEMENTATION_PLAN.md` : Lots 0-6 réordonnés par impact × risque, sur les vrais trous restants.
- **Nouveau** `docs/accounting/SAFE_ACCOUNTING_SOP.md` : SOP quotidienne + questionnaire onboarding + profils A/B/C/D.

## Décidé
- Aucune modification de code ce coup-ci : règle dure du brief (doctrine en KB d'abord) + règle projet (ne pas builder sans spec validée) + Dérisier en prod. Les docs sont la spec à valider avant code.

## Observé (vérifié dans le code, pas sur parole)
- `df82243` a déjà corrigé l'essentiel de l'audit du 10 juin : plus de « Solde global », KPI séparés, revenu HT, fidéicommis isolé (`isTrustEntry`), comptes à recevoir présents, dépenses/débours journalisés, taxe pilotée par mode cabinet. 24 tests compta verts.
- Vrais trous restants : R-1 (certification ne vérifie pas chaque compte ≥ 0), R-2 (TOCTOU retrait fidéicommis), M-1 (statuts débours), M-4 (verrouillage période), M-5 (export mappable QB/Xero/Sage), M-6 (profil cabinet + onboarding).

## Code livré (Lot 1, validé par CEO)
- **R-2** (`trust-transaction-service.ts`) : retrait fidéicommis sous `pg_advisory_xact_lock(trust:<id>)` + relecture du solde DANS la transaction (ferme la fenêtre TOCTOU).
- **R-1** (`reconciliation-service.ts`) : `certifyReconciliation` bloque si un `TrustAccount.currentBalance < 0` (vérif par compte, pas seulement l'agrégat).
- Tests : `lib/services/fideicommis/__tests__/trust-withdrawal-lock.test.ts` (3) + `reconciliation-certify.test.ts` (4). Suite compta : **145/145 verte**. Typecheck OK sur les fichiers modifiés.
- Non commité (pas demandé). Gate de déploiement : requête soldes négatifs Dérisier AVANT de déployer R-1.

## Code livré (Lot 2, validé par CEO)
- Schéma : enum `DeboursStatut { NON_FACTURE, FACTURE, RECOUVRE, RADIE }` + champ `statutDebours` (défaut NON_FACTURE) + index `(cabinetId, statutDebours)` sur `DeboursDossier`.
- Migration additive `prisma/migrations/20260615120000_add_debours_statut/migration.sql` avec backfill (FACTURE si factureId, RECOUVRE si facture PAID). NON appliquée (pas de `migrate` sans feu vert).
- Transitions : facturation → FACTURE (`forfait-billing-service.ts:412`) ; paiement total → RECOUVRE et revert si annulé (`recalculateInvoiceTotals`) ; radiation → RADIE (nouvelle action `radierDeboursDossier`).
- KPI « Débours à récupérer » : champ `deboursARecuperer` (type + `computeJournalKpis` + agrégat dans `calculateJournalBalance`) + carte UI (`GeneralJournalPageView`) + clés i18n fr/en.
- Tests : `debours-statut.test.ts` (3) + patch de 3 mocks tx (ajout `deboursDossier.updateMany`). Suite compta **177/177 verte**, typecheck **0 erreur**.

## Code livré (Lot 3, validé par CEO)
- Schéma : modèle `AccountingPeriodLock` (cabinetId, periode YYYY-MM, lockedAt, lockedById, reason ; unique cabinetId+periode) + relation Cabinet. Migration additive `20260615130000_add_accounting_period_lock`.
- Garde-fou : `createJournalEntry` refuse toute écriture datée dans un mois verrouillé (lecture défensive, ne casse pas les mocks partiels). Choke point unique.
- Auto-verrouillage : `certifyReconciliation` verrouille la période certifiée (reason `reconciliation_certified`).
- Service `lib/services/journal/period-lock.ts` : `getPeriodeFromDate`, `isPeriodLocked`, `lockAccountingPeriod`, `unlockAccountingPeriod`, `getLockedPeriods`.
- Tests : `period-lock.test.ts` (3) + assertion lock dans `reconciliation-certify.test.ts`. Suite compta **180/180 verte**, typecheck **0 erreur**.

## Code livré (Lot 4, validé par CEO)
- Module pur `lib/accounting/anti-erreurs.ts` : `assertInvoiceHasClient` (blocage), `warnPaymentWithoutInvoice`, `warnInvoiceWithoutDossier`, `warnUnbilledDeboursOnClosedDossier`.
- Câblage : blocage facture sans client dans `createDraftFromBillableItems` ; `createPayment` renvoie `warnings` (propagé par la route `/api/facturation/paiements`) ; `createDeboursDossier` renvoie `warning` si débours refacturable non facturé sur dossier fermé/archivé.
- Tests : `anti-erreurs.test.ts` (11). Suite compta **191/191**, typecheck **0 erreur**. Pas de migration.
- Reliquat mince : afficher les `warnings` dans les formulaires (toast/bannière).

## Code livré (Lot 5, validé par CEO)
- `lib/accounting/export/` : `account-mapping.ts` (plan comptable par défaut + surcharge cabinet + dérivation double-entrée par type/module), `build-export.ts` (écritures → lignes Dr/Cr balancées + totaux de contrôle), `serialize.ts` (CSV generic/QuickBooks/Xero/Sage).
- `lib/services/accounting-export.ts` : `buildPeriodAccountingExport` (par période YYYY-MM, horodaté, statut verrouillé via isPeriodLocked, totaux balancés).
- Action `exportAccountingPeriodAction` (`app/(app)/journal/general/actions.ts`) : téléchargement base64 + méta de contrôle.
- Tests : `build-export.test.ts` (7) + `serialize.test.ts` (4). Suite compta **202/202**, typecheck **0 erreur**. Pas de migration.
- Reliquats : bouton UI (période + format) + persistance du chart surchargé par cabinet.

## Commits
- `d6bf42e` : doctrine + Lots 1-3 (fidéicommis, statuts débours, verrouillage période).
- `17308de` : Lot 4 (contrôles anti-erreurs de saisie).

## Gates de déploiement (à exécuter avant prod)
- Lot 1 R-1 : requête soldes fidéicommis négatifs Dérisier (corriger si lignes).
- Lot 2 : `prisma migrate deploy` (migration additive `20260615120000_add_debours_statut`) AVANT le déploiement du code.
- Lot 3 : `prisma migrate deploy` (migration additive `20260615130000_add_accounting_period_lock`) AVANT le déploiement du code.

## Reste à faire
- **Lot 6** (profil cabinet + onboarding) — seul lot majeur restant. Reliquats minces : affichage UI warnings (Lot 4), bouton UI export + chart persistant (Lot 5), preview cartes/verrous après migrations en dev, vérif live localisation Cayard/Dérisier (R-3/R-4).
