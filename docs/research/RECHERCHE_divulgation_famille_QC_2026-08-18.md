# Divulgation obligatoire en matière familiale au Québec — ce que le règlement impose

> Date de recherche : 2026-08-18
> Sert : [SPEC_COLLECTE_PIECES_CLIENT.md](../product/SPEC_COLLECTE_PIECES_CLIENT.md)
> Source principale : Règlement de la Cour supérieure du Québec en matière familiale,
> RLRQ c C-25.01, r. 0.2.4

---

## Question de départ

Quels documents un cabinet québécois doit-il obtenir de son client en matière familiale,
et **selon quels délais**, pour que la collecte de pièces de SAFE calcule une échéance
réelle plutôt qu'une échéance inventée ?

## Pourquoi cette recherche existe

Le cabinet pilote pressenti n'est **pas encore client**. La validation par un praticien,
qu'exige le §33 du blueprint, est donc impossible.

Cette recherche remplace ce qu'elle peut remplacer : tout ce qui est **déterminable en
droit**. Elle ne remplace pas ce qui relève de l'habitude de travail, et le §5 dit
explicitement ce qui reste à confirmer.

---

## Résumé exécutif

Le règlement impose **trois délais durs**, tous calculables à partir d'événements que
SAFE connaît déjà, et **quatre documents nommés**.

| Délai | Point de départ | Qui | Article |
| --- | --- | --- | --- |
| **10 jours avant l'instruction** | date d'instruction | chaque partie | art. 26 |
| **180 jours de la signification** | signification de la demande | partie demanderesse | art. 27 et 29 |
| **30 jours de la communication** | réception du formulaire adverse | partie défenderesse qui conteste | art. 27 et 29 |

C'est la meilleure nouvelle de cette recherche : ces délais ne sont pas des conventions de
cabinet, ce sont des règles écrites. SAFE peut les calculer sans rien inventer.

---

## Faits vérifiés

### 1. État de situation financière, avant l'instruction

`VERIFIE` **Article 26** : « Chaque partie fait notifier à l'autre l'état de sa situation
financière à jour conformément au **formulaire III** ainsi que le **formulaire de fixation
des pensions alimentaires pour enfants** à jour **au moins 10 jours avant la date de
l'instruction** ou au moment fixé par celui qui préside la conférence préparatoire. »

Deux conséquences produit :

- l'échéance de la collecte financière se calcule depuis la date d'instruction ;
- « à jour » est une exigence, pas un détail. Un formulaire III rempli six mois plus tôt
  ne satisfait pas l'article. **SAFE doit donc dater la pièce et signaler son âge**, pas
  seulement constater sa présence.

### 2. Pension alimentaire entre époux

`VERIFIE` **Article 22** : pour toute demande relative à une pension alimentaire entre
époux ou ex-époux, ou à sa modification, les parties remplissent le formulaire III, le
notifient et le produisent au greffe dans les délais du second alinéa de l'article 413 du
Code de procédure civile.

`A_CONFIRMER` Le contenu exact de l'art. 413 al. 2 C.p.c. n'a pas été lu. Impact : le
délai de production au greffe, distinct de celui de l'art. 26, resterait inconnu. À lire
avant de coder ce cas.

### 3. Pension alimentaire pour enfants : un document de plus

`VERIFIE` **Article 26.1** : dans toute demande d'obligation alimentaire des parents
envers leurs enfants, les parties produisent, **en plus** du formulaire de fixation dûment
rempli par chacune, **le relevé des calculs fiscaux** liés à la détermination de leurs
revenus ou des frais réclamés au bénéfice des enfants.

C'est une pièce **conditionnelle** au sens du modèle : elle n'existe que s'il y a des
enfants.

### 4. Patrimoine familial : 180 jours, puis 30

`VERIFIE` **Article 27** : dans toute demande en séparation de corps, nullité de mariage,
divorce, nullité ou dissolution d'union civile, la **partie demanderesse** doit
communiquer à la défenderesse et produire au dossier, **dans les 180 jours de la
signification de la demande**, l'un de ces quatre documents :

1. une déclaration que les parties ne sont pas assujetties au patrimoine familial ;
2. leur renonciation au partage ;
3. leur déclaration que le partage n'est pas contesté ;
4. un **formulaire de calcul de l'état du patrimoine familial appuyé d'un serment**.

`VERIFIE` Si la **défenderesse conteste**, elle produit son propre formulaire **dans les
30 jours de la communication** de celui de la demanderesse.

`VERIFIE` Le formulaire est établi par **directive du juge en chef**, publié sur le site
de la Cour supérieure. Il n'est donc pas annexé au règlement, et sa version peut changer
sans modification réglementaire.

> **Conséquence de conception** : SAFE ne doit pas figer ce formulaire dans son code. Il
> le traite comme une **pièce attendue**, pas comme un gabarit à générer.

### 5. Société d'acquêts : même structure

`VERIFIE` **Article 29** : structure identique à l'article 27, pour le formulaire de calcul
de l'état de la **société d'acquêts**. Mêmes délais de 180 et 30 jours, même renvoi à une
directive du juge en chef.

### 6. Renonciation à un régime de retraite

`VERIFIE` **Article 28** : la partie qui renonce au partage de droits accumulés durant le
mariage au titre d'un régime de retraite, ou de gains inscrits au RRQ, doit **confirmer
connaître l'importance de la valeur partageable et la possibilité d'en connaître le
montant exact**.

C'est une garde à l'écran, pas une pièce : une renonciation saisie sans que la valeur soit
connue est un risque professionnel pour l'avocat. SAFE doit **signaler**, jamais bloquer.

---

## Ce que la recherche établit pour le produit

### Les quatre documents nommés par le règlement

| Document | Quand | Conditionnel à |
| --- | --- | --- |
| Formulaire III, état des revenus et dépenses, assermenté | 10 j avant instruction | toujours |
| Formulaire de fixation des pensions alimentaires pour enfants | 10 j avant instruction | enfants |
| Relevé des calculs fiscaux | avec le précédent | enfants |
| Formulaire de calcul de l'état du patrimoine familial, assermenté | 180 j de la signification | mariage ou union civile |
| Formulaire de calcul de l'état de la société d'acquêts, assermenté | 180 j de la signification | régime applicable |

### Les pièces d'appui ne sont pas nommées par le règlement

`INFERENCE` Les avis de cotisation, talons de paie, relevés bancaires et relevés de
pension **ne figurent pas** dans le règlement. Ils sont ce qui permet de **remplir** le
formulaire III et le formulaire de patrimoine, pas ce que la loi exige de produire.

Conséquence produit importante : SAFE doit distinguer deux natures de pièces attendues.

- **Les documents exigés par le règlement**, avec un délai légal. Leur absence a une
  conséquence procédurale.
- **Les pièces d'appui**, dont la liste relève de la pratique du cabinet. Leur absence
  empêche seulement de remplir les premiers.

Confondre les deux ferait afficher un délai légal sur une pièce qui n'en a pas.

---

## Points à confirmer

- `A_CONFIRMER` **Art. 413 al. 2 C.p.c.**, pour le délai de production au greffe du
  formulaire III en matière de pension entre époux. Impact : un second délai, distinct de
  celui de l'art. 26, resterait non calculé.
- `A_CONFIRMER` **La liste des pièces d'appui réellement demandées** par un cabinet
  québécois. Relève de la pratique, pas du droit. Aucune recherche ne peut la trancher.
- `A_CONFIRMER` **Les exigences de conservation de la Commission des services juridiques**
  en aide juridique. Le cabinet pressenti en fait de façon occasionnelle.
- `A_CONFIRMER` **La version courante des formulaires de patrimoine et d'acquêts**, qui
  vivent dans une directive du juge en chef et non dans le règlement.

---

## Risques

- **Le formulaire III « à jour »** est le piège le plus probable. Un cabinet qui collecte
  tôt et plaide tard produit un formulaire périmé. SAFE doit dater et signaler, sinon il
  donne une fausse assurance.
- **Les formulaires par directive** peuvent changer sans que le règlement bouge. Toute
  version codée en dur deviendra fausse en silence.
- **Le délai de 180 jours part de la signification**, une date que SAFE ne connaît pas
  aujourd'hui. Il faudra la saisir, sinon aucun de ces délais n'est calculable.

---

## Recommandations

1. Traiter les cinq documents nommés comme des **pièces attendues à délai légal**, avec
   leur article en référence affichable.
2. Traiter les pièces d'appui comme des **pièces attendues sans délai légal**, dont la
   liste est configurable par cabinet.
3. **Saisir la date de signification** sur le dossier : trois délais en dépendent.
4. Dater chaque formulaire reçu et signaler son âge à l'approche de l'instruction.
5. Ne jamais générer les formulaires de patrimoine et d'acquêts : les demander.

---

## Sources

- Règlement de la Cour supérieure du Québec en matière familiale, RLRQ c C-25.01,
  r. 0.2.4, art. 22, 26, 26.1, 27, 28, 29 :
  https://www.legisquebec.gouv.qc.ca/fr/document/rc/c-25.01,%20r.%200.2.4
- Formulaire III, texte officiel :
  https://www.legisquebec.gouv.qc.ca/fr/ressource/rc/C-25.01R0.2.4_FR_003_001.pdf

### Note de méthode

CanLII rend une page vide au robot. Légis Québec répond correctement **par le navigateur**,
alors que `WebFetch` échoue en 403 sur les sites gouvernementaux québécois. Le texte
intégral de la Loi sur les impôts, lui, fait expirer le chargement : préférer le règlement
ciblé au code complet.
