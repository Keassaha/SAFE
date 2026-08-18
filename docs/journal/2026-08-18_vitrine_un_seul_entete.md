# Un seul en-tête pour toute la vitrine

> 18 août 2026. Décision du CEO : « garde celui d'audit-gratuit et propage-le. »
> Suite de [2026-08-18_vitrine_telephone_les_arguments_se_tiennent.md](2026-08-18_vitrine_telephone_les_arguments_se_tiennent.md).

## Trois grammaires pour une seule fonction

| | Accueil | Pages partagées | Diagnostic gratuit |
|---|---|---|---|
| Forme | pastille flottante | pastille de verre | barre pleine largeur |
| Retrait | `3vw`, flotte | `12 px`, flotte | touche les bords |
| Séparation | ombre portée | ombre portée | filet |
| Coins | 12 px | 12 px | aucun |
| Bouton de menu | trois traits nus | glyphe ☰ | encadré |
| Action au téléphone | rangée dans le menu | rangée dans le menu | **visible** |
| Panneau | pleine largeur | pleine largeur | 240 px à droite |

La barre du diagnostic est retenue parce qu'elle est la seule à montrer une
action. Sur un téléphone, la prochaine étape doit rester à portée de pouce
sans qu'on ouvre quoi que ce soit.

## Ce qui a bougé

**Le composant partagé** (`shared.tsx`) prend la barre du diagnostic. Il
accepte une action : par défaut « Faire le diagnostic » vers `/audit-gratuit`,
et une page qui a sa propre prochaine étape passe son ancre. Six pages en
héritent.

**Le diagnostic gratuit** cesse d'avoir sa copie locale et consomme le
composant partagé, avec `#section-depart` en action. La barre de référence
devient la barre de tout le monde, y compris la sienne.

**L'accueil** garde sa barre en CSS, restylée sur la même forme : `top: 0`,
60 px, filet en bas, plus de coins ni d'ombre, bouton de menu encadré, action
visible au téléphone. Son panneau passe de la pleine largeur au menu de 240 px
ancré à droite, et perd son bouton d'action devenu redondant avec la barre.

Vérifié à 1280 : les deux barres rendent identiquement, `top 0`, `60 px`,
`border-radius 0`, blanc à 0,92, filet de 1 px, logo à 44 px, liens visibles,
bouton de menu masqué.

## Deux détails hérités, corrigés au passage

- **Le voile.** La barre du diagnostic n'en avait pas : le menu ne se fermait
  pas en touchant ailleurs. Le composant partagé en pose un, comme le faisait
  l'ancienne barre des pages partagées.
- **Le retrait.** Les pages partagées alignent barre et contenu à 24 px,
  l'accueil à 20 px, parce que sa colonne vaut 20. Chaque barre suit le
  retrait de sa page plutôt qu'une valeur écrite en dur.

## Une conséquence à surveiller

En haut de l'accueil, l'action de la barre et le bouton du hero portent le
même libellé, à 40 px l'un de l'autre. C'est la contrepartie directe du choix :
une action toujours visible dans la barre croise forcément l'action de la
première vue. Cela se résout dès le premier défilement, mais si la répétition
gêne, la barre de l'accueil peut prendre un libellé court comme celle du
diagnostic.

## Vérifié

Les huit pages publiques servent la même barre, contrôlé sur le HTML rendu par
le serveur et non sur le DOM du navigateur. `tsc` propre, 1605 tests au vert,
aucun débordement horizontal à 375 px.
