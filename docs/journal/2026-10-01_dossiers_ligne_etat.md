# 2026-10-01 · Dossiers : une ligne d'état, des filtres nommés

## Décision CEO

Maquette avant/après validée le 2026-10-01, sur les données réelles du cabinet démo
local (`captures/2026-10-01_dossiers_proposition.png`). Trois réponses :

1. Réduire la barre de sept mesures à une ligne d'état : **oui**. Cela revient sur la
   décision du 2026-08-27, qui séparait les mesures en deux familles (dossiers, actes).
2. Retirer le bouton « Actualiser » : **oui**.
3. Garder « Actif » en pastille verte : **oui**.

Correction d'audit consignée : l'audit du matin reprochait à Dossiers « sept cartes à
icône ». Elles avaient déjà disparu le 2026-08-27 ; l'audit lisait une capture du même
jour, antérieure au correctif. L'écran a été recapturé avant toute proposition.

## Ce qui a changé

- `DossierSummaryCards.tsx` : « 2 dossiers actifs · 0 clôturé · 1 acte, aucun urgent ni
  en retard ». Les actes urgents ou en retard passent seuls en ambre, au-dessus de zéro.
  Total, pourcentage, « En cours » et « Terminés » ne s'affichent plus (props gardées).
- `page.tsx` : plus de sous-titre « Gérez vos dossiers et affaires ».
- `DossierFilters.tsx` : les listes disent ce qu'elles filtrent (« Statut : tous »,
  « Domaine : tous », « Client : tous ») ; bouton Actualiser retiré.
- **Défaut de libellé corrigé** : « immobilier », valeur acceptée par la validation, la
  requête et la taxonomie (code RE), n'avait aucun libellé. Il s'affichait en minuscules
  dans le registre et la fiche, et manquait au filtre. Ajouté partout (« Immobilier » /
  « Real estate »). « Corporate » devient « Droit des affaires » en français.
- `DossiersTable.tsx` : colonne « Type » renommée « Domaine » ; largeurs reprises pour
  que l'intitulé ne se coupe plus à côté d'un client qui n'utilisait pas sa place.

Non repris de la maquette : masquer les flèches de tri inactives. Elles vivent dans
`components/ui/registre.tsx`, commun à tous les registres, et sont déjà à 40 %.

## Mesure

`node scripts/design-audit.mjs` : `/dossiers` **13 → 12** (animation continue de
l'icône d'actualisation retirée). Vérifié au navigateur en français, en anglais, sur
bureau et sur téléphone ; filtre « Immobilier » testé (1 dossier sur 2).
