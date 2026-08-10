# 2026-07-26 — Le diagnostic passe à la DA du site, avec la grammaire du prompt pack

## Demande CEO

Le CEO dépose `Fable5-Higgsfield-Website-Prompt-Pack.pdf` (Zubair Trabzada, 10 prompts
« one-prompt website », éd. 2026) : c'est le prompt qui a servi à créer l'expérience
interactive de l'accueil. Demande : adapter ce même prompt au formulaire de diagnostic,
et refaire l'interface dans la nouvelle DA du site.

## Lecture du pack

Le pack repose sur des clips vidéo générés par IA (Seedance 2.0 via le MCP Higgsfield)
que le scroll vient scruber. SAFE n'en a pas besoin : le produit existe, on a de vraies
captures et un canvas. Ce qui se transpose, c'est **la grammaire du scroll**, pas la vidéo.

Six dispositifs retenus, documentés dans
[DIRECTION_DIAGNOSTIC_CINEMATIQUE.md](../design/DIRECTION_DIAGNOSTIC_CINEMATIQUE.md)
avec le prompt réécrit pour le diagnostic :

1. Hero épinglé scrubbé (prompts 01, 08)
2. Indicateur de progression fixe qui nomme chaque étape franchie (prompt 06)
3. HUD de coin qui grimpe avec la progression (prompt 07)
4. Une idée par palier, copy éparse (prompts 09, 10)
5. Un seul système visuel de bout en bout (pro tips)
6. Vérifier sur localhost avant de dire terminé

Écartés : le noir + néon, la type brutaliste, les clips IA.

## Ce qui a été fait

### Entrée du diagnostic — `app/audit-gratuit/page.tsx`

Réécrite. L'ancien écran était une carte centrée avec trois tuiles et un bouton, puis un
second écran pour la langue. Devient une scène épinglée de 420 vh :

- surtitre mono, titre serif « Ce que votre cabinet laisse passer. », phrase de contexte ;
- les trois promesses arrivent une par une, chacune précédée d'un filet qui se trace ;
- le choix de langue arrive en fin de scène, plus d'écran séparé ;
- triangles du logo qui dérivent en fond, brassables au curseur ;
- indicateur « Faites défiler » qui s'efface dès le premier mouvement ;
- en-tête fixe au filet du site public, menu restylé.

Version empilée sans animation pour `prefers-reduced-motion` : la scène épinglée
superpose ses blocs, elle n'a aucun sens sans le défilement.

### Questionnaire — `components/audit-gratuit/AuditForm.tsx`

- **Rail de sections** à droite : un tiret par section, celui en cours s'allonge et se
  nomme, les sections franchies restent vertes. Caché tant que le questionnaire n'a pas
  démarré, caché sous 1100 px.
- **Compteur d'avancement** en mono tabulaire (pourcentage en gros, étape sur total,
  minutes restantes) plus un filet vert d'un pixel, à la place de la grosse barre à
  dégradé et brillance.
- **Carte de question** : le disque « JT » répété à chaque question disparaît. À la place,
  surtitre de section à gauche, position à droite, question en serif 30 px.
- **Carte fondateur** : passe de centrée à alignée à gauche, disque forêt, chiffres en mono.
- **Fin de section** : les deux anneaux pulsants et le disque à dégradé sont remplacés par
  un aplat forêt, le numéro, un tiret qui se trace, le nom de la section.
- **Rapport** : indicateurs et prix en mono, offre sur aplat forêt.
- Transitions de question : 380 ms → 550 ms, décalage horizontal 48 px → 30 px.

Le questionnaire (`lib/audit-gratuit/questions.ts`), la validation, la recommandation et
l'appel API n'ont pas bougé.

### Jetons — `app/globals.css`

Le bloc `audit-v2-*` est réécrit sur les jetons du site public. Les noms de classes sont
conservés pour ne rien casser ailleurs.

- fond : deux dégradés radiaux empilés → aplat `#EFF2ED` ;
- cartes : blanc + double ombre → `#FBFCFA`, filet à 8 %, une seule ombre douce ;
- option retenue : vert d'accent → vert forêt `#1F3A2E` (l'accent reste pour le CTA) ;
- suppression du lift au survol et de l'animation `mark-glow` ;
- transitions 180 ms → 320-340 ms ;
- ajout du rail `.audit-rail-*`.

## Vérification

- `tsc --noEmit` propre, `next lint` propre sur les trois fichiers.
- Page servie sans erreur console.
- **Vu à l'écran** : le premier état de la scène d'entrée (surtitre, titre serif sur trois
  lignes, phrase de contexte, triangles du logo, « Faites défiler »), et l'entrée du
  questionnaire (en-tête fixe, carte fondateur alignée à gauche, chiffres en mono, rail
  de droite avec « IDENTIFICATION » allumé en vert et les cinq autres tirets courts).
- Un défaut corrigé en cours de route : le `max-w` en `ch` était posé sur le conteneur du
  titre au lieu du titre lui-même, ce qui coupait le h1 à dix caractères par ligne.
- Vérifié dans le DOM : les trois promesses et le panneau de départ montés, le rail masqué
  à l'intro puis section 1 allumée au démarrage (tiret 26 px, étiquette à 1), compteur à 03 %.
- **Pas vu à l'écran** : la suite du défilement de la scène d'entrée, le passage d'une
  question à l'autre, la progression du rail sur les six sections, l'écran de fin de
  section et le rapport. Le panneau d'aperçu se masque à chaque défilement
  (`visibilityState` « hidden », `innerHeight` à 0) : captures blanches, `rAF` gelés, et
  `AnimatePresence` en `mode="wait"` qui ne démonte jamais la carte sortante. Rien de cela
  n'affecte un onglet normal, mais je n'ai pas pu le confirmer moi-même.

  À regarder sur `localhost:3001/audit-gratuit`.

## Fichiers touchés

- `app/audit-gratuit/page.tsx` (réécrit)
- `components/audit-gratuit/AuditForm.tsx`
- `app/globals.css` (bloc diagnostic)
- `docs/design/DIRECTION_DIAGNOSTIC_CINEMATIQUE.md` (nouveau)
