# SPEC — Import de relevé bancaire PDF (extraction intelligente)

> Statut : DRAFT v1, en attente validation CEO avant build.
> Date : 2026-07-06. Sœur de [SPEC_IMPORT_RECU_DEPENSE](SPEC_IMPORT_RECU_DEPENSE.md) (en pause).
> Règle projet : pas de build sans spec validée.

---

## 1. Problème

Les relevés bancaires arrivent aujourd'hui en **CSV** (via `/import` → `SafeImportWizard`). Or les
banques donnent surtout des **PDF**. Exporter un CSV propre est une friction que peu de gens franchissent.
On veut : uploader le **relevé PDF** tel que la banque le donne, en extraire toutes les transactions,
et les faire entrer dans le flux existant (catégorisation → dépenses/revenus), avec le relevé conservé.

---

## 2. Le principe : un nouveau parser sur un pipeline entièrement générique

**Découverte clé (cartographie du pipeline) :** tout le pipeline d'import est agnostique du format. Un
relevé PDF n'a qu'à produire le **même `ParsedFile`** que le CSV. Ensuite, **rien d'autre ne change** :

```
[Upload relevé PDF]
        │
        ▼
[NEUF] parsePdfBuffer()  ── extraction ──▶  ParsedFile { headers:[date,description,amount,balance], rows: RawRow[] }
        │
        ▼   (à partir d'ici, PIPELINE EXISTANT INCHANGÉ)
detectColumns → normalizeBankRow → APERÇU (validation humaine ligne par ligne)
        │
        ▼ (l'humain valide l'aperçu)
importBankStatements → suggestCategoryFromRules → BankImportTransaction → dépenses/revenus
```

---

## 3. Réutilisation confirmée (quasi tout existe déjà)

| Brique existante | Emplacement | Rôle |
|---|---|---|
| Assistant d'import | `components/import/SafeImportWizard.tsx` | upload → classify → mapping → **preview** → import |
| Pipeline | `lib/import/pipeline.ts` (`parseFile`, `normalizeRows`, `generateAccountingPreview`) | orchestration, **inchangé** |
| Contrat de ligne | `lib/import/types.ts` (`ParsedFile`, `RawRow`, `NormalizedBankTransaction`) | ce que le parser PDF doit produire |
| Normalisation bancaire | `lib/import/normalizers/bank-statement.ts` (`normalizeBankRow`) | inchangé |
| Détection colonnes | `lib/import/detect-columns.ts` | reconnaît déjà les patterns bancaires |
| Classification fichier | `lib/import/classify.ts` (`classifyByFileName`) | route déjà `.pdf` → `releve_bancaire` |
| Import → dépense | `app/(app)/import/actions.ts` (`importBankStatements`) | crée `BankImportTransaction` + catégorise, inchangé |
| Catégorisation + apprentissage | `lib/expense-journal/categorization-rules.ts` | inchangé |
| Conservation fichier | `createDocumentRecord` + Vercel Blob privé | conserver le relevé (type `releve_bancaire`) |
| Anti-doublon fichier | `hashProofFile` (`proof-dedup.ts`) | ne pas ré-importer le même relevé |

**Vraiment neuf :** `parsePdfBuffer` (PDF → lignes) + `.pdf` dans la DropZone + conservation du relevé.

---

## 4. Brique neuve : `lib/import/parsers/pdf.ts` → `parsePdfBuffer(buffer, fileName): ParsedFile`

Le défi = layouts de relevés très variés (formats de date, colonnes débit/crédit vs montant signé,
descriptions multi-lignes, multi-pages). Approche robuste :

1. **Extraction assistée par Claude** (le plus fiable pour des layouts arbitraires) : on envoie le PDF
   (bloc `document`, gère numérique ET scanné) et Claude renvoie un **tableau JSON de transactions**
   `{ date (AAAA-MM-JJ), description, amount, type: "debit"|"credit" }`.
2. On mappe ce tableau en `ParsedFile` (`headers: [date, description, amount, type]`, `rows: RawRow[]`).
3. Le reste du pipeline prend le relais.

Garde-fous d'extraction :
- **Jamais de montant inventé** : une ligne douteuse est marquée, pas devinée.
- **La sûreté vient de l'APERÇU existant** : l'humain voit et corrige chaque transaction avant toute
  persistance. Aucune écriture aveugle (cohérent doctrine). C'est ce qui rend l'extraction acceptable
  malgré la variété des relevés.
- Multi-pages : si le relevé dépasse une limite raisonnable, découpage par page/lot (à cadrer en R-build).

---

## 5. Conservation + anti-doublon

- Le relevé PDF est conservé comme `Document` (type `releve_bancaire`, Vercel Blob privé).
- **Hash du fichier** (`hashProofFile`) : bloque le ré-import du même relevé (bannière), au niveau de
  la `BankImportSession`. Complète le `__rowFingerprint` existant (anti-doublon ligne-à-ligne intra-fichier).

---

## 6. Lots

| Lot | Contenu | Définition de terminé |
|-----|---------|-----------------------|
| **B1** | `parsePdfBuffer` (extraction Claude → `ParsedFile`) + test sur un VRAI relevé PDF | les transactions d'un vrai relevé ressortent en lignes correctes |
| **B2** | Brancher `.pdf` dans `parseFile` (pipeline) + `.pdf` dans la DropZone du wizard | j'uploade un PDF dans `/import` → l'aperçu affiche les transactions |
| **B3** | Conservation du relevé (Document) + anti-doublon par hash de fichier | relevé visible/conservé, 2ᵉ upload du même relevé bloqué |

Ordre : B1 → B2 → B3. B1 a besoin d'un **vrai relevé PDF** (fourni par le CEO) pour le calibrage.

---

## 7. Ce qu'on ne fait PAS en v1
- Pas de connexion bancaire directe (agrégateur type Flinks) — c'est un autre chantier.
- Pas de rapprochement automatique relevé ↔ reçus (garde-fou, plus tard).
- Le CSV reste supporté tel quel (on ajoute le PDF, on ne remplace rien).
