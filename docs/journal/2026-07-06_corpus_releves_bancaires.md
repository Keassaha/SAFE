# 2026-07-06 — Corpus de relevés bancaires pour calibrage parser PDF

## Buildé
- Créé `docs/product/echantillons-releves-bancaires/` : 11 spécimens/exemples officiels de relevés
  bancaires canadiens, téléchargés et vérifiés (tous vrais PDF).
- Index documenté (`INDEX.md`) : par fichier, banque, type, layout, valeur de calibrage + sources.
- Alimente le lot B1 de `SPEC_IMPORT_RELEVE_PDF` (qui exige un « vrai relevé » pour caler
  `lib/import/parsers/pdf.ts`).

## Décidé
- **N'utiliser que des sources légitimes** : spécimens publiés par les banques ou exemple caviardé
  hébergé par une source publique (Ville d'Edmonton). Les sites de « templates de relevés »
  (truebankdocs, bankstatementpdfedit, pdfliner, freestatements, Scribd, Issuu) sont **écartés** :
  ce sont des générateurs de faux relevés (outillage de fraude), ni authentiques ni conformes Barreau.

## Observé
- Meilleures fixtures : **RBC** (« Susan Sample », relevé chèque perso officiel) et **CIBC**
  (exemple Edmonton) : tableau complet Date / Description / Retraits / Dépôts / Solde. Parfaites pour
  tester le parser de bout en bout.
- Couverture Québec : Desjardins (relevé expliqué) + Banque Nationale (relevé BAI). Bien.
- **Manques** : TD (aucun spécimen de relevé de compte téléchargeable), Tangerine/EQ/Simplii
  (rien de propre publiquement), Laurentienne. À combler avec un vrai relevé caviardé (client ou dog food).
