# Modèle unifié de développement de SAFE par SAFE Lead

> ⚠️ **Concerne SAFE Inc., pas le produit livré aux cabinets.** Jamais validé, et
> ne cite pas la doctrine d'ancrage. Ses chantiers attendent qu'un cabinet ait
> ancré. Voir `REGLE_DE_BUILD.md`, qui prime.

Date : 2026-08-19  
Statut : doctrine stratégique proposée, à valider par la direction  
Périmètre : développement commercial, activation client, apprentissage produit et croissance de SAFE Inc.  
Système de pilotage : SAFE Lead

## 1. Décision fondatrice

SAFE Lead est le poste de commande interne de SAFE Inc.

Il ne doit pas devenir :

- une plateforme qui vend des dossiers juridiques aux avocats;
- une marketplace d'avocats;
- un intermédiaire qui prend une commission sur les honoraires;
- un CRM juridique installé chez les cabinets;
- un système de prospection massive automatisée.

SAFE Lead doit permettre à SAFE Inc. de suivre une seule continuité :

```text
Cabinet inconnu
  -> cabinet compris
  -> cabinet qualifié
  -> audit réalisé
  -> bundle recommandé
  -> décision d'achat
  -> cabinet activé
  -> usage réel observé
  -> résultats mesurés
  -> produit amélioré
  -> client retenu
  -> référence obtenue
```

La croissance de SAFE ne vient pas de la vente isolée d'un abonnement. Elle vient de la capacité à transformer méthodiquement un problème opérationnel réel en configuration activée, utilisée et mesurable.

## 2. Philosophie économique

### Ce que SAFE vend

SAFE vend une infrastructure opérationnelle aux cabinets.

Le cabinet conserve :

- sa marque;
- ses clients;
- ses honoraires;
- son jugement professionnel;
- ses modèles;
- ses données;
- sa marge;
- sa liberté de quitter SAFE.

SAFE facture :

- un abonnement prévisible;
- une implantation ou configuration lorsque nécessaire;
- du travail custom clairement séparé;
- éventuellement des intégrations ou services spécialisés.

SAFE ne prélève pas une part croissante du succès du cabinet.

### Proposition de valeur

> SAFE donne aux petits cabinets l'infrastructure nécessaire pour fonctionner avec la rigueur, la visibilité et la capacité d'une structure plus grande, sans leur enlever leurs clients ni leurs décisions.

### Principe de valeur

Le prix de SAFE doit rester inférieur à la somme des pertes évitées et du temps rendu :

```text
Valeur SAFE =
  temps administratif supprimé
  + revenus facturables récupérés
  + erreurs et risques évités
  + rapidité d'encaissement
  + capacité additionnelle
  + tranquillité opérationnelle
```

## 3. Les trois systèmes réunis

Le modèle de développement unifie trois systèmes qui ne doivent plus être pilotés séparément.

### Système 1 : SAFE Lead

Il répond à :

> Quel cabinet devons-nous aider maintenant, pourquoi et par quelle prochaine action?

Il porte :

- organisations et contacts;
- origine du lead;
- consentement et préférences;
- activités et communications;
- score et justification;
- audit;
- consultation;
- décision;
- conversion;
- activation;
- suivi et référence.

### Système 2 : moteur audit, bundle et configuration

Il répond à :

> Quelle version de SAFE correspond réellement à ce cabinet?

Il porte :

- `AuditSnapshot`;
- profils dérivés;
- `BundleRecommendation`;
- décision de consultation;
- overrides autorisés;
- écarts custom;
- `CabinetConfigurationPackage`;
- seed plan;
- checklist d'activation.

### Système 3 : produit SAFE

Il répond à :

> Le cabinet obtient-il réellement le résultat promis?

Il porte :

- clients et dossiers;
- pièces et documents;
- tâches et échéances;
- forfaits et temps;
- facturation et paiements;
- fidéicommis;
- conformité;
- clôture;
- métriques d'usage et de résultat.

### Règle d'unification

Une information ne doit pas être ressaisie lorsqu'elle passe d'un système au suivant.

```text
Lead
  -> AuditSubmission
  -> BundleRecommendation
  -> ConsultationDecision
  -> Cabinet
  -> CabinetConfigurationPackage
  -> ActivationChecklist
  -> Usage réel
  -> Résultat client
  -> Apprentissage produit
```

## 4. Le cycle de développement SAFE

Le développement est organisé en huit mouvements. Chaque mouvement possède un résultat, une preuve et une porte de sortie.

## 5. Mouvement 1 : attirer les bons cabinets

### Objectif

Faire entrer dans SAFE Lead un petit nombre de cabinets fortement compatibles, pas une grande liste de contacts peu pertinents.

### Profil prioritaire

- cabinet de 1 à 5 professionnels;
- Québec ou Ontario;
- douleur administrative visible;
- processus encore fragmenté;
- dirigeant accessible;
- capacité de décider;
- volume suffisant pour ressentir le problème;
- domaine couvert par un bundle existant ou proche.

### Sources

- références;
- contenu démontrant une preuve réelle;
- audit gratuit;
- LinkedIn relationnel;
- partenaires professionnels;
- événements ciblés;
- recherche manuelle de cabinets compatibles.

### Fonction de SAFE Lead

- dédoublonner;
- enregistrer la provenance;
- conserver la base de consentement;
- identifier les contacts;
- calculer une compatibilité expliquée;
- proposer une seule prochaine action.

### Porte de sortie

Le cabinet entre dans l'exploration seulement si un problème plausible et un interlocuteur pertinent sont identifiés.

## 6. Mouvement 2 : comprendre avant de vendre

### Objectif

Comprendre le système de travail du cabinet avant de proposer SAFE.

### Instrument principal

L'audit gratuit, suivi d'une conversation de validation.

### Ce que l'audit doit établir

- structure et taille;
- domaines de pratique;
- volume de dossiers;
- modes de facturation;
- outils actuels;
- saisies manuelles;
- points de rupture;
- fidéicommis;
- conformité applicable;
- équipe et rôles;
- priorités;
- capacité de changement.

### Fonction de SAFE Lead

- rattacher automatiquement l'audit au lead;
- mettre à jour les scores avec justification;
- produire la fiche de préparation;
- extraire les questions à confirmer;
- créer la prochaine action;
- conserver ce qui a été déclaré séparément de ce qui est déduit.

### Porte de sortie

Le problème prioritaire est formulé dans les mots du cabinet et son coût est observable.

## 7. Mouvement 3 : prescrire une configuration, pas présenter un catalogue

### Objectif

Proposer le plus petit système SAFE capable de corriger le problème prioritaire.

### Méthode

```text
Audit
  -> profils dérivés
  -> meilleur bundle
  -> overrides limités
  -> custom explicite
  -> parcours critique
```

### Livrable commercial

La proposition ne doit pas être une liste de modules. Elle doit montrer :

1. la situation actuelle;
2. la perte ou le risque;
3. le parcours cible;
4. ce que SAFE configure;
5. ce que le cabinet doit fournir;
6. la condition de réussite;
7. le prix;
8. ce qui est exclu.

### Fonction de SAFE Lead

- afficher la recommandation de bundle;
- conserver les raisons;
- préparer la consultation;
- enregistrer les objections;
- distinguer standard, override et custom;
- empêcher le passage à la signature sans décision de consultation.

### Porte de sortie

Le cabinet comprend le résultat acheté, le travail requis et la limite de l'engagement.

## 8. Mouvement 4 : convertir sans casser la confiance

### Objectif

Transformer un accord en cabinet configuré sans rupture de données ni promesse implicite.

### État actuel utile

La conversion transactionnelle `Lead -> Cabinet` existe déjà. Elle crée le cabinet, l'invitation en attente, la checklist d'activation, les tâches et l'audit sans envoyer automatiquement une communication externe.

### Règles

- aucune invitation envoyée sans geste humain;
- aucune création partielle;
- aucun mot de passe choisi par SAFE Inc.;
- aucune promesse non écrite;
- aucune tâche de prospection laissée ouverte après conversion;
- aucune activation sans configuration validée.

### Fonction de SAFE Lead

- vérifier l'étape `SIGNED`;
- convertir transactionnellement;
- rattacher `Lead.cabinetId`;
- créer la checklist;
- préparer l'invitation;
- basculer vers l'activation;
- préserver l'historique commercial.

### Porte de sortie

Le cabinet existe, la configuration est définie, les responsabilités sont assignées et l'invitation peut être envoyée consciemment.

## 9. Mouvement 5 : activer autour d'un premier résultat

### Objectif

Produire une victoire opérationnelle rapide, visible et répétable.

### Doctrine d'activation

L'activation ne signifie pas « compte créé ». Elle signifie qu'un parcours critique a été exécuté.

Exemples :

- première collecte de pièces complétée;
- premier client et dossier correctement ouverts;
- première facture émise sans correction;
- premier rapprochement fiduciaire complété;
- premier document généré et approuvé;
- premier dossier fermé avec checklist.

### Fonction de SAFE Lead

- instancier la checklist depuis le bundle;
- afficher le prochain jalon;
- identifier le blocage;
- assigner la responsabilité à SAFE ou au cabinet;
- enregistrer la preuve de réussite;
- ne passer à `LIVE` qu'après le parcours critique.

### Porte de sortie

Le cabinet a obtenu un résultat réel dans SAFE et sait le répéter sans intervention technique.

## 10. Mouvement 6 : transformer l'usage en apprentissage produit

### Objectif

Faire de chaque activation une source structurée d'amélioration, sans transformer chaque demande en custom.

### Signaux à recueillir

- étape où le cabinet s'arrête;
- double saisie restante;
- pièce ou donnée souvent manquante;
- correction fréquente;
- contournement par courriel ou Excel;
- temps réellement économisé;
- erreur évitée;
- fonctionnalité non comprise;
- exception propre au cabinet;
- demande répétée par plusieurs cabinets.

### Règle de décision produit

```text
Écart unique
  -> support, formation ou override

Écart répété dans un même profil
  -> enrichir le bundle

Écart répété entre plusieurs profils
  -> capacité standard SAFE

Écart qui change le moteur cœur
  -> custom évalué et facturé
```

### Fonction de SAFE Lead

- relier le retour au cabinet, au bundle et au parcours;
- distinguer problème produit, configuration, formation et donnée;
- compter les récurrences;
- estimer l'impact;
- créer une décision, pas automatiquement une fonctionnalité.

### Porte de sortie

Chaque retour possède une catégorie, une preuve et une décision explicite.

## 11. Mouvement 7 : démontrer la valeur et retenir

### Objectif

Prouver au cabinet que SAFE produit une amélioration continue.

### Revue de valeur

À J+30, puis périodiquement :

- résultats obtenus;
- temps administratif supprimé;
- facturation récupérée;
- délais réduits;
- dossiers ou pièces en retard;
- erreurs ou risques évités;
- usage par rôle;
- friction restante;
- prochaine amélioration autorisée.

### Fonction de SAFE Lead

- planifier la revue;
- préparer le résumé à partir des données réelles;
- enregistrer la satisfaction et le risque;
- créer les actions convenues;
- distinguer rétention, expansion et support.

### Porte de sortie

Le client peut expliquer avec des preuves pourquoi il conserve SAFE.

## 12. Mouvement 8 : transformer le résultat en croissance

### Objectif

Obtenir une référence ou une expansion seulement après une réussite démontrée.

### Formes de croissance

- référence à un autre cabinet;
- témoignage factuel;
- étude de cas;
- ajout d'un utilisateur;
- activation d'un autre domaine;
- ajout d'un workflow;
- partenariat avec une association ou un fournisseur complémentaire.

### Fonction de SAFE Lead

- identifier les clients éligibles;
- préparer la demande au bon moment;
- enregistrer la référence;
- rattacher le nouveau lead à sa source;
- mesurer la boucle complète.

### Porte de sortie

La recommandation provient d'une valeur vécue, pas d'une incitation artificielle.

## 13. Le volant de croissance SAFE

```text
Audit utile
  -> meilleure compréhension du cabinet
  -> meilleur bundle
  -> activation plus rapide
  -> résultat plus visible
  -> rétention plus forte
  -> référence plus crédible
  -> meilleur lead entrant
  -> nouvel audit utile
```

Le volant ne tourne pas par le volume publicitaire. Il tourne par la précision de l'appariement entre cabinet, problème, bundle et résultat.

## 14. Les quatre couches de SAFE Lead

### Couche 1 : mémoire

SAFE Lead doit savoir :

- qui est le cabinet;
- qui sont les personnes;
- ce qui a été déclaré;
- ce qui a été promis;
- ce qui s'est passé;
- ce qui est autorisé;
- ce qui reste inconnu.

### Couche 2 : action

SAFE Lead doit permettre de :

- préparer et envoyer une communication approuvée;
- créer une tâche;
- planifier un rendez-vous;
- lancer un audit;
- préparer une consultation;
- convertir;
- activer;
- suivre un résultat.

### Couche 3 : intelligence

SAFE Lead peut :

- résumer;
- enrichir avec source;
- extraire des tâches;
- détecter un risque;
- calculer un score expliqué;
- proposer une prochaine action;
- identifier un pattern entre cabinets.

### Couche 4 : décision

SAFE Lead doit répondre chaque jour à :

> Quelle action concrète produit le plus de valeur maintenant?

La réponse doit contenir :

- le cabinet;
- l'action;
- la raison;
- le résultat attendu;
- les informations nécessaires;
- l'effort estimé;
- le niveau de confiance.

## 15. Les étapes du pipeline unifié

L'enum détaillé peut demeurer en base, mais l'interface doit regrouper les étapes en phases lisibles.

| Phase | Étapes détaillées | Question de direction |
| --- | --- | --- |
| Découverte | `AWARENESS`, `ENGAGED`, `CONTACTED`, `CONVERSING` | Ce cabinet mérite-t-il une exploration? |
| Diagnostic | `LEAD_MAGNET_SENT`, `AUDIT_PROPOSED`, `AUDIT_SCHEDULED`, `AUDIT_COMPLETED` | Avons-nous compris un problème réel? |
| Décision | `CONSULTATION_PHASE2`, `READY_TO_SIGN`, `SIGNED` | Le bon système est-il défini et accepté? |
| Activation | `ACTIVATION_IN_PROGRESS`, `LIVE` | Le cabinet a-t-il obtenu son premier résultat? |
| Expansion | `AMBASSADOR` | La valeur est-elle assez forte pour être recommandée? |

### Garde-fous de transition

- pas d'audit complété sans données minimales;
- pas de consultation sans hypothèses à confirmer;
- pas de signature sans décision de configuration;
- pas de conversion sans `SIGNED`;
- pas de `LIVE` sans preuve d'un parcours critique;
- pas d'`AMBASSADOR` sans résultat et consentement.

## 16. Modèle économique recommandé

### Revenus

1. abonnement SAFE;
2. implantation standard;
3. custom facturé séparément;
4. intégrations ou services spécialisés;
5. formation additionnelle lorsque hors activation standard.

### À éviter

- commission sur les honoraires juridiques;
- coût par dossier qui pénalise la croissance;
- propriété de la clientèle du cabinet;
- frais cachés de sortie;
- custom gratuit absorbé dans l'abonnement;
- promesse de « tout inclus » sans limite.

### Principe de tarification

Le cabinet doit pouvoir grandir plus vite que sa facture SAFE.

Le prix peut évoluer selon :

- plan;
- nombre d'utilisateurs;
- capacités activées;
- volume technique raisonnable;
- niveau de support;
- travail d'implantation.

Il ne devrait pas être directement indexé sur le montant des honoraires juridiques encaissés.

## 17. Modèle de développement produit

### Règle 1 : partir d'un parcours réel

Aucun grand module ne commence par une abstraction. Il commence par un cabinet, un mandat et une douleur répétable.

### Règle 2 : retirer une saisie avant d'ajouter un tableau

Priorité aux fonctions où :

- le client fournit directement l'information;
- une donnée circule sans être recopiée;
- une pièce arrive au bon endroit;
- une facture se prépare depuis le travail réel;
- une échéance devient visible sans suivi manuel.

### Règle 3 : standardiser après observation

Un workflow n'est généralisé qu'après observation de plusieurs parcours réels.

### Règle 4 : mesurer la valeur produite

Chaque chantier doit modifier au moins un indicateur :

- temps;
- erreur;
- encaissement;
- capacité;
- conformité;
- expérience client.

### Règle 5 : fermer avant d'étendre

Une tranche doit posséder :

- l'entrée;
- l'action;
- la validation;
- la sortie;
- l'audit;
- le test;
- la récupération après erreur.

## 18. Boucle produit de SAFE Lead

SAFE Lead doit faire circuler un apprentissage sans mélanger les sources :

```text
Observation d'un cabinet
  -> problème documenté
  -> classification
  -> fréquence
  -> impact
  -> décision
  -> spec
  -> construction
  -> activation pilote
  -> mesure
  -> standard, bundle, override ou abandon
```

### Catégories obligatoires d'un retour

- bug;
- manque de configuration;
- besoin de formation;
- friction UX;
- capacité absente;
- exception réglementaire;
- custom véritable;
- demande séduisante sans preuve d'usage.

## 19. Indicateurs de direction

SAFE Lead ne doit pas devenir un mur de métriques. La direction doit suivre un petit ensemble relié au cycle.

### Acquisition

- nouveaux cabinets compatibles;
- provenance;
- audits commencés et complétés;
- délai avant première conversation utile.

### Conversion

- consultations réalisées;
- décisions rendues;
- propositions acceptées;
- raisons de perte;
- durée du cycle.

### Activation

- délai signature vers invitation;
- délai invitation vers premier accès;
- délai vers premier parcours critique;
- blocage principal;
- part des activations terminées.

### Valeur

- temps administratif supprimé;
- revenus facturables récupérés;
- délai d'encaissement;
- erreurs ou écarts évités;
- usage du parcours prioritaire.

### Rétention

- clients actifs;
- risque de départ;
- demandes de support répétées;
- revue de valeur complétée;
- expansion et références.

### Produit

- retours récurrents par bundle;
- adoption des nouvelles tranches;
- contournements encore utilisés;
- custom transformé en standard;
- fonctionnalités sans usage.

## 20. Score unifié d'un cabinet

Un seul score global ne doit pas masquer des réalités différentes. SAFE Lead doit conserver des dimensions séparées.

| Dimension | Question |
| --- | --- |
| Compatibilité | Ce cabinet correspond-il aux profils servis? |
| Douleur | Le problème est-il réel, fréquent et coûteux? |
| Engagement | Le cabinet participe-t-il au processus? |
| Décision | Les décideurs, le budget et le calendrier sont-ils présents? |
| Activation | Le cabinet fournit-il ce qui est requis pour réussir? |
| Valeur | SAFE produit-il un résultat mesurable? |
| Risque | Existe-t-il un signal de blocage ou de départ? |

Chaque dimension doit afficher ses faits, sa date et sa confiance. Le score propose une priorité, il ne prend jamais la décision.

## 21. Organisation opérationnelle

### Fondateur ou direction

- choisit le segment;
- conduit les conversations importantes;
- tranche le bundle et le custom;
- valide les promesses;
- décide des priorités produit;
- demande les références.

### SAFE Lead

- mémorise;
- prépare;
- signale;
- ordonne;
- mesure;
- explique.

### Produit SAFE

- exécute les parcours;
- produit les preuves;
- protège les données;
- mesure l'usage;
- remonte les blocages.

### Cabinet client

- décrit son fonctionnement;
- valide la configuration;
- fournit les données;
- exécute le parcours;
- conserve les décisions professionnelles;
- confirme les résultats.

## 22. Niveaux d'automatisation

### N1 : suggestion

Le système informe ou recommande. Aucune écriture importante ni communication externe.

### N2 : préparation avec approbation

Le système prépare une tâche, un message, un résumé, une configuration ou une prochaine action. Un humain approuve.

### N3 : exécution préautorisée et bornée

Réservée à des opérations répétitives, réversibles et mesurées. Aucun usage externe en phase initiale sans période d'observation.

### Interdits permanents

- inventer une donnée manquante;
- contacter un désabonné;
- envoyer une promesse non approuvée;
- modifier un prix ou un contrat;
- convertir ou fermer sans garde;
- présenter une hypothèse comme un fait;
- décider d'une question juridique pour un cabinet.

## 23. Feuille de route du modèle unifié

### Priorité 1 : fermer la boucle commerciale et d'activation

Définition de terminé :

- le lead entre avec consentement et provenance;
- l'audit se rattache;
- la consultation produit une décision;
- le lead signé devient un cabinet;
- le bundle instancie la checklist;
- le cabinet atteint un premier résultat;
- la preuve revient dans SAFE Lead.

### Priorité 2 : fermer la boucle produit

Définition de terminé :

- les retours d'activation sont classifiés;
- les patterns par bundle sont visibles;
- une décision produit est reliée à ses preuves;
- la nouvelle tranche est mesurée après livraison.

### Ensuite

3. revue de valeur automatisée en préparation N2;
4. détection du risque de blocage ou départ;
5. demande de référence au moment approprié;
6. prévision de capacité et revenus;
7. automatisations N3 limitées après preuve.

## 24. État actuel utile

Les fondations suivantes existent déjà dans le code :

- modèles `Workspace`, `Lead`, `LeadContact`, `Activity`, `Task` et `LeadMagnet`;
- pipeline détaillé de `AWARENESS` à `AMBASSADOR`;
- scoring en trois dimensions;
- prochaine action clé;
- moteur de courriel avec aperçu;
- assistant de prospection;
- audit gratuit rattachable au lead;
- conversion transactionnelle `Lead -> Cabinet`;
- invitation séparée;
- `ActivationChecklist`;
- support bidirectionnel;
- page SAFE Lead avec file chaude et sources d'acquisition.

Les écarts structurants du modèle unifié sont :

- instanciation réelle de la checklist depuis le bundle;
- preuve du premier résultat renvoyée dans SAFE Lead;
- revue de valeur structurée;
- boucle de retours produit par bundle;
- score d'activation, de valeur et de risque;
- consentement CRM complet et mesure des communications à revalider selon l'état courant;
- expérience de direction centrée sur une seule prochaine action.

## 25. Risques

| Risque | Réponse |
| --- | --- |
| SAFE Lead devient un CRM générique | Toute fonction doit servir le cycle audit, bundle, activation, valeur |
| Trop de prospection automatisée | Faible volume, haute pertinence, approbation humaine |
| Produit guidé par le client le plus bruyant | Compter fréquence, segment et impact |
| Custom gratuit | Standard, override et custom séparés contractuellement |
| Activation réduite à un accès | Exiger un premier parcours critique |
| Scores opaques | Dimensions séparées et justification visible |
| Données commerciales séparées du produit | Identifiants et événements reliés de bout en bout |
| Trop de métriques | Une prochaine action, quelques indicateurs directionnels |
| Commission ou concurrence avec les cabinets | Abonnement d'infrastructure, aucune propriété de leur clientèle |

## 26. Formulation de la vision unifiée

> SAFE Lead trouve et comprend les cabinets que SAFE peut réellement aider. L'audit transforme leurs difficultés en configuration. Les bundles transforment la configuration en activation. Le produit transforme l'activation en résultats mesurables. Ces résultats alimentent l'amélioration, la rétention et les références.

Version courte :

> **Comprendre le cabinet. Configurer le bon système. Prouver le résultat. Répéter ce qui fonctionne.**

## 27. Prochaine action physique

Relier l'`ActivationChecklist` au bundle recommandé et définir, pour chaque bundle actif, un seul `critical_user_journey` dont la réussite autorise le passage de `ACTIVATION_IN_PROGRESS` à `LIVE`.

Premier exemple proposé :

```text
Bundle : qc-solo-family-flat-fee
Parcours critique :
  créer ou confirmer le client
  -> ouvrir le dossier
  -> générer les pièces attendues
  -> envoyer le lien de collecte
  -> recevoir une pièce
  -> accepter ou demander un remplacement
  -> afficher la progression réelle
```

Cette action relie immédiatement SAFE Lead, les bundles, la collecte déjà construite et la preuve d'activation.

## 28. Références internes

- `docs/product/CRM_SPEC_v1.md`
- `docs/product/CAHIER_DES_CHARGES_CRM_INTELLIGENT.md`
- `docs/product/CAHIER_DES_CHARGES_CRM_EXTENSION_COMPTA_TDAH.md`
- `docs/product/CONSOLE_CONSULTANT_REFACTOR_v1.md`
- `docs/audit/AUDIT_SCHEMA_CANONIQUE.md`
- `docs/audit/AUDIT_TO_BUNDLE_MAPPING.md`
- `docs/configuration/CONFIG_GENERATION_MODEL.md`
- `docs/configuration/CONFIG_ARTIFACTS.md`
- `docs/bundles/BUNDLE_SCHEMA.md`
- `docs/bundles/SAFE_BUNDLE_LIBRARY.md`
- `docs/product/BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md`
- `docs/product/ETAT_CHANTIER_RENFORCEMENT_SAFE_2026-08-19.md`
- `lib/services/crm/conversion.ts`
- `lib/crm/lead-from-audit.ts`
- `lib/services/crm/prochaine-action.ts`
- `app/(app)/console/safe-lead/page.tsx`

