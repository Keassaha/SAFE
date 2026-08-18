# SAFE — Spec dépenses et préparation fiscale

Date : 2026-08-17
Statut : **VALIDÉE (CEO, 2026-08-17)**. Les quatre arbitrages du §6 sont tranchés.
**Lot 0 livré** : [RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md](../research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md).
Trois corrections en découlent, portées au §2.2 et au §5.
Portée : `CabinetExpense`, `ExpenseCategory`, l'export comptable et le rapport de fin d'année.
Documents liés : [SAFE_ACCOUNTING_DOCTRINE.md](SAFE_ACCOUNTING_DOCTRINE.md), [EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md](EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md), [TAX_AND_PROVINCE_MODEL.md](TAX_AND_PROVINCE_MODEL.md), [DOCTRINE_ANNULATION_CORRECTION.md](DOCTRINE_ANNULATION_CORRECTION.md).

---

## 0. Ce que le code dit aujourd'hui

Constats vérifiés dans le code avant toute proposition. Chacun est sourcé.

### 0.1 Le « Rapport annuel d'impôts » ne contient aucune dépense

`components/rapports/RapportAnnuelImpotsSection.tsx` affiche quatre lignes : revenus
facturés, TPS collectée, TVQ collectée, paiements reçus. Toutes du côté revenus.

Un onglet nommé « Rapport annuel d'impôts » qui ne porte aucune déduction est pire qu'un
onglet absent : il donne au cabinet le sentiment d'être prêt. C'est le défaut le plus
grave de ce chantier, et c'est un défaut de promesse avant d'être un défaut technique.

### 0.2 La taxe payée n'est jamais captée sur le chemin principal

Le modèle `CabinetExpense` porte `montantHt`, `tps`, `tvq`, `montantTtc`. Trois chemins
créent des dépenses, un seul les remplit :

| Chemin | Volume réel | Taxes captées | Pièce jointe |
|---|---|---|---|
| Import de reçu (IA) | faible | **oui** | **oui** |
| Import bancaire | **le gros du volume** | non | non |
| Édition manuelle | ponctuel | non | non |

`validateImportedTransaction` (`app/(app)/journal/depenses/actions.ts`) écrit
`montant: tx.rawAmount, montantTtc: tx.rawAmount` et s'arrête là. `editCabinetExpense`
n'expose même pas les champs de taxe dans son type d'entrée : le cabinet ne peut pas
corriger à la main ce que l'import n'a pas rempli.

### 0.3 Aucune notion de taxe récupérable

`RapportTaxesSummary` (`lib/rapports/types.ts`) contient exactement trois champs :
`tpsCollectee`, `tvqCollectee`, `total`. Rien sur la taxe payée, donc rien sur le net à
remettre. Un cabinet qui remet la taxe collectée sans déduire la taxe payée sur ses
achats remet trop, tous les trimestres, sans jamais le voir.

### 0.4 L'export comptable envoie le TTC en dépense

`deriveDoubleEntry` (`lib/accounting/export/account-mapping.ts`) mappe une DEPENSE en
`Dr Dépenses (5000) / Cr Banque (1000)` pour le montant complet.

L'asymétrie saute aux yeux quand on la met à côté de la facture, traitée deux blocs plus
haut dans le même fichier :

```
Facture :  Dr Comptes à recevoir | Cr Honoraires + Cr Taxes à remettre   (3 lignes, taxe séparée)
Dépense :  Dr Dépenses           | Cr Banque                              (2 lignes, taxe noyée)
```

Le plan comptable n'a pas de compte de taxe récupérable. Conséquence : les dépenses
partent surévaluées chez le comptable, et la taxe récupérable est invisible.

### 0.5 Les catégories sont perdues à l'export

Le cabinet classe ses dépenses dans 24 catégories. `deriveDoubleEntry` les envoie toutes
sur le compte unique `5000 Dépenses du cabinet`. Le `memo` transporte la description et
le dossier, jamais la catégorie.

Le travail de classement est fait, puis jeté au moment précis où il servirait.

### 0.6 Les deux catégories à règle spéciale sont absentes de la liste

`DEFAULT_EXPENSE_CATEGORIES` (`lib/expense-journal/constants.ts`) compte 24 entrées. Ni
**repas / représentation**, ni **véhicule**. Ce sont les deux dépenses les plus fréquentes
d'un cabinet solo, et les deux seules qui ne se déduisent pas à 100 %.

Absentes de la liste, elles atterrissent dans « Autres » et se déduisent en plein.

### 0.7 `ExpenseCategory` ne porte aucune information fiscale

Le modèle a `name`, `code`, `isSystem`, `isActive`, `sortOrder`. Une catégorie est une
étiquette de rangement, pas un porteur de règle. Rien n'accroche une catégorie à un taux
de déductibilité ni à une ligne de déclaration.

### 0.8 Ce qui va déjà bien

- Les numéros de TPS/TVQ du cabinet sont stockés (`lib/cabinet-config.ts`), et le moteur
  de conformité les vérifie. Sans eux, aucune taxe récupérable n'est réclamable.
- `splitInclusiveTaxes` est spécifié dans `TAX_AND_PROVINCE_MODEL.md` §7 pour recalculer
  le HT depuis un TTC. Exactement l'outil qu'il manque au chemin d'import bancaire.
- L'extraction de reçu par IA lit déjà `montantHt`, `tps`, `tvq` et conserve la pièce.
  La capacité existe, elle est simplement branchée sur le chemin le moins utilisé.
- Le journal, les corrections et l'export double-entrée sont solides. On construit dessus.

---

## 1. La frontière, inchangée

La doctrine comptable §1 dit déjà la bonne chose : **SAFE prépare et exporte, le comptable
produit le document final.** Cette spec ne la déplace pas d'un centimètre.

SAFE ne produit pas une déclaration de revenus. SAFE ne calcule pas un impôt à payer.
SAFE ne remplace pas le comptable.

**SAFE produit le dossier qui rend la déclaration facile.** La différence est nette : on
livre des chiffres classés, justifiés et exportables, pas un formulaire rempli.

Le test de réussite est concret : *le cabinet exporte un dossier, l'envoie à son comptable,
et le comptable ne revient pas avec des questions.*

---

## 2. Trois notions à ajouter, pas une de plus

### 2.1 La taxe payée

Chaque dépense sépare le montant hors taxes de la taxe payée. Deux chemins seulement :

1. **Le reçu le dit** : l'extraction ou la saisie donne le HT et la taxe. C'est la vérité,
   on la garde telle quelle.
2. **Le reçu ne dit rien** : on décompose le TTC avec `splitInclusiveTaxes`, selon le
   régime du cabinet. La ligne est marquée **estimée**, jamais présentée comme certaine.

Une dépense dont la taxe est estimée reste utilisable. Une dépense dont la taxe est
inventée sans le dire est un piège. La distinction est portée en base, pas seulement à
l'écran.

**Cas à ne pas rater** : un fournisseur non inscrit ne facture aucune taxe, et beaucoup de
dépenses n'en portent pas (salaires, assurances, frais bancaires, la plupart des frais de
tribunal). Décomposer un TTC sur ces catégories fabriquerait une taxe qui n'existe pas.
La décomposition doit donc être **activée par catégorie**, pas appliquée en aveugle.

### 2.2 La déductibilité

Un pourcentage porté par la **catégorie**, pas saisi dépense par dépense. Trois valeurs
seulement dans la vie d'un cabinet : 100 %, 50 %, et un prorata d'usage.

Porter la règle sur la catégorie plutôt que sur la dépense a une conséquence voulue :
le cabinet n'a **jamais** à se souvenir d'un pourcentage. Il classe correctement, le
reste suit. C'est aussi ce qui rend la règle modifiable en un endroit le jour où elle
change.

> ✅ **Lot 0 livré le 2026-08-17.** Les règles sont sourcées sur l'ARC, Revenu Québec et le
> ministère des Finances du Québec :
> [RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md](../research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md).
> La garde valait le coût : les seuils de pièce justificative sont **100 $ et 500 $**, et
> non les 30 $ / 150 $ que la mémoire et la moitié du web citent encore.

**Trois corrections que la recherche impose à cette spec :**

**a) Deux taux, pas un.** La limite de 50 % sur les repas s'applique à la déduction au
revenu **et** au crédit de taxe. `ExpenseCategory` porte donc deux taux distincts, même
s'ils coïncident aujourd'hui : les confondre casse à la première règle où ils divergent.

**b) Un plafond n'est pas un taux.** Au Québec, la déduction des frais de représentation
est le moindre de 50 % et d'un **plafond fondé sur le chiffre d'affaires annuel**. Ce
plafond ne se connaît qu'en fin d'exercice et s'applique au cumul, pas à la ligne. Le taux
vit sur la catégorie, le plafond vit dans le dossier de fin d'année. Deux mécanismes.
Conséquence à assumer : **aucun écran n'affiche de « montant déductible » par dépense**,
puisque ce montant n'existe pas avant la clôture.

**c) Estimée ne veut pas dire réclamable.** Le montant de taxe est exigé sur la pièce dès
le premier dollar pour la TVQ. Une taxe obtenue en décomposant un TTC sert à la justesse
des états et à l'estimation, jamais à la déclaration. Les deux états sont distincts en
base.

### 2.3 La pièce justificative

Chaque dépense porte un état de pièce, en trois valeurs : **présente**, **manquante**,
**non requise**.

L'état alimente une seule chose, qui est le vrai livrable : **la liste des dépenses sans
pièce**. C'est la seule page de ce chantier sur laquelle le cabinet agit. Tout le reste
se lit ; celle-là se vide.

Le seuil sous lequel une pièce n'est pas requise est une **question ouverte** (voir §6).

---

## 3. Ce que le dossier de fin d'année contient

Un seul écran, un seul export. Il remplace le « Rapport annuel d'impôts » actuel.

| Bloc | Contenu | Existe ? |
|---|---|---|
| Revenus | Facturé HT, encaissé, écart | ✅ déjà calculé |
| Dépenses par catégorie | Montant HT, taxe payée, déductible | ❌ à construire |
| Taxes collectées | TPS / TVQ ou TVH sur factures émises | ✅ déjà calculé |
| Taxes payées récupérables | Sur dépenses admissibles | ❌ à construire |
| **Net à remettre** | Collectée moins payée | ❌ à construire |
| Débours refacturés | Déjà séparés du revenu | ✅ déjà calculé |
| **Dépenses sans pièce** | La liste à vider | ❌ à construire |
| Zones d'incertitude | Taxes estimées, catégorie « Autres », période non verrouillée | ❌ à construire |

Le dernier bloc n'est pas décoratif. Un dossier qui affiche ses propres zones d'ombre est
un dossier qu'un comptable peut utiliser. Un dossier qui prétend être complet oblige le
comptable à tout revérifier, et le cabinet paie ces heures.

---

## 4. Les changements de code

| Objet | État | Cible |
|---|---|---|
| `ExpenseCategory` | étiquette seule | + déductibilité, + taxe applicable, + compte d'export |
| `CabinetExpense` | taxes rarement remplies | taxes systématiques, + origine (déclarée / estimée) |
| `DEFAULT_EXPENSE_CATEGORIES` | 24, sans repas ni véhicule | + les deux manquantes, + leur règle |
| `validateImportedTransaction` | TTC brut | décomposition selon la catégorie |
| `editCabinetExpense` | pas de champs de taxe | taxes corrigeables, via la boucle de correction déjà livrée |
| `deriveDoubleEntry` (DEPENSE) | 2 lignes, taxe noyée | 3 lignes, taxe récupérable séparée |
| `AccountChart` | pas de compte de taxe payée | + `tax_receivable` |
| Export | un seul compte 5000 | un compte par catégorie |
| `RapportTaxesSummary` | collectée seule | + payée, + net à remettre |
| Rapport annuel | 4 lignes de revenus | le dossier complet du §3 |

Toute correction d'une dépense déjà journalisée passe par la contrepassation motivée
livrée le 2026-08-17. Aucune mutation rétroactive, aucune exception.

---

## 5. Découpage proposé

**Lot 0 — Sourcer les règles.** ✅ **Livré le 2026-08-17.**

**Lot 0 bis — Les catégories sans taxe.** Établir quelles catégories ne portent
structurellement aucune taxe (salaires, assurances, la plupart des frais bancaires,
certains frais de tribunal). C'est le seul `A_CONFIRMER` bloquant : sans cette liste, la
décomposition du TTC fabriquerait de la taxe là où il n'y en a pas, et les remises
seraient fausses dans le mauvais sens. Petit lot, préalable dur au lot 1.

**Lot 1 — La taxe payée.** Décomposition par catégorie sur les trois chemins de création,
avec marquage déclarée / estimée. C'est le lot qui débloque tous les autres.

**Lot 2 — La déductibilité.** Portée par la catégorie, avec les deux catégories manquantes.

**Lot 3 — L'export réparé.** Taxe récupérable séparée, un compte par catégorie. C'est le
lot qui fait gagner des heures au comptable, donc de l'argent au cabinet.

**Lot 4 — Le dossier de fin d'année.** L'écran et l'export du §3, dont la liste des pièces
manquantes.

L'ordre n'est pas négociable entre 0 et 1. Il l'est entre 3 et 4.

---

## 6. Arbitrages CEO — tranchés le 2026-08-17

**1. Le véhicule est dans le périmètre, au prorata d'usage.**
Pas de pourcentage fixe : la déduction suit la part d'usage d'affaires. Pour la v1, le
prorata est une valeur saisie et datée, portée par le cabinet, appliquée aux dépenses de
la catégorie véhicule. **Le registre de kilométrage est prévu, mais pas maintenant** : il
est inscrit à la feuille de route, pas au lot 1. Conséquence à assumer et à écrire à
l'écran : un prorata saisi sans registre se défend moins bien qu'un prorata calculé. Le
dossier de fin d'année doit donc le classer en zone d'incertitude tant que le registre
n'existe pas.

**2. La pièce justificative est exigée sur toute dépense. Pas de seuil.**
Décision assumée après mise en garde : une exigence sans seuil produit une liste longue
au démarrage. C'est le prix d'un dossier qui ne se discute pas. Aucun montant plancher
n'est codé ; l'état « non requise » reste réservé aux cas où il n'existe structurellement
aucune pièce à joindre, jamais à un arbitrage de montant.

**3. Québec et Ontario, dès le lot 0.**
Les deux régimes sont sourcés ensemble. La récupération diffère entre TVQ et TVH, la
séparation doit exister dès le modèle et non après coup.

**4. On reprend l'historique.**
Les dépenses déjà saisies doivent porter leur taxe, faute de quoi les remises de taxes
restent fausses. Une reprise en masse recalcule la taxe des dépenses existantes selon
leur catégorie et le régime du cabinet. Toute ligne ainsi obtenue est marquée **estimée**,
jamais déclarée : la reprise répare le chiffre sans jamais prétendre l'avoir lu sur un
reçu. C'est la condition pour que le premier dossier de fin d'année ait une valeur.

---

## 7. Feuille de route au-delà de la v1

- **Registre de kilométrage** (décision CEO : « éventuellement penser à un registre »).
  Transforme le prorata saisi en prorata calculé et défendable. Rend la catégorie véhicule
  opposable, ce qu'un prorata déclaré n'est pas.
- **Sortie de la catégorie « Autres »** : tant qu'elle contient du volume, le dossier de
  fin d'année reste approximatif. Une règle d'apprentissage existe déjà
  (`ExpenseCategorizationRule`), elle peut viser ce résidu.
