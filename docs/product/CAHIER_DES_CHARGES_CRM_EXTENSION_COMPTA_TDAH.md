# Extension du cahier des charges — Comptabilité, facturation et couche cognitive

> **Statut** : DRAFT v1, à valider par le CEO avant tout build.
> **Date** : 2026-07-30
> **Document parent** : [CAHIER_DES_CHARGES_CRM_INTELLIGENT.md](CAHIER_DES_CHARGES_CRM_INTELLIGENT.md)
> **Portée** : sections 26 à 73. Comptabilité interne de SAFE Inc., facturation complète,
> et couche d'accessibilité cognitive.

---

## Avertissement sur la couche cognitive

La couche décrite aux sections 44 à 64 est une **couche d'accessibilité et de soutien aux
fonctions exécutives**. Elle n'est ni un dispositif médical, ni un diagnostic, ni un
traitement. Elle ne pose aucune hypothèse sur l'utilisateur et n'affiche jamais de contenu
de nature clinique. Elle est entièrement désactivable, et chacun de ses composants est
réglable séparément.

Le vocabulaire de l'interface reste professionnel et neutre. Nulle part le produit ne
nomme un trouble, ne parle de symptôme, ni ne se présente comme une aide thérapeutique.

---

## 0. La découverte qui change ce cahier des charges

**Vous avez déjà un moteur comptable et de facturation considérable.** Pas un début, un
moteur. Inventaire vérifié dans le code au 2026-07-30.

### 0.1 Ce qui existe déjà

| Domaine | Modèles Prisma existants | Services |
|---|---|---|
| **Facturation** | `Invoice`, `InvoiceLine`, `InvoiceItem`, `InvoiceReminder`, `InvoiceSendLog`, `BillingRun` | `invoice-service`, `invoice-pdf`, `invoice-presenter`, `reminder-service`, `interest-service` |
| **Paiements** | `Payment`, `PaymentAllocation`, `CreditNote`, `CreditNoteApplication`, `InterestCharge`, `PayerRule` | `payment-allocation-service`, `overpayment-service`, `credit-note-service`, `match-payment`, `payment-match-candidates` |
| **Temps** | `TimeEntry`, `WorkSession`, `EmployeeHoursEntry`, `DossierDocketEntry` | `unbilled-time` |
| **Dépenses** | `CabinetExpense`, `ExpenseCategory`, `ExpenseCategorizationRule`, `Expense`, `DeboursType`, `DeboursDossier`, `DeboursTemplate` | catégorisation automatique, extraction de reçu par vision |
| **Banque** | `BankImportSession`, `BankImportTransaction` | import, normalisation, suggestion de catégorie, anti-doublon par hash |
| **Journal** | `JournalGeneralEntry`, `AccountingPeriodLock` | `lib/services/journal/`, verrouillage de période, idempotence |
| **Export** | — | `lib/accounting/export/` : mappage double-entrée, plan comptable surchargeable, sérialisation QuickBooks / Xero / Sage |
| **Taxes** | champs TPS/TVQ sur factures et dépenses | `tax-remittance.ts`, page `/facturation/taxes` |
| **Forfaits** | `ForfaitService`, `DossierBillingStage`, `RegistreTache` | `forfait-billing-service`, `billing-stage-service` |
| **Fidéicommis** | `TrustAccount`, `TrustTransaction`, `TrustReconciliation`, `TrustComplianceReport` | `trust-service`, `trust-monitoring` |
| **Paie** | `Employee`, `PayrollPeriod`, `Payslip`, `PayslipAdjustment` | |
| **Rapports** | — | aging des créances, rentabilité par dossier, temps non facturé, remise de taxes |
| **Profil comptable** | — | `lib/accounting/profil-cabinet.ts`, profils A/B/C/D, activation conditionnelle |

Quinze pages de facturation existent déjà sous `app/(app)/facturation/`.

### 0.2 La décision déjà prise, et qu'il faut tenir

L'ADR-006 a tranché : **SAFE Inc. est un cabinet client de SAFE**. La stratégie dog food
signifie que la comptabilité interne de SAFE Inc. se fait dans SAFE, pas dans un module
comptable parallèle logé dans la console.

La console `/console` calcule d'ailleurs déjà la trésorerie du mois en lisant `Payment` et
`CabinetExpense` du cabinet nommé « SAFE ».

**Recommandation ferme : ne construisez pas un second moteur comptable dans le CRM.**

Trois raisons.

1. **Vous le maintiendriez deux fois.** Deux moteurs de taxes, deux moteurs de
   rapprochement, deux plans comptables. Chaque correction devrait être faite en double, et
   la seconde serait oubliée.
2. **Vous perdriez le dog food.** Le jour où votre propre comptabilité vous fait mal dans
   SAFE, vous corrigez un défaut que vos clients subissent aussi. C'est l'avantage
   stratégique le plus sous-estimé de votre position. Un module séparé le détruit.
3. **Vous vendriez ce que vous n'utilisez pas.** Difficile de dire à une avocate que la
   comptabilité de SAFE est solide si vous tenez la vôtre ailleurs.

**Ce que fait donc cette extension** : elle spécifie les **écarts réels** entre ce que le
produit sait faire pour un cabinet d'avocats et ce dont SAFE Inc. a besoin comme entreprise
de logiciel et de services. Ces écarts sont plus courts que la commande ne le suppose, et
la plupart profitent aussi aux cabinets clients.

### 0.3 Le conflit doctrinal à trancher

Point à décider avant tout build, parce qu'il conditionne une partie de la section 40.

La doctrine comptable v2 adoptée le 2026-06-15 dit : **journal mono-axe append-only, la
double-entrée n'existe qu'à l'export**. C'est un bon choix, il rend le système simple et
difficile à corrompre.

Or la commande demande un **bilan**, une **balance de vérification** et un **grand livre**.
Ces trois rapports exigent une comptabilité en partie double tenue en interne, avec un plan
de comptes appliqué à chaque écriture. Ils ne sont pas produisibles depuis un journal
mono-axe.

Trois options :

| Option | Ce que ça donne | Coût | Risque |
|---|---|---|---|
| **A. Garder mono-axe** | État des résultats de caisse, flux de trésorerie, rapports par client et par service. **Pas de bilan.** Le bilan est produit par votre comptable à partir de l'export | Nul | Aucun |
| **B. Ajouter la partie double en interne** | Tous les rapports demandés | Élevé. Refonte du journal, plan de comptes complet, contrepartie sur chaque écriture, gestion des écritures de régularisation | Élevé. C'est la partie de la comptabilité où les erreurs sont les plus coûteuses, et elle deviendrait aussi celle de vos clients |
| **C. Mono-axe + comptes de contrepartie déduits** | Balance de vérification et grand livre approximatifs, bilan toujours impossible sans les soldes d'ouverture | Moyen | Moyen. Un rapport « presque juste » est pire qu'un rapport absent |

**Recommandation : option A.** Vous êtes une entreprise à structure simple. Un bilan vous
est utile une fois par an, au moment de la déclaration, et votre comptable le produit à
partir de l'export existant. Construire une comptabilité en partie double pour éviter un
export annuel est un très mauvais échange.

Le reste de ce document suppose l'option A. Si vous choisissez B, la section 40 change et
la roadmap gagne au moins deux mois.

---

## 26. Comptabilité interne

### 26.1 Écarts réels entre le produit et le besoin de SAFE Inc.

| Besoin de la commande | État | Écart à combler |
|---|---|---|
| Revenus, dépenses | ✅ `Payment`, `CabinetExpense` | — |
| Comptes bancaires | 🟡 Import de relevés, mais pas d'entité `BankAccount` | Créer l'entité, avec solde et devise |
| Cartes de crédit | 🟡 Traité comme un compte à importer | Type de compte |
| Comptes clients | ✅ `Invoice.balanceDue`, aging | — |
| Comptes fournisseurs | ❌ | `Vendor` + factures fournisseurs à payer |
| Factures, paiements reçus | ✅ | — |
| Paiements effectués | 🟡 `CabinetExpense` couvre la sortie, pas le cycle « facture reçue puis payée » | Voir fournisseurs |
| Taxes de vente | ✅ Perçues et payées, rapport de remise | Codes de taxe configurables, voir 29 |
| Remboursements, notes de crédit | ✅ `CreditNote`, `overpayment-service` | — |
| Actifs, immobilisations, amortissement | ❌ | Voir 26.2 |
| Dettes, apports et retraits du propriétaire | ❌ | Voir 26.2 |
| Pièces justificatives | ✅ `pieceStorageKey`, `pieceHash`, anti-doublon | — |
| Rapprochements bancaires | 🟡 Import et validation ligne à ligne, pas de rapprochement de solde | Voir 39 |
| Périodes comptables | ✅ `AccountingPeriodLock` | — |
| Rapports financiers | 🟡 Quatre rapports existent | Voir 40 |
| Exports comptables | ✅ QuickBooks, Xero, Sage | — |

### 26.2 Ce qui manque vraiment, et ce que j'en ferais

**Immobilisations et amortissement.** Un ordinateur, un écran, du mobilier. À votre échelle,
cela représente une poignée de lignes par an, et l'amortissement est un calcul que votre
comptable fait de toute façon en fin d'exercice selon les catégories fiscales. **Ne le
construisez pas.** Un champ `estImmobilisation` sur la dépense, plus une liste exportable,
suffit et coûte une heure au lieu d'une semaine.

**Apports et retraits du propriétaire.** Réel et fréquent chez un entrepreneur seul, et
mal suivi mène à des surprises fiscales. Coût faible : un type de transaction
supplémentaire dans `JournalGeneralEntry` et deux lignes de rapport. **À faire.**

**Dettes et emprunts.** Un champ et un rapport si vous en avez. Sinon, rien. À trancher
selon votre situation réelle.

**Comptes fournisseurs.** Utile dès que vous avez des factures à payer à échéance plutôt
que des dépenses déjà payées. **À faire en phase 2**, avec le modèle `Vendor` et un cycle
simple : reçue, approuvée, payée.

### 26.3 Caisse ou exercice

Le journal actuel est de facto en comptabilité de caisse : il enregistre les mouvements
quand ils se produisent. La commande demande de pouvoir basculer en comptabilité
d'exercice.

**Ce qui est déjà distinguable dans le modèle** : date de facture (`Invoice.dateEmission`),
date d'échéance (`dateEcheance`), date de paiement (`Payment.datePaiement`), date de
dépense (`CabinetExpense.date`).

**Ce qui manque** : la date de dépôt effectif en banque, distincte de la date de paiement,
et la date d'application des taxes quand elle diffère de la date de facture.

**Recommandation** : ajouter les deux champs manquants, et produire les rapports en deux
versions, caisse et exercice, à partir des mêmes données. C'est un travail de requête, pas
de refonte. `⚠️ À VÉRIFIER` avec votre comptable : quelle méthode s'applique à votre
situation, et à partir de quel seuil de revenus la question se pose.

---

## 27. Plan comptable

### 27.1 Ce qui existe

`lib/accounting/export/account-mapping.ts` contient déjà un plan comptable par défaut à
neuf comptes logiques, surchargeable par cabinet, orienté cabinet juridique.

### 27.2 Ce qu'il faut ajouter

Le plan demandé compte une soixantaine de comptes. Deux remarques avant de tous les créer.

**Un plan comptable trop fin ne se tient pas.** Vingt-quatre catégories de dépenses veut
dire vingt-quatre décisions de classement par mois, dont la moitié seront arbitraires
(« repas avec un prospect » : Repas et représentation, ou Marketing ?). Le classement
deviendra incohérent, et un rapport incohérent ne sert à rien.

**Recommandation** : douze à quinze catégories de dépenses au départ, avec possibilité
d'en ajouter quand une ligne « Divers » devient trop grosse. Le signal d'un besoin de
sous-catégorie, c'est un montant, pas une intuition.

### 27.3 Plan recommandé pour SAFE Inc.

Structure à créer comme données de départ dans `ExpenseCategory` et à étendre au plan
d'export.

**Revenus**, alignés sur vos lignes d'affaires réelles :

| Code | Nom | Note |
|---|---|---|
| 4000 | Abonnement SAFE | Récurrent, le cœur |
| 4010 | Implantation et configuration | Ponctuel |
| 4020 | Tenue de livres | Le revenu de runway, décision CEO 2026-07-09 |
| 4030 | Consultation et accompagnement | |
| 4040 | Formation | |
| 4050 | Développement sur mesure | À suivre pour vérifier qu'il reste marginal |
| 4900 | Rabais et ajustements | Négatif |

Séparer 4000 des autres est important : c'est la ligne qui dit si le modèle SaaS tient.
Mélangée aux services, elle disparaît.

**Dépenses**, quinze catégories :

| Code | Nom |
|---|---|
| 5000 | Hébergement et infrastructure |
| 5010 | Logiciels et abonnements |
| 5020 | Intelligence artificielle et API |
| 5100 | Frais bancaires et de transaction |
| 5200 | Marketing et publicité |
| 5300 | Déplacements et représentation |
| 5400 | Téléphone et Internet |
| 5500 | Équipement et fournitures |
| 5600 | Services professionnels (comptable, juridique) |
| 5700 | Assurance |
| 5800 | Formation et documentation |
| 5850 | Sous-traitance |
| 5900 | Salaires et charges |
| 5950 | Intérêts |
| 5990 | Divers |

Le compte 5020 est séparé volontairement : c'est un coût qui grandit avec l'usage des
agents, et le noyer dans « logiciels » le rendrait invisible au moment où il faudrait le
surveiller.

**Actifs, passifs, capitaux propres** : à créer dans le plan d'export uniquement, pas dans
l'interface, tant que l'option A de la section 0.3 est retenue. Ils servent au comptable,
pas à vous au quotidien.

---

## 28. Enregistrement des dépenses

### 28.1 Ce qui existe déjà, et qui est bon

- Saisie manuelle, import CSV de relevé, extraction par photo de reçu
  (`lib/ai/extract-expense-receipt.ts`), catégorisation suggérée avec indice de confiance.
- Anti-doublon par empreinte du contenu du reçu : `@@unique([cabinetId, pieceHash])`.
  C'est le bon niveau, le doublon est empêché par la base et non par une vérification
  applicative contournable.
- Règles de catégorisation apprises (`ExpenseCategorizationRule`).
- Statut de validation en quatre états, révision humaine obligatoire.

### 28.2 Champs manquants sur `CabinetExpense`

| Champ | Type | Pourquoi |
|---|---|---|
| `modePaiement` | enum | Distinguer carte, virement, prélèvement |
| `bankAccountId` | FK | Quel compte a payé |
| `devise` | String, défaut CAD | Achats en USD fréquents en SaaS |
| `tauxChange` | Float? | Pour le montant en CAD au moment de la dépense |
| `tvh` | Float? | Ontario |
| `estImmobilisation` | Boolean | Voir 26.2 |
| `remboursable` | Boolean | Distinct de `refacturable` : remboursable au propriétaire |
| `leadId` / `clientCabinetId` | FK? | Rattacher une dépense à un client de SAFE Inc. |
| `approuveePar`, `approuveeAt` | | Piste d'audit |

### 28.3 Détections à ajouter

Les détections demandées, avec leur nature. Trois sont déterministes, donc fiables. Deux
demandent un jugement, donc restent des signalements et jamais des corrections.

| Détection | Nature | Traitement |
|---|---|---|
| Reçu en double | Déterministe, `pieceHash` | ✅ Déjà bloqué en base |
| Transaction en double | Déterministe (date + montant + description) | Signalée avant validation |
| Dépense sans pièce justificative | Déterministe | Liste dans la boîte de réception administrative |
| Dépense sans catégorie | Déterministe | Idem |
| Transaction non rapprochée | Déterministe | Idem |
| Montant incohérent | Statistique | Signalement seulement. Un montant inhabituel n'est pas une erreur |
| Taxes possiblement incorrectes | Règle + jugement | Signalement avec la règle appliquée affichée |
| Dépense personnelle mélangée | **Jugement** | Signalement uniquement, formulé sans accusation : « cette dépense ressemble à un achat personnel, confirmez sa nature ». Jamais de reclassement automatique |

---

## 29. Gestion des taxes

### 29.1 Position de prudence

C'est le domaine où une erreur coûte le plus cher et où un logiciel doit être le plus
modeste. La règle absolue, déjà énoncée dans la commande et que je reprends telle quelle :
**le système n'invente jamais un traitement fiscal.**

Traduction en architecture : les taux et les règles sont des **données configurables**,
jamais du code, et jamais une réponse de modèle. Un modèle peut lire un reçu et proposer
un montant de TPS lu sur le papier. Il ne décide jamais si une fourniture est taxable.

### 29.2 Ce qu'il faut construire

**Table `TaxCode`** : code, nom, province, taux, date d'entrée en vigueur, date de fin,
compte de taxe, notes, source de la règle. Une modification crée une nouvelle ligne, elle
n'écrase jamais l'ancienne, sinon les factures passées deviennent irreproduisibles.

**Résolution du code de taxe applicable**, dans cet ordre, avec la règle affichée :

1. Exonération explicite au niveau du client (avec motif et preuve)
2. Client hors Canada
3. Lieu de fourniture selon la province du client
4. Nature du produit ou service selon le catalogue
5. Défaut du profil de SAFE Inc.

À chaque facture, le code retenu et **la règle qui l'a fait retenir** sont enregistrés sur
la ligne. C'est ce qui rend une facture défendable trois ans plus tard.

**Ce que le système affiche toujours** : la règle utilisée, sa source, un marqueur si le
cas est incertain, et un bouton pour demander validation.

### 29.3 Ce que le système ne fait jamais

- Décider seul qu'une fourniture est détaxée ou exonérée
- Modifier une déclaration verrouillée
- Appliquer un taux dont la date d'entrée en vigueur n'est pas renseignée
- Présenter un rapport de taxes comme une déclaration

Chaque rapport de taxes porte la mention, déjà présente sur la page existante, qu'il s'agit
d'une estimation à faire valider.

`⚠️ À VÉRIFIER` : votre situation d'inscription (TPS/TVQ, numéros, fréquence de
déclaration, seuils) et le traitement applicable à un abonnement logiciel vendu à un client
ontarien. Ce sont des questions pour votre comptable, pas pour ce document. Le système doit
seulement être capable d'appliquer la réponse une fois obtenue.

---

## 30. Facturation complète

### 30.1 État

`Invoice` porte déjà l'essentiel : numéro unique sans trou (règle Barreau déjà implémentée),
dates d'émission et d'échéance, client, dossier, devise, sous-totaux séparés
(honoraires, débours, ajustements, intérêts), TPS et TVQ, crédits appliqués, fidéicommis
appliqué, montant payé, solde, notes client et interne, journal d'envoi (`InvoiceSendLog`),
relances (`InvoiceReminder`), statuts multiples.

### 30.2 Écarts

| Élément demandé | État | Action |
|---|---|---|
| Adresse de facturation distincte de l'adresse | 🟡 | Champ à ajouter sur le client |
| Numéro de taxe du client | 🟡 | Champ à ajouter |
| Conditions de paiement | 🟡 Déduites de l'échéance | Champ explicite, réutilisable comme défaut |
| Projet ou mandat lié | ❌ pour SAFE Inc. | `Dossier` est une notion juridique. Voir 30.3 |
| Journal de consultation | ❌ | Savoir qu'une facture a été ouverte. Utile pour la relance |
| Pièces jointes | 🟡 | À rattacher |

### 30.3 Le point structurant : projet ou mandat

Pour un cabinet, l'unité de travail est le `Dossier`, une notion juridique avec tribunal,
procédures et pièces. Pour SAFE Inc., l'unité de travail est un **mandat** : une
implantation, un accompagnement mensuel, un contrat de tenue de livres.

Trois options :

| Option | Description | Verdict |
|---|---|---|
| Réutiliser `Dossier` avec un type « mandat » | Zéro nouvelle table, mais un modèle plein de champs juridiques vides et de contrôles de conformité hors sujet | Bricolage |
| Créer `Mandat` pour SAFE Inc. seulement | Propre, mais une deuxième notion de travail dans le même produit | Duplication |
| **Créer `Mandat` comme notion produit générique** | Un cabinet peut aussi avoir des mandats non contentieux. `Dossier` reste le contentieux, `Mandat` devient l'unité facturable générique | **Recommandé** |

La troisième option coûte un peu plus cher tout de suite et vous évite un doublon
permanent. Elle profite aussi aux cabinets clients, qui facturent beaucoup de travail hors
dossier judiciaire.

---

## 31. Facturation au taux horaire

### 31.1 État

`TimeEntry` est complet ou presque : date, utilisateur, client, dossier, description, début,
fin, durée, facturable, taux, montant, statut, approbation, facture liée, radiation avec
motif.

**Trois protections déjà en place, à ne surtout pas casser** :

- `invoiceLineId` est `@unique` : une entrée de temps ne peut pas être portée par deux
  lignes de facture. La double facturation est empêchée **par la base**, pas par une
  vérification applicative.
- `isWrittenOff` avec motif : la radiation est tracée, jamais une suppression.
- `approvedById` et `approvedAt` : l'approbation existe déjà.

### 31.2 Écarts

| Élément | État | Action |
|---|---|---|
| Grille de taux multiple | ❌ Le taux est saisi sur l'entrée | Créer `HourlyRate` : par utilisateur, client, mandat, type d'activité, période |
| Résolution du taux applicable | ❌ | Cascade explicite, avec le taux retenu et sa raison enregistrés sur l'entrée |
| Chronomètre | 🟡 `WorkSession` existe | À brancher sur une interface de minuteur, voir 49 |
| Arrondissement configurable | ❌ | Paramètre cabinet : 1, 6, 10 ou 15 minutes |
| Minimum facturable | ❌ | Paramètre cabinet |
| Verrouillage après facturation | 🟡 | Interdire la modification d'une entrée dont `billingStatus` est facturé |

**Cascade de résolution du taux**, du plus spécifique au plus général :

```
1. Taux négocié pour ce client et ce type d'activité
2. Taux négocié pour ce client
3. Taux du mandat
4. Taux de l'utilisateur pour ce type d'activité
5. Taux standard de l'utilisateur
6. Taux par défaut du cabinet
```

Le taux retenu **et le niveau de la cascade qui l'a produit** sont écrits sur l'entrée de
temps. Sans cela, une facture contestée six mois plus tard est indéfendable.

---

## 32. Facturation au forfait

### 32.1 État

`ForfaitService` existe : code, nom, montant, catégorie, taxable, actif. `DossierBillingStage`
gère des étapes de facturation. `forfait-billing-service` et `billing-stage-service` sont en
place.

C'est un socle de forfait **fixe**. Les cinq autres formes demandées manquent.

### 32.2 Les six formes, et ce qu'elles exigent

| Forme | État | Ce qu'il faut |
|---|---|---|
| Forfait fixe | ✅ | — |
| Forfait par phase | 🟡 `DossierBillingStage` | Généraliser au mandat |
| Forfait par jalon | ❌ | `BillingMilestone` : condition d'atteinte, preuve, date, montant |
| Dépôt initial et solde | ❌ | `BillingSchedule` avec échéances en pourcentage |
| Forfait récurrent | ❌ | `RecurringBillingPlan`, voir 35 |
| Forfait avec heures incluses | ❌ | Le plus complexe. Voir 32.3 |

### 32.3 Le forfait avec heures incluses

C'est celui qui casse la plupart des systèmes, parce qu'il croise deux modes de facturation
sur une même période.

**Modèle nécessaire** : quota d'heures par période, taux des heures excédentaires, règle de
report du solde inutilisé (perdu, reporté, reporté avec plafond), moment de la mesure.

**Règles à fixer explicitement, sinon le calcul est ambigu** :

1. Le décompte se fait sur les heures **approuvées**, pas saisies.
2. Une heure radiée ne consomme pas le quota.
3. Le dépassement se facture à la fin de la période, jamais en cours de route.
4. Le solde inutilisé est perdu par défaut. Toute autre règle doit être écrite au contrat.
5. Une heure ne peut jamais consommer le quota **et** être facturée séparément. Même
   protection que `invoiceLineId` unique : une contrainte de base, pas une vérification.

**Écran attendu** : une barre de consommation visible par le client et par vous, à jour en
continu. C'est aussi un excellent outil commercial, parce qu'il rend visible la valeur
livrée.

---

## 33. Facturation hybride

L'exemple de la commande, 2 000 $ d'implantation, 300 $ par mois, 125 $ l'heure hors
périmètre, doit fonctionner sans trois systèmes parallèles.

**Architecture** : un `Mandat` porte **plusieurs** `BillingArrangement`. Chaque arrangement
a un type (fixe, échelonné, jalon, récurrent, horaire, quota) et ses paramètres. Le moteur
de facturation interroge tous les arrangements actifs d'un mandat pour la période, produit
les lignes de chacun, et les assemble en une facture unique.

C'est le seul choix de conception qui évite la multiplication. Un mandat, N arrangements,
une facture.

**Ordre des lignes sur la facture**, fixé pour la lisibilité : forfaits et jalons, puis
abonnements, puis heures, puis heures excédentaires, puis dépenses remboursables, puis
rabais, puis intérêts.

---

## 34. Catalogue de produits et services

Nouvelle table `CatalogItem`. Elle n'existe pas et elle est la clé d'une grande partie de la
cohérence demandée en section 73.

**Champs** : code, nom, catégorie, descriptions courte et détaillée, type de tarification,
prix standard, taux horaire, prix forfaitaire, fréquence, code de taxe applicable, compte de
revenu, durée estimée, actif, dates d'effet, modèles de contrat associés, tâches types
associées, livrables associés.

**Pourquoi c'est structurant** : c'est le seul endroit où « ce que vous vendez » est défini
une fois. Le catalogue alimente ensuite la proposition, le devis, le contrat, le mandat,
l'échéancier, les tâches et la facture. Sans lui, chacun de ces objets redéfinit le service
à sa façon et les rapports par service deviennent faux.

**Les tâches types sont le lien avec la couche cognitive.** Vendre « Implantation complète »
crée le mandat **et** les dix tâches qui composent une implantation, déjà décomposées, avec
leurs durées estimées. C'est la décomposition automatique de la section 47, mais gratuite,
parce que déterministe.

---

## 35. Factures récurrentes et abonnements

### 35.1 Une distinction à faire d'abord

Vous avez deux flux récurrents différents et il ne faut pas les confondre.

| Flux | Qui encaisse | Outil | État |
|---|---|---|---|
| Abonnement SAFE payé par un cabinet | SAFE Inc. via Stripe | Stripe Billing | ✅ Branché |
| Honoraires récurrents facturés par SAFE Inc. (tenue de livres, accompagnement) | SAFE Inc. par facture | À construire | ❌ |

Pour le premier, Stripe fait déjà le travail : prorata, essai, échec de paiement, carte
expirée, changement de forfait. **Ne le réimplémentez pas.** Ce qu'il faut, c'est que les
événements Stripe créent les écritures et mettent à jour le CRM.

Le second est celui à construire.

### 35.2 `RecurringBillingPlan`

Champs : mandat, arrangement, fréquence, jour d'émission, montant, code de taxe, date de
début, date de fin ou nombre d'échéances, prorata au premier mois, indexation future,
statut, date de prochaine émission, dernière facture émise.

### 35.3 Les sept vérifications avant émission

La commande les liste et elles sont justes. Elles deviennent des conditions bloquantes :

1. Le contrat est actif à la date d'émission
2. Le montant correspond à l'arrangement en vigueur
3. La période à facturer n'a pas déjà été facturée (clé d'idempotence sur mandat + période)
4. Les codes de taxe sont valides à la date d'émission
5. Aucune facture en double pour cette période
6. Le client n'est pas suspendu
7. Aucune modification contractuelle en attente d'approbation

**Si une seule échoue, la facture n'est pas émise et une tâche est créée** avec le motif.
Le système ne devine jamais, il s'arrête et demande.

**Niveau d'autonomie** : la première facture d'un plan est toujours validée à la main. Les
suivantes peuvent être automatiques si et seulement si le CEO a approuvé ce plan précis, et
que rien n'a changé depuis. Toute modification du plan renvoie la prochaine facture en
validation manuelle.

---

## 36. Devis, propositions et contrats

### 36.1 La chaîne sans ressaisie

```
Opportunité ──▶ Proposition ──▶ Devis ──▶ Contrat ──▶ Mandat
                                              │
                                              ├──▶ Arrangements de facturation
                                              ├──▶ Échéancier
                                              ├──▶ Tâches (depuis le catalogue)
                                              └──▶ Prévision de revenus
                                                        │
                                    Facture ◀───────────┘
                                       │
                                    Paiement ──▶ Écriture comptable
```

**Règle** : chaque flèche est une **transformation**, jamais une ressaisie. L'objet aval
naît de l'objet amont et garde le lien. Si le prix change au contrat, on voit qu'il a
changé par rapport au devis, et de combien.

### 36.2 Statuts

Brouillon, en révision, en attente d'approbation, envoyé, consulté, accepté, refusé, expiré,
annulé, remplacé.

Deux règles : un document envoyé devient **immuable**, une correction crée une nouvelle
version qui remplace la précédente. Un document accepté ne peut plus changer de statut sauf
vers annulé, avec motif.

### 36.3 Réutilisation

`RichDocument` et `RichDocumentVersion` existent déjà et gèrent le versionnage. À évaluer
avant de créer une table de propositions.

---

## 37. Paiements clients

### 37.1 État

Très couvert. `Payment`, `PaymentAllocation` (affectation à plusieurs factures),
`overpayment-service` (trop-payé), `CreditNote` et `CreditNoteApplication`, `PayerRule`
(règles de payeur tiers apprises), `match-payment` et `payment-match-candidates`
(rapprochement d'un paiement à une facture), import de preuve Interac par vision avec
anti-doublon par `providerRef`.

C'est probablement la partie la plus mûre de tout le système.

### 37.2 Écarts

| Élément | État | Action |
|---|---|---|
| Frais de transaction et montant net | ❌ | Deux champs. Important : Stripe prélève avant dépôt, et sans ces champs le rapprochement bancaire ne tombera jamais juste |
| Devise sur le paiement | 🟡 | Champ |
| Paiement retourné, contesté | ❌ | Statuts à ajouter, avec effet de réouverture de la facture |
| Créance irrécouvrable | ❌ | Statut plus écriture de radiation |

Le premier écart est celui qui compte : c'est la cause la plus fréquente d'un rapprochement
bancaire qui ne tombe pas juste, et elle produit une heure de recherche par mois pour deux
champs manquants.

---

## 38. Comptes clients et recouvrement

### 38.1 État

`receivables-aging.ts` produit déjà la balance âgée. `InvoiceReminder` et `reminder-service`
gèrent les relances. `interest-service` gère les intérêts.

### 38.2 Écarts

Promesses de paiement, litiges, jours moyens de paiement par client, risque de non-paiement.

**La promesse de paiement mérite une mention particulière.** « Je vous paie vendredi »
est un engagement. Traité comme tel, il crée une tâche de vérification le lundi, exactement
comme un engagement de prospection en section 9 du document parent. C'est le même moteur,
appliqué au recouvrement.

### 38.3 Escalade de relance

| Étape | Moment | Ton | Autonomie |
|---|---|---|---|
| Rappel avant échéance | J-3 | Neutre, informatif | Préparé, envoi manuel |
| Rappel à l'échéance | J+0 | Neutre | Préparé, envoi manuel |
| Premier rappel | J+7 | Cordial | Préparé, envoi manuel |
| Deuxième rappel | J+21 | Ferme mais respectueux | Préparé, envoi manuel |
| Avis final | J+45 | Formel, conséquences énoncées | Rédigé à la main |
| Suspension de service | J+60 | Décision commerciale | **Toujours manuelle** |
| Créance douteuse | J+90 | Écriture comptable | Manuelle |

**Deux règles de ton.** Vos clients sont des avocats et votre marché est petit : une
relance maladroite se sait. Le ton reste respectueux à toutes les étapes, y compris à
l'avis final. Et aucune relance ne part automatiquement, jamais, même à J+7. Le coût d'une
relance envoyée à quelqu'un qui vient de payer dépasse largement le temps gagné.

---

## 39. Rapprochement bancaire

### 39.1 État

L'import existe (`BankImportSession`, `BankImportTransaction`), avec normalisation du
fournisseur, suggestion de catégorie, indice de confiance, statuts de validation, et lien
vers la dépense créée.

Ce qui manque, c'est le **rapprochement au sens comptable** : la confirmation que le solde
du relevé correspond au solde du système à une date donnée.

### 39.2 À construire

**`BankAccount`** : nom, institution, type (chèque, épargne, carte de crédit), devise,
solde d'ouverture, date d'ouverture, actif.

**`BankReconciliation`** : compte, date de fin de période, solde du relevé, solde calculé,
écart, statut, verrouillage, utilisateur, date.

**`BankRule`** : condition sur la description ou le montant, action de catégorisation,
priorité, compteur d'application. `ExpenseCategorizationRule` existe déjà et peut être la
base.

### 39.3 Le rôle de l'IA, et sa limite

L'IA **suggère** une correspondance et donne un indice de confiance. Elle ne valide jamais.

Seuils proposés, à ajuster à l'usage :

| Confiance | Comportement |
|---|---|
| ≥ 95 % et montant exact et date à 2 jours | Proposé en tête, acceptable en un clic |
| 70 à 95 % | Proposé avec les autres candidats |
| < 70 % | Aucune proposition. On demande plutôt que de suggérer mal |

Un rapprochement verrouillé ne se modifie plus. Une correction crée une écriture de
correction datée, jamais une modification rétroactive.

---

## 40. Rapports financiers

### 40.1 Sous l'option A de la section 0.3

| Rapport demandé | Faisable | État |
|---|---|---|
| État des résultats (caisse) | ✅ | À construire, données présentes |
| **Bilan** | ❌ | Impossible sans partie double. Produit par le comptable depuis l'export |
| Flux de trésorerie | ✅ | À construire |
| **Balance de vérification** | ❌ | Idem bilan |
| **Grand livre** | 🟡 | Le journal mono-axe en tient lieu, avec ses limites. À nommer « Journal », pas « Grand livre », pour ne pas promettre ce que ce n'est pas |
| Journal général | ✅ | Existe |
| Revenus par client, service, mandat, mode | ✅ | À construire, données présentes |
| Revenus récurrents | ✅ | Après 35 |
| Dépenses par catégorie, fournisseur | ✅ | À construire |
| Marge par mandat, rentabilité par client | 🟡 | `dossier-profitability.ts` existe, à généraliser au mandat |
| Temps facturable et non facturable | ✅ | `unbilled-time.ts` existe |
| Taux de réalisation et de recouvrement | ❌ | À construire, données présentes |
| Comptes clients, balance âgée | ✅ | Existe |
| Taxes perçues, payées, à remettre | ✅ | Existe |
| Prévisions de trésorerie | ❌ | Voir 41 |
| Factures à produire, factures échues | 🟡 | À construire |

**Honnêteté sur le nommage** : appeler « Grand livre » un journal mono-axe, ou produire un
« Bilan » incomplet, serait pire que de ne rien produire. Un rapport financier qui porte le
nom d'un état normalisé sans en avoir la rigueur finit par être présenté à un tiers, et le
problème remonte à ce moment-là.

### 40.2 Filtres communs

Période, client, mandat, service, utilisateur, province, devise, mode de facturation,
statut. À implémenter une fois dans un composant partagé, pas par rapport.

---

## 41. Budgets et prévisions

### 41.1 La vraie valeur de cette section

C'est ici que le CRM cesse d'être deux outils collés et devient un seul système. Les
questions de la commande ne sont répondables que si le commercial et le comptable se
parlent.

### 41.2 Objectifs

`FinancialGoal` : type (revenu mensuel, revenu annuel, MRR, budget de dépenses, seuil de
trésorerie, nombre de clients, heures facturables), valeur cible, période, statut.

### 41.3 Les dix questions, et comment y répondre

| Question | Sources | Faisable après |
|---|---|---|
| Combien dois-je facturer ce mois-ci ? | Objectif, moins déjà facturé | Phase 1 |
| Combien de clients dois-je signer ? | Écart à l'objectif, divisé par la valeur moyenne | Phase 1 |
| Quel montant reste à encaisser ? | Balance âgée | ✅ Déjà |
| Quels contrats seront renouvelés ? | Dates de fin des arrangements | Phase 2 |
| Quelles dépenses sont prévues ? | Récurrentes connues, plus moyenne des variables | Phase 2 |
| Quelle est ma trésorerie projetée ? | Solde, plus encaissements attendus, moins dépenses prévues | Phase 2 |
| Quels prospects combleraient l'écart ? | **Croisement CRM et compta** : écart à l'objectif, puis leads dont la valeur potentielle et la probabilité couvrent l'écart | Phase 3 |
| Quelles factures dois-je produire aujourd'hui ? | Heures approuvées non facturées, jalons atteints, échéances récurrentes | Phase 1 |
| Quels clients sont les plus rentables ? | Revenus moins temps passé moins dépenses affectées | Phase 2 |
| Quels services prennent trop de temps ? | Durée estimée du catalogue contre temps réel | Phase 3 |

La septième est la plus intéressante et la seule vraiment nouvelle : elle transforme un
objectif financier en liste de prospects à appeler. Elle mérite d'être dans la vue
« Aujourd'hui » quand l'écart à l'objectif est significatif.

### 41.4 Prévision de trésorerie

Horizon 90 jours, trois scénarios : pessimiste (seuls les encaissements très probables),
attendu (pondéré par la probabilité), optimiste. Un graphique, une ligne de seuil minimal,
et une alerte quand la projection passe sous le seuil.

**Règle** : la prévision affiche toujours son nombre d'hypothèses et ne prétend jamais à la
précision. Une trésorerie projetée au dollar près est un mensonge.

---

## 42. Intégration du CRM et de la comptabilité

### 42.1 À la conversion

La section 3.I du document parent décrit déjà la conversion. Elle s'enrichit de la partie
financière, dans la même transaction :

1. Profil de facturation : adresse, numéro de taxe, conditions, devise, code de taxe
2. Contrat depuis le devis accepté
3. Mandat depuis le contrat
4. Arrangements de facturation depuis le catalogue
5. Échéancier et dates de prochaine facturation
6. Tâches d'implantation depuis les tâches types du catalogue
7. Prévision de revenus alimentée
8. Première facture **préparée en brouillon**, jamais envoyée

### 42.2 Quand une opportunité est gagnée

Alimente les prévisions de revenus, le calendrier de facturation, la charge de travail
prévue, les objectifs, la trésorerie projetée.

**Un effet à ne pas oublier** : gagner un client consomme de la capacité. Le système doit
signaler quand les mandats en cours dépassent les heures disponibles, avant de signer le
suivant. C'est un service que peu de CRM rendent, et c'est exactement le genre de mur
qu'un entrepreneur seul rencontre.

### 42.3 Quand une facture est payée

Solde client, comptes clients, compte bancaire, revenus, taxes, statut du client, fermeture
des tâches de recouvrement, tableaux de bord. La plupart de ces effets existent déjà, il
manque leur orchestration en un seul point.

---

## 43. Exportation et intégrations

| Cible | État | Priorité |
|---|---|---|
| QuickBooks, Xero, Sage | ✅ `lib/accounting/export/` | — |
| Excel, CSV, PDF | 🟡 Partiel | Phase 2 |
| Stripe | ✅ | Brancher les frais de transaction, voir 37.2 |
| Banques (agrégation automatique) | ❌ | **À éviter.** Coût récurrent par compte, dépendance à un tiers, et l'import CSV manuel prend cinq minutes par mois à votre volume |
| Interac | ✅ par preuve de paiement importée | — |
| Signature électronique | ❌ | Phase 3 |
| Calendrier, courriel | ❌ | Voir document parent, section 17 |

**Anti-doublon de synchronisation** : toute entité issue d'une source externe porte
l'identifiant de la source, avec une contrainte d'unicité. `providerRef` sur les paiements
et `pieceHash` sur les reçus suivent déjà ce principe. À généraliser.

---

# PARTIE II — Couche d'accessibilité cognitive

## 44. Principes de la couche

### 44.1 Ce qu'elle est

Une couche transversale de soutien aux fonctions exécutives. Elle agit sur six difficultés
concrètes, sans jamais les nommer autrement que par ce qu'elles produisent à l'écran.

| Difficulté | Ce que fait la couche |
|---|---|
| Savoir par où commencer | Une seule action mise en avant, jamais une liste |
| Démarrer une tâche | Un bouton qui exécute la première étape à votre place |
| Percevoir le temps | Estimations affichées, comparées au réel, ajustées avec l'usage |
| Retrouver le contexte | L'état d'une tâche interrompue est restitué, pas reconstruit de mémoire |
| Ne pas oublier | Capture rapide partout, boîte de réception unique |
| Ne pas se noyer | Plafond d'affichage, révélation progressive, mode minimum |

### 44.2 Les six règles de conception

1. **Discrète.** Aucune icône particulière, aucun encart qui signale « aide ». La couche
   se manifeste par ce qui est absent de l'écran, pas par ce qui s'y ajoute.
2. **Professionnelle.** Le ton est celui d'un chef de cabinet, pas d'un coach. « Trois
   factures à produire aujourd'hui » et non « Vous pouvez le faire ».
3. **Configurable.** Chaque composant s'active et se désactive seul. Le réglage par défaut
   est le plus sobre.
4. **Sans jugement.** Le système ne commente jamais un retard, ne compare jamais à une
   moyenne, n'affiche jamais de score de productivité personnel.
5. **Réversible.** Toute action guidée peut être annulée. Un système qui aide et qui piège
   n'aide pas.
6. **Silencieuse par défaut.** Une notification doit changer ce que vous faites dans
   l'heure, sinon elle va dans une liste.

### 44.3 Ce que la couche ne fait jamais

- Nommer un trouble, un symptôme ou un diagnostic
- Se présenter comme une aide thérapeutique ou médicale
- Afficher un score de discipline, une note ou une comparaison à un idéal
- Culpabiliser un report, un oubli ou une journée improductive
- Verrouiller une fonction pour « votre bien »
- Envoyer des rappels répétés sur le même élément

---

## 45. Vue « Aujourd'hui »

### 45.1 Ce qui existe

La tour de contrôle (`/console`) est déjà cette vue pour la prospection : une action clé,
une file discrète. **Le principe est acquis et validé.** Cette section l'étend au travail
administratif et financier.

### 45.2 Structure

```
┌────────────────────────────────────────────────────────────┐
│  Jeudi 30 juillet          Charge estimée : 3 h 20         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  MAINTENANT                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Envoyer la facture de juillet à Derisier Avocats    │  │
│  │  1 850 $ · préparée · 4 min                          │  │
│  │  [ Commencer maintenant ]  [ Reporter ]              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  AUSSI AUJOURD'HUI                            (3)          │
│  · Rappeler Me Tremblay              12 min                │
│  · Valider 6 heures de la semaine    15 min                │
│  · Joindre 3 reçus manquants          8 min                │
│                                                             │
│  ▸ Cette semaine (7)      ▸ En attente (4)                 │
│                                                             │
│  Rien d'autre ne réclame votre attention aujourd'hui.       │
└────────────────────────────────────────────────────────────┘
```

### 45.3 Règles dures

1. **Trois priorités maximum** dans « aussi aujourd'hui ». Configurable de 1 à 5, jamais
   plus.
2. Les autres niveaux sont **repliés par défaut**, avec un compteur seulement.
3. **La charge estimée est affichée en haut.** C'est l'ancre temporelle : elle transforme
   « beaucoup de choses » en « trois heures vingt ».
4. Si la charge dépasse le temps disponible déclaré, le système **propose de reporter**,
   nommément, les éléments les moins critiques. Il ne se contente pas d'afficher un
   dépassement.
5. La phrase de clôture (« rien d'autre ne réclame votre attention ») est affichée quand
   c'est vrai. C'est ce qui permet de fermer l'écran sans crainte d'avoir raté quelque
   chose.

### 45.4 Les cinq niveaux

| Niveau | Définition | Affichage |
|---|---|---|
| Maintenant | Une seule chose, la plus urgente ou la plus bloquante | En grand |
| Aujourd'hui | Échéance aujourd'hui, ou engagement pris pour aujourd'hui | Liste courte |
| Cette semaine | Échéance dans les 7 jours | Replié, compteur |
| En attente | Dépend de quelqu'un d'autre | Replié, compteur |
| Peut attendre | Sans échéance, sans engagement | Non affiché, accessible par la liste complète |

---

## 46. Mode « Prochaine action »

Chaque prospect, client, mandat, facture, projet et tâche affiche **une seule** prochaine
action, formulée à l'impératif.

**Validation à l'écriture** : une prochaine action doit commencer par un verbe d'action et
décrire un résultat vérifiable. Une liste de verbes vagues est rejetée à la saisie.

| Refusé | Accepté |
|---|---|
| Continuer le projet | Envoyer la maquette de la page d'accueil |
| Gérer le client | Appeler Me Tremblay pour confirmer la date de démarrage |
| Travailler sur le dossier | Rédiger la section « migration » de la proposition |
| Suivre la facture | Vérifier si le virement du 12 est arrivé |
| Faire la comptabilité | Classer les 5 transactions du 22 au 26 juillet |

Le rejet est doux : le système propose une reformulation plutôt que de bloquer sèchement.

---

## 47. Décomposition des tâches

### 47.1 Deux sources, dans cet ordre

**Déterministe d'abord.** Une tâche issue du catalogue (« Implantation complète ») porte
déjà ses sous-tâches, écrites une fois et réutilisées. C'est gratuit, fiable et instantané.
La section 34 en fait la clé.

**IA ensuite,** seulement pour ce qui n'est pas au catalogue.

### 47.2 Déclencheurs de proposition

Le système propose de décomposer quand la tâche est estimée à plus de 90 minutes, ou
reportée trois fois, ou formulée avec un verbe vague, ou marquée « je suis bloqué ».

Il **propose**, il ne décompose pas d'office. Une tâche découpée sans qu'on l'ait demandé
ajoute du bruit.

### 47.3 Contrat de la décomposition

Chaque sous-tâche : verbe à l'impératif, résultat vérifiable, durée estimée, moins de
30 minutes, indépendante ou explicitement dépendante de la précédente.

**La première sous-tâche doit être faisable en moins de 5 minutes.** C'est la règle la plus
importante de cette section. Une décomposition dont la première étape prend une heure ne
résout pas le problème du démarrage, elle le déplace.

### 47.4 Exemple, celui de la commande

« Préparer la proposition pour le cabinet ABC » devient :

| # | Sous-tâche | Durée | Dépend de |
|---|---|---|---|
| 1 | Relire les notes de la rencontre du 12 | 4 min | — |
| 2 | Confirmer les besoins retenus dans la fiche | 6 min | 1 |
| 3 | Choisir le forfait au catalogue | 3 min | 2 |
| 4 | Ajuster le prix et vérifier la marge | 8 min | 3 |
| 5 | Poser l'échéancier de facturation | 5 min | 4 |
| 6 | Générer la proposition | 2 min | 5 |
| 7 | Vérifier les codes de taxe | 3 min | 6 |
| 8 | Relire à voix haute | 10 min | 7 |
| 9 | Envoyer | 2 min | 8 |
| 10 | Programmer le suivi à J+4 | 1 min | 9 |

Total 44 minutes, première étape 4 minutes. La tâche est passée d'un mur à une pente.

---

## 48. Démarrage guidé

Bouton « Commencer maintenant » sur chaque tâche. Au clic, l'écran affiche **uniquement** :

- La première étape, seule
- Les informations nécessaires, déjà chargées (dernier échange, montant, décision prise)
- Le document ou l'écran à ouvrir, déjà ouvert
- Le brouillon de message s'il y en a un, déjà rédigé
- Un minuteur suggéré
- Le résultat minimum attendu

**Le principe** : le bouton ne dit pas de commencer, il **a déjà commencé**. Ce qu'il reste
à faire est le plus petit geste possible.

**Exemple, la comptabilité.** « Faire la comptabilité » devient :

```
Comptabilité de la semaine · 18 min estimées

  1. Importer les transactions du 22 au 28        [ Importer ]     2 min
  2. Classer 5 transactions non catégorisées      [ Commencer ]    7 min
  3. Joindre 3 reçus manquants                    [ Commencer ]    6 min
  4. Vérifier le solde du compte                  [ Ouvrir ]       3 min
```

Quatre gestes de moins de sept minutes remplacent une corvée sans contour.

---

## 49. Minuteur et perception du temps

### 49.1 Réutilisation

`WorkSession` et `TimeEntry` existent. Le minuteur de concentration et le suivi du temps
facturable sont **le même objet vu de deux façons**, et il ne faut surtout pas les
dédoubler : une session de concentration sur un mandat client est du temps facturable.

### 49.2 Fonctions

Minuteur démarré depuis une tâche, durées 15, 25, 50 minutes ou libre, pause, reprise,
arrêt automatique après inactivité prolongée avec confirmation à la reprise (jamais
d'enregistrement d'heures qu'on n'a pas travaillées).

### 49.3 Estimation contre réel

À la fin d'une session, comparaison discrète : estimé 20 minutes, réel 34 minutes.

**Ce que le système en fait** : après cinq occurrences d'un même type de tâche, il ajuste
ses estimations futures avec un facteur personnel par type. Après vingt, l'ajustement
devient fiable.

**Ce qu'il n'en fait jamais** : un commentaire, une moyenne affichée en permanence, un
graphique de performance personnelle. La correction est silencieuse et se voit seulement
dans la justesse croissante des estimations.

### 49.4 Alertes de transition

Un rendez-vous dans 15 minutes déclenche une alerte douce, une seule, avec le temps tampon
configuré. Le mode concentration est automatiquement suspendu 5 minutes avant.

---

## 50. Mode concentration

Écran plein qui masque navigation, notifications non critiques, tableaux de bord et
indicateurs secondaires.

Affiche uniquement : la tâche, son objectif, ses sous-tâches avec la courante mise en
évidence, le document utile, le temps restant, et quatre boutons : Pause, **Je suis bloqué**,
Noter (capture rapide sans quitter), Terminer.

**Ce qui traverse quand même le mode concentration** : uniquement le critique, c'est-à-dire
un rendez-vous imminent, une plainte pour pourriel, et un billet de support en priorité
haute d'un client. Rien d'autre. La liste est courte et fermée, elle ne s'allonge pas.

---

## 51. Bouton « Je suis bloqué »

### 51.1 Pourquoi il compte

Un report sans cause traitée revient à l'identique le lendemain. Ce bouton existe pour que
le blocage soit **nommé** avant d'être déplacé.

### 51.2 Fonctionnement

Le système demande d'abord la nature du blocage, en une question à quatre choix :

| Cause | Ce que le système propose |
|---|---|
| Je ne sais pas par où commencer | La plus petite étape possible, réduite jusqu'à moins de 5 minutes |
| Il me manque une information | Ce qui manque précisément, qui peut le fournir, un brouillon de demande |
| Ça dépend de quelqu'un | Passage en « en attente » avec un suivi daté sur cette personne |
| Ce n'est pas le bon moment | Report avec **une date précise obligatoire**, et une raison |

Options communes : décomposer, déléguer, demander une validation, ou **supprimer**.

### 51.3 La quatrième option

Proposer explicitement de supprimer la tâche est important. Une partie des blocages vient
de tâches qui n'auraient jamais dû exister. Le système doit rendre l'abandon aussi facile
que le report, sinon la liste ne fait que grossir.

**Règle absolue** : ce bouton ne se contente jamais de repousser la date. Il traite la
cause ou il déclare la tâche morte.

---

## 52. Reprise après interruption

### 52.1 Ce qu'il faut capturer

À chaque pause ou abandon de session : sous-tâche en cours, sous-tâches déjà faites,
dernière action réalisée, documents ouverts, décisions prises pendant la session, notes
prises, temps écoulé, temps restant estimé.

### 52.2 Ce qui s'affiche à la reprise

```
Proposition Cabinet ABC · repris après 2 jours

  Vous en étiez à : Ajuster le prix et vérifier la marge
  Déjà fait       : notes relues, besoins confirmés, forfait choisi (Implantation
                    complète, 2 000 $)
  Dernière action : vous avez noté « vérifier si le rabais de 10 % tient la marge »
  Reste           : 6 étapes, environ 23 minutes

  [ Reprendre ]   [ Voir tout le contexte ]
```

Le but est qu'aucune reconstruction mentale ne soit nécessaire. Le système se souvient à
votre place, ce qui est précisément ce qu'un logiciel sait faire mieux qu'un cerveau
fatigué.

---

## 53. Capture rapide

### 53.1 Disponibilité

Partout. Raccourci clavier global, bouton flottant discret, et disponible en mode
concentration sans le quitter.

### 53.2 Fonctionnement

L'utilisateur écrit ou dicte une phrase. Le système propose une interprétation structurée,
que l'utilisateur confirme en un geste.

| Phrase saisie | Interprétation proposée |
|---|---|
| Appeler Kim demain | Tâche · Appel · Kim Tremblay (Cabinet Tremblay) · demain · normale |
| Envoyer la facture vendredi | Tâche · Facturation · vendredi 1er août · **client à préciser** |
| Vérifier le paiement de 500 $ | Tâche · Vérification · lié au paiement de 500 $ du 28 juillet |
| Préparer le devis pour Ruth | Tâche · Devis · Ruth Bergeron · **échéance à préciser** |
| Recontacter ce prospect en septembre | Report du lead courant · 2 septembre · statut en pause |
| Ajouter l'abonnement logiciel aux dépenses | Dépense · catégorie Logiciels · **montant à préciser** |

### 53.3 Trois règles

1. **La capture réussit toujours.** Même sans interprétation, la phrase est enregistrée
   telle quelle dans la boîte de réception. Perdre une note capturée est le pire défaut
   possible pour cette fonction.
2. **Ce qui manque est nommé, jamais deviné.** « Client à préciser » plutôt qu'un client
   choisi au hasard parmi les récents.
3. **La confirmation prend un geste.** Si elle en prend trois, la fonction ne sera pas
   utilisée, et une fonction de capture non utilisée ne sert à rien.

---

## 54. Boîte de réception administrative

### 54.1 Contenu

Un seul endroit où atterrit tout ce qui n'est pas encore traité : notes capturées,
courriels à traiter, reçus non classés, documents reçus, transactions bancaires non
catégorisées, tâches suggérées par les agents, engagements détectés, dates détectées,
factures à vérifier, demandes de clients, éléments sans responsable.

### 54.2 Actions

Huit actions, toutes à un clic : transformer en tâche, lier à un client, classer, déléguer,
programmer, archiver, supprimer, demander une information.

### 54.3 Le traitement guidé

Le système ne montre pas les 40 éléments d'un coup. Il propose une **session de tri** :
« 12 éléments en attente, environ 9 minutes. Commencer ? » puis les présente un par un,
avec l'action la plus probable pré-sélectionnée.

**Objectif affiché : vider.** Pas « gérer », vider. Un compteur qui descend et un écran
vide à la fin.

### 54.4 Ce qui ne doit pas arriver

La boîte de réception ne doit jamais devenir un cimetière. Si un élément y reste plus de
14 jours, le système demande une décision binaire : cela compte, ou cela ne compte pas. Pas
de troisième option.

---

## 55. Rappels intelligents

### 55.1 Cinq niveaux

| Niveau | Définition | Canal |
|---|---|---|
| Information | À savoir, rien à faire | Liste quotidienne |
| Action recommandée | Utile, pas urgent | Vue Aujourd'hui, section repliée |
| Action importante | Conséquence si non fait cette semaine | Vue Aujourd'hui, visible |
| Action urgente | Conséquence aujourd'hui | En tête, notification |
| Blocage critique | Argent, client ou conformité en jeu | Notification, traverse le mode concentration |

### 55.2 Contenu obligatoire d'un rappel

Quatre éléments, toujours : ce qu'il faut faire, pourquoi maintenant, ce qui se passe si
rien n'est fait, et la durée estimée. Plus un bouton d'action directe.

```
Facture 2026-0042 · échue depuis 21 jours · 1 850 $

Pourquoi maintenant : c'est le deuxième palier de relance et le client
a réglé ses deux dernières factures sans retard, donc un oubli est probable.

Si rien n'est fait : le montant passe en créance à surveiller dans 24 jours
et des intérêts commencent à courir.

Durée estimée : 4 minutes.        [ Préparer la relance ]
```

### 55.3 Anti-répétition

Un même élément ne génère pas deux rappels identiques. À la deuxième occurrence, le rappel
**change de forme** : il propose de traiter la cause, pas de refaire la même chose.
À la troisième, il propose de supprimer ou de déléguer.

---

## 56. Limitation de la surcharge

Treize principes, applicables à tous les écrans du CRM. Ils rejoignent la base de
connaissances design du repo (`DESIGN_HUMAIN.md`, méta-règles M2 et M6, section H1).

| # | Principe | Application concrète |
|---|---|---|
| 1 | Limiter les choix visibles | Maximum 5 actions par écran. Le reste sous un déclencheur |
| 2 | Révélation progressive | Options avancées sous un déclencheur persistant, jamais au survol seul |
| 3 | Termes simples | « À payer » et non « Comptes fournisseurs ouverts » |
| 4 | Pas d'écran surchargé | Une intention principale par écran |
| 5 | Hiérarchie claire | Taille, poids et espace avant la couleur et l'ombre |
| 6 | Statuts cohérents | Le même mot veut dire la même chose partout dans le produit |
| 7 | Réduire les saisies | Ce qui est connu n'est jamais redemandé |
| 8 | Préremplir | Client, taux, catégorie, dates déduits du contexte |
| 9 | Conserver le contexte | Revenir en arrière ne perd jamais la saisie |
| 10 | Modèles | Gabarits pour tout ce qui se répète |
| 11 | Valeurs par défaut | Le cas le plus fréquent est déjà choisi |
| 12 | Annulation | Toute action destructrice est annulable, avec un délai visible |
| 13 | Pas d'alerte inutile | Une alerte qui ne change rien dans l'heure n'est pas une alerte |

---

## 57. Planification selon l'énergie

### 57.1 Classification

Chaque tâche porte un niveau d'énergie et une nature.

| Énergie | Nature |
|---|---|
| Faible | Administratif |
| Moyenne | Communication |
| Forte concentration | Créatif · Décision · Recherche |

La classification est **suggérée automatiquement** par type de tâche et corrigeable. On ne
demande pas à l'utilisateur de qualifier trente tâches à la main.

### 57.2 Utilisation

L'utilisateur peut déclarer son état en un geste, jamais obligatoire : « J'ai 30 minutes et
peu d'énergie ». Le système propose alors les tâches qui correspondent.

| Contexte déclaré | Ce que le système propose |
|---|---|
| 30 min, énergie faible | Classer des reçus, valider des heures, archiver la boîte de réception |
| 2 h, forte concentration | Rédiger la proposition, préparer la démonstration |
| 15 min entre deux rendez-vous | Deux appels courts, ou trois validations |
| Fin de journée | Fermeture de journée, voir section 60 |

### 57.3 Ce qu'il ne faut pas faire

Ne pas demander l'énergie à chaque ouverture. La question posée trop souvent devient une
friction, et une friction quotidienne finit par faire fermer l'outil. Le déclaratif est
disponible, jamais imposé.

---

## 58. Regroupement des tâches

### 58.1 Familles

Appels, courriels, factures à produire, factures à relancer, dépenses à classer, reçus à
joindre, heures à valider, approbations, recherches sur prospects, relances commerciales.

### 58.2 Proposition de session

Le système propose de grouper quand une famille atteint un seuil, par défaut quatre
éléments.

```
Vous avez 6 factures à vérifier, environ 25 minutes au total.
[ Faire une session de facturation ]      [ Plus tard ]
```

Pendant la session, l'interface reste la même d'un élément au suivant, les raccourcis sont
constants, et un compteur descend. C'est le changement de contexte qui coûte cher, pas le
travail.

### 58.3 Sessions naturelles à proposer

| Session | Contenu | Fréquence suggérée |
|---|---|---|
| Facturation | Produire les factures dues | Hebdomadaire |
| Recouvrement | Relances à préparer | Hebdomadaire |
| Comptabilité | Transactions, reçus, catégories | Hebdomadaire |
| Temps | Validation des heures | Hebdomadaire |
| Prospection | Relances et premiers contacts | 2 à 3 fois par semaine |
| Tri | Vider la boîte de réception | Quotidienne, courte |

---

## 59. Prévention des tâches fantômes

### 59.1 Détections, toutes déterministes

| Détection | Seuil | Action |
|---|---|---|
| Tâche sans date | — | Demande de date ou de suppression |
| Tâche sans responsable | — | Attribution |
| Tâche sans client ou mandat | — | Rattachement ou confirmation qu'elle est interne |
| Tâche sans prochaine action claire | Verbe vague détecté | Reformulation proposée |
| Tâche ouverte depuis plus de 30 jours | 30 j | Revue obligatoire |
| Tâche reportée 3 fois | 3 | Voir 59.2 |
| Mandat sans activité depuis 21 jours | 21 j | Revue |
| Facture en brouillon oubliée | 7 j | Envoyer ou supprimer |
| Proposition jamais envoyée | 5 j | Envoyer ou abandonner |
| Paiement reçu non affecté | 3 j | Affectation |
| Dépense sans justificatif | 14 j | Joindre ou justifier l'absence |

### 59.2 La tâche reportée trois fois

C'est le signal le plus riche du système. À la troisième, le report n'est plus proposé
seul. Une question à cinq choix apparaît :

1. Elle est trop grande → décomposer
2. Elle est bloquée → voir section 51
3. Elle n'est plus utile → supprimer, sans justification à fournir
4. Ce n'est pas à moi de la faire → déléguer
5. La date n'était pas réaliste → replanifier avec une estimation revue

**Le ton compte énormément ici.** La formulation est neutre et factuelle : « Cette tâche a
été reportée trois fois. Que faut-il en faire ? » Jamais « Vous repoussez cette tâche
depuis deux semaines ».

---

## 60. Fermeture de journée

Rituel facultatif, 5 à 10 minutes, proposé à une heure configurable, jamais imposé.

Huit étapes guidées, une par écran, chacune passable :

1. Marquer ce qui est terminé (liste des tâches ouvertes du jour, cases à cocher)
2. Replanifier ce qui reste (chaque tâche non faite reçoit une nouvelle date)
3. Traiter ce qui est urgent (seulement s'il en reste)
4. Confirmer les rendez-vous de demain
5. Vérifier les engagements pris aujourd'hui (extraits automatiquement des notes du jour)
6. Vérifier les factures à envoyer
7. Noter ce qui traîne en tête (capture rapide, champ libre, vide la mémoire de travail)
8. Choisir les trois priorités de demain

**L'étape 7 est celle à ne pas couper.** Écrire ce qui reste en tête est ce qui permet de
fermer l'ordinateur sans y penser le soir.

À la fin : « Demain commence par : envoyer la proposition à ABC. » Une seule phrase.

---

## 61. Revue hebdomadaire

Guidée, 20 à 30 minutes, proposée le vendredi après-midi ou le lundi matin, configurable.

| Bloc | Contenu | Décision attendue |
|---|---|---|
| Prospects | Sans suivi depuis 7 jours | Relancer, mettre en pause, abandonner |
| Clients | Sans prochaine action | En définir une |
| Mandats | En retard sur l'échéancier | Replanifier ou alerter le client |
| Facturation | À produire cette semaine | Produire ou reporter |
| Recouvrement | Impayées | Relancer ou escalader |
| Comptabilité | Dépenses non classées, reçus manquants, transactions non rapprochées | Session de comptabilité |
| Tâches | Reportées 3 fois ou plus | Les cinq choix de 59.2 |
| Contrats | À renouveler dans 60 jours | Préparer le renouvellement |
| Objectifs | Écart commercial et financier | Ajuster le plan |
| Trésorerie | Projection 90 jours | Agir si sous le seuil |
| Capacité | Heures engagées contre disponibles la semaine suivante | Refuser ou décaler |

Sortie de la revue : un plan de la semaine avec trois priorités, et une liste de ce qui a
été explicitement abandonné. **La liste des abandons est importante** : elle rend visible
que dire non est une décision prise, pas un oubli.

---

## 62. Mode minimum viable

### 62.1 Déclenchement

Accessible à tout moment par un bouton discret. Le système peut le **proposer** quand la
charge estimée dépasse largement le temps disponible, mais ne l'impose jamais et ne demande
jamais pourquoi.

### 62.2 Le calcul

Le mode retient uniquement ce qui protège, dans cet ordre : une échéance légale ou
contractuelle aujourd'hui, un client qui attend une réponse, de l'argent qui entre ou qui
sort, un engagement pris nommément pour aujourd'hui, une obligation de conformité.

Plafond de cinq éléments. Si le calcul en produit plus, on garde les cinq plus critiques et
on l'indique.

### 62.3 Affichage

```
Minimum viable · aujourd'hui · 38 minutes

  1. Envoyer la facture du client A            8 min   [ Commencer ]
  2. Répondre au client B                     12 min   [ Commencer ]
  3. Confirmer la rencontre de demain          3 min   [ Commencer ]
  4. Joindre le reçu manquant du 22            5 min   [ Commencer ]
  5. Relancer le paiement en retard           10 min   [ Commencer ]

  Le reste attendra. C'est correct.
```

La dernière phrase est la fonction principale de cet écran. Le mode ne sert pas seulement à
réduire la liste, il sert à autoriser explicitement à ne pas faire le reste.

---

## 63. Progression

### 63.1 Ce qui est affiché

Tâches terminées aujourd'hui, boîte de réception vidée, factures envoyées, montants
encaissés, prospects suivis, progression vers les objectifs financiers.

### 63.2 Ce qui est interdit

- Séries à ne pas rompre, qui punissent une journée de repos
- Animations, confettis, badges
- Scores de productivité personnelle
- Comparaisons à un idéal, à une moyenne, ou à une version antérieure de soi
- Notifications de rappel pour maintenir l'engagement avec l'outil
- Tout mécanisme conçu pour faire revenir plutôt que pour être utile

### 63.3 Le ton

Factuel. « 7 tâches terminées, 2 factures envoyées, 3 200 $ encaissés cette semaine. »
Aucun adjectif, aucune félicitation. Les chiffres suffisent, et ils respectent
l'intelligence de celui qui les lit.

---

## 64. Paramètres de la couche

Un écran dédié, tous les réglages par défaut du côté sobre.

| Paramètre | Valeurs | Défaut |
|---|---|---|
| Priorités visibles | 1 à 5 | 3 |
| Durée de session | 15, 25, 50, libre | 25 |
| Fréquence des rappels | Minimale, normale, fréquente | Minimale |
| Notifications | Critique seulement, importante et plus, toutes | Importante et plus |
| Densité visuelle | Aérée, normale, compacte | Normale |
| Niveau de détail | Essentiel, standard, complet | Standard |
| Affichage des échéances | Date, jours restants, les deux | Les deux |
| Temps tampon avant rendez-vous | 0 à 30 min | 15 min |
| Regroupement de tâches | Actif, inactif | Actif |
| Seuil de regroupement | 3 à 10 | 4 |
| Sons | Actifs, inactifs | Inactifs |
| Animations | Actives, réduites, aucune | Réduites |
| Mode concentration | Disponible, désactivé | Disponible |
| Fermeture de journée | Heure ou désactivée | 17 h |
| Revue hebdomadaire | Jour et heure ou désactivée | Vendredi 15 h |
| Couche complète | Active, inactive | Active |

La dernière ligne compte : la couche entière se désactive d'un geste, et le CRM redevient
un CRM ordinaire.

---

# PARTIE III — Agents, données, écrans, roadmap

## 65. Agent administratif exécutif

**Rôle** : coordonner prospection, mandats, facturation et comptabilité en une seule vue de
la journée. C'est l'agent qui répond à « par quoi je commence ».

**Entrées** : tâches ouvertes, engagements, échéances, factures à produire et à relancer,
dépenses non traitées, rendez-vous, temps disponible déclaré, préférences cognitives,
historique des durées réelles.

**Sorties** : plan de la journée avec trois priorités justifiées, charge estimée, éléments
reportables nommés, blocages détectés, minimum viable si demandé.

**Interdictions absolues** :

- Envoyer un message sensible sans autorisation
- Modifier une facture émise
- Supprimer une transaction
- Toucher à une déclaration de taxes verrouillée
- Créer une donnée qui n'existe pas
- Marquer une tâche terminée sans preuve déterministe
- Écrire une écriture comptable incertaine

**Niveau** : N2 pour tout ce qui produit un artefact, N1 pour les recommandations.

**Risque principal** : proposer un plan irréaliste qui décourage. Mitigation : le plan
utilise les durées **réelles observées**, pas les durées optimistes, et ne dépasse jamais
le temps déclaré disponible.

---

## 66. Agent de facturation

**Rôle** : préparer les factures, jamais les envoyer.

**Capacités** : identifier les heures approuvées non facturées, les jalons atteints, les
échéances récurrentes dues ; calculer les montants ; vérifier doublons, taxes, crédits,
dépenses remboursables ; assembler la facture en brouillon ; préparer le courriel d'envoi ;
créer la tâche de suivi ; détecter les retards et préparer les relances.

**Les sept contrôles avant de proposer une facture** :

1. Aucune entrée de temps déjà facturée (garanti par la contrainte d'unicité)
2. Aucune facture pour la même période et le même mandat
3. Codes de taxe valides à la date d'émission
4. Crédits disponibles appliqués
5. Dépenses remboursables incluses
6. Total recalculé et cohérent avec la somme des lignes
7. Client non suspendu

**Règle d'envoi** : toute première facture d'un client ou d'un plan est validée à la main.
Les suivantes d'un plan récurrent explicitement approuvé peuvent partir automatiquement, à
condition qu'aucun paramètre n'ait changé. Un changement renvoie en validation manuelle.

---

## 67. Agent comptable

**Rôle** : suggérer, jamais valider.

**Capacités** : suggérer une catégorie, associer un reçu à une transaction, associer un
paiement à une facture, détecter les doublons, préparer un rapprochement, lire les taxes sur
un reçu, préparer les rapports, identifier ce qui manque, signaler les anomalies, préparer
la fermeture d'une période.

**Les cinq états qu'il distingue toujours** :

| État | Signification | Affichage |
|---|---|---|
| Suggestion | Proposé, non appliqué | Gris, avec la confiance |
| Confirmé | Validé par un humain | Normal |
| À vérifier | Confiance insuffisante | Ambre, en tête de liste |
| Anomalie | Incohérence détectée | Rouge, avec l'explication |
| Correction proposée | Une erreur probable et son correctif | Ambre, avec avant et après |

**Interdictions** : valider une transaction incertaine, modifier une période verrouillée,
décider d'un traitement fiscal, supprimer quoi que ce soit.

---

## 68. Tables supplémentaires

Les 49 tables demandées, classées. **Vingt-neuf existent déjà.**

| Table demandée | Verdict | Correspondance |
|---|---|---|
| `chart_of_accounts` | 🟡 Partiel | `lib/accounting/export/account-mapping.ts`, à passer en base si surcharge par cabinet nécessaire |
| `accounting_periods` | ✅ | `AccountingPeriodLock` |
| `journal_entries` | ✅ | `JournalGeneralEntry` |
| `journal_entry_lines` | ❌ Ne pas créer | Mono-axe, option A section 0.3 |
| `bank_accounts` | 🆕 | À créer |
| `bank_transactions` | ✅ | `BankImportTransaction` |
| `bank_rules` | 🟡 | `ExpenseCategorizationRule` à généraliser |
| `bank_reconciliations` | 🆕 | À créer |
| `vendors` | 🆕 | Phase 2 |
| `expenses` | ✅ | `CabinetExpense`, `Expense` |
| `expense_categories` | ✅ | `ExpenseCategory` |
| `receipts` | ✅ | Champs `pieceStorageKey`, `pieceHash` sur la dépense. Pas de table séparée nécessaire |
| `bills` / `bill_payments` | 🆕 | Phase 2, avec `vendors` |
| `invoices` / `invoice_lines` | ✅ | `Invoice`, `InvoiceLine`, `InvoiceItem` |
| `invoice_payments` | ✅ | `PaymentAllocation` |
| `credit_notes` | ✅ | `CreditNote`, `CreditNoteApplication` |
| `refunds` | 🟡 | Statut sur `Payment` plutôt qu'une table |
| `payment_methods` | ✅ | enum `PaymentMethod` |
| `payment_transactions` | ✅ | `Payment` |
| `tax_codes` / `tax_rates` | 🆕 | À créer, une seule table `TaxCode` versionnée |
| `tax_returns` | 🆕 | Phase 2 |
| `products` / `services` | 🆕 | Une seule table `CatalogItem`, section 34 |
| `pricing_models` | 🆕 | `BillingArrangement`, section 33 |
| `hourly_rates` | 🆕 | `HourlyRate`, section 31 |
| `time_entries` | ✅ | `TimeEntry` |
| `time_approvals` | ✅ | Champs sur `TimeEntry`. Une table serait redondante |
| `retainers` | 🟡 | `TrustAccount` couvre la provision juridique. Pour SAFE Inc., un arrangement de type dépôt |
| `fixed_fee_agreements` | 🟡 | `ForfaitService` à généraliser en arrangement |
| `recurring_billing_plans` | 🆕 | Section 35 |
| `subscriptions` | 🟡 | Stripe côté client. Pas de table locale à créer |
| `billing_milestones` | 🆕 | Section 32 |
| `billing_schedules` | 🆕 | Section 32 |
| `revenue_recognition_schedules` | ❌ Ne pas créer | Comptabilité de caisse, option A. Sans objet |
| `budgets` / `forecasts` / `financial_goals` | 🆕 | Une seule table `FinancialGoal` plus un service de projection |
| `cognitive_preferences` | 🆕 | Section 64 |
| `focus_sessions` | 🟡 | `WorkSession` à étendre. **Ne pas dupliquer**, section 49.1 |
| `daily_priorities` | 🆕 | À créer |
| `task_energy_levels` | ❌ Ne pas créer | Deux colonnes sur `Task` |
| `task_deferrals` | 🆕 | À créer. C'est le signal de la section 59.2, il mérite sa table |
| `interruption_logs` | 🟡 | Champs de contexte sur `WorkSession` |
| `weekly_reviews` / `daily_shutdowns` | 🆕 | Une seule table `ReviewSession` avec un type |
| `inbox_items` | 🆕 | Section 54 |

**Bilan : 29 existent, 14 à créer, 6 refusées.** La commande demandait 49 tables, il en
reste 14 réellement nouvelles. C'est le résultat le plus utile de cet inventaire.

### 68.1 Les nouvelles tables, esquisse

```prisma
model BankAccount {
  id            String   @id @default(cuid())
  cabinetId     String
  nom           String
  institution   String?
  type          TypeCompteBancaire  // CHEQUE | EPARGNE | CARTE_CREDIT
  devise        String   @default("CAD")
  soldeOuverture Float   @default(0)
  dateOuverture DateTime
  actif         Boolean  @default(true)
  @@index([cabinetId, actif])
}

model BankReconciliation {
  id             String   @id @default(cuid())
  bankAccountId  String
  dateFin        DateTime
  soldeReleve    Float
  soldeCalcule   Float
  ecart          Float
  statut         StatutRapprochement  // EN_COURS | EQUILIBRE | ECART | VERROUILLE
  verrouilleAt   DateTime?
  verrouillePar  String?
  @@unique([bankAccountId, dateFin])
}

/// Code de taxe versionné. Une modification crée une ligne, n'écrase jamais :
/// sinon une facture émise l'an dernier devient irreproduisible.
model TaxCode {
  id            String   @id @default(cuid())
  code          String   // TPS_TVQ_QC | TVH_ON | HORS_CANADA | EXONERE
  nom           String
  province      String?
  tauxTps       Float    @default(0)
  tauxTvq       Float    @default(0)
  tauxTvh       Float    @default(0)
  effetDebut    DateTime
  effetFin      DateTime?
  source        String?  // référence de la règle appliquée
  actif         Boolean  @default(true)
  @@index([code, effetDebut])
}

/// Ce que SAFE Inc. vend. Source unique alimentant proposition, contrat,
/// mandat, échéancier, tâches et facture.
model CatalogItem {
  id              String   @id @default(cuid())
  code            String   @unique
  nom             String
  categorie       String
  descriptionCourte String
  descriptionLongue String?
  typeTarification TypeTarification  // FIXE | HORAIRE | RECURRENT | JALON | QUOTA
  prixStandard    Float?
  tauxHoraire     Float?
  frequence       String?
  taxCodeId       String?
  compteRevenu    String?
  dureeEstimeeMinutes Int?
  actif           Boolean  @default(true)
  effetDebut      DateTime
  effetFin        DateTime?
  /// Les tâches types créées automatiquement à la vente. Clé de la section 47.
  tachesTypes     Json?
  livrables       Json?
}

/// Un mandat porte N arrangements. C'est ce qui rend la facturation hybride
/// possible sans multiplier les systèmes.
model BillingArrangement {
  id          String   @id @default(cuid())
  mandatId    String
  catalogItemId String?
  type        TypeArrangement  // FIXE | ECHELONNE | JALON | RECURRENT | HORAIRE | QUOTA
  montant     Float?
  tauxHoraire Float?
  quotaHeures Float?
  tauxExcedent Float?
  reportSolde ReportSolde @default(PERDU)
  frequence   String?
  dateDebut   DateTime
  dateFin     DateTime?
  statut      String
  @@index([mandatId, statut])
}

/// Report de tâche. Trois reports déclenchent la question de la section 59.2.
model TaskDeferral {
  id            String   @id @default(cuid())
  taskId        String
  ancienneDate  DateTime?
  nouvelleDate  DateTime
  raison        String?
  cause         CauseReport?  // TROP_GRANDE | BLOQUEE | INUTILE | A_DELEGUER | DATE_IRREALISTE
  createdAt     DateTime @default(now())
  @@index([taskId, createdAt])
}

/// Tout ce qui n'est pas encore traité, en un seul endroit.
model InboxItem {
  id          String   @id @default(cuid())
  type        TypeInboxItem  // NOTE | COURRIEL | RECU | DOCUMENT | TRANSACTION |
                             // SUGGESTION | ENGAGEMENT | FACTURE | DEMANDE
  contenu     String
  sourceId    String?
  leadId      String?
  interpretation Json?      // ce que la capture rapide a compris
  statut      StatutInbox @default(EN_ATTENTE)
  traiteAt    DateTime?
  traiteEn    String?      // TACHE | DEPENSE | ARCHIVE | SUPPRIME
  createdAt   DateTime @default(now())
  @@index([statut, createdAt])
}
```

Les autres (`CognitivePreferences`, `DailyPriority`, `ReviewSession`, `FinancialGoal`,
`Vendor`, `Bill`, `HourlyRate`, `RecurringBillingPlan`, `BillingMilestone`, `Mandat`) suivent
le même esprit et seront détaillées au lot correspondant.

---

## 69. Écrans supplémentaires

| # | Écran | Route | Phase |
|---|---|---|---|
| F1 | Aujourd'hui | `/console` étendu | 1 |
| F2 | Capture rapide | Superposition globale | 1 |
| F3 | Boîte de réception administrative | `/console/inbox` | 1 |
| F4 | Mode concentration | Plein écran | 3 |
| F5 | Fermeture de journée | `/console/fermeture` | 3 |
| F6 | Revue hebdomadaire | `/console/revue` | 3 |
| F7 | Temps et chronomètre | `/console/temps` | 1 |
| F8 | Catalogue | `/console/catalogue-services` | 1 |
| F9 | Taux horaires | `/console/taux` | 1 |
| F10 | Forfaits et arrangements | `/console/arrangements` | 1 |
| F11 | Abonnements et plans récurrents | `/console/recurrent` | 4 |
| F12 | Échéanciers | `/console/echeanciers` | 2 |
| F13 | Factures | ✅ `/facturation` existe | — |
| F14 | Paiements | ✅ existe | — |
| F15 | Comptes clients | ✅ `/facturation/creances-aging` | — |
| F16 | Relances | 🟡 à étendre | 2 |
| F17 | Dépenses | ✅ existe | — |
| F18 | Fournisseurs | `/comptabilite/fournisseurs` | 2 |
| F19 | Reçus | 🟡 intégré aux dépenses | — |
| F20 | Transactions bancaires | ✅ import existe | — |
| F21 | Rapprochements | `/comptabilite/rapprochement` | 2 |
| F22 | Plan comptable | `/comptabilite/plan` | 2 |
| F23 | Écritures | ✅ journal existe | — |
| F24 | Taxes | ✅ `/facturation/taxes` | — |
| F25 | Rapports financiers | `/comptabilite/rapports` | 2 |
| F26 | Budget et objectifs | `/console/objectifs` | 2 |
| F27 | Prévision de trésorerie | `/console/tresorerie` | 2 |
| F28 | Paramètres cognitifs | `/console/parametres/confort` | 3 |

**Onze écrans sur vingt-huit existent déjà**, entièrement ou partiellement.

---

## 70. Workflows

### Workflow A — Prospect vers client

Couvert par la section 3 du document parent, prolongé par 42.1. Le point de jonction est la
conversion : elle crée en une transaction le cabinet, le contrat, le mandat, les
arrangements, l'échéancier, les tâches et la première facture en brouillon.

### Workflow B — Contrat au forfait par jalons

```
Catalogue « Implantation complète » 4 000 $
  → Mandat créé, arrangement JALON
  → 3 jalons : signature 40 %, configuration 30 %, lancement 30 %
  → 12 tâches types créées depuis le catalogue

Jalon 1 atteint (contrat signé)
  → Preuve : contrat au statut accepté
  → Agent de facturation prépare la facture de 1 600 $ plus taxes
  → Vous validez et envoyez
  → Tâche de suivi de paiement créée

Jalon 2 atteint (configuration livrée)
  → Preuve : les 7 tâches de configuration sont terminées
  → Même cycle

Jalon 3 (lancement)
  → Facture finale, solde
  → Mandat passe en accompagnement continu si un arrangement récurrent existe
```

### Workflow C — Contrat au taux horaire

```
Taux résolu par la cascade (section 31.2), enregistré avec sa raison
  → Saisie du temps, au chronomètre ou à la main
  → Session de validation hebdomadaire : approuver, ajuster, radier avec motif
  → Agent de facturation regroupe les heures approuvées de la période
  → Facture préparée, ligne par activité ou par jour selon le réglage
  → Vous validez, envoyez
  → invoiceLineId verrouille les entrées : elles ne peuvent plus être refacturées
```

### Workflow D — Abonnement avec heures incluses

```
Arrangement QUOTA : 300 $/mois, 3 heures incluses, 125 $/h au delà, solde perdu

En continu : barre de consommation, visible des deux côtés
  → 2 h 10 consommées le 18, alerte douce à 80 %

Fin de période :
  → Heures approuvées : 4 h 30
  → Incluses : 3 h. Excédent : 1 h 30 → 187,50 $
  → Facture unique : 300 $ abonnement + 187,50 $ excédent + taxes
  → Le quota se réinitialise, le solde inutilisé n'est pas reporté
```

### Workflow E — Dépense

```
Photo du reçu
  → Extraction par vision : fournisseur, date, montant, TPS, TVQ
  → Anti-doublon par empreinte du contenu, bloqué en base si déjà vu
  → Catégorie suggérée avec confiance, règle apprise si elle existe
  → Vous validez ou corrigez. Une correction crée une règle pour la suite
  → Dépense créée, écriture au journal
  → Plus tard : la transaction bancaire est importée et rapprochée
  → Si l'écart persiste, l'élément va en boîte de réception
```

### Workflow F — Journée guidée

```
Ouverture du CRM
  → Vue Aujourd'hui : une action, trois en dessous, charge estimée 3 h 20
  → Vous déclarez 2 h disponibles
  → Le système propose de reporter nommément deux éléments
  → « Commencer maintenant » sur la première : minuteur 25 min, document ouvert,
    brouillon prêt
  → Interruption : appel entrant. Capture rapide sans quitter : « rappeler Kim demain »
  → Reprise : le contexte est restitué, pas reconstruit
  → 17 h : fermeture de journée, 8 étapes, 6 minutes
  → « Demain commence par : envoyer la proposition à ABC »
```

### Workflow G — Revue hebdomadaire

Les onze blocs de la section 61, dans l'ordre, chacun avec sa décision. Sortie : trois
priorités pour la semaine, et la liste explicite de ce qui a été abandonné.

---

## 71. Critères d'acceptation

Format complet pour les trois fonctionnalités les plus structurantes. Les autres suivent le
même gabarit au lot correspondant.

### 71.1 Capture rapide

**Besoin** : noter une pensée sans perdre ce que je suis en train de faire.

**Scénario principal** : raccourci, saisie d'une phrase, interprétation proposée,
confirmation, retour à l'écran précédent en moins de 10 secondes.

**Scénarios alternatifs** : interprétation impossible, la note est enregistrée telle quelle
en boîte de réception. Client ambigu, le champ est marqué à préciser. Hors ligne, la note
est mise en file et synchronisée.

**Validations** : contenu non vide, longueur maximale 1 000 caractères.

**Permissions** : interne admin.

**Erreurs** : échec de l'interprétation, échec d'enregistrement. Dans les deux cas la note
n'est **jamais** perdue : conservation locale puis nouvelle tentative.

**Critères d'acceptation** :
- [ ] Le raccourci fonctionne depuis n'importe quel écran, y compris le mode concentration
- [ ] Une note sans interprétation possible est tout de même enregistrée
- [ ] La confirmation se fait en un geste
- [ ] Le retour se fait sur l'écran exact quitté, sans perte de saisie en cours
- [ ] Les six exemples de la section 53.2 produisent l'interprétation décrite
- [ ] Un échec réseau ne perd jamais la note

**Tests** : unitaire sur l'interprétation, intégration sur la persistance, test manuel du
retour de contexte, test hors ligne.

**Journalisation** : création, interprétation retenue, correction éventuelle.

### 71.2 Vue Aujourd'hui

**Besoin** : savoir par quoi commencer sans arbitrer moi-même.

**Critères d'acceptation** :
- [ ] Une seule action est mise en avant
- [ ] Le nombre d'éléments en « aussi aujourd'hui » respecte le paramètre, 3 par défaut
- [ ] La charge estimée est affichée et correspond à la somme des durées
- [ ] Les niveaux inférieurs sont repliés, avec un compteur exact
- [ ] Quand rien n'est urgent, la phrase de clôture s'affiche
- [ ] Quand la charge dépasse le temps déclaré, des reports sont proposés nommément
- [ ] La page se charge en moins d'une seconde avec 500 tâches ouvertes

**Sécurité** : aucune donnée d'un autre cabinet n'apparaît. Un test le vérifie.

### 71.3 Facturation d'un arrangement à quota

**Critères d'acceptation** :
- [ ] Seules les heures **approuvées** consomment le quota
- [ ] Une heure radiée ne le consomme pas
- [ ] L'excédent est calculé en fin de période, jamais en cours
- [ ] Une même heure ne peut pas consommer le quota et être facturée séparément
- [ ] Le solde inutilisé suit la règle de report configurée
- [ ] La facture montre séparément l'abonnement, l'excédent et les taxes
- [ ] Une seconde exécution sur la même période ne crée pas de seconde facture

---

## 72. Roadmap révisée en quatre phases

Cette roadmap remplace celle du document parent, en l'intégrant.

### Phase 1 — Vendre et encaisser · 8 à 10 semaines

| Lot | Contenu | Origine |
|---|---|---|
| L1 | Garde de sécurité Console, tests P0 | Parent |
| L2 | Conversion Lead → Cabinet, avec le volet financier de 42.1 | Parent + 42 |
| L3 | Consentement, adresse postale, anti-doublon d'envoi | Parent |
| L4 | Webhooks Resend, table `Communication` | Parent |
| L5 | Extraction de tâches depuis les notes | Parent |
| **L6** | **`Mandat`, `CatalogItem`, `HourlyRate`, `BillingArrangement`** | 30, 31, 33, 34 |
| **L7** | **Vue Aujourd'hui étendue, capture rapide, boîte de réception** | 45, 53, 54 |
| L8 | Import CSV et dédoublonnage | Parent |
| L9 | Bascule conversion, compteur des 10 places | Parent |

### Phase 2 — Comptabilité interne · 6 à 8 semaines

`BankAccount`, `BankReconciliation`, `TaxCode`, fournisseurs et factures à payer, champs
manquants sur les dépenses et les paiements, rapports financiers de 40.1, objectifs et
prévision de trésorerie, plan comptable en base.

### Phase 3 — Couche cognitive · 6 à 8 semaines

Décomposition, démarrage guidé, minuteur intégré à `WorkSession`, mode concentration,
« je suis bloqué », reprise après interruption, planification par énergie, regroupement,
tâches fantômes, fermeture de journée, revue hebdomadaire, mode minimum viable, paramètres,
agent administratif exécutif.

### Phase 4 — Automatisation supervisée · au delà

Facturation récurrente, agent de facturation, agent comptable, prévisions, apprentissage,
automatisations autorisées, détection avancée des risques.

### 72.1 Pourquoi cet ordre, et où je ne suis pas d'accord avec la commande

La commande place la couche cognitive en phase 3. **Je déplace deux de ses composants en
phase 1** : la vue Aujourd'hui étendue et la capture rapide.

Raison : ce sont les deux seuls éléments de toute cette extension qui vous rendent du temps
**dès la première semaine**, et ils ne dépendent de rien. Les repousser de six mois, c'est
se priver six mois d'un gain immédiat pour construire d'abord la plomberie qui le rendra
marginalement meilleur.

Le reste de la couche cognitive reste en phase 3, à juste titre : le mode concentration, la
revue hebdomadaire et la planification par énergie supposent des données d'usage que vous
n'aurez pas avant plusieurs mois.

### 72.2 Le rappel de la section 25.4 du document parent

L'ensemble décrit ici représente sept à huit mois de développement à temps partiel. Le
risque nommé dans le document parent tient toujours, et il grossit avec chaque page ajoutée
au cahier des charges : **construire le système au lieu de vendre**.

Ce qui change avec cette extension, c'est que le lot 6 et le lot 7 sont défendables même
sous cette contrainte. Le lot 6 vous permet de facturer proprement vos premiers clients, le
lot 7 vous fait gagner du temps tous les jours. Le reste attend le volume.

---

## 73. Cohérence de l'ensemble

### 73.1 Le principe unificateur

Un seul système, pas quatre. Ce qui le rend unique n'est pas une base de données partagée,
c'est que **chaque événement propage ses conséquences** dans les trois autres domaines.

### 73.2 Table de propagation

| Événement | Conséquence commerciale | Conséquence administrative | Conséquence financière |
|---|---|---|---|
| Opportunité gagnée | Lead → client | Mandat, tâches, échéancier | Prévision de revenus, capacité |
| Heure saisie | — | Consomme le quota | Ligne de facture potentielle |
| Forfait accepté | Contrat | Jalons, tâches | N factures programmées |
| Facture envoyée | Relation en cours | Tâche de suivi | Créance, trésorerie attendue |
| Paiement reçu | Client à jour | Tâche de recouvrement fermée | Journal, taxes, solde |
| Dépense liée à un client | — | Justificatif à joindre | Refacturable, marge du mandat |
| Tâche oubliée | — | — | **Facturation retardée** |
| Facture non envoyée | — | — | **Trésorerie décalée** |
| Prospect sans suivi | Opportunité qui refroidit | — | **Revenu futur en baisse** |
| Trop de tâches | — | **Repriorisation** | Capacité dépassée, refuser le prochain mandat |

Les quatre dernières lignes sont celles qui justifient tout ce document. Ce sont des
conséquences financières d'oublis administratifs, et aucun outil séparé ne peut les voir.

### 73.3 Le test de cohérence

Le système est cohérent le jour où il peut répondre, sans qu'on ait rien ressaisi :

> « Il me manque 2 400 $ pour atteindre mon objectif du mois. J'ai 3 factures prêtes à
> produire pour 1 900 $, 6 heures approuvées non facturées pour 750 $, et 2 prospects
> chauds dont la valeur couvrirait l'écart. Voici par quoi commencer. »

Aucune de ces informations n'est nouvelle. Elles existent déjà, dans quatre coins
différents. Les relier est tout le travail.

---

## Annexe — Ce qui a été refusé et pourquoi

| Demande | Refus | Motif |
|---|---|---|
| Module comptable séparé dans le CRM | Refusé | Détruit le dog food, double la maintenance (section 0.2) |
| Bilan, balance de vérification | Refusé sous l'option A | Impossible en mono-axe. Produit par le comptable depuis l'export |
| `journal_entry_lines` | Refusé | Suppose la partie double interne |
| `revenue_recognition_schedules` | Refusé | Sans objet en comptabilité de caisse |
| Immobilisations et amortissement complets | Refusé | Un champ et une liste suffisent à votre échelle |
| 24 catégories de dépenses | Réduit à 15 | Un plan trop fin devient incohérent |
| `focus_sessions` séparée | Refusé | `WorkSession` existe. Le temps de concentration et le temps facturable sont le même objet |
| `task_energy_levels` | Refusé | Deux colonnes suffisent |
| Agrégation bancaire automatique | Déconseillé | Coût récurrent contre cinq minutes par mois |
| Séries, badges, animations | Interdit | Section 63.2 |
| Envoi automatique des relances | Refusé | Votre marché est petit, une relance à quelqu'un qui vient de payer coûte plus que le temps gagné |



