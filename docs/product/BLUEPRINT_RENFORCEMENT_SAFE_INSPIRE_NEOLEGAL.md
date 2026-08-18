# Blueprint de renforcement de SAFE inspiré des capacités de Neolegal

Date : 2026-08-17  
Statut : proposition produit à valider avant spécification technique  
Propriétaire : SAFE Inc.  
Périmètre : front-office client, intake, documents, pièces, workflows, signature, IA assistive, forfaits et clôture

## 1. Objet du document

Ce document décrit les capacités que SAFE pourrait intégrer pour offrir aux cabinets une expérience numérique comparable ou supérieure à celle publiquement annoncée par Neolegal.

Il ne propose pas de copier l'interface, les textes, les modèles juridiques, les secrets commerciaux ni les processus propriétaires de Neolegal. Il traduit des principes fonctionnels observables en spécifications originales adaptées à l'architecture, au positionnement et aux forces existantes de SAFE.

La cible n'est pas de transformer SAFE Inc. en cabinet juridique. La cible est de donner à chaque cabinet utilisant SAFE les outils nécessaires pour offrir ses propres services sous sa marque et sous la supervision de ses professionnels.

## 2. Résultat visé

Un cabinet doit pouvoir exécuter le parcours suivant sans double saisie ni rupture de système :

```text
Offre publiée
  -> qualification du prospect
  -> contrôle de conflits
  -> acceptation du mandat
  -> paiement ou dépôt
  -> intake et collecte de pièces
  -> ouverture automatique du dossier
  -> tâches et échéances
  -> préparation des documents et procédures
  -> préparation du cahier de pièces
  -> révision humaine
  -> approbation et signature
  -> transmission ou dépôt
  -> facture et paiement
  -> clôture, export et conservation
```

### Condition de terminé

Le blueprint sera considéré comme livré dans le produit lorsqu'un cabinet pilote pourra accomplir ce parcours sur un type de mandat standardisé, sans intervention technique de SAFE et avec une piste d'audit complète.

## 3. Principes non négociables

### 3.1 Le professionnel décide

SAFE peut collecter, extraire, classer, résumer, suggérer et préparer. L'avocat demeure responsable :

- de l'acceptation du mandat;
- du contrôle de conflits final;
- de la qualification juridique;
- de la pertinence et de l'admissibilité d'une pièce;
- de la stratégie;
- du contenu final d'un document;
- de la signature et du dépôt;
- de la clôture du dossier.

### 3.2 Aucun automatisme silencieux

Toute action importante doit indiquer :

- la source des données;
- ce que SAFE a généré ou modifié;
- ce qui reste à valider;
- l'utilisateur ayant approuvé;
- la date et la version.

### 3.3 Une seule source documentaire

SAFE contient actuellement plusieurs concepts documentaires. Le renforcement doit les unifier sous une expérience cohérente, sans nécessairement supprimer immédiatement les modèles techniques existants.

Pour l'utilisateur, il ne doit exister que quatre intentions :

1. **Recevoir** un document ou une pièce;
2. **Rédiger** un document;
3. **Préparer** un ensemble de pièces ou une procédure;
4. **Transmettre** ou faire signer un document final.

### 3.4 Configuration par bundle

Les formulaires, modèles, pièces attendues, tâches, délais et règles doivent être fournis par les bundles SAFE. Les cabinets ne doivent pas repartir d'une page blanche.

### 3.5 Réversibilité

Le cabinet doit pouvoir exporter ses dossiers, fichiers originaux, documents générés, versions, messages, données structurées et pistes d'audit dans un format exploitable.

## 4. Fondations déjà présentes dans SAFE

Les capacités suivantes existent déjà entièrement ou partiellement et doivent être consolidées plutôt que recréées :

| Fondation | État observé | Utilisation dans la cible |
| --- | --- | --- |
| Clients et dossiers multi-cabinet | Présent | Création depuis l'intake |
| Contrôle de conflits et doublons | Présent | Garde avant acceptation |
| Vérification d'identité | Présente | Garde avant certaines opérations |
| `DossierPiece` | Présent | Métadonnées et statut des pièces |
| `DossierProcedure` | Présent | Suivi des procédures |
| Cartables par domaine | Présents | Classement automatique et cahiers |
| Sections P- et D- | Présentes | Préparation des pièces de litige |
| Suggestion de classement | Présente | Intake et tri documentaire |
| Documents riches et versions | Présents | Modèles et rédaction |
| Envoi de plusieurs documents | Présent | Livraison client |
| Résumé IA de dossier | Présent partiellement | Synthèse et pièces manquantes |
| Tâches, actes et navette | Présents | Workflow et révision |
| Temps et forfaits | Présents | Coût et rentabilité du mandat |
| Facturation, paiements, taxes | Présents | Fin du parcours commercial |
| Fidéicommis et rapprochement | Avancés | Dépôts et clôture financière |
| Conservation et conformité | Présentes par briques | Politique de clôture |
| Bundles et configuration | Présents conceptuellement | Activation rapide par pratique |

## 5. Architecture fonctionnelle cible

Le renforcement est organisé en douze capacités cohérentes. Elles doivent apparaître comme un seul parcours, pas comme douze produits indépendants.

## 6. Capacité A : catalogue de services du cabinet

### Objectif

Permettre à un cabinet de publier ses propres consultations, forfaits et mandats standardisés.

### Spécificités

Chaque offre doit contenir :

- nom public;
- domaine et sous-domaine;
- province applicable;
- description en langage clair;
- clientèle admissible;
- portée incluse;
- exclusions explicites;
- livrables;
- délai indicatif non garanti;
- prix fixe, prix de départ, dépôt ou consultation;
- taxes;
- options additionnelles;
- documents généralement requis;
- conditions de remboursement ou de conversion;
- version française et anglaise;
- statut brouillon, publié, suspendu ou archivé.

### Comportements attendus

- Une offre publiée génère une page sous la marque du cabinet.
- Le cabinet choisit si le prix est public ou fourni après qualification.
- Une offre est reliée à un modèle d'intake, un workflow, une lettre de mandat et un mode de facturation.
- La modification d'une offre crée une version. Les dossiers déjà ouverts conservent la version achetée.
- Une offre ne peut pas promettre une capacité absente du bundle actif.

### Garde-fous

- Aucune garantie de résultat.
- Aucune affirmation automatique de conformité.
- Les exclusions sont affichées avant le paiement.
- Le paiement final peut être bloqué jusqu'au contrôle minimal d'admissibilité et de conflits.

## 7. Capacité B : qualification et orientation

### Objectif

Aider le prospect à trouver le bon service sans lui donner automatiquement un avis juridique.

### Spécificités

- question ouverte sur le besoin;
- sélection de la province;
- domaine présumé;
- urgence et dates limites déclarées;
- rôle de la personne dans le dossier;
- partie adverse connue;
- valeur ou nature du litige;
- indicateurs d'inadmissibilité;
- option de demander un rappel;
- reprise ultérieure du questionnaire;
- transfert vers un humain à tout moment.

### Résultats possibles

- offre probablement adaptée;
- consultation préalable requise;
- information insuffisante;
- conflit potentiel;
- urgence nécessitant un contact humain;
- demande hors périmètre du cabinet;
- refus d'ouverture, avec message neutre.

### Interdictions

Le moteur ne doit pas :

- annoncer les chances de succès;
- prescrire une stratégie;
- conclure qu'un recours est fondé;
- calculer seul un délai juridique déterminant;
- laisser croire qu'une relation avocat-client existe avant acceptation.

## 8. Capacité C : portail client sécurisé

### Objectif

Donner au client un espace simple pour comprendre ce qui est attendu, fournir l'information et suivre son dossier.

### Tableau de bord client

Le client voit uniquement :

- le nom et le numéro du dossier;
- le professionnel responsable;
- l'étape actuelle formulée clairement;
- les actions qui lui sont demandées;
- les documents manquants;
- les rendez-vous;
- les messages;
- les documents à réviser ou signer;
- les factures et paiements autorisés;
- les prochaines dates partageables;
- le statut de fermeture et les documents finaux.

### Fonctions

- invitation sécurisée et expiration;
- authentification multifactorielle configurable;
- accès par dossier et par personne;
- délégation contrôlée à un conjoint, représentant ou dirigeant;
- téléversement mobile;
- aperçu des fichiers;
- messagerie liée au dossier;
- demandes de documents;
- formulaires sauvegardés automatiquement;
- approbations et signatures;
- centre de notifications;
- journal visible des transmissions;
- export de fin de dossier;
- révocation immédiate de l'accès.

### Cloisonnement

Le client ne voit jamais :

- les notes internes;
- la stratégie;
- les communications privilégiées non destinées au client;
- les données d'autres parties ou dossiers;
- les indicateurs de rentabilité;
- les brouillons non partagés;
- les pistes d'audit administratives internes.

## 9. Capacité D : intake intelligent

### Objectif

Collecter une fois les faits et les réutiliser dans le dossier, les tâches, les documents et la facturation.

### Constructeur de formulaires

- questions courtes, longues, dates, montants et choix;
- coordonnées et adresses structurées;
- parties multiples;
- tableaux répétables;
- logique conditionnelle;
- validation de formats;
- champs obligatoires selon la réponse;
- aide contextuelle;
- pièces jointes liées à une question;
- signature ou consentement;
- français et anglais;
- préremplissage depuis le client;
- sauvegarde et reprise;
- versionnage;
- aperçu avant publication.

### Transformation des réponses

Chaque réponse doit pouvoir alimenter explicitement :

- le client;
- une partie;
- le dossier;
- une chronologie;
- une date critique;
- une pièce attendue;
- une variable documentaire;
- une tâche;
- une condition du workflow;
- une donnée de facturation.

### Vue cabinet

- progression en pourcentage fondée sur les exigences réelles;
- réponses incomplètes;
- incohérences;
- pièces manquantes;
- changements depuis la dernière révision;
- bouton « demander une précision » lié à une réponse précise;
- validation humaine par section.

### IA assistive

L'IA peut :

- résumer les réponses;
- extraire des personnes, dates et montants;
- proposer une chronologie;
- relever des contradictions factuelles;
- suggérer des pièces manquantes selon le modèle du mandat.

L'IA ne doit jamais écraser silencieusement la réponse originale.

## 10. Capacité E : collecte et contrôle des pièces

### Objectif

Transformer une demande générique de documents en collecte structurée, vérifiable et exploitable.

### Liste de pièces attendues

Chaque type de mandat contient une liste configurable :

- nom de la pièce;
- raison de la demande;
- personne qui doit la fournir;
- formats acceptés;
- période couverte;
- date limite;
- obligatoire, conditionnelle ou facultative;
- caractère sensible;
- règle de conservation;
- destination dans le cartable.

### États d'une pièce

```text
À demander
  -> Demandée
  -> Reçue
  -> À vérifier
  -> Acceptée
  -> À remplacer
  -> Écartée
  -> Produite
  -> Archivée
```

### Contrôles automatiques

- type et taille de fichier;
- fichier corrompu ou protégé;
- détection de doublon;
- qualité minimale du scan;
- OCR et langue;
- pages manquantes probables;
- date ou période détectée;
- nom correspondant au client ou à une partie;
- présence de renseignements très sensibles;
- virus et contenu dangereux;
- empreinte cryptographique du fichier original.

### Contrôles humains

L'utilisateur confirme :

- qu'il s'agit de la bonne pièce;
- qu'elle est complète;
- qu'elle est lisible;
- qu'elle est pertinente;
- son statut de confidentialité;
- son emplacement et sa désignation.

### Expérience client

Le client doit voir des demandes précises, par exemple :

> Relevés bancaires du compte conjoint, du 1er janvier au 31 décembre 2025, toutes les pages incluses.

Il ne doit pas voir seulement « documents financiers ».

## 11. Capacité F : classement documentaire unifié

### Objectif

Donner une place évidente à chaque fichier sans exposer les distinctions techniques internes de SAFE.

### Métadonnées canoniques

- cabinet;
- client;
- dossier;
- document original;
- version;
- auteur ou source;
- date du document;
- date de réception;
- type;
- sous-type;
- section du cartable;
- partie associée;
- privilège et confidentialité;
- statut de validation;
- numéro de pièce, le cas échéant;
- empreinte;
- politique de conservation;
- provenance : client, cabinet, tiers, tribunal ou système.

### Classification proposée

SAFE peut proposer :

- la section du cartable;
- le type et sous-type;
- le titre normalisé;
- les parties liées;
- la date;
- la création d'une entrée de procédure ou de suivi;
- une désignation de pièce.

La proposition affiche un niveau de confiance et demande une confirmation sous le seuil défini.

### Règles de conservation

- Le fichier original ne doit jamais être remplacé par la version OCR.
- Une nouvelle version ne supprime pas l'ancienne.
- Toute suppression autorisée laisse une trace.
- La rétention dépend de la nature de la pièce et de son ancrage réglementaire, pas d'une durée universelle.

## 12. Capacité G : moteur de modèles et génération documentaire

### Objectif

Produire un premier document fiable à partir des données validées, puis le soumettre à la révision professionnelle.

### Types de modèles

- lettre de mandat;
- correspondance;
- mise en demeure;
- contrat;
- convention;
- déclaration;
- procédure;
- formulaire administratif;
- lettre de clôture;
- document interne;
- courriel d'accompagnement.

### Fonctions du moteur

- variables simples;
- variables formatées : dates, montants, adresses;
- conditions;
- clauses optionnelles;
- répétition pour plusieurs personnes, biens ou opérations;
- accord grammatical et variantes linguistiques;
- tableaux;
- annexes;
- numérotation;
- références croisées;
- en-tête et pied de page du cabinet;
- génération DOCX et PDF;
- aperçu des données manquantes;
- journal des valeurs injectées;
- version du modèle utilisée.

### Bibliothèque de clauses

Chaque clause doit avoir :

- identifiant stable;
- domaine;
- juridiction;
- langue;
- propriétaire;
- statut brouillon, approuvé ou retiré;
- date de révision;
- conditions d'inclusion;
- notes internes;
- historique.

### Workflow de document

```text
Brouillon système
  -> Préparé par l'équipe
  -> À réviser par l'avocat
  -> Corrections demandées
  -> Approuvé
  -> À faire signer
  -> Signé
  -> Transmis ou déposé
  -> Final verrouillé
```

### Comparaison et validation

- comparaison entre versions;
- champs non résolus visibles;
- avertissement sur les données non validées;
- interdiction d'envoyer un brouillon système non approuvé;
- possibilité de corriger le document sans modifier automatiquement les données source;
- option de renvoyer une correction vers la donnée source après confirmation.

## 13. Capacité H : préparation des procédures

### Objectif

Assister la préparation matérielle et factuelle d'une procédure sans automatiser la décision juridique.

### Fonctions

- choisir un modèle approuvé;
- injecter les coordonnées des parties et du tribunal;
- générer la chronologie factuelle depuis les faits validés;
- proposer une liste des pièces citées;
- signaler les faits sans pièce associée;
- signaler les pièces non citées;
- gérer les conclusions et montants comme champs à confirmer;
- produire la table des matières et les annexes;
- créer les tâches de signification et dépôt;
- calculer uniquement les échéances fondées sur une règle validée et versionnée;
- conserver la source de chaque fait utilisé.

### Matrice fait-preuve

SAFE devrait permettre de relier :

| Élément | Relation |
| --- | --- |
| Fait allégué | Pièce ou source qui le soutient |
| Date | Document d'origine et page |
| Montant | Calcul et justificatifs |
| Partie | Identité et rôle dans le dossier |
| Paragraphe de procédure | Faits et pièces associés |

Cette matrice aide la révision, mais ne détermine pas l'admissibilité en preuve.

## 14. Capacité I : atelier de préparation des cahiers de pièces

### Objectif

Produire, sous contrôle humain, un cahier de pièces cohérent, paginé et traçable à partir des documents du dossier.

### Étape 1 : sélection

- sélectionner les documents candidats;
- afficher l'original, le titre, la date, la source et le statut;
- exclure les brouillons et doublons;
- avertir lorsqu'une pièce contient des renseignements sensibles;
- permettre une sélection par procédure ou audience.

### Étape 2 : préparation technique

- OCR sans altérer l'original;
- rotation et orientation;
- normalisation au format PDF;
- détection des pages blanches;
- séparation ou fusion contrôlée;
- ordre chronologique ou ordre manuel;
- vérification de lisibilité;
- calcul de l'empreinte de chaque source.

### Étape 3 : désignation

- partie productrice;
- préfixe configurable, par exemple P ou D;
- numéro proposé;
- titre officiel;
- date de la pièce;
- description courte;
- statut réservé, confirmé ou produit;
- gestion des pièces groupées;
- détection des numéros dupliqués ou manquants;
- verrouillage après production.

### Étape 4 : assemblage

- page couverture;
- bordereau ou index;
- pages séparatrices;
- désignation visible;
- pagination continue;
- signets PDF;
- table des matières cliquable;
- filigrane configurable;
- numéros de page du cahier distincts des pages originales;
- annexes;
- compression sans rendre les documents illisibles.

### Étape 5 : validation

Checklist obligatoire :

- toutes les pièces choisies sont présentes;
- la numérotation est continue ou les écarts sont expliqués;
- l'ordre est correct;
- chaque pièce s'ouvre;
- chaque page est lisible;
- les renseignements à masquer ont été traités;
- le bordereau correspond au contenu;
- la version de chaque source est la bonne;
- l'avocat approuve le cahier.

### Étape 6 : sortie

- PDF final;
- ZIP optionnel des originaux;
- bordereau séparé;
- manifeste JSON ou CSV;
- empreintes SHA-256;
- date, utilisateur et version de génération;
- copie immuable du cahier produit;
- preuve de transmission ou de dépôt.

### États du cahier

```text
En préparation
  -> À vérifier
  -> Approuvé
  -> Produit
  -> Remplacé par une nouvelle version
  -> Archivé
```

### Limites obligatoires

SAFE ne doit pas affirmer automatiquement :

- qu'une pièce est admissible;
- qu'une pièce doit être produite;
- qu'un renseignement est protégé ou non;
- qu'un cahier respecte toutes les exigences du tribunal sans règle juridictionnelle validée;
- qu'un document est authentique parce qu'il a été téléversé.

## 15. Capacité J : révision, approbation et signature

### Objectif

Fermer proprement la boucle entre document préparé et document juridiquement utilisable.

### Révision interne

- assignation à un réviseur;
- commentaires liés à un passage;
- corrections demandées;
- statut par réviseur;
- comparaison entre versions;
- approbation explicite;
- verrouillage de la version approuvée.

### Approbation client

- aperçu sécurisé;
- question ou commentaire;
- acceptation du contenu;
- déclaration configurable;
- journal de l'approbation;
- refus avec motif.

### Signature électronique

- un ou plusieurs signataires;
- ordre séquentiel ou parallèle;
- champs requis;
- authentification adaptée au risque;
- expiration;
- rappels;
- refus de signer;
- certificat ou preuve de signature;
- horodatage;
- copie à chaque signataire;
- statut synchronisé dans le dossier;
- fournisseur substituable par configuration.

### Intégrations possibles

Le modèle de configuration doit pouvoir déclarer une intégration requise ou optionnelle, par exemple DocuSign ou un fournisseur canadien validé. Le fournisseur ne doit pas être codé comme unique vérité du produit.

## 16. Capacité K : moteur de workflow de mandat

### Objectif

Transformer chaque type de service en processus répétable, visible et mesurable.

### Définition d'un workflow

- identifiant et version;
- bundle et domaines applicables;
- déclencheur;
- étapes;
- tâches;
- rôle responsable;
- délai relatif;
- dépendances;
- pièces requises;
- documents à générer;
- approbations;
- communications;
- événements de facturation;
- critères de passage;
- chemins d'exception;
- critères de clôture.

### Types d'étapes

- automatique;
- client;
- administratif;
- professionnel;
- externe;
- financier;
- contrôle de conformité.

### Automatisations autorisées

- créer une tâche;
- demander une pièce;
- envoyer un rappel;
- préremplir un document;
- assigner selon un rôle;
- mettre à jour un statut;
- préparer une facture;
- signaler un retard;
- ouvrir une validation.

### Automatisations interdites sans confirmation

- accepter ou refuser définitivement un mandat;
- transmettre une procédure;
- signer au nom d'une personne;
- déplacer des fonds;
- supprimer une pièce;
- fermer un dossier;
- modifier une stratégie juridique.

### Gestion des exceptions

Chaque workflow doit prévoir :

- client qui ne répond pas;
- pièce illisible;
- conflit potentiel;
- changement de portée;
- urgence;
- dossier contesté alors qu'il était non contesté;
- paiement échoué;
- intervention d'un tiers;
- transfert ou retrait du mandat;
- échéance modifiée.

## 17. Capacité L : IA assistive et gouvernée

### Objectif

Réduire le travail de lecture, de saisie et de préparation sans déléguer le jugement professionnel.

### Cas d'usage prioritaires

1. extraction de personnes, dates, montants et références;
2. résumé factuel avec liens vers les sources;
3. chronologie proposée;
4. détection de pièces manquantes;
5. classification documentaire;
6. suggestion de titre et section;
7. brouillon à partir d'un modèle approuvé;
8. comparaison formulaire-document;
9. détection de champs non résolus;
10. prochaine action administrative suggérée;
11. tenue de temps proposée, jamais inscrite silencieusement;
12. recherche dans le dossier avec citations internes.

### Exigences de sortie

Chaque résultat IA doit afficher :

- les documents utilisés;
- les passages sources lorsque pertinent;
- le niveau de confiance ou les limites;
- les données absentes;
- la mention « suggestion à valider »;
- l'utilisateur qui accepte ou rejette;
- le modèle et le fournisseur, dans le journal technique.

### Protection des données

- fournisseur approuvé par cabinet ou par politique SAFE;
- hébergement et transferts documentés;
- aucune utilisation des données pour entraîner un modèle public;
- minimisation des données;
- journal des appels;
- filtrage des secrets inutiles;
- rétention configurable;
- mécanisme de désactivation par cabinet ou par dossier;
- ÉFVP lorsque requise;
- réponse humaine disponible.

### Tests indispensables

- exactitude de l'extraction sur un corpus validé;
- taux de faux positifs pour les pièces manquantes;
- citations pointant vers la bonne page;
- isolation stricte entre cabinets;
- résistance aux instructions contenues dans un document;
- refus d'inventer une information absente;
- comportement lorsque l'OCR est mauvais;
- français juridique québécois et anglais canadien.

## 18. Capacité M : communications unifiées

### Objectif

Éviter que les décisions, demandes et documents se dispersent entre le portail, le courriel, le téléphone et les SMS.

### Fonctions

- messages du portail;
- courriels entrants et sortants liés au dossier;
- SMS pour notifications non sensibles;
- notes d'appel;
- modèles de communication;
- pièces jointes enregistrées au dossier;
- accusés de réception;
- statut envoyé, livré, échoué ou lu lorsque disponible;
- demandes de réponse avec échéance;
- distinction communication client, adverse, tribunal, tiers et interne;
- preuve de transmission.

### Règles

- Le SMS ne contient pas de données sensibles par défaut.
- Un courriel critique non classé est signalé.
- Une pièce reçue par courriel passe par le même contrôle que le portail.
- Une communication interne ne peut pas être envoyée accidentellement au client.

## 19. Capacité N : clôture et conservation

### Objectif

Terminer réellement le mandat, restituer ce qui doit l'être et appliquer les règles de conservation.

### Checklist de clôture

- portée du mandat complétée ou motif de retrait;
- dernières tâches réglées;
- dates critiques communiquées;
- documents finaux transmis;
- originaux restitués ou localisation confirmée;
- solde en fidéicommis traité;
- débours et factures finalisés;
- paiement ou créance documenté;
- lettre de clôture générée et approuvée;
- accès portail ajusté;
- export client disponible;
- politique de conservation attribuée;
- date de destruction calculée seulement lorsque la règle est déterminable;
- responsable de la clôture;
- approbation finale.

### Après la clôture

- dossier en lecture seule sauf réouverture autorisée;
- journal immuable;
- rappels de conservation;
- suspension de destruction en cas de litige ou obligation;
- destruction sécurisée avec certificat;
- anonymisation uniquement lorsqu'elle est permise;
- export administratif du dossier.

## 20. Relier le front-office au moteur financier SAFE

Cette intégration représente une occasion de différenciation majeure.

### De l'offre à la facture

Chaque offre publique peut créer :

- un `ForfaitService`;
- un prix et des options;
- un dépôt général ou une provision, selon les règles applicables;
- un calendrier de facturation;
- des jalons facturables;
- des débours prévus;
- des tâches internes mesurables;
- un budget de temps interne même lorsque le client paie au forfait.

### Rentabilité du forfait

Le cabinet doit pouvoir comparer :

- revenu du forfait;
- options vendues;
- temps réel;
- coût interne estimé;
- débours;
- remboursements et rabais;
- délai de traitement;
- marge;
- taux de reprise documentaire;
- nombre de communications;
- causes d'exception.

### Paiement

- paiement de consultation;
- dépôt à l'achat;
- paiement complet;
- échéancier;
- facture en un clic;
- allocation automatique proposée lorsque non ambiguë;
- remboursement traçable;
- séparation stricte entre compte général et fidéicommis;
- interdiction de traiter les fonds en fidéicommis par un mécanisme non autorisé.

## 21. Configuration par bundle

Chaque bundle devrait pouvoir déclarer les nouveaux éléments suivants :

```yaml
front_office:
  public_catalog: true
  client_portal: true
  payment_before_conflict_clearance: false

intake:
  form_template_ids: []
  required_party_roles: []
  conflict_fields: []
  identity_requirements: []

documents:
  expected_document_sets: []
  document_template_ids: []
  clause_library_ids: []
  signature_provider: null
  docket_template_id: null
  exhibit_prefix_rules: []

workflow:
  mandate_workflow_ids: []
  closure_workflow_id: null
  reminder_policy_id: null

ai:
  enabled: false
  allowed_use_cases: []
  provider_policy_id: null
  human_review_required: true
```

### Activation pack enrichi

- formulaires d'intake;
- listes de pièces attendues;
- modèles documentaires;
- clauses approuvées;
- workflow de mandat;
- règles de numérotation des pièces;
- modèle de cahier;
- messages et rappels;
- lettre de clôture;
- politique de conservation;
- intégration de signature;
- parcours critique de test.

## 22. Modèle de données conceptuel à prévoir

Les noms suivants sont conceptuels et ne constituent pas encore une migration Prisma approuvée.

| Entité | Rôle |
| --- | --- |
| `ServiceOffering` | Offre publique versionnée du cabinet |
| `QualificationSession` | Réponses pré-mandat et résultat d'orientation |
| `PortalAccessGrant` | Accès d'une personne à un dossier |
| `IntakeTemplate` | Définition versionnée d'un questionnaire |
| `IntakeSubmission` | Réponses originales et données validées |
| `ExpectedDocument` | Pièce attendue et son état |
| `CanonicalDocument` | Vue unifiée d'un document et de ses versions |
| `DocumentExtraction` | Données OCR/IA proposées avec sources |
| `DocumentTemplate` | Modèle versionné |
| `ClauseDefinition` | Clause approuvée et conditions |
| `GeneratedDocument` | Document produit depuis un modèle et ses variables |
| `ReviewRequest` | Révision, commentaires et approbation |
| `SignatureEnvelope` | Signataires et piste de signature |
| `WorkflowDefinition` | Processus versionné |
| `WorkflowInstance` | Exécution du processus pour un dossier |
| `EvidenceFactLink` | Lien entre fait, paragraphe et pièce |
| `ExhibitSet` | Cahier de pièces versionné |
| `ExhibitItem` | Désignation et pages d'une pièce |
| `TransmissionRecord` | Preuve d'envoi, signature ou dépôt |
| `AiAssistanceRecord` | Usage IA, sources, résultat et validation |

### Contraintes conceptuelles

- Toutes les entités sont rattachées au `cabinetId` directement ou par une relation vérifiable.
- Les définitions et modèles sont versionnés.
- Les fichiers originaux sont immuables.
- Les décisions humaines sont séparées des suggestions système.
- Les dossiers existants ne changent pas de règles lorsqu'un modèle est mis à jour.
- Les opérations importantes produisent un événement d'audit.

## 23. Permissions minimales

| Action | Client | Assistant | Avocat | Admin cabinet | Comptabilité |
| --- | --- | --- | --- | --- | --- |
| Répondre à l'intake | Ses dossiers | Voir selon mandat | Voir | Configurer | Non |
| Téléverser une pièce | Ses dossiers | Oui | Oui | Oui | Pièces financières autorisées |
| Accepter une pièce | Non | Préparer | Oui | Oui si professionnel autorisé | Pièces comptables |
| Générer un brouillon | Non | Oui | Oui | Oui | Documents financiers seulement |
| Approuver un document juridique | Non | Non | Oui | Selon rôle professionnel | Non |
| Préparer un cahier | Non | Oui | Oui | Oui | Non |
| Produire un cahier | Non | Non par défaut | Oui | Selon rôle professionnel | Non |
| Envoyer pour signature | Approuver sa propre action | Préparer | Oui | Selon permission | Documents autorisés |
| Modifier un workflow | Non | Non | Proposer | Oui | Non |
| Fermer le dossier | Non | Préparer | Oui | Oui | Validation financière seulement |

La matrice finale doit utiliser le rôle effectif réel de SAFE et fermer les dettes RBAC déjà documentées.

## 24. Piste d'audit

Les événements suivants doivent être traçables :

- publication ou modification d'une offre;
- début et soumission d'un intake;
- modification humaine d'une donnée extraite;
- réception, remplacement, acceptation ou rejet d'une pièce;
- classification automatique et validation;
- génération d'un document;
- version du modèle et variables utilisées;
- commentaire, correction et approbation;
- signature;
- numérotation et verrouillage d'une pièce;
- génération d'un cahier;
- transmission ou dépôt;
- action financière;
- fermeture, export, réouverture ou destruction;
- usage de l'IA et décision de l'utilisateur.

## 25. Indicateurs de succès

### Efficacité

- temps entre paiement et dossier prêt à travailler;
- taux de formulaires complétés sans intervention;
- nombre moyen de relances par dossier;
- temps de préparation d'un premier document;
- temps de préparation d'un cahier de pièces;
- taux de réutilisation des données sans nouvelle saisie;
- taux de documents retournés pour correction.

### Qualité

- pièces manquantes au moment de la révision;
- incohérences détectées avant envoi;
- champs non résolus dans les documents;
- erreurs de numérotation;
- versions erronées transmises;
- tâches en retard;
- incidents de confidentialité.

### Économie

- marge par forfait;
- temps professionnel consacré au jugement plutôt qu'à l'administration;
- coût d'acquisition par offre;
- conversion qualification vers mandat;
- délai de paiement;
- valeur des débours non récupérés;
- volume de mandats traité par utilisateur.

### Expérience

- taux d'abandon de l'intake;
- délai moyen de réponse;
- satisfaction après jalons;
- demandes au soutien;
- compréhension par le client de la prochaine action;
- plaintes liées aux délais ou à la portée.

## 26. Critères d'acceptation transversaux

Une capacité n'est pas terminée si :

- elle fonctionne uniquement avec les données de démonstration;
- elle ne respecte pas l'isolation par cabinet;
- elle n'est disponible que dans une langue alors que le bundle en exige deux;
- elle ne possède pas d'état vide et de chemin de récupération;
- elle ne produit pas de journal d'audit;
- elle ne traite pas les erreurs de fournisseur externe;
- elle ne permet pas l'export;
- elle confond suggestion IA et décision humaine;
- elle détruit ou remplace un original;
- elle ne possède pas de test du parcours critique;
- elle promet une conformité non démontrée.

## 27. Plan de livraison recommandé

### Phase 0 : consolider le socle documentaire

Objectif : une seule expérience documentaire avant d'ajouter le portail.

- doctrine documentaire unique;
- adaptateur entre `Document`, `RichDocument`, `DossierPiece` et `DossierProcedure`;
- statuts canoniques;
- classement et versionnage;
- permissions et rétention;
- fermeture du dossier fonctionnelle;
- correction des risques de suppression en cascade documentés.

Condition de terminé : l'utilisateur sait toujours où joindre, rédiger, classer et retrouver une pièce.

### Phase 1 : intake et collecte de pièces

- portail client minimal;
- formulaires versionnés;
- liste de pièces attendues;
- téléversement et contrôle;
- création du dossier;
- conflict check;
- tâches automatiques;
- tableau de progression.

Condition de terminé : un mandat familial standard arrive au cabinet avec données et pièces structurées.

### Phase 2 : génération documentaire et révision

- moteur de modèles;
- variables, conditions et répétitions;
- workflow de révision;
- DOCX/PDF;
- approbation client;
- signature externe intégrée;
- preuve d'envoi.

Condition de terminé : une lettre de mandat et un premier document sont générés, révisés, signés et archivés.

### Phase 3 : atelier de cahiers de pièces

- sélection;
- normalisation;
- désignation;
- pagination;
- bordereau;
- validation;
- sortie immuable et manifeste.

Condition de terminé : un dossier pilote produit un cahier vérifié sans manipulation PDF externe.

### Phase 4 : catalogue transactionnel

- pages d'offres;
- qualification;
- prix et options;
- paiement;
- lettre de mandat;
- ouverture automatique;
- remboursements et changements de portée.

Condition de terminé : un prospect admissible devient un dossier actif sans double saisie.

### Phase 5 : IA assistive avancée

- extraction avec sources;
- chronologie;
- matrice fait-preuve;
- résumé cité;
- recherche dans le dossier;
- suggestions de pièces manquantes;
- tenue de temps proposée.

Condition de terminé : les résultats atteignent les seuils de qualité définis sur un corpus représentatif et restent vérifiables par source.

## 28. Premier vertical recommandé

Le premier parcours devrait utiliser le bundle `qc-solo-family-flat-fee`.

### Pourquoi

- le bundle existe;
- la pratique est fortement documentaire;
- les forfaits sont fréquents;
- l'expérience client et la collecte sont importantes;
- SAFE possède déjà des sections de cartable P-/D-;
- les procédures, pièces, échéances et communications offrent un test exigeant mais cohérent.

### Mandat pilote recommandé

Un parcours non contesté et répétable, à choisir avec un cabinet pilote, plutôt qu'une procédure contestée complexe.

### Artefacts du pilote

- une offre;
- un questionnaire;
- une liste de pièces;
- une lettre de mandat;
- un workflow;
- deux modèles documentaires;
- un processus de révision;
- une enveloppe de signature;
- un modèle de clôture;
- une politique de conservation;
- un jeu de données de test anonymisé.

## 29. Questions à trancher avant toute construction

1. Quel cabinet pilote valide le parcours?
2. Quel type précis de mandat est suffisamment répétable?
3. Le portail client doit-il être une route SAFE, un sous-domaine ou un domaine du cabinet?
4. Quel fournisseur de signature satisfait les besoins canadiens et québécois?
5. Quels formats de modèles sont prioritaires : DOCX, éditeur SAFE ou les deux?
6. Quelle est la source canonique d'un document dans l'architecture actuelle?
7. Quels objets existants doivent être enveloppés plutôt que migrés?
8. Quel paiement peut être accepté avant la fin du conflict check?
9. Quelles données peuvent être traitées par l'IA et auprès de quel fournisseur?
10. Quelles règles de cahier doivent être configurées par juridiction et tribunal?
11. Qui peut approuver et produire une pièce dans chaque rôle?
12. Quel niveau d'export est garanti contractuellement?

## 30. Hors périmètre initial

- conseil juridique automatisé;
- prédiction du résultat d'un dossier;
- décision automatique d'admissibilité d'une preuve;
- dépôt automatique universel auprès des tribunaux;
- marché de mandats entre avocats;
- exécution juridique en marque blanche par SAFE Inc.;
- couverture de tous les domaines du droit;
- remplacement du jugement professionnel;
- construction d'un fournisseur de signature propriétaire;
- grand livre comptable général;
- personnalisation sans limite par cabinet.

## 31. Risques principaux

| Risque | Réponse produit |
| --- | --- |
| Confusion logiciel-service juridique | Langage clair, supervision professionnelle, structure contractuelle validée |
| Mauvaise pièce ou mauvaise version | Original immuable, statuts, approbation et manifeste |
| Fuite entre cabinets | `cabinetId`, gardes serveur, tests d'isolation |
| IA qui invente | Sources obligatoires, seuils, validation humaine |
| Portail trop complexe | Une prochaine action claire, divulgation progressive |
| Explosion de personnalisation | Bundles, overrides limités, custom explicite |
| Modèle documentaire erroné | Version, propriétaire, approbation et date de révision |
| Retard opérationnel malgré l'automatisation | Capacité, SLA interne, alertes et chemins d'exception |
| Mauvaise promesse de conformité | Preuve par contrôle, aucune étiquette non démontrée |
| Verrouillage fournisseur | Interfaces substituables, export et réversibilité |

## 32. Recommandation finale

SAFE ne doit pas lancer douze modules en parallèle. Le bon ordre est :

1. unifier les documents;
2. ouvrir le portail client;
3. structurer l'intake et les pièces;
4. générer et réviser les documents;
5. préparer les cahiers de pièces;
6. publier et vendre les forfaits;
7. enrichir avec l'IA vérifiable.

Le premier avantage commercial à viser est simple :

> Le client fournit une fois ses renseignements et ses pièces. SAFE prépare le dossier, les tâches et les documents. L'équipe valide. L'avocat décide.

Le second avantage, plus différenciant, doit être :

> SAFE relie cette production juridique aux forfaits, au temps réel, aux débours, à la facturation, au paiement, au fidéicommis et à la clôture.

## 33. Prochaine action physique

Créer une spécification de parcours pour **un seul mandat pilote du bundle `qc-solo-family-flat-fee`**, avec :

- les écrans;
- les acteurs;
- les données;
- les pièces attendues;
- les modèles;
- les décisions humaines;
- les automatisations;
- les exceptions;
- les critères d'acceptation.

Ne pas commencer le développement avant validation de ce parcours par un cabinet pratiquant réellement dans le domaine choisi.

## 34. Références

### Recherche concurrentielle

- `docs/research/ANALYSE_CONCURRENTIELLE_NEOLEGAL_2026-08-17.md`
- Neolegal, Suite Affaire : https://www.neolegal.ca/suite-neolegal/
- Neolegal, fonctionnement : https://www.neolegal.ca/fonctionnement
- Neolegal, politique de confidentialité : https://www.neolegal.ca/static/neolegal_politique_renseignements_personnels.html

### Architecture et état SAFE

- `docs/SAFE_PRODUCT_READINESS_AUDIT.md`
- `docs/bundles/BUNDLE_SCHEMA.md`
- `docs/bundles/SAFE_BUNDLE_LIBRARY.md`
- `docs/bundles/BUNDLE_DECISION_RULES.md`
- `docs/configuration/CONFIG_GENERATION_MODEL.md`
- `docs/configuration/CONFIG_ARTIFACTS.md`
- `prisma/schema.prisma`, notamment `DossierPiece` et `DossierProcedure`
- `lib/dossiers/cartable-templates/index.ts`
- `lib/dossiers/practice-docket.ts`
- `lib/services/dossier-summary.ts`

### Cadre professionnel

- Barreau du Québec, technologies de l'information en pratique privée : https://www.barreau.qc.ca/fr/membres-ordre/ressources/normes-outils-references-guides/tout-savoir-ti/
- Barreau du Québec, projet pilote sur les services juridiques novateurs : https://www.barreau.qc.ca/fr/nouvelle/avis-aux-membres/projet-pilote-services-juridiques-novateurs/

