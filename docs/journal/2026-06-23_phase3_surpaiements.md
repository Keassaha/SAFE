# 2026-06-23 — Phase 3 (clôture) : surpaiements

Dernier item de la Phase 3 (« l'argent est compréhensible »). Méthode ultracode (workflows). Zéro migration.
Branche `release/2026-06-11-compta-admin-derisier`. tsc + 654 tests verts, parité i18n.

## Décision CEO (rappel)
Crédit reportable + option remboursement (le bouton marque l'intention, le virement reste manuel hors SAFE).

## Constat (workflow de compréhension)
- `PaymentStatus.OVERPAID` existe mais jamais dérivé ; `Invoice.balanceDue` persiste et peut être négatif (nette montantTotal − paiements − notes de crédit − fidéicommis appliqué).
- `CreditNote` est lié à UNE facture (avoir) → inadapté à un crédit client global.
- `Client` n'a pas de champ solde créditeur.

## Buildé (zéro migration)
- `lib/services/billing/overpayment-service.ts` : `getClientCreditBalances` + `creditFromBalanceDue`. Solde créditeur = `-SUM(Invoice.balanceDue)` quand négatif, par client (factures émises hors brouillon). Flag `refundRequested` lu depuis l'audit log.
- `app/api/facturation/surpaiements/route.ts` : GET (liste) + POST (intention de remboursement) ; `canManageInvoices` ; POST vérifie client ∈ cabinet ; aucun mouvement d'argent.
- Intention de remboursement portée par l'**audit log** (`AuditAction` étendu `refund_requested`, colonne String, pas de migration).
- `PaiementsView` : section « Soldes créditeurs (surpaiements) » (liste clients + montant + bouton Demander le remboursement + badge) + modal (note + avis virement manuel).
- 12 clés i18n FR/EN. Test unitaire `creditFromBalanceDue`.

## Choix d'architecture
- **Pas de changement à `derivePaymentStatus`** (PAID→OVERPAID casserait relances/exports QB/Xero/Sage). « Trop-payé » dérivé à l'affichage seulement.
- **Crédit reportable** = via le mécanisme d'allocation existant (le surplus s'applique à la prochaine facture), pas de fausse `CreditNote` ancrée arbitrairement.
- **Fidéicommis exclu** : balanceDue nette déjà le fidéicommis appliqué ; le fidéicommis détenu sans facture n'a pas de balanceDue, donc non compté (conforme à la doctrine, pas de mélange trust/operating).

## Revue adversariale (corrigée avant commit)
- Trouvaille high : la 1ʳᵉ formule (`reçu − montantTotal`) ratait les surpaiements quand une note de crédit était appliquée. Corrigé en passant à `-SUM(balanceDue)` (nette déjà les notes de crédit), ce qui simplifie ET corrige.
- Autres trouvailles (indentation pré-existante, montantTotal sur annulation, test d'intégration) : devenues sans objet ou mineures après la simplification.

## Phase 3 : COMPLÈTE (5/5)
Texte doctrinal · hub `/comptabilité` · paiements orphelins · reçu visible · surpaiements.
