# SAFE — Modèle commun de facturation (forfait + horaire)

Date: 2026-04-29
But: poser un noyau de concepts qui s'applique aux deux modes principaux (forfait Derisier-style, horaire classique) sans dupliquer la logique.

## 1. Pourquoi un noyau commun

SAFE doit servir indifféremment :
- un cabinet immobilier ON forfaitaire (`Derisier Law`),
- un cabinet d'affaires QC horaire,
- un cabinet hybride multi-pratique avec mix forfait + horaire.

Sans noyau commun, chaque écran réimplémente sa propre arithmétique (KPIs, WIP, recouvrement) avec des règles divergentes. Le noyau résout ce problème en exposant **un vocabulaire et un ensemble de helpers purs** que tout le code consomme.

## 2. Vocabulaire transversal

### 2.1 Buckets de valeur (chronologie d'un revenu)

```
PRODUITE  ──→  FACTURABLE  ──→  FACTURÉE  ──→  ENCAISSÉE
   ↘                ↘               ↘
    AJUSTÉE      WRITE-DOWN     WRITE-OFF
```

| Bucket | Définition | Source horaire | Source forfait |
|---|---|---|---|
| **Produite** | Travail effectivement réalisé. Référence brute. | `TimeEntry.dureeMinutes × tauxHoraire` | `RegistreTache.montantBase` |
| **Facturable** | Valeur que le cabinet a décidé de facturer (post ajustement). | `TimeEntry.feeAmount ?? montant` (hors `WRITTEN_OFF` et `NON_BILLABLE`) | `RegistreTache.montantFinal` (= base + ajustement − rabais) |
| **Facturée** | Réellement intégrée à une `Invoice` `ISSUED` ou `PARTIALLY_PAID`/`PAID`. | `InvoiceLine.lineTotal` ou `montant` selon source | idem |
| **Encaissée** | Reçue effectivement, allouée à la facture. | `Σ PaymentAllocation.allocatedAmount` | idem |

### 2.2 Concepts transversaux

| Concept | Définition |
|---|---|
| **Ajustement** | Modification ponctuelle du facturable (à la hausse ou à la baisse) avant émission. Stocké sur `RegistreTache.ajustement` (forfait) ou comme `InvoiceItem.type = "rabais"` (horaire ad-hoc). |
| **Rabais** | Réduction commerciale connue du client (catalogue, fidélité, négociation). Stocké explicitement sur `RegistreTache.rabais` ou en ligne d'invoice dédiée. |
| **Write-down** | Décision interne de réduire la valeur facturable d'un fait (ex: trop d'heures sur une recherche). N'est pas un rabais — le client n'en sait rien. Conceptuellement : `produite − facturable`. |
| **Write-off** | Décision interne de **ne plus facturer du tout** une valeur déjà capturée. `TimeEntry.isWrittenOff = true` ou `billingStatus = WRITTEN_OFF`. La valeur disparaît du facturable. |
| **WIP (Work In Progress)** | Valeur facturable accumulée mais pas encore intégrée à une facture émise. C'est le stock de revenu qui dort. |
| **Réalisation** | Ratio `facturable / produite` (effet des write-downs et write-offs internes). |
| **Recouvrement** | Ratio `encaissée / facturée` (effet des impayés et write-offs externes). |
| **Marge / rentabilité** | `encaissée − coûts directs (débours payés non refacturés + temps interne valorisé)`. Calcul plus tardif, hors V2. |
| **Travail interne vs valeur vendue** | Travail interne = `TimeEntry.facturable = false` ou `NON_BILLABLE` (formation, admin). Ne fait jamais partie du WIP. |

## 3. Spécificités de chaque mode

### 3.1 Spécifique au forfait

- **Catalogue** : `ForfaitService` — prix de référence par code (`IMMO-ACHAT`, `IMM-EE`).
- **Tâche ouverte** : `RegistreTache` instancie un service pour un dossier. Capture `montantBase` à l'ouverture (figé), permet `ajustement` + `rabais`, calcule `montantFinal`.
- **Pas de notion de temps obligatoire**. Une tâche forfait peut être complétée sans qu'aucune `TimeEntry` ne soit saisie.
- **Rentabilité forfait** = `montantFinal − Σ TimeEntry valorisés sur le même dossier pendant la période`. À calculer hors V2.

### 3.2 Spécifique à l'horaire

- **Capture** : `TimeEntry` (durée, taux, description, avocat).
- **Approbation** : `TimeEntry.approvedById` / `approvedAt` (à rendre obligatoire pour passer en `READY_TO_BILL` — V2).
- **Composition de facture** : agrégation de `TimeEntry` `READY_TO_BILL` en `InvoiceLine` (one-to-one ou groupé selon préférence du cabinet).
- **Rentabilité horaire** = directe via `feeAmount × allocations`.

### 3.3 Commun aux deux

- **Cycle Invoice** : `DRAFT → READY_TO_ISSUE → ISSUED → PAID` (cf. doctrine).
- **Paiements & allocations** : indifférent au mode.
- **Débours** : ajoutés à la facture via `InvoiceLine` `sourceType = debours_dossier`, qu'importe si la facture est forfait ou horaire.
- **Taxes** : appliquées à la ligne, pas à la facture (cf. `TAX_AND_PROVINCE_MODEL.md`).

## 4. Helpers cibles (V2)

À implémenter dans `lib/billing/` :

```ts
// Source de vérité unifiée pour le montant facturable d'une TimeEntry
getTimeEntryBillableAmount(entry: TimeEntry): number

// Idem pour le taux effectif
getTimeEntryEffectiveRate(entry: TimeEntry): number

// Classifie une TimeEntry pour les KPIs de facturation
classifyTimeEntryForBilling(entry: TimeEntry): "produced_only" | "billable" | "drafted" | "billed" | "written_off" | "non_billable"

// WIP par dossier — somme du facturable non encore facturé (forfait + horaire + débours)
computeWipForDossier(snapshot: DossierBillingSnapshot): WipBreakdown

// Réalisation et recouvrement
computeRealizationRate(produced: number, billable: number): number  // 0..1
computeRecoveryRate(billed: number, collected: number): number      // 0..1
```

## 5. Buckets exposés à l'UI

Trois cartes KPI agrégées pour la page Facturation :

| Carte | Formule |
|---|---|
| **Produit ce mois** | `Σ produite` sur la période, par source |
| **À facturer (WIP)** | `Σ facturable` non encore lié à une `Invoice ISSUED+` |
| **Émis ce mois** | `Σ Invoice ISSUED` sur la période |
| **Encaissé ce mois** | `Σ PaymentAllocation` sur la période |
| **Réalisation** | `facturable / produite` sur la période |
| **Recouvrement** | `encaissée / émise` sur la période |

## 6. Impact sur le schéma — minimal pour V2

Aucun nouveau modèle Prisma requis. Le noyau s'appuie sur ce qui existe et **fixe les contrats de lecture** via les helpers. Une éventuelle table `LawyerRate` (taux par avocat × type d'affaire) est documentée mais reportée.

## 7. Garde-fous

- Aucun helper ne doit accéder à Prisma. Tous travaillent sur des objets typés en mémoire (snapshot du dossier ou de la TimeEntry).
- Tout calcul de KPI affiché à l'opérateur doit passer par un helper du noyau. Les KPIs ad-hoc qui réimplémentent l'arithmétique sont à éliminer page par page (cf. `FACTURATION_COMPTABILITE_UX_AUDIT.md`).
- Tout helper expose son contrat dans son JSDoc, avec exemple chiffré.
