# Gestion documentaire et préparation des dossiers — droit de la famille, Québec

**Date de recherche** : 2026-08-13
**Question de départ** : quelles règles, suffisamment établies et sourcées, permettent de construire dans SAFE un moteur de gestion documentaire configurable par domaine de pratique, dont le droit de la famille québécois est le premier module ?
**Public** : direction produit SAFE, et l'avocat québécois qui devra valider avant tout usage client.
**Méthode et registre des sources** : [00_SOURCES_ET_METHODE.md](00_SOURCES_ET_METHODE.md). **À lire d'abord.**

> **Avertissement.** Ce document est une synthèse de recherche préparatoire. Il ne constitue pas un avis juridique. Aucune règle n'est utilisable en production client avant une approbation professionnelle datée et signée. La majorité des dispositions québécoises citées ici sont **rapportées par le Barreau**, non lues dans le texte officiel : voir la section 1.3 de la note de méthode.

---

## 1. Résumé exécutif

Cinq constats commandent la conception.

**1. L'obligation documentaire la plus solide du dossier familial est financière, et elle est fédérale.** L'art. 21 des *Lignes directrices fédérales sur les pensions alimentaires pour enfants* énumère une liste fermée de documents que l'époux doit fournir, avec un horizon de trois ans. L'art. 25 y ajoute une obligation continue après jugement, mais **elle ne se déclenche pas seule** : elle naît d'une demande écrite de l'autre époux, au plus une fois par année, et le délai de réponse — 30 jours au Canada ou aux États-Unis, 60 jours ailleurs — court à compter de la **réception** de cette demande, présumée dix jours après son envoi. C'est la seule règle du corpus qui soit à la fois lue à la source, énumérative, datée et calculable. Elle doit être le noyau du module.

**2. Le dossier familial québécois est un dossier à formulaires imposés, pas seulement à pièces.** Formulaire I pour la demande en divorce, Formulaire II pour l'attestation relative aux naissances, Formulaire III pour l'état des revenus et dépenses et bilan, Annexe I pour la fixation de la pension alimentaire pour enfants, état du patrimoine familial et état de la société d'acquêts selon des formulaires établis par directive du juge en chef. Un moteur documentaire familial qui ne modéliserait que des « pièces » manquerait l'essentiel du travail réel.

**3. Le pilotage du dossier est un pilotage de délais courts et hétérogènes.** Réponse à 15 jours, protocole à 3 mois, ordonnance de sauvegarde notifiée à 3 jours, mesures provisoires signifiées à 10 jours, citation à comparaître à 10 jours, Formulaire III à jour signifié à 10 jours avant l'instruction, préavis de 5 jours avant instruction sur défaut, et un délai de rigueur de mise en état. Aucun de ces délais ne se calcule de la même manière ni ne part du même événement.

**4. Une part significative du corpus documentaire québécois est locale.** Les directives du district de Montréal, les avis de présentation, les consignes d'appel du rôle, les formulaires préparatoires propres à la division de Québec : tout cela varie. Ce qui varie ne doit pas être codé en dur.

**5. Le corpus professionnel disponible est en retard sur le droit fédéral.** Les aides-mémoire du Barreau parlent encore de garde et d'accès là où la loi fédérale parle de temps parental et de responsabilités décisionnelles depuis 2021. Un produit qui recopierait ces libellés livrerait un vocabulaire périmé à des avocats.

**Recommandation d'ensemble.** Construire un moteur en trois couches : un noyau générique de gestion documentaire, valable pour toute pratique; une couche de **règles déclaratives par domaine**, chargée depuis des fichiers de configuration versionnés et non depuis le code; une couche de **variations locales** par district et par cabinet. Le premier module livrable n'est pas « le droit de la famille » en entier, mais la **divulgation financière alimentaire**, seule matière dont les règles sont assez établies pour supporter une automatisation.

---

## 2. Carte du cycle de vie d'un dossier familial

`SOURCE_RAPPORTEE` — Structure tirée de la table des matières et du corps de l'aide-mémoire « La demande en divorce » du Barreau du Québec, qui organise le dossier en dix phases. Les articles cités sont ceux que l'aide-mémoire rattache à chaque phase.

| # | Phase | Ce qui s'y produit, documentairement | Dispositions rattachées |
|---|---|---|---|
| 0 | **Entrevue et mandat** | Ouverture, vérification de compétence, information au client sur la séance de parentalité | art. 3(1) *L.d.*, art. 45 C.p.c., art. 417 C.p.c. |
| 1 | **Questions préliminaires** | Liste des biens, devoirs de l'avocat, évaluation des modes privés de PRD, détermination des mesures accessoires | art. 413 C.p.c., art. 9(1) et 9(2) *L.d.*, art. 1 al. 3 C.p.c. |
| 2 | **Demande en divorce** | Rédaction au Formulaire I, avis d'assignation conforme, déclaration de l'avocat, dépôt et signification | art. 20 R.C.S.M.F., art. 146 C.p.c., art. 9(3) *L.d.*, art. 139 C.p.c. |
| 3 | **Déroulement de l'instance et protocole** | Réponse, établissement du protocole ou dépôt d'une proposition unilatérale | art. 145 et 147 C.p.c., art. 149 al. 2 C.p.c., art. 152 C.p.c. |
| 4 | **Défense et demande reconventionnelle** | Notification et production dans les délais du protocole | art. 139 C.p.c. |
| 5 | **Mesures provisoires et ordonnances de sauvegarde** | Formulaires alimentaires, communication des pièces, déclarations sous serment, citations à comparaître | art. 49 al. 2, 84, 101, 143, 246 al. 2, 247 al. 2, 269 al. 1, 411, 414 C.p.c. |
| 6 | **Obtention du jugement au mérite** | Par défaut, sur entente, ou mise en état pour cause contestée | art. 173, 174, 175, 180 C.p.c.; art. 19, 27, 29 R.C.S.M.F. |
| 7 | **Préparation de l'instruction** | Mise à jour des formulaires financiers, signification, preuve documentaire | art. 444 C.p.c., art. 26 R.C.S.M.F. |
| 8 | **Jugement et certificat de divorce** | Obtention et conservation du jugement, du certificat | `RESEARCH_INCOMPLETE` sur les délais |
| 9 | **Suivis après jugement** | Enregistrement des renonciations, obligation annuelle de divulgation | art. 467 C.c.Q.; art. 25 *L.d.f.p.a.e.* |
| 10 | **Modification des mesures accessoires** | Nouveau cycle, formulaires régénérés | art. 17 *L.d.* (non vérifié ici) |

**Lecture produit.** Ces dix phases ne sont pas linéaires : la phase 5 peut se répéter, la phase 10 rouvre un cycle complet. Le modèle de données doit traiter la phase comme un **attribut de l'instance**, pas comme un état global du dossier.

---

## 3. Typologie des dossiers

Trois axes indépendants, et non une liste plate. C'est la seule structure qui absorbe les dix types demandés sans duplication.

### Axe A — Fondement juridique de la demande

| Code | Fondement | Loi applicable | Conséquence documentaire majeure |
|---|---|---|---|
| `DIV` | Divorce | *Loi sur le divorce* (fédérale) | Formulaire I, déclaration de l'art. 7.6, attestation de naissances, certificat de divorce |
| `SEP` | Séparation de corps | C.c.Q. et C.p.c. | Pas de certificat de divorce; obligations fédérales inapplicables |
| `NUL` | Nullité de mariage ou d'union civile | C.c.Q. | Hors périmètre détaillé ici |
| `HORS` | Demande hors mariage (conjoints de fait, union parentale) | C.c.Q. | Ni patrimoine familial ni société d'acquêts par défaut |

`SOURCE_RAPPORTEE` — La boîte à outils du Barreau de Montréal rapporte que le Règlement de la Cour supérieure en matière familiale vise « toute demande en séparation de corps, en nullité de mariage, en divorce, en nullité ou en dissolution de l'union civile ».

### Axe B — Objets de la demande, cumulables

Ce sont eux qui déterminent les documents, pas le « type de dossier » au sens courant.

| Code | Objet | Déclenche |
|---|---|---|
| `PAR` | Temps parental et responsabilités décisionnelles | Séance d'information sur la parentalité; expertise psychosociale éventuelle |
| `PAE` | Pension alimentaire pour enfants | Annexe I, documents de l'art. 444 C.p.c., déclaration assermentée |
| `PAC` | Pension alimentaire entre ex-conjoints | Formulaire III |
| `PF` | Partage du patrimoine familial | État du patrimoine familial ou déclaration ou renonciation, art. 27 R.C.S.M.F. |
| `SA` | Liquidation du régime matrimonial | État de la société d'acquêts, art. 29 R.C.S.M.F. |
| `PC` | Prestation compensatoire | art. 427 C.c.Q. |
| `PROV` | Provision pour frais | Formulaire III + relevés d'honoraires et estimés |
| `SAUV` | Ordonnance de sauvegarde | Déclaration sous serment détaillée sur l'urgence |
| `MP` | Mesures provisoires | Délai de signification propre |
| `CONS` | Mesures conservatoires, saisie avant jugement | art. 517 à 519 C.p.c. |

### Axe C — Régime procédural

| Code | Régime | Effet documentaire |
|---|---|---|
| `CONJ` | Demande conjointe ou sur projet d'accord | Pas de signification adverse; ensemble documentaire réduit |
| `DEF` | Par défaut | Preuve par déclaration sous serment; préavis de 5 jours |
| `CONT` | Contesté | Protocole, mise en état, inventaire des pièces, liste de témoins |
| `URG` | Urgent ou provisoire | Délais abrégés, art. 84 C.p.c. |
| `MOD` | Modification d'ordonnance | Régénération des formulaires financiers |
| `HOM` | Homologation d'entente | `VARIABLE_LOCALE` : instructions propres au district |

**Les dix types demandés se lisent comme des combinaisons.** Exemples : « divorce contesté avec garde et pension » = `DIV` + `PAR` + `PAE` + `CONT`. « Demande urgente » = tout fondement + `SAUV` + `URG`. « Homologation d'entente » = `HOM`. **Conséquence produit : ne pas coder dix types de dossiers. Coder trois axes et une table de combinaisons.**

---

## 4. Taxonomie documentaire

Sept classes. Le critère de classement est **la fonction du document dans l'instance**, pas son format ni son émetteur.

| Classe | Définition | Critère de classement | Exemples vérifiés |
|---|---|---|---|
| `ACTE_PROCEDURE` | Écrit qui introduit, répond ou fait avancer l'instance, destiné au greffe | Porte un intitulé de procédure et est déposé au dossier de la cour | Demande en divorce (Formulaire I), défense, demande reconventionnelle, demande pour mesures provisoires, inscription pour instruction et jugement |
| `FORMULAIRE_IMPOSE` | Document dont la forme est prescrite par règlement ou par directive du juge en chef | Existe un modèle officiel opposable | Formulaire I, Formulaire II, Formulaire III, Annexe I, état du patrimoine familial, état de la société d'acquêts |
| `PIECE` | Élément de preuve documentaire communiqué à la partie adverse et coté | Reçoit une cote (P-1, D-1) et figure à l'inventaire | Extraits de naissance, certificat de mariage, contrat de mariage, actes de naissance des enfants |
| `PREUVE_FINANCIERE` | Document établissant le revenu ou le patrimoine | Sert au calcul alimentaire ou au partage | Déclarations de revenus, avis de cotisation, relevés de paye, états financiers |
| `DECLARATION_SERMENT` | Attestation assermentée d'une partie | Porte serment | Déclaration de l'art. 444 C.p.c., déclaration sous serment de l'art. 414 C.p.c., état du patrimoine familial appuyé de serment |
| `ACTE_PROCEDURAL_TIERS` | Document émanant d'un tiers dans l'instance | Émis par huissier, expert, greffe, tribunal | Procès-verbal de signification, rapport d'expert, transcription d'interrogatoire, jugement, certificat de divorce |
| `DOC_INTERNE` | Document de travail du cabinet | Non destiné au greffe ni à la partie adverse | Notes d'entrevue, listes de vérification, relevés d'honoraires, correspondance client |

**Distinction structurante à ne pas perdre.** Un même fichier peut être `PREUVE_FINANCIERE` **et** `PIECE` s'il est coté et communiqué. Le modèle doit donc permettre à un document de porter **une classe et zéro ou plusieurs rôles procéduraux**, pas une seule étiquette.

### Métadonnées minimales par classe

| Métadonnée | Classes concernées | Obligatoire | Motif |
|---|---|---|---|
| `type_document` | toutes | oui | Racine du classement |
| `classe` | toutes | oui | Voir tableau ci-dessus |
| `dossier_id`, `partie_id` | toutes | oui | Rattachement |
| `date_document` | toutes | oui | Distincte de la date de réception |
| `date_reception` | toutes | oui | Point de départ de plusieurs délais |
| `cote` | `PIECE` | conditionnel | Requise dès communication |
| `emetteur` | `ACTE_PROCEDURAL_TIERS` | oui | Huissier, expert, greffe |
| `annee_fiscale` | `PREUVE_FINANCIERE` | oui | L'art. 21 raisonne par année d'imposition |
| `date_signification`, `mode_signification` | `ACTE_PROCEDURE` | conditionnel | Preuve du point de départ des délais |
| `version`, `remplace_document_id` | `FORMULAIRE_IMPOSE` | oui | Les formulaires financiers se régénèrent |
| `serment_date`, `serment_devant` | `DECLARATION_SERMENT` | oui | Validité |
| `communique_le`, `communique_a` | `PIECE` | conditionnel | Inventaire de l'art. 174 C.p.c. |
| `confidentialite` | toutes | oui | Voir section 9.4, violence familiale |

---

## 5. Matrice type × étape × document × action × échéance × source

`SOURCE_PRIMAIRE_LUE` en gras. Le reste est `SOURCE_RAPPORTEE`.

### 5.1 Divulgation financière alimentaire — le socle

| Objet | Étape | Document | Échéance | Source | Certitude |
|---|---|---|---|---|---|
| `PAE` fédéral | Demande d'ordonnance alimentaire | **Déclarations de revenus des 3 dernières années** | Avec la demande | **DORS/97-175, art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | idem | **Avis de cotisation et de nouvelle cotisation, 3 ans** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Salarié | **Relevé de paye récent avec gains cumulatifs, ou lettre de l'employeur** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Travailleur autonome | **États financiers des 3 dernières années + relevé des paiements aux personnes liées** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Associé | **Attestation du revenu, prélèvements et investissements, 3 ans** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Contrôle d'une société | **États financiers de la société et de ses filiales, 3 ans + relevé des paiements aux personnes liées** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Bénéficiaire d'une fiducie | **Acte constitutif + 3 derniers états financiers** | Avec la demande | **art. 21** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Après jugement, **sur demande écrite** de l'autre époux ou du cessionnaire | **Documents fiscaux des 3 dernières années non encore fournis + renseignements à jour** | **30 jours (Canada, É.-U.) ou 60 jours, à compter de la réception de la demande. Réception présumée 10 jours après l'envoi. Au plus une fois par année** | **art. 25** | `SOURCE_PRIMAIRE_LUE`, relu une seconde fois |
| `PAE` fédéral | Défaut | Le tribunal peut tirer une conclusion défavorable et attribuer un revenu | — | **art. 23** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` fédéral | Défaut persistant | Rejet des actes de procédure, outrage, dépens | — | **art. 24** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` Québec | Toute demande alimentaire enfants | **Annexe I — Formulaire de fixation** | Avec la demande | **Annexe I (a. 3), version 2016-01**; art. 443-444 C.p.c. | `SOURCE_PRIMAIRE_LUE` pour le formulaire, `SOURCE_RAPPORTEE` pour les articles |
| `PAE` Québec | Partie 2 du formulaire | **Déclaration fiscale provinciale + avis de cotisation provincial de la dernière année; à défaut, avis ou déclaration fédérale** | Avec le formulaire | **Texte du formulaire, Partie 2** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` Québec | Ligne 200 | **Les trois derniers relevés de paye** | Avec le formulaire | **Formulaire, ligne 200** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` Québec | Ligne 202 | **États financiers** | Avec le formulaire | **Formulaire, ligne 202** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` Québec | Ligne 207 | **État des revenus et dépenses relatif à l'immeuble** | Avec le formulaire | **Formulaire, ligne 207** | `SOURCE_PRIMAIRE_LUE` |
| `PAE` Québec | Assemblage | **« Ne pas agrafer les documents fournis au présent formulaire »** | À la production | **Encadré du formulaire** | `SOURCE_PRIMAIRE_LUE` |
| `PAC` | Demande alimentaire pour l'époux | Formulaire III — état des revenus et dépenses et bilan | Avec la demande | art. 22 R.C.S.M.F. | `SOURCE_RAPPORTEE` |
| `PAC` | Préparation de l'instruction | Formulaire III **à jour**, signifié | **Au moins 10 jours avant l'instruction** | art. 26 R.C.S.M.F. | `SOURCE_RAPPORTEE` |
| `PROV` | Provision pour frais | Formulaire III + copie des relevés d'honoraires et estimés | Avec la demande | art. 588 C.c.Q., art. 416 C.p.c. | `SOURCE_RAPPORTEE` |

### 5.2 Pièces d'état civil et de régime

| Objet | Document | Cote usuelle | Source | Certitude |
|---|---|---|---|---|
| `DIV` | Extraits de naissance des époux | P-1 / P-2 | art. 20 R.C.S.M.F. renvoyant à art. 18 R.C.S.M.F. | `SOURCE_RAPPORTEE` |
| `DIV` | **Original** du certificat de mariage | P-3 | idem | `SOURCE_RAPPORTEE` |
| `DIV` | Contrat de mariage | P-4 | idem | `SOURCE_RAPPORTEE` |
| `PAR` | Actes de naissance des enfants, **si la filiation est mise en cause** | — | art. 17 R.C.S.M.F. | `SOURCE_RAPPORTEE`, conditionnel |
| `DIV` | Attestation relative aux naissances, Formulaire II | — | art. 19 R.C.S.M.F. | `SOURCE_RAPPORTEE` |

**Note.** L'exigence d'un **original** pour le certificat de mariage est une contrainte forte pour un système de gestion documentaire : elle implique un suivi de l'objet physique, distinct du fichier numérisé. `READY_FOR_PRO_REVIEW`.

### 5.3 Délais procéduraux

| Événement déclencheur | Délai | Objet | Source | Certitude |
|---|---|---|---|---|
| Assignation | **15 jours** | Production de la réponse | art. 145 et 147 C.p.c. | `SOURCE_RAPPORTEE` |
| Signification de l'avis d'assignation au défendeur | **3 mois** | Convenir du protocole d'instance | art. 149 al. 2 C.p.c. | `SOURCE_RAPPORTEE` |
| Présentation de la demande de sauvegarde | **3 jours** de préavis de notification | Ordonnance de sauvegarde | art. 101 C.p.c.; réduction possible art. 84 C.p.c. | `SOURCE_RAPPORTEE` |
| Présentation de la demande | **10 jours** de signification | Mesures provisoires | art. 411 C.p.c. | `SOURCE_RAPPORTEE` |
| Instruction | **10 jours** | Signification des citations à comparaître | art. 269 al. 1 C.p.c. | `SOURCE_RAPPORTEE` |
| Instruction | **10 jours** | Signification du Formulaire III à jour | art. 26 R.C.S.M.F. | `SOURCE_RAPPORTEE` |
| Demande du défendeur | **10 jours** | Fournir copie des pièces non remises | art. 246 al. 2 C.p.c. | `SOURCE_RAPPORTEE` |
| Défaut | **5 jours** de préavis | Avant instruction de l'affaire | art. 180 C.p.c. | `SOURCE_RAPPORTEE` |
| Introduction de l'instance | **délai de rigueur** de mise en état | Demande conjointe pour instruction et jugement | art. 173 C.p.c. | `SOURCE_CONFLICT` — voir ci-dessous |
| Jugement | **1 an** | Enregistrement de la renonciation au partage des acquêts | art. 467 C.c.Q. | `SOURCE_RAPPORTEE` |

`SOURCE_CONFLICT` sur l'art. 173 C.p.c. — L'aide-mémoire du Barreau du Québec mentionne un « délai de rigueur de douze mois pour la mise en état du dossier ». Le délai de droit commun en matière civile est usuellement présenté comme plus court. **Le texte de l'art. 173 n'a pas été lu à la source.** Le chiffre exact, et le fait qu'il diffère ou non en matière familiale, sont `RESEARCH_INCOMPLETE`. **Ne pas coder ce délai avant lecture du texte officiel.**

### 5.4 Contenu imposé de documents

`SOURCE_RAPPORTEE` — **art. 174 C.p.c.**, contenu de la demande conjointe pour instruction et jugement, six éléments :

1. le nom des parties et, si elles sont représentées, celui de leur avocat respectif ainsi que leurs coordonnées;
2. l'inventaire des pièces et des autres éléments de preuve communiqués aux autres parties;
3. la liste des témoins que les parties entendent convoquer et la liste de ceux dont elles entendent présenter le témoignage par déclaration, à moins que des motifs valables ne justifient de taire leur identité;
4. la liste des faits admis;
5. la liste des points à trancher par expertise;
6. l'estimation de la durée de l'instruction et le recours, le cas échéant, aux services d'un interprète ou à des moyens technologiques.

**C'est la disposition la plus directement exploitable par un logiciel** : chacun des six éléments est un champ ou une liste que SAFE détient déjà ou peut détenir.

`SOURCE_RAPPORTEE` — **art. 148 C.p.c.**, contenu du protocole de l'instance, neuf points : moyens préliminaires et mesures de sauvegarde; opportunité d'une CRA; interrogatoires préalables, nécessité, nombre et durée; opportunité d'expertises et, à défaut d'expertise commune, les motifs; la défense, son caractère oral ou écrit et le délai; modalités et délais de constitution et de communication de la preuve avant l'instruction; incidents prévisibles; prolongation éventuelle du délai de mise en état; modes de notification retenus.

**Ces neuf points sont un gabarit de formulaire, pas un texte libre.**

### 5.5 Formulaires à joindre à la demande conjointe pour instruction et jugement

| Document | Condition | Source | Certitude |
|---|---|---|---|
| Attestation relative aux naissances (Formulaire II) | **Toute** demande en divorce | art. 19 R.C.S.M.F. | `SOURCE_RAPPORTEE`, obligatoire |
| Sur le patrimoine familial, **l'une** des quatre options : déclaration de non-assujettissement, renonciation au partage, déclaration que le partage n'est pas contesté, ou état du patrimoine familial appuyé de serment | Selon la situation | art. 27 R.C.S.M.F. | `SOURCE_RAPPORTEE`, conditionnel à quatre branches |
| État de la société d'acquêts appuyé du serment | **Si tel est le régime matrimonial** | art. 29 R.C.S.M.F. | `SOURCE_RAPPORTEE`, conditionnel |

**Point de conception important.** L'art. 27 R.C.S.M.F. est une **alternative à quatre branches**, pas une obligation unique. Un contrôle de complétude qui exigerait systématiquement l'état du patrimoine familial produirait de faux positifs sur la majorité des dossiers. Le formulaire de l'état est en outre « établi par directive du juge en chef, tel que publié sur le site Internet de la Cour supérieure » : sa forme peut changer sans modification réglementaire. `VARIABLE_LOCALE`.

---

## 6. Règles de gestion des procédures, pièces, versions et cahiers

### 6.1 Pièces

`SOURCE_RAPPORTEE` — Communication et production :

- Les documents que l'on entend invoquer à l'audition d'une demande pour mesures provisoires doivent être réunis et indiqués, ou leur copie remise en même temps que la notification de la demande (art. 247 al. 2 C.p.c.).
- À défaut d'avoir remis copie, sur demande du défendeur, dix jours pour la fournir, faute de quoi le tribunal peut rendre les ordonnances appropriées (art. 246 al. 2 C.p.c.).
- La preuve documentaire est versée au dossier de la cour selon le véhicule procédural jugé le plus approprié, de même que les rapports d'experts (art. 239 C.p.c.) et les transcriptions d'interrogatoires (art. 227 al. 2 C.p.c.).
- Au plus tard avant l'inscription pour instruction et jugement, on peut demander l'exclusion de toute pièce qui ne peut être reçue en preuve, notamment si les formalités de validité n'ont pas été accomplies ou si le client dénie ou ne reconnaît pas son origine ou conteste l'intégrité de l'information.
- La contestation de l'origine ou de l'intégrité d'un document se fait par déclaration sous serment précisant les faits et les motifs (art. 262 C.p.c.).

**Conséquence produit.** Une pièce a au moins cinq états : *reçue*, *cotée*, *communiquée*, *versée au dossier de la cour*, *contestée ou exclue*. Un système qui ne modéliserait que « versée » ne saurait pas produire l'inventaire de l'art. 174.

### 6.2 Versions

`SOURCE_PRIMAIRE_LUE` et `SOURCE_RAPPORTEE` combinés — Les formulaires financiers **se régénèrent** :

- Avant l'instruction, préparer et notifier une **nouvelle** Annexe I reflétant la situation actuelle, y joindre les documents prescrits et la déclaration de l'art. 444 C.p.c.
- Préparer l'état des revenus, dépenses et actifs **à jour** selon le Formulaire III (art. 26 R.C.S.M.F.).
- Après jugement, obligation annuelle de fournir à nouveau les documents de l'art. 21 (**art. 25 DORS/97-175**).

**Conséquence produit.** Le versionnement n'est pas une commodité, c'est une exigence métier. Chaque formulaire financier doit porter une version, une date d'effet, un lien vers celui qu'il remplace, et l'étape à laquelle il a été produit. Un moteur qui écraserait la version précédente détruirait la trace de ce qui a été communiqué à la partie adverse à une date donnée.

### 6.3 Assemblage

- `SOURCE_PRIMAIRE_LUE` — **Ne pas agrafer les documents fournis au formulaire de fixation** (encadré de l'Annexe I).
- `RESEARCH_INCOMPLETE` — **Pagination, numérotation continue, structure des cahiers de pièces, plans d'argumentation, cahiers de sources.** Ces règles relèvent des directives de la Cour supérieure, qui n'ont pas pu être lues. On sait qu'il existe des directives propres aux affaires familiales pour le district de Montréal et des directives générales pour la division, et qu'une version datée du 2026-02-23 est en vigueur. **Rien de plus ne peut être affirmé.** Aucune règle de pagination ou de cahier ne doit être codée sur la base de cette recherche.

### 6.4 Procédures

`SOURCE_RAPPORTEE` :

- Toute demande introductive d'instance doit être signifiée par huissier, de même que les demandes reconventionnelles (art. 139 C.p.c.).
- L'avis d'assignation doit être conforme au modèle établi par le ministre de la Justice (art. 146 C.p.c.).
- Les demandes pour mesures provisoires et ordonnances de sauvegarde devraient être jointes à la demande en divorce et notifiées en même temps; elles peuvent être incluses à la demande principale ou faire l'objet d'une procédure séparée (art. 143 C.p.c.).
- En règle générale, une seule déclaration sous serment; une seconde est permise si le défendeur a lui aussi choisi ce moyen (art. 414 C.p.c.). La répétition de l'énoncé des actes de procédure peut constituer un abus (art. 104 C.p.c.).

---

## 7. Contrôles qualité avant dépôt, communication, signification ou audience

Les contrôles ci-dessous sont ceux que les sources permettent d'affirmer. Chacun porte son degré de certitude.

| # | Contrôle | Déclencheur | Source | Certitude | Automatisable ? |
|---|---|---|---|---|---|
| C-01 | L'acte introductif contient la déclaration attestant la connaissance des obligations des art. 7.1 à 7.5 | Dépôt d'une demande sous la *Loi sur le divorce* | **art. 7.6 *L.d.*** | `SOURCE_PRIMAIRE_LUE` | Détection de présence, oui. Suffisance du libellé, non |
| C-02 | Les 3 années de déclarations de revenus et d'avis de cotisation sont au dossier | Demande d'ordonnance alimentaire | **art. 21 DORS/97-175** | `SOURCE_PRIMAIRE_LUE` | Oui, comptage par année fiscale |
| C-03 | Les documents propres à la situation d'emploi sont au dossier | idem, selon le statut déclaré | **art. 21** | `SOURCE_PRIMAIRE_LUE` | Oui, si le statut est saisi. Le statut lui-même est une qualification humaine |
| C-04 | L'Annexe I est jointe et les documents de chaque ligne renseignée sont fournis | Demande `PAE` | **Formulaire, Parties 1 à 5** | `SOURCE_PRIMAIRE_LUE` | Oui pour la présence, non pour l'exactitude des montants |
| C-05 | La déclaration assermentée de l'art. 444 C.p.c. accompagne le formulaire | Demande `PAE` | art. 444 C.p.c. | `SOURCE_RAPPORTEE` | Oui pour la présence |
| C-06 | L'attestation relative aux naissances (Formulaire II) est jointe | Toute demande en divorce, à l'inscription | art. 19 R.C.S.M.F. | `SOURCE_RAPPORTEE` | Oui |
| C-07 | **L'une** des quatre options de l'art. 27 R.C.S.M.F. est présente | Inscription, dossier `PF` | art. 27 R.C.S.M.F. | `SOURCE_RAPPORTEE` | Oui, comme règle « au moins une parmi quatre » |
| C-08 | L'état de la société d'acquêts est joint si le régime est la société d'acquêts | Inscription | art. 29 R.C.S.M.F. | `SOURCE_RAPPORTEE` | Oui si le régime est saisi. La qualification du régime est humaine |
| C-09 | L'attestation de participation à la séance sur la parentalité est au dossier, ou une dispense l'est | Audition d'un différend visé | art. 417 C.p.c. | `SOURCE_RAPPORTEE` | Présence, oui. Applicabilité, non |
| C-10 | L'inventaire des pièces communiquées est complet et concorde avec les pièces cotées | Inscription | art. 174 par. 2 C.p.c. | `SOURCE_RAPPORTEE` | Oui, réconciliation de listes |
| C-11 | Les six éléments de l'art. 174 sont renseignés | Inscription | art. 174 C.p.c. | `SOURCE_RAPPORTEE` | Oui, complétude de champs |
| C-12 | Le Formulaire III à jour a été signifié au moins 10 jours avant l'instruction | Fixation de l'instruction | art. 26 R.C.S.M.F. | `SOURCE_RAPPORTEE` | Oui, si la date de signification est saisie |
| C-13 | Les citations à comparaître ont été signifiées au moins 10 jours avant | Fixation de l'instruction | art. 269 al. 1 C.p.c. | `SOURCE_RAPPORTEE` | Oui |
| C-14 | Le certificat de mariage au dossier est un **original** | Constitution du dossier `DIV` | art. 18 et 20 R.C.S.M.F. | `SOURCE_RAPPORTEE` | Non. Un système ne peut pas constater l'originalité d'un papier |
| C-15 | Aucune pièce ne demeure sans cote ni date de communication | Avant inscription | art. 174 par. 2 C.p.c. | `SOURCE_RAPPORTEE` | Oui |

---

## 8. Règles communes à toutes les pratiques

Ce qui, dans ce corpus, ne dépend pas du droit de la famille et doit vivre dans le **noyau** du moteur.

| # | Règle de noyau | Justification tirée du corpus |
|---|---|---|
| N-01 | Un document porte une classe et zéro ou plusieurs rôles procéduraux | Un relevé de paye est preuve financière et peut devenir pièce cotée |
| N-02 | Toute pièce a un cycle : reçue → cotée → communiquée → versée → contestée ou exclue | art. 246, 247, 262 C.p.c. |
| N-03 | Tout document opposable est versionné, avec lien vers la version remplacée | Régénération des formulaires financiers |
| N-04 | Toute échéance est calculée à partir d'un **événement daté et prouvé**, jamais d'une date saisie librement | Les délais partent de la signification, de la notification, de la présentation ou de l'instruction |
| N-05 | Toute échéance calculée est une **proposition** soumise à confirmation humaine | Exigence explicite du mandat de recherche, et conséquence du point 5.3 |
| N-06 | L'inventaire des pièces est un artefact généré, jamais saisi à la main | art. 174 par. 2 C.p.c. |
| N-07 | Un ensemble documentaire destiné au tribunal est une **composition datée et figée**, distincte des documents qu'elle contient | Un cahier communiqué le 3 mars ne change pas si une pièce est modifiée le 10 |
| N-08 | La détection d'un document manquant produit une **alerte**, jamais un blocage automatique | Le manquement peut être délibéré et stratégique |
| N-09 | Le classement assisté propose, l'humain confirme, et la proposition non confirmée reste visible | Anti-invention |
| N-10 | Toute règle applicable est chargée depuis une configuration versionnée, avec sa source et sa date de vérification | Permet la revue par un avocat et l'audit |

---

## 9. Règles propres au droit de la famille

### 9.1 La séance d'information sur la parentalité

`SOURCE_RAPPORTEE` — art. 417 C.p.c. Dans les matières où existe un différend touchant l'intérêt des parties et de leurs enfants, l'affaire ne peut être entendue à moins que les parties n'aient participé, ensemble ou séparément, à une séance d'information sur la parentalité et la médiation. Dispense pour la personne qui dépose une attestation confirmant avoir déjà participé à une telle séance pour un différend antérieur, ou qui confirme s'être présentée à un service d'aide aux victimes reconnu en invoquant être victime de violence conjugale (art. 417 al. 2).

**Conséquence produit.** C'est un **prérequis d'audience**, donc un contrôle de type C-09. La seconde branche de dispense touche la violence conjugale : elle impose un traitement de confidentialité particulier, voir 9.4.

### 9.2 Le double régime alimentaire

Le corpus établit deux régimes de fixation des pensions pour enfants qui coexistent : le régime québécois (Annexe I, art. 443-444 C.p.c.) et les *Lignes directrices fédérales* (DORS/97-175). L'aide-mémoire du Barreau les cite en alternative — « *Règlement sur la fixation des pensions alimentaires pour enfants* ou *Lignes directrices fédérales* ».

`RESEARCH_INCOMPLETE` — **Les critères exacts déterminant lequel des deux régimes s'applique n'ont pas été établis par cette recherche.** C'est une lacune importante, parce qu'elle commande la liste des documents obligatoires. **Zone de validation obligatoire par un avocat.** Aucune sélection automatique de régime ne doit être codée.

### 9.3 La régénération avant instruction

`SOURCE_RAPPORTEE` — Le dossier familial exige la **remise à jour** des pièces financières à l'approche de l'instruction : nouvelle Annexe I reflétant la situation actuelle avec ses documents et sa déclaration (art. 444 C.p.c.), Formulaire III à jour signifié au moins 10 jours avant (art. 26 R.C.S.M.F.).

**Conséquence produit.** Une règle de péremption propre au familial : un formulaire financier produit à l'étape des mesures provisoires **ne vaut pas** pour l'instruction. Le moteur doit marquer ces documents comme périmés à l'ouverture de la phase 7, et non les traiter comme acquis.

### 9.4 Violence familiale

`SOURCE_PRIMAIRE_LUE` — art. 2(1) *Loi sur le divorce* : la violence familiale s'entend de toute conduite, criminelle ou non, d'un membre de la famille envers un autre, qui est violente ou menaçante, dénote un comportement coercitif et dominant, ou amène à craindre pour sa sécurité. Elle comprend notamment les mauvais traitements physiques, les mauvais traitements sexuels, les menaces de mort ou de blessures, le harcèlement et la traque, le fait de priver des nécessités, les mauvais traitements psychologiques, l'exploitation financière, les menaces ou dommages envers un animal ou un bien, et l'exposition directe ou indirecte de l'enfant à une telle conduite.

**Conséquences produit, administratives seulement.** La recherche s'en tient au traitement du dossier, comme demandé.

1. La dispense de séance d'information peut reposer sur une démarche auprès d'un service d'aide aux victimes (art. 417 al. 2 C.p.c.) : **le motif de la dispense est en lui-même une information sensible.**
2. Il existe un formulaire d'**avis aux superviseurs des droits d'accès, de temps parental ou de contacts** prévu par l'art. 37 du Règlement de la Cour supérieure en matière familiale, daté de mars 2021 par la boîte à outils. Son contenu n'a pas été lu.
3. `HUMAN_DECISION_ONLY` — **Aucune détection automatique de violence familiale ne doit être construite.** Ni par analyse de texte, ni par mot-clé, ni par classification. La qualification relève du jugement professionnel et du tribunal, et une fausse détection dans un dossier familial cause un préjudice réel.
4. `READY_FOR_PRO_REVIEW` — Ce qui peut être construit : un **indicateur posé manuellement par l'avocat** qui restreint la visibilité de certains documents, retire des coordonnées des ensembles générés, et impose une confirmation avant toute communication sortante.

### 9.5 Les devoirs déclaratifs fédéraux

`SOURCE_PRIMAIRE_LUE` — *Loi sur le divorce* :

| Article | Obligation | Nature |
|---|---|---|
| 7.1 | Exercer le temps parental et les responsabilités décisionnelles d'une manière compatible avec l'intérêt de l'enfant | Stricte |
| 7.2 | Faire de son mieux pour protéger les enfants à charge des conflits découlant de l'instance | Stricte |
| 7.3 | Tenter de régler les questions par les mécanismes de résolution des différends familiaux, dans la mesure où il convient de le faire | Conditionnelle |
| 7.4 | Fournir des renseignements complets, exacts et à jour lorsqu'on est tenu de le faire | Stricte |
| 7.5 | Se conformer à toute ordonnance jusqu'à sa cessation d'effet | Stricte |
| 7.6 | **L'acte introductif doit comporter une déclaration attestant la connaissance des obligations 7.1 à 7.5** | Stricte |
| 7.7 | Le conseiller juridique attire l'attention et encourage la résolution, sauf contre-indication manifeste | Conditionnelle |
| 7.8 | Le tribunal vérifie les ordonnances connexes, sauf contre-indication manifeste | Conditionnelle |

**L'art. 7.6 est la seule de ces obligations qui produise un contrôle documentaire net.** Les art. 7.7 et 7.8 concernent la conduite professionnelle et judiciaire, pas le dossier.

---

## 10. Variations à rendre configurables plutôt qu'à coder en dur

| # | Variation | Preuve qu'elle varie | Portée de configuration |
|---|---|---|---|
| V-01 | Formulaires prescrits par division ou district | L'aide-mémoire renvoie à « le formulaire prescrit pour votre division », Montréal ou Québec | District |
| V-02 | Formulaire d'obtention de date d'audition | « Vérifiez si le district dans lequel votre dossier est présentable nécessite un formulaire » | District |
| V-03 | Déclaration commune pour fixation d'audience selon la durée d'instruction | Mentionnée pour la division de Montréal, seuil de deux heures | District |
| V-04 | Formulaire préparatoire propre au district de Québec | Mentionné explicitement | District |
| V-05 | Avis de présentation propre à la division | « joignez à votre demande l'un des avis de présentation prescrits » | District |
| V-06 | Instructions pour demande d'homologation | Document distinct du district de Montréal, daté d'août 2022 | District |
| V-07 | Forme de l'état du patrimoine familial et de l'état de la société d'acquêts | « établi par directive du Juge en chef, tel que publié sur le site Internet de la Cour supérieure » | Provincial, mais hors règlement, donc mouvant |
| V-08 | Directives locales en vigueur | Version du 2026-02-23 pour le district de Montréal | District, avec date de version |
| V-09 | Pagination, cahiers, plans d'argumentation | Non établies | District, à remplir après lecture des directives |
| V-10 | Cotation des pièces | Usage P-1 à P-4 rapporté, pas de règle lue | Cabinet, avec valeur par défaut |
| V-11 | Nomenclature des fichiers | Aucune source normative trouvée | Cabinet |
| V-12 | Régime alimentaire applicable | Non établi, voir 9.2 | Dossier, saisi par l'avocat |

**Règle de conception.** Une variation `VARIABLE_LOCALE` doit porter, dans la configuration, le district, la source, la date de version et la date de dernière vérification. Sans quoi personne ne saura, dans six mois, si la règle est encore vraie.

---

## 11. Zones nécessitant la validation d'un avocat québécois

Listées par ordre de gravité produit.

| # | Zone | Pourquoi elle bloque |
|---|---|---|
| Z-01 | **Choix entre le régime québécois et les Lignes directrices fédérales** | Commande la liste des documents obligatoires. Non établi par cette recherche |
| Z-02 | **Durée exacte du délai de rigueur de mise en état (art. 173 C.p.c.)** | Source secondaire mentionne douze mois; texte non lu; un délai faux est un préjudice direct |
| Z-03 | **Toutes les dispositions du C.p.c., du C.c.Q. et du R.C.S.M.F. citées ici** | Rapportées par le Barreau, non lues à la source |
| Z-04 | **Vocabulaire des mesures parentales** | Les aides-mémoire consultés emploient « garde » et « accès »; la loi fédérale emploie « temps parental » et « responsabilités décisionnelles » |
| Z-05 | **Règles de pagination, de cahiers et de mise au rôle** | Non lues. Aucun élément exploitable |
| Z-06 | **Qualification du statut d'emploi pour l'art. 21 DORS/97-175** | Salarié, autonome, associé, actionnaire de contrôle, bénéficiaire de fiducie : qualification juridique |
| Z-07 | **Qualification du régime matrimonial** | Détermine l'application de l'art. 29 R.C.S.M.F. |
| Z-08 | **Toute détection ou qualification de violence familiale** | Voir 9.4. Ne pas automatiser |
| Z-09 | **Choix des quatre branches de l'art. 27 R.C.S.M.F.** | Renoncer, déclarer non contesté ou produire un état est une décision stratégique |
| Z-10 | **Suffisance du contenu d'une déclaration sous serment** | Jugement professionnel |
| Z-11 | **Conservation et destruction des dossiers** | Hors périmètre de cette recherche, à traiter avant toute fonction d'archivage |

---

## 12. Modèle de données minimal

Volontairement réduit. Il doit tenir le droit de la famille sans lui être propre.

```
DomainePratique        code, libelle, version_config, date_verification
TypeDossierModele      domaine, axe_fondement, axe_objets[], axe_regime
Dossier                domaine, type_modele, district, tribunal, no_greffe, phase_courante
Partie                 dossier, role, personne, represente_par, confidentiel
Enfant                 dossier, date_naissance, filiation_contestee
Instance               dossier, fondement, date_introduction, date_signification
Phase                  instance, code_phase, date_debut, date_fin

Document               dossier, classe, type_document, date_document, date_reception,
                       version, remplace_id, statut_peremption, confidentialite,
                       source_classement (auto|humain), confiance_auto, confirme_par, confirme_le
RolePiece              document, cote, date_cotation, date_communication, destinataire,
                       etat (recue|cotee|communiquee|versee|contestee|exclue)
PreuveFinanciere       document, annee_fiscale, nature (declaration|avis_cotisation|paye|
                       etats_financiers|attestation|acte_fiducie|autre), partie
FormulaireImpose       document, code_formulaire, autorite_forme (reglement|directive_jc),
                       etape_production

Procedure              instance, type, date_depot, date_signification, mode_signification,
                       huissier, document_id
Audience               instance, type, date, salle, duree_estimee, district
Ensemble               dossier, destination (tribunal|partie_adverse|client), date_composition,
                       fige, documents[] (ordonnés)

RegleDomaine           domaine, identifiant, declencheur, condition, action, validation_humaine,
                       source, niveau_autorite, certitude, exceptions, date_verification, portee_config
Exigence               dossier, regle, statut (satisfaite|manquante|non_applicable|a_verifier),
                       evaluee_le
Echeance               dossier, regle, evenement_source, date_evenement, delai, date_calculee,
                       confirmee_par, confirmee_le
```

**Quatre décisions de modélisation à souligner.**

1. `Document` et `RolePiece` sont séparés. Un document n'est pas une pièce; il *devient* pièce.
2. `Echeance` conserve **l'événement source et sa date**, pas seulement la date calculée. Sans cela, on ne peut ni recalculer ni auditer.
3. `Ensemble` est figeable. C'est ce qui permet de dire ce qui a été communiqué, et quand.
4. `RegleDomaine` porte sa source, son autorité, sa certitude et sa date de vérification. **Une règle sans ces quatre champs ne doit pas pouvoir être créée.**

---

## 13. Format de règle produit

Format demandé, appliqué aux règles que les sources permettent réellement de soutenir. Quatre exemples représentatifs; le corpus complet est en annexe de travail.

---

**Identifiant** : `R-FAM-001`
**Domaine de pratique** : Droit de la famille
**Type de dossier** : Toute demande d'ordonnance alimentaire sous la *Loi sur le divorce*
**Déclencheur** : Création d'une instance portant l'objet `PAE` ou `PAC` sous fondement `DIV`
**Condition** : Aucune
**Action proposée par SAFE** : Créer les exigences documentaires correspondant à l'art. 21 DORS/97-175, soit trois années de déclarations de revenus et trois années d'avis de cotisation et de nouvelle cotisation, et signaler celles qui manquent
**Validation humaine requise** : Oui, pour le statut d'emploi qui détermine les documents additionnels
**Source juridique** : *Lignes directrices fédérales sur les pensions alimentaires pour enfants*, DORS/97-175, art. 21
**Niveau d'autorité de la source** : Règlement fédéral, texte officiel lu à la source
**Degré de certitude** : `SOURCE_PRIMAIRE_LUE`
**Exceptions** : L'applicabilité même des Lignes directrices fédérales plutôt que du régime québécois n'est pas établie — voir Z-01
**Date de dernière vérification** : 2026-08-13

---

**Identifiant** : `R-FAM-002`
**Domaine de pratique** : Droit de la famille
**Type de dossier** : Dossier avec ordonnance alimentaire rendue sous les Lignes directrices fédérales
**Déclencheur** : **Enregistrement dans SAFE d'une demande écrite** de renseignements émanant de l'autre époux ou du cessionnaire de la créance alimentaire. **Jamais l'anniversaire de l'ordonnance**
**Condition** : Une ordonnance est en vigueur, l'enfant demeure un enfant au sens des Lignes directrices, et aucune demande n'a déjà été satisfaite dans les douze mois
**Action proposée par SAFE** : Calculer la date de réception présumée à dix jours après l'envoi, proposer l'échéance à 30 jours de cette réception si le destinataire réside au Canada ou aux États-Unis, à 60 jours ailleurs, et préparer la liste des documents fiscaux des trois dernières années non encore fournis
**Validation humaine requise** : Oui, sur trois points : la date d'envoi réelle, le lieu de résidence, et la confirmation de l'échéance elle-même
**Source juridique** : DORS/97-175, art. 25
**Niveau d'autorité de la source** : Règlement fédéral, texte officiel lu à la source
**Degré de certitude** : `SOURCE_PRIMAIRE_LUE`, relu une seconde fois le 2026-08-13
**Exceptions** : La présomption de réception à dix jours peut être renversée. Une date d'envoi non prouvée rend tout le calcul inutilisable
**Note de révision** : Une première rédaction de cette règle plaçait le déclencheur à l'anniversaire de l'ordonnance. C'était faux et aurait produit une échéance inventée. Corrigé après seconde lecture du texte
**Date de dernière vérification** : 2026-08-13

---

**Identifiant** : `R-FAM-003`
**Domaine de pratique** : Droit de la famille
**Type de dossier** : Toute demande fondée sur la *Loi sur le divorce*
**Déclencheur** : Préparation de l'acte introductif
**Condition** : Aucune
**Action proposée par SAFE** : Vérifier la présence, dans l'acte introductif, d'une déclaration attestant la connaissance des obligations des art. 7.1 à 7.5, et alerter si absente
**Validation humaine requise** : Oui. SAFE constate une présence, il ne juge pas la suffisance du libellé
**Source juridique** : *Loi sur le divorce*, L.R.C. 1985, c. 3 (2e suppl.), art. 7.6
**Niveau d'autorité de la source** : Loi fédérale, texte officiel lu à la source
**Degré de certitude** : `SOURCE_PRIMAIRE_LUE`
**Exceptions** : Aucune identifiée
**Date de dernière vérification** : 2026-08-13

---

**Identifiant** : `R-FAM-004`
**Domaine de pratique** : Droit de la famille
**Type de dossier** : Demande en divorce, au stade de l'inscription pour instruction et jugement
**Déclencheur** : Ouverture de la phase de mise en état
**Condition** : Le dossier porte l'objet `PF`
**Action proposée par SAFE** : Rappeler qu'**une** des quatre options de l'art. 27 R.C.S.M.F. doit être jointe, présenter les quatre branches, et n'alerter que si aucune des quatre n'est présente
**Validation humaine requise** : Oui. Le choix de la branche est une décision stratégique
**Source juridique** : Règlement de la Cour supérieure du Québec en matière familiale, RLRQ c C-25.01, r. 0.2.4, art. 27
**Niveau d'autorité de la source** : Règlement provincial, **rapporté par le Barreau, texte non lu à la source**
**Degré de certitude** : `SOURCE_RAPPORTEE`, à confirmer
**Exceptions** : La forme de l'état est fixée par directive du juge en chef et peut changer sans modification réglementaire
**Date de dernière vérification** : 2026-08-13

---

## 14. Scénario complet, de l'ouverture à la fermeture

Divorce contesté, deux enfants, pension pour enfants, patrimoine familial, mesures provisoires. `DIV` + `PAR` + `PAE` + `PF` + `MP` + `CONT`.

| Étape | Ce que fait l'avocat | Ce que fait SAFE | Ce que SAFE ne fait pas |
|---|---|---|---|
| Ouverture | Entrevue, vérification de compétence | Crée le dossier depuis les trois axes; charge le jeu de règles du domaine et du district | Ne qualifie pas la compétence |
| Préliminaires | Informe le client de la séance de parentalité | Crée l'exigence « attestation de participation ou dispense » | Ne détermine pas si la dispense s'applique |
| Constitution | Obtient les pièces d'état civil | Ouvre les emplacements P-1 à P-4; marque le certificat de mariage comme **original attendu**, donc suivi physique | Ne constate pas l'originalité |
| Financier | Recueille les documents | Génère la liste de l'art. 21 par année fiscale; classe les documents téléversés par proposition; affiche les années manquantes | Ne qualifie pas le statut d'emploi |
| Rédaction | Rédige au Formulaire I | Vérifie la présence de la déclaration de l'art. 7.6; assemble l'Annexe I et ses pièces sans les agrafer | Ne rédige pas les allégations |
| Dépôt et signification | Dépose, fait signifier par huissier | Enregistre la date et le mode de signification comme **événements sources**; propose l'échéance de réponse à 15 jours et celle du protocole à 3 mois, **à confirmer** | Ne confirme pas seul une échéance |
| Provisoires | Prépare la demande | Rappelle le délai de signification de 10 jours; réunit les pièces à communiquer avec la notification; ouvre le compteur de 10 jours si le défendeur demande copie | Ne décide pas de la stratégie de communication |
| Protocole | Convient du protocole | Présente les neuf points de l'art. 148 comme gabarit; si aucun accord, bascule vers la proposition unilatérale et les points de divergence | Ne rédige pas les positions |
| Mise en état | Prépare l'inscription | Génère l'inventaire des pièces; vérifie les six éléments de l'art. 174; contrôle la présence du Formulaire II et d'une des quatre branches de l'art. 27 | Ne choisit pas la branche |
| Préparation | Met à jour les formulaires | **Marque périmés** l'Annexe I et le Formulaire III des mesures provisoires; ouvre les nouvelles versions liées aux précédentes; rappelle les 10 jours du Formulaire III et des citations | Ne remplit pas les nouveaux montants |
| Audience | Plaide | Fige l'ensemble documentaire communiqué, avec sa date | Ne produit pas de cahier tant que les règles locales ne sont pas connues |
| Jugement | Obtient le jugement | Classe le jugement; ouvre le suivi de l'obligation annuelle de l'art. 25 | Ne calcule pas les effets du jugement |
| Après jugement | Renonciations, suivis | Rappelle l'échéance d'enregistrement d'une renonciation dans l'année | Ne procède à aucun enregistrement |
| Fermeture | Ferme le dossier | Bloque la fermeture tant que des exigences demeurent `manquante` sans motif consigné | Ne détruit rien : la conservation est hors périmètre, voir Z-11 |

---

## 15. Proposition de MVP

**Principe de sélection** : ne retenir que ce qui repose sur une source lue directement, ou sur une règle de noyau indépendante du droit.

**MVP-1 — Le classeur financier alimentaire.** Génération de la liste des documents de l'art. 21 par partie et par année fiscale, téléversement, classement assisté avec confirmation, tableau des années manquantes. Et, **à partir d'une demande écrite enregistrée**, l'échéance de l'art. 25 calculée sur la réception présumée puis confirmée. C'est le seul module dont chaque règle est lue à la source, énumérative et calculable.

**MVP-2 — Le registre des pièces.** Cycle reçue → cotée → communiquée → versée, génération de l'inventaire, réconciliation entre pièces cotées et pièces inventoriées. Règles de noyau, valables pour toute pratique.

**MVP-3 — Le moteur d'exigences déclaratif.** Chargement des règles depuis une configuration versionnée portant source, autorité, certitude et date de vérification; évaluation par dossier; affichage des exigences satisfaites, manquantes, non applicables et à vérifier. Aucune règle en dur.

**MVP-4 — Le journal des échéances proposées.** Toute échéance conserve son événement source et sa date, s'affiche comme proposition, et n'existe qu'une fois confirmée par un humain.

**Hors MVP, explicitement** : cahiers et pagination, sélection du régime alimentaire, détection de violence familiale, calcul de tout montant, génération d'actes de procédure, tout délai non lu à la source.

---

## 16. Conclusion

### A. Constructible maintenant, règles suffisamment établies

1. Classeur des documents financiers de l'art. 21 DORS/97-175, par partie et par année fiscale.
2. Échéance de l'art. 25 déclenchée par une demande écrite enregistrée, calculée sur une réception présumée à dix jours, à 30 ou 60 jours selon la résidence, proposée puis confirmée. **Jamais déclenchée par un anniversaire.**
3. Contrôle de présence de la déclaration de l'art. 7.6 de la *Loi sur le divorce*.
4. Assemblage de l'Annexe I avec ses pièces par ligne renseignée, et respect de la consigne de non-agrafage.
5. Registre des pièces à cinq états et inventaire généré.
6. Versionnement des formulaires financiers, avec péremption à l'ouverture de la phase de préparation de l'instruction.
7. Journal des échéances conservant l'événement source.
8. Moteur d'exigences déclaratif, avec source et date de vérification obligatoires.

### B. À configurer par cabinet ou par tribunal, jamais à coder en dur

1. Formulaires prescrits par division et par district (V-01 à V-06).
2. Forme de l'état du patrimoine familial et de l'état de la société d'acquêts, fixée par directive du juge en chef (V-07).
3. Directives locales en vigueur et leur date de version (V-08).
4. Pagination, cahiers, plans d'argumentation, une fois les directives lues (V-09).
5. Cotation des pièces et nomenclature des fichiers (V-10, V-11).
6. Régime alimentaire applicable, saisi par l'avocat (V-12).
7. Seuils de durée d'instruction commandant une déclaration commune.

### C. À ne pas automatiser avant validation juridique supplémentaire

1. **Toute détection ou qualification de violence familiale.** Interdiction ferme, voir 9.4.
2. **La sélection du régime alimentaire applicable**, québécois ou fédéral (Z-01).
3. **Le délai de rigueur de mise en état de l'art. 173 C.p.c.**, tant que le texte n'est pas lu (Z-02).
4. **Toutes les échéances dérivées de dispositions rapportées** et non lues à la source (Z-03).
5. **Le vocabulaire des mesures parentales**, tant que la terminologie n'est pas alignée sur la loi fédérale en vigueur (Z-04).
6. **La qualification du statut d'emploi et du régime matrimonial** (Z-06, Z-07).
7. **Le choix parmi les quatre branches de l'art. 27 R.C.S.M.F.** (Z-09).
8. **Le jugement sur la suffisance d'une déclaration sous serment** (Z-10).
9. **Toute fonction d'archivage ou de destruction**, tant que les obligations de conservation ne sont pas recherchées (Z-11).
10. **La génération de cahiers destinés au tribunal**, tant que les directives locales ne sont pas lues (Z-05).

---

## 17. Sources

**Sources primaires lues**

- *Loi sur le divorce*, L.R.C. 1985, c. 3 (2e suppl.), art. 2(1), 7.1 à 7.8 — [laws-lois.justice.gc.ca](https://laws-lois.justice.gc.ca/fra/lois/d-3.4/page-2.html) — consulté le 2026-08-13, page indiquant une modification au 2026-08-06.
- *Lignes directrices fédérales sur les pensions alimentaires pour enfants*, DORS/97-175, art. 21 à 25 — [laws-lois.justice.gc.ca](https://laws-lois.justice.gc.ca/fra/reglements/DORS-97-175/page-2.html) — consulté le 2026-08-13.
- *Formulaire de fixation des pensions alimentaires pour enfants*, Annexe I (a. 3), version 2016-01 — [cdn-contenu.quebec.ca](https://cdn-contenu.quebec.ca/cdn-contenu/justice/formulaires/couple-famille/FORM_Fix_PA.pdf) — consulté le 2026-08-13.

**Sources professionnelles lues, rapportant le droit**

- Barreau du Québec, aide-mémoire « La demande en divorce » — [barreau.qc.ca](https://www.barreau.qc.ca/media/k5gpmfvn/famille-demande-en-divorce.pdf) — consulté le 2026-08-13. Date de version non établie.
- Barreau de Montréal, « Boîte à outils pour l'avocat familialiste », mise à jour février 2023 — [barreaudemontreal.qc.ca](https://www.barreaudemontreal.qc.ca/wp-content/uploads/cs-fam_boiteoutils.pdf) — consulté le 2026-08-13.

**Sources identifiées mais non accessibles en lecture**

- *Code de procédure civile*, RLRQ c C-25.01 — [legisquebec.gouv.qc.ca](https://www.legisquebec.gouv.qc.ca/fr/document/lc/C-25.01) et [canlii.org](https://www.canlii.org/fr/qc/legis/lois/rlrq-c-c-25.01/derniere/) — HTTP 403.
- *Règlement de la Cour supérieure du Québec en matière familiale*, RLRQ c C-25.01, r. 0.2.4 — [canlii.org](https://www.canlii.org/fr/qc/legis/regl/rlrq-c-c-25.01-r-0.2.4/derniere/rlrq-c-c-25.01-r-0.2.4.html) — HTTP 403.
- Directives de la Cour supérieure, district de Montréal, version du 2026-02-23 — [coursuperieureduquebec.ca](https://coursuperieureduquebec.ca/fileadmin/cour-superieure/Districts_judiciaires/Montreal/Directives_et_Annexes_Montreal/2026-02-23_Directives_District_Montreal.pdf) — HTTP 403.
- *Règlement sur la fixation des pensions alimentaires pour enfants*, RLRQ c C-25.01, r. 0.4 — [legisquebec.gouv.qc.ca](https://www.legisquebec.gouv.qc.ca/fr/document/rc/c-25.01,%20r.%200.4) — HTTP 403.

**Recherche interne connexe**

- [RAPPORT_CANONIQUE_V2.md](../patrimoine-familial-quebec/v2/RAPPORT_CANONIQUE_V2.md) — patrimoines conjugaux, périmètre du calcul du partage. Complémentaire, non redondant.
