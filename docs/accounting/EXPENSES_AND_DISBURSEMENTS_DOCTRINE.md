# SAFE — Doctrine dépenses et débours

Date: 2026-04-29
But: trancher la frontière entre `Expense`, `CabinetExpense` et `DeboursDossier` et fixer comment chacun interagit avec le journal général.

## 1. Le test décisif

Quand l'opérateur a un mouvement de trésorerie sortant à enregistrer, il pose **une seule question** :

> « Est-ce qu'on va le refacturer à un client précis ? »

| Réponse | Modèle |
|---|---|
| Non — c'est un coût du cabinet (loyer, abonnement, fournitures, salaires, assurances). | **`CabinetExpense`** |
| Oui — on a payé pour le compte d'un dossier (frais IRCC, Title Search, courrier urgent). | **`DeboursDossier`** |
| « Je ne sais pas encore » | **`CabinetExpense` par défaut**, avec drapeau `refacturable: true` et lien `dossierId` si pertinent. Quand la facture du dossier est composée, l'opérateur convertit (ou ignore). |

**Règle dure** : ne jamais créer une `CabinetExpense` ET un `DeboursDossier` pour le même mouvement. Le double n'est jamais voulu.

## 2. Statut canonique des trois modèles

### 2.1 `Expense` (legacy)

**Statut** : à considérer comme **legacy / déprécié** pour V2. Aucune nouvelle écriture ne doit créer un `Expense`. Les écrans existants qui le lisent restent compatibles, mais toute évolution passe par `DeboursDossier` (côté refacturable) ou `CabinetExpense` (côté coût cabinet).

**Plan de sortie** : marquer le modèle `@deprecated` dans le schéma et migrer les enregistrements existants. Hors scope V2.

### 2.2 `CabinetExpense`

**Rôle** : journaliser un coût opérationnel du cabinet validé.

**Règles** :
- Crée systématiquement une entrée au journal général :
  - `sourceModule = DEPENSES`
  - `typeTransaction = DEPENSE`
  - `sourceId = CabinetExpense.id`
  - `montantSortie = montant`
  - `montantEntree = 0` sauf si `typeTransaction = CREDIT` (rare, traité en entrée).
- Ne porte pas de `clientId`. Peut porter un `dossierId` en cas de dépense interne attribuable (ex: déplacement pour un dossier mais non refacturé).
- `refacturable = true` est un **drapeau d'intention**, pas un statut comptable. Tant qu'aucun `DeboursDossier` n'est créé, la dépense reste un coût du cabinet.

**À implémenter** : helper `writeJournalForCabinetExpense(expense)` à appeler depuis `validateImportedTransaction` et toute création manuelle. Idempotent via `(cabinetId, sourceModule, sourceId)`.

### 2.3 `DeboursDossier`

**Rôle** : avancer un coût pour le compte d'un dossier, à refacturer.

**Cycle** :

```
1. Créé (saisie ou import qualifié)
2. Payé par le cabinet         → écriture journal SORTIE (DEBOURS)
3. Refacturé via Invoice       → ajout d'une InvoiceLine sourceType=debours_dossier
4. Encaissé via Payment        → écriture journal ENTREE (PAIEMENT, déjà gérée par flux paiement)
```

**Règles** :
- Toujours rattaché à `dossierId` + `clientId`.
- Toujours associé à un `DeboursType` (ex: "IRCC Application Fee", "Title Search") — taxabilité dérivée du type, pas saisie ad-hoc.
- `payeParCabinet` (booléen) : passe à `true` quand le cabinet a sorti l'argent. C'est cet événement qui déclenche l'écriture journal côté SORTIE (avant refacturation).
- `refacturable` (booléen) : par défaut `true`. Mis à `false` si on décide finalement de l'absorber.
- `factureId` / `invoiceLineId` : alimenté à la refacturation.

**À implémenter** : helper `writeJournalForDeboursPaiement(debours)` appelé quand `payeParCabinet` passe à `true`. Idempotent.

## 3. Symétrie avec le journal

| Événement métier | Modèle Prisma | Sens journal | Type | sourceModule |
|---|---|---|---|---|
| Validation dépense cabinet | `CabinetExpense` | Sortie | `DEPENSE` | `DEPENSES` |
| Cabinet paie un débours pour un dossier | `DeboursDossier.payeParCabinet=true` | Sortie | `DEBOURS` | `DEBOURS` |
| Refacturation du débours via facture | (déjà via `Invoice ISSUED`) | Entrée | `FACTURE` | `FACTURATION` |
| Encaissement de la facture | `Payment` + `PaymentAllocation` | Entrée | `PAIEMENT` | `PAIEMENTS` |
| Crédit fournisseur sur dépense | `CabinetExpense` type=CREDIT | Entrée | `AJUSTEMENT` | `DEPENSES` |

**Conséquence** : les KPIs comptabilité (revenus, dépenses, marge) deviennent enfin lisibles directement depuis le journal général.

## 4. Workflow d'import bancaire (recadrage)

Aujourd'hui ([app/(app)/journal/depenses/actions.ts](../../app/(app)/journal/depenses/actions.ts)) :

```
BankImportSession → BankImportTransaction (catégorisée) → CabinetExpense [STOP]
```

Cible :

```
BankImportSession → BankImportTransaction (catégorisée) → CabinetExpense → JournalGeneralEntry
                                                              ↓
                                              (si refacturable)
                                                              ↓
                                                     DeboursDossier (option)
```

La première étape est de brancher `writeJournalForCabinetExpense` après validation. La conversion vers `DeboursDossier` reste un acte volontaire de l'opérateur — pas automatique.

## 5. Workflow d'import comptable historique

Le pipeline `migration_comptable` ([app/(app)/import/actions.ts](../../app/(app)/import/actions.ts)) écrit **directement** au journal. C'est volontaire :
- Une migration historique reflète des écritures déjà validées dans le système précédent.
- L'opérateur ne re-classifie pas chaque ligne ; le moteur se contente d'écrire ce qui est propre.
- Idempotence via `sourceId = fingerprint`.

Pas de doublon `CabinetExpense` créé en parallèle. La migration ne touche pas `CabinetExpense`.

## 6. Cas litigieux

### 6.1 Dépense « peut-être » refacturable

L'opérateur valide une dépense en cochant `refacturable = true` mais ne la rattache pas tout de suite à un dossier précis. Comportement :
- `CabinetExpense` créée, `refacturable = true`, `dossierId = null`.
- Écriture journal SORTIE.
- Plus tard, lors de la composition d'une facture, l'opérateur peut **convertir** la dépense en `DeboursDossier`. La conversion crée un `DeboursDossier` et **annule** la `CabinetExpense` via une entrée journal `CORRECTION` (entrée `montantEntree = montant` côté `DEPENSES` et `montantSortie = montant` côté `DEBOURS`).
- Pas de double-comptage net.

### 6.2 Débours payé directement par le client (jamais avancé par le cabinet)

Pas de mouvement de trésorerie côté cabinet. **Aucune écriture journal**. La ligne peut figurer sur la facture pour information, mais sans impact comptable.

### 6.3 Débours non refacturé finalement

`DeboursDossier.refacturable = false`. La sortie journal a déjà été enregistrée à l'avance de fonds. Aucune entrée compensatoire — le cabinet absorbe le coût. C'est la traçabilité de cette absorption qui compte.

### 6.4 Re-import du même fichier bancaire

Idempotence : la combinaison `(cabinetId, BankImportSession.fileFingerprint)` doit être unique au niveau `BankImportSession`. À l'intérieur, l'idempotence par ligne dépend du `BankImportTransaction.fingerprint`. À durcir.

## 7. Synthèse

| Question opérateur | Réponse SAFE |
|---|---|
| Où je range cette ligne d'import bancaire ? | `CabinetExpense` (validée). |
| Et si c'est un débours pour un dossier ? | Convertir en `DeboursDossier` après validation. |
| Comment je retrouve cette dépense en compta ? | Au journal général, source `DEPENSES` ou `DEBOURS`. |
| Comment je facture un débours ? | Refacturation via `Invoice` → ligne `sourceType = debours_dossier`. |
| Le `Expense` legacy ? | Ne plus créer. Lecture seule pour l'historique. |
