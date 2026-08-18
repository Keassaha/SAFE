# 2026-08-18 — L'écran qui rend le lot 1 réel

## Le trou était plus large que prévu

En cherchant le formulaire d'édition d'une dépense pour y ajouter les champs de taxe,
constat : `editCabinetExpense` n'est appelé depuis **aucun** écran, et `CabinetExpense`
n'est **jamais listée**, seulement agrégée pour les KPI.

Il n'existait donc aucune page où voir ses dépenses, encore moins en corriger une. Le
manque n'était pas trois champs, c'était l'écran entier.

## Une intention : une liste qui se vide

Écran construit autour d'une seule action (§0 M2) : **confirmer la taxe des dépenses où
elle n'est qu'estimée**. C'est la contrepartie visible de la règle du lot 1 : tant qu'une
ligne est là, l'argent qu'elle porte n'est pas récupérable et le cabinet remet trop.

Le montant total en jeu est affiché à côté du compte. Ce n'est pas une décoration : c'est
ce qui justifie d'ouvrir la liste plutôt que de la refermer.

Tri du plus **ancien** au plus récent : on remonte une dette, on ne feuillette pas.

## Une question, pas un formulaire

Deux champs de taxe posés à nu obligeraient le cabinet à deviner ce qu'on attend de lui.
La modale pose donc la seule question qui compte, « que montre votre pièce ? », et
n'ouvre les champs que sur la réponse qui les demande (divulgation progressive, §5 H1).

Trois sorties, dont une qui manquait au moteur :

- **« Elle montre un montant »** : la taxe devient déclarée, donc réclamable.
- **« Elle ne porte aucune taxe »** : a exigé d'ajouter `declaredSansTaxe` au moteur. Sans
  ce signal, un zéro saisi est indiscernable d'un champ vide, l'estimation repartirait, et
  la ligne reviendrait indéfiniment. La liste ne se viderait jamais.
- **« Je n'ai pas la pièce »** : ne modifie rien et referme. Sans cette sortie, une dépense
  sans reçu resterait bloquée et rendrait la liste inutilisable.

## Placement

La section est **après** la boucle d'import et de validation, pas avant. Importer et
valider est le geste de tous les jours ; confirmer les taxes est une dette qu'on vient
solder. Mettre la dette en tête volerait la place du geste fréquent.

## Checklist anti-slop §10

- **A14** grille pleine : évitée, filets horizontaux seuls via la grammaire `registre`.
- **A15** colonnes à largeur égale : évitée, la colonne Dépense porte 40 %, les
  métadonnées sont comprimées.
- **A11** tout visible : une seule action par ligne, pas de barre d'actions.
- **A8** gris sur gris : jetons `si-ink` / `si-muted`, la taxe estimée est atténuée parce
  qu'elle sert à reconnaître le reçu, pas à faire nombre.
- **A6** icônes décoratives : aucune. Rien n'en avait besoin.
- **A7** texte vague : la phrase d'explication dit ce qui se passe si on n'agit pas.
- **A12** gros bloc explicatif : deux phrases, au moment utile.
- **A13** ne s'applique pas : ce sont des dates comptables, l'absolu est correct ici.
- **Voix** : « vous », aucun tiret long en milieu de phrase.

## Vérifié

Section rendue avec de vraies données sur le cabinet test : trois dépenses, colonnes
justes, tri du plus ancien au plus récent, montants et taxes estimées exacts, un bouton
par ligne. Contrôlé par l'arbre d'accessibilité.

1526 tests au vert, `tsc` propre, lint sans alerte, parité i18n à 3742 clés.

## Non vérifié, et pourquoi

**L'ouverture de la modale n'a pas pu être exercée à l'écran.** La fenêtre Chrome rapporte
un viewport de 0x0, les captures échouent avec une erreur de l'extension, et un clic ne
peut pas atteindre React sans disposition. Ce n'est pas un défaut du code : le rendu de la
section, lui, est confirmé.

Les deux issues de la modale sont couvertes au niveau du moteur, qui est ce que le bouton
déclenche. Reste à ouvrir la modale une fois à la main.
