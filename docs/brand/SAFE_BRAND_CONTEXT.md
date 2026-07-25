# SAFE — Pack de contexte marque et produit

> **À l'usage d'un assistant IA externe (ChatGPT, Claude, etc.).**
> Ce document est autoportant. Collez-le en début de conversation pour travailler sur le
> **logo** et la **présentation** de SAFE. Vous n'avez pas besoin du code source : tout ce
> qui compte pour le branding et la présentation est ici, tiré du vrai code de l'app.
>
> Règles à respecter par l'assistant : voix « vous », français québécois, jamais de tiret
> long (—) en milieu de phrase, ton calme et sobre, aucune esthétique « IA générique »
> (voir la section Anti-patterns). Toujours partir du problème du client, jamais du produit.

---

## 1. SAFE en une phrase

SAFE est un logiciel de gestion de cabinet d'avocats (Québec et Ontario) qui automatise
l'administration, tient le fidéicommis sans erreur et remet les finances du cabinet en ordre.
Stack : application web (Next.js). Une version mobile compagnon est envisagée (PWA, pas natif).

## 2. Utilisateurs et positionnement

- **Deux utilisateurs.** L'avocat·e (voit le risque, l'argent, les échéances) et l'adjoint·e
  (prépare, classe, relance).
- **Thèse maître : « le copilote du copilote ».** SAFE ne remplace pas l'assistant·e ;
  l'assistant·e est le copilote de l'avocat, et SAFE est le copilote de l'assistant·e.
  Adoption bottom-up : l'adjoint·e convainc l'avocat.
- **Messages par audience.** À l'avocat : le risque et l'argent. À l'adjoint·e : la
  valorisation et la sécurité. Le client est toujours le héros, jamais le produit.
- **Angle de valeur central** : arrêter la « fuite de revenus » (heures non facturées,
  factures envoyées en retard, trésorerie immobilisée) et sécuriser la conformité au Barreau.

## 3. Voix et ton

- Français québécois, vouvoiement systématique, tournures impersonnelles possibles.
- **Jamais de tiret long (—) en milieu de phrase.** Virgule, deux-points, ou deux phrases.
  (Exception : tirets décoratifs de type « — 01 ».)
- Ton calme, direct, noble. Pas de survente, pas de points d'exclamation.
- Pas de jargon : bannir « plateforme », « workflow », « solution », « leverage ».
- Verbes d'action en tête (« Valider », « Rapprocher », « Envoyer »).
- Preuve avant tout : on montre que ça marche (chiffres réels, démo), on ne le décrit pas.
  Pendant la phase actuelle, aucun faux avis, faux logo ou faux témoignage.

## 4. Le logo actuel

- **Nom interne** : « Le Chevron » (aussi appelé « Les Galets »).
- **Forme** : deux galets/chevrons arrondis (courbes de Bézier) qui **convergent**. Le galet
  supérieur pointe vers le bas (plein), le galet inférieur pointe vers le haut (même vert, à
  55 % d'opacité). Lecture symbolique : une base humaine + une couche d'automatisation qui se
  rejoignent. Dessiné en SVG inline, `viewBox 0 0 24 24`.
- **Couleur de la marque** :
  - sur fond clair : vert forêt `#1F3A2E`
  - sur fond sombre : vert clair `#8FB49F`
  - mono : encre `#1C1C1C` ou blanc `#FFFFFF`
- **Pastille** qui entoure la marque : fond `#EEF5F0` (clair) ou `#0E2419` (sombre), coins
  arrondis 10 px.
- **Mot-symbole** : « SAFE » en **Instrument Serif** (serif éditorial), taille ~22 px,
  interlettrage léger `0.01em`. Couleur `#111111` sur clair, `#E8F0EA` sur sombre.
- **Fichiers de référence** : `components/branding/SafeLogo.tsx` (source vivante),
  `public/safe-logo-fonce.svg` (géométrie de référence), et d'anciennes pistes en image :
  `public/safe-logo-concept-1*.png`, `public/images/safe_logo_3d.*`,
  `public/images/safe-mark-s.png` / `safe-mark-s-green.png`.
- **Piste ouverte pour la réflexion** : le logo actuel est abstrait (galets/chevrons). Une
  direction d'identité « gravure de presse fine » existe en parallèle (voir section 8) et
  pourrait nourrir un logo plus signé (sceau, balance stylisée). À explorer.

## 5. Systèmes de couleurs

SAFE a deux surfaces de couleur qui coexistent, à connaître pour ne pas les mélanger.

### A. Landing actuelle (la plus récente) — « clair verdâtre »
- Canevas `#EFF2ED` (blanc verdâtre), surface `#FBFCFA` (albâtre quasi blanc).
- Encre froide `#1F2A24`. Texte atténué `#5A665F`, très atténué `#7C877F`.
- Accent d'action vert frais `#12A150`. Vert « vérifié » plus sobre `#2E7D5B`.
- Ambre d'attention (encre) `#B07A1C`.
- Règle d'or : **une seule couleur qui vit, le vert, réservée à l'action et au « vérifié ».**
  Tout le reste est encre sur crème. La rareté du vert fait la crédibilité.

### B. Intérieur de l'app (design « éditorial chaleureux », source `lib/ds/tokens.ts`)
- Canevas ivoire chaud `#F7F2E8`, cartes crème `#FCFAF4`, barre latérale sable `#E8DCC4`.
- Encre `#0B0B0C`. Vert forêt canonique `#1F3A2E` (accent, liens actifs).
- Or chaud `#F4A045` utilisé avec parcimonie (chiffres urgents sur cartes noires).
- Statuts : succès vert `#1F3A2E`, attention `#8B6B1F`, danger `#8A3A2D`, info `#4A4561`.

> Note pour l'assistant : la landing tend vers A (clair verdâtre), l'app vers B (ivoire chaud).
> Un chantier d'unification est en cours. Pour le logo et la présentation, privilégier A.

### C. Identité illustrée « parchemin / gravure » (voir section 8)
- Encre `#1F2A24`, accent vert émeraude `#2E7D5B` (uniquement sur l'élément d'action),
  parchemin crème `#EDE6D4`.

## 6. Typographie

- **Titres, display, grands chiffres, numéros de section** : Instrument Serif (serif
  éditorial). Variable CSS `--font-instrument-serif`. Italique réservé à l'accent (le mot
  vert d'un titre, les sous-titres « — registre en temps réel »).
- **Interface, corps, chiffres KPI** : Geist Sans. Variable `--font-geist-sans` (attention,
  un alias trompeur `--font-inter` charge en réalité Geist).
- **Chiffres tabulaires, références, n° de facture, dates** : Geist Mono `--font-geist-mono`.
- Règles : le serif jamais sous 20 px, une seule graisse. Étiquettes de section en petites
  capitales espacées (`letter-spacing 0.08em`). Chiffres d'argent toujours tabulaires.

## 7. Formes, ombres, mouvement

- Rayons : boutons/inputs 6 px, `lg` 8 px, cartes 12 px, cartes élevées 16 px. La direction
  éditoriale récente pousse vers des **coins plus carrés (2 px)** pour un registre « imprimerie ».
- Ombres : quasi invisibles, ce sont les filets et bordures qui font le travail. Pour un
  produit encadré premium, une ombre douce **teintée forêt** (`0 40px 80px -44px rgba(11,31,25,.5)`).
- Mouvement : discret. Durées 120–260 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`. Jamais de
  particule ni d'effet spectaculaire. Une coche verte qui se pose, un fondu au même endroit.

## 8. Identité illustrée (gravure sur parchemin)

Direction de marque distinctive à développer, inspirée du registre « presse fine »
(New Yorker / Financial Times) transposé au droit.

- **Charte** : illustration éditoriale au trait, dessinée main, style gravure moderne. Trait
  fin d'épaisseur unique + hachures fines pour les ombres. Encre `#1F2A24` (jamais noir pur).
  **Un seul** accent vert émeraude `#2E7D5B`, uniquement sur l'élément d'action (le sceau, le
  cadenas, le tampon). Halo vert diffus derrière le sujet. Fond parchemin `#EDE6D4` à grain
  léger. Composition centrée, aérée, calme, noble. Zéro texte ni logo dans l'illustration.
- **Objets récurrents** : balance de justice, encrier double godet, plume, registre relié,
  sceau de cire vert.
- **Scènes prévues** (banque d'illustrations) : nature morte héros (balance + encrier + plume
  + registre + sceau), mise en ordre par l'adjoint·e, conformité qui veille, paiement qui
  rentre, fidéicommis protégé (coffre + cadenas vert).
- **À éviter** : néon, dégradés criards, clip-art corpo, stock, brillance, vert menthe « fun tech ».
- **Le principe pour la présentation** : le produit se pose sur une matière parchemin (comme
  Combo pose ses captures sur des toiles peintes), pas nu dans un cadre blanc.

## 9. La présentation (landing) actuelle

Ordre des sections de la page d'accueil (source `app/page.tsx`) :
1. Navbar (barre claire, méga-menu « Produit »)
2. Hero — « Votre cabinet, toujours en ordre. » + double CTA (audit gratuit / vidéo 3 min)
3. ProblemSection — les irritants du cabinet
4. NotYourFault — « ce n'est pas votre faute »
5. VirtualEmployees — les automatisations comme des « employés »
6. PourLadjointe — le message adressé à l'adjoint·e
7. FeaturesGrid — grille de fonctionnalités
8. ProduitEnVrai — le produit montré réellement
9. Objections — réponses aux objections
10. ProcessTimeline — comment ça marche
11. PricingGrid — prix publics + audit gratuit
12. FoundingOffer — offre fondatrice
13. FinalCta + Footer

**Promesse Hero** : « Votre cabinet, toujours en ordre. » (mot final fixe, sans rotation).
Sous-titre : automatiser l'administration, tenir le fidéicommis sans erreur, reprendre le contrôle.
Repères de confiance honnêtes : « Conçu au Québec · Conforme B-1 r.5 · Données au Canada ».

**Structure de l'offre** :
- Prix publics : Solo 99 $/mois, Cabinet 149 $/mois, configuration incluse (pas de frais de setup).
- Offre fondatrice : 5 places, 12 mois gratuits, puis tarif gelé à vie au choix
  50 $/mois **ou** 500 $/an (2 mois offerts). Entrée principale = l'audit gratuit.

## 10. Conformité et contraintes de marque (dures)

- Conformité Barreau du Québec (Règlement B-1, r.5) et Law Society of Ontario (By-Law 9).
- **Aucun numéro de Barreau sur une facture.** Facture : **maximum deux couleurs.**
- Le fidéicommis ne transite jamais par un processeur de paiement.
- Données hébergées au Canada, chiffrement AES-256, conforme Loi 25 (Québec) et PIPEDA.
- Bilingue FR/EN, français québécois par défaut.

## 11. Anti-patterns (à ne jamais faire)

- Esthétique « IA générique » : dégradés violet/bleu néon, orbes lumineuses, glassmorphism,
  emojis, badges « Powered by AI », bulle de chatbot générique. Pour des avocats, ça détruit
  la confiance. L'intelligence se montre par le travail préparé et vérifié, pas par la déco.
- Tiret long en milieu de phrase.
- Faux avis, fausses notes étoilées, faux logos clients, chiffres inventés.
- Jargon produit, ton survendeur, points d'exclamation.
- Template SaaS interchangeable (fond crème + serif + capture flottante + ombre douce) sans
  signature propre. La signature de SAFE, c'est le registre éditorial et la gravure.

---

## 12. Ce sur quoi je veux réfléchir avec vous

**Logo.** Le logo actuel (galets/chevrons abstraits) est-il la bonne direction, ou faut-il un
symbole plus signé et juridique (sceau, balance stylisée au trait) cohérent avec l'identité
gravure ? Explorer des pistes qui restent lisibles en petit (favicon, app mobile) et en mono.

**Présentation.** Comment rendre la landing distinctive et premium sans retomber dans le
template SaaS : composition de page de titre, matière parchemin, filets gravés, une seule
couleur d'action. Proposer une direction, pas un catalogue.

Contraintes de réponse : voix « vous », français québécois, pas de tiret long, sobre, preuve
avant promesse, client héros.
