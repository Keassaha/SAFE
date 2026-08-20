# Corpus juridique — calculateurs de droit de la famille

**Date de recherche** : 2026-08-19
**Auteur** : session Claude Code, sous mandat de constitution de corpus
**Statut** : `review` — contrôle de complétude du §7 **réussi sous réserves** depuis la
réception de la table le 2026-08-19
**Périmètre** : réglementaire (Québec et fédéral), pour les domaines A à D du mandat
**Risque** : ÉLEVÉ. Tout montant produit sera juré sous serment par une avocate.

> **Verdict d'entrée, révisé le 2026-08-19 en fin de journée.** La table québécoise a
> été fournie par le CEO, vérifiée et figée. Le blocage de la pension québécoise est
> **levé**. Les trois domaines passent désormais le contrôle, chacun sous les réserves
> nommées au §7. Un seul manque subsiste, et il n'empêche aucun calcul : le formulaire
> de patrimoine de la Cour supérieure.

---

## 1. Question de départ

Quelles sources juridiques, réglementaires, administratives, mathématiques et
procédurales sont nécessaires pour construire un outil qui détermine d'abord le régime
applicable, puis effectue correctement les calculs permis ?

---

## 2. Méthode et limites

**Sources prioritaires** : Légis Québec (Éditeur officiel du Québec) et
laws-lois.justice.gc.ca (ministère de la Justice du Canada), textes codifiés.

**Période couverte** : textes en vigueur au 2026-08-19.

**Limites, énoncées d'emblée** :

- Légis Québec renvoie **HTTP 403** à tout client non-navigateur, y compris `curl`. Son
  lien PDF déclenche une boîte d'enregistrement plutôt qu'un affichage. Le site de la
  Cour supérieure est protégé par **Cloudflare**. Ces protections **n'ont pas été
  contournées**, conformément au mandat.
- Conséquence, au moment de la première rédaction : trois pièces classées
  **MANQUANTES**. Deux ont depuis été fournies par le CEO (r. 0.4, puis r. 12 avec sa
  table). **Une seule reste manquante** : le formulaire de patrimoine de la Cour
  supérieure. Une référence vers un PDF n'est toujours pas sa possession.
- **Aucune jurisprudence n'a été dépouillée.** Les zones d'incertitude du §8 se
  tranchent en jurisprudence.
- Aucune règle n'a été déduite d'un calculateur tiers.

---

## 3. Les deux tables n'ont pas la même forme

L'asymétrie relevée avant la réception de la table québécoise portait sur l'accès ; elle
est levée. Celle qui reste porte sur la **forme**, et elle commande deux implémentations
différentes.

| | Québec | Fédéral |
|---|---|---|
| Où vit la table | C-25.01, r. 12, annexe I, PDF officiel **détenu** | DORS/97-175, annexe I, HTML |
| Ce que la table donne | la **contribution des deux parents**, en dollars par année, à répartir ensuite | le **montant du débiteur seul**, en dollars par mois |
| Forme | **105 tranches en dur** + pourcentages au-delà de 200 000 $ | **formule affine par tranche** : `De`, `À`, `Montant de base`, `Plus (%)`, `Du revenu dépassant` |
| Entrée | revenu **disponible combiné** des deux parents | revenu du **débiteur** |

La table fédérale du Québec (page 6 du règlement) comporte six tables, une par nombre
d'enfants de 1 à 6, avec des tranches de revenu de 1 000 $. Le montant mensuel se
calcule ainsi :

```
paiement mensuel = montant de base + (revenu - seuil de la tranche) x pourcentage / 100
```

Exemple lisible dans la source, table du Québec, dernière tranche :
`150000 | ou plus | 3903 | 2.08 | 150000`. `VERIFIE`

Conséquence de conception : le québécois se lit dans une table figée, le fédéral se
calcule. Un moteur unique qui prétendrait servir les deux avec la même structure de
données se tromperait sur l'unité (année contre mois) autant que sur l'assiette
(couple contre débiteur).

---

## 4. Domaine A — Pension alimentaire québécoise

### 4.1 Sources détenues

| Source | Autorité | Version vérifiée | État |
|---|---|---|---|
| C.c.Q. art. 585 à 596 | Éditeur officiel du Québec | 2026-08-19 | **DÉTENU** |
| C-25.01, r. 0.4, règles 1 à 10 + formulaire (annexe I) | Éditeur officiel du Québec | **à jour au 1er avril 2026** | **DÉTENU**, PDF conservé au dépôt |
| C-25.01, r. 12, art. 1 et 2 | Éditeur officiel du Québec | à jour au 1er avril 2026 | **DÉTENU** |
| C-25.01, r. 12, **annexe I (la table)** | Éditeur officiel du Québec | applicable depuis le **1er janvier 2026**, A.M. 5500 ; document à jour au 1er avril 2026 | **DÉTENU**, PDF conservé et table extraite |

### 4.2 Règles établies `VERIFIE`

**Champ d'application.** Les règles s'appliquent à toute demande relative à
l'obligation alimentaire des parents envers leur enfant mineur, et à l'enfant majeur
qui, notamment parce qu'il poursuit des études à temps plein, n'est pas en mesure
d'assurer sa subsistance (r. 0.4, art. 1). Le tribunal peut fixer autrement pour un
enfant majeur (art. 2).

**Présomption.** La contribution alimentaire parentale de base est **présumée**
correspondre aux besoins de l'enfant et aux facultés des parents (C.c.Q. 587.1).

**Seuils de garde et section du formulaire.**

| Situation | Seuil | Section |
|---|---|---|
| Garde exclusive | plus de **60 %** du temps | section 1, lignes 510-512.1 |
| Droit de visite et de sortie prolongé | entre **20 % et 40 %** | section 1.1, lignes 513-518.1 |
| Garde exclusive attribuée à chacun | chacun a la garde exclusive d'au moins un enfant | section 2, lignes 520-526.1 |
| Garde partagée | chacun au moins **40 %** | section 3, lignes 530-534.1 |
| Situations mixtes | plusieurs types simultanés | section 4, lignes 540-564.1 |

Le pourcentage se calcule en jours sur **365**. Le temps de garde comprend le temps de
visite et de sortie, que l'enfant soit ou non confié à un tiers pendant ce temps
(art. 9, 4°).

**Revenus.** Toute provenance, y compris pensions reçues à titre personnel,
assurance-emploi, prestations parentales, montant imposable des dividendes, revenus
nets de location, revenus nets d'entreprise ou de travail autonome. **Exclus** :
transferts gouvernementaux reliés à la famille, aide financière de dernier recours,
aide financière aux études. Les revenus non imposables sont **convertis en équivalent
imposable** (art. 9, 2°).

**Revenu disponible** = revenu annuel moins la déduction de base (table), les
cotisations syndicales et les cotisations professionnelles (art. 9, 3° ; lignes 300-305).

**Frais** (art. 9, 1°) : frais de garde, frais d'études postsecondaires, frais
particuliers. Tous **réduits** de tout avantage, subvention, déduction ou crédit
d'impôt afférent, et **réputés nuls si le montant net est négatif**.

**Deux plafonds distincts.**
- Capacité de payer : la pension ne peut excéder **la moitié du revenu disponible** du
  débiteur, sauf décision contraire eu égard notamment à ses actifs (art. 8). Le
  formulaire retient le **moindre** des lignes 601 et 602.
- Revenu disponible combiné **supérieur à 200 000 $** : le pourcentage de la table
  n'est donné **qu'à titre indicatif** (art. 10).

**Au-delà de six enfants** (r. 12, art. 1 al. 2) : multiplier la différence entre les
montants prévus pour 5 et 6 enfants par le nombre d'enfants additionnels, puis
additionner au montant prévu pour 6.

**Ajustements judiciaires** (C.c.Q. 587.2) : la valeur peut être augmentée ou réduite
selon les actifs d'un parent, les ressources de l'enfant, les obligations envers
d'autres enfants, ou des difficultés excessives.

**Entente des parents** (C.c.Q. 587.3, partie 7 du formulaire) : les parents peuvent
convenir d'un montant différent, sauf au tribunal à vérifier qu'il pourvoit
suffisamment aux besoins de l'enfant.

**Indexation** (C.c.Q. 590) : de plein droit au **1er janvier** de chaque année, suivant
l'indice des rentes de la Loi sur le régime de rentes du Québec, sauf disproportion
sérieuse.

**Périodicité** (partie 8 du formulaire) : mensuelle (÷12), deux fois par mois (÷24),
aux deux semaines (÷26), hebdomadaire (÷52), ou autre. La perception par Revenu Québec
peut modifier cette fréquence.

### 4.3 La table, obtenue et vérifiée

Fournie le 2026-08-19. Extraite de la **couche texte du PDF officiel**, jamais recopiée
à l'œil, puis validée par programme avant tout usage :

- **105 tranches** de revenu disponible, de `1 - 1 000` à `198 001 - 200 000` ;
- **contiguïté** vérifiée : aucune discontinuité ni chevauchement ;
- **croissance** vérifiée sur les deux axes, revenu et nombre d'enfants ;
- **cinq témoins** recoupés contre le texte source.

Elle donne aussi les deux paramètres qui manquaient :

- **déduction de base de la ligne 301 : 13 865 $**, applicable depuis le 1er janvier
  2026 ;
- au-delà de 200 000 $ de revenu disponible, pourcentages de l'excédent de
  **3,5 / 4,5 / 6,5 / 8,0 / 10,0 / 11,5 %** selon le nombre d'enfants, **indicatifs
  seulement** (r. 0.4, art. 10).

Figée dans `sources-officielles/table-contribution-alimentaire-2026-01-01.json`, avec sa
provenance et sa date d'application.

**Note de méthode.** Ma première lecture visuelle de l'image donnait 21 430 $ pour la
tranche 98 001 - 100 000 à trois enfants. La couche texte dit **21 130 $**, valeur
encadrée par 20 960 $ et 21 290 $ aux tranches voisines. C'est mon œil qui avait tort.
C'est précisément pourquoi le mandat exige une deuxième vérification, et pourquoi aucun
nombre de cette table ne doit être saisi à la main.

---

## 5. Domaine B — Régime fédéral

### 5.1 Sources détenues

| Source | Autorité | Version vérifiée | État |
|---|---|---|---|
| Loi sur le divorce, art. 2(1) et 2(5) | ministère de la Justice du Canada | 2026-08-19 | **DÉTENU** |
| DORS/97-237, désignation du Québec | ministère de la Justice du Canada | en vigueur depuis le **1er mai 1997** | **DÉTENU** (référencé) |
| DORS/97-175, art. 1 à 10 | ministère de la Justice du Canada | **à jour 2026-06-17, dernière modification 2025-10-01** | **DÉTENU** |
| DORS/97-175, annexe I, **table du Québec** | ministère de la Justice du Canada | même version | **DÉTENU**, structure relevée |
| DORS/97-175, art. 15 à 20 et annexe III (revenu) | ministère de la Justice du Canada | — | **MANQUANT**, non bloquant à ce stade |
| DORS/97-175, annexe II (niveaux de vie) | ministère de la Justice du Canada | — | **MANQUANT**, non bloquant |

### 5.2 La règle d'aiguillage, qui commande tout `VERIFIE`

Loi sur le divorce, art. 2(1), définition de « lignes directrices applicables » : les
lignes directrices **de la province** lorsque les deux ex-époux résident habituellement
dans la même province désignée à la date pertinente ; **les Lignes directrices
fédérales dans tous les autres cas**.

Le Québec est province désignée depuis le 1er mai 1997 (DORS/97-237).

**Donc** : en matière de divorce, le modèle québécois ne s'applique que si **les deux
parents résident habituellement au Québec**. Dès qu'un parent réside ailleurs, ou hors
Canada, le régime bascule au fédéral.

Hors divorce (séparation de fait, union parentale, parents jamais mariés), c'est le
droit québécois qui s'applique, sans passer par la Loi sur le divorce.

**Quelle table fédérale** (DORS/97-175, art. 3(3)) : celle de la province de résidence
habituelle **du parent débiteur**, à la date de la demande ; celle de sa nouvelle
province si le tribunal est convaincu qu'elle a changé ; celle de la province où il
résidera dans un proche avenir, le cas échéant. **Si le débiteur réside hors Canada ou
que sa résidence est inconnue** : la table de la province où réside habituellement
l'autre époux.

### 5.3 Différences structurelles à ne jamais transposer `VERIFIE`

| Règle | Québec | Fédéral |
|---|---|---|
| Nature du calcul | contribution des **deux** parents, puis répartition selon le facteur de revenu | montant du **débiteur seul**, lu dans la table |
| Seuil de revenu élevé | **200 000 $** de revenu disponible **combiné**, pourcentage indicatif | **150 000 $** du revenu du **débiteur**, discrétion au-delà (art. 4) |
| Plafond de capacité | **50 %** du revenu disponible (art. 8 du règlement) | **aucun équivalent** ; à la place, difficultés excessives (art. 10) |
| Garde exclusive | plus de 60 % | « majorité du temps parental » = plus de **60 %** (art. 2(1)) |
| Garde partagée | au moins 40 % chacun | au moins **40 %** chacun (art. 9) |
| Garde exclusive croisée | section 2 du formulaire | art. 8 : **différence** entre les montants que chacun paierait |
| Frais partagés | en proportion du revenu **disponible** | en proportion du revenu, **déduction faite de la contribution de l'enfant** (art. 7(2)) |
| Catégories de frais | 3 (garde, études postsecondaires, particuliers) | **6** (art. 7(1)a à f), dont primes d'assurance et soins de santé dépassant 100 $/an |
| Enfant majeur | art. 2 du règlement, discrétion | art. 3(2) : comme un mineur, ou discrétion |
| Test de rejet | — | art. 10(3) : la demande de difficultés excessives **doit être rejetée** si le ménage du demandeur aurait un niveau de vie plus élevé |

**Règle de conception qui découle du tableau** : le fédéral n'a pas de plafond de
capacité de payer. Transposer le plafond de 50 % dans un calcul fédéral produirait un
montant **inférieur au montant légal**. C'est l'erreur la plus coûteuse possible pour
le parent créancier.

---

## 6. Domaines C et D — Patrimoine familial, procédure et formulaires

Ces domaines sont documentés en détail dans
`RECHERCHE_patrimoine_familial_QC_2026-08-19.md` et
`REGISTRE_SOURCES_famille_QC.md`. Résumé de l'état.

**Détenu** : C.c.Q. 414-426 ; C.c.Q. 521.29-521.36 (union parentale) ; C-25.01, r. 0.2.4
art. 26 à 29 (formulaires obligatoires, délais de 180 et 30 jours, renvoi au formulaire
du juge en chef, renonciation éclairée de l'art. 28).

**Formule de l'art. 418, vérifiée deux fois** : déduction de la valeur nette au mariage,
puis de la plus-value **dans la proportion** qui existait au mariage entre valeur nette
et valeur brute. Reproduite du texte, croisée contre l'exemple chiffré d'Éducaloi,
rejouée en code : concordance au dollar.

**Manquant** : le formulaire officiel `cs-patrimoine-familial.xls` de la Cour supérieure.

**Union parentale** : en vigueur le **30 juin 2025**, de plein droit pour les conjoints
de fait devenant parents d'un même enfant après le 29 juin 2025 ; adhésion possible pour
les couples déjà parents à cette date. `A_CONFIRMER` : le texte exact des dispositions
transitoires de 2024, c. 22 n'a pas été lu article par article.

---

## 7. Contrôle de complétude

Une règle métier ne passe que si **toutes** ses sources sont détenues et vérifiées.

### 7.1 Patrimoine familial

| Règle métier | Sources requises | État |
|---|---|---|
| Déterminer le régime (mariage / union civile / union parentale) | C.c.Q. 414, 521.20, 521.29 | ✅ |
| Composer le patrimoine | C.c.Q. 415 ; 521.30 | ✅ |
| Appliquer les exclusions, dont le cas du décès | C.c.Q. 415 al. 3 et 4 | ✅ |
| Fixer la date d'évaluation | C.c.Q. 417 | ✅ |
| Déduire, plus-value comprise | C.c.Q. 418 ; 521.36 | ✅ |
| Partager, et signaler l'art. 422 | C.c.Q. 416, 422 | ✅ |
| Plafond des régimes de retraite | C.c.Q. 426 al. 2 | ✅ |
| Produire le formulaire assermenté | `cs-patrimoine-familial.xls` | ❌ |

**Verdict : PASSE SOUS RÉSERVE.** Un outil de calcul et d'affichage est permis. La
production du formulaire officiel est **interdite** tant que le fichier n'est pas
détenu ; l'outil doit dire qu'il ne le remplace pas.

### 7.2 Pension alimentaire québécoise

| Règle métier | Sources requises | État |
|---|---|---|
| Déterminer le régime applicable | Loi sur le divorce 2(1) ; DORS/97-237 | ✅ |
| Qualifier la garde | r. 0.4, art. 4 à 7 | ✅ |
| Établir les revenus | r. 0.4, art. 9, 2° | ✅ |
| Calculer le revenu disponible | r. 0.4, art. 9, 3° et la table (ligne 301 = 13 865 $) | ✅ |
| Calculer la contribution de base | r. 12, annexe I (ligne 401) | ✅ |
| Répartir les frais | r. 0.4, art. 9, 1° ; formulaire lignes 403-407 | ✅ |
| Appliquer le plafond de capacité | r. 0.4, art. 8 ; partie 6 | ✅ |
| Traiter plus de six enfants | r. 12, art. 1 al. 2 et la table | ✅ |

**Verdict : PASSE SOUS RÉSERVE**, révisé le 2026-08-19. Les huit règles sont sourcées.
Réserves : l'absence de règle d'arrondi explicite (§8), et l'interdiction de trancher
les cas discrétionnaires, qui restent au tribunal (art. 587.2 C.c.Q., art. 10 du
règlement).

### 7.3 Régime fédéral

| Règle métier | Sources requises | État |
|---|---|---|
| Aiguiller vers le bon régime | Loi sur le divorce 2(1), 2(5) ; DORS/97-237 | ✅ |
| Choisir la table provinciale | DORS/97-175, art. 3(3) | ✅ |
| Lire le montant de base | DORS/97-175, annexe I | ✅ |
| Revenu supérieur à 150 000 $ | art. 4 | ✅ |
| Dépenses spéciales ou extraordinaires | art. 7 | ✅ |
| Garde exclusive croisée | art. 8 | ✅ |
| Temps parental partagé | art. 9 | ✅ |
| Difficultés excessives | art. 10 **et annexe II** | ❌ |
| Déterminer le revenu | art. 15 à 20 **et annexe III** | ❌ |

**Verdict : PASSE SOUS RÉSERVE.** Le calcul de base est intégralement sourcé. Les
articles 15 à 20 et les annexes II et III sont accessibles et n'ont pas encore été
relevés : c'est une lacune de travail, pas un blocage.

---

## 8. Incertitudes et contradictions

`A_CONFIRMER` **Les quatre zones du calcul de patrimoine** : valeur nette négative au
mariage, moins-value, valeur partageable négative, partage inégal de l'art. 422. Aucune
n'a de réponse dans le texte. Impact si le code tranche quand même : un montant faux,
juré sous serment. Source idéale : jurisprudence de la Cour d'appel, non dépouillée.

`A_CONFIRMER` **Dispositions transitoires de l'union parentale** (2024, c. 22). Impact :
un couple parent avant le 30 juin 2025 pourrait être traité à tort comme assujetti.

`A_CONFIRMER` **Arrondis.** Ni le règlement québécois ni le règlement fédéral ne
prescrivent de règle d'arrondi explicite dans le texte lu. Le formulaire québécois
raisonne en montants annuels puis divise selon la périodicité ; la table fédérale donne
un paiement mensuel. Impact : quelques dollars par mois, donc quelques centaines par
année.

**Contradiction apparente, résolue** : le règlement r. 0.4 renvoie à une annexe II qui
est vide, « remplacée implicitement » par le règlement r. 12. Ce n'est pas une
contradiction mais un renvoi, et il crée la dépendance bloquante du §7.2.

---

## 9. Ce que seul un humain peut débloquer

Trois fichiers, publics et gratuits, sur des sites qui refusent les outils automatisés.

1. ~~**C-25.01, r. 12, annexe I.**~~ **Fournie et vérifiée le 2026-08-19.**
2. **`cs-patrimoine-familial.xls`**, Cour supérieure du Québec, section Formulaires.
3. **Les instructions officielles** accompagnant ce fichier, si elles existent.

**Mise à jour du 2026-08-19** : les pièces 1 (r. 0.4) et 2 (r. 12 et sa table) ont été
fournies par le CEO et vérifiées. Il ne reste que le formulaire de la Cour supérieure et
ses instructions. Le contrôle du §7 a été rejoué en conséquence.

---

## 10. Sources

**Québec**
- [Code civil du Québec](https://www.legisquebec.gouv.qc.ca/fr/document/lc/ccq-1991) — art. 414-426, 521.20-521.36, 585-596
- [C-25.01, r. 0.2.4](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%200.2.4) — art. 26-29
- [C-25.01, r. 0.4](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%200.4) — PDF conservé, à jour au 1er avril 2026
- [C-25.01, r. 12](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%2012) — art. 1-2 et annexe I, PDF conservé, table extraite et validée

**Fédéral**
- [Loi sur le divorce](https://laws-lois.justice.gc.ca/fra/lois/d-3.4/) — art. 2(1), 2(5)
- [DORS/97-237](https://lois-laws.justice.gc.ca/fra/reglements/DORS-97-237/page-1.html) — désignation du Québec
- [DORS/97-175](https://laws-lois.justice.gc.ca/fra/reglements/DORS-97-175/page-1.html) — art. 1-10, à jour 2026-06-17
- [DORS/97-175, table du Québec](https://laws-lois.justice.gc.ca/fra/reglements/DORS-97-175/page-6.html) — annexe I

**Secondaires, pour corroboration seulement**
- [Éducaloi](https://educaloi.qc.ca/capsules/exemples-de-calculs-et-de-partage-du-patrimoine-familial/) — vérification de la formule de l'art. 418
- [Chambre des notaires du Québec](https://www.cnq.org/la-chambre-et-votre-protection/actualites-et-salle-de-presse/adoption-du-projet-de-loi-n-56-le-nouveau-regime-dunion-parentale-verra-le-jour-le-30-juin-2025/) — entrée en vigueur de l'union parentale
