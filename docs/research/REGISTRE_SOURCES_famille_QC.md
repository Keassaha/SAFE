# Registre des sources officielles — calculateurs de droit de la famille (Québec)

**Tenu depuis** : 2026-08-19
**Sert à** : `calc-patrimoine-familial` et `calc-pension-alimentaire` (REGLE_DE_BUILD.md §5bis condition 3)
**Règle** : aucun chiffre affiché par un outil ne peut reposer sur une source absente de ce registre.

Ce registre existe parce qu'un calculateur qui produit un montant engage la
responsabilité professionnelle de l'avocate qui le signe. Chaque ligne dit d'où vient
la règle, si nous la détenons vraiment, et à quelle date elle a été vérifiée.

---

## Légende

- **DÉTENU** : texte obtenu et vérifié, citable
- **MANQUANT** : nécessaire au calcul, pas encore en notre possession
- **UTILE** : améliore la justesse ou l'usage, non bloquant

---

## A. Patrimoine familial

| # | Source | État | Vérifié le | Ce qu'elle donne |
|---|---|---|---|---|
| A1 | C.c.Q. art. 414 à 426 | **DÉTENU** | 2026-08-19 | Composition, exclusions, date d'évaluation, dettes déductibles, déductions et formule de plus-value proportionnelle, plafond des régimes de retraite, renonciation |
| A2 | C.c.Q. art. 521.29 à 521.36 | **DÉTENU** | 2026-08-19 | Patrimoine d'union parentale : composition, date de référence, quatre sources d'apport, retrait, effet d'une exclusion conventionnelle |
| A3 | Règlement de la Cour supérieure en matière familiale, C-25.01, r. 0.2.4, art. 26 à 29 | **DÉTENU** | 2026-08-19 | Obligation de produire le formulaire sous serment, délais de 180 et 30 jours, renvoi au formulaire du juge en chef, art. 28 sur la renonciation éclairée |
| A4 | Formulaire de calcul de l'état du patrimoine familial, Cour supérieure (`cs-patrimoine-familial.xls`) | **MANQUANT** | — | Structure officielle du formulaire assermenté : parties, lignes, totaux |

**Obstacle sur A4** : `coursuperieureduquebec.ca` est protégé par Cloudflare et refuse les
outils automatisés. Non contourné. Seul un téléchargement humain le débloque.

**Conséquence** : la première version du calculateur ne prétendra pas produire le
formulaire assermenté. Elle produira un état de calcul lisible et le dira.

---

## B. Pension alimentaire pour enfants

| # | Source | État | Vérifié le | Ce qu'elle donne |
|---|---|---|---|---|
| B1 | C.c.Q. art. 585 à 596 | **DÉTENU** | 2026-08-19 | Qui se doit des aliments, présomption de l'art. 587.1, ajustements de l'art. 587.2, entente des parents de l'art. 587.3, indexation annuelle de l'art. 590, arrérages |
| B2 | Règlement sur la fixation des pensions alimentaires pour enfants, C-25.01, r. 0.4 | **DÉTENU** | 2026-08-19 | Règles 1 à 10 et **formulaire officiel complet avec ses lignes numérotées** (parties 1 à 10) |
| B3 | Règlement sur la table de fixation de la contribution alimentaire parentale de base, C-25.01, r. 12, **art. 1 et 2** | **DÉTENU** | 2026-08-19 | Renvoi de la table à l'annexe I, et **règle au-delà de 6 enfants** : multiplier l'écart entre les montants pour 5 et 6 enfants par le nombre d'enfants additionnels, puis ajouter au montant pour 6 |
| B4 | C-25.01, r. 12, **ANNEXE I — la table elle-même** | **DÉTENU** | 2026-08-19 | **Les montants**, 105 tranches de revenu disponible × 6 colonnes, plus la **déduction de base de 13 865 $** (ligne 301) et les pourcentages au-delà de 200 000 $. Version applicable depuis le 1er janvier 2026, A.M. 5500 |
| B5 | Loi sur le divorce, art. 2(1) et 2(5) | **DÉTENU** | 2026-08-19 | Définition des « lignes directrices applicables » : celles de la province si les deux ex-époux y résident habituellement, sinon les Lignes directrices fédérales |
| B6 | Décret désignant la province de Québec, DORS/97-237 | **DÉTENU** (référencé) | 2026-08-19 | Le Québec est province désignée depuis le 1er mai 1997. Le modèle québécois s'applique en matière de divorce **à condition que les deux parents résident au Québec** |
| B7 | Lignes directrices fédérales sur les pensions alimentaires pour enfants, DORS/97-175 | **DÉTENU** | 2026-08-19 | Le calcul applicable quand les parents ne résident pas dans la même province. Détail au §B-bis |
| B8 | Loi facilitant le paiement des pensions alimentaires, chapitre P-2.2 | **UTILE** | — | Perception par Revenu Québec, qui peut modifier la fréquence des versements (note 4 du formulaire) |
| B9 | Loi favorisant l'accès à la justice (SARPA), chapitre A-2.02, art. 5 | **UTILE** | — | Détermination du revenu d'un parent en défaut de fournir ses renseignements (art. 9 du règlement) |

**B4 est arrivée le 2026-08-19** et le blocage est levé. La table a été extraite de la
couche texte du PDF officiel, puis validée : 105 tranches contiguës, aucune
discontinuité, croissance vérifiée sur les deux axes, cinq témoins recoupés. Elle est
figée dans `sources-officielles/table-contribution-alimentaire-2026-01-01.json`.

**Il ne reste qu'un manque**, A4, le formulaire de patrimoine de la Cour supérieure. Il
n'empêche aucun calcul ; il empêche de prétendre produire le formulaire assermenté.

**B7 n'est pas optionnel pour un cabinet d'immigration et de famille** : dès qu'un
parent quitte le Québec, le calcul change de régime. Ce régime est désormais détenu.

---

## C. Ce que les sources détenues établissent déjà

### C.1 Seuils de garde qui commandent la section du formulaire `VERIFIE`

Source : C-25.01, r. 0.4, art. 4 à 7.

| Situation | Seuil | Section du formulaire |
|---|---|---|
| Garde exclusive | un parent assume **plus de 60 %** du temps | section 1 (lignes 510-512.1) |
| Droit de visite et de sortie prolongé | le parent non gardien assume **entre 20 % et 40 %** | section 1.1 (lignes 513-518.1) |
| Garde exclusive attribuée à chacun | chaque parent a la garde exclusive d'au moins un enfant | section 2 (lignes 520-526.1) |
| Garde partagée | chaque parent assume **au moins 40 %** | section 3 (lignes 530-534.1) |
| Situations mixtes | plusieurs types de garde simultanés | section 4 (lignes 540-564.1) |

Le pourcentage de temps de garde se calcule en jours sur 365 (lignes 515, 530, 548,
556). Le « temps de garde » comprend le temps de visite et de sortie, que l'enfant soit
ou non confié à un tiers pendant ce temps (art. 9, 4°).

### C.2 Deux plafonds distincts `VERIFIE`

- **Capacité de payer**, art. 8 et partie 6 du formulaire : la pension ne peut excéder
  **la moitié du revenu disponible** du parent débiteur, sauf décision contraire du
  tribunal eu égard notamment à ses actifs. Le formulaire retient le **moindre** des
  lignes 601 et 602.
- **Revenu disponible combiné supérieur à 200 000 $**, art. 10 : au-delà, le
  pourcentage de la table n'est donné **qu'à titre indicatif**, et le tribunal peut
  fixer un montant différent.

### C.3 Ce qui entre et ce qui n'entre pas dans le revenu `VERIFIE`

Art. 9, 2°. Le revenu annuel comprend les revenus de toute provenance, y compris
pensions alimentaires reçues à titre personnel, prestations d'assurance-emploi,
prestations parentales, montant imposable des dividendes, revenus nets de location et
revenus nets d'entreprise ou de travail autonome.

**Ne sont pas considérés comme revenus** : les transferts gouvernementaux reliés à la
famille, les prestations d'aide financière de dernier recours, et les montants reçus
dans le cadre des programmes d'aide financière aux études.

Les revenus non imposables sont **convertis en équivalent imposable**.

### C.4 Le formulaire est prêté serment `VERIFIE`

Partie 10 du formulaire : déclaration sous serment de chaque parent, devant une
personne habilitée. C'est la raison d'être de la condition 3 du §5bis : l'outil doit
montrer son chemin de calcul, article par article, parce que quelqu'un va jurer dessus.

---

## D. Le téléchargement qu'il reste à faire

~~1. La table de fixation.~~ **Fournie par le CEO le 2026-08-19**, version applicable
depuis le 1er janvier 2026 (A.M. 5500), vérifiée et figée.

1. **Le formulaire de patrimoine familial** de la Cour supérieure.
   `coursuperieureduquebec.ca`, section Formulaires, fichier `cs-patrimoine-familial.xls`.

---

## B-bis. Régime fédéral (domaine B du mandat)

| # | Source | État | Vérifié le | Ce qu'elle donne |
|---|---|---|---|---|
| B10 | DORS/97-175, art. 1 à 10 | **DÉTENU** | 2026-08-19 | Objectifs, définitions (majorité du temps parental = plus de 60 %), montant de base, table applicable selon la résidence du débiteur, seuil de 150 000 $, six catégories de dépenses spéciales, garde exclusive croisée, temps parental partagé à 40 %, difficultés excessives et test des niveaux de vie |
| B11 | DORS/97-175, annexe I, **table du Québec** | **DÉTENU** | 2026-08-19 | Six tables, une par nombre d'enfants. Formule affine par tranche de 1 000 $ : montant de base + (revenu − seuil) × pourcentage |
| B12 | DORS/97-175, art. 15 à 20 et annexe III | **MANQUANT** | — | Détermination et rajustements du revenu. Accessible, simplement pas encore relevé |
| B13 | DORS/97-175, annexe II | **MANQUANT** | — | Méthode de comparaison des niveaux de vie, requise par l'art. 10(3) |

**Version du règlement fédéral** : à jour au 2026-06-17, dernière modification
2025-10-01, page consultée modifiée le 2026-08-06.

**Asymétrie notable** : la table fédérale est en HTML lisible et directement codable ;
la table québécoise est un PDF verrouillé. Le régime fédéral est aujourd'hui plus
constructible que le régime québécois.

---

## E. Journal des vérifications

| Date | Fait |
|---|---|
| 2026-08-19 | C.c.Q. 414-426 et 521.29-521.36 obtenus sur Légis Québec (navigateur ; l'outil de récupération reçoit un 403) |
| 2026-08-19 | C-25.01, r. 0.2.4 art. 26-29 obtenus. Les délais de 180 et 30 jours concordent avec `lib/dossiers/delais-famille.ts` |
| 2026-08-19 | Formule de plus-value de l'art. 418 vérifiée contre l'exemple chiffré d'Éducaloi, puis rejouée en code : concordance au dollar |
| 2026-08-19 | C-25.01, r. 0.4 obtenu (exemplaire fourni par le CEO, à jour au 1er avril 2026), formulaire complet lu |
| 2026-08-19 | C-25.01, r. 12 art. 1-2 obtenus. **Annexe I non accessible** : publiée en PDF, site en 403 hors navigateur, et le navigateur déclenche une boîte d'enregistrement |
| 2026-08-19 | C.c.Q. 585-596 obtenus |
| 2026-08-19 | Loi sur le divorce 2(1)/2(5) obtenue ; désignation du Québec confirmée (DORS/97-237, 1er mai 1997) |
| 2026-08-19 | DORS/97-175 art. 1 à 10 obtenus verbatim, plus la structure de la table du Québec. Corpus et contrôle de complétude consignés dans `CORPUS_JURIDIQUE_famille_QC_2026-08-19.md` |

---

## F. Sources

- [Code civil du Québec](https://www.legisquebec.gouv.qc.ca/fr/document/lc/ccq-1991)
- [C-25.01, r. 0.2.4 — Règlement de la Cour supérieure du Québec en matière familiale](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%200.2.4)
- [C-25.01, r. 0.4 — Règlement sur la fixation des pensions alimentaires pour enfants](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%200.4)
- [C-25.01, r. 12 — Règlement sur la table de fixation de la contribution alimentaire parentale de base](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%2012)
- [Loi sur le divorce](https://laws-lois.justice.gc.ca/fra/lois/d-3.4/)
- [DORS/97-237 — Décret désignant la province de Québec](https://lois-laws.justice.gc.ca/fra/reglements/DORS-97-237/page-1.html)
