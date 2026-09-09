# Audit de l'interface métier SAFE — enrichissement et plan

Date : 2026-09-05. **Révisé le 2026-09-07.**
Statut : complément à l'audit du même jour. Ne le remplace pas.
Autorité : subordonné à [REGLE_DE_BUILD.md](REGLE_DE_BUILD.md), qui reste opposable.

> **Révision du 2026-09-07.** Deux chantiers ont été menés entre-temps sur la
> section « Notes internes » de la fiche dossier et sur les cibles tactiles de
> tout le produit. Ils ont mis au jour une catégorie de défaut que l'audit
> d'origine ne pouvait pas voir, parce qu'elle ne se lit pas sur un écran. Le
> §3 gagne deux angles morts, le §1 est remesuré, et le §6 gagne un
> avertissement sur son propre garde-fou. Ces ajouts ne sont pas des
> hypothèses : ils sont adossés à des défauts trouvés, corrigés et testés.

---

## 0. Ce que ce document ajoute

L'audit d'origine est solide sur ce qu'il regarde : 77 routes métier, notées sur cinq
axes, avec des corrections page par page. Ce document fait trois choses qu'il ne fait
pas :

1. il **vérifie ses chiffres** contre le dépôt, en corrige deux et en ajoute six ;
2. il nomme **huit angles morts**, dont un qui change l'ordre des priorités et deux
   qui sont désormais démontrés, pas supposés ;
3. il remplace son plan par un plan **compatible avec la règle de build**, parce que
   le plan proposé est aujourd'hui interdit par le §5 de cette règle ;
4. il signale que **le garde-fou sur lequel repose sa recommandation la moins chère
   ne fonctionne pas** (§6).

---

## 1. Vérification des chiffres

Tout ce qui suit est mesuré sur le dépôt le 2026-09-05, pas estimé.

### Confirmé au chiffre près

Le contrôle `npm run design:audit` rend exactement les nombres cités :
1 118 écarts, 182 fichiers montés, dont **325** hexadécimales en dur, **372** usages de
palette Tailwind hors jeton, **272** rayons larges, **62** mouvements continus, **56**
ombres portées, **29** emojis. Le classement des dix routes les plus chargées est
identique, éditeur de document en tête à 132 écarts.

Confirmés aussi : la facture éclatée sur **14 routes**, et les cinq pages qui ne sont
qu'une redirection (`/fiches-de-temps`, `/gestion`, `/facturation/honoraires`,
`/parametres/equipe`, plus `/console/leads/[id]`).

Vérifié aussi, parce que c'est le constat le plus dur de l'audit et qu'il est exact :
`/edition/bibliotheque` lit `richDocument` et lui seul, s'arrête à `take: 200`, et
filtre dans le navigateur. Les fichiers reçus du client vivent dans le modèle
`Document`, une autre table, et n'y apparaissent jamais. Ce n'est pas une bibliothèque
du cabinet.

### Remesure du 2026-09-07

| Mesure | Audit du 5 | Aujourd'hui | Cause de l'écart |
|---|---:|---:|---|
| Écarts au standard | 1 118 | **1 108** | Travail sur les Notes internes : carte interne retirée, valeurs brutes remplacées. |
| Écarts sur `/dossiers/[id]` | 120 | **110** | Même cause. La route reste deuxième du classement. |
| Fichiers en écart | 182 | **182** | Inchangé : la dette est large, pas profonde. |

Les dix routes les plus chargées gardent le même ordre. L'éditeur de document reste en
tête à 132.

### Deux corrections

**La page la plus lourde du produit n'est pas le dossier.** L'audit désigne
`/dossiers/[id]` comme « le cœur métier le plus puissant et le plus chargé », 607
lignes. Mais `/tableau-de-bord` en compte **997**, soit 64 % de plus, et c'est la plus
grosse page de toute l'application. L'audit lui met pourtant 3/5 en présentation et ne
la range pas parmi les chantiers. Si le critère est la charge, c'est elle qui vient en
premier, et cela renforce d'ailleurs son propre constat P0 sur les accueils
concurrents.

**Le compte de routes.** 77 hors console, pas 76, et 18 de plus dans la console SAFE
Inc. La différence est mineure. Ce qui suit ne l'est pas.

### Six chiffres que l'audit ne donne pas

| Mesure | Valeur | Ce qu'elle dit |
|---|---:|---|
| Entrées de menu réelles | **21** | Le menu déclare 21 destinations pour 77 routes. |
| Routes sans entrée de menu | **48**, soit 62 % | Certaines sont légitimes (sous-pages d'un hub), mais la majorité des écrans n'a aucune porte déclarée. |
| Route de test livrée dans l'application | `/edition/_test-editeur` | Un banc d'essai monté dans le produit du cabinet. |
| Clés de traduction FR / EN | **3 920 / 3 920** | Parité parfaite, zéro clé manquante, zéro orpheline. |
| Fichiers de test | **2 123** | Le moteur est tenu par des tests, ce que l'audit ne porte jamais au crédit du produit. |
| Cabinets ayant franchi le jour 0 | **0** | Voir §2. C'est le chiffre qui gouverne le plan. |

La parité bilingue mérite d'être dite : c'est un argument de vente en Ontario et
devant le Barreau, et l'audit, qui note l'accès à l'information 2,8/5, ne la mentionne
nulle part.

---

## 2. Angle mort principal : l'audit ne mesure pas le jour 0

L'audit note chaque écran comme s'il était utilisé. Il demande si l'utilisatrice
retrouve le bon écran, si la facture est éclatée, si le dossier est trop chargé. Ce
sont les douleurs d'une utilisatrice **installée**, avec des données, des habitudes et
un historique.

Or la règle de build, §3, mesure autre chose en production : sur 30 jours, 6 clients,
3 factures, 3 entrées de temps, 1 paiement, 0 document, 6 actions au journal d'audit.
**Aucun cabinet n'a franchi le jour 0.** Le produit n'a pas d'utilisatrice installée.

La conséquence est directe : la fragmentation de la facturation n'est pas ce qui
empêche un cabinet d'ancrer. Un cabinet qui émet une facture par mois ne souffre pas
de quatorze routes de facturation. Il souffre de ne pas avoir ses données dedans.

Il manque donc un sixième axe, qui devrait primer sur les cinq autres :

> **Axe jour 0 :** cet écran est-il utilisable le premier jour, sur les vraies données
> du cabinet, sans que personne de SAFE n'intervienne ? Que montre-t-il quand il est
> vide ? Comment les données y entrent-elles ?

Noté sur cet axe, le classement change. `/import` monte au premier rang des écrans
critiques. Les états vides deviennent une fonctionnalité, pas une finition. Et la
consolidation des routes redescend, parce qu'elle améliore la vie d'une utilisatrice
qui n'existe pas encore.

---

## 3. Sept autres angles morts

**Les rôles.** L'audit note chaque écran une fois. Or la différenciation de SAFE est
que l'assistante prépare et que l'avocat décide. Chaque écran a donc deux notes, et
elles divergent : `/gestion/assistante` est excellent pour l'assistante et invisible
pour l'avocat, `/comptes/rapprochement` l'inverse. Un écran noté 4 en moyenne peut être
noté 2 pour la personne qui l'ouvre tous les jours.

**Ce qui n'a aucun écran.** L'audit ne peut noter que ce qui existe comme route. Il
manque donc précisément la catégorie que la règle de build met en priorité absolue
(§4.2, « rendre visible ce qui est déjà construit ») : l'octroi d'accès gratuit, qui
n'existe que comme script en ligne de commande ; les demandes venues du site, dont la
table est écrite mais dont l'écran de console reste à faire ; les parties multiples par
dossier, spécifiées et non montées. Du moteur sans bouton, chaque fois.

**La réversibilité.** `/import` fait entrer les données, rien ne les fait sortir. Un
cabinet qui confie son fidéicommis à un logiciel demande comment il en repart. C'est
une objection de vente autant qu'une exigence déontologique.

**Le 320 px.** L'audit le nomme dans ses conditions de validation finales, mais ne note
aucune route dessus. Or l'avocate consulte un dossier au palais, pas au bureau.

**La performance perçue.** Aucune des notes ne dépend du temps d'affichage. Une page de
997 lignes qui agrège argent, conformité, navette et activité pose une question de
requêtes autant que de hiérarchie visuelle.

### Les deux angles morts démontrés le 2026-09-06

Les cinq précédents sont des raisonnements. Les deux suivants sont des défauts qui ont
été trouvés, corrigés et couverts par des tests. Ils sont donc d'une autre nature : ils
prouvent que la méthode de l'audit laisse passer une catégorie entière.

**L'audit note ce qu'un écran montre, jamais ce que ses boutons font.** C'est sa limite
la plus coûteuse, et elle est maintenant chiffrable.

La section « Notes internes » de la fiche dossier était notée sur sa présentation :
trop de cartes, contrastes faibles, boutons ambigus. Tout cela était vrai. Mais sous la
présentation, les boutons faisaient autre chose que ce qu'ils annonçaient. Approuver
une demande de révision fermait **toutes** les demandes ouvertes du dossier, y compris
une question posée la veille par l'assistante, qui disparaissait sans avoir été lue.
Rien ne vérifiait qu'une demande existait, donc on pouvait approuver dans le vide
autant de fois qu'on cliquait : la base de développement porte deux évènements
« approuvé » à six secondes d'écart sur un dossier sans aucune demande ouverte. Le cas
n'a pas été recherché en production, faute d'accès. Et deux actions serveur ne
vérifiaient que le cabinet, ni le rôle ni le destinataire, donc un participant pouvait
clore le message d'un autre en connaissant son identifiant.

Aucun de ces trois défauts n'est visible sur une capture d'écran. Aucun n'apparaît dans
les écarts de style comptés par le contrôle automatique. Un audit qui lit les écrans ne
peut pas les trouver.

> **Conséquence de méthode.** Sur les écrans qui portent une décision opposable
> (approbation, certification, rapprochement, fermeture, virement fiduciaire), la
> notation doit ajouter une question : *le bouton fait-il exactement ce que son
> libellé annonce, et rien de plus ?* Les cinq axes existants ne la posent jamais.

**Le standard visuel n'était vérifié sur aucune mesure physique.** L'audit compte les
écarts de style : couleurs hors palette, rayons, ombres, emojis. Il ne mesure aucune
dimension d'usage. Or **aucun bouton du produit n'atteignait la taille de cible
tactile que le référentiel impose lui-même**, et cela depuis toujours.

La cause tient en une ligne : la hauteur des contrôles était exprimée dans une unité
qui suit la taille du texte, alors que la racine du produit est à 15 px. `min-h-11`
valait donc 41,25 px et non 44. Le chiffre écrit avait l'air juste, et personne ne
relit la racine. 571 contrôles étaient concernés, dans 214 fichiers, y compris les
quatre tailles du bouton partagé.

C'est l'exemple parfait d'un défaut que ni la lecture d'écran ni le contrôle
automatique existant ne pouvaient trouver : il fallait mesurer, pas regarder.

> **Conséquence de méthode.** Le contrôle de style doit être doublé d'un contrôle de
> dimensions. `scripts/audit-cibles-tactiles.mjs` fait désormais ce travail pour les
> cibles tactiles. Les autres seuils mesurables du référentiel (longueur de ligne,
> contraste, hauteur de rang) ne sont toujours vérifiés par rien.

---

## 4. Une réserve de méthode

Le barème mélange deux choses : la **qualité d'une page** et la **priorité produit**.
Une page peut être excellente et inutile, médiocre et vitale. C'est ce mélange qui
produit une liste de vingt-cinq corrections toutes défendables, dont aucune n'est
obligatoire. Le résultat se lit comme un programme de travail alors que c'est un
inventaire.

L'audit le reconnaît à demi-mot en écrivant que ses notes sont « des notes de
décision, pas une mesure scientifique ». Il faut aller plus loin : **une correction ne
devient un chantier que si elle passe le §4 de la règle de build.** Sinon elle reste
un constat.

---

## 5. Pourquoi le plan proposé ne peut pas être exécuté tel quel

Le plan de l'audit ouvre deux chantiers : consolider la facturation, puis simplifier le
détail dossier. Les deux sont des chantiers d'ancrage. Or :

- le §5 de la règle de build interdit tout chantier d'ancrage tant qu'aucun cabinet
  n'a franchi le jour 0, et aucun ne l'a franchi ;
- le §4 exige que la fonctionnalité supprime une saisie réelle ou rende visible
  quelque chose d'existant. Fusionner `/facturation/suivi` dans un filtre ne supprime
  aucune saisie et ne rend rien visible : cela déplace ce qui est déjà visible ;
- le §7 plafonne à deux chantiers vivants, un par file. La file démonstration est
  déjà occupée par le calculateur de patrimoine familial.

Ce n'est pas un désaccord sur le fond. La consolidation est juste. C'est un désaccord
sur le moment : elle règle un problème d'usage intensif dans un produit qui n'a pas
encore d'usage.

---

## 6. Le plan

### Étape 0, hors code : la séance d'observation

C'est déjà la première action de la règle de build, §10, et elle n'a pas été faite.
Ouvrir SAFE avec Me Derisier sur ses vraies données, trente minutes, et noter trois
colonnes : ce qu'elle tape à la main, ce qu'elle cherche sans trouver, ce qu'elle
continue de faire ailleurs.

Cet audit est une hypothèse sur ses douleurs. La séance la vérifie ou la démolit, pour
le prix d'un appel. Aucun chantier d'ancrage ne s'ouvre avant.

**Terminé quand** : le relevé des trois colonnes est écrit, et le prochain chantier
d'ancrage en est déduit, pas déduit de ce document.

### File démonstration, chantier ouvert : publier le calculateur

Le calculateur de patrimoine familial existe à `/outils/patrimoine-familial`, derrière
l'authentification. Il est donc invisible pour un avocat qui ne nous connaît pas, ce
qui est exactement le public visé. Le sortir vers le site public, avec l'avertissement
et les sources adaptés à un lecteur non juriste, et publier le post.

C'est le seul chantier de construction autorisé aujourd'hui, et il est déjà commencé.

**Terminé quand** : la page publique est en ligne, le post est parti, et un avocat qui
ne nous connaît pas a répondu. Si rien ne revient, on change l'angle du post, pas
l'outil.

### File ancrage, en attente : la liste courte, dans l'ordre

Rien de ceci ne s'ouvre avant l'étape 0. Mais quand elle aura eu lieu, voici ce que
cet audit désigne, filtré par le §4 et réordonné par l'axe jour 0. Un seul à la fois.

1. **Les états vides et l'entrée des données.** Ce qu'un cabinet voit le premier jour :
   soixante-dix écrans vides. Chacun devrait dire ce qu'il attend et par où ça entre.
   Passe le §4.2 : rend visible et utilisable un moteur qui existe déjà.
2. **Le moteur sans bouton.** Accès gratuit, demandes du site, parties multiples. Ce
   sont des choses construites que personne ne peut atteindre à l'écran. La règle les
   met en priorité absolue et elles sont petites.
3. **Le détail dossier.** L'audit a raison sur le fond : c'est la meilleure colonne
   vertébrale disponible. Mais il vient après les deux précédents, parce qu'il améliore
   un usage qui n'existe pas encore.
4. **La consolidation de la facturation.** Juste, et pas maintenant. Elle deviendra
   urgente le jour où un cabinet émettra trente factures par mois. Ce jour est le bon
   déclencheur, pas cet audit.

### La dette visuelle : une règle, pas un chantier

1 108 écarts ne se rattrapent pas dans une passe, et la règle de build refuse un reskin
global. La mesure qui coûte le moins et qui tient : **plus aucun écart nouveau**. Le
dépôt a déjà `npm run design:baseline`. Geler la ligne de base, et faire échouer tout
travail qui la dépasse. La dette existante se résorbe alors écran par écran, quand on
touche l'écran pour une autre raison.

> **Avertissement du 2026-09-07, à lire avant d'appliquer ce paragraphe.**
> Le garde-fou sur lequel repose toute cette recommandation ne fonctionne pas.
> `npx next lint` échoue sur ce dépôt avec `Cannot serialize key "parse" in "parser"`
> et **rend zéro erreur sans avoir rien vérifié**. Les règles PS-001, PS-002, PS-005 et
> PS-025 sont correctement écrites et se déclenchent quand on lint un fichier
> nommément, mais aucune passe complète ne les applique. Le dépôt croit donc être
> propre.
>
> Tant que ce point n'est pas réglé, « geler la ligne de base » ne gèle rien. C'est le
> prérequis silencieux de la mesure la moins chère du plan, et il coûte probablement
> moins d'une heure : migrer vers l'interface ESLint officielle, que Next annonce déjà
> comme obligatoire pour la version 16.

Trois exceptions à traiter tout de suite parce qu'elles sont anormales et minuscules :
retirer `/edition/_test-editeur` du produit, et supprimer les liens vers les deux
redirections mortes `/fiches-de-temps` et `/parametres/equipe`.

Une quatrième s'y ajoute depuis la révision, et elle est du même ordre : réparer la
passe de lint complète (voir l'avertissement ci-dessus). Elle conditionne les trois
autres, parce que rien n'empêchera leur retour autrement.

---

## 7. Ce qui reste vrai de l'audit d'origine

Pour éviter que ce document se lise comme une réfutation, il ne l'est pas. Restent
justes et repris ici :

- les trois destinations canoniques (Aujourd'hui, Tableau de bord, Conformité), avec
  `/briefing` et `/securite` absorbés. Détail confirmé : ces deux routes n'ont déjà
  aucune entrée de menu, ce sont des orphelines, leur suppression coûte presque rien ;
- la quatre questions de confiance à poser à chaque écran (source, date, complétude,
  action corrective) ;
- le classement des zones de dette visuelle, exact au chiffre près ;
- les dix parcours de validation, qui sont le meilleur passage du document et qui
  devraient servir de protocole à la séance d'observation de l'étape 0.

---

## 8. Ce qui a bougé depuis l'audit, au 2026-09-07

Deux chantiers ont été menés. Ils ne figuraient pas au plan du §6, et il faut dire
pourquoi ils étaient malgré tout autorisés.

### Les Notes internes de la fiche dossier

**Autorisé par le §4.2 de la règle de build**, « rendre visible et utilisable quelque
chose qui est déjà construit ». Le modèle portait depuis le début un champ de
rattachement entre messages (`parentId`) qu'aucun écran ne remplissait, et des demandes
de révision qu'aucun bouton ne visait nommément. Le moteur existait, le bouton non.

Livré : une décision porte désormais sur une demande précise et sur elle seule ; la
double décision est impossible, y compris entre deux onglets ; les deux actions
serveur non protégées vérifient le rôle, le destinataire et la cloison du confidentiel ;
une note libre cesse d'être enregistrée comme une question. Aucune migration : le
modèle permettait déjà de viser la demande par son identifiant. 51 tests neufs.

**Ce qui reste ouvert :** l'écran n'a pas été vu sur la vraie route, faute de session.
La vérification s'est faite sur une page de contrôle rendant le composant réel, avec
les données de la forme exacte que la page lui passe.

### Les cibles tactiles

**Autorisé comme correction d'un défaut du référentiel lui-même**, pas comme chantier :
le §2.7 impose 44 px, aucun contrôle du produit ne les atteignait, et l'écart était
invisible à la lecture. 571 contrôles corrigés dans 214 fichiers, un jeton de densité
en pixels, la règle PS-025 et un script d'audit qui remonte de la classe à la balise
pour ne juger que ce qui se clique.

**Ce qui reste ouvert :** 43 liens posés dans des cellules de registre sont dans
`.audit-cibles-baseline.json`. Les agrandir dilaterait la ligne qui les contient ; ils
se traitent en regardant l'écran, pas en masse. Et le changement de densité, réel et
visible, n'a pu être constaté que sur six routes publiques : la facturation et le
journal général sont à regarder en premier.

### Ce que ces deux chantiers changent au plan

Rien sur l'ordre. L'étape 0 reste la séance d'observation, et elle n'a toujours pas eu
lieu. Le calculateur reste le seul chantier de construction ouvert.

Mais ils confirment un point du §4 : les corrections qui passent le §4.2 sont petites,
sûres et rapides, alors que les consolidations proposées par l'audit d'origine sont
longues et risquées. **Le moteur sans bouton reste le meilleur rapport entre l'effort
et le résultat**, et c'est déjà ce que dit la liste courte du §6, point 2.
