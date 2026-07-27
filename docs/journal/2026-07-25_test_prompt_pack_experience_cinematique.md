# 2026-07-25 — Test du « One-Prompt Website Pack » adapté à SAFE

## Ce qui a été testé

Le CEO a fourni un PDF (« Fable5-Higgsfield-Website-Prompt-Pack », Zubair Trabzada) : 10
prompts « site cinématique en une phrase » reposant sur le MCP Higgsfield (vidéos
Seedance 2.0) + un site scroll-scrub construit par Claude. Le prompt pertinent pour SAFE
est le **Prompt 08 · SaaS / Product Launch**. Objectif : l'adapter au contexte SAFE et le
tester réellement.

## Contraintes rencontrées (importantes pour les prochains tests)

1. **MCP Higgsfield absent** de la session : la génération Seedance du pack est
   impossible telle quelle.
2. **MCP Gemini présent mais inutilisable pour les médias** : le modèle vidéo
   (veo-2.0) renvoie 404 sur cette clé, et la génération d'images est en free tier avec
   quota 0 (gemini-3-pro-image). Aucune génération image/vidéo possible.
3. Le pane navigateur intégré se bloque sur cette page au scroll piloté (déjà noté le
   2026-07-25 pour l'expérience 3D). Playwright headless fait foi pour les captures.

## Adaptation retenue (plan C)

Le clip héros du Prompt 08 (« des particules s'assemblent en tableau de bord ») a été
rendu en **animation canvas générative pilotée par le scroll**, au lieu d'une vidéo :
scrubbable à la frame près, déterministe (aléatoire seedé), zéro crédit, et fidèle à
l'esprit « la page se construit pendant qu'on défile ».

Page livrée : `public/experience-cinema.html` (autonome, aucune dépendance npm, non liée
depuis le site, `noindex`).

### Structure (copywriting de la landing repris mot pour mot)

1. **Assembler** (héros épinglé 420vh) : papiers dispersés qui flottent, puis
   s'assemblent en maquette de tableau de bord SAFE pendant que le titre s'efface.
2. **Vérifier** : trois colonnes (relevé bancaire / registre du fidéicommis / soldes par
   dossier) ; une ligne ambre décalée revient en place et passe au vert, mention
   « Concordance ».
3. **Encaisser** : jetons heures/débours qui voyagent du dossier vers la facture, puis
   la facture glisse vers l'encaissement, cachet « Encaissé ».
4. **Collaborer** : les cartes de la Navette se rangent en file, la carte forêt « Pour
   l'avocat » apparaît.
5. Tarification réelle (Solo 99 $ / Cabinet 149 $), 3 questions réelles, CTA final.
   Aucune métrique inventée, aucune bande de logos (mode préchauffage).

### Écarts assumés avec le pack

- Fond albâtre au lieu du « near-black » du pack : la marque SAFE prime (anti-slop A1).
- Rail de progression discret (inspiré du Prompt 06) plutôt que HUD spectaculaire.
- Pas de compteurs animés de social proof : rien à afficher honnêtement en préchauffage.

### Design (base DESIGN_HUMAIN appliquée)

Tokens de la landing (albâtre/forêt/vert, Instrument Serif + Geist), texte de lecture à
gauche, centrage réservé au CTA final, nombres de tarifs alignés à droite (L2),
`prefers-reduced-motion` respecté (tout en état final, pas d'épinglage long). Checklist
anti-slop §10 passée : pas de dégradé violet, pas de glassmorphism, pas d'icônes
décoratives, copie concrète voix « vous », rayons différenciés.

## Vérification

Serveur dev 3010 + captures Playwright sur 12 arrêts de scroll, desktop 1440 et mobile
390. Console propre. Trois correctifs après première passe : texte héros fantôme derrière
le tableau assemblé, jetons superposés au départ du trajet Encaisser, carte « Pour
l'avocat » qui chevauchait la Navette.

## Verdict sur le prompt pack

- La valeur du pack est dans la **structure de brief** (shots → site → vérification),
  pas dans la magie : sans MCP média, le résultat reste atteignable en génératif codé.
- Le « hero-image trick » (référence d'image passée à chaque clip) reste la bonne idée à
  retenir si un MCP vidéo devient disponible un jour.
- Pour SAFE, la version canvas est probablement supérieure à une vidéo : scrub parfait,
  poids plume, cohérence de marque totale.

## Décisions ouvertes pour le CEO

- Cette page rejoint-elle l'expérience 3D dans un futur `/labs`, ou reste-t-elle une
  exploration ?
- Si un usage public est envisagé : porter en route Next et brancher les liens
  `/diagnostic` et `/demo` réels.
- Vouloir de la vraie vidéo générée implique de connecter un MCP média avec crédits
  (Higgsfield ou clé Gemini payante).

---

## Version 2 (même jour) — vraies captures + visuels réalistes + site complet

Retour CEO : garder le mouvement, mais remplacer l'abstrait par du réel, et étendre le
système à tout le site (menu, autres sections).

### Ce qui a changé

1. **Vraies captures de l'application** : connexion Playwright au cabinet test local
   (Cabinet Test / keassahatd+test@gmail.com, le formulaire exige le nom exact du
   cabinet), captures 2x de 5 écrans dans `public/experience-assets/`
   (tableau-de-bord, dossiers, comptabilite, facturation, navette), versions web JPEG
   1800px (~200 Ko) pour la page.
2. **Hero** : les papiers s'assemblent toujours, mais révèlent maintenant la vraie
   capture du tableau de bord (fondu synchronisé sur le cadre canvas, ratio 16:10).
   Mention « Capture réelle de SAFE » dans la légende.
3. **Menu fixe** (logo, ancres Le système / Vérifier / Encaisser / Collaborer /
   Tarification, CTA) + bande de preuves (4 items réels de la landing).
4. **Nouvelle section « Le système »** : copy réel de la landing + vraie capture de la
   liste des dossiers, révélation douce.
5. **Vérifier réaliste** : carte « Rapprochement à trois voies · juin 2026 » (les mêmes
   montants que la landing : 21 000 / 21 000 / 20 500). Au scroll : l'écart ambre tient,
   puis le montant compte de 20 500,00 $ à 21 000,00 $, la pastille passe au vert et la
   bannière bascule d'« Écart de 500 $ » à « Concordance ».
6. **Encaisser réaliste** : vraie facture (Facture 2026-041, Succession Tremblay ·
   Dossier 2026-014). Les jetons (temps approuvé, débours) volent dans la facture, les
   lignes se matérialisent, sous-total 3 200 $ puis TPS 160,00 $ / TVQ 319,20 $ / total
   3 679,20 $ comptent, cachet « Payée · 14 juin » en zone vide bas-gauche. Règles dures
   respectées : aucun numéro de Barreau, 2 couleurs (encre + vert).
7. Collaborer inchangé (validé par le CEO).

### Vérification v2

Playwright 12 arrêts desktop + mobile, console propre. Correctifs après captures :
trajectoire des jetons contenue dans la carte facture, cachet déplacé hors des montants.

### Notes pour la suite

- Les captures montrent les données de démonstration du cabinet test (mention en pied de
  page). Pour un usage public : refaire les captures sur un jeu de données plus riche et
  anonymisé, ou sur le cabinet vitrine.
- Le pane navigateur intégré reste inutilisable pour vérifier cette page (blocage au
  scroll piloté) ; Playwright headless fait foi.

---

## Version 3 (même jour) — maquette navigable + brassage au curseur

Retour CEO : dans « Chaque action garde son contexte », remplacer la capture des dossiers
par une fiche client navigable (entrer dans le dossier, voir le temps, tout ce qui montre
comment le dossier est rangé). Et dans le hero, pouvoir « mélanger » les papiers avec la
souris avant qu'ils s'assemblent.

### Ce qui a changé

1. **Maquette navigable** dans la section Le système (barre forêt « Maquette navigable ·
   cliquez », fil d'Ariane vivant) :
   - Écran 1 · fiche client fictive Marie-Claude Tremblay (coordonnées, soldes : à
     recevoir 0 $, en fiducie 2 225 $, dernier paiement 3 679,20 $), ses deux dossiers
     (2026-014 Succession actif, 2024-032 clôturé), activité récente.
   - Écran 2 · dossier 2026-014 avec cinq onglets : Aperçu (type, ouverture, 6,5 h,
     échéance 30 juin), Temps (4 entrées détaillées → total 6,5 h), Facturation (facture
     2026-041 payée), Fiducie (avance 2 500 $, débours -195/-80, solde 2 225 $),
     Documents (3 documents avec statuts). Retour « ← Fiche client », accessible clavier.
   - Toutes les données concordent avec les scènes Vérifier/Encaisser (même facture,
     mêmes débours, même solde fiducie). Mention honnête « Maquette navigable, données
     fictives ».
2. **Brassage au curseur** dans le hero : répulsion douce avec inertie et rappel
   élastique, amplifiée par la vitesse de la souris, qui s'éteint à mesure que chaque
   papier rejoint sa place (et coupée en `prefers-reduced-motion`).

### Vérification v3

Playwright : parcours cliqué réel (fiche client → dossier → onglets Temps/Fiducie →
retour), captures conformes, console propre (seul un avertissement CSP report-only du
serveur dev). Brassage vérifié par comparaison avant/après mouvements de souris.

---

## Version 4 (même jour) — adoption sur le site officiel (port 3001)

Validation CEO « au maximum ». Décisions d'intégration :

1. **La page d'accueil officielle `/` est maintenant l'expérience cinématique.**
   Port React fidèle du prototype dans
   `components/public-site/ExperienceCinema.tsx` (CSS préfixé `.xc`, polices du layout
   réutilisées, boucle rAF et écouteurs nettoyés au démontage). `app/page.tsx` branché
   dessus ; l'ancienne `HomePage.tsx` reste dans le repo, restaurable en une ligne.
   Liens réels : CTA → `/audit-gratuit` et `/demo`, sorties vers `/tarification`, `/faq`,
   pied de page avec Conditions/Confidentialité. Vérifié en Playwright sur
   `http://localhost:3001/` (serveur du CEO déjà actif, HMR) : scroll complet, maquette
   navigable, console propre.
2. **Série « même esprit » sur les autres pages, première livrée : `/fonctionnalites`.**
   `FeaturesPage.tsx` passe de tout-texte à alternance texte/visuel : captures réelles
   (comptabilité, facturation, dossiers) + figure animée de la feuille de temps du
   dossier 2026-014 (mêmes données que l'accueil). Révélations douces au scroll,
   légendes « Capture réelle de SAFE ». Vérifié sur 3001.
3. Le prototype `public/experience-cinema.html` reste en place comme banc d'essai.

### Reste de la série (à faire, ordre proposé)

- `/tarification` : ancrer chaque plan dans une preuve visuelle (la facture réaliste ?).
- `/demo` et `/audit-gratuit` : escalade de preuve avant le formulaire.
- `/a-propos`, `/faq`, `/contact` : passe légère (rythme, visuels réels au besoin).
- Harmoniser les deux navigations (l'accueil a sa barre propre, les pages internes ont
  la Nav partagée) : décision à prendre.

---

## Version 5 (même jour) — correction navigation + série complétée sur les pages internes

Alerte CEO : les sections Tarification, À propos, Contact et l'audit semblaient
« écrasées ». Diagnostic : rien n'était supprimé, mais le menu de la nouvelle page
d'accueil ne contenait que des ancres de scroll, plus aucun lien vers les pages du site.

### Corrections et livraisons

1. **Menu de l'accueil réparé** : liens réels (Fonctionnalités, Tarification, À propos,
   Contact, Connexion) + CTA diagnostic. Le repérage des scènes reste assuré par le rail
   de droite. Navigation vérifiée en clics réels (Tarification et audit atteints).
2. **/tarification** : nouvelle section « Compris dans les deux forfaits » (5 éléments)
   ancrée par la facture réaliste animée 2026-041 (lignes qui se posent, totaux, cachet
   Payée). Mêmes données que l'accueil.
3. **/a-propos** : histoire du fondateur avec entrée en scène paragraphe par paragraphe,
   et section finale « Aujourd'hui » avec la vraie capture du tableau de bord.
4. **/contact** (Démo) : étapes numérotées 01-04 avec entrée en scène, focus vert sur le
   formulaire, bande de preuves en pied.
5. **/audit-gratuit** : liens du menu corrigés (`/#produit` → `/fonctionnalites`,
   `/login` → `/connexion`, celui-là était un 404), palette crème (#F8F5EF/#E5E0D5)
   glissée vers l'albâtre du site (#EFF2ED/#D9DED8), formulaire non touché.

### Vérification v5

Playwright sur le port 3001 : les 7 routes publiques répondent 200, captures des 4 pages
retravaillées conformes, zéro erreur de page. Restent ouverts : harmonisation nav accueil
vs nav interne, et pied de page riche (PageShell) vs pied minimal de l'accueil.

---

## Version 6 (même jour) — fluidité, animation étendue, photos du fondateur

Retour CEO : défilement moins fluide, pas d'animation « 3D » sur les pages internes,
mettre en valeur deux photos du fondateur sur À propos.

### Ce qui a changé

1. **Fluidité** : la boucle de rendu de l'accueil ne dessine plus que les scènes proches
   du viewport (marge 300 px) et le canvas plafonne à 1,5x de densité de pixels.
   Mesure Playwright : 57 FPS pendant un scroll continu (headless).
2. **`PaperDrift`** dans `shared.tsx` : papiers flottants brassés par le curseur (même
   physique que le hero, sans assemblage), intégré au `PageHeader` partagé, donc actif
   sur toutes les pages internes (fonctionnalités, tarification, à propos, contact,
   FAQ). Dessin seulement quand visible, coupé en `prefers-reduced-motion`.
3. **À propos** : portrait du fondateur en colonne collante à droite du récit +
   photo « au travail » pleine largeur, avec repli silencieux (`onError`) tant que les
   fichiers ne sont pas déposés. Emplacements attendus :
   `public/images/fondateur/portrait.jpg` et `public/images/fondateur/travail.jpg`.
   ⚠️ Les photos fournies dans le chat ne sont pas récupérables comme fichiers : le CEO
   doit les déposer lui-même à ces deux chemins.

---

## Version 7 (même jour) — le prompt fondateur appliqué page par page

Demande CEO : réutiliser le prompt fondateur (scènes cinématiques scrubbées) pour les
autres pages, chacune selon sa philosophie, et intégrer les photos du fondateur.

### Moteur partagé

`shared.tsx` expose maintenant `useScrollScrub(zoneRef, onFrame)` (progression amortie
d'une zone épinglée, mêmes courbes que l'accueil, DOM piloté sans re-render, coupé hors
viewport et en motion réduit) + les utilitaires `scenePhase`/`easeOutCubic`/`easeInOutQuad`.

### Scènes par philosophie

- **/fonctionnalites** (« l'information suit le travail ») : scène épinglée
  « Certification des rapprochements 2026 » (les mois se certifient au scroll, mai reste
  bloqué en ambre puis se corrige, bannière « six périodes complètes ») + scène épinglée
  « Temps au dossier » (les entrées se notent, le total se construit 0 → 6,5 h).
  Facturation et Dossiers restent en captures réelles.
- **/tarification** (« un prix clair ») : scène épinglée « Ce que vous ne verrez pas
  ici » : cinq frais habituels du marché apparaissent, se barrent et s'effacent, il
  reste la carte « 99 $ / mois · configuration comprise », légende Solo/Cabinet.
- **/a-propos** (« l'histoire vraie ») : scène épinglée « SAFE se construit au contact
  du vrai travail de cabinet » : la photo du fondateur au travail se révèle en zoom
  parallaxe, la phrase clé s'écrit.

### Photos du fondateur

- Les deux photos collées dans le chat ne sont pas récupérables comme fichiers.
- Trouvé et utilisé en attendant : `IMG_0196_linkedin.png` (fondateur au portable),
  redressée (rotation 270° après un premier passage sips resté couché) et optimisée →
  `public/images/fondateur/travail.jpg`. À remplacer par la photo du chat si préférée.
- Le portrait (`public/images/fondateur/portrait.jpg`) reste attendu ; la colonne
  collante d'À propos s'affichera dès dépôt du fichier.
- ⚠️ `~/Downloads/IMG_0828.jpg` est un document d'identité : jamais utilisable sur le
  site, non copié, non touché.

### Vérification v7

Playwright sur 3001 : scènes des trois pages capturées à plusieurs arrêts, zéro erreur
de page, photo redressée confirmée à l'écran.

---

## Version 8 (même jour) — À propos en défilé storytelling, galets, offre fondatrice refondue

### 1. Nouvelle offre fondatrice, propagée dans tout le système (décision CEO)

Ancienne offre supprimée partout : plus de 12 mois gratuits, plus de tarif « gelé à vie »,
plus de paiement unique 5 000 $, plus de formule annuelle 500 $.

**Nouvelle règle** : première année à tarif fondateur, puis tarif régulier.
- Solo : 50 $/mois pendant 12 mois, puis 99 $/mois.
- Cabinet : 100 $/mois pendant 12 mois, puis 149 $/mois.

Source de vérité `lib/tarification.ts` → `fondateurs: { placesPrises, placesTotal,
dureeMois: 12, premiereAnneeSolo: 50, premiereAnneeCabinet: 100 }`. Les champs
`moisGratuits`, `abonnementVie`, `abonnementAnnuel`, `prixRegulierBarre`,
`prixRegulierAnnuelBarre` sont supprimés.

Fichiers réalignés : `lib/tarification.ts` (constantes + 2 FAQ),
`components/tarification/TarificationContent.tsx` (offre, avantages, partenariat),
`TarificationDashboardWidget.tsx`, `components/audit-report/pages/OffrePage.tsx`
(rapport d'audit PDF), `components/landing/FoundingOffer.tsx`,
`components/landing/preview/OffrePreview.tsx`, `FinalCta.tsx`,
`preview/CtaFinalPreview.tsx`, `components/public-site/PricingPage.tsx`.
Vérifié : `grep` des anciennes formulations ne retourne plus rien, `tsc --noEmit` propre.
⚠️ Reste à réviser hors code : `docs/marketing/` et la mémoire `project_pricing_model`.

### 2. À propos entièrement refaite en défilé storytelling

Plus de sections empilées : une seule zone épinglée de 700vh, sept chapitres qui se
succèdent au scroll, l'histoire commence par le fondateur.
1. « J'ai créé SAFE parce qu'un cabinet méritait mieux qu'un système manuel »
2. Avant SAFE, un cabinet en Ontario → 3. Tout était dispersé → 4. Rien ne gardait le fil
5. « C'est pour répondre à ce problème que j'ai créé SAFE » (pivot)
6. Relier ce qui était dispersé → 7. SAFE ne remplace pas la personne qui connaît le cabinet
Signature finale + compteur de chapitre 01/07.

Canvas synchronisé : galets en chaos agité → file en chaîne avec un maillon décroché en
ambre → système relié (cœur + 5 satellites orbitants). La photo du fondateur apparaît en
présence flottante bordée de vert (effet hologramme) au chapitre 1 et au pivot.
La section « SAFE ressemble à ceci » a été supprimée comme demandé : la page ne parle
que du fondateur et de l'histoire.

### 3. Autres ajustements

- `PaperDrift` remplacé : les bouts de papier deviennent des **galets** (motif du logo
  SAFE), teintes forêt/vert/gris, respiration lente, toujours brassables au curseur.
- Scène tarification agrandie : pastilles de frais plus grosses (17 px), scène plus haute,
  carte de prix 460 px avec le montant en 64 px.
- Photo : `IMG_0196_linkedin` redressée reste en place. ⚠️ Les photos du chat (studio,
  chandail noir) ne sont toujours pas récupérables comme fichiers : à déposer dans
  `public/images/fondateur/` pour remplacer.

### Vérification v8

`tsc --noEmit` sans erreur ; Playwright sur 3001 : 7 arrêts d'À propos (chapitres,
transition chaîne → système, hologramme, signature), scène tarification agrandie, offre
fondatrice à jour, en-têtes galets. Zéro erreur de page.

---

## Version 9 (même jour) — triangles du logo, correctifs, indicateurs de défilement

Retours CEO sur la v8 : remplacer les cercles par les triangles du logo qui s'assemblent
en logo 3D au moment « j'ai créé SAFE » ; l'assemblage était flou et le mot SAFE mal
aligné ; supprimer la phase où les triangles s'agitent ; montrer une image de système ;
ajouter des indicateurs de défilement ; introduction sur la première diapo ; récit complet
reconstitué à la fin.

### Ce qui a changé sur /a-propos

1. **Triangles du logo** : les 18 pièces sont désormais les chevrons officiels
   (`UPPER_PATH` / `LOWER_PATH` de `components/branding/SafeLogo.tsx`, viewBox 24×24)
   tracés en `Path2D` sur le canvas. Plus de cercles.
2. **Flou corrigé** : l'extrusion 3D était appliquée *à l'intérieur* du `ctx.scale()`,
   donc multipliée par ~15 (d'où la traînée de 60 px). Elle est maintenant calculée en
   pixels écran, 7 copies serrées → logo net avec une vraie épaisseur.
3. **Mot SAFE aligné** : centré sur l'axe du logo, posé sous lui
   (`coreY + logoScale * 13`), lettres qui se resserrent en arrivant, disparition
   complète quand le système se forme.
4. **Agitation supprimée** : la dispersion est un flottement lent et régulier ; le
   multiplicateur d'agitation du chapitre 3 est retiré.
5. **Image du système** : après le logo, cinq modules étiquetés (Fidéicommis, Dossiers,
   Temps, Facturation, Conformité) sortent du cœur et s'y relient par des fils verts.
6. **Indicateurs de défilement** : « Faites défiler » animé au départ, rail de 7 pastilles
   à droite (chapitre actif en vert), barre de progression fine en bas.
7. **Introduction** sur la première diapo (plus de titre seul) et **récit complet
   reconstitué** en section lisible après le défilé, signature comprise.

### Photo du fondateur

Recherche exhaustive du disque (Téléchargements, Bureau, Images, dossiers temporaires,
conteneurs d'applications) : la photo envoyée dans le chat n'existe nulle part comme
fichier. Les seules images récentes trouvées sont des médias WhatsApp privés, non
ouverts. La page utilise donc toujours `IMG_0196_linkedin` redressée. Pour la remplacer :
déposer le fichier à `public/images/fondateur/travail.jpg`.

### Vérification v9

`tsc --noEmit` propre ; Playwright sur 3001, 11 arrêts : dispersion calme, chaîne cassée,
assemblage net du logo 3D, mot SAFE aligné, système relié, récit final. Zéro erreur.

---

## Version 10 (même jour) — le vrai récit de la naissance de SAFE

Retour CEO : le récit était trop résumé et l'ouverture vide. Il fallait raconter la
véritable histoire, ralentir le défilé, enrichir les transitions, montrer le classeur
Excel des débuts, présenter le logo avec le mot SAFE sur la même ligne, puis le voir
rétrécir pour laisser apparaître l'ébauche de l'application.

### Le récit réel, désormais écrit (9 chapitres)

1. Comment SAFE est né (visible dès l'ouverture, plus d'écran vide)
2. J'ai vu le problème de l'intérieur (photo du fondateur)
3. Le temps partait dans la mécanique
4. Trente minutes pour une seule facture
5. J'ai d'abord proposé un outil existant : QuickBooks en ligne, trop générique pour un
   cabinet d'avocats et trop compliqué au quotidien
6. Alors j'ai décidé de bâtir le mien
7. SAFE a commencé dans un classeur Excel
8. Puis le classeur est devenu un système
9. Aujourd'hui, SAFE est un logiciel web

Suivi de l'avant/après (30 min → facture préparée) et du récit complet en 9 paragraphes,
avec la photo du fondateur en colonne collante.

### Nouvelles scènes canvas

- **Classeur Excel** : feuille blanche, entête A→F, quadrillage, cellules qui se
  remplissent ligne par ligne, quelques valeurs en ambre (le désordre d'origine).
- **Décollage** : les cellules quittent la grille et convergent vers le centre.
- **Logo + mot SAFE sur la même ligne** : verrouillage typographique propre (mark de
  17 unités, mot à ~40 % de la hauteur du mark, gouttière proportionnelle), extrusion en
  pixels écran, temps de pose avant la suite.
- **Rétrécissement → application** : le logo se réduit et remonte, une fenêtre
  d'application se dessine dessous (barre forêt, trois cartes d'état, courbe verte).

### Rythme et transitions

- Zone épinglée portée à **1600vh** pour 9 chapitres (~175vh par chapitre) : on a le
  temps de lire.
- Fondus **séquentiels** : le chapitre sortant est parti avant que l'entrant arrive
  (plus de textes superposés, défaut constaté en v10a).
- Entrées avec flou léger qui se dissipe + translation verticale.

### Correctifs

- Logo dessiné en double (pièces « gardées » + bloc assemblé) : les pièces se fondent
  toutes à l'arrivée, seul le bloc assemblé subsiste.
- Mot SAFE qui débordait de l'écran (font-size = 17 × échelle du logo, soit ~245 px) :
  ramené à 9 × l'échelle, lockup complet centré.

### Photo

Toujours `IMG_0196_linkedin` redressée : la photo du chat reste inaccessible comme
fichier. Le CEO la fournira ; un seul remplacement de
`public/images/fondateur/travail.jpg` suffira (elle est utilisée aux deux endroits).

---

## Version 11 (2026-07-26) — les captures figées deviennent des maquettes manipulables

Demande CEO : partout où le site montre une capture d'écran de SAFE, la remplacer par
une maquette interactive, dans l'esprit de la fiche client navigable de l'accueil. Et
renforcer les affordances pour que le visiteur comprenne qu'il peut manipuler.

### Nouvelle bibliothèque `components/public-site/mockups.tsx`

Quatre maquettes réutilisables, plus un cadre commun `SafeWindow` qui porte toujours la
mention « Maquette » avec une pastille pulsante, et un `IndiceEssai` qui dit quoi essayer.

1. **`MockupFicheDeTemps`** — réellement saisissable. Le visiteur écrit une tâche, choisit
   un dossier, entre une durée, clique « Ajouter ». L'entrée apparaît en haut de la liste
   avec une animation, les trois totaux (temps non facturé, heures, total à facturer) se
   recalculent, puis « Préparer la facture » bascule tout en facturé. Bouton de
   réinitialisation.
2. **`MockupTableauDeBord`** — les quatre cartes sont des boutons. Un clic ouvre un
   panneau qui explique le chiffre. La carte Fidéicommis propose « Rapprocher le
   fidéicommis », qui passe la carte de « À rapprocher » à « Rapproché ».
3. **`MockupRapprochement`** — l'écart de 500 $ en ambre, un bouton « Corriger l'écart »
   qui fait passer la pastille au vert et débloque la certification. Réversible.
4. **`MockupDossier`** — fiche client → dossier avec cinq onglets (Aperçu, Temps,
   Facturation, Fiducie, Documents) et retour. Le bouton « Ouvrir » est une pastille
   verte pleine sur une ligne bordée de vert : impossible à rater.

Aucune donnée réelle, aucun appel réseau, tout est fictif et annoncé comme tel.

### Remplacements effectués

- **/a-propos** : la capture du tableau de bord devient `MockupTableauDeBord` ; la capture
  Temps devient `MockupFicheDeTemps`. Le « avant » utilise désormais la **vraie capture du
  classeur Excel** fournie par le CEO (`public/experience-assets/excel-avant.jpg`), qui
  remplace automatiquement la reconstitution.
- **/fonctionnalites** : la capture Facturation devient `MockupTableauDeBord`, la capture
  Dossiers devient `MockupDossier`. Les scènes épinglées Fidéicommis et Temps restent.
- **Accueil** : la ligne ouvrable de la maquette est maintenant bordée de vert, sur fond
  teinté, avec un bouton vert plein « Ouvrir → » qui glisse au survol. La mention d'entête
  a une pastille pulsante et la légende invite explicitement à ouvrir le dossier.

### Photo du fondateur

Récupérée dans la capture d'écran du Bureau du CEO, recadrée 4:5, 1200×1500, 535 Ko →
`public/images/fondateur/portrait.jpg`. Note de méthode : une capture d'écran déposée sur
le Bureau est le moyen fiable de me transmettre une image ; les images collées dans la
conversation ne sont pas des fichiers.

### Vérification v11

`tsc --noEmit` propre. Parcours Playwright réel : saisie « Préparation de l'audition ·
3,25 h » → l'entrée apparaît et le total passe à 2 767,50 $ (assertion automatisée sur
« 3,25 h ») ; clic sur la carte Fidéicommis → panneau ouvert → « Rapprocher » → carte
« Rapproché » ; ouverture du dossier → onglet Fiducie → solde 2 225,00 $. Zéro erreur.
Un correctif après capture : le formulaire de saisie débordait de sa colonne, passé en
deux rangées avec `min-w-0`.

---

## Version 12 (2026-07-26) — page Fonctionnalités refondue autour de la conformité

### Recherche réglementaire (importante, à retenir)

Vérification web du plafond d'espèces, sources officielles. **Les deux barreaux ne
fonctionnent pas de la même façon** :

- **Ontario, LSO By-Law 9** : interdiction de recevoir, pour un même dossier client, des
  espèces dont le total est *supérieur* à 7 500 $ CA. 7 500 $ pile reste permis.
- **Québec, RLRQ c B-1 r 5 art. 71** : pas une interdiction. Recevoir 7 500 $ ou plus en
  espèces pour un même mandat déclenche une **déclaration obligatoire** au directeur de
  la Qualité de la profession, dans les 30 jours, avec copie des reçus. Interdiction
  absolue seulement dans des cas précis (règlement hors cour non entériné, achat
  immobilier, opérations commerciales).

**Écart produit constaté** : `lib/services/fideicommis/trust-transaction-service.ts`
bloque « 7 500 $ ou plus » pour les deux provinces. Trop strict en Ontario (7 500 $ pile)
et faux au Québec (blocage au lieu de déclaration). Tâche de correction créée avec les
tests attendus. **Aucune affirmation publique sur la différence QC/ON tant que ce n'est
pas corrigé** : la page parle donc du « plafond applicable », sans nommer de régime.

### Trois nouvelles maquettes

- `MockupDepotConforme` : le visiteur entre un montant. Au-delà du plafond, l'écriture est
  refusée en ambre avec la règle citée ; en deçà, le dépôt est enregistré avec reçu et
  écriture au registre.
- `MockupEnvoiFacture` : clic sur « Envoyer la facture au client », puis les quatre
  écritures (produit, TPS, TVQ, créance) s'inscrivent une à une.
- `MockupCartable` : sélecteur de domaine (famille, criminel, immobilier), le cartable se
  remonte section par section avec ses sources, puis dépôt d'une pièce qui se classe.
  Sections tirées du vrai `lib/dossiers/cartable-templates/index.ts`.

### Nouvel ordre de la page

Sommaire cliquable en tête, puis : 01 la conformité par conception · 02 le dossier arrive
structuré · 03 le temps (chronomètre + forfait) · 04 la facturation qui écrit la
comptabilité · 05 les rappels après approbation · 06 les dossiers. Clôture « ce que SAFE
ne remplace pas » + mention que les écrans sont des maquettes sur données fictives.

Accroche de page : « SAFE fonctionne comme l'assistant de votre adjointe. Ou comme votre
adjointe, si vous n'en avez pas. »

### Vérification v12

`tsc --noEmit` propre. Playwright : dépôt de 8 000 $ refusé puis 2 000 $ accepté, cartable
qui bascule sur le droit criminel (phase préjudiciaire), envoi de facture qui passe les
quatre écritures. Zéro erreur de page.

---

## Version 13 (2026-07-26) — passe téléphone sur tout le site public

Audit Playwright à 390 × 844, DPR 2, mode tactile, sur les cinq pages publiques.
Trois familles de mesures automatisées : débordement horizontal, textes sous 11 px,
cibles tactiles sous 36 px. Filtre de visibilité ajouté au script pour écarter les faux
positifs (rails masqués en CSS mais présents dans le DOM).

### Résultat de l'audit initial

- **Aucun débordement horizontal** sur aucune page. C'était le risque principal, il
  n'existait pas.
- Textes sous 11 px : libellés des maquettes, indices de défilement, numéros de section.
- Cibles tactiles sous 36 px : champs de saisie à 34 px, liens de pied de page à 18 px.
- Défaut visuel majeur non détectable par mesure : **la capture du classeur Excel,
  écrasée à 390 px de large, devenait illisible**.

### Correctifs

1. **Classeur Excel** : sur téléphone, l'image passe à 780 px de large dans un rail à
   défilement horizontal, avec la mention « Faites glisser pour parcourir le classeur ».
   On garde la lisibilité et l'effet de preuve au lieu d'une vignette illisible.
2. **`StylesMaquettesMobiles`** dans `mockups.tsx` : sous 860 px, toute cible tactile des
   maquettes passe à 44 px minimum, les champs à 16 px de police (évite le zoom
   automatique d'iOS), les tableaux à 12,5 px, et les micro-libellés marqués `mock-mini`
   remontent à 11 px.
3. **Pied de page** : liens à 40 px de hauteur tactile sur téléphone, espacement adapté.
4. **Sommaire de Fonctionnalités** : pastilles à 40 px de haut sur téléphone.
5. **Page d'accueil** : libellés de la maquette, indice de défilement et étiquettes de la
   Navette remontés à 11 px ; bouton « Ouvrir » à 44 px.
6. **Scène de bascule d'À propos** : réserve verticale ajustée sur téléphone (62vh) pour
   supprimer le vide sous le contenu.

### Vérification finale

Audit relancé : **zéro alerte** sur les cinq pages. Longueurs de défilement mesurées :
accueil 16 écrans, fonctionnalités 11, à propos 9, tarification 9, contact 3.

### Point ouvert

L'accueil fait 16 écrans de haut sur téléphone, à cause des quatre zones épinglées.
C'est long. Piste si le CEO le souhaite : raccourcir les zones épinglées sous 860 px
(elles sont déjà réduites, on peut aller plus loin) ou ne garder que deux scènes
épinglées sur téléphone et présenter les deux autres en sections normales.
