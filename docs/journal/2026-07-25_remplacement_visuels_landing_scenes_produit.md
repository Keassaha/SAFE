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
