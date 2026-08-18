# Méthode et registre des sources

Recherche : gestion documentaire et préparation des dossiers, droit de la famille, Québec
Date de recherche : 2026-08-13
Standard appliqué : [RESEARCH_STANDARDS.md](../RESEARCH_STANDARDS.md), [PROCEDURE_recherche_complete.md](../PROCEDURE_recherche_complete.md)
Classement du sujet : **risque élevé** (matière réglementée, workflow client encadré). Sources primaires exigées, marquage strict.

---

## 1. Ce qui a pu être lu à la source, et ce qui ne l'a pas pu

C'est la limite la plus importante de cette recherche, et elle conditionne le degré de certitude de presque toutes les règles qui suivent.

### 1.1 Lu directement, texte officiel

| Source | Autorité | Accès | Ce qui en a été tiré |
|---|---|---|---|
| *Loi sur le divorce*, L.R.C. 1985, c. 3 (2e suppl.), art. 2(1) et 7.1 à 7.8 | Loi fédérale, site officiel du ministère de la Justice du Canada | Lu le 2026-08-13, page indiquant une dernière modification au 2026-08-06 | Définition de « violence familiale »; obligations des parties, des conseillers juridiques et du tribunal; exigence d'une déclaration dans l'acte introductif |
| *Lignes directrices fédérales sur les pensions alimentaires pour enfants*, DORS/97-175, art. 21 à 25 | Règlement fédéral, site officiel | Lu le 2026-08-13 | Liste des documents financiers obligatoires; conséquences du défaut; obligation annuelle continue et ses délais |
| *Formulaire de fixation des pensions alimentaires pour enfants*, Annexe I (a. 3), version datée 2016-01 | Formulaire réglementaire, portail du gouvernement du Québec | PDF lu page par page le 2026-08-13 | Structure complète du formulaire; pièces justificatives exigées par rubrique; règle d'assemblage |

### 1.2 Lu directement, mais source professionnelle rapportant le droit

| Source | Autorité | Accès | Portée |
|---|---|---|---|
| Barreau du Québec, aide-mémoire **« La demande en divorce »** | Ordre professionnel. Rapporte le droit, ne le crée pas | PDF lu page par page le 2026-08-13 | Cycle de vie complet du dossier, avec citation des articles du C.p.c., du C.c.Q., de la *Loi sur le divorce* et du Règlement de la Cour supérieure en matière familiale |
| Barreau de Montréal, **« Boîte à outils pour l'avocat familialiste »**, mise à jour février 2023 | Section d'ordre professionnel | PDF lu le 2026-08-13 | Inventaire des règlements, directives et formulaires applicables, avec dates de version |

### 1.3 Non accessible en lecture automatisée

| Source | Motif | Conséquence sur la recherche |
|---|---|---|
| LégisQuébec (`legisquebec.gouv.qc.ca`) | HTTP 403 sur toutes les tentatives, y compris les PDF | Le texte du *Code de procédure civile* et du Règlement de la Cour supérieure en matière familiale **n'a pas été lu à la source** |
| CanLII (`canlii.org`) | HTTP 403 | Même conséquence |
| `justice.gouv.qc.ca` | HTTP 403 | Formulaires SJ et déclaration 444 non lus à la source |
| Directives du district de Montréal, PDF du 2026-02-23 | HTTP 403 | Les directives locales **en vigueur** n'ont pas été lues. Seule leur existence et leur date sont établies |
| Site de la Cour supérieure, pages de formulaires | HTTP 403 | Inventaire des formulaires non vérifié directement |

**Conséquence à retenir.** Chaque fois qu'un article du *Code de procédure civile*, du *Code civil du Québec* ou du Règlement de la Cour supérieure en matière familiale est cité ci-après, il l'est **tel que rapporté par le Barreau du Québec ou le Barreau de Montréal**, et non tel que lu dans le texte officiel. Ces sources sont fiables et professionnelles, mais elles restent secondaires au sens de nos standards. Le degré de certitude attribué en tient compte.

---

## 2. Vocabulaire de statut

On réutilise le vocabulaire déjà fixé par [RAPPORT_CANONIQUE_V2.md](../patrimoine-familial-quebec/v2/RAPPORT_CANONIQUE_V2.md) plutôt que d'en créer un second, et on l'articule avec le marquage des standards de recherche.

| Statut | Signification | Marquage standards |
|---|---|---|
| `SOURCE_PRIMAIRE_LUE` | Texte officiel lu directement dans cette recherche | `VERIFIE` |
| `SOURCE_RAPPORTEE` | Règle citée par un ordre professionnel, texte officiel non lu ici | `A_CONFIRMER` |
| `READY_FOR_PRO_REVIEW` | Règle modélisable, sources suffisantes pour une revue par un avocat | `A_CONFIRMER` |
| `HUMAN_DECISION_ONLY` | Jugement professionnel ou pouvoir judiciaire, non automatisable | — |
| `VARIABLE_LOCALE` | Dépend du district, de la division ou d'une directive locale | `A_CONFIRMER` |
| `RESEARCH_INCOMPLETE` | Corpus insuffisant, information non déterminée | — |
| `SOURCE_CONFLICT` | Sources divergentes ou source périmée par une réforme |  — |
| `BLOCKED_FOR_PRODUCTION` | Interdiction d'usage client avant validation professionnelle datée |  — |

**Règle dure.** Comme dans la recherche patrimoine familial, aucune règle de ce document n'est utilisable en production client avant l'enregistrement d'une approbation professionnelle datée et signée par un avocat québécois en exercice.

---

## 3. Contradiction majeure détectée

`SOURCE_CONFLICT` — **Les outils du Barreau ne sont pas à jour avec la réforme fédérale de 2021.**

La boîte à outils du Barreau de Montréal (février 2023) porte une note explicite : « Les documents ci-dessous n'ont pas été mis à jour depuis l'entrée en vigueur de la nouvelle *Loi sur le divorce*. Le Barreau de Montréal y travaille actuellement. » Cette note vise les listes de vérification et les modèles de procédures.

L'aide-mémoire « La demande en divorce » emploie encore le vocabulaire de la **garde** et de l'**accès**, et cite l'art. 16(1) de la *Loi sur le divorce*. Or le texte fédéral lu à la source le 2026-08-13 emploie le vocabulaire du **temps parental** et des **responsabilités décisionnelles**, et comporte des art. 7.1 à 7.8 issus de la réforme.

**Conséquence produit.** Le vocabulaire de l'interface et des gabarits documentaires ne doit pas être copié des aides-mémoire du Barreau sans vérification. Toute liste de vérification dérivée de ces documents doit être revue par un avocat avant usage. Cette contradiction est signalée à chaque endroit où elle joue.

---

## 4. Ce qui n'a pas été couvert

À déclarer franchement plutôt qu'à combler par déduction.

- **Le texte des directives locales en vigueur.** On sait que le district de Montréal a des directives datées du 2026-02-23 et des directives propres aux affaires familiales, mais leur contenu n'a pas été lu. Toute règle de pagination, de cahier, de plan d'argumentation ou de mise au rôle qui en dépendrait est `RESEARCH_INCOMPLETE`.
- **Les districts autres que Montréal et Québec.** Aucune donnée.
- **La Chambre de la jeunesse et la protection de la jeunesse.** Hors périmètre demandé, mais fréquemment adjacent à un dossier de violence familiale. Non traité.
- **L'union parentale et son patrimoine** (C.c.Q. art. 521.20 et suivants). Traité par la recherche patrimoine familial, non repris ici sauf pour le classement documentaire.
- **Les délais de conservation et de destruction des dossiers.** Relèvent du Règlement sur la comptabilité et les normes d'exercice professionnel des avocats et de la Loi sur le Barreau. Non couverts ici, à traiter séparément.
- **La médiation familiale et son volet subventionné.** Non couvert.

---

## 5. Journal de collecte

| Horodatage | Action | Résultat |
|---|---|---|
| 2026-08-13 | Lecture des standards internes et du rapport canonique v2 patrimoine familial | Vocabulaire de statut réutilisé, périmètre distinct confirmé : le rapport v2 traite du calcul du partage, celui-ci traite du document |
| 2026-08-13 | Tentatives LégisQuébec, CanLII, justice.gouv.qc.ca, coursuperieureduquebec.ca | HTTP 403, sources primaires québécoises inaccessibles |
| 2026-08-13 | *Loi sur le divorce*, art. 2(1) et 7.1 à 7.8 | Lu |
| 2026-08-13 | Lignes directrices fédérales, art. 21 à 25 | Lu |
| 2026-08-13 | Formulaire Annexe I, version 2016-01 | Lu, 4 pages |
| 2026-08-13 | Barreau de Montréal, boîte à outils | Lu, 3 pages |
| 2026-08-13 | Barreau du Québec, « La demande en divorce » | Lu, 11 pages |
