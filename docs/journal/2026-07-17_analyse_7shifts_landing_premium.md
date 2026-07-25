# 2026-07-17 · Analyse 7shifts + passage de la landing SAFE en premium

## Contexte

Le CEO (passé sur Opus 4.8) veut rendre la présentation et le design du site ACTUEL
plus premium, en s'inspirant de 7shifts.com (scheduling resto, 55 000 clients).
Mesuré en direct au navigateur.

## Tokens premium mesurés chez 7shifts

- **Hero** : H1 « Universal Sans Display » 64px, weight 400, letter-spacing -1.92px,
  line-height 61px (SERRÉ). Eyebrow en police marqueur manuscrite. Sous-titre gris.
- **Preuve étoilée au-dessus du H1** : « 4.7 ★★★★★ 12,000+ Reviews » + « Trusted by
  over 55,000 restaurants ». La preuve est PLACÉE HAUT, avant le titre.
- **CTA** : pilule bleu #4570FF, radius 50px, padding 16/24, hauteur 51px.
- **Cadre produit** : capture posée dans une carte crème #F1F0EC, radius 20px. Le
  produit n'est jamais nu, il est TOUJOURS encadré dans une surface teintée.
- **Cartes bento colorées « How it works »** : blocs radius 20px, fonds saturés
  (violet #453E75, vert foncé #244F47, crème #E2DED6, lavande #EBDCFF), padding 40px,
  badge numéroté rond (cercle lime), titre display 36px BLANC, et le mockup produit
  NICHÉ dans la carte qui DÉBORDE (overflow visible). C'est le move premium clé.
- **Espace** : très aéré, sections larges, mockups qui bleed out des cartes.
- Palette hero = blanc pur + noir + un bleu. Couleur vit dans les bento.

## Les 5 moves premium à voler (adaptés Forêt lumineuse)

1. **Preuve haute** : bandeau étoilé AVANT le H1. Version honnête SAFE (pas de faux
   avis) : 5 étoiles vertes + « Conforme B-1 r.5 · LSO · données au Canada ».
2. **H1 plus grand et plus serré** : monter le serif à ~46-56px, letter-spacing
   négatif (-1.4px), line-height 1.02. Le hero actuel (Hero.tsx, 56px déjà) est bon,
   resserrer l'interlignage et l'espace lettres pour la tenue premium.
3. **Produit dans un cadre teinté** : au lieu du BrowserFrame nu, poser la capture
   dans une carte albâtre #EFF2ED radius 20px avec ombre DOUCE profonde teintée forêt
   (0 40px 80px -40px rgba(11,31,25,0.4)). Le produit ne flotte plus, il est présenté.
4. **Section bento forêt** : remplacer/enrichir ProcessTimeline par 3 cartes bento
   (forêt #0B1F19, forêt soft #16312A, albâtre) radius 20px, badges numérotés ronds
   verts en serif, titres serif blancs, et une mini-capture produit nichée dans
   chaque carte. « Vous facturez / SAFE surveille / Vous passez l'inspection ».
5. **Double CTA** : garder l'audit gratuit en primaire + « vidéo 3 min » secondaire,
   avec micro-réassurance sous les boutons (« sans engagement, sans carte »).

## Ce qu'on NE copie pas

Le bleu, la pilule 50px (garder rectangle 10px SAFE), la police marqueur enfantine,
le blanc pur (garder albâtre). 7shifts valide le PATTERN, pas la MATIÈRE.

## Mapping composants réels

- components/landing/Hero.tsx : ajouter bandeau étoilé, resserrer H1 (leading/tracking),
  emballer BrowserFrame dans une carte teintée + ombre douce, ajouter 2e CTA + réassurance.
- components/landing/ProcessTimeline.tsx : refonte en cartes bento forêt avec produit niché.
- components/landing/FeaturesGrid.tsx : déjà en hover premium (halo + trait vert),
  cohérent, harmoniser le radius (10px) et l'ombre teintée avec le nouveau système.

## Statut

Maquette premium (hero + bento) livrée en widget. Rien d'implémenté. C'est la couche
« exécution premium » qui se pose SUR le thème Forêt lumineuse + modèle spatial déjà
proposés. À valider avant de toucher Hero.tsx / ProcessTimeline.tsx.
