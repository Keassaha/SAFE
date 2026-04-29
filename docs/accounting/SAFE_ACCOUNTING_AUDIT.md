# SAFE — Audit comptable et opérationnel

Date: 2026-04-29
Portée: facturation forfait + horaire, paiements, dépenses cabinet, débours dossier, fidéicommis, journal général, comptabilité, imports.

Ce document établit l'état des lieux. Les corrections sont définies dans les autres documents `docs/accounting/`.

## 1. Forces

- **Double logique forfait / horaire déjà présente** dans le schéma (`ForfaitService` + `RegistreTache` côté forfait, `TimeEntry` côté horaire).
- **Modèle de facture riche** (`Invoice`, `InvoiceLine`, `InvoiceItem`, `Payment`, `PaymentAllocation`, `CreditNote`).
- **Fidéicommis modélisé sérieusement** : `TrustAccount` unique par `(cabinetId, clientId, matterId)`, `TrustTransaction` append-only, écriture systématique au journal général via `lib/services/trust/trust-transaction-service.ts`.
- **Journal général append-only** ([lib/services/journal/journal-service.ts](../../lib/services/journal/journal-service.ts)) avec calcul de `solde` cumulé.
- **Distinction conceptuelle déjà amorcée** entre dépenses cabinet (`CabinetExpense`), débours dossier (`DeboursDossier`) et legacy `Expense`.
- **Imports** : pipeline d'import bancaire (`BankImportSession` → `BankImportTransaction` → `CabinetExpense`) et import comptable structuré (`migration_comptable` → `JournalGeneralEntry` avec idempotence par `sourceId`).
- **Design system** globalement sérieux (tokens forest/sand/zinc, motion uniforme, hiérarchie typographique claire).

## 2. Faiblesses identifiées (par axe)

### 2.1 Statuts Invoice — dualité non documentée

`Invoice` porte deux énums coexistants :
- `statut` (FR): `brouillon | envoyee | partiellement_payee | payee | en_retard`
- `invoiceStatus` (EN): `DRAFT | READY_TO_ISSUE | ISSUED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED | CREDITED`

Conséquence concrète : [app/(app)/facturation/page.tsx:102-107](../../app/(app)/facturation/page.tsx) filtre simultanément sur `statut: "envoyee"` ET `invoiceStatus: "ISSUED"`. Lequel est la source de vérité ? La doctrine doit trancher.

### 2.2 TimeEntry — deux montants, deux taux

`TimeEntry` stocke `montant` + `feeAmount` (et `tauxHoraire` + `hourlyRate`, `dureeMinutes` + `durationHours`). Le KPI "à facturer" utilise `_sum.feeAmount ?? _sum.montant` ([app/(app)/facturation/page.tsx:128](../../app/(app)/facturation/page.tsx)) — fallback silencieux, contrat non documenté.

### 2.3 Calcul des totaux Invoice — partagé entre serveur et client

`recalculateInvoiceTotals` côté serveur écrit `montantTotal`/`balanceDue`. `FactureEditView` recalcule en local via `computeBillingTotals` sans synchroniser. Risque d'écarts perçus pendant l'édition.

### 2.4 Write-down vs write-off — flagués mais dormants

`TimeEntry.isWrittenOff` + `BillingStatus.WRITTEN_OFF` existent. Aucun service ne les applique systématiquement aux KPIs facturation. Notion de **write-down** (réduction partielle de la valeur facturable) absente.

### 2.5 WIP (Work In Progress) — non modélisé explicitement

Pas d'agrégat `WIP` par dossier, par client, par avocat. Calculer la valeur "en cours non facturée" demande N requêtes en parallèle (`TimeEntry`, `Expense`, `RegistreTache`, `DeboursDossier`).

### 2.6 Rabais — double modélisation

- `RegistreTache.rabais` (montant + raison) sur le forfait
- `InvoiceItem.type = "rabais"` ligne distincte avec `parentItemId`
- `InvoiceLine` n'a pas de notion de rabais natif

Pas de règle unique "où vit le rabais". La conséquence : un rabais peut être appliqué deux fois si l'opérateur n'est pas attentif.

### 2.7 Dépenses cabinet — JAMAIS écrites au journal général

`CabinetExpense` (validée depuis l'import bancaire) ne crée **pas** d'entrée `JournalGeneralEntry`. Seuls les imports comptables structurés (`migration_comptable`) écrivent au journal. Conséquence : le KPI "dépenses" de la page comptabilité est incomplet.

### 2.8 Débours dossier — jamais journalisés non plus

`DeboursDossier` est destiné à la facturation. Il n'apparaît pas dans le journal général tant qu'il n'est pas refacturé via `Invoice`. Or un débours payé par le cabinet est un **mouvement de trésorerie réel** qui devrait remonter au journal côté sortie.

### 2.9 Modèle `Expense` — redondance avec `DeboursDossier`

Le modèle `Expense` (legacy) a une relation `invoiceId` et un `billingStatus` proches de `DeboursDossier`. Doctrine ambiguë — deux portes d'entrée pour le même concept.

### 2.10 Idempotence du journal — partielle

Pas de contrainte unique sur `(cabinetId, sourceModule, sourceId)`. L'idempotence du flux migration comptable a été corrigée récemment ([app/(app)/import/actions.ts](../../app/(app)/import/actions.ts)) en s'appuyant sur `sourceId`, mais le journal n'a pas de garde-fou structurel.

### 2.11 Solde global volatil

`calculateJournalBalance` retourne le `solde` de la dernière entrée (cumul stocké). Si une entrée est supprimée ou injectée hors séquence en base, le cumul devient incorrect. Pas de recalcul périodique ni de checksum.

### 2.12 TrustAccount.currentBalance vs Dossier.soldeFiducieDossier

Deux sources de vérité pour le solde fiduciaire d'un dossier — `TrustAccount.currentBalance` ET `Dossier.soldeFiducieDossier`. Pas de contrainte de cohérence garantie.

### 2.13 Configuration taxes — implicite

Aucun modèle `CabinetTaxConfig` ni `Province` configurable. Les taux TPS/TVQ sont en dur dans `lib/invoice-calculations.ts`. Un cabinet ON utilisant la HST n'est pas servi correctement par défaut.

### 2.14 KPIs facturation vs comptabilité — formats incohérents

3 systèmes visuels distincts pour les KPIs (facturation minimal, comptabilité riche avec tendance, clients intermédiaire). Padding, tailles, sémantique couleur divergent. Voir [docs/product/FACTURATION_COMPTABILITE_UX_AUDIT.md](../product/FACTURATION_COMPTABILITE_UX_AUDIT.md).

### 2.15 Approbation formelle d'honoraires — absente

`TimeEntry.approvedById` est optionnel. Aucun workflow de validation avant facturation. Pour des cabinets multi-avocats, c'est un trou de gouvernance.

### 2.16 Taux horaire par avocat / domaine — absent

`TimeEntry.tauxHoraire` est saisi à la main. Pas de table `LawyerRate` ni de barème par type d'affaire. Risque de sous-facturation et d'incohérence entre dossiers.

### 2.17 Historique des modifications de facture — non structuré

Pas de table `InvoiceAuditLog`. Les modifications d'une facture émise restent invisibles pour le syndic.

## 3. Maturité par axe

| Axe | Maturité | Commentaire |
|---|---|---|
| Forfait | 3.5 / 5 | Catalogue + registre solides ; manque WIP forfait, rentabilité par service |
| Horaire | 3 / 5 | Modèle riche mais ambigüités (`montant` vs `feeAmount`), pas d'approbation |
| Paiements / allocations | 4 / 5 | Bien modélisé, idempotence allocation à durcir |
| Fidéicommis | 4 / 5 | Le plus mature. Reste à fiabiliser `Dossier.soldeFiducieDossier` |
| Dépenses cabinet | 2 / 5 | Workflow OK mais déconnecté du journal général |
| Débours dossier | 2.5 / 5 | Existe mais pas de cycle complet (paiement par cabinet → refacturation) |
| Journal général | 3 / 5 | Append-only OK, idempotence partielle, dépenses absentes |
| Comptabilité (KPIs) | 2.5 / 5 | Sources de vérité incomplètes (dépenses non journalisées) |
| Imports | 4 / 5 | Pipeline migration comptable solide et auditable |
| UX produit | 3.5 / 5 | Solide mais fragmenté entre pages |

## 4. Synthèse exécutive

SAFE est aujourd'hui **un système opérationnel honnête, pas encore un système comptable plein**. Les briques sont en place mais la doctrine n'est pas explicitée nulle part — chaque écran a fait ses choix locaux.

Les 3 chantiers les plus structurants pour passer au niveau suivant :

1. **Doctrine canonique écrite** (cf. `SAFE_ACCOUNTING_DOCTRINE.md`) — qui décide quoi, qui écrit où.
2. **Noyau commun forfait/horaire** (cf. `BILLING_CORE_MODEL.md`) — concepts unifiés (WIP, facturable, write-down/off, rentabilité).
3. **Frontières dépenses / débours** clarifiées et reflétées au journal général (cf. `EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md`).

Les autres sujets (configuration taxes, idempotence journal, approbation) sont importants mais peuvent suivre.
