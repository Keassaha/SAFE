# 2026-07-06 — Corpus de reçus pour calibrage extraction de dépense (R1 → R4)

## Buildé
- Créé `docs/product/echantillons-recus/` : **70 vrais reçus annotés** (image + label de vérité-terrain).
  - `sroie/` : 30 reçus ICDAR-2019 SROIE (retail EN) + labels company/date/address/total.
  - `varie-marchands/` : 40 reçus HF docjay131 (Walmart, McDonald's, Panda Express, Pizza Hut, WinCo…)
    + JSON riche (marchand, date, articles, prix).
- Index documenté (`INDEX.md`) : contenu, format, usage (harnais de calibrage), manques, sources pour scaler.

## Décidé
- **Sources légitimes uniquement** : datasets de recherche / Hugging Face. Les sites de « générateurs
  de reçus » (fausses notes de frais) sont **écartés**, même logique que le corpus relevés bancaires.
- Recadrage : le « modèle » = Claude vision, **non entraîné**. Le corpus sert à **calibrer/tester**
  `extract-expense-receipt.ts` (mesurer précision, régler prompt, jeu de régression R1→R4), pas à fine-tuner.

## Observé
- Bon pour calibrer le **squelette** : lire marchand / date / total / n° sur des layouts variés.
- **Manque central** : zéro reçu canadien → aucune **TPS/TVQ**, aucun français. Or c'est le
  différenciateur québécois (la spec lit les taxes imprimées). À combler par ~15 **vrais reçus QC**
  photographiés par le CEO (Bureau en Gros, Jean Coutu, Metro, essence, resto, stationnement…).
  C'est le « vrai reçu » que R1 réclame, et le plus rentable à réunir.
- Format images (jpg) volontaire : plus réaliste qu'un PDF ; l'extracteur gère nativement les images.

## Reprise R1 → R2 (même session)
- **R1 MESURÉ** : harnais `scripts/calibrate-receipts.ts` (compare extraction vs label, taux par champ).
  Run initial 6 reçus : **fournisseur 6/6, date 6/6, total 6/6**. Le squelette d'extraction est fiable.
  Correction mémoire : `ANTHROPIC_API_KEY` est **présente** dans `.env.local` (plus le bloquant supposé).
- **R0 déjà fait** : migration `pieceStorageKey`/`pieceHash` + unique `@@unique([cabinetId, pieceHash])`.
- **R2 fait** : route `POST /api/journal/depenses/import-recu` (auth + `canManageExpenseJournal`, validation
  type/taille, hash → `findDuplicateExpense` → extraction → `normalizeSupplier` → `suggestCategoryFromRules`,
  ne persiste rien). Ajout `findDuplicateExpense` dans `lib/services/finance/proof-dedup.ts`. Typecheck OK.
- **R3 + R4 faits et VÉRIFIÉS à l'écran** (fait ensemble : un modal avec bouton mort ne se vérifie pas ;
  doctrine « terminé = à l'écran »).
  - R3 : `components/expense-journal/ImportRecuModal.tsx` + bouton dans `ExpenseJournalPageView` +
    namespace i18n `receiptImport` (fr/en). Modal 2 colonnes : reçu | dépense pré-remplie, badge de
    confiance sur la catégorie, disclaimer TPS/TVQ, champs éditables, case « se souvenir ».
  - R4 : route `POST /api/journal/depenses/import-recu/confirmer` : crée `CabinetExpense` (VALIDE) +
    **écriture journal append-only** (`writeJournalForCabinetExpense`, doctrine §4) + classe le reçu en
    `Document` (recu_depense) + apprend la règle + anti-doublon.
  - **Preuve** (cabinet test local, `/comptabilite?tab=depenses`) : upload d'un vrai reçu → extraction
    réelle → dépense pré-remplie → correction humaine → enregistrement. Vérifié en base : CabinetExpense
    17$ « la Source » VALIDE, écriture journal présente, Document classé, règle « la Source → Fournitures
    de bureau » apprise. Ré-upload du même fichier → bannière doublon, sans rappel IA.
  - **Observé (garde-fou en action)** : sur un reçu photographié de biais (café Paris, EUR), l'extracteur
    a lu TTC=47 au lieu de 17,00 imprimé. L'écran de validation humaine a permis la correction avant
    écriture (cohérent doctrine « jamais d'écriture aveugle »). Confirme la valeur de l'aperçu obligatoire.
  - **Note test** : une dépense de test « la Source » subsiste dans le cabinet test local (inoffensif).
