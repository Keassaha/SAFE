# 2026-07-30 — CH-06 livré : identification et vérification du client

Deuxième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **RC-10** de l'audit : la vérification d'identité n'était jamais déclenchée.

Chantier choisi parce qu'une autre session travaille en parallèle sur `sentAt` et
touche `invoice-service.ts` et `validateInvoiceForWithdrawal`. CH-01 et CH-02 seraient
entrés en collision sur les mêmes fichiers. Le programme planifie justement CH-06 en
parallèle (S2-S3).

## Correction de fond au périmètre du programme

**By-Law 9 ne contient AUCUNE règle d'identification du client.** Il ne traite que des
opérations et des registres financiers. Le régime ontarien d'identification est dans
**By-Law 7.1, Partie III** (art. 20 à 24), lu intégralement cette session (version du
2024-04-25, en vigueur le 2025-01-01).

Le programme et l'audit citaient « s. 6 ON » pour les exemptions d'identité, ce qui
était une confusion avec les exceptions d'espèces de By-Law 9. Corrigé.

## Les divergences réelles entre les deux régimes

Elles ne sont pas cosmétiques : les aplatir produirait soit un blocage illégitime,
soit un trou de conformité.

| Point | Québec (B-1 r.5) | Ontario (By-Law 7.1) |
|---|---|---|
| Personne physique, délai | **au plus tard au moment de la réception** (art. 26(1)) → l'opération est **bloquée** | « immediately **after** first engaging » (s. 23(5)) → **pas de blocage préalable** |
| Organisation, délai | **60 jours** (art. 26(2)) | **30 jours** (s. 23(6)) |
| Source des fonds | **aucune obligation** | **exigée** (s. 23(2)) |
| Occupation des administrateurs | **exigée** (art. 23(2)1) | nom seulement (s. 23(2.1)(a)) |
| Détenteurs 25 % et plus | inconditionnel (art. 23(2)2) | « reasonable efforts » + repli (s. 23(2.1)(b), 23(2.2)) |
| Fiduciaires, structure de propriété | absent | exigés (s. 23(2.1)(b)(ii)(iii)) |
| Méthodes de vérification | standard **ouvert** : source fiable et indépendante (art. 22) + **répondant** (art. 24) | liste **limitative** de trois méthodes (s. 23(7)1) ; pas de répondant |
| Surveillance continue | **absente** | **exigée**, avec consignation (s. 23.1) |
| Conservation | 7 ans après fermeture du dossier (art. 18, 31) | **la plus longue** de la durée de la relation ou 6 ans (s. 23(14)) |

Ce dernier point mérite attention : la règle ontarienne n'est pas « 6 ans ». Un
logiciel qui purgerait à 6 ans pile violerait la règle pour un client toujours actif.

## Livré

- `lib/compliance/identity.ts` — module **pur**, les deux régimes côte à côte :
  champs requis, exemptions avec référence d'article, délais, méthodes acceptées,
  surveillance continue, procédure de repli, conservation. 30 tests.
- `lib/services/identity/identity-gate.ts` — le garde-fou. Branché sur le dépôt et
  le retrait fidéicommis. 15 tests.
- Modèles `BeneficialOwner` (propriété effective) et `IdentityAttestation`
  (répondant, Québec seulement).
- Champs `Client` : `occupation`, `natureActivites`, tiers représenté, exemption
  invoquée, premier mouvement de fonds, échéance de vérification.
- `ClientIdentityVerification` enrichie : province du régime appliqué, code de
  méthode, source des fonds, date d'obtention, confirmation d'exactitude, procédure
  de repli ontarienne.
- Migration additive `20260730140000_ch06_client_identification`, appliquée en local.

**Vérification** : `tsc --noEmit` propre, **848 tests verts**. Seul écart : le
`import "server-only"` non installé (`lib/dossiers/parties-sync.ts`, commit a300a7d),
préexistant et sans lien.

## Décision CEO : interrupteur DATÉ (option C, tranchée le 2026-07-30)

`Cabinet.identityGateEnforcedFrom`, une **date** et non un booléen.

| Valeur | Comportement |
|---|---|
| `null` | **Observation** : le contrôle s'exécute, journalise le refus qui aurait eu lieu, mais ne bloque pas. Signalé comme écart de conformité ouvert. |
| date future | **Régularisation** : compte à rebours affiché, rien n'est bloqué. |
| date atteinte | **Application** : le mouvement est refusé. |

Pourquoi une date. Un booléen se met à « off » un mardi pour débloquer quelqu'un et
y reste deux ans. Ce dépôt en a l'exemple sous les yeux : `COMPLIANCE_RULES_ENABLED`
est éteint par défaut depuis des mois, avec un registre d'obligations qui ne pilote
rien. Une date force à répondre « à partir de quand » et rend l'absence de décision
visible.

**Observation ≠ désactivé.** Le contrôle s'exécute entièrement, le verdict est
calculé, le refus est journalisé avec `blocked: false`. Seule la levée de l'exception
est suspendue. À la fin d'une semaine, la piste d'audit contient exactement la liste
des clients à régulariser, sans avoir bloqué personne.

Tous les cabinets existants démarrent à `null` : **le déploiement ne bloque personne**.

## Rapport « clients à régulariser »

`lib/services/identity/regularization-report.ts` — répond à la seule question qui
compte avant de poser une date : qui sera bloqué, et pourquoi. Trie par solde
fidéicommis détenu (on régularise d'abord là où il y a de l'argent), sépare les
clients bloquants de ceux sous délai courant, et propose une date d'application
tenable. Cette dernière heuristique (14 jours + 1 jour par tranche de 5 clients,
plafond 90) est documentée comme une estimation de charge de travail, **pas** comme
une règle du Barreau.

## ⚠️ Conséquence opérationnelle, une fois la date posée

Le garde-fou est actif. Concrètement, pour un cabinet **québécois** :

> tout dépôt ou retrait fidéicommis pour une **personne physique** dont l'identité
> n'est pas vérifiée dans SAFE est désormais **refusé**.

C'est ce qu'exige l'art. 26(1), mais c'est une rupture pour un cabinet en production
dont les fiches clients n'ont pas de vérification consignée. La porte de sortie
existe (consigner la vérification, ou invoquer une exemption de l'art. 21 en la
justifiant), mais elle demande une action par client.

Le chemin retenu : produire le rapport, régulariser, puis poser la date. Le
déploiement peut se faire sans risque avant cela, puisque tous les cabinets
démarrent en mode observation.

## CH-06.6 — Le moyen de se débloquer est devenu conforme

Le formulaire de vérification existait, mais il consignait des méthodes qui ne sont
nulle part au règlement (« Vidéo », « En personne ») et n'attachait **aucune pièce**.
Une vérification ainsi saisie mettait pourtant `identityVerified = true`, donc
débloquait le garde-fou des mouvements de fonds — sur une case cochée.

Deux règles corrigent cela, toutes deux appliquées **côté service**, pas seulement
dans l'écran :

1. **La méthode doit exister dans la province.** Les choix viennent de
   `lib/compliance/identity.ts`, filtrés par province et type de client. L'Ontario
   énumère limitativement trois méthodes pour une personne physique (s. 23(7)1) ;
   le Québec admet en plus le répondant (art. 24), que l'Ontario ignore. Une méthode
   étrangère au régime est refusée, avec la liste des méthodes admises dans le message.

2. **Pas de pièce, pas de vérification.** L'art. 22 B-1 r.5 impose d'obtenir copie du
   document et de la conserver au dossier ; la s. 23(13) By-Law 7.1 exige une copie
   de *chaque* document utilisé. Marquer « vérifié » sans pièce est refusé.
   La porte de sortie (PR-2) : le statut « en attente » reste disponible pour
   consigner une démarche en cours — il ne débloque simplement pas les fonds.

S'y ajoutent la province du régime appliqué (une vérification ontarienne ne prouve
pas la conformité québécoise), la date d'obtention distincte de la date de
vérification (s. 23(12.1)), et la source des fonds — **enregistrée en Ontario
seulement**, puisque B-1 r.5 ne l'exige pas.

15 tests. Total : **870 tests verts**, `tsc` propre.

## CH-06.7 — Confirmation manuelle et réglage de dispense (demande CEO)

Deux ajouts demandés, de nature très différente.

### Le bouton de confirmation manuelle n'est pas un contournement

L'art. 22 B-1 r.5 exige que la copie soit conservée **au dossier**, « sur tout
support papier ou faisant appel aux technologies de l'information, pourvu que des
copies puissent en être tirées facilement en tout temps ». La s. 23(15) By-Law 7.1
dit la même chose. **Ni l'un ni l'autre n'exige que la copie soit dans SAFE.**

Un cabinet qui garde ses pièces au papier, au coffre ou dans une GED externe est
donc conforme. Ce qu'il doit pouvoir produire, c'est la pièce — encore faut-il
savoir où elle est. D'où :

- `proofLocation` **obligatoire** : une attestation qui n'indique pas où chercher
  ne vaut rien à l'inspection ;
- une attestation **nominative, datée et figée**, rédigée dans la langue du régime,
  citant l'article applicable.

Trois chemins valides pour marquer « vérifié » : pièce déposée · confirmation
manuelle avec emplacement · dispense de cabinet. Le mode retenu est consigné dans
`proofMode`, parce qu'à l'inspection ce ne sont pas les mêmes situations.

### Le réglage de dispense, lui, est bien une dérogation

`Cabinet.identityProofRequired` (défaut `true`). Sa levée exige un **motif d'au
moins 10 caractères**, et est **attribuée** : qui, quand, pourquoi, dans la piste
d'audit. Une dispense anonyme est une dispense que personne n'assume — c'est
exactement ce qu'un inspecteur cherche quand il demande pourquoi une règle n'a pas
été appliquée. Le motif consigné devient la réponse du cabinet.

L'écran rappelle explicitement que lever l'exigence **ne dispense pas de conserver
la pièce au dossier** : cela dispense de la déposer ici.

### Où c'est

Nouvelle page `/parametres/conformite`, qui réunit les deux leviers — on n'active
pas le blocage sans savoir si la pièce est exigée, et inversement.

20 tests sur ce lot. Total : **875 tests verts**, `tsc` propre.

## Reste à faire dans CH-06

Fiche client enrichie (occupation, nature des activités, tiers représenté), saisie
des bénéficiaires effectifs, attestation de répondant, bandeau d'échéance de
vérification, et écran du rapport « clients à régulariser ». Le socle, les règles et
le chemin de régularisation sont posés.
