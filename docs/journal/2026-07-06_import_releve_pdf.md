# 2026-07-06 — Import de relevé bancaire PDF (extraction intelligente)

Demande CEO : uploader les documents « comme les relevés bancaires ». Décision : extraction
intelligente des transactions (pas juste stockage), relevé d'abord (reçu R0/R1 mis en pause).

## Insight
Le pipeline d'import (`lib/import/`) est 100 % générique. Un relevé PDF n'a qu'à produire le même
`ParsedFile` que le CSV, puis TOUT le reste est déjà là et inchangé : détection colonnes → normalizeBankRow
→ aperçu (validation humaine ligne par ligne) → catégorisation → dépenses/revenus. `classifyByFileName`
route déjà `.pdf` → `releve_bancaire`. Spec : docs/product/SPEC_IMPORT_RELEVE_PDF.md.

## B1 LIVRÉ + VÉRIFIÉ SUR 3 BANQUES RÉELLES ✅
`lib/import/parsers/pdf.ts` → `parsePdfBuffer(buffer, fileName): ParsedFile`. Claude lit le PDF (bloc
document, numérique ou scanné) → tableau de transactions → colonnes date/description/debit/credit/balance.
Garde-fous : débit/crédit séparés (non ambigus), jamais de montant inventé (ligne douteuse omise), sûreté
finale = l'écran d'aperçu existant. Testé (corpus docs/product/echantillons-releves-bancaires/) :
RBC 11 transactions, CIBC Edmonton 3, Desjardins FR 5 — dates ISO, débit/crédit corrects, FR + EN.

## B2 LIVRÉ + VÉRIFIÉ AU NAVIGATEUR ✅
Branchement : cas `.pdf` dans `parseFile` (pipeline) + `.pdf` dans la DropZone. IMPORTANT : l'extraction
PDF appelle Claude (clé serveur), or le wizard est `"use client"` → nouvelle server action
`analyzeStatementPdf(formData)` dans `app/(app)/import/actions.ts` (exécute `analyzeFile` côté serveur).
Le wizard route le PDF vers l'action, le CSV/Excel reste client. Vérif navigateur (cabinet test, relevé
RBC réel) : upload PDF → classification « relevé bancaire » → mapping auto (Débit→debit, Crédit→credit,
Solde→balance, direction préservée) → aperçu « Importer 11 lignes » avec dates/montants/soldes corrects.
tsc 0 erreur, tests import 27 verts. PAS d'import réel joué (pas de données de test dans le cabinet).

## Reste
- **B3** : conserver le relevé (Document `releve_bancaire`, Blob privé) + anti-doublon par hash de fichier
  (ne pas ré-importer le même relevé). Pas de schéma nouveau (createDocumentRecord + hashProofFile existent).
- Manques corpus : TD, Tangerine, Banque Laurentienne (aucun spécimen public propre) → vrai relevé caviardé
  du CEO pour couvrir ces layouts.
