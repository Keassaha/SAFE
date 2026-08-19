# Recherche — Le calcul du patrimoine familial au Québec

**Date de recherche** : 2026-08-19
**Standard de preuve** : risque ÉLEVÉ (juridique, et un chiffre erroné finit dans une procédure signée sous serment)
**Destinataire** : construction du calculateur `calc-patrimoine-familial` (REGLE_DE_BUILD.md §5bis)
**Décision que cette recherche doit permettre** : écrire une fonction de calcul juste, et savoir ce qu'elle ne doit surtout pas prétendre trancher.

---

## 1. Question de départ

Quelle est la règle exacte de composition, d'évaluation et de partage du patrimoine
familial québécois, et quelles sont les zones où un calcul automatique produirait un
chiffre faux ou trompeur ?

Périmètre : Québec seulement. Deux régimes distincts, le patrimoine familial des époux
et conjoints unis civilement, et le patrimoine d'union parentale entré en vigueur le
30 juin 2025.

Hors périmètre : la société d'acquêts, la prestation compensatoire, la pension
alimentaire. Ce sont trois calculs différents, et les confondre est la première façon
de se tromper.

---

## 2. Résumé exécutif

**Le calcul tient en trois temps** : établir la valeur nette du patrimoine à la date
d'évaluation, en déduire ce qui appartenait déjà à un époux avant le mariage ou qui
vient d'un héritage, puis diviser en deux. `VERIFIE`

**Le piège est au deuxième temps.** La déduction de la plus-value n'est pas une
soustraction, c'est une **proportion** : on déduit la plus-value acquise dans le même
rapport que celui qui existait, au moment du mariage, entre la valeur nette et la
valeur brute du bien. Un tableur qui déduit la plus-value en entier, ou qui ne la
déduit pas du tout, se trompe dans les deux sens selon le dossier. `VERIFIE`

**Deux régimes qui se ressemblent et ne se calculent pas pareil.** Le patrimoine
d'union parentale n'inclut ni les régimes de retraite ni les gains du Régime de rentes
du Québec, sa date de référence n'est pas le mariage mais le moment où le bien entre
au patrimoine, et il admet quatre sources d'apport déductible au lieu d'une. `VERIFIE`

**Un formulaire officiel existe et s'impose.** Le formulaire de calcul de l'état du
patrimoine familial est établi par directive du juge en chef, et sa production sous
serment est obligatoire dans les 180 jours de la signification. Un calculateur qui ne
produit pas ce formulaire ne remplace pas le travail, il le double. `VERIFIE`

**Quatre situations n'ont pas de réponse dans le texte** et ne doivent donc pas être
tranchées par du code : la valeur nette négative au mariage, la moins-value, le
patrimoine net négatif, et le partage inégal de l'article 422. Elles sont listées au
§6.

---

## 3. Faits vérifiés

Sauf mention contraire, source primaire : Code civil du Québec, texte consulté sur
Légis Québec le 2026-08-19.

### 3.1 Ce qui compose le patrimoine familial `VERIFIE`

Art. 415 al. 1. Sans égard à celui des deux époux qui en est propriétaire :

- les résidences de la famille, ou les droits qui en confèrent l'usage ;
- les meubles qui les garnissent ou les ornent **et** qui servent à l'usage du ménage ;
- les véhicules automobiles **utilisés pour les déplacements de la famille** ;
- les droits accumulés **durant le mariage** au titre d'un régime de retraite.

Art. 415 al. 2. S'y ajoutent les gains inscrits durant le mariage au nom de chaque
époux en application de la *Loi sur le régime de rentes du Québec*.

Deux qualificatifs font tout le travail et sont souvent oubliés : les meubles doivent
servir **à l'usage du ménage**, et les véhicules doivent être utilisés **pour les
déplacements de la famille**. Un bien qui ne remplit pas la condition d'usage n'entre
pas, même s'il est de la bonne catégorie.

### 3.2 Ce qui en est exclu `VERIFIE`

Art. 415 al. 4 : les biens échus à l'un des époux **par succession ou donation**, avant
ou pendant le mariage.

Art. 415 al. 3, cas particulier du décès : si la dissolution résulte du décès, sont en
outre exclus les gains du Régime de rentes **et** les droits accumulés au titre d'un
régime de retraite régi ou établi par une loi qui accorde au conjoint survivant le
droit à des prestations de décès.

**Conséquence pour un calculateur** : le même couple, avec les mêmes biens, n'a pas le
même patrimoine partageable selon que l'union se dissout par divorce ou par décès. La
cause de dissolution est donc une entrée obligatoire, jamais une option.

### 3.3 La date d'évaluation `VERIFIE`

Art. 417 al. 1. Les biens et les dettes s'évaluent à la **valeur marchande** :

- à la date du décès de l'époux ; ou
- à la date d'introduction de l'instance en séparation de corps, divorce ou nullité.

Art. 417 al. 2. Le tribunal **peut**, à la demande d'un époux, retenir plutôt la date à
laquelle les époux ont **cessé de faire vie commune**.

C'est une faculté du tribunal, pas un choix des parties. Un calculateur peut proposer
les deux scénarios côte à côte ; il ne peut pas présenter le second comme acquis.

### 3.4 Les dettes déductibles `VERIFIE`

Art. 416 et 417. Seules les dettes contractées **pour l'acquisition, l'amélioration,
l'entretien ou la conservation** des biens du patrimoine. Une dette de consommation
sans lien avec un bien du patrimoine ne se déduit pas ici.

### 3.5 Les déductions de l'article 418, et la formule exacte `VERIFIE`

Art. 418 al. 1, deux déductions distinctes :

1. **Bien possédé au moment du mariage** : on déduit sa **valeur nette au moment du
   mariage**.
2. **Apport fait pendant le mariage** pour acquérir ou améliorer un bien du
   patrimoine, **lorsque cet apport provient de biens échus par succession ou donation,
   ou de leur remploi** : on déduit la valeur de cet apport.

Art. 418 al. 2, la déduction de plus-value, qui est une proportion :

- premier cas : la plus-value acquise pendant le mariage, **dans la même proportion que
  celle qui existait, au moment du mariage, entre la valeur nette et la valeur brute du
  bien** ;
- second cas : la plus-value acquise depuis l'apport, **dans la même proportion que
  celle qui existait, au moment de l'apport, entre la valeur de l'apport et la valeur
  brute du bien**.

Art. 418 al. 3 : le remploi pendant le mariage d'un bien du patrimoine possédé lors du
mariage donne lieu aux mêmes déductions, avec les adaptations nécessaires.

**Formule, premier cas.** Pour un bien possédé au mariage :

```
VB_m  valeur brute (marchande) au mariage
D_m   dettes déductibles au mariage
VN_m  = VB_m - D_m                      valeur nette au mariage
VB_p  valeur brute à la date d'évaluation
D_p   dettes déductibles à la date d'évaluation
VN_p  = VB_p - D_p                      valeur nette à la date d'évaluation

plus-value brute  = VB_p - VB_m
proportion        = VN_m / VB_m
déduction PV      = (VB_p - VB_m) x (VN_m / VB_m)

valeur partageable = VN_p - VN_m - déduction PV
part de chaque époux = valeur partageable / 2
```

**Vérification croisée sur un cas chiffré.** Source secondaire, Éducaloi, exemple 2 :
maison valant 100 000 $ au mariage avec 40 000 $ d'hypothèque, valant 200 000 $ au
partage avec 25 000 $ d'hypothèque.

| Étape | Calcul | Résultat |
|---|---|---|
| Valeur nette au mariage | 100 000 − 40 000 | 60 000 $ |
| Valeur nette au partage | 200 000 − 25 000 | 175 000 $ |
| Plus-value brute | 200 000 − 100 000 | 100 000 $ |
| Proportion | 60 000 ÷ 100 000 | 0,60 |
| Déduction de plus-value | 100 000 × 0,60 | 60 000 $ |
| **Valeur partageable** | 175 000 − 60 000 − 60 000 | **55 000 $** |
| Part de chaque époux | 55 000 ÷ 2 | **27 500 $** |

La formule tirée du texte et l'exemple publié donnent le même résultat au dollar près.
`VERIFIE`

### 3.6 Les régimes de retraite ont leur propre plafond `VERIFIE`

Art. 426 al. 2. Le partage des droits accumulés au titre d'un régime de retraite régi
ou établi par une loi **ne peut en aucun cas** avoir pour effet de priver le titulaire
de plus de la **moitié de la valeur totale des droits qu'il a accumulés avant ou
pendant le mariage**.

C'est un plafond, calculé sur une assiette différente de celle du partage lui-même : la
totalité des droits, y compris ceux accumulés **avant** le mariage, alors que le
patrimoine ne comprend que ceux accumulés **durant** le mariage.

Art. 425. Le partage des gains du Régime de rentes est **exécuté par l'organisme qui
administre le régime**, pas par les parties. Un calculateur peut en estimer l'effet ; il
ne produit pas le partage.

### 3.7 On ne peut pas renoncer d'avance `VERIFIE`

Art. 423 al. 1. Les époux **ne peuvent renoncer**, par contrat de mariage ou autrement,
à leurs droits dans le patrimoine familial.

Art. 423 al. 2 et 3. La renonciation n'est possible qu'**à compter** du décès ou du
jugement, par acte notarié en minute ou par déclaration judiciaire. Elle doit être
inscrite au registre des droits personnels et réels mobiliers ; à défaut d'inscription
dans **un an** du jour de l'ouverture du droit au partage, l'époux renonçant est
**réputé avoir accepté**.

Ce délai d'un an est une échéance opérationnelle, pas seulement une règle de fond.

### 3.8 Le formulaire officiel et ses délais `VERIFIE`

Règlement de la Cour supérieure du Québec en matière familiale, C-25.01, r. 0.2.4,
art. 27 :

- la partie demanderesse doit communiquer et produire au dossier, **dans les 180 jours
  de la signification**, soit une déclaration de non-assujettissement, soit une
  renonciation, soit une déclaration que le partage n'est pas contesté, soit **un
  formulaire de calcul de l'état du patrimoine familial appuyé d'un serment** ;
- si la partie défenderesse conteste, elle produit son propre formulaire sous serment
  **dans les 30 jours** de la communication ;
- le formulaire est **préparé selon le formulaire établi par directive du juge en
  chef**, publié sur le site de la Cour supérieure.

Art. 28 : la partie qui renonce au partage des droits de retraite ou des gains du
Régime de rentes doit **confirmer connaître l'importance de la valeur partageable et la
possibilité d'en connaître le montant exact**.

Ces deux délais correspondent aux règles déjà codées dans
`lib/dossiers/delais-famille.ts` (`REGL_27_SIGNIFICATION` à 180 jours,
`REGL_27_CONTESTATION` à 30 jours). Le code et le texte concordent. `VERIFIE`

### 3.9 Le patrimoine d'union parentale, régime distinct `VERIFIE`

En vigueur le **30 juin 2025** (2024, c. 22, art. 3). S'applique de plein droit aux
conjoints de fait qui deviennent parents d'un même enfant après le 29 juin 2025 ; les
conjoints déjà parents à cette date peuvent y adhérer d'un commun accord. `VERIFIE`
(date et champ d'application confirmés par la Chambre des notaires du Québec, source
secondaire institutionnelle ; le texte du Code confirme le régime lui-même)

Différences qui changent le calcul :

| | Patrimoine familial (art. 414-426) | Patrimoine d'union parentale (art. 521.29-521.36) |
|---|---|---|
| Résidences, meubles, véhicules | oui | oui |
| Régimes de retraite | **oui** | **non** |
| Gains du Régime de rentes | **oui** | **non** |
| Date de référence des déductions | le **mariage** | le moment où le bien **entre au patrimoine** |
| Apport déductible, sources | succession, donation, ou leur remploi | **quatre** sources, dont les biens accumulés avant l'union et les **fruits et revenus** de ceux-ci |
| Retrait du régime possible | **non** (art. 423) | **oui**, par acte notarié en minute |
| Exclusion d'un bien par convention | non prévue | oui, par acte notarié |

Deux règles de l'union parentale sont contre-intuitives et méritent d'être écrites en
toutes lettres dans un outil :

- **Retrait dans les 90 jours du début de l'union** : le patrimoine est réputé n'avoir
  **jamais été constitué** (art. 521.33 al. 2). Après 90 jours, le retrait ne vaut que
  pour l'avenir.
- **Exclure un bien ne le retire pas du calcul.** Art. 521.35 al. 2 : la valeur nette du
  patrimoine **comprend également** celle du bien exclu par les conjoints, établie **au
  moment de l'exclusion**. Un tableur qui efface simplement la ligne du bien exclu
  produit un chiffre faux.

---

## 4. Analyse détaillée : ce qu'un calcul automatique doit faire

### 4.1 L'ordre des opérations n'est pas commutatif

Le texte impose une séquence : établir la valeur nette du patrimoine (art. 417),
**puis** en déduire (art. 418, « une fois établie la valeur nette »), **puis** diviser
(art. 416). Déduire avant d'établir la valeur nette produit un résultat différent dès
qu'il y a plusieurs biens, parce que les déductions d'un bien ne peuvent pas absorber la
valeur d'un autre.

`INFERENCE` : la déduction se calcule **bien par bien**, et le solde négatif d'un bien
ne devrait pas venir réduire la valeur partageable d'un autre. Le texte ne le dit pas
explicitement ; il découle de ce que chaque déduction est rattachée à « un bien ». À
confirmer auprès d'un praticien avant de coder un plancher à zéro par bien.

### 4.2 Les entrées minimales par bien

Pour chaque bien du patrimoine, un calcul juste exige six valeurs, pas deux :

1. la catégorie (résidence, meuble, véhicule, régime de retraite, gains RRQ) ;
2. la valeur brute à la date d'évaluation ;
3. les dettes déductibles à la date d'évaluation ;
4. la valeur brute à la date de référence (mariage, ou entrée au patrimoine) ;
5. les dettes déductibles à cette même date ;
6. les apports par succession ou donation pendant l'union, avec leur date et la valeur
   brute du bien à ce moment.

Un formulaire qui ne demande que la valeur actuelle et la valeur au mariage ne peut pas
appliquer l'article 418. C'est probablement la principale cause d'erreur des tableurs
maison.

### 4.3 Les garde-fous arithmétiques

`INFERENCE`, tirée de la formule elle-même :

- **Division par zéro** : la proportion est `VN_m / VB_m`. Si la valeur brute au mariage
  est nulle, la proportion est indéfinie. Le cas se présente si quelqu'un saisit une
  dette sans valeur. L'outil doit refuser, pas produire un infini.
- **Proportion supérieure à 1** : impossible si les dettes sont positives. Une
  proportion supérieure à 1 signale une saisie incohérente.
- **Arrondi** : les montants se manipulent au cent. Arrondir la proportion avant de
  multiplier crée un écart de plusieurs dollars sur une résidence. Arrondir seulement
  le résultat final.

---

## 5. Risques et limites

**Ce n'est pas un avis juridique et l'outil ne doit pas le laisser croire.** L'avocate
signe le formulaire sous serment. Un calculateur qui affiche un chiffre sans montrer son
chemin lui demande de jurer sur une boîte noire.

**Le formulaire officiel n'a pas pu être consulté directement.** Le site de la Cour
supérieure bloque les outils automatisés par Cloudflare, et je n'ai pas contourné cette
protection. La structure exacte du formulaire (ses parties, ses lignes, ses totaux) est
donc `A_CONFIRMER` : elle demande une ouverture humaine du fichier
`cs-patrimoine-familial.xls`.

**La source secondaire utilisée pour la vérification croisée est Éducaloi**, organisme
reconnu mais non officiel. Elle confirme la formule tirée du texte primaire ; elle ne
la fonde pas.

**Aucune jurisprudence n'a été dépouillée.** Les quatre zones du §6 se tranchent en
jurisprudence, pas dans le texte, et cette recherche ne les a pas explorées.

---

## 6. Les quatre zones que le code ne doit pas trancher `A_CONFIRMER`

Ces quatre situations n'ont **pas** de réponse dans les articles 414 à 426. Un
calculateur qui affiche un chiffre s'y trompe sans le dire. Il doit s'arrêter, nommer la
situation, et laisser l'avocate décider.

1. **Valeur nette négative au moment du mariage.** Si les dettes dépassaient la valeur
   du bien au mariage, la proportion `VN_m / VB_m` est négative, et la déduction de
   plus-value devient un ajout. Le texte ne l'envisage pas.

2. **Moins-value.** Si le bien a perdu de la valeur, `VB_p - VB_m` est négatif. Le texte
   parle de « plus-value acquise », donc d'un gain. Faut-il déduire un montant négatif,
   c'est-à-dire ajouter ? Le texte ne le dit pas.

3. **Valeur partageable négative pour un bien.** Le solde peut être négatif après
   déductions. Faut-il le plancher à zéro, ou le laisser compenser un autre bien ? Voir
   §4.1.

4. **Partage inégal.** Art. 422 : le tribunal peut déroger au partage égal en cas
   d'injustice, notamment pour brève durée du mariage, dilapidation ou mauvaise foi.
   C'est une appréciation judiciaire. Un outil peut la signaler comme possible ; il ne
   peut pas la chiffrer.

---

## 7. Recommandations pour la construction

1. **Coder d'abord le cas nominal, et refuser les quatre zones du §6** avec une phrase
   qui nomme la situation. Un outil qui dit « ce cas se tranche en jurisprudence, voici
   pourquoi » vaut mieux qu'un outil qui donne un nombre.

2. **Afficher le chemin, pas seulement le résultat.** Chaque ligne du calcul avec son
   article. C'est la condition 3 du §5bis de la règle de build, et c'est aussi ce qui
   permet à l'avocate de jurer en connaissance de cause.

3. **Demander la cause de dissolution en premier**, avant tout bien : elle change la
   composition du patrimoine (§3.2).

4. **Traiter les deux régimes comme deux calculs**, pas comme un calcul avec une case à
   cocher. Leurs dates de référence et leurs assiettes diffèrent.

5. **Ne pas prétendre produire le formulaire officiel** tant que sa structure n'a pas
   été vérifiée sur le fichier réel. Produire un état de calcul lisible, et dire
   explicitement que le formulaire assermenté reste à remplir.

6. **Ne pas toucher aux régimes de retraite dans la première version.** Le plafond de
   l'article 426 se calcule sur une assiette différente, et l'article 425 confie le
   partage des gains du Régime de rentes à Retraite Québec. Une première version
   honnête traite les résidences, les meubles et les véhicules, et dit clairement
   qu'elle s'arrête là.

---

## 8. Sources

**Primaires**

- Code civil du Québec, art. 414 à 426 (patrimoine familial) et art. 521.20 à 521.36
  (union parentale), texte consulté le 2026-08-19 sur
  [Légis Québec](https://www.legisquebec.gouv.qc.ca/fr/document/lc/ccq-1991).
- Règlement de la Cour supérieure du Québec en matière familiale, C-25.01, r. 0.2.4,
  art. 26 à 29, consulté le 2026-08-19 sur
  [Légis Québec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/C-25.01,%20r.%200.2.4).

**Secondaires**

- [Chambre des notaires du Québec](https://www.cnq.org/la-chambre-et-votre-protection/actualites-et-salle-de-presse/adoption-du-projet-de-loi-n-56-le-nouveau-regime-dunion-parentale-verra-le-jour-le-30-juin-2025/),
  date d'entrée en vigueur du régime d'union parentale.
- [Éducaloi, exemples de calculs et de partage du patrimoine familial](https://educaloi.qc.ca/capsules/exemples-de-calculs-et-de-partage-du-patrimoine-familial/),
  vérification croisée de la formule de plus-value proportionnelle.

**Non consultée, et à ouvrir par un humain**

- Formulaire de calcul de l'état du patrimoine familial, Cour supérieure du Québec,
  fichier `cs-patrimoine-familial.xls`. Site protégé par Cloudflare, non contourné.
