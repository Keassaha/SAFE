# Spec — Reprendre un client à la fois

> Statut : **LIVRÉE** le 2026-09-30, sur la branche `feat/refonte-vitrine-et-dossier`, **non déployée**.
> Maquettes validées le même jour. Éprouvée dans un vrai navigateur (Playwright) contre le serveur
> local, en français et en anglais : voir §9.
> Date : 2026-09-30
> Origine : rencontre avec Aaliyah, assistante de Me Dérisier (cabinet Derisier Law, Ontario).
> Dépend de : « Entrée d'un client » (livrée le 2026-09-15) et « Exercices précédents » (livrée le 2026-09-16).

---

## 1. La demande, reformulée

Aaliyah ne veut pas déposer vingt factures de dix clients d'un coup et laisser SAFE
les répartir. Elle veut une **démarche claire, un client à la fois** :

1. elle choisit le client, ou le crée s'il est nouveau, **avec son mandat** ;
2. elle entre les factures de ce client **une par une**, en remplissant tous les
   détails ;
3. elle termine ce client, et passe au suivant.

C'est une demande de **contrôle**, pas de vitesse. Le dépôt en lot devine le client
et le dossier à partir de la facture ; elle préfère les désigner elle-même.

---

## 2. Ce qui existe déjà : environ 70 % de la demande

### L'écran « Entrée d'un client » fait déjà la moitié

`components/clients/entree/FormulaireEntreeClient.tsx`, maquette validée le
2026-09-14, au menu **Pratique → Entrée d'un client**. Un client à la fois, sept
questions numérotées :

| # | Section | Ce qu'elle écrit |
|---|---|---|
| 01 | Qui est le client | la fiche client (personne ou entreprise, coordonnées, langue) |
| 02 | Le mandat | un dossier : intitulé, objet, taux horaire convenu, en cours ou terminé |
| 03 | Conflits d'intérêts | la déclaration, datée et signée |
| 04 | Identité du client | une vérification d'identité, comme pièce datée |
| 05 | Argent détenu | le solde d'ouverture en fidéicommis |
| 06 | Dates qui courent | les échéances |
| 07 | Qui d'autre est dans l'affaire | les parties externes (jamais des fiches client) |

Et elle se termine déjà par « client suivant ».

**Ce qui lui manque** : les factures passées. C'est exactement ce que la demande
d'Aaliyah ajoute.

### La reprise des factures fait déjà l'autre moitié

Tout le moteur d'écriture est réutilisable **sans modification** :

- `verserFactureReprise` écrit la facture, ses heures (marquées facturées), ses
  débours, son paiement et ses écritures comptables à leur vraie date ;
- les contrôles (`controles.ts`) : dates impossibles, total nul, paiement avant la
  facture, détail qui ne tombe pas sur le total ;
- l'anti-doublon à quatre barrières ;
- la correction de chaque champ, la saisie sans pièce, la carte vide quand la
  lecture échoue ;
- l'espace « Corriger une écriture ».

### La vraie simplification

Dans le dépôt en lot, SAFE doit **deviner** à qui appartient chaque facture. C'est la
source de presque toutes les difficultés rencontrées : coquilles dans les noms,
en-tête du cabinet lu comme client, dossiers qui se ressemblent.

**Ici, Aaliyah désigne le client et le mandat avant la première facture.** Le
rapprochement disparaît. La lecture d'un PDF ne sert plus qu'à pré-remplir le
numéro, la date, les montants et les lignes.

---

## 3. La démarche, étape par étape

Un seul écran, quatre étapes qui se suivent. On voit toujours où l'on est.

```
  Reprendre un client                                    Étape 3 sur 4
  ─────────────────────────────────────────────────────────────────────
  ✓ 1  Le client          Constructions Béliveau inc. (nouveau)
  ✓ 2  Le mandat          Bail commercial, rue Laurier · 460 $/h
  ●  3  Les factures       1 enregistrée · 1 en cours
  ○  4  Vérifier et terminer
```

### Étape 1 — Le client

- Un champ de recherche parmi les clients du cabinet.
- **Trouvé** : sa fiche s'affiche, Aaliyah complète ce qui manque.
- **Pas trouvé** : « Créer ce client ». Type (personne ou entreprise), nom,
  coordonnées, langue. Ce sont les champs de la section 01 actuelle.
- La vérification de conflits se fait à la saisie du nom, comme aujourd'hui.

### Étape 2 — Le mandat

- Les dossiers existants du client sont listés : Aaliyah en choisit un,
  **ou** crée un nouveau mandat (section 02 actuelle : intitulé, objet, taux
  horaire convenu, en cours ou terminé).
- Les sections 03 à 07 (conflits, identité, fidéicommis, échéances, parties)
  suivent, **repliées** avec la mention « si applicable ». Elles ne ralentissent
  pas celle qui n'en a pas besoin.

### Étape 3 — Les factures de ce mandat, une par une

Deux façons d'ajouter des factures à ce mandat :

- **Déposer les PDF de ce client**, un ou plusieurs d'un seul coup. Chacun devient
  une carte, pré-remplie par SAFE, qu'Aaliyah vérifie et complète **une par une**.
  (Décision CEO du 2026-09-30 : plusieurs factures d'un même client, oui ;
  plusieurs clients dans un même dépôt, non.)
- **Taper une facture** : le même formulaire, vide.

Chaque carte ouvre un formulaire **complet**, tous les champs visibles.

Les champs :

**Trois natures de ligne** (décision CEO du 2026-09-30) :

| Nature | Ce qu'elle est | Champs | Ce que SAFE écrit |
|---|---|---|---|
| **Horaire** | des honoraires au temps | heures × taux (taux du mandat par défaut) = montant calculé | une entrée de temps marquée facturée |
| **Forfait** | des honoraires à montant convenu d'avance | le montant seul | une tâche au registre, marquée facturée |
| **Débours** | des frais avancés pour le client, qu'il rembourse | le montant seul | un débours sur la fiche de débours du mandat |

Forfait et débours ont tous deux un montant fixe, mais **ils ne vont pas au même
endroit** : le forfait est un revenu du cabinet, le débours un remboursement de
frais, qui passe à « recouvré » quand le client paie. Les confondre fausserait la
comptabilité. Le moteur d'écriture sait déjà faire les trois (une ligne
d'honoraires sans heures devient un forfait) : seul l'écran n'en proposait que deux.


| Bloc | Champs |
|---|---|
| La facture | numéro, date d'émission |
| Le détail | une ligne par prestation : date, description, et sa **nature** parmi trois (voir ci-dessous) |
| Les taxes | **selon la province du cabinet** : TVH en Ontario, TPS et TVQ au Québec |
| Le total | calculé depuis le détail, **modifiable** : c'est le papier qui fait foi |
| Le paiement | payée, partielle ou impayée ; date ; montant reçu ; mode de paiement |

« **Enregistrer cette facture** » l'écrit. Elle rejoint la liste du mandat,
sous le formulaire, avec son total et son statut. Le formulaire se vide pour la
suivante.

Si SAFE lit sur le PDF un client différent de celui choisi à l'étape 1, il le
dit : « Cette facture semble adressée à X. Vous reprenez Y. » Il ne bloque pas.

### Étape 4 — Vérifier et terminer

Le récapitulatif du client :

```
  Constructions Béliveau inc.
  Bail commercial, rue Laurier

  2 factures · 8,75 h · 3 débours
  Facturé   4 907,71 $     Encaissé   3 300,36 $     Reste dû   1 607,35 $
  Fidéicommis   aucun solde déclaré
```

Puis deux boutons : **Client suivant** (retour à l'étape 1, vide) et
**Autre mandat pour ce client** (retour à l'étape 2).

---

## 4. Les questions à trancher

### Décisions du CEO, 2026-09-30

| | Décision |
|---|---|
| **Q1** | **Le dépôt multi-clients n'est plus proposé.** Un client à la fois. On y reviendra quand la démarche sera documentée et maîtrisée. Le code est **conservé, pas supprimé** : seule la porte est retirée de l'écran. |
| **Q2** | **Chaque facture est enregistrée à son propre bouton.** Une interruption ne fait perdre que la facture en cours. Le client et le mandat s'écrivent avec la première facture. |
| **Q3** | **Tous les champs affichés.** L'exigence minimale reste celle recommandée ci-dessous tant que le CEO ne demande pas plus. |
| **Q4** | **Le mode de paiement est demandé.** |
| **Q5** | Non tranchée : la recommandation s'applique. |
| **Q6** | **Bilingue, selon la langue choisie dans SAFE** par l'utilisatrice (réglage FR / EN existant). |
| **Q7** | Non tranchée : la recommandation s'applique. |

Le détail de chaque question, tel que posé :

### Q1 — Garde-t-on le dépôt en lot ?

> **Tranché : non.** Voir le tableau ci-dessus.

Recommandation d'origine : oui, les deux portes. « Un client à la fois » devient la
porte par défaut de l'onglet Exercices précédents ; le dépôt en lot reste à côté
pour un cabinet qui arrive avec trois cents factures. Rien n'est perdu, rien n'est
à rééprouver.

### Q2 — Quand la facture s'écrit-elle ?

> **Reformulée le 2026-09-30.** En clair : Aaliyah entre cinq factures, et à la
> troisième elle est interrompue et ferme la page. Au retour, les deux premières
> sont-elles déjà dans SAFE (enregistrement facture par facture), ou faut-il tout
> recommencer (enregistrement du client entier à la fin) ?

Aujourd'hui, la doctrine est « rien n'est écrit avant le bouton final ».

**Recommandation : chaque facture s'écrit à son propre bouton**, « Enregistrer
cette facture ». Le client et le mandat s'écrivent avec la première. Raison :
Aaliyah est interrompue, comme toute adjointe. Si elle ferme la page après la
troisième facture, les trois sont gardées. La doctrine devient « rien n'est écrit
avant **chaque** bouton ».

### Q3 — Quels champs sont obligatoires ?

Aaliyah demande à remplir « tous les détails ». La doctrine de l'Entrée dit
« aucun champ obligatoire », pour qu'un cabinet qui entre trente clients un soir
n'abandonne pas au troisième refus.

**Recommandation : on AFFICHE tous les champs, on n'en EXIGE que cinq.** Le nom du
client, l'intitulé du mandat, la date de la facture, son total, et son statut de
paiement (avec date et montant si elle a été payée). Tout le reste est recommandé,
jamais bloquant.

### Q4 — Une facture payée à même le fidéicommis ?

C'est courant, et c'est le seul point délicat. La reprise ne touche **jamais** au
fidéicommis aujourd'hui : un mouvement de fidéicommis reconstitué après coup doit
correspondre au relevé de banque réel.

**Recommandation : demander le mode de paiement** (chèque, virement, comptant,
carte, fidéicommis). Si « fidéicommis », SAFE enregistre l'encaissement de la
facture mais **n'invente aucun mouvement** au registre de fidéicommis, et l'écran
le dit. Le solde restant se déclare à l'étape 2, section « Argent détenu ».
**À valider avec Me Dérisier**, dont c'est la responsabilité devant le Barreau.

### Q5 — Une facture qui couvre deux mandats ?

**Recommandation : une facture, un mandat.** Si elle en couvre deux, on la saisit
sur le mandat principal avec une note. Construire la répartition coûterait cher
pour un cas rare.

### Q6 — En quelle langue ?

> **Tranché : bilingue**, selon la langue choisie dans SAFE.


Derisier Law est un cabinet ontarien. L'écran de reprise est aujourd'hui
**entièrement en français**, sans traduction.

**Recommandation : construire en français et en anglais d'emblée**, et demander à
Aaliyah dans quelle langue elle travaille dans SAFE.

### Q7 — Joindre le PDF d'une facture tapée à la main ?

**Recommandation : oui, facultatif, après coup.** Une facture tapée sans pièce
porte la mention « sans pièce » ; y joindre plus tard le scan retire la mention.

---

## 5. Trois défauts à corriger, quelle que soit la suite

Relevés en préparant cette spec. Ils touchent Aaliyah directement.

1. **Les taxes sont écrites en dur « TPS » et « TVQ »** sur la carte de reprise
   (`ReprisePage.tsx:900-906`). Pour un cabinet ontarien, il faut **TVH**. En
   l'état, Aaliyah verrait des libellés faux sur chaque facture.
2. **Le formulaire d'Entrée ne permet pas de choisir un client existant.** Le
   service le sait (`enregistrer-entree-client.ts`, paramètre `clientId`), l'écran
   ne le propose pas. Il ne sait que créer.
3. **L'Entrée crée toujours un nouveau dossier.** Pour ajouter des factures à un
   mandat qui existe déjà, il faut un chemin nouveau.

Et un point hors code : **Aaliyah a deux comptes** dans le cabinet, « Aaliyah » et
« Aalyiah ». Le second est probablement une coquille à désactiver.

---

## 6. Découpage

| Lot | Contenu | Réutilise |
|---|---|---|
| **R1** | Étapes 1 et 2 : choisir ou créer le client, choisir ou créer le mandat | le formulaire et le service d'Entrée |
| **R2** | Étape 3, saisie à la main : formulaire complet, taxes selon la province, enregistrement facture par facture | `verserFactureReprise`, `controles.ts`, l'anti-doublon |
| **R3** | Étape 3, dépôt d'un PDF : pré-remplissage, alerte si le client lu diffère | l'extraction et le contrôle de qualité |
| **R4** | Étape 4 : récapitulatif, client suivant ; entrée de menu ; français et anglais selon la langue choisie ; **retrait de la porte multi-clients** (code conservé) | la synthèse du lot, `next-intl` |

Aucune migration n'est prévue. Le mode de paiement (Q4) existe déjà sur `Payment`.

**Avant R1**, selon votre règle : une image de l'écran, montrée et validée.

---

## 7. Terminé quand

Aaliyah reprend **un vrai client du cabinet Dérisier**, de bout en bout, **sans aide** :
le client, son mandat, trois factures dont une partielle, avec une **TVH juste**, et
le récapitulatif tombe au sou sur les factures papier.

---

## 8. Ce qui ne change pas

- Le moteur du dépôt multi-clients reste dans le code, prêt à revenir (Q1). Seule
  sa porte disparaît de l'écran.
- Le moteur d'écriture, les contrôles, l'anti-doublon et l'espace de correction ne
  sont pas touchés.
- **Le déploiement en cours reste suspendu** : les migrations sont appliquées en
  production, le code ne l'est pas, et la table `DemandeSite` attend toujours sa
  protection RLS (voir `docs/deploiement/REVUE_MIGRATIONS_2026-09.md`).

---

## 9. Ce qui a été livré, et comment ça a été éprouvé

| Où | Quoi |
|---|---|
| `lib/services/reprise-un-client/saisie.ts` | module pur : trois natures, taxes selon le régime du cabinet, contrôles en codes traduits, traduction vers le moteur de reprise. 41 tests. |
| `lib/services/reprise-un-client/preparer-mandat.ts` | client et mandat, créés à la première facture. **Un client existant garde sa fiche intacte** : on ne passe pas par l'Entrée, qui réécrit toute la fiche. |
| `lib/services/reprise-un-client/recapitulatif.ts` | l'étape 4, lue en base (pièces `estReprise` seulement). |
| `app/api/clients/reprise-un-client/{contexte,preparer,recapitulatif}` | les trois routes, même garde que la reprise en lot (`canCreateClients`). |
| `components/clients/reprise-un-client/` | l'écran en quatre étapes, bilingue (`messages/*.json`, espace `repriseUnClient`). |
| `verser-reprise.ts` + route `verser` | **seul changement du moteur** : le mode de paiement. Fidéicommis porté sur le paiement, aucun mouvement inventé au registre. |

Chaque facture passe par la route de versement existante : ses quatre barrières
anti-doublon s'appliquent telles quelles.

**Éprouvé dans un navigateur réel**, cabinet de test local : nouveau client, conflits
vérifiés, nouveau mandat à 460 $/h, une facture tapée (horaire + forfait + débours,
partielle par chèque) et un PDF lu par SAFE (payé par Interac). Récapitulatif lu en
base : 6 544,03 $ facturés, 5 300,36 $ encaissés, 1 243,67 $ dus, 9,00 h, 1 forfait,
4 débours, 8 écritures. Le même PDF redéposé est refusé ; une facture tapée au même
numéro qu'une facture déjà reprise pour ce client est refusée. Aucune erreur console.
L'écran en anglais : aucun reste de français.

**Pas encore éprouvé** : une vraie facture ontarienne à TVH (les PDF de test sont
québécois : la TPS et la TVQ lues se replacent dans le champ TVH, somme juste), et
l'onglet « Corriger une écriture » dans un navigateur.

---

## 10. Version 4 — « tout commence par un dépôt » (2026-10-01)

Remplace la présentation en quatre étapes du §3. Maquettes validées le 2026-10-01
après quatre tours de simplification, puis construite et éprouvée le même jour.

### Ce que le CEO a décidé

- **Tout commence par un dépôt.** Saisir un nom à la main devient « Sans facture ».
- **Un dépôt ne concerne qu'un client.** Une facture adressée à quelqu'un d'autre est
  écartée et nommée, avec « Rattacher » pour une coquille.
- **Le premier réflexe est de lire le client** : nom, adresse, courriel, téléphone.
  Un client déjà au cabinet est reconnu d'office (nom identique) ; un nom seulement
  proche est proposé (« C'est lui »), jamais rattaché seul.
- **La fiche n'est jamais réécrite en silence** : si la facture porte une autre
  coordonnée, SAFE le signale et propose « Mettre la fiche à jour ».
- **Typographie de la section** : une famille (SAFE Grotesk, chiffres tabulaires),
  deux tailles (20 px pour le nom, 14 px pour tout le reste), deux graisses. Plus de
  police mono : **écart assumé à la lettre de la loi L1** du référentiel, dont le but
  (des chiffres alignés, jamais tronqués) est tenu. À reporter dans le référentiel, et
  à décider pour le reste de SAFE.
- **Deux correctifs** demandés à la validation : une lecture hésitante s'ouvre
  d'emblée en correction ; ce que le parcours allégé a laissé (identité, fidéicommis)
  revient, nommé, à la fin du client.

### Ajouté en construisant

- **Un dépôt, un mandat.** Un client a souvent plusieurs dossiers : une facture du
  bon client dont l'objet ne recoupe pas le mandat retenu est mise de côté, nommée,
  et reprise à la fin du client par « Les reprendre maintenant », sans être
  redéposée. La ranger d'office dans le mandat courant aurait été une erreur
  silencieuse.
- **L'avocat responsable** n'est demandé que si le cabinet en compte plusieurs.
- **Le solde en fidéicommis** se déclare depuis l'écran de fin. Refusé sur un dossier
  déjà mouvementé : le service fixe le solde du compte et écraserait le vrai.

### Où c'est

| Où | Quoi |
|---|---|
| `lib/ai/extract-past-invoice.ts` | lit aussi `clientAdresse`, `clientCourriel`, `clientTelephone` (facultatifs), jamais ceux du cabinet |
| `lib/services/reprise-un-client/depot.ts` | client du dépôt, reconnaissance du client et du mandat, comparaison des coordonnées, relevé ou correction, reste à compléter. 27 tests. |
| `app/api/clients/reprise-un-client/fiche`, `/fideicommis` | mettre une coordonnée à jour ; déclarer un solde d'ouverture |
| `components/clients/reprise-un-client/RepriseParDepot.tsx` | l'orchestrateur ; `EcranClient`, `EcranFacture`, `EcranFin`, `ui.tsx` |

L'écran en quatre étapes du §3 est supprimé. Le dépôt multi-clients reste conservé
(`components/clients/reprise/`), sans porte.

### Éprouvé dans un navigateur réel, cabinet de test local

Dépôt de quatre factures : Ouellet écartée (autre client), le litige mis de côté
(autre mandat). Nouveau client créé avec l'adresse lue, conflits déclarés. Deux
factures enregistrées, chacune suivie d'une phrase qui dit ce qui a été écrit. Fin :
1 500 $ déclarés en fidéicommis, identité signalée. Le litige repris aussitôt. Client
suivant : un fichier déjà repris refusé, une coquille de nom rattachée par « C'est
lui ». En base : **un seul client**, deux mandats, quatre factures aux totaux du
papier, TVH dans la colonne `tps`, 9 écritures (4 factures, 3 débours, 2 paiements).
Typographie mesurée sur chaque écran : une famille, deux tailles, deux graisses. En
anglais : aucun reste de français. Aucune erreur console.

**Pas éprouvé** : une vraie facture ontarienne ; une lecture des coordonnées sur une
facture réelle qui porterait courriel et téléphone ; la mise à jour d'une fiche sur un
client existant (la route est écrite, le cas ne s'est pas présenté dans l'essai).

