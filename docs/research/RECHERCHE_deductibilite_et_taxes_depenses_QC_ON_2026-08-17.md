# Déductibilité des dépenses et récupération des taxes — cabinet juridique QC et ON

Date de recherche: 2026-08-17
Auteur: Claude Code (session SAFE)
Statut: review
Perimetre: reglementaire

## Question de depart

Quelles règles doivent être codées dans SAFE pour que les dépenses d'un cabinet portent leur taxe récupérable et leur part déductible, au Québec comme en Ontario, sans qu'aucun taux ne soit inventé ?

Ce document est le **lot 0** de [SPEC_DEPENSES_ET_PREPARATION_FISCALE.md](../accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md). Rien ne se code avant lui.

## Resume executif

- **Les seuils de pièce justificative sont 100 $ et 500 $, pas 30 $ et 150 $.** Fédéral et Québec sont alignés sur les mêmes paliers. La valeur périmée 30 $/150 $ circule encore largement ; l'avoir codée de mémoire aurait produit une exigence fausse dans les deux sens.
- **Sous 100 $, le numéro d'inscription du fournisseur n'est pas exigé, mais le montant de taxe l'est pour la TVQ.** Le Québec est donc plus exigeant que le fédéral sur les petits montants. Une règle unique pour les deux régimes serait fausse au Québec.
- **La règle des 50 % sur les repas s'applique DEUX fois** : sur la déduction au revenu, et sur le crédit de taxe. Ne l'appliquer qu'à la déduction laisserait la moitié de la taxe réclamée à tort.
- **Le Québec ajoute un plafond fondé sur le chiffre d'affaires annuel**, en plus des 50 %. Une déductibilité codée comme un simple pourcentage par catégorie est donc **structurellement insuffisante au Québec** : il faut un calcul de fin d'année.
- **Le véhicule n'a pas de taux** : sa part déductible est le rapport des kilomètres d'affaires sur les kilomètres totaux. Sans registre, le prorata n'est pas défendable, seulement déclaré.
- **Le délai de réclamation des taxes est de quatre ans**, la conservation des pièces de six ans. Les deux sont des contraintes produit, pas des détails.

## Methode

- Sources prioritaires consultees: Agence du revenu du Canada (guide RC4022, formulaire T2125), Revenu Québec, ministère des Finances du Québec (recueil des dépenses fiscales 2025).
- Periode couverte: état du droit consulté le 2026-08-17.
- Limites: les sites de l'ARC et de Revenu Québec refusent la récupération automatisée (HTTP 403) ; les pages ont été lues via navigateur. Le guide québécois IN-155, qui porte le détail des paliers de plafond, n'a pas été lu intégralement (voir « Points à confirmer »). Aucune source secondaire n'a servi à établir un fait, seulement à orienter la recherche.

## Faits verifies

### 1. Pièces justificatives exigées pour récupérer la taxe

- `VERIFIE` Les renseignements exigés varient selon **trois paliers de valeur totale de la vente, taxes comprises** : moins de 100 $, de 100 $ à 499,99 $, et 500 $ ou plus. Fédéral et Québec emploient les mêmes paliers.
Source: ARC, RC4022 « Input tax credit information requirements » ; Revenu Québec, « Préparation des factures ».

- `VERIFIE` Répartition des exigences (régime québécois, TPS et TVQ) :

| Renseignement | < 100 $ | 100 $ à 499,99 $ | 500 $ et + |
|---|---|---|---|
| Nom du fournisseur ou de l'intermédiaire | requis | requis | requis |
| Date de la facture | requis | requis | requis |
| Montant total | requis | requis | requis |
| Montant de taxe applicable | **TVQ seulement** | requis | requis |
| N° d'inscription TPS et TVQ du fournisseur | non requis | requis | requis |
| Nom de l'acheteur | non requis | non requis | requis |
| Modalités de paiement | non requis | non requis | requis |
| Description du bien ou service | **TVQ seulement** | **TVQ seulement** | requis |

Source: Revenu Québec, « Préparation des factures ».

- `VERIFIE` Un reçu de restaurant ou de taxi qui n'indique pas le montant de taxe payé ou payable **ne satisfait pas** aux exigences documentaires générales.
Source: ARC, mémorandum 8-4 « Documentary Requirements for Claiming Input Tax Credits ».

### 2. Délais

- `VERIFIE` **Quatre ans** pour réclamer un CTI ou un RTI : au plus tard à la date d'échéance de la déclaration de la dernière période se terminant quatre ans après la fin de la période où le crédit aurait pu être demandé la première fois. Réduit pour les institutions financières désignées et pour les entreprises dont les ventes taxables dépassent 6 M$ sur chacun des deux exercices précédents.
Source: ARC, RC4022 « Time limits for claiming ITCs » ; Revenu Québec, « Comment demander des CTI et des RTI ».

- `VERIFIE` **Six ans** de conservation des registres et pièces, à compter de la fin de la dernière année à laquelle ils se rapportent. Prolongé en cas d'opposition ou d'appel jusqu'à décision finale.
Source: Revenu Québec, « Tenue de registres et conservation des pièces justificatives » ; ARC, « Motor vehicle records ».

### 3. Repas et représentation

- `VERIFIE` La déduction au revenu est limitée à **50 %** du moindre des montants prévus. Les limites s'appliquent aussi aux repas pris en voyage, en congrès ou en séminaire.
Source: ARC, T2125 ligne 8523 « Repas et frais de représentation » ; ministère des Finances du Québec, fiche 230105.

- `VERIFIE` **La limite de 50 % s'applique aussi au crédit de taxe.** Quand la déduction au revenu est limitée à 50 %, seuls 50 % de la TPS/TVH payée sur ces dépenses sont réclamables en CTI.
Source: ARC, RC4022 « Meal and entertainment expenses ».

- `VERIFIE` Au Québec, le montant déductible est le **moins élevé** de deux limites : 50 % des frais réellement engagés et raisonnables, **et** un plafond fondé sur le chiffre d'affaires de l'entreprise.
Source: Revenu Québec, « Frais de repas et de représentation ».

- `VERIFIE` Ce plafond québécois est **modulé selon le chiffre d'affaires annuel** et s'établit « à 2 % de son chiffre d'affaires annuel, à 650 $ ou à 1,25 % de son chiffre d'affaires annuel, selon le cas ». Référence juridique : Loi sur les impôts, articles 175.6.1, 421.1 et 421.1.1.
Source: ministère des Finances du Québec, recueil des dépenses fiscales 2025, fiche 230105.

- `VERIFIE` Sont **soustraits** de la limite de 50 % et du plafond : abonnements ou achats de billets en bloc à des concerts d'orchestre symphonique ou d'ensemble de musique classique ou jazz, opéra, danse, chanson, théâtre, spectacles de variétés en arts de la scène, expositions muséales, **à condition que l'événement ait lieu au Québec**.
Source: ministère des Finances du Québec, fiche 230105.

- `VERIFIE` Les limites ne s'appliquent pas quand l'entreprise fournit régulièrement repas ou divertissement contre rémunération, ou quand elle **facture ces coûts au client en les montrant sur la facture**.
Source: ARC, T2125 ligne 8523.

### 4. Véhicule

- `VERIFIE` La part déductible se calcule au prorata : il faut consigner **le total des kilomètres parcourus** et **les kilomètres parcourus pour gagner un revenu**.
Source: ARC, « Calculating motor vehicle expenses ».

- `VERIFIE` Le registre doit porter, pour chaque déplacement d'affaires : la date, la destination, le motif et le nombre de kilomètres. Il faut aussi relever l'odomètre au début et à la fin de l'exercice, et aux dates de changement de véhicule.
Source: ARC, « Motor vehicle records ».

- `VERIFIE` La meilleure preuve est un registre tenu **pour l'année entière**. Un registre complet sur une année de référence permet ensuite d'utiliser une période échantillon les années suivantes, tant que l'usage d'affaires reste dans les tolérances admises.
Source: ARC, « Motor vehicle records ».

### 5. Conditions générales de récupération

- `VERIFIE` Les biens et services doivent être des **intrants** de l'entreprise, c'est-à-dire acquis, consommés ou utilisés dans le cadre des activités commerciales, et le demandeur doit être inscrit pendant la période où il les a acquis.
Source: Revenu Québec, « CTI et RTI ».

- `VERIFIE` Un inscrit ayant choisi la **méthode rapide de comptabilité** ne peut pas demander de CTI ni de RTI pour la plupart de ses achats courants.
Source: Revenu Québec, « Comment demander des CTI et des RTI ».

## Analyse detaillee

### Le seuil de pièce, et la décision CEO

Le CEO a tranché : **pièce exigée sur toute dépense, sans seuil**. La recherche ne contredit pas cette décision, elle la renforce, mais elle en déplace la justification.

Le droit ne dit pas « pas de pièce sous 100 $ ». Il dit que **sous 100 $, moins de renseignements sont exigés sur la pièce**. Une pièce reste nécessaire dans tous les cas : c'est elle qui prouve le montant de taxe, lequel est exigé pour la TVQ dès le premier dollar.

Autrement dit, un cabinet québécois qui n'a pas de reçu pour une dépense de 12 $ ne peut pas réclamer la TVQ dessus. La décision « on exige » est donc **la seule qui permette de récupérer la TVQ sur les petits montants**. Elle n'est pas de la rigueur gratuite.

### Pourquoi une déductibilité « par catégorie » ne suffit pas au Québec

La spec proposait de porter un pourcentage sur la catégorie, pour que le cabinet n'ait jamais à retenir un taux. Le principe tient, mais il rencontre une limite dure.

Le plafond québécois sur les frais de représentation dépend du **chiffre d'affaires annuel**, pas de la dépense. Il est donc impossible de connaître la part déductible d'un repas au moment où on le saisit : elle ne se calcule qu'à la fin de l'exercice, une fois le chiffre d'affaires connu, et elle s'applique au cumul de l'année, pas à la ligne.

Conséquence de conception, à trancher au lot 2 : la catégorie porte le **taux** (50 %), et le dossier de fin d'année applique le **plafond** au cumul. Deux mécanismes, pas un. Un produit qui n'implémenterait que le taux surestimerait la déduction de tout cabinet dont les frais de représentation dépassent son plafond.

### La double application des 50 %

C'est le piège le plus coûteux du dossier, parce qu'il est silencieux.

Un cabinet qui paie 115 $ de repas au Québec voit environ 15 $ de taxes. L'intuition, et ce que ferait un moteur naïf, est de réclamer les 15 $ en CTI/RTI et de déduire 50 % des 100 $ au revenu. C'est faux : la taxe réclamable est elle aussi limitée à 50 %.

Le moteur doit donc porter **deux taux distincts** par catégorie, même s'ils coïncident aujourd'hui pour les repas : le taux de déduction au revenu, et le taux de récupération de la taxe. Les confondre en un seul champ marche pour les repas et casse à la première règle où ils divergent.

### Le véhicule, et ce que le prorata déclaré vaut vraiment

Le CEO a retenu le prorata d'usage, avec le registre reporté à plus tard. La recherche précise ce que ce report coûte.

L'ARC nomme le registre annuel complet « la meilleure preuve ». Elle prévoit explicitement un allègement, mais **il suppose une année de référence complète déjà tenue**. Un cabinet qui n'a jamais tenu de registre n'a donc accès ni à la meilleure preuve, ni à l'allègement.

Un prorata saisi à la main sans registre n'est pas illégal, mais il n'est pas soutenu par ce que l'ARC attend. C'est une position défendable seulement tant qu'elle n'est pas vérifiée. Le dossier de fin d'année doit donc afficher la catégorie véhicule en zone d'incertitude tant que le registre n'existe pas, comme la spec le prévoit déjà. Cette recherche justifie cette mention plutôt qu'elle ne la nuance.

### Ce que le délai de quatre ans change pour le produit

La reprise de l'historique décidée par le CEO a une borne naturelle : au-delà de quatre ans, une taxe non réclamée est perdue et le recalcul ne sert plus qu'à la justesse des états, pas à un remboursement.

À l'inverse, la borne des six ans de conservation est plus longue que celle de la réclamation. Une pièce doit donc être conservée deux ans après être devenue inutile à une réclamation. Toute politique de purge des pièces dans SAFE doit suivre les six ans, jamais les quatre.

## Inferences

- `INFERENCE` Puisque le montant de taxe est exigé dès le premier dollar pour la TVQ, et que la décomposition d'un TTC n'est pas une pièce, **une taxe estimée ne devrait jamais être présentée comme réclamable au Québec**. Elle sert à la justesse des états et à l'estimation, pas à la déclaration. Ce raisonnement découle des exigences documentaires vérifiées ci-dessus, il n'est pas énoncé tel quel dans les sources.

- `INFERENCE` La catégorie « Autres », qui existe aujourd'hui dans SAFE, ne peut porter aucune règle de déductibilité fiable, puisqu'elle mélange des natures de dépense. Tant qu'elle contient du volume, le dossier de fin d'année devrait la traiter comme une zone d'incertitude et non l'agréger silencieusement à 100 %.

## Points a confirmer

- `A_CONFIRMER` **Les paliers exacts du plafond québécois** : quel niveau de chiffre d'affaires déclenche 2 %, lequel déclenche 650 $, lequel déclenche 1,25 %. Le recueil des dépenses fiscales énonce les trois valeurs sans donner les bornes.
- Impact si faux: la déduction des frais de représentation d'un cabinet québécois serait mal plafonnée, dans un sens ou dans l'autre.
- Source ideale a trouver: guide IN-155 « Les revenus d'entreprise ou de profession », édition courante, ou Loi sur les impôts art. 175.6.1.

- `A_CONFIRMER` **Le traitement ontarien du plafond** : le plafond fondé sur le chiffre d'affaires est une mesure québécoise, l'harmonisation avec le fédéral étant qualifiée de partielle. Un cabinet ontarien n'y est vraisemblablement pas soumis, mais cela n'a pas été vérifié directement sur une source fédérale ou ontarienne.
- Impact si faux: sous-déduction des frais de représentation pour les cabinets ontariens.
- Source ideale a trouver: T2125 ligne 8523 dans sa version intégrale, ou Loi de l'impôt sur le revenu art. 67.1.

- `A_CONFIRMER` **La liste des catégories structurellement sans taxe** (salaires, assurances, la plupart des frais bancaires, certains frais de tribunal). La spec prévoit d'activer la décomposition du TTC par catégorie ; cette liste doit être établie avant le lot 1, sans quoi le moteur fabriquera de la taxe là où il n'y en a pas.
- Impact si faux: taxes récupérables surestimées, donc remises de taxes fausses.
- Source ideale a trouver: liste des fournitures exonérées et détaxées (ARC et Revenu Québec), croisée avec les 24 catégories existantes de SAFE.

## Risques

- **Le risque principal est le faux positif silencieux.** Une taxe estimée sur une catégorie exonérée, ou un CTI réclamé à 100 % sur des repas, ne déclenche aucune alerte et se découvre à la vérification. C'est pourquoi le marquage déclarée / estimée doit vivre en base et non seulement à l'écran.
- **Le plafond québécois est un calcul de fin d'année**, incompatible avec un affichage « part déductible » par ligne. Promettre à l'écran un montant déductible par dépense créerait un écart avec le dossier final.
- **Les taux et seuils changent.** Les paliers de pièce justificative sont passés de 30 $/150 $ à 100 $/500 $ ; la valeur périmée reste massivement citée sur le web. Toute valeur codée doit porter sa source et sa date de vérification, et être revue à date fixe.
- **Le prorata véhicule sans registre** est la position la plus faible du dossier. Elle est assumée, elle doit être visible.

## Recommandations

### Court terme

- Coder les seuils de pièce justificative à **100 $ et 500 $**, avec la source et la date de vérification en commentaire, jamais en littéral nu.
- Porter **deux taux distincts** sur `ExpenseCategory` : déduction au revenu, et récupération de la taxe. Même valeur aujourd'hui pour les repas, champs séparés dès le départ.
- Établir la liste des catégories sans taxe avant d'activer la décomposition du TTC (`A_CONFIRMER` ci-dessus). C'est le préalable du lot 1.
- Ne jamais marquer « réclamable » une taxe obtenue par décomposition d'un TTC. Estimée et réclamable sont deux états différents.

### Moyen terme

- Implémenter le plafond québécois comme un **calcul de fin d'année sur le cumul**, distinct du taux par catégorie, une fois ses paliers confirmés.
- Afficher la catégorie véhicule et la catégorie « Autres » en zones d'incertitude du dossier de fin d'année, avec le motif.
- Aligner la politique de conservation des pièces sur **six ans**, pas quatre.

### Long terme

- Construire le registre de kilométrage (date, destination, motif, kilomètres, relevés d'odomètre de début et de fin d'exercice), ce qui transforme le prorata déclaré en prorata défendable et ouvre l'allègement par période échantillon.
- Prévoir une revue annuelle datée des taux et seuils codés, sur le modèle du présent document.

## Sources

1. General Information for GST/HST Registrants (RC4022) — Agence du revenu du Canada — consulté le 2026-08-17 — https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4022/general-information-gst-hst-registrants.html
2. Documentary Requirements for Claiming Input Tax Credits (mémorandum 8-4) — Agence du revenu du Canada — consulté le 2026-08-17 — https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/8-4/documentary-requirements-claiming-input-tax-credits.html
3. Ligne 8523 – Repas et frais de représentation (T2125) — Agence du revenu du Canada — consulté le 2026-08-17 — https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/line-8523-meals-entertainment-allowable-part-only.html
4. Calculating motor vehicle expenses — Agence du revenu du Canada — consulté le 2026-08-17 — https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/calculating-motor-vehicle-expenses.html
5. Motor vehicle records — Agence du revenu du Canada — consulté le 2026-08-17 — https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses/motor-vehicle-expenses/motor-vehicle-records.html
6. Préparation des factures — Revenu Québec — consulté le 2026-08-17 — https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/perception-de-la-tps-et-de-la-tvq/preparation-des-factures/
7. Comment demander des CTI et des RTI — Revenu Québec — consulté le 2026-08-17 — https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/credit-de-taxe-sur-les-intrants-et-remboursement-de-la-taxe-sur-les-intrants/comment-demander-des-cti-et-des-rti/
8. Tenue de registres et conservation des pièces justificatives — Revenu Québec — consulté le 2026-08-17 — https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/regles-de-base-relatives-a-lapplication-de-la-tpstvh-et-de-la-tvq/tenue-de-registres-et-pieces-justificatives/
9. Frais de repas et de représentation — Revenu Québec — consulté le 2026-08-17 — https://www.revenuquebec.ca/fr/citoyens/votre-situation/membre-dune-societe-de-personnes/declaration-de-revenus-particularites/depenses-dexploitation/frais-de-repas-et-de-representation/
10. Dépenses fiscales 2025, fiche 230105 « Déduction des frais de représentation » — ministère des Finances du Québec — consulté le 2026-08-17 — https://www.budget.finances.gouv.qc.ca/budget/outils/depenses-fiscales/fiches/fiche-230105.asp
