# SAFE — Doctrine comptable

Date: 2026-04-29
Statut: source de vérité.
Portée: tout module qui crée, modifie ou lit un objet financier.

Ce document définit ce qu'est chaque concept dans SAFE et comment ils interagissent. Toute divergence dans le code doit être traitée comme un bug, pas comme une variante autorisée.

## 1. Vocabulaire canonique

| Concept | Définition |
|---|---|
| **Facture (`Invoice`)** | Document émis ou en préparation, qui agrège des lignes facturables, calcule taxes et solde dû, et constitue la base de la créance client. |
| **Ligne de facture (`InvoiceLine`)** | Unité atomique d'une facture : décrit un fait facturable (heure, forfait, débours, intérêts, ajustement). Une ligne porte sa propre taxabilité et son propre `sourceType`. |
| **Item de facture (`InvoiceItem`)** | **Vue détaillée optionnelle** d'une ligne, utilisée pour granularité avancée (rabais avec parent, sous-éléments). Pour le V2, considérer `InvoiceItem` comme support legacy ; toute nouvelle entité passe par `InvoiceLine`. |
| **Paiement (`Payment`)** | Encaissement réel d'un client, indépendant des factures. Un paiement n'a pas de facture par défaut — il est ensuite alloué. |
| **Allocation (`PaymentAllocation`)** | Affectation explicite d'un montant d'un `Payment` vers une `Invoice`. Plusieurs allocations possibles par paiement. La somme des allocations ≤ `Payment.montant`. |
| **Note de crédit (`CreditNote`)** | Annulation ou réduction d'une facture émise, avec sa propre traçabilité. |
| **Entrée de journal (`JournalGeneralEntry`)** | Mouvement append-only au registre comptable central. Chaque entrée a un `sourceModule` et un `sourceId` qui pointent vers l'objet métier d'origine. |
| **Dépense cabinet (`CabinetExpense`)** | Coût opérationnel du cabinet (loyer, abonnements, fournitures), validé depuis un import bancaire ou saisi manuellement. **Jamais refacturé.** |
| **Débours dossier (`DeboursDossier`)** | Coût avancé par le cabinet pour le compte d'un dossier (frais IRCC, Title Search, etc.), destiné à être refacturé au client. |
| **Mouvement fidéicommis (`TrustTransaction`)** | Dépôt ou retrait sur le compte en fidéicommis d'un dossier. Append-only, écrit systématiquement au journal. |
| **Honoraires (`InvoiceItem.type = "honoraires"`)** | Ligne facturable issue du temps ou d'un forfait, taxable au taux principal. |
| **Forfait (`ForfaitService`)** | Service catalogué à prix fixe (ex: "Real Estate Purchase $1500"). |
| **Tâche forfaitaire (`RegistreTache`)** | Instance d'un `ForfaitService` ouverte pour un dossier donné, avec ajustement et rabais possibles. |

## 2. Statuts canoniques

### 2.1 Facture

**Décision V2** : la source de vérité est `invoiceStatus` (enum EN). Le champ `statut` (FR) est conservé pour rétro-compatibilité d'affichage mais **ne doit pas être lu pour décision métier**.

États autorisés :
- `DRAFT` — facture en préparation, modifiable, jamais transmise.
- `READY_TO_ISSUE` — validée par l'avocat, prête à être envoyée.
- `ISSUED` — émise au client, créance comptable.
- `PARTIALLY_PAID` — au moins une allocation reçue, balance > 0.
- `PAID` — balance = 0.
- `OVERDUE` — `dateEcheance < today` ET balance > 0.
- `CANCELLED` — annulation avant émission, n'a jamais été créance.
- `CREDITED` — réduite ou annulée par une `CreditNote` après émission.

### 2.2 TimeEntry

Source de vérité : `billingStatus` (enum). `statut` (brouillon/valide/facture) est conservé pour affichage mais ne pilote plus les KPIs.

États : `NON_BILLED`, `READY_TO_BILL`, `IN_DRAFT_INVOICE`, `BILLED`, `NON_BILLABLE`, `WRITTEN_OFF`, `CANCELLED`.

### 2.3 RegistreTache

États : `en_cours`, `complete`, `facture`. Une tâche `facture` est obligatoirement liée à une `InvoiceLine` via `invoiceLineId`.

### 2.4 Payment

Source de vérité : `allocationStatus` (`UNALLOCATED | PARTIALLY_ALLOCATED | ALLOCATED | REVERSED`).

## 3. Source de vérité des montants

Pour chaque concept ambigu, la source de vérité est **fixée** :

| Champ ambigu | Source de vérité (V2) | Justification |
|---|---|---|
| `TimeEntry.montant` vs `feeAmount` | `feeAmount ?? montant` via helper `getTimeEntryBillableAmount(entry)` | `feeAmount` reflète le montant **facturable réel** (peut différer du brut si write-down) ; `montant` est le brut (heures × taux). Le helper centralise la règle. |
| `TimeEntry.tauxHoraire` vs `hourlyRate` | `hourlyRate ?? tauxHoraire` | Idem, `hourlyRate` est le futur canonique. |
| `TimeEntry.dureeMinutes` vs `durationHours` | `dureeMinutes` (entier) reste source de vérité, `durationHours` dérivé | Précision entière préférée pour minutes. |
| `Invoice.statut` vs `invoiceStatus` | `invoiceStatus` | Voir §2.1. |
| `Dossier.soldeFiducieDossier` vs `TrustAccount.currentBalance` | `TrustAccount.currentBalance` | `Dossier.soldeFiducieDossier` est un cache à invalider/recalculer depuis `TrustAccount`. |
| `RegistreTache.montantBase` vs `ForfaitService.montant` | `RegistreTache.montantBase` (figé à l'ouverture) | Le catalogue peut bouger, la tâche garde sa version. |

## 4. Qui écrit au journal général

**Règle d'or** : tout mouvement financier réel doit produire une entrée au journal général. Une entrée n'est jamais modifiée — corrections via `typeTransaction = CORRECTION` et `sourceModule = CORRECTION_SYSTEME`.

| Événement | Crée une entrée ? | `sourceModule` | `typeTransaction` | `sourceId` |
|---|---|---|---|---|
| Émission d'une facture (`ISSUED`) | Oui | `FACTURATION` | `FACTURE` | `Invoice.id` |
| Encaissement d'un paiement | Oui | `PAIEMENTS` | `PAIEMENT` | `Payment.id` |
| Allocation d'un paiement à une facture | **Non** | (déjà reflété par `PAIEMENT`) | — | — |
| Dépôt fidéicommis | Oui | `FIDEICOMMIS` | `DEPOT_FIDEICOMMIS` | `TrustTransaction.id` |
| Retrait fidéicommis | Oui | `FIDEICOMMIS` | `RETRAIT_FIDEICOMMIS` | `TrustTransaction.id` |
| Validation d'une dépense cabinet | **Oui** (à corriger — actuellement non) | `DEPENSES` | `DEPENSE` | `CabinetExpense.id` |
| Paiement d'un débours dossier par le cabinet | **Oui** (à corriger — actuellement non) | `DEBOURS` | `DEBOURS` | `DeboursDossier.id` |
| Refacturation d'un débours via une facture | **Non** (couverte par `FACTURE`) | — | — | — |
| Ligne d'import bancaire validée comme dépense | Oui (via `CabinetExpense` validée) | `DEPENSES` | `DEPENSE` | `CabinetExpense.id` |
| Ligne d'import comptable structuré (`migration_comptable`) | Oui | `IMPORT_BANCAIRE` ou type explicite | mappé depuis source | fingerprint ligne |
| Ajustement manuel | Oui | `AJUSTEMENT_MANUEL` | `AJUSTEMENT` | id de l'opération |
| Correction systémique | Oui | `CORRECTION_SYSTEME` | `CORRECTION` | id de l'entrée corrigée |

**Règle d'idempotence** : pour tout `sourceModule` opérationnel (pas `AJUSTEMENT_MANUEL`), la combinaison `(cabinetId, sourceModule, sourceId)` doit être unique. Un appel répété ne doit jamais créer un doublon.

**À implémenter** : helpers `writeJournalForCabinetExpense(...)` et `writeJournalForDeboursDossier(...)` dans `lib/services/journal/`, appelés respectivement par `validateImportedTransaction` et `markDeboursPaidByCabinet`.

## 5. Ce qui ne doit PAS être confondu

- **Une `Invoice` n'est pas un encaissement.** Elle exprime une créance, pas une trésorerie.
- **Un `Payment` n'est pas une recette par facture.** C'est un encaissement brut. Sa ventilation passe par les `PaymentAllocation`.
- **Une `CabinetExpense` n'est pas un `DeboursDossier`.** Si l'opérateur hésite, le test à appliquer est : « est-ce qu'on va le refacturer à un client ? » → oui = `DeboursDossier`, non = `CabinetExpense`.
- **Un `DeboursDossier` payé par le cabinet est une dépense ET une créance refacturable.** Côté trésorerie, c'est une sortie immédiate (à journaliser). Côté facture, c'est une ligne future.
- **Un `RegistreTache` rabais n'est pas un `InvoiceItem` rabais.** Le rabais forfait s'applique côté tâche (avant facturation). Le rabais ligne s'applique sur une facture déjà composée. Choisir un seul des deux par contexte.
- **Un `TimeEntry.WRITTEN_OFF` n'est jamais facturable.** Tout filtre "à facturer" doit l'exclure.
- **Une entrée de journal n'est jamais éditée.** Toute modification passe par une `CORRECTION`.

## 6. Cohérence avec la migration comptable

Le flux `migration_comptable` ([app/(app)/import/actions.ts](../../app/(app)/import/actions.ts)) écrit directement au journal. C'est la seule porte d'entrée acceptable pour un import comptable historique. Les imports bancaires doivent passer par `CabinetExpense` (validation humaine) puis par le helper `writeJournalForCabinetExpense` — pas directement.

## 7. Architecture cible (synthèse)

```
[Source métier]                 [Persistance]                [Journal général]
─────────────────────────────────────────────────────────────────────────────
Émettre une facture        →    Invoice ISSUED          →    JGE FACTURE (FACTURATION)
Encaisser un paiement      →    Payment + Allocation    →    JGE PAIEMENT (PAIEMENTS)
Déposer en fidéicommis     →    TrustTransaction        →    JGE DEPOT_FIDEICOMMIS
Retirer du fidéicommis     →    TrustTransaction        →    JGE RETRAIT_FIDEICOMMIS
Valider dépense cabinet    →    CabinetExpense valide   →    JGE DEPENSE (DEPENSES)        [À FAIRE]
Payer un débours dossier   →    DeboursDossier paye     →    JGE DEBOURS (DEBOURS)         [À FAIRE]
Importer historique compta →    direct                  →    JGE depuis migration_comptable
Corriger une erreur        →    n/a                     →    JGE CORRECTION (CORRECTION_SYSTEME)
```

## 8. Règle de prudence

Quand un événement métier semble proche de plusieurs concepts canoniques, l'opérateur **ne doit pas inventer un raccourci dans le code**. Il ouvre une question dans le repo et la résout par référence à ce document. La liste des concepts est volontairement étroite : tout nouveau concept doit être ajouté ici avant d'être codé.
