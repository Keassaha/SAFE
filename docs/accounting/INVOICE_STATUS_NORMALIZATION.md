# SAFE — Normalisation de l'état facture

Date: 2026-04-29
Statut: source de vérité après V1 de normalisation.

Ce document audit l'usage actuel des trois champs d'état sur `Invoice` (`statut`, `invoiceStatus`, `paymentStatus`), définit la doctrine cible et trace la migration progressive.

## 1. Inventaire des champs

| Champ | Type | Default | Rôle attendu (V1) |
|---|---|---|---|
| `statut` | enum FR `InvoiceStatut` (`brouillon`, `envoyee`, `partiellement_payee`, `payee`, `en_retard`) | `brouillon` | **Legacy d'affichage**. Conservé pour rétro-compatibilité UI. Dérivé désormais. |
| `invoiceStatus` | enum EN `InvoiceStatusBilling` (`DRAFT`, `READY_TO_ISSUE`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`, `CREDITED`) | `DRAFT` | **Source de vérité du cycle de vie**. |
| `paymentStatus` | enum EN `PaymentStatus` (`UNPAID`, `PARTIAL`, `PAID`, `OVERPAID`) | `UNPAID` | **Source de vérité du règlement**. |

## 2. Bug central de l'état pré-normalisation

L'audit du code applicatif a révélé une **désynchronisation silencieuse** entre `statut` et `invoiceStatus` :

### 2.1 Écritures réelles de `statut` dans le code

Seuls **deux** sites écrivent jamais une valeur autre que `brouillon` (default Prisma) :

| Fichier | Valeur écrite |
|---|---|
| [lib/services/billing/invoice-service.ts:409](../../lib/services/billing/invoice-service.ts#L409) (`issueInvoice`) | `"envoyee"` |
| [lib/services/billing/invoice-service.ts:479](../../lib/services/billing/invoice-service.ts#L479) (`cancelDraft`) | `"brouillon"` (re-confirmation) |

**Aucun code ne met `statut: "payee"`, `"partiellement_payee"` ou `"en_retard"`.**

`recalculateInvoiceTotals` met à jour `paymentStatus` mais ne touche **jamais** à `statut`.

### 2.2 Conséquences sur les lectures

Les filtres ci-dessous lisent des valeurs qui **ne sont jamais écrites** → ils retournent toujours 0 ou des résultats sous-estimés :

| Fichier | Filtre fautif | Effet |
|---|---|---|
| [app/(app)/tableau-de-bord/page.tsx:223,331](../../app/\(app\)/tableau-de-bord/page.tsx) | `statut: "en_retard"` | KPI "en retard" toujours à 0 |
| [app/(app)/parametres/page.tsx:193](../../app/\(app\)/parametres/page.tsx) | `statut: "en_retard"` | Compteur paramètres faussé |
| [app/(app)/facturation/page.tsx:103](../../app/\(app\)/facturation/page.tsx) | `statut: "en_retard"` | KPI facturation faussé |
| [components/facturation/FacturationKpis.tsx:103,133](../../components/facturation/FacturationKpis.tsx) | `statut: "payee"`, `"en_retard"` | Composant alternatif aux KPIs faussé |
| [lib/rapports/load.ts:97,152](../../lib/rapports/load.ts) | `statut: { in: ["envoyee", "partiellement_payee", "en_retard"] }` | Rapports : seules les `"envoyee"` remontent, les autres jamais |

`invoiceStatus = "OVERDUE"` est aussi lu (`paiements/context/route.ts`, `reminder-service.ts`) mais **jamais écrit**. Le calcul "en retard" doit donc être dynamique : `invoiceStatus = ISSUED` + `paymentStatus ≠ PAID` + `dateEcheance < now()`.

### 2.3 Lectures correctes existantes

| Fichier | Filtre | Statut |
|---|---|---|
| [app/(app)/facturation/verification/page.tsx:17](../../app/\(app\)/facturation/verification/page.tsx) | `invoiceStatus: { in: ["DRAFT", "READY_TO_ISSUE"] }` | ✓ correct |
| [app/(app)/facturation/page.tsx:97,113](../../app/\(app\)/facturation/page.tsx) | `invoiceStatus: "ISSUED"`, `{ in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] }` | ✓ correct (le `PARTIALLY_PAID/PAID/OVERDUE` ne capture rien actuellement, mais sera capturé après normalisation des dérivés ou via `paymentStatus`) |
| [lib/services/billing/reminder-service.ts:67](../../lib/services/billing/reminder-service.ts) | `invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] }` | partiel — devrait combiner `ISSUED` + `paymentStatus ≠ PAID` |
| [app/(app)/tableau-de-bord/page.tsx:251](../../app/\(app\)/tableau-de-bord/page.tsx) | `paymentStatus: { not: "PAID" }` | ✓ correct |
| [app/(app)/facturation/frais/page.tsx:32](../../app/\(app\)/facturation/frais/page.tsx) | `paymentStatus: { not: "PAID" }` | ✓ correct |

## 3. Doctrine cible

### 3.1 Source de vérité par concept

| Concept | Source de vérité | Note |
|---|---|---|
| Cycle de vie de la facture | `invoiceStatus` | DRAFT → READY_TO_ISSUE → ISSUED → CANCELLED ; CREDITED via CreditNote |
| Règlement de la facture | `paymentStatus` | UNPAID → PARTIAL → PAID (ou OVERPAID) |
| « En retard » | **Dérivé** : `invoiceStatus = ISSUED` AND `paymentStatus ≠ PAID` AND `dateEcheance < now()` | Pas stocké. `invoiceStatus.OVERDUE` ne doit pas être écrit (deviendrait obsolète instantanément). |
| Affichage UI legacy `statut` | **Dérivé** via helper | Le champ `statut` reste en base par compatibilité, mais aucune logique métier ne doit en dépendre. |

### 3.2 Conventions

- Tout filtre Prisma sur l'état métier passe par les **where builders** de `lib/billing/invoice-status.ts`. Plus aucun `statut: "..."` en dur dans les pages/services.
- Tout libellé UI dérive de `getInvoiceLifecycleCategory(inv)` ou de `deriveLegacyStatut(inv)` quand le composant attend l'enum legacy.
- L'API publique du filtre URL `?statut=...` reste compatible : `legacyStatutToInvoiceWhere(statut)` traduit chaque valeur legacy en `Prisma.InvoiceWhereInput` canonique.
- À chaque transition de cycle de vie, `invoiceStatus` est la source écrite. `statut` est ré-aligné par le service quand pertinent (pour ne pas surprendre les écrans qui le lisent encore en V1).

### 3.3 Catégories canoniques (LifecycleCategory)

Le helper expose une catégorie unifiée plus haute que les enums Prisma, pour clarifier les buckets UI :

| Catégorie | Définition |
|---|---|
| `draft` | `invoiceStatus ∈ {DRAFT, READY_TO_ISSUE}` |
| `issued_active` | `invoiceStatus = ISSUED` AND `paymentStatus ∈ {UNPAID, PARTIAL}` AND **non en retard** |
| `partially_paid` | sous-cas de `issued_active` : `paymentStatus = PARTIAL` |
| `overdue` | `invoiceStatus = ISSUED` AND `paymentStatus ≠ PAID` AND `dateEcheance < now()` |
| `paid` | `paymentStatus = PAID` ou `OVERPAID` |
| `cancelled` | `invoiceStatus = CANCELLED` |
| `credited` | `invoiceStatus = CREDITED` |

## 4. Plan de migration

### 4.1 Migré dans cette mission (V1)

| Fichier | Avant | Après |
|---|---|---|
| `app/(app)/facturation/page.tsx` | `statut: "envoyee"`, `statut: "en_retard"`, `statut: "brouillon"`, et filtre URL `statut` brut | `whereInvoiceIssuedActive()`, `whereInvoiceOverdue()`, `whereInvoiceDraft()`, et `legacyStatutToInvoiceWhere(statutParam)` pour le filtre URL |
| `app/(app)/tableau-de-bord/page.tsx` | 3 filtres `statut` (en_retard ×2, envoyee, brouillon) | Where builders correspondants |
| `app/(app)/parametres/page.tsx` | `statut: "en_retard"` | `whereInvoiceOverdue()` |
| `app/(app)/facturation/suivi/page.tsx` | `statut: { in: [...] }` | `whereInvoiceIssuedActive()` ∪ `whereInvoiceOverdue()` ∪ `whereInvoicePaid()` |
| `lib/rapports/load.ts` | `statut: { in: ["envoyee", "partiellement_payee", "en_retard"] }` | `whereInvoiceForReports()` qui agrège les buckets corrects |
| `components/facturation/FacturationKpis.tsx` | Liens basés sur `statut: "payee"`, etc. | `deriveLegacyStatut()` pour conserver l'API URL legacy + `currentStatut` reste basé sur l'enum FR pour compatibilité |

### 4.2 Volontairement laissé en transition (V1)

| Sujet | Raison |
|---|---|
| Affichage `invoice.statut` dans `FactureEditView`, `InvoicePreviewModal`, `FacturationTable`, `app/facture/[token]/page.tsx`, `app/api/.../route.ts` | Ces sites **affichent** la valeur stockée et fonctionnent grâce au sync `issueInvoice/cancelDraft`. À déplacer vers `deriveLegacyStatut(inv)` dans une mission UI dédiée. Pas bloquant. |
| `lib/services/billing/reminder-service.ts:67` (`invoiceStatus.OVERDUE` lu mais pas écrit) | À fixer dans une mission "reminders" dédiée — la logique de relance doit utiliser le calcul dynamique d'OVERDUE. Hors scope de cette normalisation. |
| Suppression du champ `Invoice.statut` du schéma | Migration Prisma destructive — pas dans cette V1. À programmer une fois 100% des lectures migrées et après audit prod. |

## 5. Mapping legacy → canonique

Pour conserver compatibilité du filtre URL `?statut=...` :

| `?statut=` | Traduction `Prisma.InvoiceWhereInput` |
|---|---|
| `brouillon` | `{ invoiceStatus: { in: ["DRAFT", "READY_TO_ISSUE"] } }` |
| `envoyee` | `whereInvoiceIssuedActive()` (ISSUED + UNPAID/PARTIAL + non en retard) |
| `partiellement_payee` | `whereInvoicePartiallyPaid()` (ISSUED + PARTIAL) |
| `payee` | `whereInvoicePaid()` (paymentStatus PAID/OVERPAID) |
| `en_retard` | `whereInvoiceOverdue()` (ISSUED + ≠ PAID + dateEcheance < now) |

L'inverse : `deriveLegacyStatut(inv)` retourne la valeur FR à partir de `invoiceStatus + paymentStatus + dateEcheance`, dans cet ordre de priorité (le 1er match gagne) :

1. `cancelled`/`credited` → `brouillon` (legacy n'a pas ces valeurs)
2. `paid` → `payee`
3. `overdue` → `en_retard`
4. `partial + issued` → `partiellement_payee`
5. `issued` → `envoyee`
6. sinon → `brouillon`

## 6. Limites volontaires V1

- **Pas de migration de données** sur les `Invoice.statut` historiques. Les valeurs en base restent telles quelles ; les lectures passent désormais par les helpers canoniques.
- **Pas de helper de mutation** (`setInvoiceStatus(...)`). Les transitions passent toujours par les services métier (`approveInvoice`, `issueInvoice`, `cancelDraft`).
- **Pas de filtre `statut: "envoyee"` éliminé** dans les services secondaires (reminder, interest) — ils lisent déjà `invoiceStatus` et fonctionnent.
- **`OVERDUE` calculé dynamiquement** : si une mission future veut un champ stocké pour requêtage rapide, elle devra prévoir un job de re-calcul nightly + invalidation.

## 7. Prochaine priorité

1. Migrer les libellés UI (`FactureEditView`, `InvoicePreviewModal`, `FacturationTable`) vers `deriveLegacyStatut(inv)` au render pour qu'aucun composant ne lise `invoice.statut` directement.
2. `reminder-service.ts` : remplacer `invoiceStatus.OVERDUE` par le calcul dynamique.
3. Une fois ces lectures migrées, programmer une migration Prisma qui supprime `Invoice.statut` (DROP COLUMN) et l'enum `InvoiceStatut`.
