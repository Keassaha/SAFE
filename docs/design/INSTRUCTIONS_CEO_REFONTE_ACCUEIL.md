# Instructions CEO — refonte de l'accueil SAFE

Registre des consignes donnees pendant le chantier « accueil inspire de Cursor ».
Ouvert le 2026-08-24. **Toute nouvelle consigne s'ajoute ici, datee, avant d'etre appliquee.**

---

## Regle de procedure (2026-08-24)

> « Avant tout build je veux d'abord un visuel de ce que tu penses vouloir faire. »
> « Enregistre toutes mes instructions, donne-moi un visuel en image,
>   et quand je valide on met a execution. »

**Le cycle est : proposition -> image -> validation explicite -> execution.**

1. Rien n'est ecrit dans le code de l'application ou de la vitrine sans validation.
2. Chaque proposition est livree **en image** (PNG rendu), pas seulement en lien.
3. Le travail se fait dans le document tant que la validation n'est pas donnee.
4. Une consigne donnee ici est definitive tant que le CEO ne la change pas.
   Ne pas la reproposer a chaque audit.

---

## Consignes de fond, par date

### 2026-08-24 · Perimetre
- **Ne pas toucher au site.** « je ne veux rien je veux juste travailler dans mon
  document avant on ne touche pas au site ». Aucun fichier de `app/`, `components/`
  ou `lib/` n'est modifie tant que ce point n'est pas leve.

### 2026-08-24 · Couleur
- **Le fond reste gris.** La proposition de rechauffer `--si-canvas` vers un albatre
  chaud est rejetee. Ne pas rouvrir.
- **Le vert reste `#26654A`.** Le « vert SAFE `#1F3A2E` » d'un tableau de palettes
  externe est ecarte : mesure a 1,45:1 contre l'encre, il cesse d'etre un accent.
- **Essai en cours : Cloud `#F7F7F6`.** Le CEO veut essayer ce gris neutre plus clair.
  Applique au document seulement. Cout mesure : la carte blanche passe de 1,174:1
  a 1,072:1 contre le fond. Repli documente si la carte parait fondue :
  Mist `#F1F2F2` (1,122:1), changement d'une seule valeur.
- Valeurs d'accompagnement retenues du meme tableau : encre `#161817`,
  texte secondaire `#666A67`, filets `#E5E7E5`.
- La colonne des gris fonces est **sans objet** : ni la vitrine ni l'application
  n'ont de theme sombre. Decision separee.

### 2026-08-24 · Structure de la premiere vue
- **Faire un menu principal et un heros similaires a ceux de Cursor.**

  Transposition retenue, en attente de validation :
  - **Menu a trois niveaux d'intention** au lieu d'un seul :
    `Connexion` (deja client) · `Parler a quelqu'un` (chemin commercial, absent
    aujourd'hui) · `Evaluer mon cabinet` (action principale, pleine).
    Rubriques : `SAFE Cabinet ▾` · `Outils SAFE ▾` · `Tarification` · `Ressources ▾`.
  - **Titre ramene de 92 px a 44 px.** Cursor est a 26 px, mais leur public
    reconnait le produit en une seconde et le votre non. 44 px est le compromis.
  - **Phrase du titre : la categorie revient dedans.**
    Aujourd'hui « SAFE tient votre cabinet ensemble » nomme le resultat mais jamais
    la categorie. Propose : **« SAFE est la suite administrative qui tient votre
    cabinet ensemble. »** Meme construction que Cursor : le nom, la categorie,
    le resultat.
  - **Deux actions dans la premiere vue** : `Evaluer mon cabinet` (chaud) et
    `Voir l'application →` (tiede, vers `/demo` qui existe deja).
  - **Bandeau de confiance lisible**, sorti des 11 px.
  - **Le produit commence avant le bas de l'ecran.** La zone epinglee passe de
    2 250 px a 1 250 px, et les rectangles verts flottants sont retires.

---

### 2026-08-24 · Nature des visuels
- **Les maquettes doivent montrer le vrai site, pas une reconstitution.**
  « je veux une illustration reelle de mon site, une vraie illustration en prenant le
  cabinet madame Camille Roy comme exemple ».
  Consequence : le tableau de bord montre dans les maquettes est desormais une
  **capture reelle** prise sur l'application qui tourne, pas un dessin. Les chiffres
  affiches (43 dossiers actifs, 25 clients, 89 275,00 $ de fideicommis, 38 060,20 $ de
  creances, 3 362,17 $ encaisses, 2 004,88 $ factures, 13 factures en retard,
  118 881,25 $ en heures non facturees) sortent du cabinet de demonstration
  « Me Camille Roy · Cabinet Demo ». Aucun chiffre n'est invente.
  Methode : Playwright + Chrome installe, `.live:has(.ha-body)` capture apres avoir
  joue l'animation jusqu'a son terme et neutralise la zone epinglee.

### 2026-08-24 · Largeur et disposition

> « les dimensions de mon site doivent etre legerement reduites comme celui de Linear,
>   surtout au niveau de la largeur. Et surtout fais attention : les carres verts qui
>   montrent les chiffres sont tous supposes etre alignes. Fais attention a la disposition. »

**1. Les quatre montants doivent etre sur UNE SEULE RANGEE, alignes.**
Defaut localise et mesure : `components/public-site/ExperienceCinema.tsx:561` declare
`.ha-tiles { grid-template-columns: repeat(4, 1fr) }` alors que le commentaire deux lignes
plus haut dit « comme MontantsEssentiels (grid-cols-5, la tuile fiducie span-2) ».
La tuile fideicommis occupe deux colonnes sur quatre, il en reste deux pour trois tuiles,
donc la facturation decroche sur une deuxieme rangee.
- Aujourd'hui : 2 rangees, tuiles de 645 / 318 / 318 / 318 px.
- Corrige (`repeat(5, 1fr)`) : 1 rangee, tuiles de 514 / 252 / 252 / 252 px,
  soit exactement la disposition du vrai tableau de bord
  (`components/dashboard/DashboardViewSafe.tsx:365`, `xl:grid-cols-5` + `sm:col-span-2`).
- **Une seule valeur a changer.** Verifie par capture avant / apres.

**2. Une seule largeur, legerement reduite, a la maniere de Linear.**
Mesure sur linear.app a 1 440 px de fenetre : une colonne unique de **1 320 px**,
gouttiere de 60 px, le menu et le contenu partagent exactement les memes bords.
Mesure dans le code SAFE : la barre flottante est a **1 320 px**
(`components/layout/Header.tsx:639`), le contenu est a **1 280 px**
(`max-w-7xl` dans `components/layout/AppChrome.tsx:68`) a l'interieur d'un `px-8`.
**Deux largeurs differentes, donc aucun bord commun.**
- Propose, en attente de validation : **une seule largeur de 1 240 px**, partagee par la
  barre et par le contenu, le retrait horizontal sortant du conteneur pour ne pas creer
  un second bord.
- Le chiffre exact reste a confirmer : je n'ai pas pu mesurer le rendu reel de
  `safecabinet.ca/tableau-de-bord`, qui demande une connexion.

---

### 2026-08-24 · Ordre du menu et cadre du logiciel

> « tu repetes toujours la meme erreur, le tableau de bord vient avant aujourd'hui.
>   je veux des contours qui donnent l'impression que la il est question du logiciel »

**1. REGLE DURE — « Tableau de bord » avant « Aujourd'hui ».**
Partout : application, maquettes, captures, documents. C'est l'ordre de la vraie
application et de `lib/routes.ts` (`tableauDeBord` puis `aujourdhui`).
Defaut localise : `components/public-site/HeroLiveApp.tsx:36-37` declare `aujourdhui`
puis `dash`. **Les deux lignes sont a echanger.**
Ordre attendu : Tableau de bord · Aujourd'hui · Pratique · Finances · Outils · Parametres.
Erreur deja commise plusieurs fois, consignee en memoire pour ne plus se reproduire.

**2. Le logiciel doit avoir son propre cadre.**
Une capture posee a plat dans le flux de la page se lit comme une illustration, pas comme
un produit qui tourne. Traitement retenu, visible dans la maquette :
- une **scene en retrait** autour du produit (fond `--si-canvas`, filet en haut,
  rembourrage genereux) ;
- dedans une **fenetre** : bord d'un pixel nettement plus ferme que les filets de la page
  (`rgb(ink / .20)`), coins a 14 px, **barre de fenetre** au-dessus qui nomme le cabinet
  et l'ecran, et une ombre a trois couches (liseré clair interieur, ombre de contact,
  ombre longue) ;
- la legende du pli passe **sous** la fenetre, jamais dedans.
C'est ce que font Cursor et Linear : la demo est un objet pose sur un plan distinct.

---

---

## 2026-08-24 · LE CADRE CHANGE : la construction est ouverte

> « pas besoin de cette section mais je pense que tu as suffisamment compris l'idee, je
>   veux aussi que les bouts de mon site qui ont ete presentes soient navigables, mais on
>   peut commencer la refonte de mon site en commencant par les couleurs et les polices de
>   tout le site et meme de l'application puis on attaque la landing page et quand je
>   valide on repeint le reste sans oublier le portail de connexion et l'audit. »

**La regle « on ne touche pas au site » est LEVEE.** Elle est remplacee par un plan en
trois phases, et la validation reste requise entre chacune.

### Le plan
- **Phase 1 — le socle.** Couleurs et polices, pour **tout le site ET l'application**.
  C'est ce qui est propose maintenant.
- **Phase 2 — la landing page.** Les sections dessinees, appliquees.
- **Phase 3 — apres validation, le reste est repeint**, en n'oubliant pas
  **le portail de connexion** et **l'audit**.

### Deux consignes de fond ajoutees
1. **Arret du decoupage section par section.** L'idee est comprise, on ne dessine plus
   chaque section separement. La section « Simple des le depart » (08) est **abandonnee**
   comme livrable dessine.
2. **Les extraits de produit montres sur le site doivent etre NAVIGABLES**, pas des
   captures. Le mecanisme existe deja (`HeroLiveApp`, « extrait navigable · ouvrez un
   menu ») ; il faut l'etendre aux autres sections **et remettre ses ecrans a jour**,
   puisqu'on a etabli qu'ils ne correspondent plus au produit (cas de l'ecran Dossiers).
   Consequence de charge a assumer : c'est nettement plus lourd que des PNG.

### Phase 1 · TERMINEE le 2026-08-24 (palette, jeton, echelle)

**Decisions CEO : fond Cloud `#F7F7F6`, et `forest` renomme plutot que reverdi.**
Palette appliquee et verifiee (tsc vert, rendu confirme au navigateur).
`ink-strong` ajoute comme nom canonique, `forest` conserve `@deprecated` a la meme valeur
comme filet de migration.

### Ce qui etait propose
Toute la peinture vit dans **`lib/ds/palettes.ts`**, consomme par **308 fichiers** via les
jetons `si-*`. Repeindre ne demande donc pas 308 modifications, mais une quinzaine de
valeurs a un seul endroit.

- **Palette** : `canvas` `#EBEDEF` -> `#F7F7F6` ; `surface2` -> `#EFEFEC` ;
  `border` -> `#E0E3E0` ; `border-strong` -> `#8A8E8A` ; `ink` -> `#161817` ;
  `body` -> `#3A3D3B` ; `muted` -> `#666A67` ; `subtle` -> `#868A86`.
  Inchanges : `surface`, `verified`, `brand-green`, `amber`, `amber-ink`, `danger`.
- **Audit de contraste fait avant de peindre** : neuf tests, **tous passes**, huit
  s'ameliorent. Seule perte reelle : carte blanche sur fond, 1,174 -> 1,072.
  **Compense** par le filet a `#E0E3E0`, qui restitue exactement 1,207.
- **Le jeton `forest`** vaut `#1A1A1A` et est utilise 411 fois dont 83 en fond.
  Recommandation : **le renommer `ink-strong`**, pas lui rendre le vert. Une valeur verte
  repeindrait 83 surfaces sombres d'un coup dans des ecrans non revus. Le vert est deja
  porte par `verified` et `brand-green`.
- **Polices** : la paire ne change pas (Instrument Serif, Geist Sans, Geist Mono).
  Ce qui change est **l'echelle : 22 valeurs rendues -> 14**, six roles.
  Aucun ecran ne change visiblement ; le gain est de maintenance.

## Etat des sections

### 01 · Menu principal et premiere vue — **VALIDE le 2026-08-24**
> « je valide ! conserve cette idee, on passe a la section suivante »

Est acquis et ne se rediscute plus :
- menu a trois niveaux d'intention (Connexion · Parler a quelqu'un · Evaluer mon cabinet) ;
- titre a 44 px, phrase « SAFE est la suite administrative qui tient votre cabinet ensemble. » ;
- deux actions dans la premiere vue, dont « Voir l'application » vers /demo ;
- bandeau de confiance lisible ;
- ordre du menu : Tableau de bord avant Aujourd'hui ;
- les quatre montants sur une seule rangee ;
- le logiciel dans une scene en retrait, fenetre a bord marque, barre et ombre ;
- une seule largeur, legerement reduite.

**A executer.** Le CEO n'a pas dit de construire tout de suite : il a dit de conserver
l'idee et de passer a la suite. L'execution reste a declencher.

### 02 · La section qui suit le heros — EN ATTENTE DE VALIDATION

**DEFAUT DECOUVERT LE 2026-08-24 : la maquette de la vitrine ment sur l'ecran Dossiers.**
Le CEO a fourni le vrai affichage de `safecabinet.ca/dossiers`. La maquette du heros
(`HeroLiveApp`, ecran `dossiers`) montre un simple tableau de repartition par domaine,
qui n'existe plus dans le produit. Le vrai ecran contient :
- un titre « Dossiers » et un sous-titre « Gerez vos dossiers et affaires » ;
- deux actions en haut a droite : « Exporter CSV » et « + Nouveau dossier » ;
- **sept tuiles** : Total dossiers · Dossiers actifs (avec % du total) · Dossiers clotures ·
  Total actes (avec % termines) · En cours · Urgents / retard · Termines ;
- une barre de filtres : recherche, trois listes, « Plus de filtres », rafraichir ;
- un tableau a **sept colonnes** : N° dossier, Intitule, Client, Avocat, Type, Statut,
  Ouverture (triee), plus un menu par ligne.
A verifier pour TOUS les autres ecrans de `HeroLiveApp` : ils datent probablement de la
meme epoque et peuvent mentir eux aussi.

« Cinq endroits pour un seul dossier ». Aujourd'hui du texte seul sur 729 px.
Propose : le contrat de section de `recit.tsx` conserve (titre a gauche, une phrase a
droite), les cinq endroits **nommes en pastilles pointillees** qui se resolvent en une
pastille pleine « un seul dossier », puis la scene du logiciel avec l'ecran Dossiers reel
(50 dossiers dont 43 actifs, repartis par domaine), puis une sortie « Voir ce que SAFE
relie → ». L'onglet actif du menu suit l'ecran montre.

### 03 · Le temps consigne devient la facture — EN ATTENTE DE VALIDATION
La section ou SAFE depasse Cursor au lieu de l'imiter : on montre **la meme somme d'un
bout a l'autre**. Chaine d'etats faite de chiffres reels :
2,5 h consignees -> 875,00 $ valorises -> facture 2026-008 a 2 004,88 $ ->
1 042,54 $ encaisses -> 962,34 $ restants. Deux fenetres cote a cote,
`fiche-de-temps.png` et `facture.png`, captures reelles du 23 aout.

**Deux corrections produit avant de publier cette section :**
1. la facture 2026-008 affiche « Aucune ligne de facturation » alors que son sous-total
   vaut 1 743,75 $. Le document ne montre pas ce qui le compose, ce qui est exactement
   la promesse de la section ;
2. la capture porte l'adresse courriel d'un client. A verifier contre la regle interne
   « pas de client invente ni de donnee client publiee ».

### 04 · Le fideicommis se verifie a trois sources — EN ATTENTE DE VALIDATION
La section la plus vendeuse, et celle ou le vocabulaire de Cursor ne sert a rien : un
cabinet ne veut pas de vitesse ici, il veut pouvoir repondre a un inspecteur. La scene
montre donc une **comparaison**, pas une production.
Trois sources listees et chiffrees : le releve de la banque (a rapprocher), le registre
(89 275,00 $), la somme des soldes par dossier (89 275,00 $), puis l'ecart a 0,00 $.
Sous les trois, la ligne de surveillance reelle du produit : « aucun solde negatif ni
fonds dormant ». Fenetre : `comptes-fideicommis.png`, capture reelle du 23 aout.

**Deux defauts visibles sur la capture, a corriger avant publication :**
1. « Reconciliation » et « Compliance Reports » sont **en anglais** au milieu d'une
   interface francaise. C'est la ligne ou SAFE bat Cursor de vingt-quatre points dans la
   grille, et elle fuit ici ;
2. la tuile « Dossiers avec provision » affiche **0** alors que le solde vaut
   89 275,00 $ et que le tableau de bord annonce sept clients avec des fonds.

### 05 · Ce que le cabinet retrouve, sans le chercher — EN ATTENTE DE VALIDATION
La section de recapitulation. Sa phrase dit deja tout, « trois ecrans, trois reponses »,
donc on montre **trois ecrans**, pas un. Trois petites fenetres cote a cote, chacune avec
sa capture reelle et **la question a laquelle elle repond, ecrite dans les mots d'une
avocate** :
- Pratique · Dossiers -> « Ou en est ce dossier ? »
- Finances · Facture -> « Cette facture, elle est payee ? »
- Finances · Fideicommis -> « Cet argent, a qui appartient-il ? »

**Choix assume : trois fenetres plutot que le cadre a onglets.** `recit.tsx` contient deja
la mecanique des onglets reprise de Linear (un cadre, plusieurs ecrans, le suivant se
charge au clic). Elle est bonne et reste valable pour une page de fonctionnalites. Ici la
promesse est TROIS : un visiteur qui ne clique jamais n'en verrait qu'un.

### 06 · SAFE soutient l'equipe qui tient le cabinet — EN ATTENTE DE VALIDATION
La section qui porte la these du positionnement : SAFE n'est pas le copilote de
l'avocate, il est **le copilote de l'adjointe**. La mecanique existe deja dans le
produit, c'est **la navette**. Aucun mot n'est invente : tous viennent de
`components/navette/LawyerGlance.tsx` et de `messages/fr.json`.

Composition :
- deux colonnes de role. **L'adjointe** prepare et marque pret ; **l'avocate** voit d'un
  coup d'oeil et tranche. La colonne de l'avocate est la seule teintee de vert ;
- la file, façon `LawyerGlance` : quatre lignes, chacune avec son type reel
  (Acte urgent, Facture prete, Document pret, Question) et les deux gestes reels
  (**Approuver**, **Renvoyer**), plus « Repondre » pour une question ;
- sortie : « Voir comment l'equipe travaille dans SAFE → ».

**L'argument de vente contre Cursor est ici.** Chez eux l'agent travaille seul et rend un
resultat. Ici deux personnes se passent le travail et la passation **laisse une trace** :
qui a prepare, qui a autorise, quand, et pourquoi c'est revenu. Cursor vend de
l'autonomie ; SAFE vend une responsabilite qui reste lisible. Un cabinet ne peut pas
acheter la premiere sans la seconde.

### 07 · Le bloc de preuve — EN ATTENTE DE VALIDATION
L'ecart le plus violent de la grille : Cursor 94, SAFE 18. Zero citation, zero logo, zero
badge. Et la regle interne interdit d'inventer. Le bloc se construit donc **en deux
etats**, et **seul le premier est publie** :

1. **Publie maintenant : le bandeau de confiance.** Trois affirmations defendables sans
   l'accord de personne, donc verifiables : hebergement canadien, Quebec et Ontario,
   fideicommis verifiable.
2. **Eteint jusqu'a nouvel ordre : la citation.** Le gabarit existe dans le code mais ne
   s'affiche pas tant qu'aucune citation n'est signee. Le jour ou elle arrive, elle passe
   au-dessus du bandeau. Cinq minutes, zero refonte.
   **Ne jamais publier un cadre de citation vide** : il dit « nous n'avons personne ».

**Ce qui compte comme preuve, et l'ordre pour l'obtenir :**
1. une phrase ecrite, signee, avec le nom du cabinet. Pas un compliment verbal ;
2. un chiffre que la cliente a constate elle-meme. « Je ne cherche plus mes soldes de
   fideicommis » vaut plus qu'un adjectif ;
3. un logo, seulement avec autorisation ecrite. **Un acces gratuit n'est pas une
   conversion et ne donne aucun droit d'affichage** (vaut pour Me Dadie) ;
4. toujours apres le produit, jamais avant.

**Le vrai cout de ce bloc est le courriel a envoyer, pas le code.** Une heure pour le
gabarit, une conversation pour la citation.

### 08 · Simple des le depart — ABANDONNEE (decision CEO 2026-08-24, « pas besoin de cette section »)
La seule section sans ecran, parce que ce qu'elle vend n'est pas un ecran : c'est ce qui
se passe **entre le oui et le premier jour**. Tous les chiffres viennent de
`lib/tarification.ts`.

Frise en quatre temps : l'evaluation (gratuite, sans engagement) · la rencontre (une
heure, avec vous) · la configuration (comprise, faite par nous, a la main) · le premier
jour (rien a saisir, aucun ecran vide).
Puis trois garanties reelles : soixante jours pour changer d'avis avec remboursement des
mois payes, resiliable en tout temps sans penalite ni justification, donnees exportables
dans un format lisible.

**Trois partis pris a contre-courant de l'usage SaaS, et ce sont les meilleurs arguments :**
1. **nommer ce qui n'est pas compris** : le rattrapage d'une comptabilite en retard se
   facture a part. Le dire a l'avance evite la mauvaise surprise au troisieme mois, et
   protege la runway (regle CEO du 2026-07-27) ;
2. **un compteur de places qui est vrai** : une place prise sur dix, avec la raison
   (deux mises en route par mois, faites a la main) au lieu d'une fausse rarete ;
3. **promettre « aucun ecran vide » au premier jour**, ce qu'aucun concurrent ne promet
   parce que presque aucun ne configure a la main.

### Section « Un systeme central, des outils autonomes » — SAUTEE VOLONTAIREMENT
Elle n'a pas besoin de scene : elle porte deja trois offres, chacune avec son titre, sa
ligne et sa sortie (SAFE Cabinet, Outils SAFE, Accompagnement SAFE). C'est la seule
section de la page qui respecte deja l'escalier de profondeur. Rien a y changer pour
l'instant.

## Les captures reelles existent deja
`public/images/accueil/` contient cinq captures **datees du 23 aout 2026**, qui
correspondent au produit actuel : `dossiers.png`, `fiche-de-temps.png`, `facture.png`,
`comptes-fideicommis.png`, `tableau-de-bord.png` (4080 x 2580).
**Les utiliser plutot que de reconstituer, et plutot que les ecrans de `HeroLiveApp`,
qui datent d'avant.** La reconstitution de l'ecran Dossiers faite plus tot est donc
remplacee par la vraie capture.

## Reste en attente

Images livrees le 2026-08-24 :
- `menu-hero-safe.png` — le menu et le heros proposes, poses sur la capture reelle,
  montants alignes et largeur reduite
- `disposition-alignement.png` — l'avant / apres des quatre montants et le diagramme des largeurs
- `app-camille-roy.png` — la capture reelle seule, telle qu'elle sort du site
- `titre-echelles.png` — le titre a 26 / 44 / 92 px, meme largeur
- `menu-hero-contexte.png` — la section complete avec le tableau des intentions

Rien n'est mis en execution. Le document de reference reste
`docs/design/ANALYSE_CURSOR_VS_SAFE_2026-08-24.md` et l'artefact
« Refonte de l'accueil SAFE ».
