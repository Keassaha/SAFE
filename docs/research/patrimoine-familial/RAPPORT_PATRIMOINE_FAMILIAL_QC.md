# Knowledge base préparatoire — Calculateur de partage des patrimoines conjugaux (Québec)

**Patrimoine familial · Société d'acquêts · Patrimoine d'union parentale**

Version 1.0 · Recherche menée les 11 et 12 août 2026
Statut : **RECHERCHE PRÉPARATOIRE — validation professionnelle requise avant tout usage**
Auteur : Claude Code (assistant SAFE) · Commanditaire : SAFE Inc.
Document de méthode associé : `00_METHODE_2026-08-11.md` (v0.2)

---

## AVERTISSEMENT

Ce document est un **travail de recherche préparatoire interne**. Il ne constitue pas un avis
juridique, fiscal, comptable, notarial ou actuariel, et ne crée aucune relation professionnelle.

**Aucune règle de ce document ne doit être intégrée dans un logiciel utilisé auprès de clients
avant validation formelle par les professionnels québécois compétents.** Les statuts attribués
ici (`PROD_READY`, `REVIEW_REQUIRED`, etc.) signifient au mieux « dossier assez solide pour être
soumis à validation ». Ils ne signifient jamais « approuvé ».

Le droit évolue. La consolidation officielle utilisée est **à jour au 1er avril 2026**. Les
modifications survenues entre le 1er avril 2026 et aujourd'hui n'y figurent pas.

---

## 1. Résumé exécutif

### 1.1 Ce qui a été fait

Recherche primaire directe sur le Code civil du Québec, texte officiel, avec extraction verbatim
et horodatée de **118 articles** couvrant les trois régimes retenus, plus vérification ciblée
auprès de Retraite Québec, de l'Agence du revenu du Canada, du Barreau de Montréal et des
éditeurs de logiciels du marché.

Le corpus juridique extrait est livré en annexe machine-readable
(`data/ccq_corpus_integral.json`, 3 523 articles ; `data/corpus_ccq_trois_regimes.md`).

### 1.2 Les cinq conclusions qui changent la décision

**① Un seul moteur de calcul ne peut pas servir les trois régimes.**
Les écarts entre le patrimoine familial et le patrimoine d'union parentale ne sont pas des
variantes de paramétrage : ce sont des règles différentes sur la composition, la date
d'évaluation, la base de déduction et la faculté de retrait. Détail en section 4.4. Concevoir
un « calculateur de patrimoine » unique avec un drapeau de régime produirait des résultats faux.

**② Le patrimoine d'union parentale exclut totalement la retraite et le RRQ.**
Le patrimoine familial inclut les droits accumulés au titre d'un régime de retraite et les gains
inscrits au RRQ (art. 415 C.c.Q.). Le patrimoine d'union parentale est composé uniquement des
résidences, des meubles du ménage et des véhicules automobiles (art. 521.30 C.c.Q.). C'est
l'écart le plus lourd de conséquences financières, et le plus facile à manquer.

**③ Le marché est déjà occupé, y compris par le Barreau lui-même.**
JuriFamille est une initiative de la Corporation de services du Barreau du Québec. AliForm
(Juris Concept, division de PG Solutions depuis le 6 septembre 2024) annonce le calcul du partage
du patrimoine familial. Les deux sont accessibles gratuitement dans les bibliothèques du CAIJ.
Un catalogue de formation professionnelle annonce un atelier « JuriFamille 2.0 — Calculs du
partage : patrimoine familial, société d'acquêts et patrimoine d'union parentale », soit
exactement le périmètre visé. Détail et contradiction de sources en section 9.

**④ La Cour supérieure impose un format, et ce format est un fichier Excel.**
La division de Montréal publie « Calcul de l'état du patrimoine familial » et « Calcul de l'état
de la société d'acquêts » en format `.xls`. Conséquence produit : la sortie attendue par le
tribunal n'est pas un PDF maison, c'est ce fichier. Statut de vérification nuancé en section 9.3.

**⑤ Le dépôt SAFE contient des références juridiques inexactes.**
La référence « C.c.Q. art. 521.19+ » pour l'union parentale est fausse : l'union parentale
commence à l'article 521.20 et le patrimoine d'union parentale à l'article 521.29. Le catalogue
d'outils déclare par ailleurs un seed « barème » pour le patrimoine familial, notion qui n'existe
pas dans le régime. Détail en section 10.

### 1.3 Recommandation d'orientation

Les faits ci-dessus ne condamnent pas le projet, mais ils déplacent la question. La question
n'est plus « peut-on calculer un partage ? » — le droit est clair et calculable. Elle devient :
**« qu'apporte SAFE que JuriFamille et AliForm n'apportent pas ? »** Trois pistes tirées des
faits vérifiés sont proposées en section 10.2. Aucune n'est validée commercialement.

---

## 2. Périmètre et exclusions

### 2.1 Traité dans ce rapport

| Régime | Articles C.c.Q. | Statut de la source |
|---|---|---|
| Patrimoine familial | 414 à 426 | Verbatim officiel extrait |
| Patrimoine d'union parentale | 521.20 à 521.47 | Verbatim officiel extrait |
| Société d'acquêts | 448 à 484 | Verbatim officiel extrait |
| Résidence familiale (support) | 401 à 413 | Verbatim officiel extrait |
| Régimes matrimoniaux, dispositions générales | 431 à 447 | Verbatim officiel extrait |
| Prestation compensatoire (frontière) | 427 à 430, 521.43 à 521.47 | Verbatim officiel extrait |

### 2.2 Non traité dans cette version

Pensions alimentaires · évaluation actuarielle des régimes à prestations déterminées ·
autres provinces · fiscalité étrangère · rédaction d'actes · conseil au client final.

### 2.3 Recherché partiellement, à compléter

Fiscalité fédérale et québécoise (section 8) · jurisprudence (section 11) · doctrine ·
sécurité et hébergement des concurrents. Ces zones sont marquées et inscrites au tableau des
lacunes (section 13).

---

## 3. Méthodologie et accès aux sources

### 3.1 Principe appliqué

Collecte avant narration. Le corpus primaire a été extrait et horodaté **avant** toute rédaction
de règle. Aucune règle de ce rapport n'a été rédigée de mémoire.

### 3.2 Ce qui a réellement été consulté

| Source | Niveau | Accès | Date de consultation |
|---|---|---|---|
| LégisQuébec, Code civil du Québec, RLRQ c CCQ-1991 | 1 | Obtenu (accès direct) | 2026-08-11/12 |
| Retraite Québec, partage RRQ mariés/union civile | 2 | Obtenu | 2026-08-12 |
| Retraite Québec, partage RRQ conjoints de fait | 2 | Obtenu | 2026-08-12 |
| Barreau de Montréal, Boîte à outils de l'avocat familialiste (févr. 2023) | 3 | Obtenu (PDF) | 2026-08-12 |
| ARC, formulaire T2220 | 2 | Repéré, non lu intégralement | 2026-08-12 |
| jurifamille.com | 5 | Obtenu | 2026-08-12 |
| jurisconcept.ca / AliForm | 5 | Obtenu | 2026-08-12 |
| Cour supérieure du Québec, division de Montréal | 1 | **Bloqué (403)** | 2026-08-12 |
| CanLII | 1-2 | **Bloqué (403)** | 2026-08-12 |

### 3.3 Limites d'accès rencontrées, et leur effet réel

- **Le site de la Cour supérieure du Québec est inaccessible en lecture automatisée.** Toutes
  les tentatives retournent 403, y compris sur les fichiers de formulaires eux-mêmes. Les
  constats de la section 9.3 reposent donc sur des sources indirectes (Barreau de Montréal,
  index de moteur de recherche). **Le caractère obligatoire du format n'est pas confirmé par
  source primaire.**
- **CanLII est inaccessible.** Conséquence directe : **aucune jurisprudence n'a été vérifiée
  dans cette version.** La section 11 est vide, et c'est une lacune majeure, pas une omission.
- **Les bases payantes restent hors de portée** (La Référence, Lexis+, Westlaw, Taxnet Pro,
  JurisClasseur). Aucune doctrine n'a été consultée.
- **Aucun identifiant n'a été utilisé** pour accéder à quelque service que ce soit.

### 3.4 Fenêtre temporelle

La consolidation officielle du C.c.Q. consultée porte la mention **« À jour au 1er avril 2026 »**
et **« Ce document a valeur officielle »**. Les modifications postérieures au 1er avril 2026 ne
sont pas couvertes. Toute mise en production devra revérifier cette date.

---

## 4. Cadre juridique : les trois régimes

### 4.1 Patrimoine familial

**Constitution.** « Le mariage emporte constitution d'un patrimoine familial formé de certains
biens des époux sans égard à celui des deux qui détient un droit de propriété sur ces biens »
(art. 414). Le patrimoine familial n'est donc **pas** un régime matrimonial : il se superpose au
régime, quel qu'il soit.

**Composition (art. 415).** Sont inclus, quel que soit l'époux propriétaire :

1. les résidences de la famille ou les droits qui en confèrent l'usage ;
2. les meubles qui les garnissent ou les ornent et qui servent à l'usage du ménage ;
3. les véhicules automobiles utilisés pour les déplacements de la famille ;
4. les droits accumulés durant le mariage au titre d'un régime de retraite ;
5. les gains inscrits durant le mariage au nom de chaque époux en application de la Loi sur le
   régime de rentes du Québec (chapitre R-9) ou de programmes équivalents.

**Exclusions expresses (art. 415).**

- les biens échus à l'un des époux **par succession ou donation**, avant ou pendant le mariage ;
- **si la dissolution résulte du décès** : les gains RRQ et les droits accumulés au titre d'un
  régime de retraite régi ou établi par une loi qui accorde au conjoint survivant le droit à des
  prestations de décès.

**Définition légale de « régime de retraite » (art. 415 in fine).** La notion est large et
énumérée : régime régi par la Loi sur les régimes complémentaires de retraite (R-15.1) ou la Loi
sur les régimes volontaires d'épargne-retraite (R-17.0.1), régime régi par une loi semblable
d'une autre autorité législative, régime établi par une loi, **régime d'épargne-retraite**, et
tout autre instrument d'épargne-retraite, dont un contrat constitutif de rente, ayant reçu des
sommes transférées de l'un de ces régimes.

**Caractère impératif (art. 423).** « Les époux ne peuvent renoncer, par leur contrat de mariage
ou autrement, à leurs droits dans le patrimoine familial. » La renonciation n'est possible
qu'**à compter** du décès ou du jugement, par acte notarié en minute ou par déclaration
judiciaire, avec **inscription au registre des droits personnels et réels mobiliers**. À défaut
d'inscription dans **un an** à compter de l'ouverture du droit au partage, l'époux renonçant est
**réputé avoir accepté**.

### 4.2 Patrimoine d'union parentale

**Formation de l'union (art. 521.20).** L'union parentale se forme **dès que des conjoints de
fait deviennent les père et mère ou les parents d'un même enfant**, ou lorsque les parents d'un
même enfant deviennent conjoints de fait ou le redeviennent. Sont conjoints de fait « deux
personnes qui font vie commune et qui se présentent publiquement comme un couple, **sans égard à
la durée de leur vie commune** ». Sont présumées faire vie commune les personnes qui cohabitent
et qui sont les parents d'un même enfant.

Empêchements : ascendant, descendant, frère ou sœur. Si l'un des conjoints est déjà marié, en
union civile ou en union parentale, la nouvelle union parentale ne se forme qu'à compter de la
dissolution ou de la fin de la précédente.

**Caractère impératif (art. 521.21).** Les conjoints y sont soumis dès la formation de l'union,
« auxquelles ils ne peuvent déroger, sauf disposition contraire de la loi ».

**Fin de l'union (art. 521.22).** Décès, cessation de la vie commune, mariage ou union civile des
deux conjoints, ou mariage ou union civile de l'un d'eux avec un tiers.

**Composition du patrimoine (art. 521.30).** Uniquement :

1. les résidences de la famille ou les droits qui en confèrent l'usage ;
2. les meubles qui les garnissent ou les ornent et qui servent à l'usage du ménage ;
3. les véhicules automobiles utilisés pour les déplacements de la famille.

**Il n'y a ni régime de retraite ni gains RRQ dans le patrimoine d'union parentale.**

**Exclusions (art. 521.30).** Biens échus par succession ou donation avant ou pendant l'union ;
biens du conjoint mineur, qui n'entrent qu'à l'atteinte de sa majorité.

**Faculté de modification et de retrait — spécifique à l'union parentale.**

- **Art. 521.31** : les conjoints peuvent, en cours d'union, modifier la composition du
  patrimoine. Toute modification excluant un bien visé au premier alinéa de l'art. 521.30 doit
  être constatée **par acte notarié en minute, à peine de nullité absolue**.
- **Art. 521.33** : les conjoints peuvent, en cours d'union, **se retirer d'un commun accord**
  de l'application du chapitre, par acte notarié en minute, à peine de nullité absolue. **Si le
  retrait est constaté dans les 90 jours du début de l'union, le patrimoine est réputé n'avoir
  jamais été constitué.**

C'est une différence structurelle avec le patrimoine familial, où l'art. 423 interdit toute
renonciation anticipée.

**Garde-fou anti-évitement (art. 521.35 al. 2).** La valeur nette du patrimoine comprend
**également la valeur nette du bien exclu par les conjoints**, établie **au moment de
l'exclusion**. Autrement dit, exclure un bien ne le fait pas disparaître du calcul ; cela fige sa
valeur au jour de l'exclusion.

### 4.3 Société d'acquêts

Régime matrimonial **légal supplétif** : « Les époux qui, avant la célébration du mariage, n'ont
pas fixé leur régime matrimonial par contrat de mariage sont soumis au régime de la société
d'acquêts » (art. 432). Il prend effet **du jour de la célébration du mariage** ; on ne peut
stipuler une autre date (art. 433).

**Composition.** Les acquêts comprennent tous les biens non déclarés propres par la loi, et
notamment le produit du travail au cours du régime, ainsi que les fruits et revenus échus ou
perçus au cours du régime provenant de tous les biens, propres ou acquêts (art. 449). Sont
propres notamment les biens possédés au début du régime, ceux échus par succession ou donation,
et les biens acquis en remplacement d'un propre (art. 450).

**Règle de qualification mixte (art. 451).** Le bien acquis avec des propres et des acquêts est
propre **à charge de récompense** si la valeur des propres employés est supérieure à la moitié du
coût total d'acquisition ; sinon il est acquêt à charge de récompense. La même règle s'applique à
l'assurance sur la vie et aux pensions de retraite.

**Présomptions (art. 459 et 460).** Tout bien est **présumé acquêt** à moins qu'il ne soit établi
qu'il est un propre. Le bien dont un époux ne peut prouver le caractère est **présumé appartenir
aux deux indivisément, à chacun pour moitié**.

**Dissolution (art. 465).** Décès, changement conventionnel de régime, jugement de divorce, de
séparation de corps ou de séparation de biens, absence, nullité du mariage.

**Option d'acceptation ou de renonciation (art. 467).** Après dissolution, chaque époux conserve
ses propres et **a la faculté d'accepter le partage des acquêts de son conjoint ou d'y renoncer,
nonobstant toute convention contraire**. La déchéance de cette faculté est prévue à l'art. 471 :
l'époux qui a diverti ou recelé des acquêts, dilapidé ses acquêts ou les a administrés de
mauvaise foi est privé de sa part dans les acquêts de son conjoint.

**Partage (art. 481).** Le règlement des récompenses effectué, on établit la valeur nette de la
masse des acquêts, **et cette valeur est partagée par moitié**. Le paiement peut se faire en
numéraire ou par dation en paiement.

**Estimation contestée (art. 483).** À défaut d'entente sur l'estimation des biens, celle-ci est
faite par des **experts** désignés par les parties ou, à défaut, par le tribunal.

### 4.4 Tableau comparatif des trois régimes — le cœur du dossier

| Dimension | Patrimoine familial | Patrimoine d'union parentale | Société d'acquêts |
|---|---|---|---|
| Déclencheur | Mariage ou union civile (art. 414) | Naissance/adoption d'un enfant commun entre conjoints de fait (art. 521.20) | Mariage sans contrat (art. 432) |
| Nature | Se superpose au régime matrimonial | Régime autonome | Régime matrimonial |
| Résidences familiales | Incluses | Incluses | Selon qualification propre/acquêt |
| Meubles du ménage | Inclus | Inclus | Selon qualification |
| Véhicules automobiles familiaux | Inclus | Inclus | Selon qualification |
| **Régimes de retraite** | **Inclus** (art. 415) | **Exclus** | Art. 451 (règle mixte) |
| **Gains RRQ** | **Inclus** (art. 415) | **Exclus** | Hors régime |
| Succession / donation | Exclus | Exclus | Propres (art. 450) |
| Date d'évaluation | Décès ou introduction de l'instance ; le tribunal **peut** retenir la cessation de vie commune (art. 417) | **Ouverture du droit au partage** (art. 521.35) | À la dissolution ; experts si contesté (art. 483) |
| Base de déduction du bien détenu antérieurement | Valeur nette **au moment du mariage** (art. 418) | Valeur nette **au moment où il est inclus** (art. 521.36) | Mécanique des récompenses |
| Sources d'apport déductibles | Succession, donation, ou leur remploi (art. 418) | **4 catégories**, dont les **fruits et revenus** (art. 521.36) | Récompenses |
| Renonciation anticipée | **Interdite** (art. 423) | Retrait conventionnel possible en cours d'union (art. 521.33) | Faculté d'option après dissolution (art. 467) |
| Modification de la composition | Non prévue | Possible par acte notarié (art. 521.31) | Changement de régime (art. 433) |
| Dérogation au partage égal | Art. 422 | Art. 521.40 | Déchéance art. 471 |
| Délai de renonciation / inscription | 1 an, RDPRM (art. 423) | 1 an, RDPRM (art. 521.41) | Art. 474 (héritiers : 1 an) |
| Aliénation suspecte | 1 an, ou plus si intention (art. 421) | 1 an, ou plus si intention (art. 521.39) | Art. 471 |
| Étalement judiciaire du paiement | Max **10 ans** (art. 420) | Max **10 ans** (art. 521.38) | Non prévu au même titre |

**Lecture produit de ce tableau.** Neuf lignes sur seize diffèrent entre le patrimoine familial
et le patrimoine d'union parentale. Un moteur unique paramétré par un simple drapeau de régime
serait faux sur la composition, sur la date d'évaluation, sur la base de déduction et sur la
faculté de retrait. **Trois moteurs distincts partageant des primitives communes est la seule
architecture défendable.**

---

## 5. Classification des biens

Statuts utilisés : `INCLUS` · `EXCLU` · `CONDITIONNEL` · `INFO_INSUFFISANTE`.

| Catégorie de bien | Patrimoine familial | Union parentale | Fondement | Confiance |
|---|---|---|---|---|
| Résidence principale de la famille | `INCLUS` | `INCLUS` | 415 / 521.30 | Élevée |
| Droits conférant l'usage d'une résidence (bail, usufruit, actions de coopérative) | `INCLUS` | `INCLUS` | 415 / 521.30 | Élevée |
| Résidence secondaire | `CONDITIONNEL` | `CONDITIONNEL` | Le texte dit « les résidences **de la famille** », au pluriel. La qualification dépend de l'usage familial réel | Moyenne — **qualification jurisprudentielle non vérifiée** |
| Meubles garnissant/ornant et servant à l'usage du ménage | `INCLUS` | `INCLUS` | 415 / 521.30 | Élevée |
| Véhicule automobile utilisé pour les déplacements de la famille | `INCLUS` | `INCLUS` | 415 / 521.30 | Élevée |
| Véhicule utilisé exclusivement par une entreprise | `CONDITIONNEL` | `CONDITIONNEL` | Le critère légal est l'usage « pour les déplacements de la famille » | Moyenne — cas mixte non tranché ici |
| REER | `INCLUS` | `EXCLU` | 415 (« régime d'épargne-retraite ») / 521.30 | Élevée |
| Régime de retraite d'employeur (PD ou CD) régi par R-15.1 | `INCLUS` | `EXCLU` | 415 / 521.30 | Élevée |
| RVER (R-17.0.1) | `INCLUS` | `EXCLU` | 415 | Élevée |
| Régime établi par une loi (secteur public) | `INCLUS` | `EXCLU` | 415 | Élevée |
| CRI / FRV issus d'un transfert d'un régime visé | `INCLUS` | `EXCLU` | 415 in fine (« tout autre instrument d'épargne-retraite… ayant reçu des sommes transférées ») | Élevée |
| Gains inscrits au RRQ | `INCLUS` | `EXCLU` | 415 al. 2 / 521.30 | Élevée |
| Régime de retraite, **cas de décès**, si la loi accorde au survivant des prestations de décès | `EXCLU` | s.o. | 415 al. 3 | Élevée |
| Biens reçus par succession ou donation | `EXCLU` | `EXCLU` | 415 al. 4 / 521.30 al. 2 | Élevée |
| Biens du conjoint mineur | s.o. | `EXCLU` jusqu'à la majorité | 521.30 al. 3 | Élevée |
| CELI, comptes bancaires, placements non enregistrés | `EXCLU` du patrimoine familial | `EXCLU` | Non énumérés à 415 ni 521.30 ; relèvent le cas échéant du régime matrimonial | Élevée sur le principe |
| Entreprise, actions, immeubles locatifs | `EXCLU` des deux patrimoines | `EXCLU` | Non énumérés | Élevée sur le principe |
| Résidence détenue par une société ou une fiducie | `INFO_INSUFFISANTE` | `INFO_INSUFFISANTE` | Le texte vise le bien « dont l'un ou l'autre est **propriétaire** ». La détention indirecte n'est pas traitée par le texte | **Faible — question jurisprudentielle et fiscale non vérifiée** |
| Bien situé hors Québec ou hors Canada | `INFO_INSUFFISANTE` | `INFO_INSUFFISANTE` | Aucune règle de conflit de lois vérifiée dans cette recherche | **Faible** |

> **Avertissement de double comptage.** Un bien exclu du patrimoine familial (un CELI, une
> entreprise) n'est pas hors du partage : il peut être un acquêt sous l'art. 449. À l'inverse,
> un bien du patrimoine familial appartenant à un époux ne doit pas être compté une seconde fois
> dans la masse des acquêts. **L'ordre des opérations et la non-duplication sont traités en
> section 7.**

---

## 6. Dettes, déductions et formules

### 6.1 Patrimoine familial

**Étape 1 — Valeur nette du patrimoine (art. 417).**

> La valeur nette est établie selon la valeur des biens **et des dettes contractées pour
> l'acquisition, l'amélioration, l'entretien ou la conservation** de ces biens, à la date
> retenue. **Les biens sont évalués à leur valeur marchande.**

Seules les dettes rattachées aux biens du patrimoine sont déductibles. Une dette de consommation
non rattachée à un bien du patrimoine n'entre pas dans ce calcul.

**Étape 2 — Déductions (art. 418).** Deux déductions, chacune assortie d'une quote-part de
plus-value :

*(a) Bien possédé au moment du mariage et faisant partie du patrimoine familial*

```
r_a       = VN_mariage / VB_mariage          (ratio figé au moment du mariage)
plusvalue = VB_évaluation − VB_mariage
DÉD_a     = VN_mariage + ( r_a × plusvalue )
```

*(b) Apport fait pendant le mariage à même des biens échus par succession ou donation, ou leur
remploi*

```
r_b       = VAL_apport / VB_au_moment_de_l_apport
plusvalue = VB_évaluation − VB_au_moment_de_l_apport
DÉD_b     = VAL_apport + ( r_b × plusvalue )
```

Le remploi, pendant le mariage, d'un bien du patrimoine familial possédé lors du mariage donne
lieu aux mêmes déductions, « compte tenu des adaptations nécessaires » (art. 418 al. 3).

**Étape 3 — Valeur partageable.**

```
VALEUR_PARTAGEABLE = VALEUR_NETTE_PF − Σ DÉD_a − Σ DÉD_b
```

**Étape 4 — Créance de partage.**
Art. 416 énonce que la valeur « est divisée à parts égales ». La mécanique opérationnelle
usuelle consiste à calculer la valeur partageable **de chaque époux** puis à faire payer la
moitié de l'écart par celui dont la valeur est la plus élevée :

```
CRÉANCE = | VALEUR_PARTAGEABLE_époux1 − VALEUR_PARTAGEABLE_époux2 | / 2
```

> **Statut de cette formule : `DÉRIVÉE — VALIDATION REQUISE`.** L'égalisation par moitié de
> l'écart n'est pas énoncée telle quelle à l'art. 416 ; elle en découle et correspond à la
> structure des formulaires de la Cour supérieure. Elle doit être confirmée par l'avocat
> validateur avant tout usage en production.

**Exécution (art. 419).** En numéraire ou par dation en paiement ; les époux peuvent convenir de
transférer d'autres biens que ceux du patrimoine familial.

**Pouvoirs du tribunal (art. 420 et 422).** Attribution de biens, versements échelonnés sur
**au plus 10 ans**, sûretés. Dérogation au partage égal en cas d'injustice, compte tenu notamment
de la **brève durée du mariage**, de la **dilapidation** ou de la **mauvaise foi**.

**Aliénation dans l'année (art. 421).** Si un bien du patrimoine a été aliéné ou diverti dans
l'année précédant le décès ou l'introduction de l'instance et n'a pas été remplacé, le tribunal
peut ordonner un **paiement compensatoire**. Au-delà d'un an, il faut établir l'**intention** de
diminuer la part de l'autre.

### 6.2 Patrimoine d'union parentale

Même architecture, **bases différentes** (art. 521.35 et 521.36).

```
VALEUR_NETTE_UP = Σ valeur marchande des biens à la date d'ouverture du droit au partage
                − Σ dettes d'acquisition/amélioration/entretien/conservation
                + Σ valeur nette des biens exclus par convention, évaluée AU MOMENT DE L'EXCLUSION
```

Déduction du bien détenu à l'inclusion :

```
r       = VN_à_l_inclusion / VB_à_l_inclusion
DÉD     = VN_à_l_inclusion + ( r × plus-value acquise pendant qu'il fait partie du patrimoine )
```

Déduction d'apport, avec **quatre sources admissibles** (art. 521.36 al. 2) :

1. les biens accumulés avant la constitution du patrimoine et qui n'en font pas partie ;
2. les biens du conjoint mineur accumulés avant sa majorité et qui n'en font pas partie ;
3. les biens échus par succession ou donation avant ou pendant la durée de l'union ;
4. **les fruits et revenus provenant des biens visés aux paragraphes 1° à 3°**.

> **Écart critique à ne pas manquer.** En patrimoine familial, seuls la succession, la donation
> et leur remploi ouvrent la déduction d'apport. En union parentale, la liste est plus large et
> inclut les biens accumulés avant l'union **et leurs fruits et revenus**. Coder la même règle
> pour les deux régimes produit une erreur systématique en défaveur du conjoint apporteur en
> union parentale.

### 6.3 Société d'acquêts

Mécanique par **récompenses**, structurellement différente des deux patrimoines.

- Dettes contractées au profit des propres et non acquittées : **récompense comme si elles
  avaient déjà été payées avec les acquêts** (art. 478).
- Solde en faveur de la masse des acquêts : l'époux en fait rapport, en moins prenant, en valeur
  ou avec des propres (art. 480).
- Solde en faveur des propres : l'époux prélève parmi ses acquêts (art. 480).
- Puis : valeur nette de la masse des acquêts, **partagée par moitié** (art. 481).

> Le détail complet du calcul des récompenses (art. 475 à 480) n'a pas été modélisé dans cette
> version. Inscrit au tableau des lacunes.

---

## 7. Articulation entre régimes et prévention du double comptage

C'est la pièce ajoutée au périmètre par la décision du 11 août 2026, et la plus exposée au
risque d'erreur silencieuse.

### 7.1 Règles d'exclusion mutuelle établies par le texte

| Situation | Régimes potentiellement en cause | Règle |
|---|---|---|
| Couple marié sans contrat | Patrimoine familial **+** société d'acquêts | Les deux s'appliquent. Le patrimoine familial se règle **d'abord** (il se superpose au régime) |
| Couple marié en séparation de biens | Patrimoine familial seul | Le patrimoine familial reste impératif (art. 423) |
| Conjoints de fait avec enfant commun | Union parentale seule | Ni patrimoine familial ni société d'acquêts |
| Conjoints de fait sans enfant commun | Aucun des trois | Aucun patrimoine conjugal légal |
| Union parentale suivie d'un mariage | Union parentale **prend fin** (art. 521.22) puis patrimoine familial | Séquence temporelle, pas cumul |

### 7.2 Ordre des opérations proposé

```
1. Qualifier l'union            → mariage / union civile / union parentale / aucune
2. Si mariage ou union civile   → calculer le PATRIMOINE FAMILIAL (art. 414-426)
3. Retirer de la masse des acquêts tout bien déjà partagé au titre du patrimoine familial
4. Qualifier propres / acquêts sur le RESTE uniquement (art. 448-460)
5. Régler les récompenses, puis partager la masse nette des acquêts (art. 481)
6. Si union parentale           → calculer le PATRIMOINE D'UNION PARENTALE (art. 521.29-521.42)
                                  et NE PAS appliquer les étapes 2 à 5
7. Examiner séparément la prestation compensatoire (art. 427-430 / 521.43-521.47)
```

> **Statut de cet ordre : `DÉRIVÉ — VALIDATION REQUISE`.** L'étape 3 en particulier (soustraction
> des biens déjà partagés au patrimoine familial avant la qualification en acquêts) est la règle
> qui empêche le double comptage. Elle découle de la logique des deux régimes mais **n'est pas
> énoncée explicitement dans un article unique**. C'est la première question à poser à l'avocat
> validateur.

### 7.3 Alertes que le logiciel devra afficher

1. Un bien apparaît à la fois dans le patrimoine familial et dans la masse des acquêts.
2. Une résidence est déclarée détenue par une société ou une fiducie.
3. Un régime de retraite est saisi dans un dossier d'union parentale (hors périmètre légal).
4. Une renonciation au patrimoine familial est datée d'avant le jugement ou le décès (art. 423).
5. La date d'évaluation retenue diffère de la date légale par défaut.
6. Un bien a été aliéné dans les 12 mois précédant l'ouverture du droit au partage.
7. Le délai d'un an d'inscription de la renonciation au RDPRM approche ou est dépassé.

---

## 8. Fiscalité — état partiel

> **Cette section est incomplète et ne doit pas servir de base à un calcul.** La recherche
> fiscale n'a été qu'amorcée. Chaque point ci-dessous exige la lecture du texte de loi et une
> validation par un fiscaliste.

| Élément | Ce qui est repéré | Statut |
|---|---|---|
| Transfert de REER, FERR, RPAC ou RPD entre (ex-)conjoints lors de la rupture | Le formulaire **T2220** de l'ARC permet un transfert direct entre régimes enregistrés. Conditions repérées : transfert effectué en vertu d'un décret, d'une ordonnance, d'un jugement, ou d'un **accord écrit de séparation** relatif au partage des biens | `A_CONFIRMER` — formulaire non lu intégralement, dispositions de la LIR non vérifiées |
| Roulement de biens entre conjoints | Non vérifié dans cette recherche | `INCOMPLET` |
| Impôt latent et valeur après impôt | Non vérifié. C'est le point de désaccord d'expertise le plus fréquent en pratique | `INCOMPLET` — **ne pas coder de position par défaut** |
| Résidence principale et gain en capital | Non vérifié | `INCOMPLET` |
| Équivalents québécois (Loi sur les impôts, Revenu Québec) | Non vérifié | `INCOMPLET` |

**Distinction à préserver dans le modèle de données dès maintenant** : la **valeur juridique
partageable** (celle qu'établissent les art. 417, 418, 521.35, 521.36) et la **valeur économique
après impôt** ne sont pas la même grandeur. Le C.c.Q. parle de valeur marchande, pas de valeur
nette d'impôt. Tout champ monétaire du futur schéma doit porter un attribut explicite
`brut | net | après_impôt`, faute de quoi les deux notions se mélangeront irrémédiablement.

---

## 9. Régimes de retraite, RRQ et formulaires

### 9.1 Partage des gains RRQ — époux mariés ou unis civilement

Source : Retraite Québec, page officielle consultée le 2026-08-12.

- Les revenus de travail inscrits au RRQ (ou au RPC le cas échéant) pendant le mariage ou l'union
  civile **font partie du patrimoine familial**.
- Le partage consiste à **additionner** les revenus de travail inscrits au nom de chacun pour
  chaque année de la période d'union, puis à les **répartir également**.
- **Aucune somme d'argent n'est versée.** Ce sont les revenus inscrits qui sont modifiés, ce qui
  changera le montant des rentes futures.
- **Période de partage** : elle s'établit toujours en **années complètes**. Elle débute le
  **1er janvier de l'année du mariage ou de l'union civile** et se termine le **31 décembre de
  l'année précédant** soit la fin de la vie commune si le jugement le précise, soit le dépôt à la
  cour de la demande de divorce, de séparation légale, d'annulation ou de dissolution.
- Exécution par l'organisme (art. 425 C.c.Q.).

### 9.2 Partage des gains RRQ — conjoints de fait

- « Les conjoints de fait ne sont pas touchés par la notion de patrimoine familial. » Le partage
  **n'est pas automatique** : les conjoints doivent en faire la demande **conjointement**.
- Trois conditions cumulatives : avoir vécu maritalement **au moins 3 ans**, ou **au moins 1 an**
  si un enfant est né ou à naître de leur union ou s'ils ont adopté un enfant ; être **séparés
  depuis au moins 12 mois** ; **aucun** des conjoints n'était marié ou uni civilement avec une
  autre personne lors de la séparation.
- **Période de partage** : du 1er janvier de l'année du début de la vie commune au 31 décembre de
  l'année précédant la fin de la vie commune.

> **Point d'attention majeur, à confirmer.** La page de Retraite Québec sur les conjoints de fait
> énonce qu'ils « ne sont pas touchés par la notion de patrimoine familial ». Cet énoncé est
> cohérent avec l'art. 521.30, qui exclut le RRQ du patrimoine d'union parentale. Mais **il reste
> à vérifier si Retraite Québec a mis à jour ses pages et ses procédures depuis l'entrée en
> vigueur du régime d'union parentale**, et si les conditions de durée ci-dessus s'articulent
> avec la formation automatique de l'union parentale dès la naissance d'un enfant commun.
> `A_CONFIRMER` — question dirigée vers Retraite Québec.

### 9.3 Partage des droits de retraite (art. 426 C.c.Q.)

Deux garde-fous impératifs à coder :

1. le partage ne peut **jamais** priver le titulaire original de **plus de la moitié de la valeur
   totale des droits accumulés avant ou pendant le mariage** ;
2. le partage ne peut **conférer au bénéficiaire plus de droits que n'en possède le titulaire
   original** en vertu de son régime.

Le partage s'effectue conformément aux règles d'évaluation et de dévolution édictées par la loi
qui régit le régime ou, à défaut, conformément à celles déterminées par le tribunal. Entre les
époux, ces droits sont **cessibles et saisissables** pour le partage du patrimoine familial,
nonobstant toute disposition contraire.

> Conséquence produit : la valeur d'un régime à prestations déterminées relève des règles
> d'évaluation de la loi applicable au régime, souvent avec intervention actuarielle. **Le
> calculateur doit recueillir une valeur fournie, pas la produire.**

### 9.4 Formulaires de la Cour supérieure

| Constat | Statut |
|---|---|
| La Cour supérieure du Québec publie un formulaire « Calcul de l'état du patrimoine familial » et un formulaire « Calcul de l'état de la société d'acquêts » | `VÉRIFIÉ` par source de niveau 3 (Barreau de Montréal, Boîte à outils de l'avocat familialiste, mise à jour février 2023, qui les liste tous deux) |
| Ces formulaires sont diffusés en format **`.xls`** sur le domaine de la Cour supérieure | `A_CONFIRMER` — chemins de fichiers `.xls` repérés via index de moteur de recherche ; **le domaine bloque tout accès automatisé (403)**, la vérification directe a échoué |
| Leur usage est **obligatoire** et le format est fixé par directive de la juge en chef | `A_CONFIRMER` — énoncé rapporté par une source secondaire, **le texte de la directive n'a pas pu être lu** |
| L'Annexe I (pensions alimentaires pour enfants) doit être produite au moyen d'AliForm ou de JuriFamille | `A_CONFIRMER` — hors périmètre de calcul, mais structurant pour le marché |

**Action requise, non réalisable par moi** : quelqu'un du cabinet doit ouvrir
`coursuperieureduquebec.ca`, télécharger les deux fichiers et la directive de la division de
Montréal, et les déposer dans `docs/research/patrimoine-familial/data/`. Tant que ce n'est pas
fait, la définition du livrable produit reste incertaine.

---

## 10. Analyse du marché

### 10.1 Fiches concurrents

**JuriFamille**

| Champ | Valeur | Source |
|---|---|---|
| Éditeur | **Corporation de services du Barreau du Québec** | jurifamille.com, consulté 2026-08-12 |
| Description sur le site officiel | « logiciel de calcul des pensions alimentaires », générant l'Annexe I et le Formulaire III | jurifamille.com |
| Utilisateurs autorisés | Membres du Barreau du Québec, magistrature, médiateurs familiaux accrédités | jurifamille.com |
| Prix | Page de tarification existante, **montants non publics** | jurifamille.com |
| Patrimoine familial / acquêts / union parentale | **Non mentionné sur la page d'accueil** | jurifamille.com |
| Contradiction relevée | Un catalogue de formation professionnelle (AMFQ) annonce un atelier « **JuriFamille 2.0 — Calculs du partage : patrimoine familial, société d'acquêts et patrimoine d'union parentale** » | portail.mediationquebec.ca, repéré 2026-08-12 |
| Accès gratuit | Annoncé accessible sans frais dans les bibliothèques du CAIJ | caij.qc.ca, repéré 2026-08-12 |

**AliForm**

| Champ | Valeur | Source |
|---|---|---|
| Éditeur | **Juris Concept**, division de PG Solutions inc., **acquisition le 6 septembre 2024** | jurisconcept.ca, consulté 2026-08-12 |
| Fonctions annoncées | Formulaires de calcul des pensions alimentaires pour enfants et entre conjoints, **calcul du partage du patrimoine familial**, calculs en médiation, base de jurisprudence annotée | jurisconcept.ca |
| Utilisateurs | « avocats et parajuristes pratiquant le droit de la personne et de la famille, notaires, médiateurs ainsi que des juges » | jurisconcept.ca |
| Prix | **Non public** | jurisconcept.ca |
| Société d'acquêts / union parentale | **Non mentionnés** sur la page consultée | jurisconcept.ca |
| Accès gratuit | Annoncé accessible sans frais dans les bibliothèques du CAIJ | caij.qc.ca |

**Champs non vérifiés pour les deux outils** : fréquence de mise à jour, capacité d'audit,
export, collaboration, sécurité, hébergement des données, sources juridiques affichées. Ces
champs restent vides **volontairement** : ils ne peuvent pas être déduits d'une page marketing.

### 10.2 Ce que ces faits impliquent

**Fait vérifié** : le marché n'est pas vide, et l'un des occupants est une émanation du Barreau
du Québec, accessible gratuitement aux membres via le CAIJ.

**Inférence** : concurrencer frontalement un outil gratuit et institutionnel sur le seul calcul
est une position faible. Le calcul lui-même est une commodité ; le droit est public et la
formule est dans le Code.

**Hypothèses commerciales à tester** (aucune n'est validée) :

1. **L'intégration au dossier plutôt que le calcul isolé.** JuriFamille et AliForm sont des
   outils de calcul autonomes. SAFE détient déjà le dossier, le client, les documents et la
   facturation. La valeur serait dans le fait que le calcul se nourrisse du dossier et y
   retourne, sans ressaisie.
2. **La traçabilité et la preuve.** Un calcul dont chaque ligne renvoie à son article et dont
   l'historique est auditable a de la valeur en cas de contestation ou d'inspection. Aucun
   concurrent ne l'annonce, mais cela n'a pas été vérifié.
3. **La couverture de l'union parentale.** Le régime est entré en vigueur récemment. Si les
   outils établis ne l'ont pas encore intégré, il existe une fenêtre. **Mais l'atelier de
   formation repéré suggère le contraire pour JuriFamille.** À vérifier avant d'investir.

**Ce qui ne devrait pas être automatisé** : la qualification d'une résidence secondaire en
« résidence de la famille », la détermination de l'usage familial d'un véhicule, l'évaluation
d'un régime à prestations déterminées, la décision de déroger au partage égal, et l'appréciation
de l'impôt latent. Ce sont des jugements professionnels, pas des calculs.

---

## 11. Jurisprudence

**Section vide.** CanLII a bloqué tous les accès automatisés pendant cette recherche et aucune
base payante n'est accessible. **Aucune décision n'a été lue.**

Conséquence : toutes les qualifications marquées `CONDITIONNEL` en section 5 (résidence
secondaire, véhicule à usage mixte, détention par société ou fiducie, bien étranger) restent
non résolues. Ce sont précisément les questions que la jurisprudence tranche.

C'est la **lacune la plus lourde** de cette version. Elle bloque le passage de plusieurs règles
au statut `PROD_READY`.

---

## 12. Catalogue de règles (extrait)

Format complet en annexe `data/rules.yaml`. Extrait représentatif :

**PF-001 — Composition du patrimoine familial**
Domaine : classification · Juridiction : QC · Autorité : art. 415 C.c.Q. · En vigueur : 2014-07-01
Entrées : liste de biens avec type, propriétaire, date d'acquisition, mode d'acquisition
Sortie : partition `inclus` / `exclu`
Statut : `PROD_READY` (sous réserve de validation humaine)
Avertissement écran : « Les résidences secondaires et les véhicules à usage mixte exigent une
qualification professionnelle. »

**PF-004 — Déduction du bien possédé au moment du mariage**
Autorité : art. 418 al. 1 et 2 C.c.Q. · Entrées : `VN_mariage`, `VB_mariage`, `VB_évaluation`
Formule : `VN_mariage + (VN_mariage / VB_mariage) × (VB_évaluation − VB_mariage)`
Arrondissement : 2 décimales, arrondi au cent le plus proche
Statut : `PROD_READY` · Validation humaine : **requise**
Contre-exemple : ne s'applique pas à un bien acquis après le mariage — utiliser PF-005.

**PF-009 — Interdiction de renonciation anticipée**
Autorité : art. 423 C.c.Q. · Logique : si `date_renonciation < date_jugement_ou_décès`
→ **rejeter la saisie**, message bloquant
Statut : `PROD_READY` · Cette règle est d'ordre public ; elle ne doit pas être configurable.

**UP-002 — Exclusion des régimes de retraite et du RRQ en union parentale**
Autorité : art. 521.30 C.c.Q. · Logique : si `régime = union_parentale` et
`bien.type ∈ {retraite, RRQ}` → **exclure et alerter**
Statut : `PROD_READY` · Avertissement : « Le patrimoine d'union parentale ne comprend ni les
droits de retraite ni les gains inscrits au RRQ. »

**UP-005 — Bien exclu par convention, valeur figée**
Autorité : art. 521.35 al. 2 C.c.Q. · Logique : un bien exclu par acte notarié reste compté à sa
**valeur nette au moment de l'exclusion**
Statut : `PROD_READY` · C'est un garde-fou anti-évitement, pas une option.

**ART-001 — Non-duplication entre patrimoine familial et société d'acquêts**
Autorité : **dérivée** de la structure des art. 414 et 448 et s.
Logique : tout bien partagé au titre du patrimoine familial est retiré de la masse des acquêts
avant qualification
Statut : **`REVIEW_REQUIRED`** · C'est la règle la plus importante à faire valider.

**FISC-001 — Distinction valeur juridique / valeur après impôt**
Statut : **`INCOMPLETE`** · Interdiction d'usage en production.

---

## 13. Tableau des lacunes

| # | Lacune | Importance | Risque si ignorée | Professionnel | Bloque le développement ? |
|---|---|---|---|---|---|
| L1 | Aucune jurisprudence vérifiée (CanLII bloqué) | **Critique** | Les qualifications conditionnelles restent arbitraires | Avocat en droit familial | **Oui** pour les règles conditionnelles |
| L2 | Fiscalité non recherchée au-delà du repérage | **Critique** | Écart entre valeur partagée et valeur réelle reçue | Fiscaliste, CPA | **Oui** pour tout affichage de valeur après impôt |
| L3 | Règle de non-duplication entre régimes non confirmée par un texte unique | **Critique** | Double comptage silencieux | Avocat, notaire | **Oui** |
| L4 | Directive et formulaires de la Cour supérieure non obtenus | Élevée | Le livrable produit pourrait être le mauvais format | Avocat, greffe | **Oui** pour la définition du livrable |
| L5 | Articulation Retraite Québec / union parentale non confirmée | Élevée | Conseil erroné sur le partage RRQ | Retraite Québec | Non, mais à afficher comme incertitude |
| L6 | Calcul détaillé des récompenses en société d'acquêts non modélisé | Élevée | Moteur acquêts incomplet | Notaire | **Oui** pour le module acquêts |
| L7 | Détention par société ou fiducie non traitée | Moyenne | Faux négatifs sur des patrimoines importants | Avocat, fiscaliste | Non, si alerte affichée |
| L8 | Biens hors Québec, conflits de lois | Moyenne | Périmètre mal fermé | Avocat | Non, si exclu explicitement |
| L9 | Évaluation actuarielle des régimes PD | Moyenne | Valeur fausse sur un poste majeur | Actuaire | Non, si valeur saisie et non calculée |
| L10 | Vérification concurrentielle incomplète (sécurité, hébergement, prix) | Moyenne | Positionnement mal calibré | — | Non |
| L11 | Doctrine non consultée | Moyenne | Controverses non repérées | Avocat, CAIJ | Non |
| L12 | Modifications législatives postérieures au 1er avril 2026 | Moyenne | Droit périmé | Avocat | Non, si revérifié avant mise en production |

---

## 14. Questions à soumettre aux professionnels

**À l'avocat en droit de la famille**

1. Confirmez-vous l'ordre des opérations de la section 7.2, et en particulier le retrait des
   biens du patrimoine familial de la masse des acquêts avant qualification ?
2. Confirmez-vous la formule d'égalisation par moitié de l'écart (section 6.1, étape 4) ?
3. Quels critères jurisprudentiels qualifient une résidence secondaire de « résidence de la
   famille » ?
4. Comment la jurisprudence traite-t-elle un véhicule à usage mixte famille/entreprise ?
5. Une résidence détenue par une société ou une fiducie entre-t-elle au patrimoine familial ?
6. Quelle est la pratique réelle sur la date d'évaluation retenue en vertu de l'art. 417 al. 2 ?

**Au fiscaliste**

7. Quelles conséquences fiscales immédiates et différées faut-il distinguer dans un partage ?
8. Faut-il présenter l'impôt latent, et sous quelle forme, sans prendre position ?
9. Quelles conditions exactes encadrent le transfert par formulaire T2220 ?

**Au notaire**

10. Quelles mentions sont indispensables dans un acte de renonciation, et quel est le risque
    concret du défaut d'inscription au RDPRM dans l'année ?
11. Comment se pratique le retrait de l'art. 521.33 et le délai de 90 jours ?
12. Quelle est la mécanique complète des récompenses en société d'acquêts ?

**Au CPA**

13. Comment établir la valeur marchande d'une participation dans une entreprise fermée quand
    elle interfère avec la qualification propre/acquêt ?

**À l'actuaire**

14. Quelles données minimales sont nécessaires pour qu'une valeur de régime à prestations
    déterminées soit utilisable, et quand une expertise est-elle indispensable ?

---

## 15. Architecture de la knowledge base

### 15.1 Fichiers livrés

| Fichier | Contenu | État |
|---|---|---|
| `data/ccq_corpus_integral.json` | 3 523 articles du C.c.Q., verbatim, avec hiérarchie et historique législatif | Livré |
| `data/corpus_ccq_trois_regimes.md` | 118 articles des trois régimes, lisible | Livré |
| `data/sources.json` | Registre des sources | Livré |
| `data/rules.yaml` | Catalogue de règles | Livré, partiel |
| `data/uncertainties.json` | Registre des incertitudes | Livré |
| `data/competitors.json` | Fiches concurrents | Livré, partiel |
| `data/test-cases.json` | Scénarios de test | **Non livré dans cette version** |
| `data/formulas.json` | Formules formalisées | **Non livré dans cette version** |

### 15.2 Schéma de fiche de règle

```yaml
rule_id: PF-004
title: Déduction du bien possédé au moment du mariage
jurisdiction: QC
regime: patrimoine_familial          # | union_parentale | societe_acquets
domain: deduction
effective_from: 1994-01-01
effective_to: null
legal_authority: "C.c.Q., art. 418 al. 1 et 2"
source_ids: [SRC-001]
conditions:
  - bien.dans_patrimoine == true
  - bien.possede_au_mariage == true
inputs:
  - {name: VN_mariage,     type: money, unit: CAD, nature: net}
  - {name: VB_mariage,     type: money, unit: CAD, nature: brut}
  - {name: VB_evaluation,  type: money, unit: CAD, nature: brut}
calculation: "VN_mariage + (VN_mariage / VB_mariage) * (VB_evaluation - VB_mariage)"
rounding: {mode: half_up, decimals: 2}
outputs:
  - {name: deduction, type: money, unit: CAD, nature: net}
exceptions:
  - "Ne s'applique pas si VB_mariage == 0 (division par zéro) — exiger une saisie"
warnings:
  - "La plus-value se calcule sur la valeur BRUTE, pas sur la valeur nette."
confidence: haute
human_review_required: true
test_case_ids: []
last_verified_at: 2026-08-12
```

---

## 16. Audit qualité de ce rapport

| Contrôle | Résultat |
|---|---|
| Toute affirmation juridique a une source | Oui, ou marquée `A_CONFIRMER` / `INCOMPLET` |
| Les sources primaires ont été privilégiées | Oui — le C.c.Q. a été extrait en verbatim officiel |
| Les formules ont une justification article par article | Oui, sauf la formule d'égalisation, marquée `DÉRIVÉE` |
| Règles fédérales et québécoises distinguées | Partiellement — la section fiscale est incomplète |
| Faits et recommandations séparés | Oui (section 10.2 sépare fait / inférence / hypothèse) |
| Les liens mènent à la page exacte | Oui pour le C.c.Q. et Retraite Québec |
| Les citations correspondent au contenu lié | Oui — extraction automatisée verbatim, non reformulée |
| Les règles incertaines sont identifiées | Oui |
| Le risque de double comptage est couvert | Oui, section 7 — mais la règle reste à valider |
| Conséquences fiscales immédiates et différées séparées | **Non — section incomplète** |
| Changements législatifs récents recherchés | Partiellement — union parentale traitée, fenêtre postérieure au 1er avril 2026 non couverte |
| Le document dit qui doit être consulté | Oui, section 14 |
| **Nombre minimal de 25 scénarios de test** | **Non atteint — 0 scénario dans cette version** |
| **Jurisprudence** | **Non couverte** |

**Verdict honnête** : ce rapport établit solidement le **socle législatif des trois régimes** et
identifie les écarts structurels qui conditionnent toute l'architecture. Il **n'atteint pas** le
niveau de complétude exigé par le mandat sur la fiscalité, la jurisprudence et les scénarios de
test. Ces trois blocs restent à faire.

---

## 17. Contrôle des versions

| Version | Date | Changement |
|---|---|---|
| 1.0 | 2026-08-12 | Première version. Socle législatif des trois régimes extrait en verbatim officiel, comparatif, articulation, marché, lacunes. Fiscalité partielle, jurisprudence absente, scénarios de test absents |

---

## Annexe A — Registre des sources

| ID | Titre | Organisme | Niveau | Date du contenu | Consulté le | URL |
|---|---|---|---|---|---|---|
| SRC-001 | Code civil du Québec, RLRQ c CCQ-1991 | Éditeur officiel du Québec / Les Publications du Québec | 1 | À jour au 1er avril 2026, valeur officielle | 2026-08-11/12 | legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991 |
| SRC-002 | Le partage des revenus de travail du RRQ — personnes mariées ou en union civile | Retraite Québec | 2 | non datée sur la page | 2026-08-12 | retraitequebec.gouv.qc.ca/fr/union-separation/partage/Pages/mariage-rrq.aspx |
| SRC-003 | Le partage des revenus de travail du RRQ — personnes en union de fait | Retraite Québec | 2 | non datée sur la page | 2026-08-12 | retraitequebec.gouv.qc.ca/fr/union-separation/partage/Pages/union-fait-rrq.aspx |
| SRC-004 | Boîte à outils pour l'avocat familialiste | Barreau de Montréal | 3 | Mise à jour février 2023 | 2026-08-12 | barreaudemontreal.qc.ca/wp-content/uploads/cs-fam_boiteoutils.pdf |
| SRC-005 | JuriFamille — site officiel | Corporation de services du Barreau du Québec | 5 | non datée | 2026-08-12 | jurifamille.com |
| SRC-006 | AliForm — page produit | Juris Concept (PG Solutions) | 5 | acquisition annoncée 2024-09-06 | 2026-08-12 | jurisconcept.ca/fr/aliform/ |
| SRC-007 | Formulaire T2220 | Agence du revenu du Canada | 2 | non vérifiée | 2026-08-12 (repérage) | canada.ca/fr/agence-revenu/services/formulaires-publications/formulaires/t2220.html |

**Sources tentées et inaccessibles** : coursuperieureduquebec.ca (403 sur toutes les
ressources), canlii.org (403). Ces échecs sont documentés en section 3.3.
