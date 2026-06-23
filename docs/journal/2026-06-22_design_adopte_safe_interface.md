# 2026-06-22 — Design adopté : projet safe-interface

## Reçu du CEO
- Un projet Next.js 15 fini, « safe-interface » (design system v3, variante froide albâtre), fourni comme LE design de SAFE. Copié dans `docs/propositions/safe-interface/`.
- À ne pas confondre avec `docs/propositions/safe-pro/` (vision d'un produit DIFFÉRENT : droit familial / pension vs Aliform, parquée).

## Décidé
- Ce design devient la référence visuelle officielle. Remplace toutes les explorations de la session (A à D, bordeaux, sceau).
- `SAFE_IDENTITE_VISUELLE.md` réécrit en « adopté » avec les tokens réels.
- Calendrier : étape fondatrice ajoutée (adopter le design system avant les chantiers visuels A/B/C).

## Le design en bref (tokens réels)
- Forêt `#0B1F19` (+ soft `#16312A`), fond albâtre froid `#EFF2ED`, surface `#FBFCFA`, encre `#1F2A24`, muet `#5A665F`, vérifié `#2E7D5B`, ambre `#B07A1C`.
- Polices déjà dans SAFE : Instrument Serif (titres), Geist (UI), Geist Mono (chiffres).
- Logo = carré arrondi forêt + « S » serif (le sceau). Rail de navigation à gauche. Dashboard orienté priorité, fidéicommis + Barreau B-1 r.5 en avant.

## Observé / honnête
- Même socle technique que SAFE → adoptable. Mais c'est une maquette sur données de démo : l'adopter = porter tokens + coque + composants, puis re-habiller les écrans réels (migration bornée, pas copier-coller).
- Points à trancher : rail à gauche (ce design) vs barre du haut actuelle ; vert plus profond ; rubrique « Employés Virtuels ».

## Prochaine action
- CEO tranche : adopter dans le vrai code maintenant (chantier de migration design system) ou verrouiller comme référence jusqu'au lancement de la stabilisation. Confirmer rail vs barre du haut.
