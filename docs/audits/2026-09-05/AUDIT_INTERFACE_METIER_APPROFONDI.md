# Audit approfondi de l’interface métier SAFE

Date : 2026-09-05  
Complète : `AUDIT_INTERFACE_METIER_COMPLET.md`  
Objet : passer de l’analyse des pages à l’analyse des décisions, des parcours et de la vérité affichée.

## 1. Conclusion approfondie

SAFE n’a pas principalement un problème de fonctionnalités. Il a trois problèmes de produit :

1. **La vérité métier n’est pas toujours la vérité affichée.** Certains libellés promettent une exhaustivité que leur calcul ne couvre pas.
2. **L’accès repose trop sur la connaissance de l’architecture.** La recherche globale n’est pas fonctionnelle et plusieurs objets sont répartis entre des pages voisines.
3. **L’interface reflète les modules techniques plutôt que les décisions du cabinet.** Plusieurs pages répondent chacune à une partie de la même question.

Le moteur est néanmoins beaucoup plus solide que l’interface ne le laisse croire : 1 997 tests passent, TypeScript passe sans erreur, les transactions critiques de facturation et de fidéicommis sont bien couvertes, les relances manuelles sont branchées, les paiements non alloués et surpaiements sont traitables, et la fermeture de dossier possède désormais des garde-fous réels.

Le diagnostic précédent est donc précisé ainsi : **SAFE n’est pas un produit vide à compléter. C’est un produit riche à éditer, consolider et rendre honnête à l’écran.**

## 2. Niveaux de preuve

| Niveau | Définition |
|---|---|
| Prouvé | Le comportement découle directement du code courant ou d’un test exécuté. |
| Risque fort | L’architecture crée une friction prévisible, mais doit être chronométrée avec une utilisatrice. |
| Hypothèse | À vérifier sur données réelles, selon rôle, volume ou appareil. |

## 3. Registre priorisé des faiblesses

### Critiques

#### C-01. La recherche globale ne recherche rien

**Preuve : prouvé.** `components/layout/Header.tsx:894-907` rend un `<input type="search">` sans état, sans gestionnaire de saisie, sans soumission et sans résultat. `components/layout/Header.tsx:607-614` fait seulement pointer `⌘K` vers ce champ. Aucun service ou endpoint de recherche globale n’existe.

**Impact :** l’interface promet l’accès le plus rapide à « clients, dossiers, factures », mais le geste ne produit aucun résultat. C’est un bris de confiance et un obstacle transversal aux 76 routes.

**Correctif :** brancher une palette unique capable de retrouver au minimum client, dossier, facture et document. Chaque résultat doit afficher type, identité, contexte et destination. Sur mobile, un bouton de recherche persistant remplace le champ caché.

**Test de terminé :** retrouver un dossier connu par numéro, client et mot du titre en moins de cinq secondes, au clavier et sur mobile.

#### C-02. « Rien ne vous échappe » ne mesure pas ce qu’il affirme

**Preuve : prouvé.** Dans `app/(app)/aujourdhui/page.tsx:47`, `omissions` ne compte que `queue.myAdminTasks` en retard. Dans `lib/dossiers/assistant-queue.ts:126-142`, les événements sont filtrés avec `date >= now`, ce qui exclut les échéances déjà dépassées. Le bandeau d’`AaliyahTodayView` affirme pourtant que rien ne glisse lorsque `omissions === 0`.

**Impact :** un état rassurant peut être affiché alors qu’une échéance juridique est dépassée, qu’un dossier est bloqué ou qu’un élément renvoyé par la navette attend une réponse.

**Correctif :** remplacer le compteur par un agrégat canonique nommé selon sa portée. Par exemple : `actionsEnRetard`, `echeancesDepassees`, `blocagesDossier`, `navetteEnAttente`. Ne jamais dériver un message absolu d’un sous-ensemble.

**Test de terminé :** injecter une échéance dépassée sans tâche administrative et vérifier que l’écran ne peut pas afficher un état rassurant.

#### C-03. La « prochaine action » ignore des urgences plus fortes

**Preuve : prouvé.** `app/(app)/aujourdhui/page.tsx:51-78` choisit, dans l’ordre, un message `sent_back`, puis le premier dossier incomplet, puis un dossier non assigné. Les tâches administratives en retard et les échéances proches n’entrent pas dans cette décision, même si elles sont affichées ailleurs sur la page.

**Impact :** SAFE peut recommander de compléter un mandat alors qu’une tâche assignée est déjà en retard ou qu’une échéance arrive aujourd’hui.

**Correctif :** un moteur de priorité unique, explicable, fondé sur gravité, échéance, blocage, responsabilité et ancienneté. L’écran doit pouvoir dire pourquoi cette action est première.

**Test de terminé :** une échéance critique aujourd’hui bat toujours un élément de complétude sans date, sauf règle métier contraire documentée.

#### C-04. Une relance envoyée est enregistrée comme planifiée

**Preuve : prouvé.** `envoyerRelanceFacture` envoie réellement le courriel, puis appelle `createReminder` avec `channel: "email"`. Or `createReminder` ne pose `sentAt` et `status: "sent"` que lorsque le canal vaut `manual`; pour `email`, le statut reste `scheduled` et `sentAt` reste vide (`lib/services/billing/reminder-service.ts:44-52, 205-228`). La table trie pourtant les traces par `sentAt` et tente d’afficher cette date.

**Impact :** la relation client a eu lieu, mais la trace structurée dit qu’elle est seulement prévue. Cela compromet l’historique, les rapports futurs et la capacité à prouver quand la relance est partie.

**Correctif :** séparer clairement `planifierRelance` et `enregistrerRelanceEnvoyee`, ou permettre à `createReminder` de recevoir un état final explicite. L’envoi réussi doit écrire `sent`, `sentAt`, canal, destinataire et identifiant fournisseur.

**Test de terminé :** après un envoi réussi, la trace porte `sent`, un horodatage et apparaît en premier dans l’historique.

### Importantes

#### I-01. Aujourd’hui est une vue d’assistante exposée à tous les rôles

**Preuve : prouvé.** Les deux navigations affichent Aujourd’hui sans condition de rôle. La page et ses composants se décrivent eux-mêmes comme le tableau de l’assistante et utilisent la file assistante pour chaque rôle. Seule la navette varie selon le rôle.

**Impact :** un avocat, un comptable et une assistante voient une promesse identique construite sur des responsabilités différentes. L’accueil paraît personnalisé sans l’être réellement.

**Correctif :** garder une route, mais composer la décision principale selon le rôle effectif : avocat décide, assistante prépare, comptabilité rapproche et encaisse, administrateur arbitre.

#### I-02. Le compteur de dossiers actifs d’Aujourd’hui n’est pas le total actif

**Preuve : prouvé.** `activeMatters` est la taille d’un `Set` construit uniquement à partir des buckets incomplet, attente client, prêt pour revue et non assigné. Un dossier actif complet qui n’entre dans aucun bucket n’est pas compté. La source est en outre plafonnée aux 100 dossiers les plus récemment modifiés.

**Impact :** le libellé « dossiers actifs » affiche en réalité « dossiers actifs présents dans certains états examinés », sans le dire.

**Correctif :** calculer le total par un `count` dédié ou renommer exactement la mesure.

#### I-03. « Cette semaine » affiche un stock, pas un flux hebdomadaire

**Preuve : prouvé.** `weekReady` reçoit `queue.readyForReview.length`, sans filtre de date. Le composant le présente sous « Votre semaine ».

**Impact :** une métrique de reconnaissance peut augmenter ou diminuer sans correspondre au travail de la semaine.

**Correctif :** compter les transitions vers `pret_pour_revue` sur la semaine ou renommer « Prêts pour revue maintenant ».

#### I-04. Aujourd’hui risque de ralentir fortement avec le volume

**Preuve : risque fort fondé sur le code.** La file charge jusqu’à 100 dossiers, puis appelle `loadDossierPreparationSnapshot` pour chaque dossier assigné. Ce chargement effectue une requête dossier, plusieurs comptes et listes parallèles, puis des requêtes de sections et documents. L’ordre de grandeur peut atteindre plusieurs centaines de requêtes lors d’un seul chargement.

**Impact :** l’écran censé être ouvert chaque matin risque de dépasser la cible de premier rendu utile en une seconde dès que le cabinet grossit.

**Correctif :** matérialiser ou calculer en lot l’état de préparation, puis charger le détail à la demande. Instrumenter nombre de requêtes et temps serveur.

#### I-05. Le tableau de bord est un rapport, un accueil et une file d’action à la fois

**Preuve : prouvé.** `app/(app)/tableau-de-bord/page.tsx` approche 1 000 lignes, lance environ quarante lectures/agrégations et assemble KPI, tendances, factures, temps, dépenses, dossiers, tâches, événements, audit, rapprochement, onboarding et navette.

**Impact :** coût de chargement élevé, hiérarchie instable et recouvrement avec Aujourd’hui, Briefing et Conformité.

**Correctif :** faire du tableau de bord une lecture de santé, pas une file de travail. Limiter la première vue aux indicateurs dont l’évolution appelle une décision de direction.

#### I-06. Les KPI actionnables de facturation sont volontairement non cliquables

**Preuve : prouvé.** `FacturationMainKpis` explique que les mesures ne filtrent plus parce que le filtre existe plus bas. Pourtant « À facturer », « Vérification » et « En retard » représentent des files de travail.

**Impact :** l’utilisatrice voit le problème puis doit le traduire une seconde fois dans un contrôle différent. La proximité entre constat et action est perdue.

**Correctif :** rendre cliquables uniquement les trois mesures actionnables. Conserver taux d’encaissement et montants purement analytiques comme lecture.

#### I-07. La page Facturation juxtapose trois modèles d’accès

**Preuve : prouvé.** La page contient une synthèse, cinq cartes d’outils, une section Honoraires à facturer embarquée, un registre avec filtres, puis un menu Outils qui répète certains satellites. `Suivi` et `Vérification` restent des routes distinctes.

**Impact :** une même question, « que dois-je facturer ou récupérer ? », a plusieurs réponses selon le point d’entrée.

**Correctif :** un registre canonique avec segments actionnables, panneau de détail et outils mensuels regroupés hors du flux quotidien.

#### I-08. « Paramètres de facturation » est annoncé comme à venir alors qu’il existe

**Preuve : prouvé.** Le menu Outils de Facturation rend une entrée désactivée « paramètres de facturation, bientôt ». Or `/parametres/facture`, `/parametres/envoi-facture`, `/parametres/paiements` et `/parametres/payeurs-tiers` existent.

**Impact :** SAFE déclare absente une capacité réelle et empêche l’accès contextuel au moment où elle serait utile.

**Correctif :** remplacer l’entrée désactivée par un lien vers la section Facturation des paramètres, avec sous-destinations si nécessaire.

#### I-09. Deux systèmes de documents continuent de diverger

**Preuve : prouvé.** `/api/edition/upload` extrait le texte PDF, tente une classification et crée un `Document`. `/api/documents/upload` ne fait ni extraction ni classification. Le résultat dépend donc de l’endroit où le même fichier est déposé.

**Impact :** rangement, métadonnées et qualité de recherche incohérents. L’utilisatrice n’a aucun moyen de prévoir le résultat.

**Correctif :** une seule commande métier d’ingestion, utilisée par toutes les surfaces.

#### I-10. Le texte extrait des documents est jeté

**Preuve : prouvé.** Le texte de `/api/edition/upload` est utilisé pour la classification, mais le modèle `Document` ne le persiste pas et la création ne le reçoit pas.

**Impact :** aucun retrouvage plein texte, retraitement nécessaire, travail IA payé puis perdu.

**Correctif :** persister texte, état d’extraction, version de l’extracteur et éventuel statut OCR.

#### I-11. La bibliothèque exclut les documents reçus et les personnes physiques

**Preuve : prouvé.** `/edition/bibliotheque` ne lit que `RichDocument`, avec `take: 200`. Le filtrage se fait dans le navigateur sur titre, `raisonSociale` et intitulé du dossier. Les fichiers `Document` sont absents et le prénom/nom des personnes physiques ne sont pas sélectionnés.

**Impact :** « bibliothèque » ne signifie pas bibliothèque du cabinet. Au 201e document, les plus anciens disparaissent de la vue. Rechercher un client personne physique par son nom peut échouer.

**Correctif :** recherche serveur unifiée et paginée sur `Document` et `RichDocument`, incluant identité complète, numéro de dossier, contenu et section de cartable.

#### I-12. Les lignes d’Aujourd’hui ressemblent à des cases à cocher sans pouvoir être cochées

**Preuve : prouvé.** Dans `AaliyahTodayView`, chaque élément de focus affiche un carré bordé ressemblant à une case, mais l’élément entier est un lien vers le dossier.

**Impact :** l’affordance promet « terminer ici » alors que le clic change de page. Cela augmente l’hésitation et empêche le traitement rapide d’une file.

**Correctif :** soit une vraie case avec action de complétion, soit une flèche/indicateur de navigation.

#### I-13. Les destinations Comptabilité restent dupliquées

**Preuve : prouvé.** `/comptabilite` contient déjà des vues de journal, dépenses et paiements, tandis que `/journal/general`, `/journal/depenses` et `/facturation/paiements` restent directement accessibles.

**Impact :** filtres, contexte et retour arrière varient selon la porte utilisée.

**Correctif :** déclarer `/comptabilite` destination canonique et transformer les routes spécifiques en vues paramétrées ou redirections compatibles.

#### I-14. Conformité, Sécurité, Inspection et Fidéicommis partagent les mêmes signaux

**Preuve : prouvé.** Briefing agrège le service d’alertes de Sécurité, Sécurité renvoie vers les obligations, Conformité calcule l’état de préparation et Inspection expose les registres. Plusieurs écrans montrent rapprochement, soldes négatifs et échéances.

**Impact :** le même risque possède plusieurs représentations et plusieurs portes, sans source canonique visible.

**Correctif :** Conformité devient le poste de commande; Inspection porte les preuves et registres; Fidéicommis porte les opérations; Aujourd’hui ne montre que l’action urgente avec lien vers la source.

### Modérées

#### M-01. La navigation est définie deux fois

Le bureau et le mobile disposent de deux tableaux de navigation distincts. Un test de parité lit le source pour limiter les divergences. Le test est utile, mais confirme la dette : rôles, libellés et destinations peuvent diverger autrement que par le nom de route. Une source de navigation unique devrait alimenter les deux surfaces.

#### M-02. Plusieurs routes ne sont que des synonymes historiques

`/gestion`, `/fiches-de-temps`, `/facturation/honoraires` et `/parametres/equipe` redirigent. Elles sont acceptables pour les anciens favoris, mais doivent disparaître des concepts, de la recherche et des documents internes.

#### M-03. Les routes satellites de facturation sont peu découvrables

Taxes, rentabilité, vieillissement des créances, notes de crédit et paramètres spécialisés possèdent très peu de références directes. Les fonctions existent, mais leur découverte dépend du hub ou d’un menu secondaire.

#### M-04. Les paramètres sont trop longs pour être à la fois sommaire et écran de travail

`/parametres` dépasse 500 lignes et rend des cartes, statuts, restrictions et actions pour plusieurs domaines. L’écran devrait répondre « qu’est-ce qui est configuré ? », puis déléguer l’édition à des pages courtes.

#### M-05. L’internationalisation régresse

`npm run i18n:audit` échoue avec 1 642 chaînes codées en dur pour une base de référence à 747. Le total inclut le site public et des prototypes, mais l’échec du garde-fou montre que les nouvelles chaînes ne sont plus contrôlées. Briefing contient notamment plusieurs textes français directs.

#### M-06. La dette visuelle se concentre dans les gestes complexes

Le contrôle design trouve 1 118 écarts dans 182 fichiers montés. Les routes les plus touchées sont précisément celles qui demandent le plus de concentration : éditeur, dossier, agenda, comptabilité, temps et fidéicommis.

#### M-07. Les états de chargement reposent encore sur du mouvement continu

Le scan détecte 62 animations continues. Plusieurs écrans utilisent `animate-spin` ou des animations Framer Motion alors que le standard demande un instrument calme et une neutralisation avec `prefers-reduced-motion`.

#### M-08. La page Briefing traite un refus d’accès comme du contenu

Lorsqu’un rôle est refusé, Briefing rend un texte rouge « Accès refusé » au lieu d’utiliser la garde de page commune. Le comportement diffère des autres routes, conserve la destination visible et emploie une couleur codée en dur.

## 4. Audit des cinq parcours critiques

### Parcours A : commencer la journée

Chemin actuel : navigation → Aujourd’hui ou Tableau de bord → interprétation des alertes → ouverture du dossier ou d’un module financier.

**Ce qui fonctionne :** prochaine action visible, navette, échéances, dossiers en attente, indicateurs financiers et de conformité disponibles.

**Ce qui casse le parcours :** choix de l’accueil non résolu, recommandation non exhaustive, métriques mal nommées, destination souvent générique au dossier plutôt qu’à l’action exacte.

**Cible :** une page Aujourd’hui par rôle, limitée aux éléments dont la personne est responsable. Chaque ligne se traite ou ouvre directement la section exacte.

### Parcours B : ouvrir et faire avancer un dossier

Chemin actuel : client → nouveau dossier → fiche dossier → état, cartable, pièces, notes, documents, navette, temps, fermeture.

**Ce qui fonctionne :** contrôle de conflit, taxonomie, numérotation, préparation, pièces attendues, responsabilités, navette et fermeture avec garde-fous.

**Ce qui casse le parcours :** la richesse de la fiche devient une table des matières du produit. Les sections de travail sont nombreuses et la prochaine action renvoie souvent seulement au dossier.

**Cible :** un en-tête de décision stable, cinq vues maximum, et une action principale calculée. Les modules spécialisés s’ouvrent avec le contexte du dossier déjà appliqué.

### Parcours C : enregistrer le travail et facturer

Chemin actuel : chrono ou Temps → honoraires facturables → nouvelle facture → aperçu → validation/envoi → suivi/relance.

**Ce qui fonctionne :** cycle de vie des entrées, modes horaire/forfait/mixte, transactions atomiques, calcul canonique, équivalence de présentation testée, relance manuelle réelle.

**Ce qui casse le parcours :** Temps, Mes heures et Honoraires se chevauchent; Facturation empile files et outils; suivi et vérification dupliquent les états; la relance est cachée dans un menu de ligne.

**Cible :** une file de travail facturable, puis un registre de factures segmenté par état. Le panneau de facture contient le reste.

### Parcours D : encaisser et tenir les livres

Chemin actuel : Paiements → preuve ou saisie → allocation → facture → journal → rapports/taxes.

**Ce qui fonctionne :** paiements non alloués visibles, allocation protégée contre la concurrence, surpaiements traitables, annulation, journal append-only et exports.

**Ce qui casse le parcours :** le paiement est une page satellite de Facturation tandis que le journal est une autre destination. La provenance existe en données, mais n’est pas systématiquement le principal chemin de navigation.

**Cible :** depuis un paiement, ouvrir immédiatement facture, client et écriture; depuis une écriture, ouvrir la source. Les écrans restent distincts, les liens métier deviennent bidirectionnels.

### Parcours E : préparer une inspection

Chemin actuel : Conformité ou Inspection → compte/registre/rapport → rapprochement/certification → trousse.

**Ce qui fonctionne :** profondeur réglementaire exceptionnelle, règles provinciales, rapports mensuels et annuels, trousse, cycle de vie, conservation, espèces, virements et autres biens.

**Ce qui casse le parcours :** le cabinet doit comprendre où s’arrête Conformité et où commence Inspection. Les mêmes alertes apparaissent ailleurs. L’opération, le contrôle et la preuve ne sont pas toujours reliés par une progression unique.

**Cible :** Conformité répond « que manque-t-il ? », Inspection répond « quelle preuve fournir ? », Fidéicommis répond « quelle opération effectuer ? ».

## 5. Architecture cible des destinations

Cette proposition réduit les concepts sans supprimer les capacités.

| Destination canonique | Contenu | Routes à absorber ou repositionner |
|---|---|---|
| Aujourd’hui | Travail personnel et urgent par rôle | Briefing comme section; alertes de Sécurité comme signaux liés. |
| Tableau de bord | Santé et tendances du cabinet | Aucun élément de file détaillée. |
| Clients | Registre et profil | Vérification d’identité reste une action contextuelle. |
| Dossiers | Registre et poste de travail | Agenda et file assistante restent des vues de travail, reliées au dossier. |
| Temps | Saisie et registre | Mes heures devient filtre personnel; Fiches de temps reste redirection. |
| Facturation | À facturer, brouillons, émises, retard, détail | Suivi et Vérification deviennent segments; Honoraires devient file. |
| Comptabilité | Paiements, journal, dépenses, taxes | Routes satellites deviennent onglets ou liens profonds canoniques. |
| Fidéicommis | Comptes, opérations et rapprochement | Rapports de preuve remontent vers Inspection. |
| Conformité | État des obligations et actions | Sécurité devient signal; Inspection reste dossier de preuve. |
| Documents | Documents reçus et rédigés, recherche | Édition devient mode de création, pas bibliothèque séparée. |
| Paramètres | État de configuration | Chaque réglage spécialisé garde une page courte. |

## 6. Ce qu’il faut préserver

- Les gardes-fous fidéicommis et la certification provinciale.
- Le journal append-only et les corrections par contrepassation.
- La séparation entre validation et simple consultation.
- Le cycle de vie des entrées de temps et des éléments facturables.
- La navette assistante-avocat.
- La fermeture de dossier avec blocages et lettre.
- Les paiements non alloués, surpaiements et annulations désormais visibles.
- L’import avec aperçu et validation.
- La règle d’une seule action principale par écran.

La consolidation ne doit jamais simplifier en masquant une preuve, un montant ou une règle réglementaire.

## 7. Ordre de correction

### Priorité 1 : vérité et accès

1. Corriger les quatre erreurs sémantiques d’Aujourd’hui.
2. Corriger la trace des relances envoyées.
3. Brancher la recherche globale ou retirer immédiatement sa fausse affordance jusqu’à ce qu’elle fonctionne.

**Définition de terminé :** aucun message rassurant faux, chaque relance envoyée correctement tracée, recherche utilisable sur quatre objets.

### Priorité 2 : consolidation du travail quotidien

1. Rendre les files de facturation actionnables depuis les KPI.
2. Fusionner Suivi et Vérification dans le registre.
3. Relier Aujourd’hui à la sous-section exacte du dossier.
4. Remplacer les fausses cases à cocher.

**Définition de terminé :** une assistante traite ses cinq premières actions et dix factures sans chercher la bonne destination.

### Parking lot

- bibliothèque documentaire unifiée;
- source de navigation unique;
- consolidation Comptabilité;
- clarification Conformité/Inspection;
- réduction des requêtes Dashboard/Aujourd’hui;
- refonte Paramètres;
- remboursement réellement exécuté par intégration bancaire, si un jour autorisé.

## 8. Protocole de validation utilisateur

L’audit de code permet de découvrir les incohérences. Il ne remplace pas l’observation d’une avocate et d’une assistante.

Mesurer, sans guider :

| Tâche | Seuil |
|---|---:|
| Retrouver un dossier par numéro | 5 s |
| Dire ce qui est le plus urgent aujourd’hui et pourquoi | 15 s |
| Ajouter 0,3 h au bon dossier | 20 s |
| Préparer une facture depuis du temps existant | 90 s |
| Relancer une facture en retard et retrouver la preuve | 45 s |
| Enregistrer puis allouer un paiement | 60 s |
| Expliquer l’origine d’un chiffre du journal | 30 s |
| Identifier ce qui manque à la prochaine inspection | 30 s |
| Retrouver un document reçu | 15 s |
| Fermer un dossier conforme | 90 s |

Pour chaque échec, noter : endroit où le regard s’arrête, mot recherché, destination attendue, retour arrière et intervention nécessaire. Le prochain chantier doit partir de ces observations, pas d’une préférence visuelle.

## 9. Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Suite Vitest | 168 fichiers, 1 997 tests, tous réussis. |
| TypeScript | `npx tsc --noEmit` réussi. |
| Standard visuel | 1 118 écarts dans 182 fichiers montés. |
| Internationalisation | Échec : 1 642 chaînes codées en dur, base de référence 747. |
| Recherche globale | Aucun comportement de recherche branché. |
| Relance manuelle | Envoi branché; incohérence de statut/horodatage de trace découverte. |
| Fermeture de dossier | Workflow branché avec avertissements, blocage fidéicommis, lettre et rétention. |
| Paiements | Non-alloués et surpaiements visibles; allocation et annulation présentes. |

## 10. Condition de fermeture de l’audit

Le rapport est suffisamment approfondi pour choisir les corrections. Il ne sera considéré clos qu’après :

1. correction des quatre constats critiques;
2. test des dix tâches avec au moins une avocate et une assistante;
3. mesure du nombre de requêtes et du temps serveur d’Aujourd’hui et du Tableau de bord sur 10, 100 et 1 000 dossiers;
4. vérification bureau, tablette et 320 px des cinq parcours critiques;
5. comparaison avant/après sur temps, erreurs, retours arrière et demandes d’aide.

