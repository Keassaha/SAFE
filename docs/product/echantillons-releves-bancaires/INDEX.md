# Échantillons de relevés bancaires (corpus de calibrage parser PDF)

> Corpus pour calibrer `lib/import/parsers/pdf.ts` (lot B1 de [SPEC_IMPORT_RELEVE_PDF](../SPEC_IMPORT_RELEVE_PDF.md)).
> Constitué le 2026-07-06. Uniquement des **spécimens officiels publiés par les banques** ou des
> exemples hébergés par une source publique propre (gouvernement). Aucun fichier ne provient d'un
> site de « templates de relevés » (générateurs de faux relevés, outillage de fraude) : écartés
> volontairement, ni authentiques ni conformes.

## Ce que ces fichiers sont (et ne sont pas)

Les banques ne publient **pas** de « modèle vierge » téléchargeable de leur relevé. Ce qui existe
publiquement :
- des **spécimens** (relevé « Susan Sample », données factices mais layout réel) ;
- des **guides** « comment lire votre relevé » (le vrai relevé y figure en image) ;
- un **exemple réel caviardé** hébergé par une source publique (Ville d'Edmonton).

Les deux fixtures les plus utiles au parser (tableau de transactions complet, layout personnel) :
**RBC** et **CIBC (Edmonton)**.

## Corpus

| Fichier | Banque | Type | Layout transactions | Valeur calibrage |
|---|---|---|---|---|
| `rbc_sample-estatement.pdf` | RBC | Spécimen officiel (chèque perso « Susan Sample ») | Date / Description / Withdrawals / Deposits / Balance | ⭐⭐⭐ idéal |
| `cibc_account-statement_example_edmonton.pdf` | CIBC | Exemple réel caviardé (hébergé Ville d'Edmonton) | Date / Description / Withdrawals / Deposits / Balance | ⭐⭐⭐ idéal |
| `cibc_sample-statement_en.pdf` | CIBC | Spécimen officiel (relevé de placements) | Tableaux de positions/opérations | ⭐⭐ |
| `desjardins_releve-compte-explique_fr.pdf` | Desjardins | Guide « votre relevé de compte expliqué » (FR) | Relevé réel en image + légende | ⭐⭐⭐ (Québec) |
| `desjardins_fonds_grille-releve.pdf` | Desjardins (Fonds) | Grille de lecture relevé de placements | Relevé placements | ⭐ |
| `banque-nationale_releve-compte-bai_fr.pdf` | Banque Nationale | Guide relevé de compte BAI (entreprises/trésorerie) | Format BAI | ⭐⭐ (Québec) |
| `banque-nationale_comprendre-releve-portefeuille_fr.pdf` | Banque Nationale | Guide relevé de portefeuille | Relevé placements | ⭐ |
| `bmo_private-banking_understanding-statement.pdf` | BMO | Guide « understanding your statement » (Private Banking) | Relevé perso + placements | ⭐⭐ |
| `bmo_investorline_statement-insert.pdf` | BMO InvestorLine | Encart explicatif relevé de courtage | Relevé placements | ⭐ |
| `scotiabank_account-analysis_info_fr.pdf` | Scotiabank | Info relevé Account Analysis (entreprises) | Relevé analyse de compte | ⭐⭐ |
| `cibc_estatements_how-to-guide_en.pdf` | CIBC | Guide d'accès aux eStatements | Capture d'écran de relevé | ⭐ |

## Manques (à combler avec un vrai relevé caviardé du CEO)

- **TD Canada Trust** : aucun spécimen de relevé de compte téléchargeable officiellement (seulement
  spécimens de chèque + brochures de comptes). Layout TD non couvert.
- **Tangerine / EQ Bank / Simplii** : rien de propre publiquement (uniquement Scribd = relevés
  personnels d'usagers, ou sites de faux relevés). Écartés.
- **Banque Laurentienne** : rien trouvé.

Pour ces banques, le meilleur intrant reste un **vrai relevé PDF caviardé** fourni par un cabinet
client ou par SAFE Inc. (dog food).

## Sources

- RBC : https://www.rbcroyalbank.com/banking-services/_assets-custom/pdf/eStatement.pdf
- CIBC (Edmonton) : https://www.edmonton.ca/sites/default/files/public-files/Bank-Statement-Example.pdf
- CIBC (placements) : https://www.cibc.com/content/dam/personal_banking/investments/pdfs/sample-statement-en.pdf
- CIBC (guide eStatements) : https://www.cibc.com/content/dam/personal_banking/ways_to_bank/pdfs/how-toguide-cibc-estatements-en.pdf
- Desjardins (relevé expliqué) : https://www.desjardins.com/ressources/pdf/b10-releve-compte-f.pdf
- Desjardins (fonds) : https://www.fondsdesjardins.com/information/grille-releve-FD.pdf
- Banque Nationale (BAI) : https://www.bnc.ca/content/dam/bnc/outils-apps/entreprises/guides/guide-releve-compte-bai-fr.pdf
- Banque Nationale (portefeuille) : https://info.bnri.ca/content/dam/nbin/pdf/pdf-comprendre-releve-portefeuille.pdf
- BMO (Private Banking) : https://www.bmo.com/pdf/pb/Understanding_your_BMO_PB_Statement.pdf
- BMO (InvestorLine) : https://www.bmoinvestorline.com/selfDirected/pdfs/Statement_Insert_SD_E.pdf
- Scotiabank (Account Analysis) : https://www.scotiabank.com/ca/common/pdf/about_scotia_fr/additionalInformation20973.pdf
