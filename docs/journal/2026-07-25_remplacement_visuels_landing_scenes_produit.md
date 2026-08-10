# Remplacement des visuels de la landing par des scènes produit

Date : 2026-07-25
Fichier touché : `components/public-site/HomePage.tsx`
Contexte : demande CEO, améliorer la qualité des « images » de la landing (port 3001), plus esthétiques, plus faciles à comprendre, axées bénéfices, zéro rendu « généré par IA ».

## Constat de départ

La landing n'utilisait aucune image bitmap : tous les visuels sont des compositions DOM. Deux d'entre eux trahissaient un design généré sans direction :

1. Le schéma « système » : diagramme radial abstrait (hub central + 4 bulles flottantes + grille de fond + halo flou). Anti-pattern §10 (décoration avant hiérarchie, structure générique).
2. Le flux de facturation : 3 cercles à icônes reliés par un trait horizontal. Pattern générique, aucun dossier visible, aucun bénéfice lisible.
3. Détail négligé : le panneau hero débordait du viewport (`lg:-mr-24`) et coupait les pastilles de statut (« Prête à envoyer » devenait « Prête à... ») sur tout écran de 1280 à 1440 px.

## Ce qui a été fait

1. **Scène « dossier » (section Système)** : remplace le diagramme radial. Fiche produit crédible : Dossier Succession Tremblay · 2026-014, avec une colonne vertébrale verte reliant 4 réalités rattachées (Temps 6,5 h, Facture 2026-041 · 3 200 $, Fiducie 12 500 $, Échéance 30 juin). Montants Geist Mono alignés à droite (règle L2), statuts colorés discrets, filet + note de bénéfice en pied : « Quatre réalités, un seul dossier. Rien n'est recopié d'un fichier à l'autre. »
2. **Flux de facturation (acte Encaisser)** : remplace les 3 cercles par une trace verticale continue du même dossier (2026-014) : Temps approuvé 6,5 h (31 mai) → Facture 2026-041 émise 3 200 $ (2 juin) → Paiement reçu 3 200 $ (14 juin). La continuité du dossier devient visible au lieu d'être affirmée.
3. **Hero** : suppression du débordement `-mr-24`, toutes les pastilles de statut sont désormais lisibles.

## Checklist anti-slop §10 passée

- A1 aucun dégradé générique ; A3 halo flou et grille de fond supprimés avec l'ancien diagramme ; A5 structure dictée par le contenu (scènes produit réelles, pas hero+3 cartes) ; A7 copie concrète (montants, dates, numéros de dossier réels du récit Tremblay) ; A9 rythme par filets et espacement, pas de décoration.
- Cohérence spec : `SPEC_LANDING_RECONCILIEE_2026-07-23.md` (produit comme preuve, filets plutôt qu'ombres, une seule couleur vivante, mono pour les montants).

## Vérifié

- `tsc --noEmit` : propre.
- Rendu vérifié au navigateur (1280 px) : hero, scène dossier, rapprochement à trois voies, flux facturation. Les animations d'apparition fonctionnent (IntersectionObserver), les 4+3 rangées et leurs textes confirmés dans le DOM.

## Idées à propager (content-bank)

- Post possible : « Nous avons remplacé notre plus beau schéma par une fiche de dossier. Personne ne signe pour un diagramme. » (angle : montrer le produit, pas le concept).

## Évolution (même journée, retour CEO)

Le CEO a montré la section « Chaque action garde son contexte » et tranché : la carte DOM n'est pas assez belle. Le rendu recherché, c'est celui des maquettes app style Linear déjà générées (`public/images/linear-style/`).

Décision appliquée, conforme à la grille narrative de `DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md` (« scène produit sur toute la largeur ») :

- **Hero restructuré en pattern Linear** : texte à gauche (titre serif 76px, sous-titre, CTA), puis fenêtre d'app pleine largeur (1240 px) en dessous : `safe-dashboard-hybrid-production-concept-v5-official-logos.png` (tableau de bord « Bonjour Sophie », KPIs, À votre attention, journée). Cadre filet + ombre forêt spec (`0 40px 80px -44px rgba(11,31,25,.5)`), next/image `priority`.
- **Section système** : titre à gauche, explication à droite, scène pleine largeur `safe-dossier-command-center-v3-recessed-menu.png` (Dossier Tremblay, flux de travail, fiducie rapprochée, facture prête, échéance). Ligne de résultat sous la scène.
- Supprimés : le panneau « À traiter maintenant » du hero (remplacé par le rendu riche) et la carte dossier DOM du matin.
- Halo flou du hero supprimé au passage (discipline filets).

Vérifié : tsc propre, images servies par l'optimiseur next/image (1280 px), hero + scène système confirmés au navigateur.

À surveiller : sur mobile, recadrer les scènes plutôt que les réduire (règle responsive de la direction Linear), non traité aujourd'hui. Les rendus PNG montrent un concept légèrement en avance sur le produit réel ; la direction (« ne pas inventer une fausse interface plus avancée que le produit ») recommandera à terme de les remplacer par de vraies captures du re-skin en cours.
