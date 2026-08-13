# Calculateur professionnel de patrimoine familial au Quebec

Date de recherche : 2026-08-11  
Version : 0.1 - dossier fondateur soumis a validation professionnelle  
Statut : REVIEW_REQUIRED  
Territoire : Quebec, Canada  
Public : cabinets d'avocats, notaires, fiscalistes, CPA et actuaires

## Avertissement professionnel

Ce document est un travail de recherche preparatoire. Il ne constitue pas un avis juridique, fiscal, comptable, notarial ou actuariel. Aucune regle ne doit etre activee dans un calcul utilise aupres d'un client avant validation formelle par les professionnels quebecois competents. Les exemples sont pedagogiques et ne remplacent ni la preuve, ni une evaluation, ni un releve officiel de droits de retraite.

## 1. Resume executif

- `VERIFIE` Le patrimoine familial des personnes mariees ou unies civilement est un partage de valeur portant sur des categories determinees de biens. La source primaire centrale est le Code civil du Quebec, art. 414 a 426.
- `VERIFIE` La masse comprend notamment les residences de la famille, les meubles a usage du menage, les vehicules utilises pour les deplacements de la famille, certains droits de retraite et les gains RRQ ou programmes equivalents accumules durant le mariage. Les biens recus par succession ou donation sont exclus selon l'art. 415, sous reserve du traitement d'un apport ou remploi dans un autre bien.
- `VERIFIE` La valeur nette repose sur la valeur marchande et sur les dettes qualifiees par leur finalite : acquisition, amelioration, entretien ou conservation. Une dette garantie par un bien n'est donc pas automatiquement deductible.
- `VERIFIE` L'art. 418 cree des deductions distinctes pour un bien possede au mariage, un apport provenant d'une succession ou donation et leur remploi. La plus-value deductible est proportionnelle, et non automatiquement egale a toute la hausse de valeur.
- `VERIFIE` Le patrimoine d'union parentale, en vigueur depuis le 30 juin 2025, est un regime different. Il vise principalement les residences, meubles et vehicules familiaux et n'inclut pas les droits de retraite ni les gains RRQ.
- `VERIFIE` Les conjoints en union parentale peuvent modifier la composition ou se retirer du regime selon des formalites precises. Cette flexibilite n'existe pas de la meme maniere pour le patrimoine familial.
- `VERIFIE` Les valeurs de certains regimes de retraite doivent provenir des releves et methodes prescrites. Le logiciel ne doit pas reconstruire une valeur actuarielle reglementaire a partir d'informations partielles.
- `VERIFIE` Des transferts directs de REER, FERR et certains autres regimes peuvent etre effectues lors d'une rupture sous conditions et sans inclusion immediate au revenu. Les conditions documentaires et le transfert direct doivent etre controles.
- `INFERENCE` Le meilleur positionnement produit n'est pas un simple calculateur. Il s'agit d'un dossier de calcul auditable : collecte des preuves, qualification assistee, regles citees, versions, hypotheses, scenarios, validations et rapport explicable.
- `A_CONFIRMER` Les consequences fiscales d'une dation en paiement, l'impot latent, les biens detenus par societe ou fiducie et les dossiers internationaux doivent rester bloques jusqu'a une analyse specialisee propre au dossier.

## 2. Perimetre et exclusions

Le produit cible deux moteurs separes :

1. `PF` - patrimoine familial des personnes mariees ou unies civilement;
2. `PUP` - patrimoine d'union parentale.

La societe d'acquets, la separation de biens, l'indivision, la prestation compensatoire, l'enrichissement injustifie, les pensions alimentaires, la liquidation successorale et la faillite sont des modules connexes. Ils ne doivent pas etre fusionnes au calcul du patrimoine.

Le moteur ne doit pas : predire une decision judiciaire, evaluer une entreprise, remplacer un actuaire, produire un avis juridique autonome, choisir une strategie fiscale ou accepter silencieusement une donnee manquante.

## 3. Methode et standard de preuve

Chaque fait est marque `VERIFIE`, `INFERENCE` ou `A_CONFIRMER`. Une regle calculable doit avoir une source primaire et, lorsque possible, une confirmation officielle ou professionnelle. Chaque regle possede une date d'effet, un statut et un indicateur de validation humaine. Les sources commerciales ne servent qu'a l'analyse de marche.

Limites : les bases doctrinales payantes, les manuels d'AliForm/PatriForm et certaines decisions non publiees n'ont pas ete accessibles. Les fonctionnalites non confirmees directement sont marquees comme telles.

## 4. Cadre juridique verifie

### 4.1 Patrimoine familial

`VERIFIE` L'art. 415 C.c.Q. enumere les categories incluses. La qualification exige a la fois la nature du bien, son usage et la periode pertinente. Le titre de propriete ne suffit pas a lui seul.

`VERIFIE` L'art. 416 prevoit le partage egal de la valeur apres deduction des dettes qualifiees, sous reserve notamment du partage inegal de l'art. 422 et d'une renonciation valide selon l'art. 423.

`VERIFIE` L'art. 417 retient normalement la date du deces ou de l'introduction de l'instance, avec possibilite judiciaire de retenir la cessation de vie commune. La date ne doit jamais etre choisie automatiquement par l'utilisateur sans base procedurale.

`VERIFIE` Les biens sont evalues a la valeur marchande. La valeur fiscale, municipale, comptable ou assuree ne doit pas etre substituee automatiquement a la valeur marchande.

`VERIFIE` L'art. 421 permet un paiement compensatoire pour certains biens alienes ou divertis. L'art. 422 permet au tribunal de deroger au partage egal en cas d'injustice, notamment pour breve duree, dilapidation ou mauvaise foi. Ces pouvoirs judiciaires doivent produire un drapeau, non une decision automatique.

`VERIFIE` L'art. 423 interdit la renonciation anticipee aux droits dans le patrimoine familial et encadre la renonciation apres ouverture du droit. Le moteur doit demander l'acte ou la declaration et la preuve d'inscription lorsque requise.

### 4.2 Patrimoine d'union parentale

`VERIFIE` Les art. 521.29 et suivants instaurent un patrimoine distinct. L'art. 521.30 vise les residences, meubles et vehicules familiaux. Les donations et successions sont exclues; les biens du conjoint mineur sont traites selon la regle particuliere du texte.

`VERIFIE` L'art. 521.31 permet de modifier la composition. L'exclusion d'un bien vise exige un acte notarie en minute. L'art. 521.33 permet un retrait commun; un retrait constate dans les 90 jours du debut de l'union produit un effet retroactif prevu par le texte.

`VERIFIE` Les art. 521.34 a 521.36 regissent la valeur nette et les deductions. Les sources d'apport admissibles sont plus larges que pour l'art. 418 et incluent notamment certains biens accumules avant la constitution, ainsi que les fruits et revenus des categories enumerees.

`VERIFIE` Les art. 521.39 a 521.42 encadrent notamment l'alienation, le partage inegal et la renonciation. La jurisprudence sur ce nouveau regime demeure necessairement moins developpee. Toute transposition de la jurisprudence du patrimoine familial est `A_CONFIRMER`.

## 5. Classification des biens

| Categorie | PF | PUP | Controle principal |
|---|---:|---:|---|
| Residence utilisee par la famille | conditionnellement incluse | conditionnellement incluse | usage, propriete, dates, donation/succession |
| Droit conferant l'usage | conditionnellement inclus | conditionnellement inclus | nature juridique du droit |
| Meubles du menage | conditionnellement inclus | conditionnellement inclus | usage familial, valeur marchande |
| Vehicule familial | conditionnellement inclus | conditionnellement inclus | usage reel pour deplacements familiaux |
| REER accumule pendant l'union | inclus selon PF | exclu par defaut | periode d'accumulation et relevés |
| Regime de pension | inclus selon PF | exclu par defaut | regime, loi, releve officiel |
| Gains RRQ/RPC | inclus selon PF | exclus | periode et mecanisme administrateur |
| Entreprise et actions | exclues comme telles | exclues comme telles | verifier residence/droit d'usage distinct |
| Compte bancaire/CELI/placement | exclus comme tels | exclus comme tels | possible interaction regime matrimonial |
| Donation ou succession | exclue comme bien | exclue comme bien | preuve et remploi/apport |
| Immeuble locatif | usage familial seulement possible | usage familial seulement possible | ventilation appuyee par evaluation |
| Bien en fiducie ou societe | REVIEW_REQUIRED | REVIEW_REQUIRED | droits d'usage, controle, jurisprudence |
| Bien etranger | conditionnel | conditionnel | droit applicable, preuve, conversion |

## 6. Dettes et deductions

### 6.1 Filtre de finalite des dettes

Une dette n'est admissible que si sa finalite prouvee correspond a l'acquisition, l'amelioration, l'entretien ou la conservation du bien inclus. Le moteur doit conserver : montant, date, creancier, bien rattache, objet, preuve, solde a la date d'evaluation et ventilation en cas d'usage mixte.

Un refinancement doit etre ventile selon l'utilisation des fonds. La seule presence d'une hypotheque sur la residence ne prouve pas que tout le solde est deductible.

### 6.2 Formules de base PF

Pour chaque conjoint `s` :

`VN_s = somme(VM des biens PF de s) - somme(dettes qualifiees de s)`

Pour un bien possede au mariage :

`D_initiale = valeur nette du bien au mariage`

`D_plus_value = plus-value pendant le mariage x (valeur nette au mariage / valeur brute au mariage)`

Pour un apport successoral ou donne :

`D_apport = montant de l'apport admissible`

`D_plus_value_apport = plus-value depuis l'apport x (apport / valeur brute au moment de l'apport)`

`Valeur_partageable_s = VN_s - deductions admissibles de s`

`Creance_theorique = (Valeur_partageable_A - Valeur_partageable_B) / 2`

La direction du paiement depend du signe. Cette presentation est une modelisation mathematique du partage egal et doit etre validee sur les cas de copropriete, de valeurs negatives, de plusieurs biens et de remploi.

### 6.3 Garde-fous

- division par zero interdite;
- aucune proportion sans valeur brute datee;
- aucune deduction sans chaine de preuve;
- pas de double deduction lors d'un remploi;
- pas de double comptabilisation d'un bien copropriete;
- valeur negative conservee et envoyee en revision;
- dette mixte non ventilee bloquante;
- don ou succession non trace `REVIEW_REQUIRED`;
- toute modification judiciaire du partage saisie comme decision humaine motivee.

## 7. Dates et evaluation

Le modele doit conserver au moins : date du mariage/union, constitution du PUP, acquisition, inclusion, apport, chaque remploi, cessation de vie commune, introduction de l'instance, deces, ouverture du droit au partage, evaluation et transfert.

Chaque valeur doit contenir : montant, devise, date, methode, auteur, document, statut d'expertise et taux de conversion. Les couts de disposition et l'impot latent ne doivent pas etre soustraits automatiquement de la valeur juridique sans autorite ou decision professionnelle documentee.

## 8. Fiscalite

`VERIFIE` Le par. 73(1) LIR contient le mecanisme federal central de transfert d'immobilisations entre conjoints, sous reserve des conditions et choix. L'art. 73(1.1) confirme certains transferts resultant des lois provinciales ou d'une ordonnance. Le moteur doit distinguer : transfert au cout, choix a la juste valeur marchande, bien amortissable, lien de dependance et attribution ulterieure.

`VERIFIE` L'ARC et Revenu Quebec indiquent qu'un transfert direct de REER/FERR et certains regimes peut etre non imposable lorsqu'il est effectue en vertu d'une ordonnance ou entente ecrite visant le partage des droits issus de l'union ou de sa rupture. Le formulaire T2220 peut documenter le transfert federal. Le retrait en especes n'est pas equivalent au transfert direct.

`A_CONFIRMER` L'impot latent n'est pas une dette juridique automatiquement deductible du patrimoine familial. Il faut documenter la probabilite et l'horizon de disposition, les intentions, l'autorite jurisprudentielle et l'avis fiscal. Le logiciel peut afficher une valeur economique apres impot dans une colonne separee, sans modifier automatiquement la valeur partageable.

`A_CONFIRMER` Chaque dation en paiement doit passer par une analyse fiscale propre au bien : cout fiscal, JVM, amortissement, exemption pour residence principale, taxes et droits applicables.

## 9. Regimes de retraite

Retraite Quebec distingue la valeur des droits accumules de la rente future. Pour les regimes reglementes, la valeur a utiliser doit provenir du releve de droits produit selon les methodes applicables. Le moteur doit stocker le releve, sa date, la periode d'union, l'administrateur et les instructions de partage.

Le RRQ/RPC doit etre traite comme un flux administratif distinct du solde patrimonial ordinaire. Une renonciation au patrimoine familial ne signifie pas automatiquement renonciation au partage des gains inscrits; les formalites particulieres doivent etre verifiees.

## 10. Procedure et pieces justificatives

| Piece | Usage | Statut propose |
|---|---|---|
| Acte de mariage/union et contrat | regime, dates, identite | obligatoire |
| Procedures et jugements | date et pouvoirs judiciaires | obligatoire si existant |
| Actes d'achat/vente | titre, prix, chronologie | obligatoire par immeuble |
| Releves hypothecaires | dettes et soldes dates | obligatoire |
| Preuves d'utilisation du refinancement | qualification de la dette | conditionnel bloquant |
| Evaluations marchandes | valeur a la date pertinente | obligatoire pour actif significatif |
| Preuves de donation/succession | exclusion/apport | conditionnel bloquant |
| Releves bancaires et chaine de remploi | tracabilite | conditionnel bloquant |
| Releves officiels de retraite | valeur reglementaire | obligatoire |
| Releves REER/FERR | accumulation et transfert | obligatoire si applicable |
| Declarations fiscales et avis | cout, residence, consequences | recommande/conditionnel |
| Documents corporatifs/fiduciaires | droit d'usage et controle | conditionnel bloquant |

## 11. Analyse du marche

### AliForm / PatriForm

`VERIFIE` Juris Concept et le CAIJ presentent AliForm comme un outil professionnel quebecois couvrant les pensions et le partage du patrimoine familial par PatriForm. Une banque de jurisprudence annotee est annoncee. L'acces est offert aux membres du CAIJ depuis 2025.

Forces confirmees : adaptation au modele quebecois, public professionnel, calcul du patrimoine, jurisprudence annotee, legitimite d'usage. Faiblesses ou inconnues : architecture d'audit, export machine-readable, API, gestion documentaire, PUP, versionnement fin et hebergement `NON CONFIRME` sans documentation produit.

### Association des familialistes de Quebec

`VERIFIE` L'Association publie des formulaires de calcul de l'etat du patrimoine familial et de la societe d'acquets. Force : accessibilite et ancrage pratique. Limites : collaboration, preuve, mise a jour automatisee, audit et integration `NON CONFIRME`.

### Jurifamille

`VERIFIE` Jurifamille vise surtout le calcul des pensions alimentaires et la fiscalite connexe. Il constitue une reference d'experience utilisateur et de mise a jour annuelle, mais n'est pas confirme comme moteur de patrimoine familial.

### Outils canadiens et internationaux

SimpleEquity met l'accent sur la divulgation financiere et les scenarios de partage. Des calculateurs ontariens illustrent la valeur d'une saisie simple, mais leurs regles ne sont pas transposables au Quebec. Les calculateurs grand public qui affirment appliquer une formule quebecoise sans registre des sources ni controle professionnel constituent un risque, non une source de droit.

### Positionnement recommande

Le produit doit se positionner comme « dossier de calcul auditable pour le droit patrimonial familial quebecois » :

- deux moteurs PF/PUP;
- collecte guidee des pieces;
- chaine de remploi visuelle;
- justification de chaque dette;
- versionnement juridique;
- registre de sources par calcul;
- scenarios comparatifs;
- validations par role;
- journal d'audit;
- rapport PDF explicable;
- export JSON;
- blocage explicite des donnees insuffisantes.

## 12. Architecture de knowledge base

Entites recommandees : `Matter`, `Party`, `Relationship`, `LegalRegime`, `Asset`, `AssetUse`, `Ownership`, `Debt`, `Contribution`, `TraceEvent`, `Valuation`, `RetirementStatement`, `TaxPosition`, `Rule`, `RuleVersion`, `Source`, `Citation`, `CalculationRun`, `CalculationStep`, `Override`, `Review`, `TestCase`, `Competitor` et `Uncertainty`.

Un calcul ne doit jamais ecraser un calcul anterieur. Chaque execution doit etre immuable, datee, liee aux versions de regles et accompagnee de l'identite du reviseur.

## 13. Registre minimal des regles

| ID | Regle | Autorite | Statut logiciel |
|---|---|---|---|
| PF-001 | Identifier les categories PF | C.c.Q. 415 | REVIEW_REQUIRED |
| PF-002 | Soustraire les dettes qualifiees | C.c.Q. 416-417 | REVIEW_REQUIRED |
| PF-003 | Choisir date legale d'evaluation | C.c.Q. 417 | REVIEW_REQUIRED |
| PF-004 | Deduction bien possede au mariage | C.c.Q. 418 | REVIEW_REQUIRED |
| PF-005 | Deduction apport donation/succession | C.c.Q. 418 | REVIEW_REQUIRED |
| PF-006 | Remploi | C.c.Q. 418 al. 3 | REVIEW_REQUIRED |
| PF-007 | Alienation/diversion | C.c.Q. 421 | HUMAN_ONLY |
| PF-008 | Partage inegal | C.c.Q. 422 | HUMAN_ONLY |
| PF-009 | Renonciation | C.c.Q. 423-424 | HUMAN_ONLY |
| PF-010 | Retraite selon lois particulieres | C.c.Q. 425-426 | EXTERNAL_VALUE |
| PUP-001 | Formation et composition | C.c.Q. 521.20, 521.29-30 | REVIEW_REQUIRED |
| PUP-002 | Modification/exclusion | C.c.Q. 521.31 | HUMAN_ONLY |
| PUP-003 | Retrait | C.c.Q. 521.33 | HUMAN_ONLY |
| PUP-004 | Valeur nette | C.c.Q. 521.34-35 | REVIEW_REQUIRED |
| PUP-005 | Deductions et plus-value | C.c.Q. 521.36 | REVIEW_REQUIRED |
| PUP-006 | Partage inegal | C.c.Q. 521.40 | HUMAN_ONLY |
| TAX-001 | Transfert immobilisation conjoint | LIR 73 | TAX_REVIEW |
| TAX-002 | Transfert direct regime enregistre | LIR 146(16), ARC/RQ | TAX_REVIEW |
| RET-001 | Valeur officielle du regime | C.c.Q. 426 et reglements | EXTERNAL_VALUE |

## 14. Scenarios de test requis

1. Residence acquise apres mariage, dette d'acquisition simple.
2. Residence possedee avant mariage, sans dette initiale.
3. Residence possedee avant mariage, dette initiale et plus-value.
4. Donation utilisee comme mise de fonds.
5. Succession utilisee pour une amelioration.
6. Remploi dans une seconde residence.
7. Remplois successifs avec chaine documentaire complete.
8. Remploi incomplet ou preuve manquante.
9. Refinancement entierement familial.
10. Refinancement mixte familial/personnel.
11. Dette garantie sans lien avec le bien.
12. Residence detenue en copropriete inegale.
13. Chalet utilise regulierement par la famille.
14. Immeuble locatif partiellement occupe.
15. Vehicule familial au nom d'une entreprise.
16. REER avant et pendant le mariage.
17. Pension a cotisations determinees avec releve.
18. Pension a prestations determinees sans releve.
19. RRQ avec renonciation distincte.
20. Valeur nette negative.
21. Alienation dans l'annee precedente.
22. Demande de partage inegal.
23. Deces avec prestation de survivant.
24. PUP automatique apres le 30 juin 2025.
25. PUP volontaire pour parents d'un enfant anterieur.
26. PUP avec retrait dans les 90 jours.
27. PUP avec bien exclu par acte notarie.
28. Bien en fiducie conferant un droit d'usage.
29. Bien etranger en devise etrangere.
30. Transfert direct REER conforme et retrait en especes non conforme.

Les fichiers `test-cases.json` associent a chaque scenario les regles, donnees attendues et controles bloquants. Les resultats chiffres ne seront certifies qu'apres revue des cas par les professionnels.

## 15. Questions professionnelles

### Avocat familialiste

- Interpretation operationnelle des dettes mixtes et des valeurs negatives.
- Jurisprudence actuelle sur l'impot latent et les couts de disposition.
- Cas fiducies, societes et droits conferant l'usage.
- Seuil de preuve du remploi et effets d'une preuve partielle.
- Transposition eventuelle de principes PF vers le PUP.

### Fiscaliste/CPA

- Traitement federal et quebecois de chaque mode de paiement.
- Elections, formulaires et attributs fiscaux a conserver.
- Methode prudente d'affichage de l'impot latent.
- Biens amortissables, actions et biens etrangers.

### Notaire

- Formalites des modifications, retraits et renonciations.
- Interactions avec contrats de mariage, conventions et RDPRM.

### Actuaire/administrateur de regime

- Valeurs que l'outil peut importer sans recalcul.
- Donnees minimales et limites des estimations.
- Regimes federaux, publics et etrangers.

## 16. Risques et controles

| Risque | Controle obligatoire |
|---|---|
| Mauvaise qualification d'un bien | questionnaire d'usage + preuve + revue |
| Dette surincluse | test de finalite et ventilation |
| Double deduction | graphe de tracabilite des apports/remplois |
| Mauvaise date | moteur d'evenements juridiques versionne |
| Valeur de retraite inventee | releve officiel obligatoire |
| Regime juridique confondu | separation stricte PF/PUP |
| Fiscalite perimee | versions datees et revue annuelle |
| Hallucination jurisprudentielle | reference neutre et texte integral |
| Resultat presente comme avis | avertissement et approbation humaine |
| Donnees client exposees | chiffrement, permissions, journal et retention |

## 17. Lacunes bloquantes

| Lacune | Risque | Action | Bloque production |
|---|---|---|---:|
| Validation des formules par avocat | resultat errone | atelier de validation | oui |
| Corpus jurisprudentiel exhaustif | exceptions manquees | recherche CAIJ/CanLII | oui |
| Fiscalite provinciale article par article | traitement incomplet | memo fiscal | oui |
| Manuels et demo concurrents | positionnement incomplet | entrevues/demos | non |
| Cas PUP sans jurisprudence | incertitude nouvelle | doctrine + veille | oui pour cas complexes |
| Regles de pension par regime | valeur incorrecte | matrice par administrateur | oui |
| Politique de securite et retention | secret professionnel | analyse securite | oui |

## 18. Matrice de tracabilite abregee

| Exigence | Regle | Source | Formule/decision | Test |
|---|---|---|---|---|
| Masse PF | PF-001 | SRC-001 art. 415 | classification | TC-001, 13, 15 |
| Dette admissible | PF-002 | SRC-001 art. 416-417 | VN | TC-009 a 11 |
| Deduction initiale | PF-004 | SRC-001 art. 418 | D_initiale/D_plus_value | TC-002-003 |
| Apport/remploi | PF-005-006 | SRC-001 art. 418 | D_apport | TC-004-008 |
| Retraite | PF-010/RET-001 | SRC-004 a 006 | valeur externe | TC-016-19 |
| PUP | PUP-001-006 | SRC-002/003 | branche PUP | TC-024-27 |
| Transfert REER | TAX-002 | SRC-008 a 010 | controle documentaire | TC-030 |

## 19. Sources

- `SRC-001` Code civil du Quebec, art. 414 a 426, Editeur officiel du Quebec, a jour au 1er avril 2026 : https://www.legisquebec.gouv.qc.ca/fr/pdf/lc/CCQ-1991.pdf
- `SRC-002` Code civil du Quebec, art. 521.20 et 521.29 a 521.42, Editeur officiel du Quebec : https://www.legisquebec.gouv.qc.ca/fr/pdf/lc/CCQ-1991.pdf
- `SRC-003` Gouvernement du Quebec, Patrimoine d'union parentale, mise a jour 19 decembre 2025 : https://www.quebec.ca/famille-et-soutien-aux-personnes/mariage-union/effets-union-parentale/patrimoine-union-parentale
- `SRC-004` Retraite Quebec, Evaluation des droits : https://www.retraitequebec.gouv.qc.ca/fr/professionnels-et-employeurs/professionnels-concernes-regimes-retraite/partage-droits-rcr-et-rver/evaluation-droits
- `SRC-005` Retraite Quebec, Partage des droits : https://www.retraitequebec.gouv.qc.ca/fr/professionnels-et-employeurs/professionnels-concernes-regimes-retraite/partage-droits-rcr-et-rver/partage-droits
- `SRC-006` Retraite Quebec, Partage des revenus de travail RRQ : https://www.retraitequebec.gouv.qc.ca/fr/citoyens/union-et-separation/regimes-retraite-et-partage/partage-revenus-travail-regime-rentes-quebec-personnes-mariees-ou-union-civile
- `SRC-007` Loi de l'impot sur le revenu, art. 73 : https://laws-lois.justice.gc.ca/fra/lois/I-3.3/section-73.html
- `SRC-008` ARC, Transferts d'immobilisations : https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/declaration-revenus/remplir-declaration-revenus/revenu-personnel/ligne-12700-gains-capital/transferts-immobilisations.html
- `SRC-009` ARC, formulaire T2220 : https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/formulaires/t2220.html
- `SRC-010` Revenu Quebec, transfert REER/FERR/RPAC-RVER : https://www.revenuquebec.ca/fr/citoyens/votre-situation/separation-ou-divorce/transfert-de-fonds-detenus-dans-un-reer-un-ferr-ou-un-rpacrver/
- `SRC-011` Cour supreme du Canada, Quebec (Procureur general) c. A, 2013 CSC 5 : https://scc-csc.lexum.com/scc-csc/scc-csc/fr/item/10536/index.do
- `SRC-012` CanLII, Code civil du Quebec, art. 415 a 423 : https://www.canlii.org/fr/qc/legis/lois/rlrq-c-ccq-1991/derniere/rlrq-c-ccq-1991.html
- `SRC-013` Droit de la famille - 163076, 2016 QCCA 2040, cite dans la revue de jurisprudence : https://www.canlii.org/w/canlii/2017CanLIIDocs4115.pdf
- `SRC-014` Juris Concept, AliForm/PatriForm : https://jurisconcept.ca/fr/aliform/
- `SRC-015` CAIJ, acces a AliForm : https://www.caij.qc.ca/nouvelles/acces-a-aliform-maintenant-offert-dans-lespace-caij/
- `SRC-016` Association des familialistes de Quebec, outils de calcul : https://afquebec.com/les-services-et-les-ressources/outils-de-calculs/
- `SRC-017` Jurifamille : https://jurifamille.com/
- `SRC-018` SimpleEquity : https://www.simpleequity.ca/

## 20. Conclusion et prochaine porte de controle

La base suffit pour specifier l'architecture de la knowledge base et organiser la validation, mais pas pour activer un calcul client. La prochaine etape est un atelier de validation professionnel portant d'abord sur les regles PF-001 a PF-006 et les dix premiers tests. Le code ne devrait commencer qu'apres signature de cette premiere tranche de regles.
