# La vitrine au téléphone

**2026-08-13** · décision CEO appliquée le jour même

Suite directe de [Une seule police sur la vitrine](2026-08-13_une_seule_police_sur_la_vitrine.md),
écrit quelques heures plus tôt. Celui-ci traite du même site, vu sur 375 px.

## Ce qui a été observé

Relevé au style calculé sur un écran de 375 × 812, pas à l'œil.

- **L'accueil demandait 15,2 écrans de défilement**, soit 12 367 px, pour une
  page d'accueil.
- **Le chapitre « Fiable » restait animé au pouce.** Le script le posait à son
  état final, la feuille de style gardait ses arguments à opacité nulle : le
  chapitre s'affichait à moitié effacé, avec des chiffres fantômes et près de
  200 px de vide entre les blocs.
- **Trois familles de polices cohabitaient** sur l'accueil : 99 éléments en
  Geist Sans, 76 en Geist Mono, 61 en Instrument Serif.
- **Douze sélecteurs descendaient sous 11 px**, jusqu'à 9 px.
- **L'application navigable de la première vue était rendue à 0,33 d'échelle.**
  Composée sur 1000 px de large puis ramenée à la largeur du téléphone, ses
  libellés faisaient entre 2,7 et 7 px à l'écran. C'était la première chose que
  rencontrait un prospect venu d'un lien.
- **« À propos » débordait de 43 px** hors de l'écran, par son sommaire de cinq
  jalons passé à l'horizontale.
- **Deux écrans de démonstration sur trois étaient invisibles** dans « Simple »,
  tout en occupant 536 px. Même chose, en pire, dans « Complet ».

## Ce qui est décidé

**Le téléphone suit exactement le chemin « mouvement réduit ».** Ce chemin
existait déjà, complet et éprouvé, pour les personnes qui désactivent les
animations. Une seule constante commande maintenant les deux cas, dans le script
comme dans la feuille de style. Une animation ajoutée plus tard sera coupée au
téléphone sans qu'on ait à y penser.

**Deux voix au lieu de trois, sous 860 px seulement.** Instrument Serif porte le
discours, Geist Sans fait l'interface. Le mono se replie sur le sans.

Cette règle restreint, au téléphone uniquement, la phrase du journal précédent :
« les chiffres restent en mono partout ». Ce que le mono protégeait réellement,
c'est l'alignement des montants, et il est repris par
`font-variant-numeric: tabular-nums` posé à la racine. La loi L1 tient, elle est
obtenue autrement. Sur ordinateur, rien ne change.

**Une seule échelle typographique**, sept variables, plancher à 11 px. Les
tailles vivaient chapitre par chapitre : le titre de « Fiable » ne valait pas
celui de « Complet » sans qu'aucune règle ne l'ait décidé.

**Ce qui s'adressait à une souris disparaît.** Le canevas d'assemblage du hero et
les fragments du logo des pages intérieures étaient brassés par le curseur :
c'était tout leur propos, et il n'y a pas de curseur au doigt. La bande de
preuves cesse de défiler en boucle et passe simplement à la ligne.

**Une preuve qu'on ne peut pas lire n'est plus une preuve.** L'application de la
première vue est retirée au téléphone. Les écrans des trois chapitres, eux, se
composent à la largeur réelle et restent lisibles : la démonstration n'est pas
perdue, elle est déplacée là où elle tient.

## Ce qu'on a appris au passage

**Deux serveurs de développement sur le même dépôt corrompent `.next`.** Les deux
répondaient 500 au démarrage de la session. Le script `dev` du projet libère
déjà le port 3001 ; c'est une bonne raison de ne jamais en lancer un second à la
main sur un autre port.

**Un accent grave dans un commentaire ferme le gabarit littéral.** La feuille de
style de l'accueil vit dans un `const CSS = ...` de 2 300 lignes. Deux fois dans
la session, un mot mis entre accents graves dans un commentaire a tronqué la CSS
servie, la seconde fois à 83 830 caractères sur 86 000, silencieusement : le
typage passait, la page se chargeait, et seules les dernières règles manquaient.
Dans ce fichier, citer un nom de classe avec des guillemets français.

## Vérification

Mesuré page par page à 375 × 812, puis à 320 × 568, transitions en vol terminées
de force. Build de production vert.

| Page | Avant | Après |
|---|---|---|
| Accueil | 15,2 écrans · 12 367 px | **9,3 écrans · 7 547 px** |
| À propos | 43 px hors écran | **0 débordement** · 3 950 px |
| Fonctionnalités | 3 familles de polices | **2 familles** · 8 437 px |
| Tarification | 9,5 écrans | **7,0 écrans** · 5 689 px |
| Questions | — | 3,3 écrans · 2 712 px |
| Démo et contact | — | 3,0 écrans · 2 396 px |
| Diagnostic gratuit | 10,9 écrans · 3 familles | **5,9 écrans · 2 familles** |

Sur les sept pages : zéro défilement horizontal, zéro élément invisible occupant
de la place, zéro texte sous 11 px hors du mot « SAFE » du logo, qui relève de la
charte.

Sur ordinateur, l'accueil garde ses 20,6 écrans, son assemblage au curseur, ses
scènes épinglées et ses trois familles de polices. Rien n'a bougé.
