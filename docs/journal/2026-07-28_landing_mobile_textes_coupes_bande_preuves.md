# 2026-07-28 — Landing au téléphone : textes rognés et bande de preuves déroulante

## Ce qui a été observé (mesuré, pas supposé)

Dev server à 375×812 et 375×667, mesures DOM sur `components/public-site/ExperienceCinema.tsx`.

1. **Maquette navigable coupée.** Les écrans de `#demo` sont superposés en absolu avec
   `overflow-y: auto` dans une scène de 560 px. Au téléphone, la fiche cliente fait
   979 px : 419 px de contenu étaient enfermés derrière un défilement interne invisible.
   La fiche s'arrêtait en plein milieu de « Activité récente ».

2. **Scènes cinématiques tranchées.** Chaque scène est épinglée sur un écran de haut
   (`100svh`, `overflow: hidden`). Débordement mesuré :

   | Scène | 375×812 | 375×667 |
   |---|---|---|
   | Vérifier | 0 | 8 px |
   | Encaisser | 119 px | 254 px |
   | Collaborer | 0 | 114 px |

   Le dernier paragraphe (« Moins de ressaisie… ») passait sous le pli sans moyen d'y accéder.

3. **Cachet « Payée » rogné.** Incliné, sa boîte dépassait le bas de la carte facture.

## Ce qui a été fait

- **Maquette** : au téléphone, les écrans reviennent dans le flux (`position: static`,
  `display: none` / `block` selon l'écran actif). La scène prend la hauteur de son contenu.
  Au large, rien ne change : superposition en absolu et fondu conservés.
- **Scènes** : passe de densité sous 860 px (interlignes, titres, marges, carte facture)
  plus un second palier sous 740 px de haut pour les écrans courts. Résultat : zéro
  débordement aux deux hauteurs testées.
- **Cachet** : remonté dans la bande réservée sous le total.
- **Bande de preuves** : au téléphone, les quatre preuves ne se tassent plus sur deux
  rangs. Elles défilent en boucle continue (deux pistes, la copie muette prend le relais),
  avec un fondu aux deux bords. Au large, la ligne répartie d'origine est intacte.
  Mouvement réduit respecté : le défilement s'arrête et la bande se parcourt au doigt.

## Décision derrière

Le choix était : dépunaiser les scènes au téléphone (elles défileraient normalement, les
cinématiques disparaîtraient) ou resserrer pour que tout tienne dans un écran. Resserrer,
parce que les cinématiques sont la preuve visuelle du produit et que c'est ce qui distingue
la landing. Le prix : au téléphone la typographie est plus dense qu'au large.

## À surveiller

Si du texte est ajouté dans une scène épinglée, le budget de hauteur au téléphone est
serré. Vérifier `pin.scrollHeight - pin.offsetHeight === 0` à 375×667 avant de considérer
la scène terminée.
