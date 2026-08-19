# État du chantier de renforcement SAFE

> ⚠️ **Sa recommandation de suite (intake structuré) est suspendue.** Voir
> `REGLE_DE_BUILD.md` §5 : aucun chantier tant qu'aucun cabinet n'a franchi le
> jour 0.

Date : 2026-08-19  
Branche vérifiée : `release/2026-06-11-compta-admin-derisier`  
Commit vérifié : `5c11176`  
Référence stratégique : `BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md`  
Référence d'exécution : `PLAN_CONSTRUCTION_MODULE_NEOLEGAL.md`

> Portée dans le temps : ce rapport a été écrit à 17 h 00 le 2026-08-19 et s'arrête au
> commit `5c11176`. Il ne rend donc pas compte de la mise en production du même jour.
> La section 6 a été reprise après coup, contre le code. Le reste est resté tel quel.

## 1. Conclusion exécutive

Les recherches sur Neolegal ont fait évoluer SAFE d'un système principalement centré sur l'exploitation interne du cabinet vers une cible plus complète : un système où le client contribue directement à la préparation administrative de son dossier.

Le chantier a déjà franchi sa première étape concrète. SAFE possède maintenant :

- une liste structurée de documents attendus par dossier;
- des modèles de pièces attendues selon le type de mandat;
- un lien sécurisé permettant au client de déposer ses documents sans créer de compte;
- une file de contrôle côté cabinet;
- les actions permettant d'accepter une pièce ou d'en demander le remplacement;
- des tests ciblés sur les modèles et la sécurité du lien.

Le chantier n'est donc plus une recherche exploratoire. La capacité E du blueprint, « collecte et contrôle des pièces », est partiellement livrée dans une première tranche exploitable.

Le prochain gain déterminant consiste à ajouter l'intake structuré, puis la génération documentaire. C'est ce qui permettra de transformer les informations et pièces reçues en dossier prêt à travailler, plutôt qu'en simple espace de dépôt.

## 2. Ce que les recherches changent pour SAFE

### Avant

SAFE était surtout organisé autour du travail interne :

```text
Client créé par le cabinet
  -> dossier
  -> temps ou forfait
  -> documents
  -> facture
  -> paiement
  -> fidéicommis
```

### Cible enrichie

La recherche ajoute le front-office et la production structurée :

```text
Demande du client
  -> qualification
  -> conflits
  -> intake
  -> collecte des pièces
  -> ouverture structurée
  -> workflow
  -> génération documentaire
  -> révision et signature
  -> facturation
  -> clôture et conservation
```

### Amélioration stratégique

SAFE ne vendrait plus seulement la gestion d'un dossier déjà ouvert. Il aiderait le cabinet à :

- recevoir le mandat;
- obtenir les renseignements et documents;
- réduire la double saisie;
- préparer le travail;
- contrôler les étapes;
- produire les documents;
- relier le travail à la facturation et à la conformité.

Cette orientation renforce la promesse centrale de SAFE : permettre à un petit cabinet de fonctionner avec la rigueur et la capacité d'une structure plus grande.

## 3. État des quatorze capacités

| Capacité | État | Preuve ou constat | Prochaine étape |
| --- | --- | --- | --- |
| A. Catalogue de services | Non commencé | `ForfaitService` existe, mais aucune offre publique versionnée | Reporter après validation du parcours de production |
| B. Qualification | Non commencé | L'audit gratuit offre un patron partiel | Reporter avec le catalogue |
| C. Portail client | Amorce livrée | Lien de collecte tokenisé sans compte | Élargir plus tard aux messages, formulaires et signatures |
| D. Intake intelligent | Non commencé côté client | Intakes internes spécialisés, aucun formulaire client versionné | Prochain chantier produit recommandé |
| E. Collecte des pièces | Première tranche livrée | `ExpectedDocument`, écran cabinet, lien client, dépôt, acceptation et remplacement | Valider en usage réel et compléter audit/export/relances |
| F. Classement unifié | Partiel | `Document`, `RichDocument`, `DossierPiece`, `DossierProcedure` coexistent | Créer un adaptateur au moment de la génération documentaire |
| G. Génération documentaire | Partiel | Éditeur et versions présents, moteur de modèles générique absent | Après l'intake |
| H. Préparation des procédures | Fondation seulement | `DossierProcedure` et cartables existent | Après les données structurées et les modèles |
| I. Cahiers de pièces | Fondation seulement | Sections P-/D- présentes | Reporter, fréquence plus faible |
| J. Révision et signature | Non commencé | Aucun fournisseur ni enveloppe de signature générique | Choisir un fournisseur après G |
| K. Workflow de mandat | Non commencé | Trois modèles de tâches coexistent | Unifier la tâche après trois parcours réels |
| L. IA assistive | Partielle | Classification, résumé et extractions spécialisées existent | Ajouter sources, journal et tests de résistance |
| M. Communications unifiées | Partielle | Navette interne et courriels sortants | Reporter après le portail minimal |
| N. Clôture et conservation | Partielle | Politiques et contrôles financiers présents, parcours complet incomplet | Prioritaire sur la partie fidéicommis et rétention |

## 4. Ce qui vient d'être livré

### Modèle `ExpectedDocument`

Cette entité représente un document demandé, et non une pièce déjà produite au tribunal. Elle évite de détourner `DossierPiece` de sa fonction P-/D-.

Le modèle porte notamment :

- le dossier et le cabinet;
- la partie concernée;
- le libellé et la raison;
- le fournisseur;
- le caractère obligatoire ou conditionnel;
- l'état;
- l'échéance;
- le document reçu;
- la pièce de cartable associée, si elle devient une pièce produite;
- la personne ayant traité la demande.

### Écran des pièces attendues

Le cabinet peut :

- générer la liste attendue selon le type de mandat;
- voir les échéances et la progression;
- suivre les états;
- ouvrir une collecte client;
- accepter un dépôt;
- demander un remplacement.

### Lien de collecte client

Le client peut :

- ouvrir un lien sécurisé sans compte;
- voir exactement ce qui est demandé;
- déposer son fichier;
- suivre ce qui reste à fournir;
- voir si une pièce a été acceptée ou doit être remplacée.

### Sécurité et isolation

Le lien utilise un jeton dédié. Les tests ciblés vérifient notamment les états et les comportements du lien. Au 19 août 2026 :

- 24 tests de collecte par lien passent;
- 13 tests de modèles de pièces attendues passent;
- total ciblé : 37 tests verts.

## 5. Ce que cette première tranche améliore immédiatement

### Réduction de la saisie administrative

Le client dépose lui-même les fichiers dans le bon contexte. L'équipe n'a plus à :

- recevoir le document dans une boîte courriel;
- le télécharger;
- retrouver le dossier;
- le renommer;
- noter manuellement qu'il a été reçu;
- relancer sans savoir ce qui manque.

### Meilleure visibilité

La collecte devient une liste finie qui se vide. Le cabinet voit :

- ce qui manque;
- ce qui est reçu;
- ce qui doit être vérifié;
- ce qui doit être remplacé;
- les délais applicables.

### Meilleure expérience client

Le client reçoit une demande précise plutôt qu'un message vague comme « envoyez vos documents ». Il voit la progression et le motif d'un remplacement.

### Fondation réutilisable

`ExpectedDocument` peut servir plusieurs domaines :

- immigration;
- famille;
- litige civil;
- immobilier;
- vérification d'identité;
- conformité financière;
- clôture de dossier.

## 6. Ce qui reste incomplet dans la collecte

La tranche actuelle ne constitue pas encore un portail client complet.

> Correction apportée le 2026-08-19 en fin de journée. La première version de cette
> section listait « expiration, révocation et régénération du lien » parmi les travaux
> restants. C'était inexact : les trois étaient déjà livrés au commit vérifié. La liste
> ci-dessous a été reprise ligne par ligne contre le code.

### Déjà livré, contrairement à la première version de cette section

- expiration : le lien porte une échéance, contrôlée à chaque ouverture;
- révocation : « Couper l'accès » efface le jeton et son échéance;
- régénération : redemander un lien après révocation en engendre un neuf, tandis qu'un
  lien encore valide est simplement réaffiché plutôt que remplacé;
- indistinction volontaire : un lien inexistant et un lien révoqué rendent la même
  phrase, afin de ne rien laisser deviner à qui essaie des jetons;
- trace des décisions : accepter ou demander un remplacement écrit une entrée d'audit
  signée. Ce qui manque n'est pas la trace, c'est l'écran qui la montre au cabinet.

### Réellement à construire ou à vérifier

- validation par un cabinet pilote sur un vrai processus;
- politiques de relance automatiques et plafonnées : rien n'existe aujourd'hui, la
  relance reste un geste manuel du cabinet;
- écran d'audit de la collecte : la trace est écrite, elle n'est lisible nulle part;
- export des demandes et dépôts : aucun export ne connaît `ExpectedDocument`;
- contrôles avancés de lisibilité, pages manquantes et doublons;
- lecture automatique et extraction avec confirmation : la brique existe ailleurs dans
  SAFE, elle n'est pas branchée sur les pièces collectées;
- bilinguisme du parcours client : la page de dépôt est écrite en français en dur,
  sans passer par les fichiers de traduction;
- notifications d'échec et récupération;
- tests automatiques de bout en bout : le parcours client a été ouvert et lu dans un
  navigateur le 2026-08-19, mais aucun test ne le rejoue;
- preuve de conservation de l'original intact;
- passage contrôlé d'un document reçu vers une `DossierPiece` produite : la colonne
  `dossierPieceId` existe au schéma et n'est écrite par aucun code.

## 7. Prochain chantier recommandé : intake client structuré

### Pourquoi il vient maintenant

La collecte répond à « quels fichiers devons-nous recevoir? ». L'intake répond à « quels faits devons-nous connaître? ».

Ensemble, les deux permettent au client de faire une partie du travail administratif à la source.

### Tranche minimale

Pour un seul type de mandat :

- questionnaire versionné;
- logique conditionnelle;
- sauvegarde et reprise;
- parties multiples;
- chronologie;
- pièces demandées à partir des réponses;
- validation par section;
- transformation explicite vers le client, le dossier et les parties;
- aucune décision juridique automatique.

### Condition de terminé

Un vrai dossier pilote arrive au cabinet avec :

- les parties correctement identifiées;
- les faits structurés;
- une chronologie proposée;
- les pièces demandées;
- les éléments manquants visibles;
- aucune double saisie essentielle.

## 8. Chantier suivant : génération documentaire

L'intake et les pièces validées doivent ensuite alimenter :

- la lettre de mandat;
- les correspondances;
- un premier document juridique standardisé;
- les tâches de révision;
- l'approbation humaine;
- la sortie PDF ou DOCX.

Ce chantier nécessite :

- des modèles versionnés;
- des variables typées;
- des conditions;
- des répétitions;
- un journal des valeurs injectées;
- une comparaison entre versions;
- un statut d'approbation;
- l'interdiction d'envoyer un brouillon non approuvé.

## 9. Restructurations nécessaires, mais à ne pas faire seules

### Documents

Créer un adaptateur cohérent entre :

- `Document`;
- `RichDocument`;
- `DossierPiece`;
- `DossierProcedure`.

Cette restructuration doit être réalisée lorsque la génération documentaire la rend visible, pas comme chantier abstrait.

### Tâches

SAFE possède trois concepts de tâche. Un moteur de workflow ne doit pas en créer un quatrième. La consolidation doit intervenir avant la capacité K.

### RBAC

Le client devient un nouvel acteur extérieur au cabinet. Les permissions doivent être fermées avant l'élargissement du portail.

### Audit

`AuditLog` existe, mais il doit devenir visible et exploitable. Chaque demande, dépôt, validation, remplacement, génération et transmission devra être consultable.

### Versionnement

Formulaires, modèles, offres et workflows doivent partager une doctrine : un dossier conserve la version avec laquelle il a été ouvert.

## 10. Ordre de construction proposé

### Priorité 1

**Stabiliser et valider la collecte actuelle.**

Définition de terminé : un cabinet utilise la collecte sur un vrai dossier, les corrections terrain sont intégrées, le parcours est auditable et aucun fichier ne se perd.

### Priorité 2

**Construire l'intake pour ce même mandat.**

Définition de terminé : les réponses créent ou préremplissent les données du dossier et déclenchent les bonnes demandes de pièces.

### File d'attente ordonnée

3. génération documentaire;
4. révision et approbation;
5. signature électronique;
6. workflow de mandat;
7. clôture complète;
8. portail client élargi;
9. cahiers de pièces;
10. catalogue et qualification publics;
11. communications unifiées;
12. IA avancée et recherche citée.

## 11. Ce qu'il ne faut pas ouvrir maintenant

- un catalogue public complet;
- un marché de mandats;
- une marque blanche juridique exploitée par SAFE Inc.;
- tous les domaines de pratique;
- un constructeur de workflows universel;
- un moteur de signature propriétaire;
- un moteur de cahiers de pièces avant usage régulier de la collecte;
- une IA donnant une conclusion juridique.

Ces chantiers ajouteraient de la surface avant que le parcours principal soit prouvé.

## 12. Risques actuels

| Risque | Niveau | Réponse |
| --- | --- | --- |
| Absence de validation par un cabinet actif sur ce parcours | Élevé | Faire utiliser la collecte sur un dossier réel |
| Portail tokenisé trop large ou mal révoqué | Élevé | Revue sécurité, expiration et tests E2E |
| Multiplication des modèles documentaires | Élevé | Adaptateur canonique, pas de migration précipitée |
| Nouveau workflow sur trois modèles de tâche | Élevé | Décision d'architecture avant K |
| Promesse d'IA supérieure à la preuve | Moyen | Sources, validation et métriques |
| Dispersion sur quatorze capacités | Élevé | Maximum deux priorités actives |
| Confusion logiciel et service juridique | Élevé | Professionnel décide, automatisation administrative seulement |
| Effet vitrine sans usage réel | Élevé | Critère de terminé fondé sur un dossier réel |

## 13. Décision proposée

Le chantier doit rester centré sur une boucle courte :

```text
Le cabinet demande
  -> le client fournit
  -> SAFE classe et signale
  -> l'équipe vérifie
  -> le dossier devient prêt à travailler
```

Une fois cette boucle éprouvée, l'intake ajoute les faits. La génération documentaire ajoute le premier livrable. Le workflow relie ensuite les étapes. C'est à ce moment que SAFE commence réellement à reproduire l'avantage opérationnel observé chez Neolegal, tout en conservant son propre avantage sur la facturation, le fidéicommis et la conformité.

## 14. Prochaine action physique

Faire exécuter la collecte actuelle sur un dossier réel ou représentatif par le cabinet pilote, puis noter :

1. les documents réellement demandés;
2. les termes incompris par le client;
3. les motifs de remplacement les plus fréquents;
4. les étapes encore accomplies par courriel;
5. les doubles saisies restantes;
6. les données qui devraient alimenter automatiquement le dossier.

Ce relevé devient directement la spécification de l'intake, prochaine priorité du chantier.

## 15. Vérifications réalisées pour cet état

- lecture du blueprint de renforcement;
- lecture du plan de construction;
- lecture des spécifications de collecte et du parcours pilote;
- vérification du schéma Prisma et de la migration `ExpectedDocument`;
- inspection des six derniers commits liés aux pièces et à la collecte;
- exécution des tests ciblés : 37 tests verts.

