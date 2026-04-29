# SAFE — Corrections append-only

Date: 2026-04-29
Statut: source de vérité V1.
Portée: comment SAFE traite un changement matériel sur une entité métier déjà journalisée.

## 1. Principe fondamental

**On ne modifie jamais une écriture déjà comptabilisée. On la compense.**

Toute écriture du `JournalGeneralEntry` est figée à la seconde où elle est insérée. Si la réalité métier change après cette seconde, le journal doit refléter le changement par **une ou plusieurs nouvelles lignes**, jamais par mutation.

C'est ce qui permet :
- une piste d'audit complète et inviolable (Barreau, FINTRAC, Loi 25),
- la cohérence avec l'index unique partiel d'idempotence,
- la possibilité de rejouer le solde global depuis zéro à tout moment.

## 2. Définition opératoire d'un "changement matériel"

Un changement est **matériel** s'il modifie l'effet comptable réel de l'écriture déjà au journal. Tout le reste est **non matériel** et n'a pas à toucher au journal.

### 2.1 `CabinetExpense`

**Matériel** :
- `montant` (et donc `montantTtc`) — modifie la sortie de trésorerie réelle.
- `date` — modifie le mois comptable de rattachement.
- `typeTransaction` (`DEPENSE` ↔ `CREDIT`) — change le sens (sortie ↔ entrée).
- `typeTransaction` → `IGNORE` après journalisation — annulation pure (pas de re-jeu).
- `dossierId` (apparition, disparition, changement) — impact sur les rapports par dossier.
- `categoryName` — impact sur les rapports catégoriels et la lecture comptable.

**Non matériel** :
- `descriptionBancaire`, `fournisseurNormalise`, `sousCategorie`, `confidence`.
- `refacturable` — drapeau d'intention business, pas un fait comptable. La conversion vers un `DeboursDossier` se fait via un autre flux (out of scope V1).
- `categoryId` seul si `categoryName` ne change pas (c'est juste un re-rattachement de pointeur).

### 2.2 `DeboursDossier`

**Matériel** :
- `montant` — modifie la sortie de trésorerie réelle.
- `date` — modifie le mois comptable.
- `payeParCabinet: true → false` après journalisation — le cabinet a finalement *pas* payé. Annulation pure.
- `clientId` — change l'attribution.
- `dossierId` — change l'attribution.

**Non matériel** :
- `description` — un libellé reste un libellé.
- `quantite` seule (le `montant` étant déjà total : voir [lib/actions/debours.ts:30](../../lib/actions/debours.ts#L30)).
- `taxable` — drapeau de facturation, pas comptable côté trésorerie.
- `refacturable` — drapeau d'intention.
- `deboursTypeId` — reste sémantique tant que la catégorie ne change pas.

### 2.3 Règles de bord

- `payeParCabinet: false → true` n'est pas une "correction" — c'est la **création initiale** de l'écriture. Couvert par `writeJournalForDeboursPaiement` direct.
- Toute édition d'une `CabinetExpense` ou d'un `DeboursDossier` qui n'a **jamais été journalisé** ne déclenche pas de correction. Le helper de journalisation initial s'en charge.
- Une suppression n'est pas une correction et n'est pas autorisée si l'entité a déjà été journalisée (V1).

## 3. Forme canonique d'une correction

Quand un changement matériel est détecté sur une entité dont une écriture journal existe déjà :

### Étape A — Calcul de l'effet net cumulé

On lit toutes les écritures du journal liées à cette entité :
- L'écriture initiale (`sourceModule = "DEPENSES"` ou `"DEBOURS"`, `sourceId = entity.id`).
- Les éventuelles écritures de re-jeu antérieures (`sourceId = entity.id#vN`).

L'effet net = `Σ montantSortie - Σ montantEntree`.

### Étape B — Écriture de correction

Une ligne `JournalGeneralEntry` :
- `typeTransaction = "CORRECTION"`
- `sourceModule = "CORRECTION_SYSTEME"`
- `sourceId = null` (la correction n'a pas elle-même besoin d'idempotence externe — elle est volontaire et tracée par sa `reference` et `description`)
- `reference` = pointeur textuel vers l'entité d'origine (ex: `"correction:DeboursDossier:deb_42"`)
- `description` = humain : `"Correction matérielle de DeboursDossier deb_42 — montant 100$ → 130$"`
- `dateTransaction` = `now()` (la correction est datée du moment où elle est faite, pas de l'événement initial)
- Si `effetNet > 0` (sortie nette à annuler) : `montantEntree = effetNet`, `montantSortie = 0`.
- Si `effetNet < 0` (entrée nette à annuler) : `montantSortie = abs(effetNet)`, `montantEntree = 0`.
- Si `effetNet = 0` : pas de correction émise (déjà neutralisé).
- `clientId` / `dossierId` propagés depuis l'entité d'origine (lisibilité).

### Étape C — Re-jeu d'une nouvelle écriture métier (si applicable)

Si l'entité reste journalisable après le changement (montant > 0, type ≠ IGNORE, payé), on émet une nouvelle ligne au journal **comme si c'était une écriture initiale**, mais avec un `sourceId` versionné :

- `typeTransaction` = celui du flux normal (`DEPENSE`, `DEBOURS`, ou `AJUSTEMENT` selon le type)
- `sourceModule` = celui du flux normal (`DEPENSES`, `DEBOURS`)
- `sourceId = ${entity.id}#v${nextVersion}` où `nextVersion` est le plus grand `vN` déjà présent + 1, ou `2` si c'est la première correction.

Le suffixe `#vN` :
- préserve l'index unique partiel `(cabinetId, sourceModule, sourceId)` car le triplet est différent.
- maintient une traçabilité claire (l'entité d'origine est toujours identifiable par préfixe).
- permet à un job de lecture de retrouver toutes les écritures de l'entité via `sourceId LIKE 'entity_id%'`.

Si l'entité **n'est plus journalisable** après changement (ex: `IGNORE`, `payeParCabinet: true → false`, `montant = 0`), on n'émet pas de re-jeu — la correction seule suffit.

## 4. Audit trail attendu

Pour une dépense de 100$ corrigée à 130$ :

```
[t0] DEPENSE      sortie 100   sourceId=exp_1                     "Vidéotron"
[t1] CORRECTION   entrée 100   sourceModule=CORRECTION_SYSTEME    "Correction de exp_1"
[t1] DEPENSE      sortie 130   sourceId=exp_1#v2                  "Vidéotron (corrigée)"
```

Solde net après correction = `-100 + 100 - 130 = -130` ✓ (= la sortie réelle finale).

Pour un débours `payeParCabinet: true → false` :

```
[t0] DEBOURS      sortie 250   sourceId=deb_1                     "Title Search"
[t1] CORRECTION   entrée 250   sourceModule=CORRECTION_SYSTEME    "Annulation de deb_1 — non payé par cabinet"
                                                                    (pas de re-jeu)
```

Solde net = `-250 + 250 = 0` ✓.

## 5. Limites volontaires de la V1

- **Pas d'agrégat des changements multiples**. Chaque édition matérielle déclenche son propre cycle CORRECTION + (re-jeu). Pas de "rebuild from scratch".
- **Pas de réversion d'une correction**. Une correction est elle-même append-only — pour la revenir, il faut une nouvelle correction.
- **Pas de gestion automatique des changements en cascade** (ex: changement de catégorie qui propagerait à des rapports calculés). Les rapports lisent l'état courant + les corrections.
- **`TrustTransaction`** déjà géré par sa propre logique de correction historique ([trust-transaction-service.ts:377](../../lib/services/fideicommis/trust-transaction-service.ts)). Hors scope V1.
- **Suppression** d'une `CabinetExpense` ou d'un `DeboursDossier` déjà journalisé : refusée applicativement. La correction par annulation passe par une édition matérielle (changement de type vers `IGNORE`, ou `payeParCabinet → false`).
- **Pas de notification de l'opérateur**. La correction est silencieuse côté UI pour V1. Un toast / log d'activité est documenté comme prochaine étape.
- **Pas de verrou de date** : un changement de `date` rétroactif sur une période clôturée est autorisé en V1. Une mission "période clôturée" pourra rejeter ces cas plus tard.

## 6. Garde-fous

- Toute nouvelle entité journalisable doit ajouter sa fonction `hasMaterialXxxChange(before, after)` et son `applyXxxCorrection(...)` au lieu d'une logique inline.
- Toute écriture `CORRECTION` doit avoir une `description` lisible par un syndic (fait métier en clair).
- Tout re-jeu doit avoir un `sourceId` versionné — jamais le même que l'écriture initiale ou qu'un re-jeu précédent.
- Aucune mutation de ligne existante. La revue de code doit refuser tout `journalGeneralEntry.update`.

## 7. Prochaine étape (post-V1)

- Étendre aux corrections de `Invoice` (passage `ISSUED → CREDITED` via `CreditNote`).
- Ajouter un champ optionnel `correctionOfId` dans `JournalGeneralEntry` (migration future) pour matérialiser la chaîne de corrections sans dépendre du parsing de `reference`.
- Job nightly de re-calcul du `solde` cumulé depuis zéro pour détecter toute dérive historique.
