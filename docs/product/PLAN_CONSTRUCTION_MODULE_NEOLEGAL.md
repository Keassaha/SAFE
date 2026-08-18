# SAFE — Ce qu'il y a à construire côté Neolegal, et par quoi commencer

> Dérivé de [BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md](BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md)
> État du code vérifié le 2026-08-18, après la fermeture du chantier comptable.
> Doctrine applicable : [DOCTRINE_ANCRAGE_COLONNE_VERTEBRALE.md](DOCTRINE_ANCRAGE_COLONNE_VERTEBRALE.md)

---

## 0. Comment lire ce document

Le blueprint décrit une cible. Ce document répond à trois questions qu'il ne tranche pas :

1. **Qu'est-ce qui existe déjà vraiment**, vérifié dans le code et non supposé.
2. **Qu'est-ce qui est un outil à construire**, et qu'est-ce qui est une restructuration
   de ce qui existe. Les deux ne se planifient pas pareil.
3. **Par quoi commencer**, sachant que la doctrine d'ancrage prime sur l'ordre du
   blueprint là où les deux divergent.

Un chiffre pour situer l'ampleur : le blueprint prévoit **20 entités conceptuelles**.
**17 n'existent pas.** Le schéma actuel en compte 121, donc ce n'est pas une extension,
c'est un second produit greffé sur le premier.

---

## 1. Le socle réel, vérifié

Ce que le blueprint compte comme fondation, et ce que le code dit.

| Fondation | Modèle | Réalité vérifiée |
| --- | --- | --- |
| Clients, dossiers, multi-cabinet | `Client`, `Dossier` | solide, isolation `cabinetId` partout |
| Conflits et doublons | présent | garde avant acceptation |
| Vérification d'identité | présent | garde dure déjà branchée |
| Pièces de cartable | `DossierPiece` | **c'est le cartable P-/D-, pas une demande au client** |
| Procédures | `DossierProcedure` | suivi, pas génération |
| Documents | `Document` | fichiers classés au dossier |
| Documents riches et versions | `RichDocument`, `RichDocumentVersion` | rédaction interne, versionnée |
| Tâches | `DossierTache`, `Task`, `RegistreTache` | **trois modèles de tâche coexistent** |
| Navette | `DossierNavetteMessage` | communication interne |
| Forfaits | `ForfaitService` | existe, branché à la facturation |
| Conservation | `DocumentRetentionPolicy` | politique, pas cycle de vie complet |
| Piste d'audit | `AuditLog` | existe en base, **aucune page ne l'affiche** |
| Accès client par jeton | `/facture/[token]`, `/rejoindre/[token]` | **éprouvé deux fois en production** |
| Téléversement + vision IA | import de reçu, preuve Interac | **côté cabinet uniquement** |

### Deux corrections à ce que le blueprint suppose

**`DossierPiece` n'est pas réutilisable pour la collecte client.** C'est la liste des
pièces qu'on produit au tribunal, avec partie, numéro et titre. Une pièce attendue d'un
client est un autre objet : elle a un demandeur, une raison, une échéance, un état de
réception. Les confondre tordrait un modèle pour un usage qu'il n'a pas.

**Le patron réutilisable, c'est le lien tokenisé.** Il tourne déjà deux fois en
production. C'est la partie qu'on rate le plus souvent, et elle est faite.

---

## 2. Les quatorze outils à construire

Chaque outil est évalué sur trois axes : ce qui existe, ce qui manque, et le registre
d'ancrage qu'il sert (fidéicommis, délais, facturation) ou le crochet qu'il plante.

### A. Catalogue de services du cabinet

Offres publiques versionnées : portée, exclusions, prix, livrables, langue, statut.

- **Existe** : `ForfaitService`, la facturation, les taxes.
- **Manque** : `ServiceOffering` versionné, pages publiques sous marque cabinet, lien
  offre → intake → workflow → lettre de mandat.
- **Ancrage** : aucun. C'est une machine à vendre, elle suppose du volume entrant.

### B. Qualification et orientation

Questionnaire pré-mandat qui oriente sans donner d'avis juridique.

- **Existe** : l'audit gratuit (`AuditSubmission`) est un patron proche.
- **Manque** : `QualificationSession`, les six résultats possibles, les interdictions
  dures (pas de chances de succès, pas de stratégie, pas de calcul de délai).
- **Ancrage** : aucun.

### C. Portail client sécurisé

Espace client : étape actuelle, actions demandées, documents, messages, signatures.

- **Existe** : le lien tokenisé, deux fois.
- **Manque** : `PortalAccessGrant`, tableau de bord client, délégation, révocation,
  cloisonnement strict (le client ne voit jamais notes internes, stratégie, rentabilité).
- **Ancrage** : c'est le contenant des crochets, pas un crochet.

### D. Intake intelligent

Collecter les faits une fois, les réutiliser partout.

- **Existe** : rien de versionné.
- **Manque** : `IntakeTemplate`, `IntakeSubmission`, constructeur de formulaires,
  logique conditionnelle, transformation réponse → dossier, partie, date critique,
  pièce attendue, variable documentaire, tâche.
- **Ancrage** : **crochet d'entrée fort**, supprime de la saisie au cabinet.

### E. Collecte et contrôle des pièces

Transformer « envoyez vos documents » en liste précise, vérifiable, qui se vide.

- **Existe** : téléversement, vision IA, classement proposé, tous côté cabinet.
- **Manque** : `ExpectedDocument`, les huit états d'une pièce, les contrôles
  automatiques, la vue client.
- **Ancrage** : **le crochet le plus fort du blueprint**. Seule capacité où le CLIENT
  saisit à la place du cabinet.

### F. Classement documentaire unifié

Une place évidente pour chaque fichier, sans exposer les distinctions techniques.

- **Existe** : `Document`, `RichDocument`, `DossierPiece`, cartables, suggestion de
  classement.
- **Manque** : `CanonicalDocument`, `DocumentExtraction`, métadonnées canoniques.
- **Nature** : **restructuration**, pas un outil. Voir §3.

### G. Moteur de modèles et génération documentaire

Produire un premier document fiable depuis des données validées.

- **Existe** : `RichDocument` versionné, gabarits de facture et de mandat en dur.
- **Manque** : `DocumentTemplate`, `ClauseDefinition`, `GeneratedDocument`, variables,
  conditions, répétitions, DOCX, journal des valeurs injectées.
- **Ancrage** : supprime de la rédaction, pas de la saisie. Second rang.

### H. Préparation des procédures

Assister la préparation matérielle sans automatiser la décision juridique.

- **Existe** : `DossierProcedure`, cartables par domaine.
- **Manque** : `EvidenceFactLink`, chronologie depuis les faits validés, signalement
  des faits sans pièce et des pièces non citées.
- **Ancrage** : sert les délais, mais suppose G et E faits.

### I. Atelier de cahiers de pièces

Cahier paginé, désigné, traçable, sans manipulation PDF externe.

- **Existe** : sections P- et D-.
- **Manque** : `ExhibitSet`, `ExhibitItem`, les six étapes, le manifeste, les empreintes.
- **Ancrage** : gros gain de temps, **faible fréquence**. N'installe pas d'habitude.

### J. Révision, approbation, signature

Fermer la boucle entre document préparé et document utilisable.

- **Existe** : rien.
- **Manque** : `ReviewRequest`, `SignatureEnvelope`, fournisseur substituable.
- **Dépendance externe** : un fournisseur de signature valide au Canada. **Question §29
  Q4 non tranchée.**

### K. Moteur de workflow de mandat

Chaque service devient un processus répétable, visible, mesurable.

- **Existe** : trois modèles de tâche, aucun processus.
- **Manque** : `WorkflowDefinition`, `WorkflowInstance`, étapes, dépendances, chemins
  d'exception.
- **Nature** : c'est la colonne vertébrale des autres capacités. Le construire tôt fige
  des choix, le construire tard oblige à recâbler.

### L. IA assistive et gouvernée

Douze cas d'usage, tous avec sources, seuil de confiance et validation humaine.

- **Existe** : quatre capacités IA en production, dont l'extraction de reçu et la preuve
  de paiement. Le patron `lib/ai/` est éprouvé.
- **Manque** : `AiAssistanceRecord`, les exigences de sortie obligatoires, les huit tests
  indispensables dont la résistance aux instructions cachées dans un document.

### M. Communications unifiées

Éviter que tout se disperse entre portail, courriel, téléphone et SMS.

- **Existe** : navette interne, envoi de facture par courriel.
- **Manque** : `TransmissionRecord`, courriels entrants liés au dossier, preuve de
  transmission, distinction client / adverse / tribunal / tiers / interne.

### N. Clôture et conservation

Terminer réellement le mandat et appliquer les règles de conservation.

- **Existe** : `DocumentRetentionPolicy`, fermeture de dossier, soldes fidéicommis.
- **Manque** : checklist de clôture complète, lettre de clôture générée, export client,
  suspension de destruction en cas de litige, certificat de destruction.
- **Ancrage** : touche le **fidéicommis**, donc un registre d'ancrage. À ne pas
  repousser indéfiniment.

---

## 3. Les restructurations, qui ne sont pas des outils

Ces chantiers ne produisent aucun écran. Ils conditionnent les outils. La doctrine R-04
dit qu'une fonctionnalité invisible compte comme non faite, ce qui rend ces chantiers
**dangereux à faire seuls** : ils coûtent des semaines et ne changent rien pour le
cabinet tant qu'aucun outil ne s'appuie dessus.

**La règle qui en découle : ne jamais faire une restructuration pour elle-même. La faire
au moment où le premier outil qui en dépend la rend visible.**

### R1. Unifier le document

Trois modèles coexistent : `Document`, `RichDocument`, `DossierPiece`, plus
`DossierProcedure`. Un même fichier n'a pas une place évidente.

**À faire** : un adaptateur et des statuts canoniques, pas une migration qui écrase.
Le blueprint le met en Phase 0 ; sa propre grille d'ancrage note les documents 6/15 avec
un critère éliminatoire. **Faire l'adaptateur seulement quand E ou G le rend visible.**

### R2. Unifier la tâche

`DossierTache`, `Task`, `RegistreTache`. Trois modèles pour un même concept. Le workflow
(K) est impossible à poser proprement dessus.

**À faire** : trancher lequel survit avant d'écrire K. Sinon K en crée un quatrième.

### R3. Fermer les dettes RBAC

Le blueprint fournit une matrice de permissions à onze lignes et dit que la matrice
finale doit « fermer les dettes RBAC déjà documentées ». Le portail client (C) crée une
sixième catégorie d'acteur, extérieure au cabinet. Impossible à greffer sur un RBAC
troué.

### R4. Rendre la piste d'audit visible

`AuditLog` existe en base et **aucune page ne l'affiche**. Le blueprint exige un audit
sur quinze types d'événements. Ajouter quinze événements à un journal que personne ne
peut lire, c'est écrire dans le vide.

C'est aussi le §6 de la doctrine d'annulation, déjà identifié le 2026-08-17.

### R5. Versionner ce qui est configurable

Offres, formulaires, modèles, clauses, workflows. Le blueprint l'exige partout :
« les dossiers existants ne changent pas de règles lorsqu'un modèle est mis à jour ».
Ce patron doit être décidé une fois, pas réinventé par capacité.

### R6. Immutabilité de l'original

« Le fichier original ne doit jamais être remplacé par la version OCR. » « Une nouvelle
version ne supprime pas l'ancienne. » C'est la même doctrine que l'annulation comptable
livrée le 2026-08-17 : on corrige en écrivant, jamais en effaçant.

**Cette doctrine est déjà écrite et appliquée côté comptable. Elle doit être étendue au
documentaire, pas réinventée.**

---

## 4. Ce que le blueprint interdit

À garder sous les yeux pendant la construction. Ces interdits sont ce qui sépare un
logiciel d'un exercice illégal de la profession.

- aucune garantie de résultat, aucune chance de succès annoncée ;
- aucune stratégie prescrite, aucun recours déclaré fondé ;
- aucun calcul autonome d'un délai juridique déterminant ;
- aucune affirmation qu'une pièce est admissible ou doit être produite ;
- aucune affirmation qu'un cahier respecte les exigences d'un tribunal sans règle
  juridictionnelle validée et versionnée ;
- aucune conformité affichée sans contrôle qui la démontre ;
- jamais accepter un mandat, transmettre une procédure, signer, déplacer des fonds,
  supprimer une pièce ou fermer un dossier sans confirmation humaine.

Et les critères d'acceptation transversaux du §26 : une capacité n'est pas terminée si
elle marche seulement en démo, si elle confond suggestion IA et décision humaine, si
elle détruit un original, ou si elle n'a pas de test du parcours critique.

---

## 5. Plan de démarrage

### Le point qui bloque encore, et il n'est pas technique

Le blueprint §33 dit de ne pas commencer le développement avant validation du parcours
par un cabinet pratiquant réellement dans le domaine choisi. Sa question §29 Q1, quel
cabinet pilote, est ouverte.

**L'appel à Me Derisier n'a pas été fait.** C'est le seul élément de tout ce document
qui ne peut pas être délégué, et c'est lui qui décide du domaine, donc du bundle, donc
des formulaires et des listes de pièces.

> ✅ **Étape 0 faite le 2026-08-18** :
> [SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md](SPEC_PARCOURS_PILOTE_IMMIGRATION_EE.md).
> Le vertical retenu n'est **pas** celui du blueprint §28 : le cabinet pilote est en
> Ontario et fait immobilier et immigration, pas du droit familial québécois. Voir §0 de
> la spec pour les trois constats qui justifient l'écart.

### Étape 0 — La spec de parcours (prochaine action physique du blueprint)

Un seul mandat, écrans, acteurs, données, pièces attendues, décisions humaines,
automatisations, exceptions, critères d'acceptation. Les douze questions du §29 sont
tranchées **par hypothèses écrites**, chacune marquée « à confirmer par le cabinet
pilote ».

Le livrable est un document qui se lit au téléphone. L'appel devient une validation de
spec, pas une question ouverte.

**Coût** : quelques heures. **Débloque** : tout le reste.

### Étape 1 — La collecte de pièces, tranche minimale (Capacité E)

La seule capacité où le client saisit à la place du cabinet. R-03 la fait passer devant
tout ce qui ajoute une capacité sans supprimer de saisie.

Périmètre volontairement étroit :

- une liste de pièces attendues attachée à un dossier, pour **un** type de mandat ;
- un lien tokenisé envoyé au client, sur le patron déjà éprouvé deux fois ;
- dépôt, contrôles de base, classement proposé, confirmation en un clic côté cabinet ;
- un tableau de progression qui se vide.

**Hors périmètre de cette tranche** : portail complet, catalogue, signature, IA avancée.

**Restructurations déclenchées** : R1 partiellement (le document déposé doit avoir une
place), R3 partiellement (le client devient un acteur).

**Critère de fin** : un vrai dossier de Me Derisier reçoit ses pièces par lien.

### Étape 2 — L'intake (Capacité D)

Une fois que le client dépose des fichiers, lui demander des faits est le prolongement
naturel, et c'est le second crochet qui supprime de la saisie.

Déclenche R5 (versionnage) pour de bon : un formulaire modifié ne doit pas changer les
règles d'un dossier déjà ouvert.

### Étape 3 — Génération documentaire (Capacité G)

Les données validées de l'étape 2 alimentent une lettre de mandat. Déclenche R1
complètement et R6 sur le documentaire.

### Étape 4 — Workflow (Capacité K)

Seulement maintenant, parce que K a besoin de R2 tranché et parce qu'un workflow écrit
avant d'avoir vu trois parcours réels décrit un processus imaginaire.

### Ce que je repousse explicitement, et pourquoi

| Capacité | Raison du report |
| --- | --- |
| A, catalogue | machine à vendre, suppose du volume entrant que le cabinet pilote n'a pas |
| B, qualification | même raison, et dépend de A |
| I, cahiers de pièces | gain réel mais faible fréquence, n'installe aucune habitude |
| J, signature | dépend d'un fournisseur non choisi (§29 Q4) |
| M, communications | large, et rien ne casse sans lui aujourd'hui |

### Ce qui ne doit pas attendre les étapes

**R4, rendre l'audit visible.** Petit, indépendant, et il conditionne les exigences
d'audit de toutes les capacités. C'est aussi une dette déjà identifiée le 2026-08-17.

**N, clôture et conservation**, au moins la partie fidéicommis. C'est un registre
d'ancrage, et la doctrine le fait primer sur tout ce qui n'en est pas un.

---

## 6. Ordre de grandeur, honnêtement

Le blueprint décrit un produit, pas une fonctionnalité. Les étapes 0 à 4 ci-dessus
couvrent **quatre capacités sur quatorze**, et deux restructurations sur six.

Rien dans ce document ne dit combien de temps ça prend, parce que je ne le sais pas et
qu'un chiffre inventé ici deviendrait une promesse. Ce que le document dit, c'est
l'ordre, et pourquoi cet ordre.

La seule chose à ne pas faire est de lancer plusieurs capacités en parallèle. Le
blueprint le dit lui-même au §32 : SAFE ne doit pas lancer douze modules à la fois.
