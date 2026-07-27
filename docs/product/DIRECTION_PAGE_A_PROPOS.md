# Page À propos — trois directions possibles

> Document de décision. Statut : proposition, aucune n'est construite.
> Date : 2026-07-25. Contexte : la version actuelle (défilé cinématique épinglé,
> 1600vh, triangles du logo, classeur Excel, assemblage) ne convainc pas. On repart
> de la question de fond avant de recoder quoi que ce soit.

---

## Ce qui ne va pas dans la version actuelle

Il faut le nommer avant de proposer autre chose, sinon on refait la même erreur
autrement.

1. **Le défilement est confisqué.** Sur 1600vh, le visiteur ne contrôle plus sa
   lecture : il actionne une bande-annonce. Un avocat qui veut savoir qui vous êtes
   n'a pas signé pour un manège.
2. **L'animation raconte plus que le texte.** On a mis l'effort dans le mouvement des
   triangles alors que l'histoire, elle, tient en dix lignes fortes.
3. **La preuve est absente.** La page parle d'un classeur Excel et d'un logiciel, mais
   ne montre ni l'un ni l'autre. On illustre par des formes abstraites ce qu'on
   pourrait prouver par des artefacts réels.
4. **Elle ne ressemble à aucune autre page du site.** Le reste du site est éditorial et
   posé. Cette page est un objet à part, ce qui la fait paraître décorative.

Le point commun des trois directions ci-dessous : **le visiteur garde le contrôle du
défilement**, et la crédibilité vient de ce qu'on montre, pas de ce qui bouge.

---

## Direction A — « La lettre du fondateur »

**Principe.** La page est un texte signé. Pas une expérience, un document. On assume
que la meilleure façon de raconter une histoire honnête est de l'écrire.

**Structure**

1. Une photo pleine largeur en ouverture, format cinéma (21:9), recadrée haut du
   corps. Rien d'autre. Le nom et la fonction en surimpression basse.
2. Le titre en serif, très grand, aligné à gauche : « Comment SAFE est né. »
3. Le récit en colonne de lecture (65 caractères), typographie généreuse (18px,
   interligne 1,75). Sept à neuf paragraphes.
4. Trois respirations dans le texte, sous forme de **phrases mises en exergue** en
   grand serif, pleine largeur : « Une facture demandait trente minutes. »,
   « QuickBooks était trop générique pour un cabinet. », « SAFE a commencé dans un
   classeur Excel. »
5. Deux artefacts intercalés au bon moment du récit : une capture du classeur Excel
   d'origine (anonymisée) quand on en parle, une capture de SAFE aujourd'hui quand on
   arrive à la fin.
6. Signature manuscrite ou nom en italique, date, et un lien discret vers le
   diagnostic.

**Mouvement.** Presque rien. Les paragraphes apparaissent à l'approche, les exergues
avec un léger décalage. Aucun épinglage, aucun canvas.

**Pourquoi ça marche.** C'est le format que les fondateurs crédibles utilisent quand
ils ont quelque chose de vrai à dire. Le calme est le message : vous n'avez pas besoin
d'effets pour raconter votre histoire.

**Risque.** Si le texte est faible, il n'y a rien pour se rattraper. Cette direction
exige un excellent copywriting, et l'accepte comme contrainte.

**Effort.** Faible côté code. L'essentiel du travail est l'écriture et les deux
artefacts.

---

## Direction B — « La ligne du temps, prouvée »

**Principe.** L'histoire de SAFE est une chronologie. On la présente comme telle, et
chaque étape est accompagnée de la pièce à conviction correspondante.

**Structure**

Une colonne de repères à gauche (filet vertical fin, dates), le contenu à droite.
Défilement normal. Chaque étape est une rangée :

| Repère | Titre | Preuve montrée |
|---|---|---|
| Le point de départ | Un cabinet, un système qui ne suit plus | Photo du fondateur |
| Le constat | Trente minutes pour une facture | Un chiffre, énorme, seul |
| La première réponse | QuickBooks en ligne | Capture d'écran QuickBooks, avec une annotation « trop générique pour un dossier juridique » |
| Le refus | Trop générique, trop compliqué | Texte seul, court |
| Le vrai début | Un classeur Excel | **Capture du classeur d'origine** |
| Le basculement | Le classeur devient un logiciel | Deux captures côte à côte : Excel → premier écran SAFE |
| Aujourd'hui | Un logiciel web utilisé dans un vrai cabinet | Capture réelle du tableau de bord |

**Mouvement.** Le filet vertical se remplit en vert à mesure qu'on descend (indicateur
de progression honnête). Chaque preuve entre avec un léger décalage. La transition
Excel → SAFE est la seule animation travaillée : les deux captures se croisent.

**Pourquoi ça marche.** C'est cohérent avec la doctrine « preuve visuelle avant tout ».
Un avocat comprend une chronologie sourcée mieux qu'une métaphore. Et cette page
devient réutilisable : elle sert de trame à une vidéo de trois minutes.

**Risque.** Il faut de vraies captures. Si le classeur Excel d'origine n'existe plus,
il faut le reconstituer honnêtement et le dire.

**Effort.** Moyen. Le code est simple ; le travail est de rassembler les artefacts.

---

## Direction C — « Avant / après, tenu de bout en bout »

**Principe.** Toute la page est bâtie sur un seul contraste, celui qui a fait naître
SAFE : ce que le travail coûtait avant, ce qu'il coûte maintenant. L'histoire est
racontée entre les comparaisons.

**Structure**

1. Ouverture : un écran scindé en deux, immobile. À gauche « Avant », à droite
   « Aujourd'hui ». Une seule ligne de titre au-dessus.
2. Trois comparaisons successives, chacune sur un plein écran, mais **au défilement
   normal** :
   - Une facture : 30 minutes de recoupement → préparée à partir du travail déjà saisi
   - Le fidéicommis : vérifié à la main, tard → l'écart apparaît avant l'inspection
   - Les dossiers : éclatés dans des fichiers → un contexte unique
3. Entre chaque comparaison, un fragment du récit, court, à gauche : d'où venait ce
   problème, ce que vous avez essayé, pourquoi vous avez bâti autre chose.
4. Fermeture : le récit complet, en un bloc lisible, avec la photo et la signature.

**Mouvement.** Un curseur horizontal facultatif sur chaque comparaison (on le pousse
pour révéler l'après). Interaction volontaire, pas subie.

**Pourquoi ça marche.** C'est la page « À propos » qui vend le plus, sans jamais
vendre : elle explique qui vous êtes par ce que vous avez corrigé. Elle est aussi la
plus facile à comprendre en dix secondes.

**Risque.** Le « avant/après » est un format connu. Il faut de la retenue pour qu'il ne
tourne pas au publireportage. La règle du ton posé s'applique : on ne noircit pas
l'avant, on le décrit.

**Effort.** Moyen. Un composant de comparaison réutilisable, ensuite déclinable sur la
page Fonctionnalités.

---

## Recommandation

**Direction B, avec l'ouverture de la direction A.**

C'est-à-dire : une photo pleine largeur et un titre en ouverture (le calme et le
visage, on sait tout de suite chez qui on est), puis la chronologie prouvée. On garde
le meilleur des deux : la crédibilité d'un document signé, et la démonstration par les
artefacts.

Raisons :

- Elle applique la doctrine maison « on ne décrit pas que ça fonctionne, on le montre ».
- Elle rend le défilement au visiteur, ce qui est la principale critique de la version
  actuelle.
- Elle produit un sous-produit utile : la trame exacte d'une vidéo de démonstration et
  d'une série de publications build-in-public.

La direction C reste la meilleure candidate si vous voulez plus tard une page qui
convertit, mais sa place naturelle est plutôt la page Fonctionnalités.

---

## Ce qu'il faut de vous pour lancer

1. **La photo**, en fichier, déposée dans `public/images/fondateur/portrait.jpg`. La
   page est déjà branchée sur ce chemin et se replie proprement tant qu'il est vide.
   Les images collées dans la conversation ne me parviennent pas comme fichiers.
2. **Le choix de la direction** (A, B, C, ou le mélange recommandé).
3. Pour la direction B : dites-moi si le **classeur Excel d'origine** existe encore.
   Sinon, on le reconstitue et on l'indique honnêtement en légende.

---

## Ce qui est déjà démonté

La version cinématique actuelle reste dans le dépôt le temps de la décision. Dès que
vous tranchez, on remplace `components/public-site/AboutPage.tsx` et on retire le code
du défilé épinglé, du canvas et des indicateurs devenus inutiles.
