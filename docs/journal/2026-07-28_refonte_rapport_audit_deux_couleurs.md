# Refonte du rapport d'audit : lisibilité, pertinence, deux couleurs

**Date** : 2026-07-28
**Portée** : `components/audit-report/` (thème, primitives, coquille, 7 pages)

---

## Décision CEO

Le document d'audit remis aux cabinets passe à **deux couleurs**, comme la facture :

1. **Vert forêt `#163B2E`** — texte, filets, aplats. Toutes les nuances viennent de
   l'opacité sur le papier, jamais d'une nouvelle teinte.
2. **Or `#A9772A`** — réservé à ce qui porte une décision : montant récupérable,
   tarif, jauge de gravité, numéro de section.

Supprimés : rouge, terracotta, ambre pâle, les quatre fonds de pastilles de risque,
les halos en dégradé, le logo gris de couverture.

**Gravité sans code couleur** : les points d'exposition sont triés du plus grave au
moins grave, portent leur libellé écrit (Critique, Élevé, Modéré, Faible) et une jauge
à quatre crans. Un niveau à zéro affiche une jauge grise, jamais une jauge or.

## Ce qui change dans la structure

| Avant | Après |
|-------|-------|
| Couverture centrée, sans repère | Couverture alignée à gauche, objectif de l'audit + sommaire des 6 sections |
| Profil + encart objectif + tuile « utilisateurs » | Profil sur deux colonnes pleine largeur + « Ce que ces réponses signalent » (drivers) |
| Score sur jauge décorative | Trois chiffres clés en bandeau + **le détail du calcul ligne par ligne** |
| Risques en 3 colonnes de 9,5 px | Constat et impact à gauche, correction SAFE à droite, texte à 10,5 px, points numérotés |
| 3 cartes de prix + offre fondatrice | Un seul prix (celui que le cabinet paie), inclusions sur 2 colonnes, prix réguliers en note |
| Nombre de pages figé, pied « 06 » en dur | **Pagination dynamique** : les risques débordent sur autant de pages que nécessaire, numéros calculés |

## Correctifs livrés au passage

- **Export PDF réparé.** `app/globals.css` masque `body *` à l'impression (règles écrites
  pour la facture et les rapports financiers). L'audit sortait entièrement blanc. Une
  contre-règle scoped est maintenant injectée par `AuditReport.tsx`.
- **Incohérence de prix.** La page « coût » comparait la stack à 99 $ alors que l'offre
  annonçait 50 $. Elle utilise désormais le tarif fondateur du palier recommandé,
  via `TARIFICATION.fondateurs`.
- **Doublons de texte** sur la page coût : la source n'est affichée que si elle diffère
  du détail.
- **Troncature silencieuse** : `overflow: hidden` sur une page à hauteur fixe rognait
  tout risque au-delà du cinquième. Les risques sont maintenant répartis 4 par page,
  avec équilibrage pour ne jamais laisser un point seul en bas de page.

## Vérification

Rendu sur `/audit/demo`, 8 pages (couverture + 6 sections, risques sur 2 pages avec le
jeu de démo). Typecheck propre, aucune erreur console, export PDF non blanc.

## Checklist anti-slop §10 (DESIGN_HUMAIN.md)

- A1 dégradés génériques : supprimés (halos retirés).
- A2 tout centré : couverture réalignée à gauche.
- A3 ombres molles uniformes : supprimées, plus aucune ombre portée.
- A6 icônes décoratives : les ✓ des listes de features sont partis.
- A8 gris sur gris : opacités relevées (texte courant 0,78, libellés 0,62).
- A9 espacement uniforme : rythme vertical retravaillé par bloc.
