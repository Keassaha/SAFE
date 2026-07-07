# SPEC — Import intelligent de reçu de dépense

> Statut : DRAFT v1, en attente validation CEO avant build.
> Date : 2026-07-06. Suite de [SPEC_IMPORT_PREUVE_PAIEMENT](SPEC_IMPORT_PREUVE_PAIEMENT.md).
> Règle projet : pas de build sans spec validée.

---

## 1. Problème

Même problème que côté paiement, symétrique : enregistrer une **dépense** = retaper à la main
fournisseur + date + montant + TPS/TVQ + catégorie depuis un reçu papier/PDF. Retranscription =
erreurs de chiffres + charge cognitive. On veut : uploader un reçu, le système lit et pré-remplit, on confirme.

Aujourd'hui les dépenses arrivent surtout de l'**import CSV bancaire** (`BankImportTransaction`). Une ligne
bancaire est pauvre (« PAIEMENT XYZ 47,15 »). Un **reçu** est riche : fournisseur exact, TPS/TVQ ventilées,
date, parfois postes. L'import de reçu apporte cette précision + évite la double saisie.

---

## 2. Le principe : un nouvel intake sur un moteur qui existe déjà

Le sous-système dépense a DÉJÀ son moteur de rapprochement + apprentissage (le pendant exact des règles
de payeur côté paiement). **On ne le réinvente pas, on le nourrit** avec une source vision.

```
[Upload reçu image/PDF]
        │
        ▼
[1] extract-expense-receipt.ts  ── Claude vision ──▶  { fournisseur, date, montantTtc, tps, tvq, montantHt }
        │
        ▼
[2] normalizeSupplier() + suggestCategoryFromRules()   (RÉUTILISÉS tels quels)
        │
        ▼
[3] Modal reçu → dépense pré-remplie (catégorie suggérée + confiance), champs éditables
        │
        ▼ (clic humain « Confirmer »)
[4] créer CabinetExpense + classer le reçu (Document) + learnCategorizationRule (si correction)
```

---

## 3. Réutilisation confirmée (le gros de la valeur est déjà là)

| Brique existante | Emplacement | Rôle dans l'import de reçu |
|---|---|---|
| Modèle dépense | `CabinetExpense` (`schema.prisma`) | déjà : `fournisseurNormalise`, `categoryId/Name`, `sousCategorie`, `montant/Ht/Ttc`, `tps`, `tvq`, `dossierId`, `refacturable`, `statutValidation`, `confidence` |
| Moteur de catégorisation | `lib/expense-journal/categorization-rules.ts` → `suggestCategoryFromRules(prisma, cabinetId, desc, supplierNorm)` | suggère catégorie + refacturable + dossier + confiance depuis les règles apprises |
| Apprentissage | même fichier → `learnCategorizationRule(...)` | mémorise « ce fournisseur → cette catégorie » (comme la case « se souvenir » des payeurs) |
| Normalisation fournisseur | `lib/expense-journal/normalize-supplier.ts` → `normalizeSupplier()` | même normalisation que l'import bancaire |
| Anti-doublon fichier | `lib/services/finance/proof-dedup.ts` → `hashProofFile()` | **réutilisé** : SHA-256 du reçu |
| Classement au dossier | `lib/services/document.ts` → `createDocumentRecord()` | le reçu devient un `Document` (type `recu_depense`), stockage Vercel Blob privé déjà en place |
| Vision | `lib/ai/extract-payment-proof.ts` (patron) | même pattern, nouveau fichier reçu |

**Vraiment neuf à construire :** l'extraction vision reçu + l'intake + le pré-remplissage UI + 2 colonnes
sur `CabinetExpense` pour le reçu conservé et l'anti-doublon. Le cerveau (catégorisation) existe.

---

## 4. Briques neuves

### Brique 1 — `lib/ai/extract-expense-receipt.ts` (vision)
Sortie JSON strict : `fournisseur`, `date` (AAAA-MM-JJ), `montantTtc`, `tps`, `tvq`, `montantHt`,
`devise`, `numeroRecu`, `confianceOcr`, `champsIllisibles`. Garde-fou : jamais de montant inventé
(null + signalé). TPS/TVQ = ce qui est **imprimé** sur le reçu ; sinon null (ne pas calculer à l'aveugle).

### Brique 2 — Intake `POST /api/journal/depenses/import-recu` (multipart)
Auth + droits compta. Hash du fichier → `findDuplicateExpense` (anti-doublon, cf. §5). Extraction →
`normalizeSupplier` → `suggestCategoryFromRules`. Renvoie `{ extraction, suggestion, hash }` ou
`{ alreadyImported, duplicate }`. NE PERSISTE RIEN.

### Brique 3 — UI modal (page `journal/depenses`)
Bouton « Importer un reçu ». Modal 2 colonnes : reçu à gauche · dépense pré-remplie à droite
(fournisseur, date, TTC, TPS, TVQ, HT, **catégorie suggérée + badge de confiance**, refacturable/dossier).
Champs éditables. Case « se souvenir : ce fournisseur → cette catégorie » (→ `learnCategorizationRule`).

### Brique 4 — Confirmation
Crée `CabinetExpense` (via l'action existante, étendue pour porter `pieceStorageKey`/`pieceHash`), classe
le reçu en `Document` (client/dossier si refacturable, sinon cabinet), apprend la règle si demandé.

---

## 5. Modèle de données (migration additive)

`CabinetExpense` n'a pas de lien reçu. Ajout :

```prisma
model CabinetExpense {
  // ... existant ...
  pieceStorageKey String? // clé du reçu conservé (Vercel Blob privé)
  pieceHash       String? // SHA-256 du reçu — anti-doublon par contenu

  @@unique([cabinetId, pieceHash]) // un même reçu → une seule dépense
}
```

Anti-doublon symétrique aux paiements : `findDuplicateExpense(cabinetId, { hash })` bloque à l'upload
(bannière) ET à la confirmation (contrainte unique). Signal secondaire possible : fournisseur+date+montant à ±.

---

## 6. Garde-fous

1. **Jamais d'écriture aveugle** : le reçu pré-remplit, l'humain valide (cohérent doctrine).
2. **TPS/TVQ = estimation à valider** (disclaimer, comme la vue taxes existante). On lit ce qui est
   imprimé ; on ne recalcule pas silencieusement.
3. **Reçu conservé** (Blob privé) + classé au dossier si refacturable (traçabilité inspection/CPA).
4. **Anti-doublon** par hash de fichier (le même reçu ne s'enregistre pas deux fois).
5. **Pas de fidéicommis** : une dépense n'est jamais une sortie de fiducie via ce flux.

---

## 7. Lots (chacun finissable + vérifiable)

| Lot | Contenu | Définition de terminé |
|-----|---------|-----------------------|
| **R0** | Migration `CabinetExpense.pieceStorageKey` + `pieceHash` + unique | colonnes en local + fichier migration |
| **R1** | `extract-expense-receipt.ts` + test sur un VRAI reçu | JSON correct sur un reçu réel, champ illisible signalé |
| **R2** | Intake `import-recu` : hash dedup + extraction + normalize + suggestCategory | route renvoie extraction + suggestion + confiance |
| **R3** | UI modal + pré-remplissage + badge confiance + « se souvenir » | à l'écran : j'uploade un reçu → dépense pré-remplie → je confirme |
| **R4** | Confirmation : créer dépense + classer reçu (Document) + apprendre règle + anti-doublon | dépense créée, reçu visible au dossier, 2ᵉ upload bloqué |

Ordre : R0 → R1 → R2 → R3 → R4. R1 a besoin d'un **vrai reçu** (fourni par le CEO) pour le calibrage.

---

## 8. Ce qu'on ne fait PAS en v1
- Pas de postes de ligne détaillés (juste totaux + TPS/TVQ).
- Pas de rapprochement automatique reçu ↔ ligne bancaire importée (garde-fou, plus tard).
- Pas d'intake email (comme côté paiement, v2 éventuelle).
