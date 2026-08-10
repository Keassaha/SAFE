# Prompt maître pour construire l'espace de travail SAFE

## Décision d'adaptation

Le document « The One-Prompt Website Pack » est conçu pour des sites vitrines
cinématographiques. Son prompt SaaS repose sur une vidéo générée, un effet de
défilement, des compteurs marketing, un tableau de prix et un appel à l'action.
Cette structure convient à une page d'acquisition, mais pas à l'intérieur d'un
logiciel juridique utilisé plusieurs heures par jour.

Pour SAFE, les bonnes idées du document doivent être traduites ainsi :

| Idée du document source | Traduction pour SAFE |
| --- | --- |
| Une image héro de référence assure la cohérence des clips | Le shell v2, les tokens et les primitives existantes assurent la cohérence des écrans |
| Les clips sont générés dans un ordre narratif | Les tâches sont conçues comme des parcours continus et vérifiables |
| Le défilement anime une histoire | La navigation révèle le bon niveau d'information au bon moment |
| Le héro produit l'effet spectaculaire principal | L'écran « Aujourd'hui » rend immédiatement visible ce qui demande une action |
| Les effets visuels prouvent la qualité du site | La rapidité, la clarté, la prévention d'erreurs et la traçabilité prouvent la qualité du produit |
| « Launch and verify » ferme chaque prompt | Chaque tranche est lancée, testée, vérifiée visuellement et contrôlée par rôle |

### Ce que l'adaptation rejette

- Vidéos générées, canvas et animations liées au défilement.
- Glassmorphism, particules, gros compteurs et faux graphiques décoratifs.
- Données inventées, boutons factices et interactions sans persistance.
- Reconstruction globale du produit en une seule passe.
- Dashboard générique composé de cartes de même poids.
- Apparence spectaculaire au détriment de la densité et de la vitesse.

### Principe directeur

SAFE doit donner une impression de calme opérationnel. L'interface doit aider
chaque membre du cabinet à savoir ce qui mérite son attention, à agir sans
quitter son contexte et à comprendre ce qui s'est produit. La confiance vient
des données réelles, des contrôles et de la continuité du travail.

---

## Prompt à copier-coller

```text
Vous travaillez dans le dépôt SAFE Inc., un SaaS de gestion de cabinet
d'avocats construit avec Next.js App Router, TypeScript, Prisma, Supabase,
Tailwind et next-intl.

OBJECTIF

Construisez progressivement l'intérieur de SAFE, c'est-à-dire l'espace de
travail authentifié utilisé quotidiennement par les avocats, les assistantes
juridiques, la comptabilité et les administrateurs de cabinet.

Le résultat recherché n'est pas un site marketing et ne doit pas ressembler à
un concept Dribbble ou à un dashboard généré par IA. Il doit ressembler à un
logiciel métier mature, calme, précis, rapide et digne de confiance.

RÈGLE DE DÉPART OBLIGATOIRE

Avant de modifier le code :

1. Lisez entièrement AGENTS.md, CLAUDE.md et CO-DIRECTION.md.
2. Lisez docs/design/DESIGN_HUMAIN.md, surtout les méta-règles du paragraphe 0
   et la checklist anti-slop du paragraphe 10.
3. Inspectez le shell existant dans app/(app-v2)/v2, les primitives associées,
   lib/ds/tokens.ts, lib/routes.ts et les écrans métier existants.
4. Inspectez le schéma Prisma, les permissions et les services réellement
   utilisés par l'écran visé.
5. Consultez la base métier indiquée dans CLAUDE.md avant d'inventer une règle
   concernant les dossiers, la facturation, la fidéicommis, la conservation,
   les rôles ou la conformité.
6. Identifiez les modifications déjà présentes dans le dépôt et préservez tout
   travail utilisateur sans rapport avec la tâche.

Ne codez aucune tranche dont le comportement métier n'est pas suffisamment
spécifié. Si une décision importante manque, produisez la spécification et
arrêtez-vous pour validation.

NORTH STAR PRODUIT

L'expérience SAFE doit incarner le « calme opérationnel » :

- une intention principale par écran;
- une hiérarchie fondée sur l'urgence, le risque et la prochaine action;
- une continuité entre client, dossier, temps, document, facture, paiement et
  rapports;
- une densité professionnelle sans surcharge;
- une prévention explicite des erreurs financières et juridiques;
- une trace claire de ce qui a été fait, par qui et quand;
- aucune donnée simulée dans une route de production.

LE « HÉRO DE RÉFÉRENCE » DE SAFE

Dans le document d'origine, une image héro maintient la cohérence de toutes les
vidéos. Pour SAFE, cette référence unique est le système d'interface existant :

- ShellV2, SidebarV2, TopbarV2 et les primitives de app/(app-v2)/v2;
- les tokens existants avant toute nouvelle valeur visuelle;
- Geist Sans pour l'interface, Geist Mono pour les nombres qui doivent
  s'aligner et Instrument Serif seulement pour des accents éditoriaux rares;
- vert forêt pour l'identité et les actions, ivoire ou surfaces claires pour le
  travail, couleurs sémantiques réservées aux statuts;
- bordures légères et ombres rares;
- rayons différenciés selon le rôle du composant;
- icônes Lucide seulement lorsqu'elles facilitent le repérage.

Ne créez pas un second système visuel. Réutilisez les composants, tokens,
espacements et comportements existants. Si un nouveau pattern est réellement
nécessaire, expliquez pourquoi le système actuel ne suffit pas.

ARCHITECTURE DE L'ESPACE DE TRAVAIL

Conservez une navigation stable, filtrée par permissions :

- Aujourd'hui;
- Dossiers;
- Clients;
- Finances;
- Rapports;
- Paramètres.

La recherche doit être transversale et orientée vers l'ouverture rapide d'un
client, d'un dossier, d'une facture ou d'une tâche autorisée.

Chaque contexte métier doit conserver ses repères :

- fil d'Ariane lisible;
- identité du client ou du dossier toujours visible lorsque nécessaire;
- référence, responsable, statut et prochaine échéance;
- action principale claire;
- actions secondaires regroupées et toujours accessibles au clavier et au
  tactile;
- retour vers le contexte précédent sans perte d'état.

PREMIÈRE TRANCHE À CONSTRUIRE

Commencez par l'écran « Aujourd'hui ». Il doit répondre en moins de cinq
secondes à la question : « Qu'est-ce qui mérite mon attention maintenant? »

Utilisez uniquement des données réelles et autorisées pour l'utilisateur
connecté. Organisez le contenu par décision, pas par disponibilité technique.

Ordre recommandé :

1. Urgences et risques qui nécessitent une action aujourd'hui.
2. Travail attribué à l'utilisateur avec échéance ou blocage.
3. Éléments prêts pour révision ou approbation.
4. Suivis financiers pertinents selon le rôle.
5. Activité récente utile, présentée comme une timeline, pas comme un tableau.

N'affichez pas une grille uniforme de KPI. Un indicateur n'est visible que s'il
change une décision ou ouvre une action utile. Les montants et nombres doivent
être alignés à droite et utiliser des chiffres tabulaires.

Pour chaque élément d'attention, affichez seulement :

- ce qui se passe;
- pourquoi cela mérite l'attention;
- l'échéance ou le risque;
- la prochaine action;
- le dossier ou client concerné.

Les détails secondaires sont révélés progressivement par un déclencheur visible.
Ne comptez jamais sur le survol seul.

PARCOURS CONTINU

Le document d'origine chaîne plusieurs clips pour créer un mouvement continu.
Appliquez la même logique aux tâches métier :

Aujourd'hui -> ouvrir l'élément -> comprendre le contexte -> agir -> confirmer
le résultat -> revenir à Aujourd'hui avec l'état actualisé.

La navigation ne doit pas donner l'impression d'ouvrir des modules isolés. Par
exemple :

- une heure saisie doit être visible dans le dossier et dans les honoraires à
  facturer;
- une facture émise doit conserver son lien vers les entrées sources;
- un paiement doit actualiser les soldes et l'état de la facture;
- une opération de fidéicommis doit exposer le client, le dossier, le motif et
  la trace d'audit;
- une tâche terminée doit disparaître de la file active ou changer clairement
  de statut.

RÔLES ET PERMISSIONS

Concevez et testez au minimum les rôles déjà définis dans le projet :
administrateur de cabinet, avocat, assistante juridique et comptabilité.

- Le serveur demeure la source de vérité des permissions.
- Masquer un bouton ne remplace jamais une garde d'autorisation.
- Aucun montant, client, dossier ou document inaccessible ne doit apparaître
  dans les compteurs, recherches, réponses d'assistant ou états de chargement.
- Toute action sensible doit avoir une confirmation proportionnée à son risque.
- Une action destructive doit nommer précisément son objet et offrir une voie
  de récupération lorsqu'elle est possible.

CONTENU ET VOIX

- Écrivez en français avec la voix « vous », jamais « tu ».
- N'utilisez pas d'em dash en milieu de phrase.
- Utilisez des libellés concrets avec verbe et objet : « Créer la facture »,
  « Consigner le paiement », « Ajouter une note ».
- Évitez les formulations vagues comme « Optimisez votre travail ».
- Les erreurs suivent la structure : ce qui s'est produit, puis ce que la
  personne peut faire.
- Les états vides expliquent la fonction de la zone et proposent une action
  réelle lorsque l'utilisateur a la permission de l'effectuer.
- Tout texte ajouté doit être prêt pour la stratégie i18n existante.

INTERACTIONS ET MOTION

Le mouvement doit confirmer une action, préserver le contexte ou expliquer un
changement d'état. N'utilisez aucune animation décorative continue.

- Durées courtes selon les tokens existants.
- Animez seulement transform et opacity lorsque possible.
- Respectez prefers-reduced-motion.
- Les tiroirs restaurent le focus à leur déclencheur.
- Les modales se ferment avec Échap et emprisonnent correctement le focus.
- Tous les contrôles essentiels sont utilisables au clavier et sur tablette.
- Les chargements utilisent des formes stables pour éviter les sauts de mise
  en page.

ÉTATS OBLIGATOIRES

Pour chaque écran et chaque composant asynchrone, concevez explicitement :

- chargement;
- succès;
- vide de première utilisation;
- aucun résultat après filtrage;
- erreur récupérable;
- erreur non récupérable;
- accès interdit;
- données partielles ou obsolètes;
- perte de connexion;
- conflit ou modification concurrente lorsque pertinent.

ACCESSIBILITÉ ET FORMAT

- Visez WCAG AA.
- Contraste lisible et focus visible.
- HTML sémantique avant ARIA.
- Noms accessibles pour les boutons à icône.
- Cibles tactiles suffisantes.
- Dates, heures et montants selon la locale du cabinet.
- Dollar canadien et taxes selon les règles métier configurées.
- Tableaux seulement pour des données réellement tabulaires.
- Timeline pour les événements chronologiques.
- Texte à gauche, nombres à droite.

PROCESSUS D'EXÉCUTION AVEC PORTES DE VALIDATION

PHASE 1, COMPRENDRE

Avant de coder, livrez un bref audit comprenant :

- les fichiers et patterns existants à réutiliser;
- les utilisateurs et permissions concernés;
- les données réelles disponibles;
- le parcours principal;
- les états et risques;
- les décisions encore inconnues.

PHASE 2, SPÉCIFIER

Produisez une spécification courte de la tranche comprenant :

- intention unique de l'écran;
- définition de terminé;
- hiérarchie exacte du contenu;
- actions et destinations;
- matrice rôle x visibilité x action;
- états vides, erreurs et chargements;
- critères d'acceptation;
- données interdites ou différées.

Si la spécification exige une décision produit non documentée, arrêtez-vous et
demandez sa validation. Ne remplacez pas cette décision par du contenu inventé.

PHASE 3, CONSTRUIRE

Après validation :

1. Implémentez la plus petite tranche verticale complète.
2. Réutilisez les services, requêtes, permissions et composants existants.
3. Ne créez pas de bouton factice, de faux KPI ou de lien mort.
4. Préservez les frontières serveur/client de Next.js.
5. Ajoutez des tests proportionnés aux règles métier et permissions touchées.
6. Lancez les vérifications ciblées, puis le build si la portée le justifie.
7. Démarrez SAFE localement et testez le parcours réel.
8. Vérifiez visuellement aux largeurs bureau, tablette et mobile.
9. Testez le clavier, les états vides, les erreurs et au moins deux rôles
   différents.
10. Passez toute la checklist du paragraphe 10 de
    docs/design/DESIGN_HUMAIN.md.

CONDITION DE TERMINÉ

Ne dites pas que la tranche est terminée tant que :

- elle utilise des données réelles;
- ses actions principales fonctionnent de bout en bout;
- les permissions sont vérifiées côté serveur;
- les états obligatoires existent;
- les tests ciblés réussissent;
- le rendu a été inspecté à plusieurs largeurs;
- aucune régression évidente n'est visible;
- aucun élément décoratif n'entre en concurrence avec le travail;
- les changements et les limites restantes sont clairement résumés.

COMMENCEZ MAINTENANT

Exécutez seulement les phases 1 et 2 pour l'écran « Aujourd'hui ». Présentez la
spécification et attendez ma validation avant toute modification du produit.
```

---

## Utilisation recommandée

Le dernier paragraphe est volontairement limité aux phases 1 et 2. Une
reconstruction complète de l'espace de travail dans une seule exécution
produirait probablement des incohérences métier et visuelles. Après validation
de l'écran « Aujourd'hui », remplacer la dernière instruction par :

```text
La spécification de l'écran « Aujourd'hui » est validée. Exécutez maintenant la
phase 3 pour cette tranche seulement. Ne commencez aucun autre module.
```

Ensuite, répéter le même cycle pour les parcours prioritaires :

1. Ouvrir et traiter un dossier.
2. Saisir puis réviser le temps.
3. Préparer, émettre et suivre une facture.
4. Consigner un paiement.
5. Effectuer et auditer une opération de fidéicommis.

