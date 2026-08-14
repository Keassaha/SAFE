# Une seule police sur la vitrine

**2026-08-13** · décision CEO appliquée le jour même

## Ce qui a été observé

Le titre d'accueil est en Instrument Serif depuis le début. Le reste ne l'était
qu'à moitié. Relevé au style calculé sur `safecabinet.ca`, pas à l'œil :

- le chapeau du hero, juste sous le grand titre, était en Geist ;
- dans les trois piliers, « Simple » et « Fiable » portaient leurs
  justifications en serif, « Complet » les portait en Geist ;
- la synthèse, les forfaits, les réponses aux questions et le pied de récit :
  Geist ;
- la page « À propos » alternait titres en serif et prose en Geist, paragraphe
  après paragraphe. Un commentaire du fichier justifiait même l'inverse de ce
  qui est décidé aujourd'hui.

La page changeait donc de voix d'une ligne à l'autre, sans qu'aucune règle ne
le décide.

## Ce qui est décidé

Tout ce qui relève du **discours** porte Instrument Serif, sur l'ensemble du
site public : accueil, fonctionnalités, tarification, questions, contact,
à propos.

Deux registres gardent Geist, et c'est la frontière :

1. **L'interface du site.** Navigation, boutons, champs de formulaire, pied de
   page. Une action n'est pas une phrase. `SAFE_PREMIUM_DESIGN_STANDARD` §2.3
   l'écrit déjà : jamais de serif dans un bouton.
2. **Les maquettes de l'application.** Elles montrent SAFE tel qu'il est, donc
   elles suivent la typographie du produit : Geist pour les libellés, mono pour
   les chiffres, serif réservée au seul titre d'écran. Les passer en serif
   reviendrait à montrer un produit qui n'existe pas.

Les chiffres restent en mono partout, unité comprise : le « / mois » collé à un
prix appartient au prix, pas à la phrase.

## Deux effets de bord assumés

**Compensation optique.** Instrument Serif se lit plus petite que Geist à corps
égal. Tout texte sous 14 px gagne un demi-point en passant en serif. Les
graisses moyennes disparaissent là où elles existaient : la police n'a qu'un
seul poids, et une graisse demandée serait synthétisée par le navigateur.

**Correctif au passage.** La promesse « Bâtissez votre succès professionnel »
déclarait toute sa typographie, famille et corps compris, à l'intérieur de la
règle animée `.xc.anime`. Sans script, elle retombait en Geist 16 px. Même
chose pour la chute de chapitre et les lignes de synthèse. La typographie sort
de `.anime`, l'animation seule y reste. Le commentaire du script promettait que
sans lui « tout le texte s'affiche normalement » : c'est vrai maintenant.

## Vérification

Style calculé relevé élément par élément sur chaque page, avant et après.
Après : 80 éléments en serif sur l'accueil, 50 sur « À propos ». Ce qui reste
en Geist hors navigation et pied de page se compte sur les doigts : les
boutons, le lien secondaire du hero, les étiquettes de formulaire, et
l'intérieur des maquettes.
