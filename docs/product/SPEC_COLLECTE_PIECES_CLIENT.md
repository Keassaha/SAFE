# SAFE — Collecte de pièces auprès du client

> Spec de parcours pilote. Remplace [SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md](SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md),
> qui n'instanciait qu'un seul domaine.
> Cabinet **pressenti** : Me Cayard, Québec, immigration + droit de la famille + litige
> civil. Profil issu de son audit (réf. A 2026 0609 CMQ) : entreprise individuelle, moins
> de 2 ans de pratique, 10 à 30 dossiers actifs, facturation au forfait, aide juridique
> occasionnelle.
>
> ⚠️ **Il n'est pas encore client.** La validation par un praticien qu'exige le blueprint
> §33 est donc impossible aujourd'hui. Elle est remplacée par
> [RECHERCHE_divulgation_famille_QC_2026-08-18.md](../research/RECHERCHE_divulgation_famille_QC_2026-08-18.md),
> qui établit sur source primaire tout ce qui est déterminable **en droit**. Ce qui relève
> de l'habitude de travail reste marqué à confirmer, et ne doit pas être codé en dur.
>
> Rédigée le 2026-08-18. **Statut : DRAFT.**

---

## 0. Ce que ce document décide

Un seul outil : **demander des documents à un client, les recevoir, les classer**.

Il est spécifié sur le cas le plus exigeant, le **divorce**, puis vérifié sur
**l'Entrée express**. Si le modèle tient les deux, il tient les autres.

**Pourquoi le divorce comme cas de référence** : deux parties aux intérêts opposés, des
pièces qui appartiennent à l'une ou à l'autre, des documents qui viennent de la partie
adverse, et des pièces reçues qui deviennent des pièces produites au tribunal. L'Entrée
express n'a aucune de ces quatre difficultés. Spécifier sur le cas facile aurait produit
un modèle qui casse au premier dossier familial.

---

## 1. Ce que le code porte déjà

Vérifié le 2026-08-18. **Ne pas recréer.**

| Brique | Modèle | Ce qu'elle donne |
| --- | --- | --- |
| Parties du dossier | `DossierPartie` | co-client contre partie externe, rôle `partie_adverse` distinct de `tiers` |
| Règle dure | idem | une partie adverse n'est **jamais** une fiche `Client` |
| Cartable famille | templates de cartable | sections « Pièces Madame (P-) » et « Pièces Monsieur (D-) » |
| Pièces produites | `DossierPiece` | partie, numéro, titre, statut |
| Fichiers du dossier | `Document` | classement, rétention |
| Étapes par type de mandat | seed Cayard | divorce, aide juridique, Entrée express, parrainage, litige |
| Lien client par jeton | `/facture/[token]`, `/rejoindre/[token]` | patron éprouvé deux fois en production |
| Lecture d'un fichier par IA | import de reçu, preuve Interac | extraction de date et de montant, avec confirmation |

**Ce qui manque, et c'est tout ce qui manque** : rien ne permet de **demander** un
document à un client ni de le **recevoir**. Tout entre par le cabinet, à la main.

---

## 2. La seule entité nouvelle

`ExpectedDocument`, la pièce attendue.

| Champ | Rôle | Pourquoi il existe |
| --- | --- | --- |
| `dossierId` | rattachement | isolation par cabinet vérifiable |
| `libelle` | « Avis de cotisation 2025 » | jamais un intitulé générique |
| `raison` | pourquoi elle est demandée | montrable au client, en une phrase |
| `periodeCouverte` | « 2023 à 2025 » | évite le troisième aller-retour |
| `partieId` | **à quelle partie la pièce se rattache** | en divorce, une pièce est à Madame ou à Monsieur |
| `fournisseur` | qui doit la produire | `client`, `cabinet`, `partie_adverse`, `tiers` |
| `obligatoire` | obligatoire, conditionnelle, facultative | la conditionnelle dépend des réponses |
| `echeance` | date limite propre à la pièce | souvent avant celle du dossier |
| `etat` | voir §4 | |
| `documentId` | le fichier reçu | l'original, jamais remplacé |
| `dossierPieceId` | **la pièce produite qui en découle** | en divorce, un relevé reçu devient P-12 |
| `motifRemplacement` | pourquoi elle a été refusée | montrable au client |

### Les trois champs que le divorce impose et que l'immigration n'aurait pas révélés

**`partieId`.** Sans lui, les pièces des deux conjoints se mélangent, et le cartable P-/D-
ne peut pas se remplir. C'est le champ que ma première spec avait oublié.

**`fournisseur` avec `partie_adverse` distinct de `tiers`.** La divulgation financière de
l'autre conjoint est un document attendu, dont le fournisseur n'est ni le client ni un
tiers neutre. Ranger la partie adverse dans « tiers » masque l'objet le plus sensible du
dossier, celui que la vérification de conflits cherche précisément.

**`dossierPieceId`.** En famille, ce qu'on collecte finit produit au tribunal. En
immigration, rien ne devient une pièce de procédure. Sans ce lien, l'avocat re-téléverse
au cartable ce qu'il a déjà reçu.

> **Décision assumée** : `ExpectedDocument` ne réutilise pas `DossierPiece`. La pièce
> attendue est une **demande** ; la pièce du cartable est une **production**. Une demande
> peut ne jamais aboutir, une production ne peut pas exister sans fichier. Les confondre
> rendrait impossible de dire « je l'ai demandée trois fois et je ne l'ai jamais reçue ».

---

## 3. Instance 1 : divorce (cas de référence)

### Les trois délais qui commandent

Vérifiés sur le Règlement de la Cour supérieure du Québec en matière familiale
(RLRQ c C-25.01, r. 0.2.4). Ce ne sont pas des conventions de cabinet, ce sont des règles
écrites, et **SAFE peut les calculer sans rien inventer**.

| Délai | Point de départ | Qui | Source |
| --- | --- | --- | --- |
| **10 j avant la présentation de la demande** | date de présentation | demandeur d'une pension pour lui-même | C.p.c. 413 al. 2 |
| **5 j avant la présentation** | date de présentation | défendeur | C.p.c. 413 al. 2 |
| **au protocole de l'instance** | dépôt du protocole | chaque partie, état de ses biens | C.p.c. 413 al. 1 |
| **10 j avant l'instruction** | date d'instruction | chaque partie | Règl. 26 |
| **180 j de la signification** | signification de la demande | demandeur | Règl. 27 et 29 |
| **30 j de la communication** | réception du formulaire adverse | défendeur qui conteste | Règl. 27 et 29 |

**Le délai le plus dur est celui de l'article 413 al. 2**, et il ne vient pas du règlement
mais du Code. Les autres retardent ; celui-là rend la demande **indécidable**. Une pièce
manquante n'y coûte pas du temps, elle coûte l'audience.

**Conséquence sur les données.** Trois dates doivent être saisies sur le dossier, et SAFE
n'en connaît **aucune** aujourd'hui :

- la date de **signification** de la demande ;
- la date de **présentation** de la demande ;
- la date d'**instruction**.

Sans elles, aucun de ces six délais n'est calculable. C'est le plus petit ajout de données
du parcours, et il conditionne tout le reste.

### Deux natures de pièces, à ne pas confondre

C'est la distinction que la recherche impose, et qui n'était pas dans ma première version.

**Les documents nommés par le règlement**, qui portent un délai légal et dont l'absence a
une conséquence procédurale. Ils peuvent afficher leur article en référence.

**Les pièces d'appui**, qui ne figurent nulle part dans le règlement. Elles servent à
**remplir** les premiers. Leur absence n'a aucune conséquence procédurale directe, et leur
liste relève de la pratique du cabinet, donc elle est configurable.

Afficher un délai légal sur une pièce d'appui donnerait une fausse assurance à l'avocat.

### Les pièces attendues

#### Documents nommés par le règlement (délai légal)

| Document | Fournisseur | Conditionnel à | Délai | Art. |
| --- | --- | --- | --- | --- |
| Formulaire III, état des revenus et dépenses, assermenté | client | toujours | 10 j avant instruction | 26 |
| Formulaire de fixation des pensions pour enfants | client | enfants | 10 j avant instruction | 26 |
| Relevé des calculs fiscaux | client | enfants | avec le précédent | 26.1 |
| Formulaire de calcul de l'état du patrimoine familial, assermenté | client | mariage ou union civile | 180 j de la signification | 27 |
| Formulaire de calcul de l'état de la société d'acquêts, assermenté | client | régime applicable | 180 j de la signification | 29 |
| Formulaire III de la partie adverse | **partie adverse** | toujours | 10 j avant instruction | 26 |
| Formulaire de patrimoine de la partie adverse, si contestation | **partie adverse** | contestation | 30 j de la communication | 27 |

L'article 27 admet **trois solutions de rechange** au formulaire de patrimoine : une
déclaration de non-assujettissement, une renonciation au partage, ou une déclaration que
le partage n'est pas contesté. La pièce attendue doit donc pouvoir être **satisfaite par
l'une ou l'autre**, sinon SAFE réclamera un formulaire qui n'est pas dû.

#### Pièces d'appui (aucun délai légal, liste configurable)

| Pièce | Sert à remplir | Piège connu |
| --- | --- | --- |
| Avis de cotisation, 3 dernières années | formulaire III | une seule année fournie |
| Talons de paie récents | formulaire III | ne couvrent pas la période |
| Relevés bancaires | patrimoine | comptes oubliés |
| Relevés de REER et de pension | patrimoine | **valeur à la date du mariage manquante** |
| Actes de propriété, évaluation municipale | patrimoine | |
| Dettes, marges, cartes | patrimoine | sous-déclarées |
| Certificat de mariage | dossier | |

`A_CONFIRMER` Cette liste d'appui vient de la pratique courante, **pas du règlement**.
Aucune recherche ne peut la trancher : seul un cabinet peut dire ce qu'il demande.

### Trois signalements, jamais des blocages

**Un formulaire III périmé.** L'article 26 exige un état « à jour ». Un formulaire rempli
six mois plus tôt ne le satisfait pas. SAFE date la pièce et signale son âge à l'approche
de l'instruction.

**Une valeur de régime de retraite à la date du mariage manquante.** Elle commande le
partage, et l'article 28 impose à qui renonce de confirmer connaître l'importance de la
valeur partageable. Renoncer sans la connaître est un risque professionnel.

**Les formulaires de patrimoine et d'acquêts viennent d'une directive du juge en chef**,
publiée sur le site de la Cour supérieure, pas du règlement. Ils peuvent changer sans
modification réglementaire. **SAFE ne les génère jamais, il les demande.**

### Variante aide juridique : une pièce manquante fait refuser la facture

C'est la conséquence la plus concrète du parcours, et elle est financière.

La Commission des services juridiques dit explicitement, dans son aide à la facturation,
qu'il vaut mieux envoyer les pièces justificatives **en même temps que la facture**, afin
**d'éviter que la facture soit refusée en raison d'un manque de pièces**.

En aide juridique, une pièce qui manque ne retarde donc pas le dossier : elle fait
**refuser la facture**. L'avocat n'est pas payé pour un travail déjà fait.

**Une seule différence dans le modèle** : une pièce attendue peut porter l'indication
qu'elle est requise pour la reddition à la Commission. Rien d'autre ne change, et c'est
le signe que le modèle est au bon niveau.

> **À ne pas confondre** : le **kilométrage** est réclamable à la Commission, alors que le
> **prorata d'usage du véhicule** livré le 2026-08-18 est une déduction au revenu. Deux
> mécanismes distincts, deux payeurs différents.

`A_CONFIRMER` La liste exacte des pièces exigées par la Commission selon le type de
mandat. Non établie.

---

## 4. Les états d'une pièce

```text
À demander
  -> Demandée
  -> Reçue
  -> À vérifier
  -> Acceptée
  -> À remplacer   (retour vers Demandée, avec motif)
  -> Écartée
  -> Produite      (uniquement quand elle devient une pièce du cartable)
```

Un état ne saute jamais. **« Acceptée » est une décision humaine**, jamais un contrôle
automatique. « Produite » n'existe qu'en litige.

---

## 5. Les écrans

### Côté client, par lien sécurisé

Le patron du lien tokenisé existe deux fois en production. On le réutilise.

**É1. Ce qu'on attend de vous.** Une page. En tête, l'échéance réelle en clair. Puis la
liste, chaque ligne avec sa raison en une phrase et un bouton de dépôt.

Jamais « documents requis ». Toujours « Avis de cotisation 2023, 2024 et 2025, toutes les
pages ».

**É2. Dépôt.** Aperçu immédiat, résultat des contrôles en clair : lisible, nombre de
pages, période détectée. Si SAFE doute, il le dit et demande confirmation.

**É3. Ce qui a été reçu.** La même liste, qui se vide. Ce qui est accepté, ce qui est à
remplacer et pourquoi, en langage non technique.

### Côté cabinet

**É4. Tableau du dossier.** L'échéance, la progression réelle, ce qui manque, ce qui
expire. Une seule action mise en avant.

**É5. File de contrôle.** Les pièces reçues, une par une, avec le classement et la partie
proposés, et leur niveau de confiance. Accepter, demander un remplacement avec motif, ou
écarter.

**É6. Verser au cartable.** En litige seulement : transformer une pièce acceptée en pièce
produite, avec sa désignation P- ou D-. Décision humaine.

---

## 6. Les décisions strictement humaines

| Décision | Qui |
| --- | --- |
| Confirmer qu'une pièce est la bonne, complète et lisible | adjointe ou avocat |
| Demander un remplacement, avec motif | adjointe ou avocat |
| Écarter une pièce | avocat |
| Rattacher une pièce à une partie, si SAFE a douté | adjointe ou avocat |
| **Verser une pièce au cartable et lui donner un numéro** | avocat |
| Déclarer la collecte complète | avocat |

---

## 7. Les automatisations autorisées

- calculer l'échéance de collecte depuis la date d'instruction ;
- relancer le client selon une politique de rappel, **plafonnée** ;
- proposer un classement, un titre et **une partie**, avec niveau de confiance ;
- lire une période ou une date sur un document, à confirmer ;
- signaler une pièce manquante, en retard, ou dont la période ne couvre pas ce qui est
  demandé ;
- signaler une pièce qui expire avant l'échéance.

**Interdit** : conclure qu'une divulgation est complète, qu'une pièce est admissible,
qu'un délai autre que celui calculé s'applique, ou verser seul une pièce au cartable.

---

## 8. Les exceptions, écrites d'avance

| Exception | Comportement |
| --- | --- |
| Le client ne répond pas | relances espacées, plafonnées, puis alerte à l'équipe |
| Pièce illisible | « À remplacer » avec motif en clair, l'original est conservé |
| Pièce qui ne couvre pas la période demandée | signalée, pas refusée seule |
| La partie adverse ne fournit rien | l'état reste « Demandée », l'absence est **datée et traçable** |
| Le client dépose au mauvais endroit | SAFE propose un rattachement, l'humain confirme |
| Composition familiale qui change | les pièces conditionnelles sont recalculées, l'ancienne liste conservée |
| Instance reportée | l'échéance se recalcule, l'ancienne est conservée |
| Mandat retiré | la collecte se fige, les pièces sont restituables |

---

## 9. Instance 2 : Entrée express (vérification du modèle)

Même outil, sans une ligne de code de plus.

| Élément du modèle | Ce qu'il devient en immigration |
| --- | --- |
| `partieId` | le demandeur, ou le répondant en parrainage |
| `fournisseur = partie_adverse` | **jamais utilisé**. Pas de partie adverse |
| `dossierPieceId` | **jamais utilisé**. Rien n'est produit au tribunal |
| `echeance` | ITA + 60 jours, déjà calculée par `Dossier.submissionDeadline` |
| Pièce qui expire | déjà porté par `ImmigrationDocument`, avec alertes à 30 et 7 jours |

Les pièces : passeport, test linguistique, évaluation des diplômes, certificats de police,
examen médical, preuves d'emploi, preuve de fonds.

**Conclusion** : le modèle du divorce contient celui de l'immigration. Deux champs restent
inutilisés, ce qui est le bon sens de la généralité. L'inverse n'était pas vrai : le
modèle de l'immigration ne portait pas le divorce.

---

## 10. Critères d'acceptation

**Fonctionnels**

1. Une liste de pièces se crée depuis le type de dossier, sans saisie manuelle.
2. Le client reçoit un lien, dépose sans créer de compte, et voit sa liste se vider.
3. Chaque pièce porte sa raison en clair.
4. En divorce, chaque pièce sait à quelle partie elle appartient.
5. Une pièce attendue de la partie adverse est suivie, et son absence est datée.
6. Le cabinet accepte ou renvoie avec motif, et le client voit le motif.
7. Une pièce acceptée peut devenir une pièce du cartable, sur décision humaine.
8. L'original est conservé intact, la version OCR ne le remplace jamais.
9. Les échéances sont calculées sur le jour calendaire du cabinet.

**Transversaux (blueprint §26)**

10. Isolation par cabinet vérifiée par test.
11. Français et anglais.
12. État vide et chemin de récupération sur chaque écran.
13. Journal d'audit : demande, dépôt, acceptation, refus, remplacement, versement.
14. Aucune suggestion IA présentée comme une décision humaine.
15. Test du parcours critique de bout en bout.
16. Export du dossier possible à tout moment.

---

## 11. Ce que cette spec ne fait pas

Pas de portail client complet, pas de catalogue d'offres, pas de qualification, pas de
génération documentaire, pas de signature, pas de cahier de pièces assemblé. Le blueprint
les prévoit et le plan de construction les ordonne. Aucun n'est nécessaire ici.

Aucune estimation de durée.

---

## 12. Ce qui reste à confirmer, et par qui

Le cabinet pressenti n'étant pas client, **rien de ce qui suit ne peut lui être demandé
aujourd'hui**. La liste est donc séparée en deux : ce qu'une recherche peut encore
trancher, et ce que seul un praticien pourra dire.

### Ce qu'une recherche peut encore trancher

Les trois points ouverts au 2026-08-18 ont été traités le même jour. Restent :

- la liste des pièces exigées par la Commission selon le type de mandat ;
- les effets du régime d'**union parentale** (2024, c. 22) sur la liste de pièces ;
- le contenu des formulaires de patrimoine et d'acquêts, **bloqué par Cloudflare** au
  robot mais accessible à un humain.

### Ce que seul un praticien pourra dire

Par ordre d'importance.

1. **La liste de pièces du §3 correspond-elle à ce qu'il demande réellement** en divorce ?
2. **Le délai de 10 jours avant l'instruction** est-il celui qui structure sa préparation ?
3. Que fait-il aujourd'hui quand la partie adverse ne fournit rien à temps ?
4. En aide juridique, quelles pièces la Commission exige-t-elle de conserver ?
5. Verse-t-il lui-même au cartable, ou son adjointe prépare-t-elle la numérotation ?
6. Accepte-t-il qu'une IA lise la date et la période sur un document de son client, avant
   confirmation humaine ?

La question 6 est une décision de politique, pas de produit. Elle doit être posée
explicitement et sa réponse écrite.
