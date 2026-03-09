# Module facturation SAFE

Services métier pour le moteur de facturation juridique.

## Règles métier

- Une fiche de temps ou un débours ne peut être lié qu’à **une seule facture active**.
- Une facture **émise** (ISSUED, PARTIALLY_PAID, PAID, OVERDUE) ne doit **pas** être modifiée silencieusement ; toute correction passe par note de crédit ou ajustement historisé.
- **Annuler un brouillon** remet les lignes source (time_entries, expenses) en `READY_TO_BILL` et nettoie `invoiceId` / `invoiceLineId`.
- **Paiements** et **allocations** sont gérés séparément ; le solde facture est recalculé après chaque allocation.
- **Fidéicommis** : traçabilité via `TrustAccount` et `TrustTransaction`.
- **Intérêts** : calcul et historisation dans `InterestCharge`.

## Services

- `invoice-service` : brouillon, émission, annulation, recalcul des totaux.
- `payment-allocation-service` : création paiement, allocation à une ou plusieurs factures.
- `trust-service` : compte fidéicommis, application au solde facture.
- `interest-service` : calcul des jours de retard, création des charges d’intérêt.
- `credit-note-service` : création note de crédit, application à une facture.
- `reminder-service` : création relances, liste des factures en retard.

## Usage

```ts
import {
  createDraftFromBillableItems,
  issueInvoice,
  cancelDraft,
  createPayment,
  allocateToInvoices,
} from "@/lib/services/billing";
```
