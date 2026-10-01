# Rémunération d'Aaliyah : trois sources, une seule paie

> **Statut : CONSTRUIT EN LOCAL le 2026-10-01 (cabinet d'essai), non déployé, non committé.**
> Les questions du §7 restent ouvertes : les montants de l'essai sont des exemples.
> Rédigé le 2026-10-01. Prolonge `SPEC_aaliyah_home_navette.md` §7bis (« Mon temps & ma paye »).

---

## 1. Ce que vous avez demandé

Un espace dans le SAFE du cabinet Derisier, propre à Aaliyah, qui suit sa rémunération
d'employée. Elle est payée de trois façons :

1. un **salaire fixe**, versé à la fin du mois ;
2. une **compensation par dossier**, dont Me Derisier fixe le montant à l'avance.
   Aujourd'hui, à chaque paie, Aaliyah envoie une facture qui liste ces dossiers ;
3. une **rémunération à l'heure sur les dossiers d'aide juridique** : elle monte le
   dossier complet, puis facture l'aide juridique à l'heure.

Les notes mentionnent aussi « 15-20 par semaine », sans unité (voir §7, question 1).

---

## 2. Ce que j'ai trouvé dans le code

| Ce qui existe déjà | Où | Ce que ça fait pour Aaliyah |
|---|---|---|
| Fiche employée | `Employee` (schema) | Un seul taux : `hourlyRate`. Pas de salaire fixe, pas de compensation. |
| « Mon temps & ma paye » | `app/(app)/mes-heures/` + `lib/payroll/employee-hours-service.ts` | Aaliyah soumet des heures, Me Derisier approuve ou rejette, les heures approuvées deviennent une paie. Circuit complet et testé. |
| Paie | `PayrollPeriod`, `Payslip`, `PayslipAdjustment` | Une seule fréquence possible : **hebdomadaire**. Pas de mensuel. Le brut = heures × taux. |
| Sujets de dossier Derisier | `lib/dossiers/taxonomy.ts` | Neuf sujets, dont **LAO = Aide juridique Ontario**. Chaque dossier sait déjà s'il est d'aide juridique. |
| Pièces exigées par l'aide juridique | `ExpectedDocument.requisPourAideJuridique` | Déjà en place : une pièce manquante fait refuser la facture. |

Trois constats :

- **Le cabinet Derisier est en Ontario.** L'« aide juridique » des notes, c'est **Aide
  juridique Ontario (LAO)**. Le sujet existe déjà dans SAFE, on n'a rien à inventer pour
  reconnaître un dossier d'aide juridique.
- **Le circuit « soumettre, approuver, payer » existe déjà pour les heures.** Il suffit de
  le réutiliser pour les dossiers. Aaliyah ne découvre pas un nouveau geste.
- **Il manque deux choses à la paie** : la fréquence mensuelle, et la possibilité d'avoir
  plusieurs lignes de nature différente sur un même bulletin.

### Un point à régler avant de construire : la « facture » d'une employée

Aaliyah est **employée**. Au Canada, tout ce qu'un employeur verse à son employée
(salaire, commission par dossier, heures) est un revenu d'emploi. Il passe par la paie,
avec les retenues à la source.

Si Aaliyah émet une **facture** pour une partie de sa rémunération, cette partie ressemble
au revenu d'une travailleuse autonome. Une même personne, deux statuts, chez le même
employeur : c'est le genre de chose que l'ARC requalifie.

**Proposition :** on garde son geste (elle déclare ses dossiers à l'avance, à chaque paie),
mais on ne l'appelle plus « facture ». Ça devient un **relevé de dossiers**, qui entre
dans son bulletin de paie comme une ligne de commission.

> Ce n'est pas un avis fiscal. À faire confirmer par le comptable du cabinet (§7, question 6).

---

## 3. Le système proposé

### Principe

Une seule paie par mois. Trois lignes sur le bulletin, chacune avec sa source :

```
Bulletin de paie : septembre 2026
───────────────────────────────────────────────
Salaire fixe                          montant fixe
Compensations dossiers   N dossiers × montant de la grille
Aide juridique            N heures × taux horaire
───────────────────────────────────────────────
Brut                                  la somme
```

Rien n'est saisi deux fois. Chaque ligne vient d'un endroit précis.

### Source 1 : le salaire fixe

- Me Derisier inscrit le montant mensuel **une fois**, dans l'entente de rémunération
  d'Aaliyah.
- Il apparaît tout seul sur chaque paie. Aaliyah ne déclare rien.
- Si le montant change, Me Derisier crée une nouvelle version de l'entente avec une date
  d'effet. Les paies passées gardent l'ancien montant.

### Source 2 : la compensation par dossier

**La grille.** Me Derisier fixe les montants à l'avance, par sujet de dossier. La
taxonomie Derisier en compte déjà neuf, on s'en sert :

| Sujet | Montant par dossier |
|---|---|
| Immobilier (RE) | fixé par Me Derisier |
| Immigration (IMM) | fixé par Me Derisier |
| Famille (FA) | fixé par Me Derisier |
| … | … |
| Aide juridique (LAO) | **pas de montant** : payé à l'heure (source 3) |

Sur un dossier particulier, Me Derisier peut remplacer le montant de la grille (dossier
plus lourd que la moyenne, par exemple). C'est l'exception, pas la règle.

**Le relevé.** À chaque paie, Aaliyah ouvre son espace et coche les dossiers qu'elle a
terminés. SAFE inscrit le montant à côté de chacun. Elle ne tape aucun chiffre. Elle
envoie le relevé.

**L'approbation.** Me Derisier voit le relevé, approuve ou retire une ligne avec un
motif. Le montant est **figé au moment de l'approbation** : si la grille change le mois
suivant, ce relevé ne bouge pas.

### Source 3 : les heures d'aide juridique

- Aaliyah inscrit ses heures **sur un dossier LAO** (le choix du dossier est obligatoire,
  et seuls les dossiers LAO sont proposés).
- Me Derisier approuve, comme aujourd'hui dans « Mon temps & ma paye ».
- Les heures approuvées × le taux horaire de l'entente = la troisième ligne.

**Bénéfice en plus, si Me Derisier le veut :** ces mêmes heures peuvent alimenter le
compte à envoyer à l'aide juridique pour ce dossier. Aaliyah saisit une fois, ça sert
deux fois (sa paie et la facturation LAO). À confirmer, voir §7, question 4.

### Les règles qui empêchent les erreurs

1. **Un dossier, une seule voie.** Un dossier LAO se paie à l'heure, jamais par la grille.
   Un dossier hors LAO se paie par la grille, jamais à l'heure.
2. **Un dossier n'est compensé qu'une fois.** Une fois approuvé sur un relevé, il
   disparaît de la liste des dossiers à déclarer.
3. **Rien ne se supprime après approbation.** Une erreur se corrige par une ligne de
   correction avec motif, comme dans la comptabilité (doctrine d'annulation).
4. **Aaliyah ne voit que sa propre paie.** Me Derisier voit tout. Personne d'autre.

---

## 4. Le cycle d'un mois

| Quand | Qui | Quoi |
|---|---|---|
| Pendant le mois | Aaliyah | Inscrit ses heures LAO au fil de l'eau (ou en fin de semaine). |
| Environ 5 jours avant la paie | Aaliyah | Coche ses dossiers terminés, envoie le relevé. |
| Avant la paie | Me Derisier | Approuve heures et relevé. Un écran, un clic par ligne. |
| Fin du mois | Me Derisier | Ouvre la paie du mois : les trois lignes sont déjà remplies. Elle valide. |
| Après | Aaliyah | Voit son bulletin, ligne par ligne, et l'historique des mois passés. |

### Exemple chiffré

> Chiffres **inventés pour l'exemple**, pas ceux du cabinet.

| Ligne | Calcul | Montant |
|---|---|---|
| Salaire fixe | | 2 000,00 $ |
| Compensations dossiers | 3 × 150 $ (Immigration) + 2 × 100 $ (Famille) | 650,00 $ |
| Aide juridique | 14 h × 25 $ | 350,00 $ |
| **Brut** | | **3 000,00 $** |

---

## 5. Ce que chacune voit

### Aaliyah : « Ma paie » (son espace, menu existant « Mon temps & ma paye »)

- En haut : **ce que je vais toucher ce mois-ci**, déjà approuvé, et ce qui attend
  encore l'approbation.
- Bloc 1 : mes dossiers à déclarer (liste à cocher, montant affiché) et mon relevé envoyé.
- Bloc 2 : mes heures d'aide juridique, dossier par dossier.
- Bloc 3 : mes bulletins passés.

### Me Derisier : fiche d'Aaliyah, onglet « Paie » (écran existant)

- L'entente : salaire, grille par sujet, taux horaire LAO. Modifiable par elle seule.
- « À approuver » : relevé + heures, un clic par ligne.
- La paie du mois, pré-remplie.

> Ces deux écrans passent par le cycle habituel : maquette en image, oui explicite,
> puis code. Rien n'est dessiné dans ce document.

---

## 6. Ce que ça change dans le code

Tout est **additif** : aucune table existante ne perd une colonne, rien ne casse le
circuit d'heures actuel.

| Changement | Pourquoi |
|---|---|
| `PayrollFrequency` : ajout de `monthly` | La paie d'Aaliyah est mensuelle. |
| Nouvelle table `EmployeeCompensationPlan` (salaire mensuel, taux horaire LAO, date d'effet) | L'entente, versionnée. |
| Nouvelle table `CompensationGridRate` (sujet → montant, + remplacement par dossier) | La grille fixée d'avance. |
| Nouvelle table `EmployeeCompensationClaim` (une ligne par dossier déclaré, même cycle de statuts que les heures) | Le relevé de dossiers. |
| Nouvelle table `PayslipLine` (nature, quantité, taux, montant, source) | Un bulletin à trois lignes. Le brut devient leur somme. |
| `EmployeeHoursEntry` : dossier LAO obligatoire quand l'entente prévoit des heures LAO | Règle « un dossier, une seule voie ». |

Le calcul (salaire + grille + heures) vit dans une fonction pure, testée sans base de
données, dans `lib/payroll/`, à côté du service d'heures existant.

### Découpage en lots

| Lot | Contenu | Terminé quand |
|---|---|---|
| L1 | Entente + grille, côté Me Derisier | Elle saisit salaire, grille et taux une fois. |
| L2 | Relevé de dossiers, côté Aaliyah + approbation | Aaliyah n'envoie plus de facture. |
| L3 | Heures LAO liées aux dossiers | Ses heures LAO sont approuvées dans SAFE. |
| L4 | Paie mensuelle à trois lignes | Me Derisier valide une paie déjà remplie. |

### Où ça vit

- **Construction et essais** : cabinet test local (`safe_local`), avec une employée et des
  dossiers de test.
- **Déploiement** : directement dans l'espace de travail du cabinet Derisier en production.
  La grille et les montants réels sont saisis **par Me Derisier**, dans l'écran L1, jamais
  par un script avec des chiffres inventés.

---

## 7. Questions pour Me Derisier (à poser avant le code)

1. **« 15-20 par semaine »** : 15 à 20 **heures** de travail par semaine, ou 15 à 20
   **dossiers** ? Ça change la taille de la liste à cocher, pas le système.
2. **La grille** : le montant par dossier dépend-il du **type** de dossier (immigration,
   famille…) ou est-il fixé **dossier par dossier** à l'ouverture ?
3. **« Terminé »** : à quel moment un dossier ouvre-t-il droit à la compensation ? Dossier
   monté ? Déposé ? Fermé ? Payé par le client ?
4. **Aide juridique** : Aaliyah est-elle payée pour **ses heures** sur le dossier LAO, ou
   touche-t-elle une **part de ce que LAO paie** au cabinet ? Et est-elle payée même si
   LAO refuse ou tarde à payer ?
5. **Taux** : un seul taux horaire LAO pour Aaliyah, ou un taux selon le type de certificat ?
6. **La facture** : son comptable est-il d'accord pour passer les compensations par la
   paie (relevé) plutôt que par une facture d'Aaliyah ?
7. **Date de paie** : le dernier jour ouvrable du mois, ou une date fixe ?

---

## 8. Ce que je n'ai pas pu vérifier

- Les **retenues à la source** : SAFE calcule le brut. Je n'ai pas vérifié comment les
  retenues sont produites aujourd'hui pour la paie du cabinet (service de paie externe ou
  saisie manuelle). Le système proposé s'arrête au brut tant que ce n'est pas vérifié.
- Les **règles LAO** sur le temps d'une adjointe : je n'ai pas vérifié si LAO accepte que
  les heures d'une adjointe figurent sur le compte d'un certificat. Le « bénéfice en plus »
  du §3 dépend de cette réponse.
- La **requalification** employée / autonome : c'est un risque connu, pas une analyse
  fiscale du cas d'Aaliyah.
- **Jour 0** : `REGLE_DE_BUILD.md` §5 bloque tout chantier d'ancrage tant qu'aucun cabinet
  n'a franchi le jour 0. Je ne sais pas si le cabinet Derisier l'a franchi depuis la
  rédaction de cette règle. Le chantier passe le test du §4 (il supprime une saisie réelle :
  la facture d'Aaliyah à chaque paie), mais la décision d'ouvrir revient au CEO.

---

## 9. Ce qui a été construit (2026-10-01, local seulement)

**Décision CEO du jour :** Me Derisier n'ouvre pas SAFE. Aaliyah passe par le compte de
Me Derisier pour atteindre son espace. Déclaration dans l'espace d'Aaliyah, approbation dans
l'espace de Me Derisier. L'approbation par courriel (proposée plus haut) est écartée pour
l'instant.

| Pièce | Où |
|---|---|
| Migration additive (3 tables, `PayrollFrequency.monthly`, `PayslipLineKind`) | `prisma/migrations/20261001120000_remuneration_employee/` |
| Règles et calculs (fonctions pures testées) | `lib/payroll/remuneration-service.ts` + `__tests__/remuneration-service.test.ts` |
| Actions serveur (deux portes d'entrée, notées `via` au journal d'audit) | `app/(app)/mes-heures/remuneration-actions.ts` |
| Espace d'Aaliyah | `components/paie/EspacePaiePanel.tsx`, affiché dans `/mes-heures` (son compte) et `/employees/[id]/espace` (compte de l'avocate) |
| Approbation, paie du mois, entente | `components/paie/ValidationPaiePanel.tsx`, onglet Paie de la fiche employée |
| Cabinet d'essai local | `scripts/creer-cabinet-derisier-local.ts` (refuse une base non locale) |

Écarts avec le §6 : la grille vit en JSON dans l'entente (versionnée avec elle) au lieu
d'une table à part ; pas encore de remplacement de montant dossier par dossier.

**Limite connue :** quiconque ouvre le compte de Me Derisier peut déclarer ET approuver.
Le journal d'audit distingue la porte d'entrée, mais rien n'empêche l'auto-approbation.
C'est le prix de la simplicité choisie ; à revoir si Me Derisier ouvre un jour SAFE.

**Avant la production :** réponses aux questions du §7, saisie de la vraie entente par
l'écran, fiche employée d'Aaliyah reliée à son compte, `migrate deploy` après vérification
des empreintes (voir la note sur la dérive des migrations).
