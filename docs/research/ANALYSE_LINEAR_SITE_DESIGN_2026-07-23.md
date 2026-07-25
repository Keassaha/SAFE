# Analyse du site public de Linear: code livré, système visuel et logique narrative

Date de recherche: 2026-07-23  
Auteur: Codex  
Statut: draft de référence  
Périmètre: landing publique `linear.app/homepage`, version ordinateur et mobile  

## Question de départ

Comment la landing actuelle de Linear est-elle réellement construite, quels choix de code et de style produisent son identité, et quelles leçons peuvent être transposées dans un brouillon SAFE sans copier son univers?

## Résumé exécutif

- `VERIFIE` Linear ne repose pas sur un minimalisme vide. La page observée mesure environ 10 504 px de hauteur sur un écran de 1 280 px et contient cinq longues démonstrations produit.
- `VERIFIE` Le système visuel repose sur une palette presque monochrome, Inter Variable, Berkeley Mono, des filets translucides de 0,5 à 1 px, une grille 50/50 et une forte densité d'interface.
- `VERIFIE` Le hero ne présente pas de CTA commercial principal. Il établit d'abord une catégorie et montre immédiatement le produit. Le CTA inversé apparaît surtout dans la navigation et à la fin.
- `VERIFIE` Les scènes produit ne sont pas de simples captures plates. La page combine du DOM, des SVG, de petites images, des masques, du grain, des lueurs et des animations locales.
- `INFERENCE` La qualité perçue vient moins du noir que de la cohérence entre le discours, la hiérarchie typographique et les interfaces démontrées.
- `INFERENCE` Pour SAFE, copier la couleur noire serait superficiel. La meilleure transposition consiste à reprendre la discipline narrative, la grille, la précision des panneaux et le principe « le produit est la preuve ».

## Méthode

Sources prioritaires consultées:

1. Landing officielle de Linear.
2. Page officielle Linear Method.
3. DOM rendu à 1 280 × 720 et à 390 × 844.
4. Styles calculés dans le navigateur.
5. Feuilles CSS publiques chargées par la landing.

Mesures:

- géométrie des principaux blocs;
- styles calculés des titres, paragraphes, boutons et panneaux;
- tokens CSS exposés sur l'élément racine;
- inventaire indicatif du DOM et des ressources;
- comparaison responsive;
- inspection des animations, masques, lueurs et mélanges.

Limites:

- L'analyse porte sur le code public livré au navigateur, pas sur le dépôt source privé de Linear.
- Les noms de classes sont issus de bundles de production et peuvent changer.
- Certains éléments existent en plusieurs variantes responsive ou animées dans le DOM.
- Les chiffres de comptage décrivent la version observée le 23 juillet 2026.

## 1. Architecture technique publique

### 1.1 Framework et livraison

- `VERIFIE` Les ressources sont servies sous `/_next/static/`, ce qui confirme une application construite avec Next.js.
- `VERIFIE` La page charge 28 scripts externes, principalement des modules, et 68 feuilles CSS.
- `VERIFIE` Les styles sont découpés par responsabilité: `Hero`, `PageSection`, `Build`, `Plan`, `Monitor`, `Changelog`, `CTA`, `Header`, `Grain`, etc.
- `VERIFIE` Les noms de classes combinent CSS Modules, classes générées et utilitaires internes.
- `VERIFIE` Le HTML expose `data-theme="dark"` et `color-scheme: dark`.
- `VERIFIE` Linear précharge `InterVariable.woff2`.
- `VERIFIE` Les médias proviennent principalement de `static.linear.app`, `webassets.linear.app` et du service d'images Cloudflare.
- `VERIFIE` La page expose une version Sentry `linear-web@1.71554.0` dans les métadonnées observées.

### 1.2 Composition du DOM

À 1 280 px:

- 9 éléments `section`;
- 1 `h1`;
- 8 `h2`;
- 76 liens;
- 89 boutons;
- 32 images;
- 183 SVG;
- aucun élément `video` observé;
- aucun `canvas` observé.

`A_CONFIRMER` Le comptage inclut des contrôles internes des maquettes produit et des variantes potentiellement masquées. Il ne doit pas être interprété comme le nombre de contrôles de la navigation marketing.

### 1.3 Construction du hero

Le bloc produit du hero observé contient environ:

- 375 descendants DOM;
- 110 `div`;
- 41 SVG;
- 31 boutons;
- 11 images;
- 2 liens.

`VERIFIE` Le hero est donc une scène composite. Il combine une interface structurée, des icônes, des avatars et plusieurs couches visuelles. Ce n'est pas une seule capture d'écran.

## 2. Système de mise en page

### 2.1 Tokens structurants

Tokens publics observés:

| Token | Valeur |
|---|---:|
| `--homepage-max-width` | `calc(1344px + 10px * 2)` |
| `--homepage-outer-padding` | `10px` |
| `--homepage-padding-inset` | `32px` |
| `--header-height` | `72px` |
| `--homepage-outer-padding` mobile | la structure visible conserve un retrait de 16 à 24 px |
| `--border-hairline` | `0.5px` |

### 2.2 Grille

- `VERIFIE` Les sections produit utilisent une grille à deux colonnes `1fr 1fr`.
- `VERIFIE` Le titre occupe la moitié gauche.
- `VERIFIE` La description occupe la moitié droite et est limitée à environ `38ch`.
- `VERIFIE` Les grandes sections ont `128px` de padding en haut et en bas sur ordinateur.
- `VERIFIE` L'en-tête de chaque section garde `96px` avant l'illustration.
- `VERIFIE` Les scènes produit débordent parfois au-delà du conteneur. Un panneau mesuré fait 1 386 px de large dans une fenêtre de 1 280 px.

### 2.3 Rythme vertical

Positions mesurées des grands titres sur ordinateur:

| Bloc | Position verticale approximative |
|---|---:|
| Hero | 272 px |
| Manifeste de catégorie | 1 418 px |
| Intake | 2 282 px |
| Plan | 3 515 px |
| Build | 4 741 px |
| Diffs | 5 922 px |
| Monitor | 7 021 px |
| Changelog | 8 249 px |
| CTA final | 9 614 px |

Les cinq sections produit mesurent approximativement de 1 089 à 1 223 px chacune.

`INFERENCE` La répétition n'est pas monotone parce que la charpente reste identique tandis que chaque scène logicielle change fortement.

## 3. Typographie

### 3.1 Familles

- `VERIFIE` Police principale: `Inter Variable`, suivie de `SF Pro Display` et des polices système.
- `VERIFIE` Police monospace: `Berkeley Mono`, avec repli vers `SF Mono`, Menlo et monospace.
- `VERIFIE` La monospace est utilisée dans les identifiants, données techniques et interfaces produit, pas comme effet marketing général.

### 3.2 Graisses

Valeurs dominantes:

- 400 pour le texte courant;
- 510 pour les titres, labels importants et boutons;
- 590 pour quelques accents;
- 680 défini comme bold dans les tokens, mais rarement visible dans la landing.

`INFERENCE` La graisse 510 est une décision centrale. Elle donne de la présence sans rendre l'interface lourde.

### 3.3 Échelle ordinateur

| Élément | Taille | Interligne | Graisse | Approche |
|---|---:|---:|---:|---:|
| H1 | 64 px | 64 px | 510 | -1,408 px |
| H2 produit | 48 px | 48 px | 510 | -1,056 px |
| H2 manifeste / CTA | 40 px | 44 px | 510 | -0,88 px |
| Description de section | 24 px | 31,92 px | 400 | -0,288 px |
| Intro du hero | 15 px | 24 px | 400 | -0,165 px |
| Navigation | 13 px | 19,5 px | 400 | légère |
| Labels de figure | 12 px | 16,8 px | 400 | normale |

### 3.4 Mesures du hero

- `VERIFIE` Le H1 fait environ 1 198 px de large et 128 px de haut sur 1 280 px.
- `VERIFIE` Le texte d'introduction fait environ 378 px de large.
- `VERIFIE` Le titre est aligné à gauche, sans largeur de lecture artificiellement étroite.
- `VERIFIE` Le texte secondaire est volontairement beaucoup plus petit que le titre.

`INFERENCE` Linear produit du contraste par l'échelle et l'espace, pas par une multiplication de couleurs ou de graisses.

## 4. Couleur et surfaces

### 4.1 Palette fondamentale

| Rôle | Valeur observée |
|---|---|
| Fond principal | `#08090a` |
| Surface niveau 1 | `#0f1011` |
| Surface niveau 2 | `#141516` |
| Surface niveau 3 | `#191a1b` |
| Texte primaire | `#f7f8f8` |
| Texte secondaire | `#d0d6e0` |
| Texte tertiaire | `#8a8f98` |
| Texte quaternaire | `#62666d` |
| Accent | `#7170ff` |
| Bordure translucide | `#ffffff0d` |
| Bordure translucide forte | `#ffffff14` |

### 4.2 Usage de la couleur

- `VERIFIE` La page marketing reste presque monochrome.
- `VERIFIE` Les couleurs plus vives apparaissent surtout à l'intérieur des interfaces produit: statuts, graphiques, avatars, agents et labels.
- `VERIFIE` L'accent violet n'est pas utilisé comme grand dégradé de hero.
- `INFERENCE` La couleur sert à rendre le logiciel crédible, pas à décorer la page.

### 4.3 Surfaces

- `VERIFIE` Les panneaux produit utilisent une surface proche de `#0f1011`.
- `VERIFIE` Le conteneur externe courant utilise une bordure `1px solid rgba(255,255,255,.08)`.
- `VERIFIE` Un panneau mesuré utilise un rayon externe de 22 px, 8 px de padding et un panneau intérieur à 12 px.
- `VERIFIE` Le système emploie une échelle de rayons: 2, 4, 6, 8, 12, 16, 20, 22 px et pilules.
- `INFERENCE` Les rayons expriment le rôle. Ils ne sont pas uniformes.

## 5. Navigation et boutons

### 5.1 Navigation

- `VERIFIE` Header fixe de 72 px sur ordinateur et environ 65 px sur mobile.
- `VERIFIE` Fond à transparence contrôlée, flou de 20 px et bordure basse translucide après défilement.
- `VERIFIE` Les liens font 32 px de haut, utilisent une taille de 13 px et un rayon pilule.
- `VERIFIE` Le hover ajoute une surface translucide, pas un soulignement ni un déplacement.
- `VERIFIE` Les transitions principales de navigation durent 100 ms.

### 5.2 Bouton principal

Bouton `Sign up` observé:

- 73 × 32 px;
- fond `rgb(229,229,230)`;
- texte `#08090a`;
- rayon `9999px`;
- texte 13 px, graisse 510;
- padding horizontal 12 px.

Bouton final `Get started`:

- hauteur 44 px;
- texte 16 px, graisse 510;
- padding horizontal 20 px;
- rayon pilule;
- ombre courte composée de plusieurs couches.

### 5.3 Bouton secondaire

Le bouton `Contact sales`:

- fond blanc à 5 %;
- léger flou de 4 px;
- halo intérieur très faible;
- rayon pilule;
- transition de 160 ms.

`INFERENCE` Linear réserve la forme pilule aux actions et à la navigation. Les panneaux de contenu restent rectangulaires avec des rayons modérés.

## 6. Structure narrative

### 6.1 Hero: créer la catégorie

Le titre observé est « The product development system for teams and agents ».

`VERIFIE` La première promesse ne liste aucune fonctionnalité. Elle nomme un système et un public.

`VERIFIE` Le sous-titre ajoute deux qualifications: construit pour planifier et bâtir, conçu pour l'ère de l'IA.

`VERIFIE` Un lien de nouveauté, `Coding Sessions`, occupe la partie droite de la ligne secondaire.

`VERIFIE` Le produit entre immédiatement sous le texte et occupe la majeure partie du premier écran.

### 6.2 Manifeste: expliquer le point de vue

Un H2 de 40 px présente Linear comme une nouvelle espèce d'outil.

Trois principes suivent:

1. Purpose-built
2. Powered by agents
3. Designed for speed

Chaque principe possède:

- un numéro de figure `FIG 0.2`, `FIG 0.3`, `FIG 0.4`;
- un titre de 15 px en graisse 510;
- une courte explication;
- sa propre colonne.

`INFERENCE` Cette section donne une logique au produit avant de détailler les fonctions. Elle transforme une liste de fonctionnalités en vision cohérente.

### 6.3 Démonstration en cinq actes

La page enchaîne:

1. Intake
2. Plan
3. Build
4. Diffs
5. Monitor

Chaque acte suit le même contrat:

- titre de 48 px à gauche;
- description de 24 px à droite;
- lien numéroté;
- scène produit occupant toute la largeur;
- sous-navigation ou familles de capacités dans le pied de section.

`INFERENCE` Le numéro transforme les fonctionnalités en parcours. Il donne une impression de système complet.

### 6.4 Preuve de continuité

Après les démonstrations:

- changelog;
- citations clients;
- preuve quantitative de 37 000 équipes au moment de l'observation;
- CTA final;
- footer détaillé.

`VERIFIE` La page officielle observée affirme que Linear alimente plus de 37 000 équipes produit.

`INFERENCE` Le changelog est une preuve de vitalité plus crédible qu'une simple affirmation « nous innovons constamment ».

## 7. Illustrations produit

### 7.1 Nature des scènes

- `VERIFIE` Les scènes comprennent de nombreux éléments DOM, SVG et petites images.
- `VERIFIE` Les écrans utilisent de vraies données fictives cohérentes: identifiants, projets, statuts, dates, avatars, conversations et extraits de code.
- `VERIFIE` Les nombres sont alignés et les interfaces respectent la densité du produit réel.
- `VERIFIE` Les grandes scènes sont recadrées et masquées plutôt que réduites jusqu'à devenir illisibles.

### 7.2 Cadres et débordements

Style public du cadre générique:

- bordure translucide;
- rayon externe de 22 px;
- padding de 8 px;
- panneau interne de 12 px;
- masque vertical qui laisse disparaître le bas de la scène.

`INFERENCE` La disparition progressive suggère que le produit continue au-delà du cadre. Cela évite l'effet « capture déposée dans une carte ».

### 7.3 Effets

Effets vérifiés:

- grain en `mix-blend-mode: overlay`;
- opacité de grain de 0,6 à 0,9;
- lueur radiale blanche de 3 à 4 %;
- lueur en `mix-blend-mode: lighten`;
- brillance de bord contrôlée par masque radial;
- masques multiples pour les disparitions horizontales et verticales;
- filets pointillés construits avec `repeating-linear-gradient`;
- ombres courtes et intérieures;
- halos de grande taille limités aux panneaux.

`INFERENCE` Les effets ne sont presque jamais le premier niveau de lecture. Ils sont perceptibles après la structure.

## 8. Motion

### 8.1 Vitesse

Tokens observés:

- transition rapide: 100 ms;
- transition régulière: 250 ms;
- hover de liens: 160 ms;
- animations de menu: 180 ms;
- fade du CTA: 500 ms;
- entrées en cascade dans une scène produit: 400 ms avec décalages de 100 ms.

### 8.2 Courbes

Courbes publiques:

- `ease-out-quad`: `cubic-bezier(.25,.46,.45,.94)`;
- `ease-out-quart`: `cubic-bezier(.165,.84,.44,1)`;
- plusieurs courbes plus fortes sont définies, mais les interactions courantes restent sobres.

### 8.3 Types de mouvement

- `VERIFIE` Entrées en cascade de contenu produit.
- `VERIFIE` Marquees continues de 30 secondes.
- `VERIFIE` Micro-animations SVG discrètes.
- `VERIFIE` Transformations de 3 % environ au clic sur certaines actions.
- `VERIFIE` Les règles CSS prévoient `prefers-reduced-motion` pour les menus.

`INFERENCE` La motion sert principalement à simuler une application vivante et à confirmer une interaction. Elle n'anime pas chaque bloc marketing.

## 9. Responsive

### 9.1 Breakpoints observés dans le CSS public

- 1 280 px;
- 1 024 px;
- 768 px;
- 640 px.

### 9.2 Hero mobile à 390 × 844

- H1: 38 px;
- interligne: 41,8 px;
- graisse: 510;
- largeur: environ 343 px;
- hauteur: environ 167 px;
- position verticale: environ 196 px;
- retrait latéral visible: environ 23 à 24 px.

Le document passe d'environ 10 504 px sur ordinateur à 6 379 px sur mobile.

### 9.3 Sections mobiles

- `VERIFIE` Les sections produit passent en `flex-direction: column-reverse`.
- `VERIFIE` L'illustration apparaît avant le texte explicatif dans le flux visuel mobile.
- `VERIFIE` Les H2 de section passent à 24 px dans l'exemple mesuré.
- `VERIFIE` Les descriptions passent de 24 px à 15 px et utilisent la couleur tertiaire.
- `VERIFIE` Les sections perdent leur padding vertical de 128 px au plus petit breakpoint.
- `VERIFIE` La navigation conserve `Log in`, `Sign up` et le menu.

`INFERENCE` La version mobile est recomposée, pas simplement réduite.

## 10. Accessibilité et sémantique visibles

- `VERIFIE` Un lien « Skip to content » est présent.
- `VERIFIE` La page conserve une hiérarchie `h1`, `h2`, `h3`.
- `VERIFIE` Le document indique `lang="en"`.
- `VERIFIE` Le thème indique explicitement `color-scheme: dark`.
- `VERIFIE` Les liens de la landing prévoient des focus visibles utilisant l'accent.
- `VERIFIE` De nombreuses images décoratives ont un alt vide.
- `VERIFIE` Les avatars porteurs d'identité utilisent des textes alternatifs.
- `A_CONFIRMER` Un audit WCAG complet nécessiterait une analyse dédiée des états interactifs, du clavier et des contrastes de toutes les scènes produit.

## 11. Ce qui crée réellement le « style Linear »

### 11.1 Les causes profondes

1. Une proposition de catégorie très courte.
2. Une typographie variable finement réglée.
3. Une grille 50/50 répétée.
4. Un produit montré avant d'être expliqué.
5. Des scènes très denses entourées de beaucoup d'espace.
6. Une palette marketing presque monochrome.
7. La couleur confinée aux données.
8. Des filets plus fréquents que les ombres.
9. Des masques qui recadrent sans réduire.
10. Une numérotation qui transforme les fonctions en système.
11. Une preuve de continuité par le changelog.
12. Une motion locale et rapide.

### 11.2 Ce qui n'est pas la cause principale

- le fond noir seul;
- les boutons pilules;
- les dégradés;
- les halos;
- la police Inter seule;
- une simple capture d'écran;
- une page courte;
- un hero centré.

## 12. Transposition possible à SAFE

### 12.1 Éléments à transposer

- `INFERENCE` Construire une phrase de catégorie plus nette avant les bénéfices.
- `INFERENCE` Faire du produit SAFE la preuve principale.
- `INFERENCE` Organiser le récit autour d'un parcours numéroté propre au cabinet.
- `INFERENCE` Utiliser des scènes produit crédibles avec vrais libellés, vrais montants et vrais états.
- `INFERENCE` Conserver la grille titre à gauche, explication à droite.
- `INFERENCE` Utiliser le vert SAFE dans les données et les confirmations, pas comme décoration omniprésente.
- `INFERENCE` Créer une échelle de surfaces et de filets.
- `INFERENCE` Introduire un changelog ou une preuve de construction continue lorsque le volume de clientèle reste limité.

### 12.2 Éléments à ne pas copier

- le noir presque absolu comme identité principale;
- la terminologie produit de Linear;
- ses agents de développement;
- ses scènes d'issues, cycles et PR;
- son volume de navigation;
- son nombre de démonstrations;
- ses chiffres de preuve;
- ses actifs visuels;
- ses détails de marque distinctifs.

### 12.3 Adaptation recommandée au brouillon

Le brouillon SAFE devrait tester:

1. Hero plus ambitieux et plus ample.
2. Promesse courte à gauche.
3. Sous-promesse et lien secondaire sur une ligne séparée.
4. Grande scène SAFE débordante sous le texte.
5. Trois principes numérotés propres à SAFE.
6. Trois actes produit maximum: tenir, vérifier, encaisser.
7. Une vraie scène différente par acte.
8. Audit gratuit comme action principale persistante.
9. Palette claire ou vert-noir propre à SAFE, sans imitation du noir Linear.
10. Version mobile recomposée avec produit avant explication.

## 13. Risques

- Copier l'apparence sombre sans copier la discipline produit.
- Produire des maquettes SAFE fictives qui ne correspondent pas au logiciel réel.
- Allonger la page sans créer de progression narrative.
- Réduire les scènes produit sur mobile au point de les rendre illisibles.
- Ajouter grain, glow et masques avant d'avoir réglé la hiérarchie.
- Transformer le site en démonstration technique qui néglige la confiance juridique.
- Oublier que le cycle d'achat SAFE est plus long et plus rassurant que celui de Linear.

## 14. Conclusion

`VERIFIE` Linear livre une landing techniquement riche, très longue et fortement scénarisée. Sa sobriété visible masque une quantité importante de code de présentation.

`INFERENCE` Le meilleur apprentissage pour SAFE n'est pas « devenir sombre et minimaliste ». C'est « réduire le discours, augmenter la preuve et faire correspondre chaque détail visuel à une idée produit précise ».

Avant toute nouvelle version du brouillon, la décision la plus importante sera de définir les trois actes du produit SAFE que la page doit démontrer.

## 15. Analyse de l'application connectée

### 15.1 Périmètre et confidentialité

- `VERIFIE` Analyse réalisée dans une session Linear authentifiée, en lecture seule.
- `VERIFIE` Vues examinées: liste active d'une équipe, fiche d'une issue d'accueil, recherche globale, accueil d'équipe, projets et états vides.
- `VERIFIE` Aucun contenu propre à l'activité de l'utilisateur n'est reproduit dans ce rapport.
- `VERIFIE` Les exemples observés sont les contenus génériques d'accueil créés par Linear.
- `A_CONFIRMER` Les vues très chargées, les tableaux de bord avec historique et les réglages avancés devront être revus dans un espace de démonstration plus rempli.

### 15.2 Le shell général

`VERIFIE` En desktop, l'application est divisée en deux zones:

1. une navigation latérale fixe de `244px`;
2. un espace de travail qui occupe tout le reste de la fenêtre.

`VERIFIE` À `1440px`, le contenu commence à `x = 244px` et mesure environ `1188px`. La surface principale est légèrement décollée des bords supérieur, droit et inférieur, avec un arrondi externe très discret.

`VERIFIE` Le corps de page est verrouillé avec `overflow: hidden`. Le défilement appartient aux zones de travail internes, pas au document entier.

`INFERENCE` Ce choix rend le produit plus proche d'une application de bureau que d'un site web. Le navigateur devient un cadre stable et les modules se comportent comme des panneaux.

### 15.3 Navigation latérale

`VERIFIE` La navigation utilise quatre niveaux:

1. identité de l'espace;
2. actions globales;
3. objets transversaux;
4. navigation propre à chaque équipe.

`VERIFIE` Les commandes les plus fréquentes sont placées tout en haut: recherche, création, boîte de réception et éléments assignés.

`VERIFIE` La distinction « espace de travail / équipe » n'est pas obtenue par des cartes. Elle repose sur:

- des libellés de section;
- de petits chevrons;
- une indentation;
- des icônes monochromes;
- un fond actif local.

`VERIFIE` L'élément actif observé utilise:

- fond `lch(91.04% 0.5 282)`;
- texte `lch(9.594% 0 282)`;
- rayon `8px`;
- aucune ombre.

`INFERENCE` La navigation paraît calme parce que l'état actif ne change presque pas la couleur. Il modifie surtout la luminance.

### 15.4 Barre supérieure et fil d'Ariane

`VERIFIE` Chaque vue commence par une barre d'environ `44px` de haut.

`VERIFIE` Cette barre accueille:

- le fil d'Ariane;
- le favori;
- les actions secondaires;
- la navigation précédent/suivant lorsqu'elle existe.

`VERIFIE` Les titres de liste ne sont pas traités comme de grands titres marketing. Le libellé « Issues » observé est rendu autour de `13px`, poids `500`.

`INFERENCE` Linear réserve les grands caractères au contenu réellement éditable, par exemple le titre d'une issue. Le chrome de l'application demeure volontairement discret.

### 15.5 Typographie et densité

`VERIFIE` La famille principale observée est:

`Inter Variable, SF Pro Display, system-ui, Segoe UI, Roboto, sans-serif`.

`VERIFIE` Les tailles qui dominent le shell sont `12px`, `13px`, `15px` et `16px`.

`VERIFIE` Les graisses les plus fréquentes sont:

- normal: `450`;
- medium: `500`;
- semibold: `600`.

`VERIFIE` Une fiche utilise un titre de `24px`, poids `600`, tandis que son contenu courant reste à `15px` ou `16px`.

`INFERENCE` La sensation de précision vient en partie du poids `450`: un peu plus ferme que `400`, mais moins démonstratif que `500`.

### 15.6 Couleur, surfaces et séparateurs

Tokens observés dans le thème clair:

| Rôle | Valeur observée |
|---|---|
| Fond primaire | `lch(98.94% 0.5 282)` |
| Fond secondaire | `lch(93.44% 0.5 282)` |
| Fond tertiaire | `lch(91.94% 0.5 282)` |
| Fond quaternaire | `lch(96.94% 0.5 282)` |
| Bordure primaire | `lch(96.24% 0 282)` |
| Texte primaire | `lch(9.894% 0 282)` |
| Texte secondaire | `lch(19.788% 1.25 282)` |
| Texte tertiaire | `lch(39.576% 1.25 282)` |
| Texte quaternaire | `lch(65.3% 1.25 282)` |

`VERIFIE` Les neutres ont une très légère orientation chromatique `282`, mais une chroma presque nulle.

`VERIFIE` Les dégradés sont absents des surfaces examinées.

`VERIFIE` Les ombres sont presque absentes. Les panneaux sont séparés par:

- un changement de luminance minime;
- une bordure d'un pixel;
- un espacement;
- un rayon discret.

`INFERENCE` C'est la différence majeure avec beaucoup de tableaux de bord SaaS: Linear ne transforme pas chaque groupe en carte flottante.

### 15.7 Listes d'issues

`VERIFIE` Une ligne d'issue mesure `44px`.

`VERIFIE` La ligne est construite comme une grille horizontale:

1. sélection;
2. priorité ou statut;
3. identifiant;
4. titre;
5. métadonnées;
6. date.

`VERIFIE` Le groupe de statut possède lui aussi une barre de `44px`, ce qui produit un rythme vertical uniforme.

`INFERENCE` Ce rythme constant permet de parcourir rapidement une liste sans que chaque ligne réclame l'attention.

`INFERENCE` Pour SAFE, la bonne transposition n'est pas de réduire toutes les lignes à `44px`. Il faut préserver cette régularité tout en laissant davantage d'espace aux montants, noms de clients et états juridiques qui exigent plus de lisibilité.

### 15.8 Fiche détaillée

`VERIFIE` En desktop, la fiche conserve la navigation latérale et divise la zone centrale en:

- contenu principal éditable;
- propriétés à droite;
- activité et commentaires sous le contenu.

`VERIFIE` Les propriétés ne sont pas placées dans une carte lourde. Elles forment une colonne d'actions simples: statut, priorité, assignation, étiquettes et projet.

`VERIFIE` La barre supérieure de la fiche ajoute:

- position dans la série;
- navigation précédente/suivante;
- copie du lien;
- copie de l'identifiant;
- actions de travail.

`INFERENCE` La fiche fonctionne comme un document avec métadonnées, pas comme un formulaire administratif.

`INFERENCE` C'est une piste forte pour SAFE: un dossier ou une facture peut avoir un centre lisible et narratif, avec les champs de gestion regroupés dans une colonne secondaire.

### 15.9 Recherche globale

`VERIFIE` La recherche globale ouvre une route dédiée et remplace l'espace de travail principal.

`VERIFIE` La navigation latérale reste visible en desktop.

`VERIFIE` La recherche propose immédiatement les catégories:

- tout;
- issues;
- projets;
- documents.

`VERIFIE` Les filtres et options d'affichage restent au même emplacement que dans les listes.

`INFERENCE` La recherche n'est pas traitée comme un dialogue exceptionnel. Elle est une vue normale du produit.

`INFERENCE` Pour SAFE, une recherche globale clients, dossiers, factures et documents gagnerait à reprendre cette continuité structurelle.

### 15.10 Accueil d'équipe

`VERIFIE` L'accueil d'équipe utilise un grand espace libre, un nom éditable, une description, des membres, des accès rapides et une zone de ressources.

`VERIFIE` Le contenu n'est pas enfermé dans une grille de statistiques par défaut.

`INFERENCE` Linear considère l'accueil comme une page d'orientation et de contexte, pas comme un tableau de bord rempli artificiellement.

`INFERENCE` Pour SAFE, l'accueil d'un cabinet ou d'un dossier pourrait commencer par les priorités et raccourcis réellement utiles, plutôt que par une collection systématique de cartes KPI.

### 15.11 États vides

`VERIFIE` L'état vide « Projets » contient:

- une illustration monochrome simple;
- un titre;
- un paragraphe pédagogique;
- une action principale;
- un lien de documentation.

`VERIFIE` Le bloc explicatif reste étroit et centré dans une très grande surface.

`VERIFIE` L'action principale affiche aussi son raccourci clavier.

`INFERENCE` L'état vide remplit trois fonctions: expliquer l'objet, proposer le premier geste et enseigner le système.

### 15.12 Responsive

`VERIFIE` Le breakpoint principal observé est exact:

- à `1025px`, la navigation de `244px` reste visible;
- à `1024px`, elle est retirée de l'écran et le contenu prend toute la largeur.

`VERIFIE` La navigation devient accessible par un bouton « Menu » dans la barre supérieure.

`VERIFIE` Sur une fiche mobile de `390px`:

- le fil d'Ariane est tronqué;
- les actions globales restent dans la barre supérieure;
- le titre occupe toute la largeur;
- les propriétés essentielles remontent sous le titre sous forme de pastilles;
- le panneau de propriétés desktop disparaît;
- le contenu devient une seule colonne défilante;
- la typographie du titre reste à `24px`.

`VERIFIE` Sur l'accueil d'équipe mobile:

- les onglets restent en haut;
- les ressources rapides passent sous le titre;
- la zone de ressources devient une section verticale;
- la densité baisse sans changement de vocabulaire visuel.

`INFERENCE` Linear ne réduit pas seulement les colonnes. Il reclassifie les actions selon leur importance.

### 15.13 Interaction et accessibilité observables

`VERIFIE` Un lien « Skip to content » est présent.

`VERIFIE` Les contrôles principaux ont des noms accessibles explicites.

`VERIFIE` Les raccourcis clavier sont affichés dans certaines actions.

`VERIFIE` Les transitions déclarées sont courtes, de l'ordre de `0.1s` à `0.25s` selon les composants observés.

`VERIFIE` Le focus clavier visible utilise une teinte bleue-violette nettement plus affirmée que les couleurs de repos.

`A_CONFIRMER` Un audit clavier complet nécessiterait de parcourir toutes les séquences de tabulation et les dialogues.

## 16. Grammaire interne de Linear

La grammaire de l'application peut être résumée ainsi:

1. shell stable;
2. navigation par niveaux;
3. barre supérieure de `44px`;
4. listes rythmées à `44px`;
5. titre de contenu plus expressif que le chrome;
6. propriétés secondaires sur le côté;
7. recherche comme vue;
8. états vides pédagogiques;
9. couleur réservée aux états et aux accents;
10. responsive par re-priorisation.

`INFERENCE` Le « style Linear » interne vient moins d'un traitement graphique que d'une hiérarchie extrêmement cohérente entre navigation, objet, propriétés et action.

## 17. Transposition concrète à l'interface SAFE

### 17.1 À reprendre

- Un shell stable avec navigation cabinet, travail personnel et modules.
- Une hauteur de barre supérieure constante.
- Une grille de listes régulière et scannable.
- Des vues de recherche et de filtrage qui conservent le contexte.
- Une fiche centrale lisible avec propriétés secondaires à droite.
- Des états vides qui expliquent le prochain geste.
- Une version mobile où les propriétés vitales remontent près du titre.
- Une palette neutre avec le vert SAFE réservé à l'action, à la confirmation et aux états positifs.

### 17.2 À adapter

- Les libellés de `12px` sont trop petits pour certaines données légales et financières.
- Une ligne SAFE devrait probablement mesurer `48px` à `56px` selon sa densité.
- Les statuts financiers et les échéances doivent être plus explicites que les statuts d'issue.
- La recherche devrait distinguer clairement client, dossier, facture, paiement et document.
- La colonne de propriétés doit rendre les montants et dates plus lisibles.
- Les raccourcis clavier doivent rester une aide, jamais la seule voie.

### 17.3 À éviter

- Copier la terminologie ou les icônes propres à Linear.
- Rendre tout gris au point de diminuer la lisibilité métier.
- Utiliser le rose-violet Linear comme accent SAFE.
- Réduire toutes les informations à une densité de logiciel pour développeurs.
- Transformer chaque fiche SAFE en issue.
- Copier les illustrations ou compositions de Linear.

## 18. Direction recommandée pour le prochain brouillon SAFE

`INFERENCE` La direction la plus crédible serait « calme opérationnel », pas « clone de Linear ».

Le prochain brouillon pourrait montrer:

1. une navigation latérale SAFE de `232px` à `248px`;
2. une barre supérieure constante de `44px` à `48px`;
3. une liste de dossiers ou factures à `52px`;
4. un état actif neutre avec rayon `8px`;
5. une fiche centrale avec résumé, chronologie et documents;
6. une colonne droite pour statut, responsable, dates et montants;
7. une recherche globale en vue complète;
8. un mobile où statut, solde et échéance remontent sous le titre;
9. des états vides sobres et pédagogiques;
10. un vert SAFE utilisé comme signal fonctionnel.

Cette direction reprend la discipline de Linear sans emprunter son identité visuelle.

## Sources

1. Linear homepage, page officielle, consultée le 2026-07-23: https://linear.app/homepage
2. Linear Method, Principles & Practices, page officielle, consultée le 2026-07-23: https://linear.app/method/introduction
3. Feuille CSS publique `Hero.D42gc8OB.css`, consultée le 2026-07-23.
4. Feuille CSS publique `PageSection.BVMTzmaW.css`, consultée le 2026-07-23.
5. Feuille CSS publique `page.IOeHSWow.css`, consultée le 2026-07-23.
6. Feuille CSS publique `CTA.CDNJI-Em.css`, consultée le 2026-07-23.
7. Feuille CSS publique `Header.BReZm_YW.css`, consultée le 2026-07-23.
8. Feuille CSS publique `Grain.D_EBlr94.css`, consultée le 2026-07-23.
9. Application Linear authentifiée, vues d'accueil génériques, consultée en lecture seule le 2026-07-23.
