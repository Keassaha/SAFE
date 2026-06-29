# 2026-06-29 — Page Fonctionnalités enrichie (vitrine)

Demande CEO : enrichir la page Fonctionnalités, copy validée d'abord, puis implémentation avec photos + animations (curseur qui clique).

## Processus
1. Copy proposée et **validée** par le CEO (défauts retenus : export = formulation prudente, bande « Pour qui » gardée).
2. Implémentation.

## Livré
- `app/fonctionnalites/page.tsx` : ne réutilise plus la grille de 4 features de la landing ; rend `FeaturesDetailed`.
- `components/landing/FeaturesDetailed.tsx` : hero (capture réelle du tableau de bord) + 3 piliers vitrine (fidéicommis, facturation, comptabilité) avec captures réelles dans `BrowserFrame` + 3 cartes (dossiers, duo, conformité) + bande « Pour qui » (avocat/adjointe/duo) sur fond forêt. Reveal au scroll (framer-motion).
- `components/landing/ui/CursorDemo.tsx` (NEW) : curseur animé qui se déplace entre des hotspots et « clique » (anneau qui pulse). Respecte prefers-reduced-motion, masqué < sm. Posé sur le hero (dashboard) + piliers fidéicommis et comptabilité.
- Réutilise les captures réelles existantes `public/images/app/*.png` (dashboard, facture, comptabilite, fideicommis) + `BrowserFrame` (WIP repo).

## Voix
« Vous », sans em-dash, sans jargon, thèse copilote-du-copilote (« votre adjointe est outillée », pilier 05 duo, bande Pour qui).

## Vérifié
tsc vert ; rendu screenshoté de bout en bout sur localhost:3010/fonctionnalites (hero animé, piliers, cartes, bande, CTA, footer).

## Notes
- Pilier Comptabilité : formulation prudente sur l'export (« prête à transmettre à votre comptable »), pas de promesse « export QB/Xero/Sage en un clic » tant que non branché.
- Le commit inclut `BrowserFrame` + `public/images/app` (dépendances de la page) ; le reste du WIP landing/compta du CEO reste non commité.
