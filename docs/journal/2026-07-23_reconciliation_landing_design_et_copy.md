# Réconciliation landing: direction design + copy révisé

Date: 2026-07-23

## Contexte
Deux documents fournis par le CEO: une direction de design inspirée de Linear
(discipline de composition, 9 séquences) et un copy révisé plus prudent centré
sur le fidéicommis et l'inspection. Divergences réelles entre les deux.

## Décidé
- Action principale de la landing = diagnostic gratuit (8 points). Confirmé CEO.
- Escalade = rencontre de 20 minutes, réservée au CTA final. Résout le conflit de CTA.
- Positionnement hero = pointu (fidéicommis / inspection), système large en preuve plus bas. Hypothèse, à confirmer.
- Géographie: cabinet réel en Ontario. Ne jamais présenter SAFE comme exploité au Québec. Conformité couvre QC (B-1, r.5) et ON (LSO).
- Provenance publique: « Conçu à partir du quotidien d'un vrai cabinet », sans nom.
- Structure: une longue landing (9 séquences), le reste (Fonctionnalités, Tarification, FAQ) en pages profondes.

## Produit
`docs/product/SPEC_LANDING_RECONCILIEE_2026-07-23.md`: assigne chaque bloc de
copy à sa séquence de design, avec garde-fous hérités.

## Ouvert
- Confirmer positionnement pointu vs large.
- Terme public: « diagnostic » vs « audit gratuit » (route `app/audit-gratuit/` existe).
- Choisir les 3 scènes produit les plus crédibles.
- Disponibilité d'un changelog public.

## Ébauche construite (même jour)
Route ISOLÉE `app/landing-v2/page.tsx`, non liée à la prod (aucun lien depuis la nav).
Sections livrées : hero (scène fidéicommis en vrai DOM) + repères + coût du désordre +
point de vue (3 principes) + démonstration 3 actes (Tenir/Vérifier/Encaisser, 3 scènes
distinctes) + CTA final (escalade rencontre 20 min).

Design : une seule couleur vivante (vert d'action), Instrument Serif titres / Geist Sans
corps / Geist Mono montants-dates, filets plutôt qu'ombres, ambre réservé à l'écart.
Anti-slop §10 respecté (pas de dégradé violet, texte de lecture aligné à gauche, pas de
« 3 cartes à icônes » générique, pas d'emoji, copie concrète voix « vous », zéro em-dash).

Vérif preview (port 3001) : route 200, aucune erreur console, 7 sections + footer, 3 principes
+ 3 actes, 4 scènes produit, écart Mandat Lavoie + certification « Bloquée », résultats en vert
vérifié. Hero validé visuellement. Animations d'entrée gelées dans la preview headless (throttle
rAF), artefact d'environnement, pattern identique à la prod.

## Pages secondaires ajoutées (même jour)
Module partagé `app/landing-v2/_shared.tsx` (constantes design, Nav, Footer, PageShell,
PageHeader, marqueur AConfirmer). Home refactorée pour l'utiliser (nav pointe vers les vraies
pages). Six pages construites depuis le copy (PROPOSITIONS_COPY sections B à G) :
- `/fonctionnalites` (B) : fidéicommis, facturation, temps, dossiers + « ce que SAFE ne remplace pas ».
- `/tarification` (C) : forfaits Solo 99$/Cabinet 149$, bloc fondateurs (5 places), décision réversible, 3 questions.
- `/a-propos` (D) : histoire du fondateur (cabinet ontarien), signature à confirmer.
- `/demo` (E) : déroulement + formulaire (Nom, Courriel pro, Cabinet) + note de confidentialité.
- `/diagnostic` (F) : 8 points, pourquoi gratuit, CTA vers l'outil réel `/audit-gratuit`.
- `/faq` (G) : 6 objections (données, conformité, délai, contrat, jeune entreprise, adjointe).

Placeholders honnêtes du copy (mesures de sécurité, formats d'export, nom du fondateur,
nombre de comptes, modalités) rendus via marqueur ambre « à confirmer », non inventés.

Vérif (serveur 3020) : 7 routes 200, contenu réel confirmé par grep, zéro marqueur d'erreur.
Nav + CTA + cartes de prix validés visuellement.

## Reste à décider / faire
- Confirmer positionnement pointu (hypothèse retenue).
- Terme public « diagnostic » vs « audit gratuit » (route `app/audit-gratuit/` inchangée).
- Choisir les 3 scènes produit finales (réelles ou fidèles).
- Séquences non construites dans l'ébauche : 06 continuité, 07 offre/prix, 08 objections.
