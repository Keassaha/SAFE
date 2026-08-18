# SAFE — Collecte de pièces auprès du client

> Spec de parcours pilote. Remplace [SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md](SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md),
> qui n'instanciait qu'un seul domaine.
> Cabinet pilote : **Me Cayard**, Québec, immigration + droit de la famille + litige civil.
> Rédigée le 2026-08-18. **Statut : DRAFT, en attente de validation par le cabinet pilote.**

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

### Le délai qui commande

Le Règlement de la Cour supérieure du Québec en matière familiale (RLRQ c C-25.01,
r 0.2.4) impose à chaque partie de notifier à l'autre son **état de situation financière
à jour, conforme au formulaire III**, ainsi que le **formulaire de fixation des pensions
alimentaires pour enfants**, **au moins 10 jours avant l'instruction**.

C'est une date dure, calculable, et c'est elle qui fixe l'échéance de la collecte.

> **À confirmer avec Me Cayard** : que ce délai de 10 jours est bien celui qui structure
> sa préparation, et non un autre imposé par le district ou par le protocole d'instance.

### Les pièces attendues

| Pièce | Partie | Fournisseur | Obligatoire | Piège connu |
| --- | --- | --- | --- | --- |
| Formulaire III, assermenté | notre client | client | oui | non signé, ou périmé à l'audience |
| Formulaire de fixation des pensions | notre client | client | si enfants | oublié quand la garde est « réglée » |
| Avis de cotisation, 3 dernières années | notre client | client | oui | une seule année fournie |
| Talons de paie récents | notre client | client | oui | ne couvrent pas la période |
| Relevés bancaires | notre client | client | oui | comptes oubliés |
| Relevés de REER et de pension | notre client | client | oui | **valeur à la date du mariage manquante** |
| Actes de propriété, évaluation municipale | notre client | client | si immeuble | |
| Dettes, marges, cartes | notre client | client | oui | sous-déclarées |
| Formulaire III de la partie adverse | partie adverse | **partie adverse** | oui | reçu tard, ou incomplet |
| Certificat de mariage | notre client | client | oui | |

Deux choses que SAFE **signale sans décider** : la valeur d'un régime de retraite à la
date du mariage, qui commande le partage du patrimoine familial, et un formulaire III
daté de plus de quelques mois à l'approche de l'audience.

### Variante aide juridique

Me Cayard fait de l'aide juridique. Le mandat impose de **conserver les pièces
justificatives** pour la Commission des services juridiques. La collecte sert alors deux
fins : le dossier, et la reddition de comptes.

Concrètement, une seule différence dans le modèle : une pièce peut porter l'indication
qu'elle est requise pour la reddition. Rien d'autre ne change.

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

## 12. Ce qui doit être confirmé par Me Cayard

Par ordre d'importance. Les deux premières décident de tout.

1. **La liste de pièces du §3 correspond-elle à ce qu'il demande réellement** en divorce ?
2. **Le délai de 10 jours avant l'instruction** est-il celui qui structure sa préparation ?
3. Que fait-il aujourd'hui quand la partie adverse ne fournit rien à temps ?
4. En aide juridique, quelles pièces la Commission exige-t-elle de conserver ?
5. Verse-t-il lui-même au cartable, ou son adjointe prépare-t-elle la numérotation ?
6. Accepte-t-il qu'une IA lise la date et la période sur un document de son client, avant
   confirmation humaine ?

La question 6 est une décision de politique, pas de produit. Elle doit être posée
explicitement et sa réponse écrite.
