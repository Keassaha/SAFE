# 2026-08-24 — Analyse comparee cursor.com vs accueil SAFE

## Ce qui a ete fait
Mesures reelles prises au navigateur (1440x900) sur `cursor.com` et sur l'accueil SAFE
servi en local (`ExperienceCinema`). Aucune estimation : hauteurs, tailles de police,
rayons, couleurs, ratios encre/gris, comptes de noeuds et de mots viennent du DOM rendu.

Livrable : `docs/design/ANALYSE_CURSOR_VS_SAFE_2026-08-24.md`.

## Ce qui a ete observe
- L'accueil SAFE fait 11 042 px pour 1 192 mots, soit 9,3 px par mot.
  Cursor fait 8 337 px pour 1 966 mots, soit 4,2 px. La page est deux fois plus creuse.
- Le heros SAFE occupe 2 250 px (2,5 ecrans) contre 1 086 px chez Cursor.
- Cursor rejoue le produit 6 fois sur la page. SAFE le montre 1 fois, dans le heros.
- Zero preuve sociale sur l'accueil SAFE : 0 citation, 0 logo, 0 badge.
  Cursor : mur de logos + 5 citations nominatives + SOC 2 en pied.
- 22 tailles de police distinctes rendues, alors que `recit.tsx` en promet 6.
  11 px (126 fois) et 11,5 px (125 fois) coexistent sans se distinguer.
- 8 rayons de bordure distincts contre 3 chez Cursor.
- 52 % du texte seulement est en encre pleine (256 noeuds en gris `#65686B`).
  Chez Cursor : 78 %.
- Le fond de l'accueil est `#EBEDEF`, un gris bleute froid, alors que l'identite parle
  d'albatre. Cursor tient un creme chaud `#F7F7F4`.

## Ce qui a ete decide
Rien n'est encore change dans le code. Treize points d'amelioration (P1 a P13) sont
ecrits et sequences dans le livrable.

## A noter
- `--si-forest` resout vers `#1A1A1A`. Le jeton nomme « foret » ne porte pas de vert.
  Les deux verts reellement rendus sont `#26654A` (`--si-verified`) et `#2E7D5B`
  (le `em` du h1). A trancher : renommer le jeton ou lui rendre sa valeur.
- `public/images/app/` contient 4 captures reelles (comptabilite, facturation, facture,
  fideicommis) qui ne sont utilisees nulle part sur l'accueil.
- Ce travail s'ajoute au plan de reskin P1-P9 du meme jour
  (`2026-08-24_reskin_tasks_prioritized.md`) : celui-la concerne l'interieur de l'app,
  celui-ci concerne la vitrine.

## Suite du 24 aout : proposition visuelle avant build
Le CEO demande un visuel AVANT tout code, et fournit une analyse Codex de cursor.com
notee 88/100 sur treize dimensions.

Livrable : artefact publie « Refonte de l'accueil SAFE ».
Il contient trois choses que l'analyse Codex n'avait pas :
1. le ruban, les deux pages dessinees de profil a l'echelle (11 042 px contre 9 465 px proposes) ;
2. la grille de Codex retournee sur SAFE, dimension par dimension, adossee aux mesures.
   SAFE = 71/100 sur douze dimensions mesurees. Dix-sept points d'ecart, dont onze
   viennent de deux lignes : preuve commerciale (18) et demonstration produit (62).
   SAFE gagne sur performance percue (88 contre 74) et localisation (96 contre 72) ;
3. les maquettes des quatre blocs a construire, dessinees avec les jetons SAFE.

Correction apportee a l'analyse de la veille : le produit apparait 3 fois sur l'accueil
(heros vivant + 2 captures PNG dans les sections 1 et 3), pas 1 fois. Sept sections sur
neuf ne montrent aucun produit. Aucun composant `.onglets` sur l'accueil.

Sequence proposee en 8 etapes, de 30 min a 1 jour chacune. RIEN N'EST COMMENCE.

## Decision CEO du 24 aout : le fond gris reste
La proposition P8 (rechauffer `--si-canvas` de `#EBEDEF` vers un albatre chaud) est
REJETEE. Le gris bleute est conserve. Point ferme, ne pas rouvrir.

Consequences appliquees le jour meme :
- P8 barre dans `docs/design/ANALYSE_CURSOR_VS_SAFE_2026-08-24.md`, sequence corrigee ;
- l'artefact « Refonte de l'accueil SAFE » est recompose dans le gris de SAFE
  (`#EBEDEF` / `#FFFFFF` / `#26654A` / `#1A1A1A`) au lieu de l'albatre, pour qu'il montre
  la direction retenue au lieu d'en defendre une autre ;
- la passe d'hygiene ne porte plus que sur l'echelle typographique, les rayons, la part
  d'encre pleine et le jeton `--si-forest`.

## Tableau des gris soumis le 24 aout : evalue, pas applique
Un tableau « Fonds gris premium » propose une combinaison : fond `#F7F7F6`, cartes blanches,
« vert SAFE » `#1F3A2E`, encre `#161817`, texte secondaire `#666A67`, filets `#E5E7E5`.

Mesures faites (rapports de contraste calcules, pas estimes) :
- separation carte blanche / fond : `#EBEDEF` actuel 1,174:1 · Mist `#F1F2F2` 1,122:1 ·
  Soft Silver `#F3F4F4` 1,102:1 · Porcelain `#F5F5F3` et Cool Gray `#F4F5F6` 1,092:1 ·
  Cloud `#F7F7F6` (le recommande) 1,072:1, le plus faible des six ;
- le vert contre l'encre : `#2E7D5B` 3,48:1 · `#26654A` 2,52:1 · `#1F3A2E` 1,45:1 ;
- blanc sur bouton vert : `#1F3A2E` 12,33:1 · `#26654A` 6,90:1 · `#2E7D5B` 5,00:1 ;
- texte secondaire `#666A67` sur `#F7F7F6` : 5,12:1, equivalent a l'actuel (4,78:1).

Retenu : `#1F3A2E` n'est pas le vert de SAFE et tombe a 1,45:1 contre l'encre, donc il
cesse d'etre un accent pour devenir une deuxieme encre. Bon apport du tableau : le
de-bleutage (`#EBEDEF` a du bleu dedans) et les valeurs d'encre et de texte secondaire.
La colonne des gris fonces est sans objet, ni la vitrine ni l'app n'ont de theme sombre.

Decisions CEO :
- **le vert reste `#26654A`** ;
- **aucun changement de fond n'est arrete**, et surtout **on ne touche pas au site**.
  Le travail reste dans le document. Aucun fichier de l'application n'a ete modifie.

Section « Le tableau des gris, mesure » ajoutee a l'artefact « Refonte de l'accueil SAFE ».

## Essai Cloud dans le document (aucun code touche)
A la demande du CEO, l'artefact « Refonte de l'accueil SAFE » est recompose sur la
combinaison du tableau : fond Cloud `#F7F7F6`, surfaces `#FFFFFF`, encre `#161817`,
texte secondaire `#666A67`, filets `#E5E7E5`. Seul le vert reste celui de SAFE,
`#26654A`, conformement a la decision prise plus tot.

C'est un essai visuel dans le document uniquement. Les jetons de l'application et de la
vitrine ne sont pas modifies.

Ce que l'essai donne a voir : a pleine page Cloud respire et le vert `#26654A` tient bien
dessus. Le cout reste celui qui a ete mesure, la carte blanche descend a 1,072:1 contre le
fond, visible dans le ruban ou les bandes « texte seul » ne se detachent plus que par leur
filet. Compensateur identifie si Cloud est retenu : descendre le filet des cartes de
`#E5E7E5` vers environ `#DCDFDC`, qui vaut 1,160:1 sur Cloud aujourd'hui et redonnerait du
corps a la carte sans assombrir la page.

Repli documente si la carte parait fondue : Mist `#F1F2F2`, meme gris neutre, 1,122:1,
changement d'une seule valeur.

## Menu principal et premiere vue « a la maniere de Cursor » (propose, non execute)
Consigne CEO : faire un menu principal et un heros similaires a ceux de Cursor,
enregistrer toutes les instructions, livrer un visuel EN IMAGE, et n'executer
qu'apres validation explicite.

Registre des consignes ouvert : `docs/design/INSTRUCTIONS_CEO_REFONTE_ACCUEIL.md`.
Le cycle de travail devient : proposition -> image -> validation -> execution.

Transposition proposee (trois mecanismes mesures chez Cursor, aucun n'est un gout) :
1. menu a trois niveaux d'intention (Connexion / Parler a quelqu'un / Evaluer mon
   cabinet) la ou SAFE n'en a qu'un ; « Parler a quelqu'un » n'existe pas aujourd'hui ;
2. titre ramene de 92 px a 44 px (Cursor est a 26 px, ecart assume et justifie :
   leur public reconnait le produit, pas le notre) ;
3. le produit commence avant le bas de l'ecran, zone epinglee 2 250 -> 1 250 px.

Changement de copie propose : « SAFE est la suite administrative qui tient votre
cabinet ensemble. » La phrase actuelle nomme le resultat mais jamais la categorie,
et c'est ce qui coute les points de positionnement dans la grille.

Images rendues en PNG (Chrome headless, 2x) : menu-hero-safe.png, titre-echelles.png,
menu-hero-contexte.png. AUCUN fichier d'application modifie.

## Les maquettes passent a la capture reelle
Consigne CEO : « je veux une illustration reelle de mon site, en prenant le cabinet
madame Camille Roy comme exemple ». La reconstitution dessinee du tableau de bord est
remplacee par une **capture reelle** de l'application qui tourne.

Methode retenue, reutilisable : Playwright avec le Chrome installe
(`chromium.launch({channel:'chrome'})`), viewport 1560x900 en 2x, on joue le defilement
jusqu'au terme de l'animation, puis on neutralise la mise en scene
(`.pinzone{height:auto}`, `.pin{position:static}`, `.live{top:0;transform:none}`,
navigations du site et canvas masques) avant de capturer. Piege : il existe DEUX elements
`.live` sur la page, celui de l'assembleur et celui de l'application. Selecteur correct :
`.live:has(.ha-body)`.

Chiffres reels desormais visibles dans les maquettes : 43 dossiers actifs, 25 clients,
89 275,00 $ de fideicommis pour 7 clients, 38 060,20 $ de creances, 3 362,17 $ encaisses
ce mois, 2 004,88 $ factures, 13 factures en retard, 118 881,25 $ en heures non facturees.

Artefact et images regeneres. Toujours aucun fichier d'application modifie.

## Deux defauts de disposition, localises et mesures
Consigne CEO : largeur legerement reduite « comme Linear », et les quatre carres verts
doivent etre alignes.

**Alignement.** `components/public-site/ExperienceCinema.tsx:561` declare
`.ha-tiles { grid-template-columns: repeat(4, 1fr) }`, alors que le commentaire juste
au-dessus annonce « grid-cols-5, la tuile fiducie span-2 ». La tuile fideicommis prend
deux colonnes sur quatre, il en reste deux pour trois tuiles, la facturation decroche.
Mesure : 2 rangees, tuiles 645/318/318/318. Avec `repeat(5, 1fr)` : 1 rangee,
tuiles 514/252/252/252, identique au vrai tableau de bord
(`DashboardViewSafe.tsx:365`, `xl:grid-cols-5` + `sm:col-span-2`). Une seule valeur.

**Largeur.** linear.app mesure a 1 440 px : une colonne unique de 1 320 px, gouttiere 60,
menu et contenu aux memes bords. SAFE : barre a 1 320 px (`Header.tsx:639`), contenu a
1 280 px (`max-w-7xl` dans `AppChrome.tsx:68`) dans un `px-8`. Deux largeurs, aucun bord
commun. Propose : une seule largeur de 1 240 px partagee, a confirmer (le rendu reel de
`/tableau-de-bord` demande une connexion, non mesurable ici).

Images regenerees avec la correction. Toujours aucun fichier d'application modifie.

## Ordre du menu et cadre du logiciel
Deux corrections CEO.

**Ordre du menu, erreur repetee.** « Tableau de bord » vient AVANT « Aujourd'hui ».
`components/public-site/HeroLiveApp.tsx:36-37` declare `aujourdhui` puis `dash`, alors que
`lib/routes.ts` et la vraie application font l'inverse. Deux lignes a echanger.
Regle consignee en memoire (`feedback_ordre_nav_tableau_de_bord`) pour arreter la
recidive.

**Cadre du logiciel.** Le produit ne se pose plus a plat dans la page : scene en retrait,
fenetre a bord marque (`rgb(ink / .20)`, coins 14 px), barre de fenetre nommant le cabinet
et l'ecran, ombre a trois couches, legende du pli sous la fenetre. Regle consignee
(`feedback_contour_logiciel`). C'est le traitement de Cursor et de Linear : la demo est un
objet pose sur un plan distinct, pas un aplat dans le flux.

Capture regeneree avec l'ordre corrige ET les quatre montants alignes.
Toujours aucun fichier d'application modifie.

## Section 01 VALIDEE, section 02 proposee
« je valide ! conserve cette idee, on passe a la section suivante ».

Le menu principal et la premiere vue sont acquis : trois niveaux d'intention, titre a
44 px avec la categorie rendue a la phrase, deux actions, bandeau de confiance, ordre du
menu corrige, montants alignes, logiciel dans sa scene encadree, largeur unique reduite.
Non execute : le CEO a demande de conserver l'idee et d'avancer, pas de construire.

Section 02 proposee, « Cinq endroits pour un seul dossier ». Le contrat de section de
`recit.tsx` est deja le bon, il manquait la scene. Ajouts : les cinq endroits nommes en
pastilles pointillees qui se resolvent en une pastille pleine, la scene avec l'ecran
Dossiers REEL (capture pilotee : on force `.ha-screen` index 5 et on deplace la classe
`.on` de `.ha-item` sur « Pratique » pour que l'onglet actif suive l'ecran), et une sortie
de section. Toujours aucun fichier d'application modifie.

## La vitrine montre un ecran Dossiers qui n'existe plus
Le CEO fournit le vrai affichage de `safecabinet.ca/dossiers`. L'ecran `dossiers` de
`HeroLiveApp` montre un tableau de repartition par domaine ; le produit, lui, affiche un
titre avec deux actions, SEPT tuiles (total, actifs, clotures, total actes, en cours,
urgents/retard, termines), une barre de filtres et un tableau a sept colonnes.

Consequence immediate : la scene de la section 02 est reconstruite sur le vrai affichage.
Consequence a traiter : les dix-huit autres ecrans de `HeroLiveApp` datent probablement de
la meme epoque et sont a verifier un par un contre le produit.

Limite assumee : la production demande une connexion, que je n'effectue pas. La scene est
donc une reconstitution fidele de la STRUCTURE, avec des intitules et des dates de
remplissage. Une fois la section construite, la capture se prendra pour de vrai comme les
autres.

## Les captures reelles existaient deja, et section 03
Decouverte : `public/images/accueil/` contient cinq captures datees du **23 aout 2026**
(`dossiers`, `fiche-de-temps`, `facture`, `comptes-fideicommis`, `tableau-de-bord`,
4080 x 2580) qui correspondent au produit actuel. La reconstitution de l'ecran Dossiers
faite plus tot est remplacee par la vraie capture. Regle a retenir : chercher dans
`public/images/accueil/` AVANT de reconstituer ou d'utiliser un ecran de `HeroLiveApp`.

Section 03 proposee, « Le temps consigne devient la facture ». C'est la section ou SAFE
depasse Cursor : on ne montre pas une production, on montre **la meme somme d'un bout a
l'autre**, avec des chiffres reels tires des captures :
2,5 h -> 875,00 $ -> facture 2026-008 a 2 004,88 $ -> 1 042,54 $ encaisses ->
962,34 $ restants. Deux fenetres cote a cote, fiche de temps et facture.

Deux defauts produit reperes en montant la section :
- la facture 2026-008 affiche « Aucune ligne de facturation » alors que son sous-total
  vaut 1 743,75 $. Le document ne montre pas ce qui le compose, ce qui est exactement
  la promesse de la section ;
- la capture publie l'adresse courriel d'un client, a verifier contre la regle interne.

## Section 04 : le fideicommis, et deux defauts produit de plus
Section proposee sur `comptes-fideicommis.png` (capture reelle du 23 aout). Parti pris :
la scene montre une COMPARAISON et non une production, parce qu'un cabinet ne veut pas de
vitesse sur le fideicommis, il veut pouvoir repondre a un inspecteur. Trois sources
chiffrees (banque a rapprocher, registre 89 275,00 $, somme des soldes par dossier
89 275,00 $), ecart a 0,00 $, puis la ligne de surveillance reelle du produit.

Defauts reperes sur la capture :
- « Reconciliation » et « Compliance Reports » sont en ANGLAIS dans une interface
  francaise. La coherence linguistique est justement la ligne ou SAFE bat Cursor de
  24 points (96 contre 72) ; elle fuit ici ;
- la tuile « Dossiers avec provision » affiche 0 alors que le solde vaut 89 275,00 $ et
  que le tableau de bord annonce sept clients avec des fonds. Contradiction visible.

La section « Un systeme central, des outils autonomes » est sautee volontairement : elle
porte deja trois offres avec chacune sa sortie, c'est la seule de la page qui respecte
l'escalier de profondeur.

## Section 05 : trois ecrans, trois reponses
Section de recapitulation montee sur les trois captures reelles du 23 aout, en trois
petites fenetres cote a cote. Chacune porte la question a laquelle elle repond, formulee
du point de vue de l'avocate et non du logiciel : « Ou en est ce dossier ? »,
« Cette facture, elle est payee ? », « Cet argent, a qui appartient-il ? ».

Choix assume : trois fenetres plutot que le cadre a onglets. La mecanique des onglets
existe deja dans `recit.tsx` (reprise de Linear, chargement au clic) et reste valable pour
une page de fonctionnalites. Mais ici la promesse est TROIS, et un visiteur qui ne clique
jamais n'en verrait qu'un. Une section qui dit trois doit en montrer trois.

## Section 06 : la navette, et le renversement de l'argument Cursor
Section « SAFE soutient l'equipe » montee sur **la navette**, qui existe deja dans le
produit. Tout le vocabulaire vient du code : `LawyerGlance.tsx` et `messages/fr.json`
donnent les cinq types (Pret pour revue, Question, Document pret, Facture prete, Acte
urgent) et les deux gestes (Approuver, Renvoyer). Rien d'invente.

Composition : deux colonnes de role (l'adjointe prepare et marque pret, l'avocate voit
d'un coup d'oeil et tranche), puis la file elle-meme avec quatre lignes typees.

C'est ici que la comparaison avec Cursor s'inverse, et c'est l'argument commercial le plus
fort de la page : chez eux l'agent travaille seul et rend un resultat ; ici deux personnes
se passent le travail et la passation laisse une trace (qui a prepare, qui a autorise,
quand, pourquoi c'est revenu). Cursor vend de l'autonomie, SAFE vend une responsabilite
qui reste lisible. Un cabinet ne peut pas acheter la premiere sans la seconde.

## Section 07 : le bloc de preuve, construit en deux etats
L'ecart le plus violent de la grille (Cursor 94, SAFE 18) se heurte a la regle interne
« pas de client invente ». Solution : le bloc a deux etats et un seul est publie.

Publie maintenant : le bandeau de confiance, trois affirmations verifiables qui ne
demandent l'accord de personne (hebergement canadien, Quebec et Ontario, fideicommis
verifiable). Eteint : le gabarit de citation, present dans le code mais invisible tant
qu'aucune citation n'est signee. Regle retenue : **ne jamais publier un cadre de citation
vide**, il dit « nous n'avons personne ».

Quatre criteres ecrits pour ce qui compte comme preuve, dont deux qui engagent le CEO :
la citation doit etre ecrite et signee, et un acces gratuit ne donne aucun droit
d'affichage de logo (cas Me Dadie).

Constat porte a l'ecrit : le vrai cout de ce bloc n'est pas le code (une heure) mais le
courriel de demande, qui n'a pas encore ete envoye.

## Section 08 : simple des le depart
Seule section sans ecran : ce qu'elle vend est le trajet entre le oui et le premier jour.
Frise en quatre temps (evaluation, rencontre, configuration, premier jour), trois
garanties reelles tirees de `lib/tarification.ts` (60 jours avec remboursement,
resiliable en tout temps, donnees exportables), et le compteur honnete : une place prise
sur dix, deux mises en route par mois au plus.

Trois partis pris a contre-courant de l'usage SaaS, retenus comme arguments de vente :
nommer ce qui n'est PAS compris (le rattrapage comptable, ce qui protege aussi la runway),
afficher un compteur de places qui est vrai avec sa raison plutot qu'une fausse rarete,
et promettre « aucun ecran vide » au premier jour, ce qu'aucun concurrent ne promet parce
que presque aucun ne configure a la main.

Note au passage : contrairement a ce que j'avais dit plus tot, l'accueil AFFICHE deja des
prix (paliers solo et cabinet, via `TARIFICATION`). Correction apportee.

## LE CADRE CHANGE : la construction est ouverte
Consigne CEO : « on peut commencer la refonte de mon site en commencant par les couleurs
et les polices de tout le site et meme de l'application puis on attaque la landing page et
quand je valide on repeint le reste sans oublier le portail de connexion et l'audit ».

La regle « on ne touche pas au site » est LEVEE, remplacee par trois phases avec
validation entre chacune : socle (couleurs + polices, site ET application) -> landing ->
le reste, portail de connexion et audit compris.

Deux consignes de fond :
- arret du decoupage section par section, l'idee est comprise. Section 08 abandonnee ;
- **les extraits de produit montres sur le site doivent etre NAVIGABLES**, pas des
  captures. Le mecanisme existe (`HeroLiveApp`), il faut l'etendre ET remettre ses ecrans
  a jour puisqu'ils ne correspondent plus au produit. Charge nettement superieure aux PNG.

## Phase 1 preparee : la peinture tient dans un fichier
Fait notable : `lib/ds/palettes.ts` est la source unique, consommee par **308 fichiers**
via les jetons `si-*`. Repeindre le site et l'application = une quinzaine de valeurs a un
seul endroit.

Audit de contraste effectue AVANT de proposer : neuf tests, tous passes, huit s'ameliorent
avec la palette proposee. Seule perte reelle, la separation carte blanche / fond
(1,174 -> 1,072), compensee par le filet a `#E0E3E0` qui restitue exactement 1,207.

Point de bifurcation soumis au CEO : le jeton `forest` (411 usages, dont 83 en fond) vaut
`#1A1A1A`. Recommandation ecrite : le RENOMMER `ink-strong` plutot que lui rendre le vert,
qui repeindrait 83 surfaces sombres d'un coup.

## PHASE 1 EXECUTEE : la peinture est posee
Deux decisions CEO : fond **Cloud `#F7F7F6`**, et jeton `forest` **renomme** plutot que
reverdi.

### Ce qui est fait et verifie
`lib/ds/palettes.ts` repeint : `canvas #EBEDEF -> #F7F7F6`, `surface2 -> #EFEFEC`,
`border -> #E0E3E0`, `border-strong -> #8A8E8A`, `ink -> #161817`, `body -> #3A3D3B`,
`muted -> #666A67`, `subtle -> #868A86`, `line.ink -> #161817`.
Un seul fichier, 308 fichiers suivent. `tsc --noEmit` passe. Verifie au navigateur :
`--si-canvas` rend bien `#F7F7F6` et le corps de page aussi.

Le filet a `#E0E3E0` est choisi pour restituer exactement 1,207 contre le fond, la valeur
d'avant le repeint : c'est le compensateur de la separation carte/sol qui tombait de
1,174 a 1,072 avec un fond plus clair.

### CORRECTION D'UNE ESTIMATION QUE J'AVAIS DONNEE
J'ai annonce au CEO que le renommage de `forest` etait « un remplacement mecanique,
411 occurrences, ne change pas un pixel ». **C'est faux.** Le compte reel est d'environ
540 occurrences sur TROIS formes (`si-forest` 365, `si-forest-rgb` 30, `si-forest-soft` 19,
plus 127 references ecrites a la main a `--si-forest`), et `app/globals.css` contient une
couche d'alias construite exactement pour eviter ces diffs.

Aggravant : **une classe Tailwind renommee n'est pas verifiee par le compilateur**. Une
occurrence oubliee ne casse pas la compilation, elle rend un element sans couleur. Le
typecheck ne protege de rien ici.

### Ce qui a ete fait a la place, et pourquoi c'est mieux
`ink-strong` et `ink-strong-soft` sont ajoutes comme **noms canoniques**, exposes par
Tailwind en `si-ink-strong`. `forest` reste declare, **a la meme valeur**, marque
`@deprecated`. Les deux noms coexistent et pointent la meme couleur : tant que c'est le
cas, **une occurrence oubliee pendant la migration ne casse rien**. `forest` se supprime
le jour ou le compte tombe a zero, et ce jour-la le compte est verifiable par un grep.

### Reste de la phase 1
1. migrer les ~540 occurrences vers `si-ink-strong`, par lots verifies au grep ;
2. l'echelle typographique : 22 valeurs rendues -> 14, six roles.

## Migration terminee : `forest` n'existe plus, le compte est a zero
413 occurrences migrees dans **141 fichiers** : `si-forest` (364), `si-forest-rgb` (30),
`si-forest-soft` (19) deviennent `si-ink-strong*`. Le filet a servi puis a ete retire :
les cles depreciees `forest` et `forest-soft` sont supprimees de `lib/ds/palettes.ts`,
l'alias `si-forest` est supprime de `tailwind.config.ts`.

Verifications faites, dans l'ordre :
- deux jetons homonymes NON touches, verifies au compte : `si-verified-on-forest`
  (11 occurrences) et `--atm-forest` (1). Le remplacement utilisait une negation
  explicite pour les epargner ;
- `tsc --noEmit` vert avant et apres le retrait de l'alias ;
- `--si-forest` ne resout plus rien, `--si-ink-strong` rend `#161817`,
  `--si-ink-strong-rgb` rend bien `22 24 23` (la variable derivee est generee) ;
- **zero element sans couleur** et zero fond vide au rendu, ce qui etait LE risque :
  une classe Tailwind renommee n'est pas verifiee par le compilateur, un oubli aurait
  produit une regression invisible ;
- il reste trois occurrences du mot, toutes legitimes : un `--forest-soft: #16312a`
  local au module `app/atelier/atelier.module.css` (autre variable, vrai vert), et un
  commentaire d'historique dans `tailwind.config.ts`.

Etat de la phase 1 : palette posee, jeton menteur supprime. Reste l'echelle
typographique, 22 valeurs rendues vers 14.

## Echelle typographique : 22 valeurs rendues -> 15, dont 3 exceptions justifiees
**122 remplacements dans 9 fichiers** de `components/public-site/`. Regle appliquee : ne
fusionner que ce qui est indistinguable, ecart maximal d'un demi-pixel.
Fusions : 12,5 -> 12 (52 fois) · 13,5 -> 13 (22) · 11,5 -> 11 (14) · 9,5 -> 10 (11) ·
10,5 -> 10 (10) · 14,5 -> 14 (5) · 8,5 -> 9 (1) · 15,5 -> 15 (1).
Deux ecarts d'un pixel assumes, sur peu d'usages : 17 -> 16 (2) et 20 -> 19 (2), 22 -> 21 (2).

Echelle ecrite obtenue : **9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 19 · 21**, plus les
roles en clamp (92 / 56 / 40 / 24).

### Deux valeurs off-echelle que j'ai decide de NE PAS toucher
- **12,4 px et 11,8 px** : c'est le mot « SAFE » du logo. Sa taille derive de la geometrie
  de la marque, pas de l'echelle de texte. Les forcer casserait le verrouillage du logo.
- **17,5 px** : `.lede` porte `calc(var(--t-corps) - 0.5px)`, avec une justification ecrite
  dans le code (Geist se lit plus large qu'Instrument Serif a corps egal, un demi-point de
  moins rend au chapeau sa mesure). C'est une correction optique, donc du metier, pas de
  la dette.

### Une dette structurelle trouvee en chemin
La regle de `.dire` etait ecrite **deux fois**, avec la meme valeur, dans deux fichiers :
`recit.tsx` ligne 123 et `ExperienceCinema.tsx` ligne 1440. La landing appliquait la
seconde ; corriger la premiere seule ne changeait rien au rendu, ce qui a d'abord donne
l'illusion que le correctif ne prenait pas. Les deux sont alignees a 21 px.
**La duplication elle-meme reste a traiter** : `ExperienceCinema` reecrit des regles que
`recit.tsx` exporte deja.

### Verifications
`tsc --noEmit` vert. Piege du gabarit litteral de `ExperienceCinema` controle : nombre de
backticks pair, et la CSS du bas du litteral s'applique toujours au rendu. Aucune graisse
parasite : 400 / 500 / 600 seulement.

**Phase 1 terminee** : palette posee, jeton menteur supprime, echelle resserree.

## PHASE 2 commencee : la landing
Trois correctifs poses et verifies en direct.

**1. Les quatre montants sur une rangee.** `ExperienceCinema.tsx`, `.ha-tiles` passe de
`repeat(4, 1fr)` a `repeat(5, 1fr)`. Verifie au rendu : une seule rangee, tuiles de
514 / 252 / 252 / 252 px, exactement la disposition du vrai tableau de bord.

**2. Tableau de bord avant Aujourd'hui.** `HeroLiveApp.tsx`, les deux entrees echangees,
avec le commentaire qui dit pourquoi. Verifie au rendu : l'ordre est
Tableau de bord · Aujourd'hui · Pratique · Finances · Outils · Parametres.

**3. Le troisieme niveau d'intention.** La barre ne portait que « je suis deja client »
(Connexion) et « je veux m'engager » (Evaluer mon cabinet). « Parler a quelqu'un » est
ajoute entre les deux, vers `/demo`, en contour seulement pour garder **une seule action
pleine par barre**.

### Duplication confirmee, deuxieme occurrence
Le correctif 3 a d'abord semble ne rien faire : je l'avais pose dans
`components/public-site/shared.tsx`, qui sert TOUTES les pages publiques **sauf
l'accueil**. L'accueil reecrit sa propre barre dans `ExperienceCinema.tsx` (`<nav id="nav">`),
avec ses propres styles `.signin` et `.cta`. Il a fallu le poser deux fois.

C'est la meme dette que pour `.dire`, et c'est la deuxieme fois qu'elle coute du temps
dans la meme journee. **`ExperienceCinema.tsx` reimplemente ce que les composants
partages fournissent deja** : la barre, les regles de section, les styles de lien.
A traiter comme chantier propre, apres la landing.

### Reste de la phase 2
Le heros lui-meme : titre de 92 a 44 px, la categorie rendue a la phrase, la deuxieme
action « Voir l'application », le bandeau de confiance sorti des 11 px, les rectangles
flottants retires, et la zone epinglee de 2 250 a 1 250 px.

## Le heros est repris : cinq changements, mesures
- **Le titre nomme enfin la categorie.** « SAFE tient votre cabinet ensemble » devient
  « SAFE est la suite administrative qui tient votre cabinet ensemble », construction de
  Cursor : le nom, la categorie, le resultat. **L'exergue est retire** : il disait « La
  suite administrative des cabinets d'avocats », le titre le dit maintenant, c'etait un
  doublon.
- **L'affiche descend de 92 a 48 px** (`--t-affiche: clamp(32px, 3.4vw, 48px)`).
- **La mesure du titre passe de 13,4ch a 21ch.** Elle avait ete reglee pour une phrase de
  34 caracteres ; la nouvelle en porte 65 et se cassait en quatre lignes. Elle en fait
  trois.
- **La deuxieme action devient le chemin tiede** : « Voir l'application » vers `/demo`,
  au lieu de « Decouvrir la suite SAFE » qui pointait une ancre de la meme page.
- **La ligne de confiance sort du plancher** : `--t-detail` (11 px) devient `--t-corps`,
  rendu a 14 px. C'etait la seule preuve de la premiere vue et c'etait le plus petit texte
  de l'ecran.

### Mesures apres
Zone du heros **2 250 -> 1 440 px**. La premiere section commence donc a 1 440 au lieu de
2 250. Page entiere **11 042 -> 10 208 px**.

**Ecart assume avec la maquette, qui annoncait 1 250 px.** Le commentaire du code le dit :
la scene se joue sur `hauteur - 100vh`, donc raccourcir la zone accelere la cadence de
l'assemblage. A 250vh l'animation disposait de 150vh de defilement ; a 160vh elle en a 60.
Descendre a 139vh (1 250 px) ne lui en laisserait que 39, soit presque quatre fois plus
vite qu'avant. 160vh est le compromis : le produit passe au-dessus du pli et l'assemblage
garde une cadence lisible.

## CORRECTION D'UNE CRITIQUE QUE J'AVAIS FAITE
J'ai ecrit plus tot que les rectangles verts du heros « se lisent comme des debris » et
qu'« une forme qui flotte sans destination est du bruit ». **La deuxieme moitie est
fausse.** Ces fragments ont une destination : ils convergent vers la marque pendant le
defilement, c'est l'assemblage, et le rail de chapitre s'appelle « Assembler ».

Consequence : « retirer les rectangles flottants » n'est pas une suppression d'une ligne.
Le canvas `#hero-canvas` est **porteur** : le commentaire du code precise que la position
et l'echelle de l'application sont pilotees au pixel par `drawHero`. Le retirer casserait
le placement du produit.

Deux options reelles, a trancher :
1. **resserrer la zone de depart** des fragments pour qu'ils n'occupent plus la moitie
   droite de la premiere vue, en gardant la convergence ;
2. **retirer l'assemblage** et reecrire le placement de l'application sans le canvas.

La 1 est un reglage de parametres. La 2 est un chantier.

## Le menu principal : rubriques deroulantes, et une source unique
Consigne CEO : le menu principal doit ressembler a la maquette validee, avec les
chevrons et une rubrique « Ressources ».

### Ce qui a ete construit
**`components/public-site/menu-principal.ts`** : le contenu du menu, ecrit UNE fois pour
les deux barres. C'etait la troisieme fois de la journee que la duplication
`shared.tsx` / `ExperienceCinema.tsx` coutait du temps, alors le contenu est sorti des
deux fichiers. Le rendu reste propre a chaque barre, plus le contenu.

**Regle de contenu posee** : une entree mene a une page ou une section qui EXISTE, et une
rubrique n'ouvre un menu que si elle a au moins deux destinations reelles.
- SAFE Cabinet : six entrees, toutes des ancres reelles de `/fonctionnalites`
  (journee, chaine, dossiers, fideicommis, ecrans), verifiees dans le fichier ;
- Outils SAFE : trois entrees, les deux calculateurs existants plus l'index ;
- Tarification : lien simple, une seule destination, donc pas de chevron ;
- Ressources : A propos, Questions frequentes, Nous joindre.
« A propos » quitte la barre pour entrer dans Ressources.

Ouverture au survol ET au focus clavier. Pont invisible sous chaque rubrique, sans quoi
le curseur traverse un vide de douze pixels et le menu se referme sous la souris.

### Un defaut introduit, trouve et corrige par test de controle
Ma premiere version de `shared.tsx` a introduit une **erreur d'hydratation** sur toutes
les pages publiques. Le typecheck etait vert : il ne voit pas ce genre de defaut.

Methode qui a tranche : `git stash` de mon seul fichier, chargement de `/faq` dans un
**onglet neuf** (le tampon de console garde les erreurs des chargements precedents et
donne des faux positifs), lecture des erreurs. Sans ma version : aucune erreur. Avec :
l'erreur. Le doute etait leve en deux minutes.

Cause : le pont invisible etait un vrai `<span>`. Sur la barre de l'accueil je l'avais
ecrit en `::after`, et celle-la n'avait aucune erreur. Le `<span>` est devenu un
pseudo-element `after:` ; l'erreur a disparu, verifiee dans un troisieme onglet neuf.

## L'assemblage d'ouverture est retire (dec. CEO 2026-08-24)
« je ne veux plus l'animation du debut, change pour celui-ci » avec la maquette validee.

### Ce qui a ete fait, et ce qui n'a PAS ete fait
Je n'ai **pas** supprime la mecanique d'assemblage. J'ai cesse de l'emprunter.

Le chemin statique existait deja, ecrit pour le telephone et pour qui demande moins de
mouvement au systeme : `poserHeroStatique()` eteint le canevas, pose le texte a son etat
final, centre l'application sous le texte a l'echelle qui tient, et calcule la hauteur du
bloc. **C'est exactement la maquette validee.** Il devient le seul chemin par une
constante nommee :

    const ASSEMBLAGE_OUVERTURE = false;
    const REDUCED = !ASSEMBLAGE_OUVERTURE || prefers-reduced-motion || PHONE;

Repasser la constante a `true` rallume l'ouverture sans rien reecrire. C'etait le point
qui rendait ce chantier risque : le canevas est porteur, il pilote la position et
l'echelle de l'application au pixel. Le retirer aurait demande de reecrire ce placement ;
l'emprunter au chemin telephone ne demande rien.

### Mesures apres
- canevas d'assemblage : `display: none` ;
- zone du heros : **1 152 px** (elle valait 2 250 ce matin, puis 1 440 apres le premier
  raccourcissement). La maquette annoncait 1 250 : on est en dessous ;
- l'application est visible a **634 px du haut**, donc au-dessus du pli sur toute vue de
  plus de 700 px ;
- la premiere section commence a 1 152 px au lieu de 2 250 ;
- page entiere : **9 169 px**, contre 11 042 ce matin. **Moins 17 %**, sans avoir retire
  une seule section.

Plus aucune course de defilement epinglee sur la premiere vue : la page commence sur le
titre, l'action, et le logiciel pose en dessous.

## Contours et fondu, et deux mensonges nettoyes
Demande CEO : « je veux des contours et un fondu a la fin ».

**Le cadre.** `#hero-app.live` porte un bord d'un pixel a 20 % d'encre, nettement plus
ferme que les filets de la page, des coins a 14 px et une ombre a trois couches : lisere
clair interieur, ombre de contact courte, ombre longue portee par le CADRE parent.

**Le fondu est un MASQUE, pas un degrade.** Un degrade vers une couleur fixe se voit des
que le fond change et se repeint a chaque reskin ; le masque laisse passer le fond quel
qu'il soit. Consequence assumee : un masque coupe l'ombre portee, peinte hors de la boite.
C'est pour ca que l'ombre longue vit sur `#hero-cadre` (non masque) et que l'elevation
interieure vit sur `#hero-app` (masque).

### Deux choses devenues fausses avec le retrait de l'animation
1. **Le rail de chapitres annoncait « Assembler »**, mot qui ne designait plus rien. Il est
   retire. Un repere qui pointe une scene disparue est pire qu'une absence de repere.
2. **La ligne de confiance** disait « Concu au Quebec. Adapte au Quebec et a l'Ontario.
   Donnees hebergees au Canada. » Elle prend la formulation de la maquette validee :
   « Donnees hebergees au Canada · Barreau du Quebec et Barreau de l'Ontario · Registre de
   fideicommis verifiable ». Trois affirmations verifiables au lieu de deux redondantes.

### Un piege de verification, note pour la suite
Retirer le rail a **casse le script entier** : `const rail = $("rail")` faisait une
assertion non nulle, et `rail.querySelector` levait une exception qui empechait toute la
premiere vue de se poser. Le typecheck etait vert. La recherche est devenue optionnelle.

Et une fausse alerte a coute dix minutes : un onglet neuf s'ouvre en largeur telephone,
donc le chemin telephone jouait et je croyais avoir casse le cadre. **Toute verification
visuelle doit fixer la largeur de vue avant de conclure.**

## Le gabarit d'argumentation est pose, et la premiere section est montee dessus
Le CEO fournit les maquettes des sections et dit : « voici comment je veux presenter le
reste de l'argumentation de la landing page ». Le gabarit est donc ecrit **une fois**,
en CSS reutilisable, et chaque section s'y branche.

### La partition, en cinq temps
1. le titre a gauche, une phrase a droite (contrat de `recit.tsx`, deja bon) ;
2. **un objet qui resume l'argument d'un coup d'oeil** : les cinq endroits en pastilles,
   la chaine des montants, les trois sources ;
3. **la scene** : une bande en retrait (`.scene-produit`, fond `--si-surface2`, filet en
   haut et en bas) et dedans une fenetre a bord marque (`.fenetre-produit`) ;
4. la legende du pli, **sous** la fenetre, jamais dedans ;
5. la sortie de section.

Classes posees : `.scene-produit`, `.fenetre-produit` (+ `.fondue` pour le masque),
`.barre-fenetre`, `.legende-pli`, `.sortie-section`, `.pastilles`.

### Section « Cinq endroits pour un seul dossier » : livree
Ce qui a change :
- **la liste numerotee devient une rangee de pastilles.** Elle portait cinq phrases
  completes, chacune avec son numero et son etiquette de module : cinq lectures pour dire
  une seule chose. Ce sont maintenant cinq noms de cabinet (la boite courriel, le
  chiffrier, le dossier papier, le comptable, la memoire de l'adjointe), pointilles, et
  une sixieme pastille pleine : « un seul dossier ». La resolution se voit avant d'etre
  lue ;
- **la scene montre le vrai ecran** : `public/images/accueil/dossiers.png`, capture reelle
  du 23 aout, dans la fenetre encadree, avec le fondu du bas ;
- **la section a une sortie** vers `/fonctionnalites`.

Section mesuree a 1 496 px. Verifiee au rendu, largeur de vue fixee a 1 440.

### Reste de l'argumentation, meme gabarit
- « Le temps consigne devient la facture » : la chaine des montants reels
  (2,5 h -> 875,00 $ -> facture 2026-008 a 2 004,88 $ -> 1 042,54 $ encaisses ->
  962,34 $ restants) et DEUX fenetres cote a cote, `fiche-de-temps.png` et `facture.png` ;
- « Le fideicommis se verifie a trois sources » : les trois sources chiffrees, l'ecart a
  zero, la ligne de surveillance, et `comptes-fideicommis.png` ;
- « Ce que le cabinet retrouve » : trois petites fenetres, une par question.

## Les trois autres sections de l'argumentation sont montees
Toutes sur le meme gabarit, sans une ligne de style nouvelle en dehors de leur objet
propre.

**« Le temps consigne devient la facture ».** La capture unique de la fiche de temps
devient une CHAINE de cinq maillons plus DEUX fenetres cote a cote. La chaine porte la
meme somme d'un bout a l'autre, avec les chiffres reels des captures du 23 aout :
2,5 h consignees -> 875,00 $ valorises a 350,00 $ l'heure -> facture 2026-008 a
2 004,88 $ -> 1 042,54 $ encaisses -> 962,34 $ restants, dernier maillon plein.
C'est l'argument que Cursor ne peut pas faire : eux montrent une production, ici on montre
une somme qu'on peut SUIVRE.

**« Le fideicommis se verifie a trois sources ».** La capture seule devient trois lignes
chiffrees, l'ecart a 0,00 $, la ligne de surveillance reelle du produit, puis la fenetre.
Le releve bancaire porte « a rapprocher » et non un montant : c'est l'etat reel du cabinet
de demonstration, et inventer un solde concordant aurait ete exactement le genre de preuve
qui ne tient pas.

**« Ce que le cabinet retrouve ».** Les trois figures DESSINEES, qui montraient des
chiffres inventes dans des cadres dessines (1,50 h, 5 000,00 $, une echeance au 12 juin),
sont remplacees par les trois VRAIS ecrans, chacun portant la question a laquelle il
repond, ecrite dans les mots d'une avocate.

### Un defaut attrape par la verification, invisible au typecheck
`quality={88}` sur `next/image` a fait **planter la page entiere** : la valeur doit figurer
dans `images.qualities` de `next.config`, qui n'autorise que 75 et 92. Le typecheck etait
vert, et la page rendait un corps de 1 000 px sans une seule section.
C'est la troisieme fois aujourd'hui qu'un defaut passe sous le compilateur. La verification
capture desormais `pageerror` a chaque rendu, ce qui a donne le message exact.

### Etat de la landing
Sept fenetres de produit sur la page, quatre sections d'argumentation au gabarit, aucune
erreur au rendu. Page a 12 166 px : elle rallonge par rapport aux 9 169 px du heros seul,
parce que les sections portent maintenant de vraies scenes au lieu de listes de texte.

## Quatre corrections CEO, et un point qui demande son geste

**1. Le heros etait plus petit que le premier argument.** `--t-affiche` rendait 48 px
quand `--t-marque` en rendait 56 : le titre d'ouverture passait SOUS le titre de la
premiere section. Un heros ne peut pas etre plus petit que le premier argument qu'il
annonce, sinon la hierarchie ment. Remonte a `clamp(38px, 4.6vw, 66px)`, soit 66 px
contre 56, sans revenir a l'affiche de 92 qui ecrasait la scene.

**2. Moins d'ecriture avant la presentation.** Le chapeau portait deux phrases, dont une
qui enumerait NEUF postes (administration, dossiers, temps, facturation, paiements,
comptabilite, fideicommis, echeances, rapports). Une liste de neuf mots ne se lit pas,
elle se subit, et elle repoussait la scene de six lignes. Il reste une phrase :
« Vous voyez ce qui est a jour, ce qui attend et ce qui demande votre attention. »
Le produit, juste en dessous, dit le reste mieux qu'une enumeration.

**3. Le contour et le fondu restent, la bande grise part.** `.scene-produit` n'a plus de
fond ni de filets : une bande grise sous chaque section decoupait la page en tranches et
ajoutait un troisieme plan qui ne disait rien de plus. Le contour de la fenetre et son
fondu suffisent. Le debordement reste, c'est lui qui donne a la scene sa largeur.

**4. La section « Un systeme central » est refondue.** Elle empilait trois blocs de meme
poids, chacun avec un rang, un titre serif, deux ou trois phrases et un lien : douze
lignes pour dire ce que le titre disait deja. **La structure dessine maintenant la
phrase** : a gauche le systeme, seul et en grand ; a droite, separes par un filet
vertical, les deux satellites, plus petits parce qu'ils le sont. On lit la forme de
l'offre avant d'en lire un mot.

### CE QUI DEMANDE VOTRE GESTE : les captures ne suivent plus la peinture
Le CEO demande que les illustrations utilisent « la mise a jour du local actuel en terme
de font ». **Je ne peux pas le faire seul.** Les cinq captures de
`public/images/accueil/` ont ete prises le 23 aout, AVANT le repeint : elles portent
l'ancien fond `#EBEDEF`, l'ancienne encre `#1A1A1A` et l'ancienne echelle. Le site est
maintenant sur Cloud `#F7F7F6` avec l'encre `#161817`. L'ecart se voit dans chaque
fenetre : le produit montre est plus froid que la page qui l'entoure.

Les refaire demande d'ouvrir une session sur l'application, ce que je ne fais pas : je
n'entre pas de mot de passe. Deux chemins possibles, au choix du CEO :
1. il ouvre la session sur le local et je capture derriere ;
2. il envoie les captures comme il l'a fait pour l'ecran Dossiers.

## L'echelle descend d'un cran
Le CEO trouve le heros trop gros. L'ecart avec le premier argument est conserve, c'est
lui qui dit lequel des deux est le heros : `--t-affiche` passe de 66 a **56 px**,
`--t-marque` de 56 a **46 px**. Piege rencontre : `--t-marque` est declaree DEUX fois,
dans `recit.tsx` (source commune des deux portees) et redefinie dans `ExperienceCinema`.
Corriger la premiere seule ne changeait rien a l'accueil. C'est la troisieme duplication
de ce type trouvee aujourd'hui.

Mesures : h1 56 px, h2 46 px, page 11 670 px, aucune erreur au rendu.

## L'extrait navigable dans chaque section : chiffre, pas encore fait
Le CEO veut que les illustrations des sections soient l'application NAVIGABLE, comme
celle du heros, avec des sections animees, et non des captures figees.

**Ce que ca engage, mesure avant de commencer :**
- `HeroLiveApp` ne prend **aucune prop** : il rend un bloc unique `id="hero-app"` avec
  ses 19 ecrans, dont un seul porte la classe `on` ;
- **69 regles CSS** sont ecrites sur l'identifiant `#hero-app`. Un identifiant ne peut
  exister qu'une fois par page : multiplier l'extrait demande de passer ces 69 regles a
  une classe ;
- **95 references** dans le script a `#hero-app` / `heroShot`, dont le placement au pixel
  (`poserHeroStatique`), la mise a l'echelle et la delegation des clics de menu ;
- l'echelle est calculee en JS a partir d'une boite fixe de 1 360 x 640 : chaque instance
  aura besoin de la sienne.

Ce n'est donc pas un reglage, c'est un chantier : sortir l'extrait de son identifiant,
lui donner une prop d'ecran, et rendre le placement multi-instances. Le risque n'est pas
theorique : les trois defauts qui ont echappe au compilateur aujourd'hui (le pont en
`<span>`, le rail retire, `quality={88}`) etaient tous plus petits que celui-la.

Recommandation ecrite : le faire en trois passes verifiees plutot qu'en une seule.
1. passer les 69 regles de `#hero-app` a `.ha-extrait`, sans rien changer d'autre, et
   verifier que le heros est identique au pixel ;
2. donner une prop d'ecran au composant et rendre le placement independant de l'instance ;
3. brancher une instance par section, a la place des captures.

## LA CHAINE DE FACTURATION ETAIT FAUSSE. Corrigee sur les donnees reelles.
Le CEO demande de verifier si les six montants de la chaine appartiennent au meme dossier
et a la meme facture. **Ils n'y appartenaient pas, et l'erreur etait la mienne.**

Verification faite en interrogeant la base locale (`safe_local`, cabinet Demo) :
- l'entree de 2,5 h a 350,00 $ l'heure appartient au dossier **2026-042**, client
  **Services Longueuil inc.** ;
- la facture 2026-008 appartient au dossier **2026-015**, client
  **Clinique Longueuil inc.**

Deux dossiers, deux clients. J'avais pris l'entree la plus lisible de la capture et la
facture la plus lisible de l'autre capture, et je les avais reliees. La chaine etait plus
propre a lire et fausse. C'est exactement ce que la consigne interdit.

### La vraie composition, verifiee au cent pres
Le dossier 2026-015 porte trois entrees, toutes a 225,00 $ l'heure :
3,00 h (Cloture, 18 avril) + 2,75 h (Negociation, 8 juin) + 2,00 h (Cloture, 25 juin)
= **7,75 h = 1 743,75 $**, ce qui est **exactement** le `subtotalTaxable` de la facture.
Plus TPS 5 % 87,19 $ et TVQ 9,975 % 173,94 $ = **2 004,88 $**. Encaisse 1 042,54 $,
reste du 962,34 $, statut `partiellement_payee`.

La chaine dit maintenant 7,75 h -> 1 743,75 $ -> 2 004,88 $ -> 1 042,54 $ -> 962,34 $,
et une phrase sous la chaine dit ce qu'elle ne doit pas laisser croire :
« Trois entrees du meme dossier composent la facture 2026-008. Le paiement recu est
partiel : le suivi reste actif tant que le solde n'est pas a zero. »

### Un defaut du PRODUIT confirme en base
La facture 2026-008 n'a **aucune ligne** (`InvoiceLine` vide) et **aucune entree de temps
rattachee** (`invoiceId` nul sur les trois entrees, qui restent `NON_BILLED`). Le total est
correct, mais le lien entre les entrees et la facture n'existe pas dans les donnees.
C'est ce que la capture montrait avec « Aucune ligne de facturation » sous un sous-total
de 1 743,75 $. Ce n'est pas un defaut d'affichage, c'est un defaut de donnees.

## Marie Tremblay : ses vraies donnees sont minces
Releve en base, cabinet Demo :
- **Marie Tremblay**, cliente depuis le **11 aout 2026**, active, solde en fiducie **0** ;
- un dossier : **2026-001**, « Tremblay c. Commission — revision », litige civil, actif,
  ouvert le 11 aout 2026, responsable **Me Camille Roy** ;
- **une seule** entree de temps : 11 aout, 1,5 h, « Analyse du dossier et strategie »,
  250,00 $ l'heure, 375,00 $, statut READY_TO_BILL ;
- **zero** document, **zero** facture, **zero** fiducie, **aucune** echeance inscrite.

Rien de l'histoire proposee dans la consigne n'existe : ni separation, ni patrimoine
familial, ni TRE-2026-014, ni 5 000 $ en fiducie, ni facture 2026-031, ni echeance au
28 aout. Il existe aussi une **Nadia** Tremblay, a ne pas confondre.

## Chantier « ameliorer sans refaire » : execute
Consigne : ameliorer la page de `localhost:3001` sans reskin, sans toucher a la typo, a
la palette, au heros, au tableau de bord ni aux composants existants.

**Fichiers modifies : un seul.** `components/public-site/ExperienceCinema.tsx`.

1. **Description de la section « Cinq endroits »** remplacee par la consequence concrete
   (ressaisies, facturation ralentie, suivis dans la memoire de l'equipe), suivie de la
   phrase qui dit ce que SAFE relie.
2. **Fiche d'un dossier charge** ajoutee SOUS la capture de la liste, sans la remplacer :
   la liste prouve le rangement, la fiche prouve le lien. Elle n'introduit aucun motif
   nouveau (grammaire de « .ligne », colonnes des « .sources », couleurs d'etat du
   produit) et porte une **mention de demonstration explicite**, parce que le cabinet
   Demo ne contient aucun dossier reunissant temps non facture, fideicommis, facture et
   echeance. Chiffres verifies entre eux : 1 983,32 - 1 000,00 = 983,32 ;
   1,75 + 2,50 = 4,25 h, toutes consignees APRES l'emission de la facture.
3. **Transition** vers la facturation ajoutee.
4. **Facturation** : deja corrigee plus tot dans la journee sur les vraies donnees.
5. **Fideicommis** : la contradiction est levee. La page disait a la fois « a rapprocher »
   et « ecart 0,00 $ ». Elle dit maintenant que le registre et les dossiers concordent,
   que le releve reste a importer, et que **la surveillance n'est pas la certification**.
6. **Bas de page** : l'implantation passe AVANT les forfaits, dans la meme section, en
   deux sous-parties separees par un filet. Les quatre sections du bas prennent un
   degagement plus large et un filet discret.

### Piege du fichier, rencontre une fois de plus
Un accent grave dans un commentaire a ferme le gabarit litteral. Cette fois `tsc` l'a
attrape, mais la memoire du depot dit que ca peut aussi tronquer la CSS **en silence**.
Regle du depot appliquee : guillemets francais pour citer une classe dans ce fichier.

### Tests
- `tsc --noEmit` vert apres chaque modification ;
- rendu sur `localhost:3001` en **1440 x 900** et en **390 x 844** ;
- aucune erreur de page (`pageerror`) sur les deux formats ;
- polices inchangees : Instrument Serif, Geist Sans, Geist Mono ;
- palette inchangee : canvas `#F7F7F6`, encre `#161817` ;
- 15 tailles de police, comme avant le chantier ;
- **aucun defilement lateral** : `scrollWidth == clientWidth` sur les deux formats. Les
  128 elements qui depassent au telephone sont l'extrait du produit, volontairement rogne
  par son cadre ;
- sections du bas separees : filet de 1 px sur equipe, tarifs, questions et cta.

## L'illustration du premier point pointe maintenant vers l'ecran client du produit
Le CEO fournit trois captures de `safecabinet.ca/clients/...` et demande que
l'illustration reproduise CE document, en plus complet, sur le nouveau gris, avec un
contour fondant et une animation.

**La fiche est reconstruite sur la structure reelle de l'ecran client**, dans son ordre :
en-tete et actions (Actions, Modifier, badge Actif, Voir le dossier complet), onglets
(Vue d'ensemble · Dossiers · Carte client), bloc d'alertes ambre, **trois totaux**
(Total facture · Total recu · Solde du), Historique financier, puis les deux colonnes
Informations client et Fideicommis, et l'historique du dossier. Aucun motif invente : ce
sont les blocs du produit, avec les donnees de la demonstration.

**Le fond suit le gris actuel** : `.fiche` prend `var(--si-canvas)` et n'ecrit plus de
couleur en dur, donc elle suivra le prochain repeint sans y toucher.

**Contour fondant.** Le masque porte sur la fenetre ENTIERE et non sur la seule image :
le bord s'eteint avec ce qu'il borde, au lieu de s'arreter net. Un masque coupant l'ombre
portee, l'ombre longue est passee sur un parent `.fenetre-fondante`, hors du masque.

**Animation.** Aucune animation nouvelle n'a ete ecrite. Chaque bloc porte la classe
`anime-bloc`, ajoutee a la liste `CIBLES` de `recit.tsx` : c'est **l'observateur deja
present** qui les revele un a un au defilement, avec le geste et la duree de la page.
Sept blocs, tous reveles sur ordinateur apres defilement.

### Validation
- `tsc --noEmit` vert ;
- **1440 x 900** et **390 x 844**, aucune erreur de page ;
- polices inchangees (Instrument Serif, Geist Sans, Geist Mono) ; palette inchangee
  (`#F7F7F6`) ;
- aucun defilement lateral sur les deux formats ;
- animation verifiee par l'attribut `data-parait="vu"` apres defilement, pas a l'oeil.

## La fiche client est navigable, comme l'extrait du heros
Consigne : « je veux que cette illustration soit navigable comme celle du hero ».

**Aucune deuxieme mecanique n'a ete montee.** La fiche reprend le vocabulaire de la
delegation du heros : un attribut sur le declencheur, un attribut sur le panneau, un seul
ecouteur pose sur le conteneur. Le heros utilise `data-ha-screen` / `data-ha-pane` ;
la fiche utilise `data-fiche-onglet` / `data-fiche-vue`. Meme forme, meme endroit dans le
fichier, retire dans le meme nettoyage.

**Trois panneaux, tires du contenu deja ecrit**, pas d'invention :
- *Vue d'ensemble* : alertes, les trois totaux, historique financier, informations client
  et fideicommis ;
- *Dossiers (1)* : le dossier TRE-2026-014 et tout ce qui lui est rattache (etat,
  responsable, echeance, piece attendue, temps non facture, fideicommis, derniere
  facture, solde) ;
- *Carte client (5)* : ce qui a ete inscrit au dossier, du 12 fevrier au 22 aout.

**Les onglets sont de vrais boutons.** Pas de `div` avec un `role` et un `tabindex` poses
a la main : un bouton est atteint par le clavier sans qu'on ait rien a declarer, et
`aria-selected` suit l'etat. `role="tablist"` porte le libelle de l'ensemble.

Choix assume : **le panneau change sans transition de hauteur**. Une hauteur animee ferait
sauter la page sous le doigt de quelqu'un qui vient de cliquer.

### Validation
- souris : Vue d'ensemble -> Dossiers -> Carte client, l'etat suit a chaque clic ;
- **clavier** : focus sur un onglet puis Entree, le panneau change ;
- `aria-selected` verifie a `true` sur l'onglet actif apres chaque changement ;
- un seul panneau visible a la fois, verifie par le compte ;
- 1440 x 900 et 390 x 844 : aucune erreur de page, aucun defilement lateral ;
- polices et palette inchangees.

## La capture de la liste est retiree, la barre de l'application est ajoutee
Trois consignes CEO.

**1. Illustration de la liste des dossiers : retiree.** Les 21 lignes qui portaient
`dossiers.png` dans la section « Cinq endroits » sont supprimees. La section ne montre
plus qu'une chose : l'interieur d'un dossier. La capture reste utilisee dans « Ce que le
cabinet retrouve », ou elle repond a sa propre question ; elle n'a pas ete supprimee du
depot.

**2. La barre de l'application, FIGEE.** Elle situe la page : sans elle, la fiche flotte
hors du produit. Elle ne se navigue pas, et c'est un choix : l'illustration ne porte que
sur l'ecran affiche, et un menu qui s'ouvrirait sur rien decevrait plus qu'il ne
montrerait. Elle porte `aria-hidden` : un lecteur d'ecran n'a rien a y faire.
Elle reprend le detail du produit : la marque, le nom du cabinet, les six entrees avec
leurs chevrons, la recherche et son raccourci, la pastille de notifications a son compte,
« Temps » et l'avatar.

**3. Details releves un a un sur l'ecran reel.**
- **Les plaques de nombres portent un contour d'ENCRE**, pas le filet clair des autres
  cartes. C'est ce qui les detache du reste de la page, et je l'avais manque ;
- le **quatrieme bouton** de l'en-tete, « Verification d'identite », manquait ;
- « Voir le dossier complet » porte le chevron d'un lien qui sort de l'application.

### Validation
- 1440 x 900 et 390 x 844, aucune erreur de page, aucun defilement lateral ;
- les onglets repondent toujours apres ces changements (verifie par l'etat du panneau) ;
- contour des plaques verifie par la valeur calculee : `rgb(22, 24, 23)`, soit
  exactement `--si-ink` ;
- barre confirmee presente et `aria-hidden` sur les deux formats ;
- polices et palette inchangees.

## « Carte client » contenait la mauvaise chose
Correction CEO : la carte client est le REGISTRE du compte, factures et paiements. Ce
n'est pas l'historique du dossier.

Trois corrections, qui tiennent toutes au meme malentendu :
1. **La carte client devient le registre** : les factures et les paiements portes au
   compte, plus le solde. Son compte passe de (5) a **(2)**, une facture et un paiement,
   ce qui est le vrai nombre ;
2. **L'activite du dossier rejoint l'onglet Dossiers**, ou elle appartient : temps
   consigne, document ajoute, piece demandee, ouverture. C'est l'activite d'un dossier,
   pas un mouvement de compte ;
3. **Le bloc « Historique financier » perd le depot en fideicommis.** Il annonce
   « factures et paiements » et portait une troisieme ligne qui n'etait ni l'un ni
   l'autre. Le depot vit dans le bloc Fideicommis, ou il est deja.

Etat verifie des trois panneaux :
- *Vue d'ensemble* : Historique financier, Informations client, Fideicommis ;
- *Dossiers (1)* : TRE-2026-014 et Activite du dossier ;
- *Carte client (2)* : le registre et son solde.

Aucune erreur de page, les onglets repondent toujours.

## La phrase passe apres l'illustration, deux blocs retires
Consigne CEO.

- « Dans SAFE, le client, le mandat, les documents, les echeances, le temps, la
  facturation et le fideicommis restent relies au meme dossier » quitte la tete de
  section et devient la **conclusion, apres l'illustration**. Elle nomme ce qu'on vient
  de voir au lieu de l'annoncer avant que l'oeil l'ait constate ;
- la phrase « La prochaine echeance, la piece attendue... sont deja reunis » est retiree :
  la phrase deplacee dit la meme chose en mieux ;
- **la mention « Demonstration. Ce dossier est reconstruit... » est retiree**, sur
  demande explicite.

### POINT A TRANCHER PAR LE CEO
Le retrait de cette mention entre en tension avec deux regles qu'il a lui-meme posees :
sa consigne du meme jour (« ajouter une mention claire si l'histoire est reconstruite a
des fins de demonstration ») et la regle du depot (« aucun client invente »). Sophie
Tremblay, TRE-2026-014, les 5 000 $ en fideicommis et la facture 2026-031 **n'existent pas
en base** : ce sont des donnees fabriquees, maintenant publiees sans avertissement sur une
page publique.

Le retrait est applique parce qu'il a ete demande explicitement. Une solution
intermediaire existe si le CEO le souhaite : une seule ligne discrete sous la fenetre,
du poids d'une legende, plutot que le cadre pointille qui alourdissait la section.

Verifie sur les deux formats : mention absente, ancienne conclusion absente, phrase
presente apres l'illustration, trois onglets toujours actifs, aucune erreur de page.

## La transition vers la facturation est retiree
« Le dossier conserve le contexte. L'entree de temps peut maintenant poursuivre son
chemin sans etre saisie une deuxieme fois. » Ce paragraphe avait ete ajoute le meme jour
sur consigne, il est retire sur consigne.

Le style `.transition` est retire avec lui : la classe ne servait plus nulle part, verifie
par le compte avant suppression. On ne laisse pas une regle morte derriere un balisage
supprime.

Verifie sur les deux formats : texte absent, zero element portant la classe, la conclusion
de la section et les trois onglets intacts, aucune erreur de page.

## La section facturation reprend le modele interactif
Consigne CEO : reprendre pour cette illustration le modele qu'on construit, interactif et
bien fondu.

**La mecanique est generalisee, pas dupliquee.** L'ecouteur etait pose sur `.fiche`, un
element unique. Il se pose maintenant sur chaque conteneur portant `extrait-nav`, et
l'etat reste LOCAL a son conteneur : ouvrir un onglet dans un extrait ne touche pas celui
d'a cote. Verifie : apres avoir ouvert « Facture » dans le second extrait, le premier
etait toujours sur « Vue d'ensemble ». Ajouter un extrait plus bas ne demande plus que du
balisage.

**Les deux captures figees deviennent un extrait a deux ecrans**, meme cadre, meme barre
d'application figee, meme contour fondu :
- *Fiche de temps (3)* : les trois entrees du dossier 2026-015 a 225,00 $ l'heure, et
  leur total, 7,75 h pour 1 743,75 $ ;
- *Facture 2026-008* : les trois plaques a contour d'encre (Total, Deja paye, Solde du)
  et la decomposition, honoraires 1 743,75 $ + TPS 87,19 $ + TVQ 173,94 $ = 2 004,88 $.

Le lien entre les deux ecrans est visible sans commentaire : le total de la fiche de temps
est, au cent pres, la ligne d'honoraires de la facture. C'est ce que la section promet.

Tous les chiffres viennent de la base du cabinet Demo. Les captures `fiche-de-temps.png`
et `facture.png` ne sont plus utilisees ici ; elles restent dans le depot et servent
encore dans « Ce que le cabinet retrouve ».

### Validation
- 1440 x 900 et 390 x 844 : aucune erreur de page, aucun defilement lateral ;
- deux extraits navigables, deux barres figees, deux contours fondus sur les deux formats ;
- independance des extraits verifiee par l'etat, pas a l'oeil ;
- polices et palette inchangees.

## Deux suppressions
**1. La section « Un systeme central, des outils autonomes » est retiree.**
38 lignes, plus les styles `.gamme` devenus orphelins, retires dans le meme geste apres
verification qu'aucun balisage ne les portait plus.

Point verifie avant de couper, parce que la consigne du CEO du meme jour disait
« ne pas retirer l'acces aux Outils SAFE » : **l'acces est preserve**. Cinq liens vers les
calculateurs subsistent au rendu, dont la rubrique deroulante « Outils SAFE » de la barre
et le pied de page. Retirer la section n'a donc ferme aucune porte.

L'enchainement gagne en continuite : la page va maintenant du dossier a la facture, puis
de la facture au fideicommis, sans que l'architecture de l'offre s'intercale entre deux
preuves.

**2. La description sous la chaine est retiree.** « Trois entrees du meme dossier
composent la facture 2026-008... » Son style `.note-chaine` part avec elle. Elle avait ete
ecrite quand la chaine etait le seul element de la section ; depuis que l'extrait
navigable montre les trois entrees et leur total a cote de la facture, elle repetait ce
que l'oeil venait de voir.

### Etat de la page
Huit sections : probleme, continuite, verification, figures, equipe, tarifs, questions,
cta. Page a 10 932 px sur ordinateur, contre 11 042 ce matin, avec deux extraits
navigables de plus et quatre sections d'argumentation refaites.

Verifie sur les deux formats : aucune erreur de page, aucun defilement lateral.

## Le fideicommis passe au meme modele, et une decouverte grave en base
Consigne CEO : modifier la teinte, reprendre le modele du point precedent, supprimer
l'illustration des trois sources et la legende de la capture.

**Fait.** Le bloc des trois sources, la ligne de surveillance et la capture avec sa
legende sont retires, styles orphelins compris (`.sources`, `.veille`). A leur place, le
troisieme extrait navigable de la page, identique aux deux autres : cadre, barre
d'application figee, contour fondu, deux ecrans.
- *Comptes (7)* : les trois plaques a contour d'encre (solde 89 275,00 $, depots du mois
  0,00 $, retraits du mois 2 925,00 $) et les sommes detenues, client par client ;
- *Rapprochement* : les trois sources et l'ecart, avec le statut honnete.

La teinte se regle d'elle-meme : la fiche prend `--si-canvas` comme les deux autres, il
n'y a plus de blanc ecrit en dur dans cette section.

Chiffres verifies en base : huit depots pour 92 200,00 $, un retrait de 2 925,00 $ le
4 aout, donc 89 275,00 $ repartis sur sept clients. Le total des soldes clients vaut
exactement le net du registre, donc l'ecart de 0,00 $ est vrai.

### DECOUVERTE A REMONTER AU CEO : un solde de fideicommis NEGATIF
En verifiant la troisieme source, deux requetes ont diverge de 1 725,00 $. La cause :
**Simon Levesque porte un solde de fideicommis de −1 725,00 $** dans le cabinet Demo.

Deux consequences.
1. **La ligne de surveillance du produit affirme « aucun solde negatif ni fonds
   dormant ».** C'est faux pour ce cabinet. La vitrine ne la reprend plus, mais le
   PRODUIT l'affiche, et c'est une affirmation de conformite.
2. Un solde de fideicommis negatif signifie qu'il est sorti d'un compte client plus que
   ce que ce client y avait. Sur un vrai cabinet, c'est un manquement grave au sens des
   regles du Barreau. Que ce soit une donnee de demonstration ne change rien au fait que
   **la surveillance ne l'a pas signale**.

A verifier hors de ce chantier : la surveillance calcule-t-elle le negatif par client, par
dossier, ou seulement le total du cabinet ? Si elle ne regarde que le total, elle ne
detectera jamais ce cas, qui est precisement celui qu'un inspecteur cherche.
