# La page « À propos » raconte enfin comment SAFE est né

> 13 août 2026. Script verrouillé fourni par le CEO, à reproduire mot pour mot.
> L'ancienne page est remplacée en entier.

## La contrainte, et comment elle a été tenue

Le texte est verrouillé : aucune phrase résumée, réécrite, fusionnée ou
déplacée. Les seules libertés prises sont celles que le script autorise :
découper une phrase en fragments visuels sans toucher ses mots, répartir les
paragraphes sur plusieurs temps de défilement, ajouter les numéros 01 à 05 et
l'exergue « À propos de SAFE ».

**Validation exécutée dans le navigateur**, pas à l'œil : le texte rendu est
extrait dans l'ordre du DOM, normalisé sur les espaces, puis comparé au script
attendu bloc par bloc.

| Contrôle | Résultat |
|---|---|
| Blocs attendus | 43 |
| Blocs rendus | 43 |
| Écarts | **0** |

Apostrophes droites et guillemets français conservés tels quels, y compris dans
« un autre logiciel juridique ».

## La mécanique

Un chapitre arrive en grand, ses paragraphes se révèlent dans l'ordre exact du
script, puis son titre se réduit pendant que le suivant arrive. Rien de ce qui
a été raconté ne disparaît : la page reste un article complet.

Mesuré aux cinq chapitres, sur un écran de 860 px :

| Position | Titres réduits | Trace | Jalons inscrits |
|---|---|---|---|
| Départ | aucun (34,6 px) | 1 | 1 |
| Chapitre 2 | 01 à 19 px | 2 | 2 |
| Chapitre 3 | 01, 02 | 3 | 3 |
| Chapitre 4 | 01, 02, 03 | 4 | 4 |
| Chapitre 5 | 01, 02, 03, 04 | 5 | 5 |

La réduction agit sur la taille du texte, jamais sur une mise à l'échelle.

**Aucun saut de mise en page.** La hauteur de chaque zone de titre est figée au
montage, à la taille de lecture, avant toute réduction. Sans cela, réduire un
titre déjà lu ferait remonter tout ce qui le suit sous les yeux du lecteur.
Vérifié : 101 px avant et après réduction.

Un chapitre atteint reste acquis. Remonter pour relire ne le remet pas en
grand, et n'efface pas son numéro dans la marge.

## La marge, et sa trace

Filet vertical, numéros atteints, titres inscrits à mesure. Aucune
illustration. La trace est un SVG de 58 px qui gagne un état par chapitre, sans
jamais remplacer le précédent : une cellule, puis la grille, puis ce qui la
relie, puis les modules, puis le cadre qui les tient ensemble.

## Vérifications

- **Sans script** : 0 passage invisible sur 45, tous les titres à leur taille
  de lecture. La page n'a jamais eu besoin de JavaScript pour exister.
- **Sans mouvement** : même résultat, vérifié en injectant les règles du media
  query dans le bon ordre de cascade. Le premier test était faux, il plaçait la
  feuille avant celle du composant.
- **320 px** : aucun débordement horizontal. La marge passe à l'horizontale
  au-dessus du récit ; en colonne étroite, une colonne de service à gauche
  volerait la largeur de lecture.
- **Contrastes** : de 5,61 à 17,4 sur le fond de la page. Tout passe AA.
- `tsc` et `eslint` sans erreur.

## Corrections après première revue du CEO

### La police du site, et une règle qui bat l'héritage

Première version : toute la prose en Instrument Serif. Erreur de lecture de ma
part. **Geist est la police principale du site** (navigation, corps, interface)
et la serif ne sert qu'aux titres et aux moments éditoriaux. La page suit
maintenant cette répartition :

| Rôle | Famille |
|---|---|
| Titre de page, titres de chapitre | Instrument Serif |
| Phrases fortes, citation, les six domaines | Instrument Serif |
| Corps, constats, sommaire, bouton | Geist Sans |
| Étiquettes et numéros | Geist Mono |

Piège rencontré : le titre principal retombait sur Geist alors que le conteneur
déclarait la serif. **Une règle globale du site cible les titres, et une règle
qui cible l'élément l'emporte toujours sur l'héritage du parent**, quelle que
soit la spécificité de ce parent. La famille est donc déclarée explicitement
sur les titres.

### Cinq tailles au lieu de douze

La première version comptait douze tailles distinctes, ce qui se lit comme un
empilement de décisions. L'échelle est déclarée en un endroit et se lit dans le
code :

| Jeton | Rôle |
|---|---|
| `--ap-t1` | titre de la page |
| `--ap-t2` | titre du chapitre en cours |
| `--ap-t3` | accents : phrases fortes, citation, domaines |
| `--ap-t4` | corps, constats, **et titre de chapitre une fois lu** |
| `--ap-t5` | marge : sommaire et légende |

Un titre déjà lu retombe au corps du texte : son encre suffit à le distinguer,
il n'a pas besoin d'un palier intermédiaire à lui.

### Les tirets

Les constats portaient un filet horizontal, qui se lit comme une rature. Ils
prennent le chevron de la marque, celui qui sert déjà de puce sur la page
Fonctionnalités. Une puce du site plutôt qu'un signe inventé pour cette page.

### La marge a maintenant un sens

Elle ne disait pas ce qu'elle était : un dessin muet au-dessus d'une liste de
titres. Deux fonctions déclarées désormais.

**La trace est légendée.** Un dessin qui passe d'une cellule à un système ne
démontre rien tant que personne ne l'a nommé : « Une cellule », « Une grille »,
« Des liens », « Des modules », « Un système ». La légende décrit le dessin,
elle n'ajoute aucune affirmation sur le produit.

**Le sommaire est navigable.** Les cinq jalons pointent vers leur chapitre. Sur
une page longue, un registre qui sait où sont les chapitres doit permettre d'y
aller. La marge n'est donc plus masquée aux lecteurs d'écran.

### Le portrait revient

Il arrive au chapitre 05, là où le récit passe à la première personne, en
168 x 210 px sur ordinateur. **Aucune légende ajoutée** : ce sont les deux
phrases du script, « Je suis Jérémie Tiahou. » et celle sur la formation, qui
tiennent ce rôle à leur place et dans leur ordre. Servi par `next/image`. En
colonne étroite, il passe au-dessus de ses deux phrases.

Script revalidé après ces changements : **43 blocs, 0 écart.**

## Ce qui a disparu

L'ancienne page portait un portrait du fondateur, une capture du classeur Excel
d'origine et deux maquettes produit. Le script demande de ne pas reprendre
l'ancien contenu : ces éléments ne sont plus référencés. Les fichiers restent
sur disque (`/images/fondateur/portrait.jpg`,
`/experience-assets/excel-avant.jpg`) si le CEO veut les réintroduire.
