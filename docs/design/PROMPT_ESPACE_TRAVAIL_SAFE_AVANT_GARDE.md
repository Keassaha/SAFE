# Prompt maître avant-gardiste pour l'espace de travail SAFE

> Variante assumée de PROMPT_ESPACE_TRAVAIL_SAFE.md.
> Même rigueur d'exécution, direction artistique différente : au lieu du
> « logiciel métier sobre », on vise un intérieur qui donne envie, qui se
> montre en démo, et qui reste simple à utiliser plusieurs heures par jour.

## Ce qu'on garde de la version originale (non négociable)

- Données réelles seulement, jamais de bouton factice ni de faux KPI.
- Permissions vérifiées côté serveur, rien d'inaccessible ne fuit à l'écran.
- Tranches verticales petites, avec portes de validation (Comprendre →
  Spécifier → Construire).
- Tous les états : chargement, vide, erreur, accès interdit, aucun résultat.
- Voix « vous », libellés verbe + objet, pas d'em dash en milieu de phrase.
- Accessibilité WCAG AA, clavier, prefers-reduced-motion respecté.

## Ce qu'on change

La version originale interdit tout effet spectaculaire. Cette version dit
plutôt : le spectaculaire est permis quand il sert la compréhension ou le
plaisir d'usage, et il doit être exécuté au niveau Linear / Vercel / Arc,
jamais au niveau « template Dribbble ».

---

## Prompt à copier-coller

```text
Vous travaillez dans le dépôt SAFE Inc., un SaaS de gestion de cabinet
d'avocats (Next.js App Router, TypeScript, Prisma, Supabase, Tailwind,
next-intl).

OBJECTIF

Construisez progressivement l'espace de travail authentifié de SAFE avec une
direction artistique avant-gardiste : simple, beau, vivant. La référence
n'est pas « logiciel de comptabilité des années 2010 » mais les meilleurs
produits actuels : Linear, Vercel, Arc, Raycast, Family. Un avocat qui voit
l'écran doit penser « c'est un produit premium », et une adjointe qui y passe
la journée doit le trouver reposant et rapide.

RÈGLE DE DÉPART

1. Inspectez le shell existant dans app/(app-v2)/v2, lib/ds/tokens.ts,
   lib/routes.ts et les écrans métier existants. Le système existant est le
   point de départ, pas une contrainte figée : vous pouvez faire évoluer les
   tokens et primitives, mais en un seul système cohérent, jamais deux.
2. Inspectez le schéma Prisma, les permissions et les services réels de
   l'écran visé. Aucune règle métier inventée : la base de connaissances du
   projet fait foi pour dossiers, facturation, fidéicommis, conformité.
3. Préservez tout travail non commité sans rapport avec la tâche.

DIRECTION ARTISTIQUE

Identité : le vert forêt et les surfaces ivoire/albâtre restent la signature
de SAFE. L'avant-garde vient de l'exécution, pas d'une nouvelle palette.

1. Typographie comme structure. La hiérarchie est portée par la taille, la
   graisse et l'espace, pas par des boîtes et des bordures. Titres nets,
   chiffres en tabulaire alignés à droite, Instrument Serif réservé à de
   rares moments éditoriaux (accueil du matin, écrans vides, jalons).
2. Espace généreux, densité au bon endroit. Les zones de lecture respirent;
   les tables de travail restent denses et scannables. Une seule intention
   principale par écran.
3. Profondeur subtile. Surfaces posées les unes sur les autres avec ombres
   très douces et rayons différenciés, plutôt que des cartes bordurées
   uniformes. Le fond n'est jamais un gris plat par défaut : texture ivoire,
   dégradé imperceptible ou teinte forêt très diluée selon le contexte.
4. Micro-interactions signées. Chaque action importante a une réponse
   physique : un paiement consigné se confirme visuellement, une tâche
   terminée quitte la liste avec une transition, un montant qui change
   anime son passage. Durées courtes (150 à 300 ms), transform et opacity
   seulement, ressort discret, jamais d'animation décorative en boucle.
5. Moments de délice rares et mérités. Un état vide illustré avec soin, une
   salutation contextuelle sur « Aujourd'hui », une célébration sobre quand
   la conciliation tombe juste. Un moment de délice par parcours, maximum.
6. Interface pilotable. Palette de commandes (Cmd+K) comme colonne
   vertébrale : ouvrir un client, un dossier, une facture, lancer une action
   autorisée. La recherche est un objet de design de premier plan, pas un
   champ dans un coin.
7. Le contenu est l'interface. Les vraies données du cabinet (noms, montants,
   échéances) sont mises en scène avec soin typographique; le chrome autour
   s'efface. Pas de grille uniforme de KPI : un indicateur n'existe que s'il
   change une décision.

GARDE-FOUS ANTI-KITSCH

Avant-gardiste ne veut pas dire chargé. Sont interdits :

- glassmorphism généralisé, néons, dégradés arc-en-ciel;
- particules, canvas décoratifs, animations liées au défilement;
- compteurs qui roulent pour impressionner, confettis;
- plus de deux familles typographiques visibles sur un même écran;
- tout effet qui ralentit la saisie ou la lecture d'un montant.

Test simple : si l'effet était retiré, l'utilisateur perdrait-il de
l'information ou du plaisir d'usage ? Si la réponse est non, retirez-le.

ARCHITECTURE

Navigation stable filtrée par permissions : Aujourd'hui, Dossiers, Clients,
Finances, Rapports, Paramètres. Fil d'Ariane lisible, identité du client ou
du dossier toujours visible en contexte, action principale évidente, retour
sans perte d'état. Le parcours est continu :

Aujourd'hui -> ouvrir -> comprendre -> agir -> confirmation vivante ->
retour à Aujourd'hui avec l'état actualisé.

PREMIÈRE TRANCHE : « AUJOURD'HUI »

L'écran d'accueil est la vitrine de cette direction. Il répond en moins de
cinq secondes à « Qu'est-ce qui mérite mon attention maintenant ? » :

1. Salutation contextuelle brève (moment de la journée, prénom, un fait
   utile réel : « 2 factures attendent votre approbation »).
2. Urgences et risques du jour, présentés comme des éléments d'attention
   riches (quoi, pourquoi, échéance, prochaine action, dossier concerné),
   pas comme des lignes de tableau.
3. Travail attribué avec échéance ou blocage.
4. Suivis financiers selon le rôle.
5. Activité récente en timeline fine.

Chaque élément traité disparaît ou change d'état avec une transition claire.

RÔLES, ÉTATS, QUALITÉ

- Rôles à tester au minimum : administrateur, avocat, adjointe, comptabilité.
- Le serveur est la source de vérité des permissions; masquer un bouton ne
  remplace jamais une garde.
- États obligatoires par écran : chargement (formes stables), succès, vide
  de première utilisation (illustré, avec action réelle), aucun résultat,
  erreur récupérable et non récupérable, accès interdit.
- Français voix « vous », libellés concrets verbe + objet, erreurs en deux
  temps : ce qui s'est produit, puis quoi faire. Textes prêts pour i18n.
- WCAG AA, focus visible, cibles tactiles suffisantes, montants en dollar
  canadien selon la locale du cabinet.

PROCESSUS

PHASE 1, COMPRENDRE : audit bref (existant à réutiliser, données réelles
disponibles, permissions, parcours, risques, décisions manquantes).

PHASE 2, SPÉCIFIER : spec courte (intention unique, hiérarchie exacte,
matrice rôle x visibilité x action, états, critères d'acceptation) PLUS une
section « direction visuelle » : description précise de la mise en scène,
des moments de motion et du moment de délice éventuel de la tranche. Si une
décision produit manque, arrêtez-vous et demandez validation.

PHASE 3, CONSTRUIRE : plus petite tranche verticale complète, composants et
services réels, tests proportionnés, vérification visuelle bureau/tablette/
mobile, test clavier, deux rôles minimum, aucun lien mort.

CONDITION DE TERMINÉ

La tranche n'est terminée que si : données réelles de bout en bout,
permissions serveur, états obligatoires présents, motion conforme aux
garde-fous, rendu inspecté à plusieurs largeurs, et le test du kitsch passé
sur chaque effet ajouté.

COMMENCEZ MAINTENANT

Exécutez seulement les phases 1 et 2 pour l'écran « Aujourd'hui ». Présentez
la spécification, incluant la section « direction visuelle », et attendez ma
validation avant toute modification du produit.
```

---

## Utilisation

Même cadence que la version originale : valider la spec de « Aujourd'hui »,
lancer la phase 3 pour cette tranche seule, puis répéter pour dossier, temps,
facture, paiement, fidéicommis. La section « direction visuelle » de chaque
spec est l'endroit où l'avant-garde se décide écran par écran, avant le code.
