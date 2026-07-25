# 2026-07-22 · Analyse Attio (attio.com), MESURÉE au navigateur

## Contexte

Le CEO a choisi Attio comme référence DA pour transformer le site SAFE (« inspire toi de ce
site pour la suite »). Analyse exécutée en direct dans Chrome (extension Claude), valeurs
mesurées au getComputedStyle et à l'API getAnimations, screenshots des sections clés.
Archétype : produit-first vivant, sans-serif moderne, la couleur vit dans la donnée.

## Tokens mesurés (exacts)

### Typographie
- Familles : **Inter** (corps, UI) + **InterDisplay** (titres). Une seule famille, deux coupes.
- H1 hero : **64px / 600**, letter-spacing **-1.28px** (-2 %), line-height **60.8px (0.95)**. Très serré.
- H2 sections : **40px / 500**, ls -0.4px (-1 %), lh 44px (1.1).
- Corps/sous-titre : **16px / 500**, lh 1.3.
- Rail latéral scrollytelling : 14px / 500.
- Poids max observé : 600. Jamais de 700. La hiérarchie vient de la taille + couleur, pas du gras.

### Couleur (rôles)
- Fond : **blanc pur #ffffff** (pas de crème).
- Encre : **#1c1d1f** (presque noir, très léger froid). CTA primaire : **#202124**.
- Texte secondaire : gris froid ~#505967 (lab 50). Deux niveaux de gris seulement.
- La couleur vive vit **dans la donnée** : scores verts (98, 97…), badges (Trigger bleu,
  ✓ Triggered vert), points de légende de graphiques, pastilles de statut.
- Accents décoratifs rares : fond lavande à fines rayures verticales derrière le hero produit,
  badge pill bleu clair pour les eyebrows de section (« Platform », « Build to scale »).
- 1 moment sombre théâtral (voir patterns) : noir + liseré spectral orange→bleu.

### Surfaces
- CTA : hauteur **36px** (compact), radius **10px**, 14px/500, padding 0 12px, fond #202124,
  bordure 1px légèrement plus claire (effet lift discret). Pas d'ombre.
- Pas d'ombres portées lourdes nulle part : les **filets fins** (hairlines) structurent tout
  (mur de logos, colonnes de la section sombre, stats).
- Captures produit : pas des images, du **vrai DOM rejoué** (tableaux, panneaux) dans des
  cadres discrets, souvent posés sur fond rayé lavande ou grille pointillée.
- Container max 1440px.

### Animations (inventaire chronométré)
- **Entrées** : 500 ms, transform + opacity, **cascade de 120 ms** entre éléments (0/120/240/360).
- **Hover** : 300 ms, easing signature **cubic-bezier(0.2, 0, 0, 1)** partout (transitions de
  couleurs des boutons via custom properties --button-primary-bg-from/to).
- **Boucles ambiantes** : 3 600 à 4 850 ms, linéaires, sur les éléments SVG du diagramme hero
  (opacité de cercles, translations de groupes), délais échelonnés 1 000/1 650/2 300/2 950 ms.
  Effet : le schéma « vit » en continu, sans jamais sauter.
- **Marquee** : 24 s linéaire (bandeau signaux).
- **Retenue** : le texte de contenu ne bouge pas après l'entrée. Seul le produit/diagramme vit.

## Les patterns signatures (classés par impact)

1. **Le produit rejoué en vrai DOM.** Tableau de comptes avec avatars, scores verts, cases
   cochées ; par-dessus, un panneau courriel s'ouvre et se remplit (l'agent travaille).
   Puis un canevas de workflow sur grille pointillée : cartes « Trigger / Web agent / If /
   Enroll » reliées, badges d'état. C'est la démo qui raconte, pas une capture figée.
2. **Scrollytelling à rail latéral.** 5 cas d'usage listés à gauche (encre = actif, gris =
   inactif, barre verticale sur l'actif), le contenu de droite change au scroll. Transforme
   une liste de features en récit.
3. **Copy pattern « phrase forte encre + suite grise »** dans le même paragraphe :
   « Keep more. Grow more. » (encre 500) puis la suite en gris. Répété partout. Lisible,
   scannable, élégant.
4. **Moment sombre théâtral unique.** Une seule section noire (Universal Context) : titre
   géant, horizon spectral (arc dégradé orange→bleu), 5 colonnes à filets avec icône line +
   titre blanc + sous-titre gris. Rupture dramatique au milieu d'une page blanche.
5. **Stats à barre latérale.** « 2.6M / MCP calls month » : nombre grand, label gris, fine
   barre verticale bleue à gauche. Sobre, crédible.
6. **Mur de logos en grille à filets** (pas de carrousel), flèche ↗ au coin en hover.
7. **Badges pill** eyebrow de section (bleu clair, texte bleu, radius full, ~13px).

## Transposition SAFE (décisions à prendre)

### Ce qu'on adopte
- **Systeme d'animation** : entrées 500 ms + cascade 120 ms, hover 300 ms cubic-bezier(0.2,0,0,1),
  boucles ambiantes lentes UNIQUEMENT dans la démo produit. Remplace nos durées hétérogènes.
- **Produit rejoué en DOM** dans le hero : tableau de dossiers (statuts colorés, montants
  tabulaires à droite) + panneau « l'assistant a rapproché le fidéicommis » qui s'anime.
  Aligné preuve-visuelle-avant-tout et concept déjà validé par le CEO (maquette Attio-like).
- **Copy pattern encre + gris** pour toutes les sections (se marie avec la passe « essentiel »).
- **Scrollytelling à rail** pour remplacer FeaturesGrid : Conformité / Fidéicommis /
  Facturation / Dossiers (l'ordre de l'enjeu décidé par le CEO).
- **Stats à barre latérale** pour les chiffres honnêtes (quand on en aura des sourcés).
- **Moment sombre unique** : candidat = la section offre fondatrice (forêt profonde #0B1F19
  au lieu du noir Attio, liseré vert au lieu du spectral).
- CTA compacts 36px radius 10, filets fins plutôt qu'ombres.

### Ce qu'on N'adopte PAS
- **Blanc pur + gris froid tel quel** : SAFE garde une base verdâtre/chaleureuse et son vert
  forêt. On prend la STRUCTURE d'Attio, pas sa froideur. À trancher : canvas #EFF2ED conservé
  vs blanc plus pur — décision DA à valider CEO.
- Le mur de logos clients (aucun client à montrer, pas de faux logos).
- Les stats de scale non sourcées ; les nôtres seront réelles ou absentes.
- Le bandeau top-bar promo noir (pas pertinent).
- Serif : Attio n'en a pas. Si on adopte pleinement cette DA, l'Instrument Serif recule ou
  disparaît de la landing. Décision de marque à valider explicitement (rupture avec
  l'identité éditoriale gravure).

## Plan d'application SAFE (impact/effort)

1. **Hero produit vivant** (le plus gros impact) : titre sans-serif serré + tableau de
   dossiers DOM + panneau assistant animé, entrées 500/120 ms.
2. **Système d'animation global** : tokens durée/easing unifiés (500/300/cascade 120,
   cubic-bezier(0.2,0,0,1)), appliqués aux sections existantes.
3. **Scrollytelling à rail** en remplacement de FeaturesGrid/ProduitEnVrai (fusion).
4. **Copy pattern encre+gris** sur toutes les sections (passe rapide).
5. **Moment sombre fondateur** : FoundingOffer en section forêt théâtrale.

## Statut

Analyse livrée. Aucun code touché. Prochaine étape : valider les 2 décisions DA (base
blanche vs verdâtre ; sort du serif) puis exécuter le plan dans l'ordre.
