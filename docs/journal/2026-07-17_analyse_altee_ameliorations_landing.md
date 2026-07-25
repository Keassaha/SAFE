# 2026-07-17 · Analyse Altee et propositions d'amélioration de la landing SAFE

## Contexte

Le CEO a demandé d'analyser la présentation d'altee.com (SIRH français pour PME) et d'en
tirer des améliorations pour l'interface et la présentation de SAFE.

## Mécaniques identifiées chez Altee

1. Hero avec mot tournant (« Puissant / Efficace / Intuitif ») et phrase de tension
   grande entreprise vs PME.
2. Produit montré tout de suite en captures réelles, modules en onglets
   (« fonctionnalités modulaires, expérience unifiée »).
3. Impact chiffré (-32 % gestion, -58 % recrutement).
4. Preuve sociale : carousel de logos + témoignages.
5. Rangée confiance en 4 items (énergie, AES-256, redondance, RGPD).
6. Citation fondateur (« nous ne l'avons pas trouvé, nous l'avons construit »).
7. CTA final à 3 portes (appel, démo, création de compte).

## Adaptation proposée pour SAFE (maquette livrée en widget)

- Hero à mot tournant en encre : « Votre cabinet, toujours [en ordre / conforme /
  payé à temps / serein]. » + tension « rigueur d'un grand cabinet / outil pensé pour
  vous et votre adjointe » (porte le positionnement copilote de l'adjointe).
- Remplacer la capture PNG du hero par une démo vivante (chiffres qui roulent, sceau) :
  SAFE n'a pas de logos clients à montrer, la preuve visuelle animée est notre
  équivalent honnête de leur carousel de logos. Aligné « preuve visuelle avant tout ».
- Onglets modules Facturation / Fidéicommis / Conformité (aligné vision menu composé).
- Chiffres honnêtes de conformité (100 % factures sans trou, 10 domaines suivis,
  0 mélange fiducie/opérations) au lieu de pourcentages inventés. À valider.
- Rangée confiance 4 chips version Barreau (B-1 r.5, données au Canada, numérotation,
  surveillance continue).
- Citation fondateur ancrée dans le vrai métier (tenue de livres, ordre après coup).
  Brouillon à réécrire dans les mots du CEO.
- CTA final 3 portes = escalade de preuve (vidéo 3 min, audit gratuit mis en avant,
  appel 15 min).

## Garde-fous

Pas de faux logos ni de faux témoignages pendant le préchauffage. Les chiffres d'impact
réels viendront des captures chez Me Dérisier.

## Volet 2 · Typographie et cases (même journée)

Question CEO : « et ma police, et les cases ? ». Audit fait :

- **Polices actuelles** : Instrument Serif (titres display) + Geist Sans (corps, alias
  trompeur `--font-inter`) + Geist Mono. Verdict : le duo serif/sans bat la mono-sans
  générique d'Altee, on le garde. Règles proposées : serif jamais sous 20 px (une seule
  graisse), italique réservé au mot vert du titre, Geist pour toute l'interface,
  chiffres d'argent toujours tabulaires.
- **Incohérences relevées** : `font-heading` et `font-display` pointent vers la sans
  (pas le serif) ; alias `--font-inter` charge en réalité Geist.
- **Cases** : rayon 10 px codé en dur dans FeaturesGrid/Button vs échelle de tokens
  (4/6/8/12/16) ; deux systèmes d'ombres (safe-shadow-* et si-card) ; hover 500 ms hors
  signature. Règles proposées : cartes 12 px / contrôles 8 px, ombre unique si-card
  (teintée forêt) au survol seulement, hover 160 ms, fond albâtre #FBFCFA sur canevas
  #EFF2ED (jamais blanc sur blanc), carte vedette (bordure verte 2 px) une seule par
  écran.

Spécimen typographique + anatomie des cases livrés en widget. À valider avant
harmonisation dans le code.

## Décision CEO (même journée)

**Duo typographique VALIDÉ** (« j'aime mieux ce duo ») : Instrument Serif (titres) +
Geist (tout le reste). Nettoyage appliqué dans la foulée :

- `tailwind.config.ts` : alias `heading` / `display` / `jakarta` supprimés (tous
  inutilisés, ils pointaient vers la sans par erreur) ; `sans` pointe directement
  `--font-geist-sans`, `mono` directement `--font-geist-mono`.
- `app/layout.tsx` : vars de compat `--font-inter` / `--font-jetbrains-loaded`
  supprimées.
- `app/globals.css` : `--font-heading` et `--font-jakarta` (legacy) supprimées.

Vérifié sur dev (port 3020) : h1 rend en Instrument Serif, corps en Geist, zéro erreur
console, zéro référence restante aux alias. (Note : capture d'écran headless montre les
sections framer-motion à opacité 0 car l'onglet est `visibilityState: hidden`, artefact
de vérification, pas un bug.)

## Volet 3 · Thème général Altee vs SAFE (même journée)

Décision CEO : signature motion « Encre et sceau » VALIDÉE (voir journal signature).
Demande suivante : comparer le thème général des deux marques. Face-à-face livré en
widget (même écran rendu dans les deux thèmes).

ADN comparé :
- Altee = SaaS lumineux : blanc pur, bleu #2563EB, coins très ronds, pills, ombres
  bleutées flottantes, graisse 700, énergie commerciale avec exclamations. Force :
  propreté, respiration, produit en avant. Faiblesse : interchangeable (le thème de
  90 % des SaaS B2B ; Clio et la legaltech sont déjà bleus).
- SAFE = éditorial forêt : albâtre chaud #EFF2ED, forêt #0B1F19 en ponctuation, serif
  d'autorité, filets 0,5 px, ombres rares, sceau vert. Force : différenciation totale
  dans la catégorie + gravité juridique. Risque : densité/lourdeur si la forêt déborde.

Verdict proposé : garder le thème SAFE, formaliser la règle « clair par défaut, forêt
en ponctuation » (forêt réservée à l'en-tête, aux citations, au CTA final : les moments
d'autorité). Emprunter à Altee la respiration seulement : plus d'air entre les
sections, produit montré plus grand, alternance albâtre/surface pour rythmer la page.
Ne jamais emprunter : le bleu, le blanc pur, les pills, les exclamations.

## Volet 4 · Thème fusionné « Forêt lumineuse » (même journée)

Demande CEO : allier le meilleur des deux mondes en une proposition. Maquette livrée
en widget. Les 7 lois du thème fusionné :

1. **Base lumineuse chaude** : la page marketing vit sur `#FBFCFA` (surface), plus
   clair que l'albâtre, jamais blanc pur. La lumière d'Altee, la chaleur de SAFE.
2. **Rythme par les fonds** : sections alternées `#FBFCFA` / `#EFF2ED`, sans traits
   de séparation (mécanique Altee, palette SAFE).
3. **Forêt en ponctuation** : `#0B1F19` réservé à l'en-tête, la citation fondateur et
   les barres produit. Rare donc autoritaire.
4. **Vitrine produit à l'Altee** : capture grande, coins 14-16 px, ombre portée douce
   TEINTÉE FORÊT `0 30px 60px -30px rgba(11,31,25,0.35)` (jamais bleutée), posée à
   cheval entre section claire et section teintée.
5. **Respiration doublée** : padding de section généreux (96-120 px en vrai),
   sous-titres courts, une idée par section.
6. **Pills pour les preuves, jamais pour les boutons** : chips arrondies (badges,
   preuves de conformité) empruntées à Altee ; les boutons restent SAFE (8 px, forêt).
7. **Le mouvement reste « Encre et sceau »** (validé) : mot tournant encre, chiffres
   qui roulent, sceau sur les confirmations.

Interdits maintenus : bleu, blanc pur, graisse 700, exclamations, rebond.

## Statut

Thème fusionné « Forêt lumineuse » : PROPOSÉ, en attente validation CEO.
Duo typographique figé et nettoyé dans le code (non commité). Maquette landing : en
attente de validation CEO sur les 7 blocs. Règles cases (rayons, ombre unique,
hover 160 ms) : proposées, pas encore harmonisées dans le code.
