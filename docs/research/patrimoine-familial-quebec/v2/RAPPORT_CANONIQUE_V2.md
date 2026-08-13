# Knowledge base canonique V2 - patrimoines conjugaux au Quebec

Date de consolidation : 2026-08-12  
Version : 2.0  
Statut global : `VALIDATION_PROFESSIONNELLE_REQUISE`  
Sources consolidees : recherche SAFE V0.1, rapport externe de 34 pages, knowledge base externe V1.0  
Territoire : Quebec, Canada

## Avertissement

Ce document est une synthese de recherche preparatoire. Il ne constitue pas un avis juridique, fiscal, comptable, notarial ou actuariel. Aucun statut de cette base ne signifie qu'une regle a ete approuvee pour un usage client. La V2 remplace donc `PROD_READY` par des statuts de recherche et de validation explicites.

## 1. Decision de synthese

Le futur produit ne doit pas etre concu comme un calculateur unique. La V2 retient trois moteurs juridiques separes, coordonnes par un orchestrateur de dossier :

1. `PF` - patrimoine familial, C.c.Q. art. 414 a 426;
2. `SA` - societe d'acquets, C.c.Q. art. 448 a 484;
3. `PUP` - patrimoine d'union parentale, C.c.Q. art. 521.20 a 521.47, dont le patrimoine aux art. 521.29 et suivants.

Le patrimoine familial est liquide avant le regime matrimonial. Le PUP est distinct et ne doit pas etre cumule automatiquement avec PF ou SA. La fiscalite, la retraite et la preuve sont des services transversaux, non des moteurs de qualification autonomes.

## 2. Normalisation des statuts

| Statut V2 | Signification |
|---|---|
| `SOURCE_CONFIRMED` | Texte ou exigence confirme par une source primaire, mais non encore approuve pour le logiciel |
| `READY_FOR_PRO_REVIEW` | Regle modelisee, sources et tests suffisants pour une revue professionnelle |
| `HUMAN_DECISION_ONLY` | Pouvoir judiciaire ou jugement professionnel non automatisable |
| `EXTERNAL_VALUE_REQUIRED` | Valeur provenant obligatoirement d'un expert ou administrateur |
| `RESEARCH_INCOMPLETE` | Corpus insuffisant |
| `SOURCE_CONFLICT` | Sources ou rapports se contredisent |
| `BLOCKED_FOR_PRODUCTION` | Interdiction d'utilisation client |

Toutes les regles sont `BLOCKED_FOR_PRODUCTION` jusqu'a l'enregistrement d'une approbation professionnelle datee et signee.

## 3. Conclusions consolidees

### 3.1 Patrimoine familial

- `SOURCE_CONFIRMED` Le mariage emporte constitution du patrimoine familial sans egard au proprietaire, art. 414.
- `SOURCE_CONFIRMED` Les categories de l'art. 415 comprennent residences ou droits d'usage, meubles du menage, vehicules familiaux, droits de retraite et gains RRQ ou equivalents accumules durant le mariage, sous les exclusions du texte.
- `SOURCE_CONFIRMED` La valeur nette est partagee egalement apres les dettes contractees pour l'acquisition, l'amelioration, l'entretien ou la conservation, art. 416-417.
- `SOURCE_CONFIRMED` La date normale est celle du deces ou de l'introduction de l'instance; le tribunal peut retenir la cessation de vie commune sur demande, art. 417.
- `READY_FOR_PRO_REVIEW` Les deductions de l'art. 418 exigent des valeurs datees et une preuve de la source des fonds. Les proportions peuvent etre modelisees, mais les valeurs negatives, dettes mixtes et remplois successifs restent bloques.
- `HUMAN_DECISION_ONLY` Alienation ou diversion, partage inegal, attribution de biens, echeonnement et renonciation.

### 3.2 Patrimoine d'union parentale

- `SOURCE_CONFIRMED` Le regime commence a l'art. 521.20 et son patrimoine a l'art. 521.29. Toute reference generique a « 521.19+ » doit etre corrigee.
- `SOURCE_CONFIRMED` Le PUP comprend les residences de la famille ou droits d'usage, les meubles du menage et les vehicules familiaux, art. 521.30.
- `SOURCE_CONFIRMED` Les droits de retraite et gains RRQ ne sont pas inclus par la composition legale par defaut.
- `SOURCE_CONFIRMED` Les conjoints peuvent modifier la composition ou se retirer sous les formes et delais prevus, art. 521.31-521.33.
- `SOURCE_CONFIRMED` Les deductions de l'art. 521.36 ont une base plus large que celles de l'art. 418, incluant notamment certaines accumulations anterieures et les fruits et revenus des biens enumeres.
- `SOURCE_CONFLICT` L'affirmation selon laquelle les residences secondaires seraient toujours exclues est trop categorique. Le texte vise les residences de la famille. La qualification repose sur l'usage et doit etre validee.

### 3.3 Societe d'acquets

- `SOURCE_CONFIRMED` SA est un regime matrimonial distinct du PF.
- `READY_FOR_PRO_REVIEW` Le moteur doit classifier propres et acquets, traiter recompenses, rapports et partage de la valeur nette de la masse selon les art. 448 a 484.
- `BLOCKED_FOR_PRODUCTION` Les formules detaillees de recompenses n'ont pas encore un catalogue de regles, un corpus jurisprudentiel et des tests suffisants.
- `READY_FOR_PRO_REVIEW` L'orchestrateur doit liquider PF avant SA et transmettre seulement la valeur residuelle ou le resultat juridiquement applicable. La regle exacte d'articulation doit etre approuvee par un avocat et un notaire.

## 4. Matrice d'arbitrage des contradictions

| Sujet | Positions trouvees | Position canonique V2 |
|---|---|---|
| Nombre de moteurs | Deux moteurs PF/PUP ou trois regimes | Trois moteurs PF/SA/PUP, avec services transversaux |
| JuriFamille | Pensions seulement ou partage complet | `SOURCE_CONFLICT`; site public confirme pensions, formation tierce annonce partage 2.0; demonstration requise |
| AliForm/PatriForm | Outil central ou couverture incertaine | Calcul PF et jurisprudence annonces; PUP, API, audit et securite non confirmes |
| Marche non desservi | Aucun outil specialise ou marche occupe | Marche occupe sur le calcul; opportunite a demontrer sur dossier, preuve, audit et integration |
| Excel Cour superieure | Format impose | Existence rapportee; caractere obligatoire non confirme directement |
| Valeur negative | Plancher a zero ou aggregation negative | `RESEARCH_INCOMPLETE`; aucune automatisation avant jurisprudence et validation |
| Bien en societe | Toujours exclu ou droit d'usage possible | Ne pas conclure par le seul titre; analyser proprietaire, droit d'usage et jurisprudence |
| Bien en fiducie | Exclu ou conditionnel | `RESEARCH_INCOMPLETE`; analyse du droit effectivement detenu |
| Immeuble locatif | Exclu ou portion familiale | Usage familial potentiellement pertinent; ventilation et avis juridique requis |
| Date art. 417 | Exception non confirmee ou texte clair | Texte officiel confirme le pouvoir de retenir la cessation de vie commune |
| Statut PROD_READY | Plusieurs regles qualifiees ainsi | Statut supprime jusqu'a validation professionnelle |

## 5. Formules canoniques provisoires

### 5.1 Valeur nette

`VN = somme(valeurs marchandes admissibles) - somme(dettes qualifiees)`

Conditions : meme date juridique, aucune dette non ventilee, preuve de finalite, devise et methode d'evaluation conservees.

### 5.2 Bien possede au mariage - PF

`VN_mariage = VM_mariage - dette_qualifiee_mariage`

`PlusValue = VM_evaluation - VM_mariage`

`Deduction_plus_value = PlusValue x (VN_mariage / VM_mariage)`

`Deduction_totale = VN_mariage + Deduction_plus_value`

Statut : `READY_FOR_PRO_REVIEW`. Interdire si `VM_mariage <= 0`, valeurs ou dates manquantes, dette mixte non ventilee ou chaine de remploi incomplete.

### 5.3 Apport donation/succession - PF

`Deduction_plus_value_apport = PlusValue_depuis_apport x (Apport_admissible / VM_au_moment_apport)`

Statut : `READY_FOR_PRO_REVIEW`. La renonciation a une deduction et le remploi dans un bien d'un autre proprietaire necessitent un test jurisprudentiel.

### 5.4 Creance theorique

`Creance = (Valeur_partageable_A - Valeur_partageable_B) / 2`

Cette formule est une sortie theorique avant pouvoirs judiciaires, ententes, renonciations, retraite et incidences fiscales. Elle ne constitue jamais le resultat final du dossier.

## 6. Architecture du produit

```text
Dossier
  -> qualification du lien conjugal et des dates
  -> moteur PF, moteur SA ou moteur PUP
  -> service Preuve et tracabilite
  -> service Evaluations externes
  -> service Retraite/RRQ
  -> service Fiscalite
  -> controles de double comptage
  -> revue professionnelle
  -> export tribunal/cabinet et rapport explicable
```

Chaque `CalculationRun` est immuable et conserve les versions des regles, sources, valeurs, pieces, hypotheses, decisions humaines et approbations. Aucun ecrasement silencieux n'est permis.

## 7. Modele de donnees minimal

Entites : `Matter`, `Party`, `Relationship`, `LegalEvent`, `LegalRegime`, `Asset`, `AssetUse`, `OwnershipInterest`, `Debt`, `DebtAllocation`, `Contribution`, `TraceEvent`, `Valuation`, `RetirementStatement`, `TaxPosition`, `Rule`, `RuleVersion`, `Source`, `Citation`, `CalculationRun`, `CalculationStep`, `JudicialDiscretion`, `Override`, `ProfessionalReview`, `TestCase`, `Competitor`, `Uncertainty`.

Champs de controle indispensables : `effective_from`, `effective_to`, `as_of_date`, `evidence_id`, `source_id`, `rule_version`, `confidence`, `blocking`, `reviewer_role`, `approved_at` et `approval_scope`.

## 8. Analyse de marche canonique

### Faits confirmes

- AliForm annonce le calcul du partage du patrimoine familial et une banque de jurisprudence annotee.
- Le CAIJ offre un acces a AliForm aux membres admissibles.
- JuriFamille est une initiative liee a la Corporation de services du Barreau du Quebec et son site public confirme surtout les pensions et scenarios fiscaux connexes.
- Des formulaires de calcul PF et SA existent dans l'ecosysteme professionnel quebecois.
- Les solutions canadiennes hors Quebec sont souvent centrees sur les pensions ou les regimes de common law.

### A ne pas affirmer sans demonstration

- que JuriFamille calcule actuellement PF, SA et PUP en production;
- que le fichier Excel de la Cour superieure est juridiquement obligatoire;
- qu'aucun concurrent ne possede audit, export ou gestion documentaire;
- que les donnees sont hebergees dans une juridiction donnee;
- que le marche est vide.

### Positionnement retenu

SAFE ne doit pas se positionner sur « nous savons faire le calcul ». Le positionnement a tester est : **dossier patrimonial auditable, integre au cabinet, avec preuves, versionnement, controle du double comptage, validations par role et exports compatibles avec les pratiques judiciaires**.

## 9. Regles non automatisables

- qualification litigieuse d'une residence, d'un droit d'usage ou d'un vehicule mixte;
- application d'un partage inegal;
- alienation, diversion, mauvaise foi ou dilapidation;
- validite et effet d'une renonciation;
- biens en fiducie, en societe ou hors Quebec;
- dette mixte sans ventilation admise;
- valeur actuarielle sans releve officiel;
- impot latent et valeur apres impot;
- choix fiscal ou strategie de transfert;
- toute derogation a une date ou formule standard.

## 10. Backlog de validation

### Porte A - bloque toute construction du moteur

1. Avis avocat/notaire sur l'articulation PF -> SA et le double comptage.
2. Validation des formules PF de l'art. 418 sur au moins dix dossiers-types.
3. Regle des valeurs negatives, dettes mixtes et refinancements.
4. Corpus de jurisprudence verifie sur residence, remploi, societe, fiducie et partage inegal.

### Porte B - bloque les sorties fiscales

1. Memo federal et quebecois article par article.
2. Transferts d'immobilisations, REER/FERR/RVER, residence principale et deces.
3. Politique d'affichage de l'impot latent separee de la valeur juridique.

### Porte C - bloque le module SA

1. Catalogue complet art. 448-484.
2. Formules de recompenses et rapports.
3. Vingt scenarios de propres, acquets, dettes et recompenses.

### Porte D - bloque le positionnement final

1. Demonstrations d'AliForm et JuriFamille.
2. Verification du statut et du format des formulaires de la Cour superieure.
3. Entrevues avec trois a cinq cabinets quebecois.

## 11. Scenarios prioritaires

Les 30 scenarios V1 sont conserves. La V2 ajoute :

31. liquidation PF suivie de SA sans double comptage;
32. propre investi dans un bien PF sans deduction art. 418;
33. recompense SA apres liquidation PF;
34. union parentale suivie d'un mariage;
35. exclusion PUP par acte notarie puis fin de l'union;
36. residence en societe avec droit d'usage allegue;
37. fiducie discretionnaire et droit d'usage;
38. dette refinancee pour fins familiales et commerciales;
39. valeur negative d'un bien et masse positive globale;
40. divergence entre calcul interne et formulaire judiciaire.

Tous les resultats attendus demeurent `PRO_REVIEW_REQUIRED`.

## 12. Sources prioritaires retenues

- `SRC-001` Code civil du Quebec, texte officiel, art. 401-484 et 521.20-521.47, a jour au 1er avril 2026.
- `SRC-002` Gouvernement du Quebec, Union parentale et patrimoine d'union parentale.
- `SRC-003` Retraite Quebec, evaluation et partage des droits.
- `SRC-004` Loi de l'impot sur le revenu, art. 73 et dispositions pertinentes aux regimes enregistres.
- `SRC-005` ARC, transferts d'immobilisations et formulaire T2220.
- `SRC-006` Revenu Quebec, transfert de fonds REER/FERR/RPAC-RVER.
- `SRC-007` Juris Concept, AliForm/PatriForm.
- `SRC-008` CAIJ, acces a AliForm.
- `SRC-009` JuriFamille, site public.
- `SRC-010` Association des familialistes de Quebec, outils de calcul.
- `SRC-011` Droit de la famille - 163076, 2016 QCCA 2040, a reverifier dans le texte integral.

Les references commerciales, extraits de moteur de recherche et documents secondaires ne fondent aucune regle de calcul.

## 13. Definition de termine pour la knowledge base

La knowledge base ne sera prete pour une specification de production que lorsque :

- chaque regle calculable possedera une source primaire et un avis professionnel;
- les trois moteurs auront leurs propres catalogues et tests;
- les conflits seront resolus ou rendus bloquants;
- toutes les formules auront des cas positifs, negatifs et limites approuves;
- les valeurs externes seront impossibles a inventer;
- les versions juridiques seront datees;
- le format de sortie attendu par le cabinet et le tribunal sera confirme;
- les concurrents auront ete verifies par demonstration;
- une politique de securite, retention et secret professionnel aura ete approuvee.

## 14. Prochaine action

Organiser un atelier de 90 minutes avec un avocat familialiste et un notaire. Limiter l'atelier aux regles `PF-001` a `PF-006`, a l'articulation PF -> SA et aux scenarios 1 a 10, 31 et 32. Le livrable attendu est une grille signee : approuve, corrige, rejete ou preuve supplementaire requise.
