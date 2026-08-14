# Un seul corps par point, et un mouvement plus lent

**2026-08-13** · décision CEO appliquée le jour même

## Ce qui pesait

Deux choses, mesurées avant de toucher au code.

**Le morphing.** Dans les trois piliers, un point arrivait en grand (jusqu'à
40 px), puis rétrécissait en ligne de liste (22 px) pendant que le suivant
prenait sa place. Chacun portait en plus une sous-ligne, elle-même à deux
tailles selon l'état. Un chapitre faisait donc coexister quatre corps de texte
et en animait deux. « Complet » allait plus loin : il portait deux textes
DIFFÉRENTS pour un même point, un grand message et un libellé avec sa
justification, et basculait de l'un à l'autre en rétrécissant.

**La courbe, et surtout ce qu'elle animait.** L'apparition utilisait
`cubic-bezier(0.16, 1, 0.3, 1)`, une sortie exponentielle dont la vitesse de
départ vaut plusieurs fois la vitesse moyenne : chaque bloc partait d'un coup
avant de traîner sur sa fin. Elle animait `max-height`, `grid-template-columns`,
`column-gap`, `padding` et `font-size`, cinq propriétés qui forcent un recalcul
de mise en page à chaque image. La saccade venait au moins autant de là que de
la courbe.

## Ce qui est décidé

**Un point = un corps, une phrase.** Les neuf points des trois piliers
partagent une seule règle CSS et une seule taille, qui ne change jamais. Les
sous-lignes sont retirées. Ce qui distingue le point en cours de ceux déjà lus
est l'encre, pas la taille.

**Rien d'autre que l'opacité, la translation et la couleur n'est animé.** La
liste occupe sa place dès le départ : rien ne se déplie, donc rien ne pousse la
colonne pendant qu'on la lit.

**Une courbe unique, `cubic-bezier(0.33, 0.06, 0.2, 1)`,** déclarée en un seul
endroit par surface : `--doux` dans la vitrine animée, `EASE` dans les pages
qui utilisent framer-motion. Elle accélère et ralentit sans à-coup.

**Plus long sur moins de distance.** Les courses passent de 450 à 780 ms, mais
les déplacements tombent de 14 à 10 px, la montée sous masque de 105 % à 55 %
de la hauteur du texte, et l'agrandissement du marqueur de chapitre
(1,06 vers 1) disparaît : un mot de cinquante pixels qui change de taille
pendant sa course est exactement la charge qu'on retire.

## Texte retiré

Rien n'a été réécrit ailleurs que dans les points. Trois retraits assumés :

- **Simple** : les trois justifications sous les points, par exemple
  « Comprenez votre cabinet sans naviguer entre débits, crédits et jargon
  comptable. » La phrase du point le dit déjà.
- **Fiable** : aucun mot perdu. Les deux fragments de chaque argument sont
  réunis en une phrase.
- **Complet** : les libellés et justifications de la forme rangée
  (« Une ouverture adaptée », « Le bon cartable et les bonnes informations dès
  le départ. », et les deux équivalents). Le grand message est conservé, seul :
  c'est lui qui raconte le parcours. Si la formulation rangée était préférée,
  c'est l'autre moitié qu'il faut garder, pas les deux.

## Vérification

Sur la page rendue : neuf points, une seule taille calculée, zéro sous-ligne,
`transition-property` réduite à `opacity, transform`. La machine d'état passe
de `avant`/`range` à `vu`/`actif` et se pose correctement à chaque temps. Les
trois colonnes tiennent dans une vue de 620 px de haut, la plus courte visée
(« Complet », le chapitre le plus chargé : 584 px). Les six pages publiques
compilent.
