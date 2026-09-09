# Audit de l’interface métier SAFE

Date : 2026-09-05  
Portée : les 76 routes de `app/(app)` destinées au cabinet, hors console SAFE Inc., pages publiques et prototypes.  
Axes : logique métier, accès à l’information, présentation de l’information, utilité et facilité d’usage.

## Verdict exécutif

SAFE possède davantage de profondeur métier que son interface ne permet d’en percevoir. Le problème principal n’est pas l’absence de fonctions. C’est l’écart entre un moteur riche et une expérience trop fragmentée.

Le produit couvre correctement la chaîne `client → dossier → travail → facture → paiement → conformité`, mais l’utilisatrice doit encore connaître l’architecture de SAFE pour retrouver le bon écran. L’interface présente souvent les modules comme des destinations séparées plutôt que comme les étapes d’un même travail. C’est particulièrement visible dans Facturation, Temps, Documents, Comptabilité et Inspection.

Les cinq constats les plus importants sont :

1. **Deux accueils concurrents.** `/tableau-de-bord`, `/aujourdhui`, `/briefing`, `/securite` et `/conformite` agrègent tous, à divers degrés, ce qui demande de l’attention. Leur rôle respectif n’est pas assez distinct.
2. **La facturation est éclatée.** Un seul objet métier, la facture, est réparti sur quatorze routes. Les vues `suivi`, `verification`, `créances`, `temps non facturé` et `honoraires` se recouvrent ou pourraient être des filtres et panneaux du registre principal.
3. **Le dossier n’est pas encore la colonne vertébrale visible.** La fiche dossier est très riche, mais trop chargée. Les documents, la correspondance, les pièces attendues, l’état du dossier, le temps et la facturation ne forment pas encore un fil de travail assez évident.
4. **La conformité est puissante mais dédoublée.** `/comptes`, `/conformite`, `/securite` et les treize écrans d’inspection se chevauchent conceptuellement. La réglementation est présente, mais l’utilisatrice doit comprendre la structure réglementaire avant de comprendre quoi faire.
5. **La cohérence visuelle n’est pas au niveau du moteur.** Le contrôle automatisé du standard premium trouve 1 118 écarts dans 182 fichiers montés : 372 usages de palettes génériques, 325 hexadécimales, 272 grands rayons, 62 mouvements continus, 56 ombres et 29 emojis.

### Note consolidée

| Axe | Note | Lecture |
|---|---:|---|
| Logique métier | 4,0 / 5 | Modèle riche, règles sérieuses, quelques fonctions incomplètes ou redondantes. |
| Accès à l’information | 2,8 / 5 | Recherche globale utile, mais navigation et fragmentation obligent à connaître le produit. |
| Présentation | 3,1 / 5 | Bonne direction récente, application encore hétérogène selon l’âge du module. |
| Utilité | 3,7 / 5 | Forte sur les registres principaux, plus faible sur certains satellites et doublons. |
| Facilité d’usage | 2,9 / 5 | Beaucoup d’actions sont possibles, trop peu de parcours sont évidents de bout en bout. |
| **Total** | **3,3 / 5** | Produit métier crédible, expérience encore trop large et trop architecturée. |

## Méthode et limites

- Lecture de toutes les routes métier, de leurs composants, gardes, services et modèles associés.
- Analyse des parcours exposés par les navigations bureau et mobile.
- Relecture des audits de facturation, comptabilité, conformité et préparation produit déjà présents dans le dépôt.
- Exécution du contrôle `npm run design:audit` sur 381 fichiers réellement montés.
- Vérification de l’interface publique et de ses extraits navigables sur l’application locale.
- Les pages authentifiées n’ont pas fait l’objet, dans cette passe, d’un test utilisateur chronométré avec un compte cabinet. Les constats de logique et d’architecture sont fermes. Les notes de présentation devront être confirmées sur les états réels, vides, chargés, erreur et mobile.

Barème : 5 = excellent, 4 = solide, 3 = utilisable avec friction, 2 = faible, 1 = bloquant. Les notes de route sont des notes de décision, pas une mesure scientifique.

## Audit transversal

### 1. Architecture de l’information

La navigation principale est mieux structurée qu’auparavant : Tableau de bord, Aujourd’hui, Pratique, Finances, Outils et Paramètres. Le regroupement est compréhensible. Trois problèmes restent ouverts :

- **Le vocabulaire change selon le contexte.** Temps, Mes heures, Fiches de temps, Honoraires et Prestations parlent parfois du même geste sous des angles différents.
- **Des hubs s’ajoutent aux destinations sans les remplacer.** Comptabilité cohabite avec Journal général et Journal des dépenses. Inspection cohabite avec Conformité et Sécurité.
- **Les routes cachées restent une dette cognitive.** Même non exposées au menu, elles vivent dans les liens contextuels, les favoris, la recherche et la mémoire des utilisatrices.

Décision recommandée : une destination canonique par objet métier. Les anciennes routes deviennent des redirections, des filtres enregistrés ou des panneaux contextuels.

### 2. Hiérarchie de l’information

Les écrans récents se rapprochent du bon ordre : contexte, décision, action principale, détails. Les écrans plus anciens utilisent encore des rangées de cartes KPI, des icônes décoratives et plusieurs actions pleines. La conséquence n’est pas seulement esthétique : le regard ne sait pas toujours si l’écran sert à surveiller, décider ou exécuter.

Règle à appliquer à chaque page : écrire en une phrase le geste principal. Si deux verbes sont nécessaires, l’écran est probablement un hub ou doit être scindé par état, pas par fonction technique.

### 3. Continuité métier

La chaîne de données existe mais les passages d’une étape à l’autre sont inégaux :

- client vers dossier : bon ;
- dossier vers temps et document : fonctionnel, mais dispersé ;
- temps vers facture : logique solide, interface trop répartie ;
- facture vers paiement : trop manuel et allocation non forcée ;
- paiement vers journal : solide en arrière-plan, provenance insuffisamment visible ;
- dossier vers fermeture et rétention : incomplet ;
- document reçu vers classement et retrouvage : insuffisant.

Le prochain niveau de SAFE n’est donc pas plus de modules. C’est plus de continuité entre les modules existants.

### 4. États et confiance

Pour un logiciel juridique, chaque écran doit répondre à quatre questions :

1. Quelle est la source de cette information ?
2. De quand date-t-elle ?
3. Est-elle complète ou vérifiée ?
4. Quelle action corrige l’écart ?

SAFE répond souvent aux questions 1 et 4 dans le code, mais pas toujours à l’écran. Les journaux, rapports, soldes et indicateurs doivent rendre la provenance et la date de vérification visibles.

### 5. Densité et cohérence visuelle

Le standard premium est clair, mais il n’est pas encore systématiquement appliqué. Les zones les plus chargées sont :

| Zone | Écarts détectés par route | Risque utilisateur |
|---|---:|---|
| Éditeur d’un document | 132 | L’outil le plus immersif paraît appartenir à un autre produit. |
| Détail d’un dossier | 120 | Trop de décisions et de sections sur une seule surface. |
| Agenda LexTrack | 99 | Charge visuelle et interactions difficiles à apprendre. |
| Comptabilité | 78 | La confiance dans les chiffres souffre de l’hétérogénéité. |
| Temps | 43 | Le geste quotidien le plus sensible reste visuellement encombré. |
| Fidéicommis | 39 | Une zone critique ne peut tolérer d’ambiguïté de statut. |
| Atelier documentaire | 39 | Rupture de continuité avec le dossier. |
| Rapports fidéicommis | 38 | Formulaire dense et présentation ancienne. |
| Tableau de bord | 37 | Trop de signaux rivalisent pour la première lecture. |
| Journal des dépenses | 35 | Workflow utile, mais langage visuel encore distinct. |

## Audit page par page

### Accueil et pilotage

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/tableau-de-bord` | 4 | 3 | 3 | 4 | 3 | Donne une lecture riche du cabinet, mais mélange argent, conformité, navette, activité et tendances. Réduire la première vue à trois décisions : risque, argent, travail à débloquer. Les autres blocs passent en détail. |
| `/aujourdhui` | 4 | 4 | 4 | 5 | 4 | Meilleur candidat pour l’accueil quotidien opérationnel. Conserver une file unique, ordonnée par échéance et gravité, avec responsable et prochaine action explicites. Éviter qu’il répète le tableau de bord. |
| `/briefing` | 3 | 2 | 3 | 3 | 3 | Utile comme synthèse, mais concurrence Aujourd’hui, Sécurité et Conformité. L’absorber dans Aujourd’hui comme vue ou résumé quotidien. |
| `/securite` | 3 | 2 | 2 | 3 | 3 | Le mot « sécurité » mélange cybersécurité, conformité client, échéances et fidéicommis. Renommer selon l’objet réel ou fusionner ses alertes dans Conformité/Aujourd’hui. |
| `/conformite` | 4 | 3 | 3 | 4 | 3 | Bon tableau de conformité, mais sa frontière avec Inspection et Sécurité reste floue. En faire le poste de commande : obligations, statut, preuve, échéance et accès au registre source. |

### Clients

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/clients` | 4 | 4 | 4 | 5 | 4 | Registre solide : recherche, filtres, synthèse et pagination. Faire des chiffres du haut des filtres, vérifier que l’identité et les conflits ressortent avant les métadonnées secondaires. |
| `/clients/nouveau` | 4 | 4 | 4 | 5 | 4 | Le wizard et la détection de doublon répondent à un vrai risque métier. Montrer tôt le minimum requis et repousser les champs non indispensables après la création. |
| `/clients/[id]` | 4 | 3 | 3 | 5 | 3 | Profil riche, mais il agrège édition, identité, documents, factures, activités et formulaire. Donner une synthèse décisionnelle stable, puis des onglets alignés sur les tâches. |
| `/clients/[id]/verification-identite` | 5 | 4 | 3 | 5 | 4 | Fonction réglementaire forte et contextualisée par province. Afficher clairement état, méthode, preuve, date, personne ayant vérifié et prochaine révision. Éviter de répéter la section de la fiche client. |

### Dossiers et travail juridique

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/dossiers` | 4 | 4 | 4 | 5 | 4 | Registre robuste. Les indicateurs doivent filtrer le tableau. Ajouter comme colonnes de décision : prochaine échéance, responsable, complétude et prochain geste. |
| `/dossiers/nouveau` | 4 | 4 | 4 | 5 | 4 | Bonne logique de taxonomie et de mode de facturation. Réduire la création au strict nécessaire, puis générer une liste de démarrage contextualisée. |
| `/dossiers/[id]` | 5 | 3 | 2 | 5 | 2 | Cœur métier le plus puissant et le plus chargé. 607 lignes de page et 120 écarts design par route. La fermeture est maintenant branchée avec garde-fous, lettre et rétention. Transformer l’ensemble en poste de travail : état et prochaine action d’abord, contenu par onglets et actions contextuelles. |
| `/gestion/assistante` | 5 | 4 | 3 | 5 | 4 | Doctrine assistante prépare, avocat décide, très différenciante. Mesurer le temps jusqu’à « pris en charge », rendre le propriétaire et le blocage visibles, éviter le doublon avec Aujourd’hui. |
| `/gestion/lextrack` | 4 | 3 | 2 | 4 | 2 | Agenda utile mais visuellement coûteux, 99 écarts par route. Clarifier vue calendrier contre file d’échéances, réduire les contrôles permanents et permettre l’action depuis l’événement. |
| `/gestion` | 2 | 1 | 3 | 1 | 3 | Simple redirection. Ne doit pas être une destination mémorisée ou indexée. |

### Temps et honoraires

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/temps` | 5 | 4 | 3 | 5 | 3 | Moteur solide pour horaire, forfait et mixte. Le chrono, la saisie rapide, les KPI et l’historique rivalisent. La saisie doit dominer et prendre quelques secondes. Les métriques passent au second plan. |
| `/mes-heures` | 4 | 3 | 3 | 4 | 4 | Vue personnelle légitime pour l’employé, mais le nom ressemble à Temps. Renommer « Mon relevé » ou intégrer un filtre « Mes entrées » à Temps selon le rôle. |
| `/fiches-de-temps` | 1 | 1 | 3 | 1 | 3 | Redirection vers Temps. Supprimer cette troisième appellation des liens et de la documentation. |
| `/facturation/honoraires` | 2 | 1 | 3 | 1 | 3 | Redirection vers la section facturable. Conserver uniquement pour compatibilité, jamais comme concept de navigation. |
| `/facturation/honoraires/[clientId]` | 4 | 3 | 2 | 4 | 3 | Bon détail préparatoire, mais détour par client qui éloigne du registre de facturation. Ouvrir ce détail dans un panneau depuis la file « À facturer ». |
| `/facturation/temps-non-facture` | 4 | 3 | 3 | 4 | 3 | Vue de contrôle utile, mais recouvre Temps et la section « facturables ». En faire un filtre transversal avec regroupement par responsable, ancienneté et dossier. |

### Facturation et encaissement

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/facturation` | 4 | 3 | 3 | 5 | 3 | Page trop ambitieuse : KPI, outils, facturables, filtres et registre. En faire l’unique poste de commande avec segments cliquables et détail de facture en panneau. |
| `/facturation/nouvelle` | 5 | 4 | 3 | 5 | 3 | Calcul et sélection des lignes solides. Afficher immédiatement le mode, le dossier, la période, les éléments inclus et une synthèse collante. Bloquer les incohérences avant la fin. |
| `/facturation/factures/[id]` | 5 | 4 | 4 | 5 | 4 | Aperçu canonique essentiel. Réunir aperçu, historique d’envoi, paiements, crédits et relances. Une seule action pleine selon l’état réel de la facture. |
| `/facturation/verification` | 3 | 2 | 3 | 3 | 3 | Les brouillons à vérifier sont un état du registre, pas une destination. Transformer en filtre sauvegardé avec compteur. |
| `/facturation/suivi` | 3 | 2 | 3 | 3 | 3 | Les envoyées et en retard sont également des états. Le besoin de suivi est réel, la page séparée ne l’est pas. |
| `/facturation/paiements` | 5 | 3 | 3 | 5 | 3 | Les paiements non alloués, allocations, annulations et surpaiements disposent maintenant de parcours réels. La faiblesse restante est leur isolement dans une page satellite et le nombre d’étapes pour revenir à la facture ou au dossier source. |
| `/facturation/notes-de-credit` | 4 | 3 | 3 | 4 | 3 | Fonction nécessaire, mais doit rester rattachée à la facture et rendre l’effet comptable explicite. Présenter liste et création depuis le détail facture. |
| `/facturation/frais` | 4 | 3 | 3 | 4 | 3 | Débours utiles, mais leur lien avec dossier, facture et récupération doit être visible. Ajouter une file centrale « à refacturer ». |
| `/facturation/creances-aging` | 5 | 3 | 3 | 5 | 4 | Analyse d’ancienneté solide. Les tranches doivent filtrer les factures et conduire directement à une relance ou une note de suivi. |
| `/facturation/taxes` | 5 | 4 | 3 | 5 | 4 | Rapport essentiel. Afficher période, juridiction, source, état de validation et lien vers les écritures sous-jacentes. |
| `/facturation/rentabilite` | 4 | 3 | 3 | 4 | 3 | Utile pour direction, moins pour le quotidien. Clarifier les hypothèses de coût et permettre d’ouvrir le dossier expliquant un résultat. |

### Comptabilité

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/comptabilite` | 5 | 3 | 2 | 5 | 3 | Hub riche mais chargé et visuellement hétérogène. En faire la destination canonique, avec onglets clairs, période persistante et provenance de chaque chiffre. |
| `/journal/general` | 5 | 3 | 3 | 5 | 3 | Source de vérité append-only. Dire explicitement que les corrections se font par écriture, et rendre chaque source cliquable. |
| `/journal/depenses` | 4 | 3 | 2 | 5 | 3 | Workflow de validation utile. Unifier ses statuts, espacements et interactions avec les registres. Montrer l’écriture comptable créée après validation. |

### Fidéicommis

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/comptes` | 5 | 4 | 3 | 5 | 4 | Garde-fous métier sérieux. Afficher d’abord solde total, écarts, période à rapprocher et comptes nécessitant une action. Les cartes ne doivent pas diluer le risque. |
| `/comptes/rapprochement` | 5 | 4 | 3 | 5 | 3 | Workflow réglementaire central. Le guider comme une séquence fermée, avec progression, provenance des trois soldes, différence et certification finale forte. |
| `/comptes/rapports` | 5 | 3 | 2 | 5 | 3 | Génération utile mais formulaire dense et ancien. Regrouper les rapports par obligation, préremplir la période et montrer un aperçu avant génération. |

### Inspection

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/inspection` | 5 | 4 | 3 | 5 | 4 | Très bon hub réglementaire. Il doit être la seule porte d’entrée : progression, éléments manquants, preuve disponible et prochaine action. |
| `/inspection/comptes` | 5 | 4 | 3 | 5 | 4 | Marche zéro logique. Mettre en évidence compte incomplet, statut d’utilisation et lien vers rapprochement. |
| `/inspection/rapport-mensuel` | 5 | 3 | 3 | 5 | 3 | Fonction critique. Rendre la période et l’état de certification impossibles à manquer, avec traçabilité des corrections. |
| `/inspection/rapport-annuel` | 5 | 3 | 3 | 5 | 3 | Utile mais naturellement occasionnel. Préremplir depuis les données mensuelles et ne demander que les exceptions. |
| `/inspection/trousse` | 5 | 4 | 3 | 5 | 4 | Proposition de valeur forte. Montrer exactement ce qui sera inclus, ce qui manque et la date de fraîcheur de chaque pièce. |
| `/inspection/registres` | 5 | 3 | 3 | 5 | 3 | Catalogue utile, mais risque de devenir une seconde navigation. Chaque registre doit indiquer complet/incomplet, période et action. |
| `/inspection/soldes-debiteurs` | 5 | 3 | 3 | 5 | 3 | Bon registre. Relier chaque solde au client, à la facture et au traitement requis. |
| `/inspection/especes` | 5 | 3 | 3 | 5 | 3 | Contrôle réglementaire utile. Mettre le plafond et les exceptions dans le contexte de chaque opération, pas dans une note séparée. |
| `/inspection/autres-biens` | 5 | 3 | 3 | 4 | 3 | Nécessaire mais rare. Soigner l’état vide pédagogique et la preuve documentaire. |
| `/inspection/virements` | 4 | 3 | 3 | 5 | 3 | Écran critique. La séparation saisie/autorisation n’est pas pleinement démontrée. Rendre les deux personnes, les horodatages et les preuves non ambiguës. |
| `/inspection/transmission-factures` | 5 | 3 | 3 | 5 | 3 | Bonne obligation rendue visible. Deep link vers facture et preuve d’envoi indispensables. |
| `/inspection/cycle-de-vie` | 4 | 3 | 3 | 4 | 3 | Vue utile si elle explique les transitions. Relier ouverture, activité, fermeture et destruction à des dossiers réels. |
| `/inspection/conservation` | 5 | 3 | 3 | 5 | 3 | Important et désormais alimenté par un workflow de fermeture réel. Renforcer le lien vers le dossier fermé, la règle appliquée et la date de destruction calculée. |

### Documents, édition et correspondance

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/edition` | 4 | 3 | 3 | 4 | 3 | Hub de rédaction utile, mais séparé du dossier où le besoin naît. Donner priorité aux documents récents, à reprendre et à valider. |
| `/edition/[dossierId]` | 4 | 4 | 2 | 5 | 3 | Atelier contextualisé, logique. Simplifier l’architecture, afficher modèles pertinents et documents du dossier sans recréer une seconde fiche dossier. |
| `/edition/[dossierId]/[docId]` | 5 | 3 | 2 | 5 | 2 | Éditeur puissant mais principal foyer de dette visuelle. Réduire chrome et panneaux, stabiliser la hiérarchie, rendre sauvegarde/version/envoi parfaitement explicites. |
| `/edition/bibliotheque` | 2 | 2 | 2 | 3 | 2 | Ne contient que les documents rédigés, plafonne à 200, filtre côté client et ignore les fichiers téléversés. Construire une recherche unifiée, serveur, paginée, sur contenu et métadonnées. |
| `/outils/correspondance` | 4 | 3 | 3 | 4 | 3 | Chronologie prometteuse, mais encore isolée. La correspondance doit être visible depuis dossier et client, avec statut de réponse et prochaine action. |

### Employés et administration du personnel

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/employees` | 4 | 4 | 3 | 4 | 4 | Registre clair. Assumer le périmètre administration du personnel, pas « paie complète ». Mettre statut d’accès et rôle métier au premier plan. |
| `/employees/nouveau` | 4 | 4 | 3 | 4 | 4 | Formulaire utile avec garde de permission. Distinguer invitation de compte, fiche employé et droits pour éviter les attentes trompeuses. |
| `/employees/[employee-id]` | 4 | 3 | 3 | 4 | 3 | Profil riche. Séparer identité, accès, rémunération, activité et documents de fin d’année. Ne pas exposer des onglets sans données exploitables. |
| `/employees/year-end` | 4 | 3 | 3 | 4 | 3 | T4/T4A utiles, mais peuvent faire croire à un moteur de paie complet. Ajouter une explication nette sur les données sources et les limites. |

### Rapports, import et outils

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/rapports` | 4 | 3 | 3 | 4 | 3 | Centre de rapports utile mais transversal. Organiser par décision, non par table : argent à recevoir, rentabilité, taxes, fiducie, équipe. |
| `/import` | 5 | 4 | 3 | 5 | 4 | MVP réel et utile. Le parcours doit montrer fichier, correspondance des colonnes, aperçu, erreurs, confirmation et résultat avec possibilité de corriger. |
| `/outils` | 3 | 3 | 3 | 3 | 3 | Hub minimal. Ne doit pas devenir un tiroir de fonctions sans relation. Séparer clairement outils d’acquisition et outils du cabinet. |
| `/outils/patrimoine-familial` | 5 | 4 | 4 | 5 | 4 | Outil autonome fort. Chaque chiffre doit rester sourcé et le résultat exportable sans faire croire à un avis juridique automatisé. |
| `/outils/pension-alimentaire` | 4 | 3 | 3 | 4 | 3 | Même potentiel, risque réglementaire plus élevé. Rendre année de barème, hypothèses, exceptions et sources visibles avant le résultat. |

### Paramètres

| Route | L | A | P | U | F | Diagnostic et correction |
|---|---:|---:|---:|---:|---:|---|
| `/parametres` | 4 | 3 | 3 | 5 | 3 | Page très longue qui sert à la fois de hub et de formulaire. Transformer en sommaire de configuration avec statut de complétude et destinations courtes. |
| `/parametres/cabinet` | 5 | 4 | 3 | 5 | 4 | Configuration fondamentale. Distinguer identité publique, coordonnées légales, fiscalité et paramètres opérationnels. |
| `/parametres/facture` | 5 | 4 | 2 | 5 | 3 | Essentiel pour la confiance. Montrer un aperçu réel en permanence et empêcher les combinaisons visuellement ou légalement invalides. |
| `/parametres/envoi-facture` | 5 | 4 | 3 | 5 | 4 | Templates et variables utiles. Ajouter aperçu avec vraies données fictives, validation des variables et expéditeur clairement identifié. |
| `/parametres/paiements` | 4 | 4 | 3 | 5 | 4 | Bon emplacement. Distinguer méthodes acceptées, instructions affichées sur facture et intégrations réellement actives. |
| `/parametres/payeurs-tiers` | 4 | 3 | 3 | 4 | 3 | Règles métier utiles mais avancées. Expliquer priorité et effet à l’aide d’un exemple calculé. |
| `/parametres/conformite` | 5 | 3 | 3 | 5 | 3 | Configuration réglementaire sensible. Montrer pourquoi chaque choix existe et quels écrans il modifie. |
| `/parametres/retention` | 5 | 3 | 3 | 5 | 3 | Politique utile, mais sa valeur dépend de la fermeture. Montrer dossiers concernés et prochaines destructions. |
| `/parametres/abonnement` | 4 | 4 | 3 | 4 | 4 | Utilité claire. Séparer état, consommation, prochaine facture et actions contractuelles. |
| `/parametres/audit` | 3 | 2 | 3 | 3 | 3 | Le terme « audit » est ambigu avec inspection et audit gratuit. Renommer selon son contenu réel et l’intégrer au bon domaine. |
| `/parametres/equipe` | 1 | 1 | 3 | 1 | 3 | Redirection obsolète vers Employés. Retirer tous les liens et conserver seulement la compatibilité d’URL. |

## Faiblesses métier prioritaires

### P0. Trop de postes de commande

L’utilisatrice peut théoriquement commencer sa journée dans Tableau de bord, Aujourd’hui, Briefing, Sécurité ou Conformité. SAFE doit choisir :

- **Aujourd’hui** : quoi faire maintenant ;
- **Tableau de bord** : comment va le cabinet ;
- **Conformité** : quelles obligations et preuves sont ouvertes.

Briefing et Sécurité deviennent des vues ou des sections, pas des destinations autonomes.

### P0. Facturation fragmentée malgré des relances fonctionnelles

La relance manuelle est réellement exécutable, tracée et visible dans le registre. Le défaut est désormais architectural : le registre principal devrait absorber les vues Brouillons, Envoyées, En retard, À facturer et Temps non facturé. Une ligne sélectionnée devrait ouvrir un panneau avec aperçu, historique et actions, dont la relance existante.

### P0. Dossier trop chargé malgré une fermeture fonctionnelle

Le détail dossier doit devenir le meilleur écran du produit. Sa première vue doit répondre à : où en est le dossier, qu’est-ce qui manque, quelle est la prochaine échéance, qui agit et quel est le prochain geste. Le workflow de fermeture existe maintenant avec alertes financières, blocage fidéicommis, lettre, statut et rétention ; il doit être mieux relié au reste du cycle de vie.

### P1. Documents impossibles à retrouver transversalement

Les documents téléversés et les documents rédigés vivent dans deux mondes. La bibliothèque actuelle n’est pas une bibliothèque du cabinet. Il faut une recherche unifiée, serveur, paginée, capable de retrouver un document par contenu, client, dossier, section, type et période.

### P1. Paiements guidés mais isolés du parcours facture

SAFE expose maintenant les paiements non alloués et les surpaiements, et permet allocation, annulation et intention de remboursement. Le travail restant consiste à rapprocher cette résolution du détail facture et à réduire les allers-retours entre registre, paiement et facture source.

### P1. Preuve et provenance insuffisamment visibles

Dans les zones financières et réglementaires, chaque agrégat doit permettre d’ouvrir les écritures sources. La date de calcul, la période, le statut de vérification et le responsable doivent être visibles sans survol.

## Plan de correction recommandé

Conformément à la règle de focus SAFE, ne pas lancer tous les chantiers de cet audit.

### Priorité 1 : réduire les postes de commande et consolider Facturation

Pourquoi : ce chantier améliore le travail quotidien, les créances, le temps non facturé et la compréhension du produit sans ajouter de nouveau moteur.

Définition de terminé :

- trois destinations canoniques clairement distinctes : Aujourd’hui, Tableau de bord, Conformité ;
- un registre Facturation unique avec filtres cliquables ;
- détail de facture en panneau avec historique et actions ;
- anciennes routes conservées uniquement comme redirections ou vues paramétrées ;
- dix factures peuvent être vérifiées, relancées ou encaissées sans perdre la liste.

Prochaine action physique : produire un plan de fusion route par route de `/briefing`, `/securite` et des sous-pages de `/facturation`, sans coder.

### Priorité 2 : simplifier le détail dossier

Pourquoi : le dossier est la meilleure colonne vertébrale disponible et porte clients, délais, documents, temps, facturation et conformité.

Définition de terminé :

- première vue centrée sur état, échéance, manquants, responsable et prochaine action ;
- documents, correspondance, temps et facturation accessibles sans dupliquer leur interface complète ;
- workflow de fermeture réel ;
- test avec cinq tâches chronométrées par une avocate et une assistante.

Prochaine action physique : définir les cinq tâches d’évaluation et dessiner le nouvel ordre d’information du détail dossier.

### Parking lot

- bibliothèque documentaire unifiée ;
- paiement et allocation guidés ;
- rationalisation complète Inspection/Conformité ;
- homogénéisation visuelle des 182 fichiers ;
- consolidation Temps/Mes heures ;
- refonte des Paramètres ;
- responsive et accessibilité systématiques.

### Pas maintenant

- aucun nouveau module ;
- aucun nouveau tableau de bord ;
- aucune couche IA qui crée une destination supplémentaire ;
- aucun reskin global avant d’avoir simplifié l’architecture de l’information.

## Conditions de validation

L’audit sera pleinement fermé lorsque les parcours suivants auront été exécutés sur de vraies données, en bureau et à 320 px, avec une avocate et une assistante :

1. retrouver un dossier et identifier la prochaine action ;
2. saisir 0,3 h depuis le dossier ;
3. transformer du travail en facture et l’envoyer ;
4. enregistrer et allouer un paiement ;
5. retrouver la preuve d’un mouvement fidéicommis ;
6. préparer et certifier un rapprochement ;
7. produire la trousse d’inspection ;
8. retrouver un document reçu ;
9. fermer un dossier et appliquer la rétention ;
10. traiter une tâche préparée par l’assistante.

Seuil de réussite recommandé : 8 tâches sur 10 sans aide, aucune erreur financière ou réglementaire, et aucune tâche quotidienne nécessitant plus de deux changements de destination.
