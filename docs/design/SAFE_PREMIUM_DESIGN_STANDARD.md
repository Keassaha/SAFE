# SAFE Premium Design Standard

> **Rang.** Ce fichier est le référentiel opposable du design SAFE. Il applique
> [DESIGN_HUMAIN.md](DESIGN_HUMAIN.md) (§0 prime toujours) et remplace
> [DOCTRINE_INTERFACE_INTERIEUR.md](DOCTRINE_INTERFACE_INTERIEUR.md) comme source de
> vérité pour l'intérieur de l'application, dont il reprend et durcit toutes les règles.
>
> **Portée.** Toute interface SAFE : intérieur de l'application, console, documents
> générés, courriels transactionnels. La landing garde sa direction propre.
>
> **Objectif.** Qu'une avocate ouvrant SAFE pour la première fois le classe, en moins
> d'une seconde et sans savoir pourquoi, dans la catégorie des outils sérieux et chers.
>
> **Usage par une IA.** Chaque règle porte un identifiant, un seuil mesurable, une
> méthode de vérification et une gravité. §6 donne la procédure d'audit exécutable.
> Une règle sans seuil mesurable n'a pas sa place dans ce fichier.

---

## §0 — Les sept lois non négociables

Elles priment sur toute autre règle de ce fichier. Une seule enfreinte suffit à faire
échouer une revue, quel que soit le score obtenu ailleurs.

| ID | Loi | Pourquoi elle est première |
|----|-----|----------------------------|
| **L1** | **Le chiffre est sacré.** Tout montant, solde, heure ou référence est en mono tabulaire, aligné à droite, jamais tronqué, jamais masqué, jamais approximé à l'affichage. | Le produit vend la confiance comptable. Un chiffre mal composé détruit plus de crédibilité que dix écrans laids. |
| **L2** | **Une intention par écran.** Une seule action principale, un seul bouton plein. | Si tout est mis en avant, rien ne l'est. C'est le premier signal de l'amateurisme. |
| **L3** | **Rien ne bouge sans raison.** Aucun mouvement décoratif, aucun mouvement continu, aucun déplacement au survol. | Le mouvement gratuit dit « site vitrine ». La retenue dit « instrument ». |
| **L4** | **La couleur ne porte jamais seule une information.** Un statut a une forme et un mot en plus de sa couleur. | Daltonisme, impression noir et blanc, dossier d'inspection. |
| **L5** | **Aucune valeur brute.** Aucune hexadécimale, aucune famille Tailwind générique, aucune durée écrite à la main dans un écran. Tout passe par un token. | Sans cela, la cohérence est une intention, pas une propriété du produit. |
| **L6** | **Le premier rendu utile arrive avant 1 seconde, la réponse à un geste avant 200 ms.** | Voir §1.5. La vitesse est l'attribut premium le plus fiable et le plus sous-investi. |
| **L7** | **L'identité s'écrit en clair.** Client, partie adverse, juge, responsable. L'avatar complète le nom, ne le remplace jamais. | Confondre deux parties dans un cabinet a des conséquences réelles. |

---

## §1 — Le socle de preuves

Niveaux : 🟢 étude publiée et répliquée · 🟡 étude unique ou standard industriel
documenté · 🟠 pratique convergente non mesurée.

### 1.1 L'esthétique est lue avant le contenu, et elle contamine tout le jugement

- **🟢 50 ms suffisent** pour former un jugement esthétique stable sur une interface.
  Les notes données après 50 ms et après 500 ms sont fortement corrélées.
  Lindgaard, Fernandes, Dudek, Brown, *Attention web designers: You have 50
  milliseconds to make a good first impression*, Behaviour & Information Technology
  25(2), 2006.
- **🟢 17 ms suffisent** pour que la complexité visuelle et la prototypicalité affectent
  déjà la note. Une complexité visuelle élevée produit une première impression
  nettement plus négative qu'une complexité faible ou moyenne. Tuch, Presslaber,
  Stöcklin, Opwis, Bargas-Avila, IJHCS 70(11), 2012.
  **Conséquence pour SAFE : la densité doit être une densité d'information, jamais une
  densité de formes.** Réduire le nombre d'éléments distincts prime sur tout ajout.
- **🟢 Effet esthétique-utilisabilité.** L'apparence prédit mieux l'utilisabilité perçue
  que l'utilisabilité réelle. Kurosu et Kashimura, 252 participants, 26 écrans de
  guichet, 1995 ; répliqué et renforcé par Tractinsky (1997) puis Tractinsky, Katz,
  Ikar (2000), corrélations supérieures à 0,9 entre perception avant et après usage.
  **Conséquence : le soin visuel achète de la tolérance sur la complexité métier.**
- **🟢 L'apparence est le premier critère de crédibilité.** Sur 2 684 personnes évaluant
  des sites, l'apparence visuelle est citée dans 46,1 % des commentaires de
  crédibilité, loin devant la structure de l'information (28,5 %) et l'exactitude du
  contenu (14,3 %). Fogg et al., Stanford Web Credibility Project, 2002-2003.
  **Conséquence directe pour un logiciel de fidéicommis : le design n'est pas un
  habillage de la conformité, il en est un vecteur.**

### 1.2 Pourquoi ça marche : la fluidité de traitement

- **🟢 Plus un objet est facile à traiter, plus il est jugé beau.** La réponse affective
  positive à la fluidité est mesurable au zygomatique dans les 3 secondes, avant tout
  jugement verbalisé. Reber, Schwarz, Winkielman, *Processing Fluency and Aesthetic
  Pleasure*, PSPR 8(4), 2004.
  **Conséquence : le premium n'est pas ce qui impressionne, c'est ce qui se lit sans
  effort.** Contraste suffisant, alignements réguliers, répétition des motifs,
  vocabulaire constant. Chaque irrégularité coûte de la fluidité, donc de la beauté
  perçue, donc de la confiance.

### 1.3 Mémoire et attention, correctement citées

- **🟡 Le « 7 plus ou moins 2 » ne s'applique pas aux menus.** Miller a lui-même précisé
  que le nombre était une figure de style. La capacité réelle avec répétition
  contrôlée est plus proche de 4 (Cowan, 2001), et surtout : ce qui reste affiché à
  l'écran n'occupe pas la mémoire de travail.
  **Conséquence : ne pas amputer une navigation au nom de Miller. Grouper (chunking),
  ce qui est le vrai apport de l'article de 1956.**
- **🟢 Règle du pic et de la fin.** Une expérience est mémorisée par son moment le plus
  intense et par sa fin, pas par sa durée. Kahneman, Fredrickson, Schreiber,
  Redelmeier, 1993.
  **Conséquence : soigner la fin des parcours.** L'écran après l'envoi d'une facture,
  après un rapprochement validé, après une clôture de période, valent plus que dix
  écrans intermédiaires.

### 1.4 Tableaux et données

- **🟡 Nombres à droite, en-têtes alignés sur leur colonne.** La comparaison se fait par
  le dernier chiffre et par la position de la virgule. Consensus NN/g et pratique
  convergente des systèmes de design.
- **🟡 Le zébrage aide sur les tableaux larges, il est inutile en dessous de 4 colonnes.**
  À réserver aux tableaux de plus de six colonnes, et jamais en remplacement d'un filet.

### 1.5 Temps de réponse, chiffres opposables

| Seuil | Ce qui se produit | Source |
|---|---|---|
| **100 ms** | Perception de manipulation directe. Cible interne des produits qui vendent la vitesse (Superhuman vise même 50 ms). | Nielsen 1993, d'après Miller 1968 et Card 1991 |
| **200 ms** | Seuil « bon » de l'INP, métrique officielle de réactivité des Core Web Vitals depuis mars 2024, en remplacement du FID. Mesuré au 75e centile. | web.dev, Core Web Vitals |
| **400 ms** | Seuil de Doherty. En dessous, l'utilisateur reste en flux. Doherty et Thadani, IBM, 1982. | IBM Systems Journal |
| **1 s** | Limite de continuité de la pensée. Au delà, l'utilisateur sait qu'il attend. | Nielsen 1993 |
| **10 s** | Limite d'attention. Au delà, l'utilisateur part faire autre chose. | Nielsen 1993 |

**🟡 Architecture de référence.** Linear obtient des réponses en dessous de 50 ms en
plaçant la base active dans le navigateur et en traitant le serveur comme cible de
synchronisation plutôt que source de vérité. C'est le levier de perception le plus
puissant du marché, et le plus coûteux à implanter. Pour SAFE, la version accessible
est l'UI optimiste sur les mutations sûres, plus le préchargement au survol.

### 1.6 Formulaires

- **🟡 Le libellé se place au dessus du champ et reste visible.** Le texte indicatif ne
  remplace jamais un libellé : il disparaît à la saisie et l'utilisatrice interrompue
  ne sait plus ce qu'elle remplissait. Baymard Institute.
- **🟡 Validation en ligne, correctement faite.** Baymard relève que 31 % des sites n'en
  ont pas et qu'une partie de ceux qui en ont la font mal, notamment en signalant une
  erreur avant la fin de la saisie.
- **🟡 La largeur du champ annonce la longueur attendue.** Un champ mal dimensionné
  produit une hésitation mesurable.

### 1.7 Mouvement et accessibilité

- **🟡 WCAG 2.3.3, animations déclenchées par une interaction.** Tout mouvement non
  essentiel doit pouvoir être désactivé. `prefers-reduced-motion` est le moyen normatif.
- **🟡 Système de jetons de mouvement.** Material 3 formalise durées et courbes en
  tokens, avec par exemple une durée courte à 50 ms et une courbe « emphasized »
  `cubic-bezier(0.2, 0, 0, 1)`. Le principe à retenir n'est pas la valeur, c'est que
  **la durée et la courbe sont des tokens, pas des décisions d'écran.**

### 1.8 Le terrain juridique

- **🟡 L'échec des logiciels juridiques est un échec de conception, pas de technologie.**
  Enquête ILTA 2024 : 54 % citent la résistance des utilisateurs comme frein majeur à
  l'adoption. Le motif récurrent des retours d'expérience est le retour à la messagerie
  et au tableur trois mois après le déploiement.
- **🟡 L'écran de saisie du temps est l'écran décisif.** Si enregistrer une entrée prend
  plus de quelques secondes, l'avocate reporte, regroupe en fin de journée, perd en
  exactitude, ou renonce, et le cabinet perd le revenu.
- **🟠 Les griefs les plus cités sur les logiciels du marché** portent sur la lenteur de
  manipulation des documents, l'encombrement visuel, et la double saisie entre modules.

---

## §2 — Les jetons, source unique

Toute valeur ci-dessous vit dans `lib/ds/tokens.ts`, qui génère les variables CSS et la
configuration Tailwind. Aucune autre source n'est autorisée (**L5**).

### 2.1 Couleur

Un neutre, un accent, trois statuts. Rien d'autre n'existe.

| Jeton | Valeur | Rôle exclusif |
|---|---|---|
| `--si-surface` | `#FBFCFA` | surface de travail, panneaux, lignes |
| `--si-canvas` | `#EFF2ED` | fond d'application, jamais un fond de contenu |
| `--si-line` | `rgba(31,42,36,0.10)` | filet, séparateur |
| `--si-line2` | `rgba(31,42,36,0.06)` | séparateur très discret |
| `--si-faint` | `#8A968F` | texte désactivé, jamais un texte à lire |
| `--si-muted` | `#5A665F` | texte secondaire, libellés, méta |
| `--si-ink` | `#1F2A24` | texte principal |
| `--si-forest` | `#0B1F19` | action principale, marque |
| `--si-forest-soft` | `#16312A` | survol de l'action principale |
| `--si-verified` | `#2E7D5B` | validé, rapproché, conforme |
| `--si-amber` | `#B07A1C` | fond de pastille d'alerte seulement |
| `--si-amber-ink` | `#835A10` | texte d'alerte, seule variante conforme AA |
| `--si-alert` | `#9B2C2C` | montant négatif, erreur bloquante |

**Règles.** Un seul accent. `si-verified` porte le statut, `si-forest` porte l'action,
ils ne se remplacent jamais. Le rouge n'est pas une couleur d'échéance, les échéances
sont ambre. Griser ce qui est inactif plutôt que le masquer.

### 2.2 Espace

Base 4. Valeurs autorisées : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Toute autre valeur
doit être justifiée par un alignement optique dans un commentaire de code.

**Règle de rythme.** Rapport espace intra-groupe sur espace inter-groupe d'au moins
**1 pour 3**. C'est ce contraste qui crée la lecture, pas la quantité absolue d'espace.

### 2.3 Typographie

Trois familles, sept rôles, quatre niveaux maximum coexistant sur un écran.

| Rôle | Famille | Taille | Graisse |
|---|---|---:|---:|
| Titre d'écran | Instrument Serif | 26 à 32 px | 400 |
| Titre de section | Geist Sans | 13 px | 580 |
| En-tête de colonne | Geist Sans | 11 à 12 px | 540 |
| Corps et libellés | Geist Sans | 13 px | 450 |
| Texte fort de ligne | Geist Sans | 13 px | 520 |
| Secondaire, méta | Geist Sans | 11 à 12 px | 450 |
| **Tout chiffre** | **Geist Mono** | 12 à 13 px | 450 |

Interlettrage `-0.008em` sur l'interface, rien sur le mono. `font-variant-numeric:
tabular-nums` obligatoire sur tout chiffre. Instrument Serif jamais dans un tableau, un
bouton ou une pastille. Paragraphe plafonné à `65ch`.

### 2.4 Rayon

| Élément | Rayon |
|---|---:|
| Boutons, champs, petits contrôles | `6px` |
| Panneaux, cartes internes | `8` à `10px` |
| Superpositions, modales, palette | `12px` |
| Pastilles de statut et de filtre | plein |

**Le rayon plein est réservé à ce qui décrit, jamais à ce qui déclenche.** C'est ce qui
distingue au premier regard une action d'un état.

### 2.5 Élévation

Trois niveaux depuis le 30 juillet 2026, pas quatre.

- **Niveau 0, posé.** Filet `1px` en `si-line`. Aucune ombre. C'est le cas par défaut de
  tout ce qui vit dans le flux : ligne, panneau, tableau, section, carte.
- **Niveau 1, flottant.** `0 18px 36px -20px rgba(11,31,25,0.5)`. Réservé à ce qui
  flotte réellement : menu, modale, palette de commandes, info-bulle, notification.
- **Niveau 2, focalisé.** `0 30px 64px -28px rgba(11,31,25,0.62)`. Réservé à une surface
  qui réclame l'attention et porte une décision : approbation, confirmation d'écriture
  comptable. Une seule à la fois à l'écran.

Les niveaux 1 et 2 sont les seuls autorisés à porter du verre. Voir
[SYSTEME_DE_PROFONDEUR_TROIS_PLANS](SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md).

### 2.6 Mouvement

| Jeton | Valeur | Usage |
|---|---|---|
| `--motion-instant` | `120ms` | changement d'état d'un contrôle |
| `--motion-base` | `180ms` | révélation, ouverture de panneau |
| `--motion-slow` | `260ms` | transition d'écran, modale |
| `--motion-ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | courbe unique du produit |

Aucune autre durée, aucune autre courbe. Aucun mouvement au delà de 260 ms.
`prefers-reduced-motion: reduce` neutralise toute transition et toute animation.

### 2.7 Densité

| Élément | Hauteur |
|---|---:|
| Ligne de tableau, bureau | `44px` |
| Ligne de tableau, tactile | `56px` |
| Barre d'outils | `44px` |
| En-tête de groupe collant | `36px` |
| Barre de synthèse | `36px` |
| Cible tactile minimale | `44px` |

### 2.8 Zoom souple — la marque de ce qui se sélectionne

Décision CEO du 2026-08-11. **Partout où quelque chose se sélectionne dans SAFE,
la surface se soulève.** Elle ne se peint pas en gris, elle ne prend pas de filet
d'encre à gauche, elle ne s'allume pas : elle grandit d'un cheveu et son ombre
s'ouvre. C'est le geste signature du produit, et il n'en existe qu'un.

| Classe | Surfaces | Échelle | Élévation |
|---|---|---:|---|
| `.safe-zoom` | cartes, tuiles, blocs cliquables | `1.006` + `-1px` | `0 12px 26px -18px` |
| `.safe-zoom-rang` | rangées de registre | `1.005` | `0 10px 24px -18px` |
| `.safe-zoom-menu` | menus, onglets, navigation, listes déroulantes | `1.02` + `-1px` | `0 10px 20px -14px` |

Trois contraintes non négociables :

1. **L'échelle reste sous le seuil du flou.** Une mise à l'échelle rééchantillonne
   le texte. Au-delà de 1 % sur un libellé de 13 px, la donnée devient molle : sur
   une rangée de registre, c'est l'élévation qui porte la sensation, pas la taille.
   Une entrée de menu, courte et survolée une fraction de seconde, tolère 2 %.
2. **La rangée de tableau ne se transforme jamais au-delà de son alignement.**
   `transform-origin: center` et `position: relative`, sans quoi les bordures se
   décalent et la grille vibre.
3. **Le conteneur doit laisser respirer.** Un menu en `overflow-hidden` rogne
   l'entrée qui grandit : ses éléments s'insèrent (`px-1.5`), ils ne bordent pas
   la paroi.

État **coché** et état **menu ouvert** : même soulèvement, mais permanent. Une
sélection dure, un survol passe. La case cochée reste le porteur accessible de
l'état ; l'ombre ne fait que le rendre lisible d'un coup d'œil.

`prefers-reduced-motion: reduce` neutralise toute la mécanique et rend la main au
fond `--si-surface2` : sans mouvement, il faut bien que le survol se voie.

---

## §3 — Règles auditables

Gravité : **B** bloquant, la livraison est refusée · **M** majeur, à corriger avant la
fin du lot · **m** mineur, à inscrire au journal.

### 3.1 Fondations

| ID | Règle | Seuil mesurable | Vérification | Grav. |
|---|---|---|---|---|
| PS-001 | Aucune hexadécimale dans un fichier d'interface | 0 occurrence de `#[0-9A-Fa-f]{6}` | grep | B |
| PS-002 | Aucune famille Tailwind générique | 0 occurrence de `(bg\|text\|border\|ring\|fill\|stroke)-(emerald\|green\|teal\|slate\|gray\|zinc\|neutral\|stone\|blue\|indigo\|violet\|purple\|pink\|orange\|cyan\|sky\|lime)-\d{2,3}` | grep | B |
| PS-003 | Espacements sur l'échelle base 4 | 100 % des valeurs dans la liste §2.2 | revue visuelle plus grep des classes arbitraires | M |
| PS-004 | Rayons conformes aux quatre rôles | 0 `rounded-(xl\|2xl\|3xl)` hors superposition ; `rounded-full` seulement sur pastille ou filtre | grep plus revue | M |
| PS-005 | Aucune ombre sur un élément du flux | 0 `shadow-` hors composant flottant déclaré | grep | M |
| PS-006 | **Amendée le 30 juillet 2026.** Aucun dégradé sur une surface de contenu, aucun flou sur un élément du flux. Le verre est autorisé sur le seul plan flottant, sous les conditions PS-006a à PS-006f | voir [SYSTEME_DE_PROFONDEUR_TROIS_PLANS](SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md) §6 | grep plus revue | M |
| PS-007 | Quatre niveaux typographiques maximum par écran | ≤ 4 | revue visuelle | M |
| PS-008 | Paragraphes plafonnés | ≤ 65ch | revue | m |

### 3.2 Le chiffre (L1)

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-010 | Tout chiffre en mono tabulaire | 100 % | revue plus test de rendu | B |
| PS-011 | Colonnes numériques alignées à droite, en-tête compris | 100 % | revue | B |
| PS-012 | Aucun montant tronqué, aucun arrondi d'affichage silencieux | 0 | revue plus test avec montant à 7 chiffres | B |
| PS-013 | Ligne de total distincte par un filet supérieur et une graisse 560, sans fond coloré | 100 % | revue | M |
| PS-014 | Solde nul affiché `0,00`, grisé, jamais masqué ni remplacé par un tiret | 100 % | revue | M |
| PS-015 | Montant négatif en `si-alert` avec signe moins, jamais entre parenthèses seules | 100 % | revue | M |
| PS-016 | Le solde en fidéicommis est visible sans interaction, jamais replié, jamais derrière un onglet | 100 % | revue | B |
| PS-017 | Un seul composant de formatage de montant dans tout le produit | 1 | recherche des occurrences de `toFixed` et `Intl.NumberFormat` hors composant | M |

### 3.3 Hiérarchie et action (L2)

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-020 | Une seule action principale visible par écran | exactement 1 bouton plein `si-forest` | revue | B |
| PS-021 | Quatre niveaux d'action seulement : primaire, secondaire, discret, destructif | 4 | revue du composant | M |
| PS-022 | Destructif en texte rouge, jamais en fond plein, confirmation obligatoire | 100 % | revue | M |
| PS-023 | Tout bouton désactivé porte une raison lisible à proximité ou en info-bulle | 100 % | revue | M |
| PS-024 | Aucune action essentielle révélée par le seul survol | 0 | revue plus test tactile | B |

### 3.4 États et retours

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-030 | Les quatre états sur chaque contrôle : repos, survol, focus clavier, désactivé | 100 % | test clavier | B |
| PS-031 | Focus clavier visible partout, jamais supprimé | 0 `outline: none` sans remplacement | grep plus test | B |
| PS-032 | Chaque écran de liste possède ses trois états dessinés : vide, chargement, erreur | 3 sur 3 | revue | M |
| PS-033 | Squelettes immobiles, aux dimensions réelles du contenu attendu | 0 `animate-pulse` | grep | M |
| PS-034 | Message d'erreur : ce qui s'est passé, puis quoi faire | 100 % | revue de la microcopie | M |
| PS-035 | État vide : une phrase de contexte plus une action, aucun emoji, aucune illustration | 100 % | revue | M |
| PS-036 | Toute action réussie produit une confirmation discrète et non bloquante | 100 % | revue | m |

### 3.5 Mouvement (L3)

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-040 | Durées uniquement dans les trois jetons §2.6 | 100 % | grep des durées littérales | M |
| PS-041 | Courbe unique | 1 | grep `cubic-bezier` | M |
| PS-042 | Aucun mouvement continu | 0 `animate-(pulse\|bounce\|ping\|spin)` hors indicateur de progression réelle | grep | M |
| PS-043 | Aucun agrandissement au survol écrit à la main. Le seul mouvement de survol du produit est le zoom souple (§2.8) | 0 `hover:(translate\|scale)` en classe utilitaire | grep | M |
| PS-044 | `prefers-reduced-motion` respecté | présent et testé | test navigateur | B |
| PS-045 | Toute surface sélectionnable porte le zoom souple, aucune n'est peinte en gris au survol | 0 `hover:bg-*` sur rangée de registre, entrée de menu, onglet, entrée de navigation | grep | M |

### 3.6 Couleur et accessibilité (L4)

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-050 | Contraste du texte principal | ≥ 4,5:1 | calcul automatisé | B |
| PS-051 | Contraste du texte secondaire et des libellés | ≥ 4,5:1 | calcul | B |
| PS-052 | Aucune information portée par la seule couleur | 0 | revue, test en niveaux de gris | B |
| PS-053 | Alerte : `si-amber` en fond, `si-amber-ink` en texte | 100 % | grep | M |
| PS-054 | Navigation complète au clavier, ordre de tabulation cohérent | 100 % | test clavier | B |
| PS-055 | Libellés ARIA sur tout contrôle sans texte visible | 100 % | audit automatisé | M |

### 3.7 Formulaires

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-060 | Libellé au dessus du champ, toujours visible | 100 % | revue | M |
| PS-061 | Aucun texte indicatif employé comme libellé | 0 | revue | M |
| PS-062 | Validation après la fin de la saisie du champ, jamais pendant la frappe | 100 % | test | M |
| PS-063 | Largeur du champ proportionnelle à la longueur attendue | 100 % | revue | m |
| PS-064 | Sauvegarde ou avertissement avant perte de saisie | 100 % | test | M |

### 3.8 Vitesse (L6)

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-070 | Retour visuel à un geste utilisateur | < 100 ms | mesure | B |
| PS-071 | INP au 75e centile | < 200 ms | mesure terrain | B |
| PS-072 | Premier rendu utile d'un écran interne | < 1 s | mesure | M |
| PS-073 | Toute opération de plus de 400 ms affiche un indicateur de progression | 100 % | revue | M |
| PS-074 | Aucun écran ne se recharge entièrement pour un changement local | 0 | revue | M |
| PS-075 | Mutations sûres en UI optimiste | listées et justifiées | revue | m |

### 3.9 Voix

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-080 | Vouvoiement partout | 100 % | grep de « tu », « ton », « ta » | M |
| PS-081 | Aucun tiret long en milieu de phrase | 0 | grep | M |
| PS-082 | Aucun emoji dans l'interface | 0 | grep unicode | M |
| PS-083 | Libellés concrets, aucun terme vague de gestion | 0 « gérer », « workflow », « plateforme », « optimiser » | grep | M |
| PS-084 | Le nom des choses correspond au vocabulaire du cabinet, pas à celui du schéma de base de données | 100 % | revue | M |

### 3.10 Système

| ID | Règle | Seuil | Vérification | Grav. |
|---|---|---|---|---|
| PS-090 | Aucun composant orphelin livré | 0 composant non monté | graphe d'imports | M |
| PS-091 | Aucune coquille concurrente | 1 seule structure de fenêtre | revue | B |
| PS-092 | Tout nouveau composant existe d'abord dans la page de spécimens | 100 % | revue | M |
| PS-093 | Aucun composant d'interface ne dépasse 400 lignes | ≤ 400 | comptage | m |

---

## §4 — Grille d'évaluation pondérée sur 100

Le poids reflète l'effet mesuré sur la perception de qualité, pas l'effort de mise en
œuvre. Les quatre premiers critères pèsent 46 points, ce qui est délibéré : ce sont
ceux que les preuves du §1 désignent comme décisifs.

| # | Critère | Poids | Définition | Justification | Mesure |
|---|---|---:|---|---|---|
| 1 | **Composition des chiffres** | 14 | Alignement, mono tabulaire, totaux, absence de troncature | Le produit est jugé sur la confiance comptable. C'est le seul critère où une faute unique est éliminatoire | PS-010 à PS-017, binaire par écran |
| 2 | **Hiérarchie visuelle** | 12 | Une intention par écran, quatre niveaux typographiques, contraste de rôle | Effet esthétique-utilisabilité, prototypicalité | PS-007, PS-020, test des 5 secondes |
| 3 | **Cohérence système** | 10 | Un seul jeu de jetons appliqué partout | La fluidité de traitement se construit par la répétition | PS-001 à PS-006, comptage automatisé |
| 4 | **Vitesse perçue** | 10 | Réponse au geste, premier rendu, absence de rechargement | Doherty, Nielsen, INP. Attribut premium le plus fiable | PS-070 à PS-075, mesure |
| 5 | **Densité d'information** | 7 | Information par écran sans densité de formes | Tuch 2012 : la complexité visuelle dégrade la première impression en 17 ms | ratio éléments décoratifs sur éléments porteurs |
| 6 | **États et retours** | 7 | Vide, chargement, erreur, succès, désactivé | Ces états sont vus plus souvent que l'écran plein | PS-030 à PS-036 |
| 7 | **Espacement et rythme** | 6 | Échelle base 4, rapport 1 pour 3 | Le rythme crée la lecture sans ajouter d'élément | PS-003, mesure au pixel |
| 8 | **Microcopie et voix** | 6 | Vocabulaire du cabinet, erreurs actionnables | Le nom des choses fait plus pour la qualité perçue que la palette | PS-080 à PS-084 |
| 9 | **Accessibilité** | 5 | Contraste, clavier, ARIA, mouvement réduit | Obligation, et proxy fiable du soin général | PS-050 à PS-055, audit automatisé |
| 10 | **Mouvement** | 4 | Trois durées, une courbe, rien de décoratif | Le mouvement gratuit est le tell le plus reconnaissable | PS-040 à PS-044 |
| 11 | **Formulaires** | 4 | Libellés, validation, perte de saisie | Baymard. Les écrans de saisie sont les plus fréquentés | PS-060 à PS-064 |
| 12 | **Navigation et architecture** | 4 | Profondeur, groupement, retour, fil d'Ariane | Le chunking, pas Miller | profondeur moyenne, clics jusqu'à la tâche |
| 13 | **Élévation et matière** | 3 | Deux niveaux, filets par défaut | Une ombre sur un élément fixe est un mensonge physique | PS-005 |
| 14 | **Couleur** | 3 | Un accent, trois statuts | Un écran à cinq verts n'a plus d'action principale | PS-002, PS-053 |
| 15 | **Composants et réutilisation** | 2 | Aucun composant à usage unique | La dette de composants devient dette visuelle | PS-092, PS-093 |
| 16 | **Impression et export** | 2 | Sortie papier composée, paginée, datée | Moment où un tiers juge le logiciel | revue du PDF |
| 17 | **Raccourcis et vitesse d'exécution** | 1 | Palette de commandes, raccourcis | Différenciation forte, effet sur les utilisatrices avancées | présence et couverture |
| 18 | **Mode sombre** | 0 | Hors barème tant que le clair n'est pas à 90 | Doubler la surface avant d'avoir unifié double la dette | sans objet |
| 19 | **Modernité** | 0 | Volontairement non noté | Un critère de mode ne se mesure pas et vieillit. Il est remplacé par 3, 4 et 10 | sans objet |

**Lecture du score.** Moins de 60 : l'interface trahit son amateurisme au premier
regard. 60 à 74 : correcte, oubliable. 75 à 89 : professionnelle, crédible sur un
appel de vente. 90 et plus : perçue comme premium par une utilisatrice qui ne sait pas
nommer pourquoi. **Toute enfreinte à une loi du §0 plafonne le score à 59, quel que
soit le total obtenu.**

---

## §5 — Ce que le design doit transmettre à un cabinet

Chaque valeur du métier se traduit en gestes de conception vérifiables. Rien ici n'est
métaphorique.

| Valeur | Traduction en interface |
|---|---|
| **Confiance** | Le solde en fidéicommis visible sans interaction. Le chiffre jamais approximé. La date et l'auteur de la dernière modification affichés. Aucune action irréversible sans confirmation nommée. |
| **Rigueur** | Un seul format de date, un seul format de montant, un seul vocabulaire. Les périodes verrouillées restent visibles en gris. Les journaux sont en ajout seul et le disent. |
| **Stabilité** | Aucun déplacement d'élément après chargement. Les positions ne changent pas d'un écran à l'autre. La barre d'outils est au même endroit partout. |
| **Sécurité** | Les états de permission sont explicites et non devinés. L'impersonnation laisse une trace visible à l'écran. La déconnexion est atteignable en deux gestes. |
| **Précision** | Chiffres tabulaires, alignement à la virgule, troncature avec accès à la valeur complète, aucune unité implicite. |
| **Rapidité** | Réponse sous 100 ms. Raccourcis clavier sur les gestes fréquents. Saisie du temps en moins de cinq secondes. |
| **Discrétion** | Aucune notification non sollicitée, aucun badge marketing, aucune animation d'accueil, aucun message de félicitations. |
| **Conformité** | La règle applicable est citée là où elle contraint, avec sa référence. La sortie imprimée est composée pour être remise à un tiers. |
| **Professionnalisme** | Zéro emoji, zéro illustration décorative, zéro exclamation. La voix reste posée y compris dans l'erreur. |

---

## §6 — Procédure d'audit exécutable

Une IA qui audite une interface SAFE applique cette procédure dans cet ordre. Elle ne
conclut pas sur du code qui n'est pas monté.

1. **Établir le périmètre vivant.** Partir des points d'entrée de la route (`page`,
   `layout`, `template`, `loading`, `error`), suivre le graphe d'imports, ne retenir un
   import que si le symbole est employé dans le corps du fichier. Tout ce qui n'est pas
   atteint est hors périmètre et signalé comme orphelin (PS-090).
2. **Passer les détecteurs statiques** du §3 sur ce périmètre, et rapporter par fichier
   et par route, jamais en total global.
3. **Rendre l'écran** et vérifier les règles qui ne se lisent pas dans le code :
   hiérarchie, densité, composition réelle avec des données longues, ordre de
   tabulation, contraste effectif.
4. **Mesurer la vitesse** : retour au geste, INP, premier rendu utile.
5. **Noter sur 100** avec la grille §4, et appliquer le plafonnement du §0.
6. **Rapporter** chaque écart avec : identifiant de règle, fichier et ligne, gravité,
   correction proposée, et coût estimé. Aucun écart sans emplacement précis.

**Interdits d'audit.** Ne pas compter d'occurrences sur du code mort. Ne pas conclure
sur des captures d'écran seules. Ne pas transformer une préférence esthétique en règle :
si l'écart ne rattache pas à une règle du §3, il n'est pas rapporté.

---

## §7 — Implémentation, dette technique et durée de vie

### 7.1 La chaîne, à sens unique

```
lib/ds/tokens.ts  →  variables CSS (globals.css)  →  tailwind.config.ts
                  →  primitives (components/ds-safe)  →  composants métier  →  écrans
```

Aucune flèche en sens inverse. Un écran ne définit jamais une valeur, il consomme un
jeton. Une primitive ne connaît pas le métier. Un composant métier ne connaît pas la
route.

### 7.2 Les garde-fous qui font tenir dix ans

- **Règle ESLint `no-raw-color`** qui refuse hexadécimales, familles Tailwind
  interdites, ombres hors composants déclarés, durées littérales. Liste d'exceptions
  explicite et commentée : logos de fournisseurs, gabarits imprimés, surfaces inversées.
- **Page de spécimens** sur une route protégée, affichant chaque primitive dans ses
  quatre états, l'échelle typographique, les motifs de tableau. Elle est le contrat
  visuel et le test de régression à l'œil.
- **Test de rendu sur les chiffres** : un cas avec montant à sept chiffres, un solde
  négatif, un zéro, un nom de partie de 60 caractères. Il attrape les régressions que
  la revue humaine laisse passer.
- **Compteur d'écarts** relancé à chaque fin de lot sur le périmètre vivant. Si le
  nombre n'a pas baissé, le lot n'est pas terminé, quelle que soit l'impression.
- **Budget de performance** en intégration continue : INP au 75e centile sous 200 ms,
  taille du paquet par route plafonnée.

### 7.3 Next.js, points d'attention concrets

- Les jetons sont exposés en variables CSS sur `:root`, et en `theme.extend` de
  Tailwind par lecture du même fichier TypeScript. Une seule définition compilée deux
  fois, jamais deux définitions.
- Les composants serveur portent la donnée, les composants client portent
  l'interaction. Un composant marqué `"use client"` sans état ni gestionnaire
  d'événement est une erreur d'architecture.
- Préchargement au survol sur les liens de liste, UI optimiste sur les mutations sûres,
  jamais sur une écriture comptable.
- Les états de chargement passent par les fichiers `loading.tsx` de route, avec des
  squelettes immobiles aux dimensions réelles.

---

## §8 — Manifeste SAFE

**SAFE est un instrument, pas une application.** Un instrument se juge à sa précision,
à sa constance et à la confiance qu'il inspire, jamais à son originalité.

1. **Nous concevons pour la personne qui ouvre SAFE pour la neuvième fois aujourd'hui**,
   pas pour celle qui le découvre dans une démonstration.
2. **Le chiffre passe avant l'esthétique**, et l'esthétique existe pour rendre le chiffre
   lisible.
3. **Nous retirons avant d'ajouter.** Une colonne enlevée donne plus d'air que huit
   pixels ajoutés partout.
4. **Le calme est une fonctionnalité.** Aucune urgence fabriquée, aucune félicitation,
   aucun badge, aucune pastille rouge qui ne corresponde pas à une obligation réelle.
5. **La vitesse est un choix de conception**, pas une optimisation de fin de projet.
6. **Nous ne demandons jamais deux fois la même information.** Chaque réglage demandé est
   l'aveu que le produit ne savait pas.
7. **La cohérence prime sur la nouveauté.** Réutiliser un motif existant est toujours
   préférable à en inventer un meilleur.
8. **Nous écrivons comme une adjointe expérimentée parle.** Vouvoiement, phrases courtes,
   noms exacts, aucune promesse.
9. **Ce qui est verrouillé reste visible.** Griser plutôt que masquer, expliquer plutôt
   que bloquer.
10. **Rien ne sort de SAFE qui ne puisse être remis à un inspecteur du Barreau.**

**Émotions recherchées** : maîtrise, sécurité, netteté, silence.
**Émotions à éviter** : excitation, urgence, surprise, amusement.

**Pour toute fonctionnalité nouvelle, dans cet ordre.** Quel geste réel elle remplace.
Quelle information elle exige et pourquoi elle ne peut pas la déduire. Quel écran
existant elle modifie plutôt que quel écran elle ajoute. Quels sont ses trois états.
Quel est son coût en millisecondes. Comment elle se comporte à l'impression.

---

## §9 — Checklist de livraison

Un seul « non » et l'écran n'est pas livrable.

**Le chiffre**
- [ ] Mono tabulaire, aligné à droite, en-tête aligné sur sa colonne
- [ ] Total distinct par un filet, sans fond coloré
- [ ] Testé avec sept chiffres, un négatif, un zéro
- [ ] Solde en fidéicommis visible sans interaction

**La structure**
- [ ] Une seule action principale, un seul bouton plein
- [ ] Rapport d'espacement d'au moins 1 pour 3
- [ ] Quatre niveaux typographiques au maximum
- [ ] Aucun paragraphe au delà de 65ch

**Les états**
- [ ] Vide, chargement, erreur dessinés
- [ ] Quatre états sur chaque contrôle, focus clavier jamais supprimé
- [ ] Chaque bouton désactivé porte une raison lisible
- [ ] Squelettes immobiles aux dimensions réelles

**La matière**
- [ ] Aucun dégradé, aucun flou, aucune ombre dans le flux
- [ ] Rayons différenciés, pilule réservée aux statuts et filtres
- [ ] Deux niveaux d'élévation au maximum

**Le mouvement**
- [ ] Trois durées, une courbe
- [ ] Aucun mouvement continu, aucun déplacement au survol
- [ ] `prefers-reduced-motion` testé

**La voix**
- [ ] Vouvoiement, aucun tiret long, aucun emoji
- [ ] Erreurs qui disent quoi faire ensuite
- [ ] Vocabulaire du cabinet, pas du schéma de données

**La vitesse**
- [ ] Retour au geste sous 100 ms
- [ ] Indicateur au delà de 400 ms
- [ ] Aucun rechargement complet pour un changement local

**Le système**
- [ ] Aucun jeton contourné
- [ ] Le composant existe dans la page de spécimens
- [ ] Aucun composant orphelin livré

---

## Sources

| Sujet | Référence |
|---|---|
| Première impression en 50 ms | Lindgaard et al., *Behaviour & Information Technology* 25(2), 2006 |
| Jugement en 17 ms, complexité et prototypicalité | Tuch et al., *IJHCS* 70(11), 2012 |
| Effet esthétique-utilisabilité | Kurosu et Kashimura 1995 ; Tractinsky 1997 ; Tractinsky, Katz, Ikar 2000 |
| Crédibilité et apparence, 46,1 % | Fogg et al., Stanford Web Credibility Project, 2002-2003 |
| Fluidité de traitement et plaisir esthétique | Reber, Schwarz, Winkielman, *PSPR* 8(4), 2004 |
| Règle du pic et de la fin | Kahneman, Fredrickson, Schreiber, Redelmeier, 1993 |
| Limites de temps de réponse | Nielsen 1993, d'après Miller 1968 et Card 1991 |
| Seuil de Doherty, 400 ms | Doherty et Thadani, IBM, 1982 |
| INP, seuil 200 ms au 75e centile | Core Web Vitals, web.dev, depuis mars 2024 |
| Capacité de la mémoire de travail | Miller 1956, précisé par Miller 1989 et Cowan 2001 |
| Formulaires, validation, libellés | Baymard Institute |
| Mouvement et accessibilité | WCAG 2.3.3, `prefers-reduced-motion` |
| Jetons de mouvement | Material Design 3, système de durées et de courbes |
| Architecture de la vitesse perçue | Linear, base locale et serveur comme cible de synchronisation |
| Vitesse comme positionnement | Superhuman, règle des 100 ms, cible interne 50 ms |
| Adoption en cabinet, 54 % de résistance | ILTA Technology Survey 2024 |

---

## Journal

| Date | Modification |
|---|---|
| 2026-07-30 | Création. Absorbe DOCTRINE_INTERFACE_INTERIEUR, ajoute le socle de preuves, les seuils mesurables, la grille pondérée, la procédure d'audit et le manifeste. |
