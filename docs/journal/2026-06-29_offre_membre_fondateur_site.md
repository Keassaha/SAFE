# 2026-06-29 — Offre membre fondateur (compta consultant) + section site

## Contexte
Travail outbound vers petits cabinets / solos en droit familial (QC francophone). Le CEO agit comme consultant pour un cabinet de droit de la famille et a bâti un outil conforme au Barreau (gestion fidéicommis + préparation des factures). L'histoire vraie de pair devient l'accroche principale (email + Loom), pas un pitch produit.

## Décision : structure de l'offre fondatrice
- **5 places fondatrices** réservées (exclusivité, rareté).
- **12 mois gratuits dès l'activation** (le décompte ne démarre qu'à l'usage réel).
- **Tarif à vie gelé à la signature : 50 $/mois** (au lieu de 149 $). Le prix est verrouillé MAINTENANT, le gratuit est le cadeau de membre fondateur. Ne jamais séparer le cadeau de la décision (sinon ancrage à zéro + tire-kickers).
- **Option de rachat unique : 5 000 $**, réservée aux 5 fondateurs. Positionnée par l'émotion (« payez une fois, plus jamais d'abonnement »), pas par le calcul. Assumée comme investissement marketing sur 5 comptes de référence (chiffres + témoignages).
- Mises à jour de conformité Barreau incluses ; mise en route faite avec le cabinet ; statut de membre fondateur.

## Build
- Nouvelle section `components/landing/FoundingOffer.tsx` (dark premium, framer-motion, tokens forêt/albâtre, CTA « Nous contacter » → `/contact`).
- Insérée dans `app/page.tsx` entre `PricingGrid` et `FinalCta`.
- Vérifiée en preview desktop + mobile (port 3010). Chevauchement badge/titre corrigé en mobile.

## À traiter (incohérence repérée)
- `components/landing/FinalCta.tsx` affiche encore « 50 places fondatrices · tarif verrouillé à vie », ce qui contredit « 5 places » de la nouvelle section sur la même page. À aligner (décider : 5 vs 50).

## Refonte page /tarification (même journée)
- Offre fondatrice remontée en tête (juste après le Hero), prix réguliers déplacés plus bas.
- Angle « 45 000 $ / pénurie d'adjointes / remplace l'adjointe » SUPPRIMÉ (section PourquoiMaintenant retirée). Remplacé par un récit rationnel de partenariat.
- Nouveau Hero : « On bâtit SAFE avec cinq cabinets. Pas seulement pour eux. » + « jeune entreprise basée au Québec » (pas « québécoise », pour ne pas soulever la question de la propriété ; décision wording).
- 3 nouvelles sections : `OffreFondatrice` (2 options : abonnement 50 $/mois à vie barré 149 $ + rachat unique 5 000 $), `PartenariatFondateur` (3 points rationnels), `AvantagesFondateurs` (checklist).
- CTA principal partout : « Nous contacter » → `/contact`. Audit gratuit relégué en chemin secondaire.
- Données alignées sur 5 places dans `lib/tarification.ts` (placesTotal 5, abonnementVie 50, rachatUnique 5000, moisGratuits 12). Widget dashboard + FAQ mis à jour. CTA d'accueil corrigé 50 → 5 places (cohérence, décision CEO).
- Vérifié en preview (port 3010), structure et rendu OK.
- RESTE : scrub des tirets longs (—) pré-existants dans TripleGarantie / InclusPartout (hors périmètre immédiat).

## Idées à propager (content-bank / posts)
- Build-in-public : « pourquoi j'ai gelé le prix à vie au lieu d'offrir un an gratuit sans engagement » (ancrage à zéro).
- Angle « je bâtis nos systèmes au même moment que vous » pour les jeunes solos (ex. Me Dubreuil, Barreau 2020).
