# 2026-10-01 · Tableau de bord : retrait des tuiles vertes

## Décision CEO

Maquette avant/après validée le 2026-10-01, sur les chiffres réels du cabinet démo.
Trois réponses :

1. Retirer les quatre tuiles en dégradé encre→vert avec halo : **oui**.
2. Le bouton d'action garde son dégradé (`safe-action-degrade`) : **oui**. C'est le
   seul dégradé de l'écran.
3. Le diagramme passe en gris et encre, sans vert : **oui**.

Origine : audit « ce qui fait application générée par IA » du même jour. Les tuiles
pleines à halo, pastille en capitales et flèche ↗ sont le gabarit le plus reconnaissable
des tableaux de bord générés. Elles contredisaient aussi `lib/ds/palettes.ts`, où le
vert ne dit que « validé » : un fidéicommis à rapprocher n'est pas validé.

## Ce qui a changé

`components/dashboard/DashboardViewSafe.tsx`
- La bande noire d'état (`ComplianceStrip`) devient une ligne de texte sous le titre.
  Seule la mention qui appelle un geste prend l'ambre. La date passe à droite du titre.
- Plus aucun surtitre en capitales espacées (« À traiter maintenant », « Les montants à
  surveiller », « Flux du cabinet », « Vos performances »).
- Les alertes de la bande d'action sont toutes ambre et disent leur destination
  (« Voir les factures », « Préparer la facturation ») au lieu d'une flèche muette.
- Les quatre montants : une seule feuille blanche (`components/ui/Card`) découpée par des
  filets. Le fidéicommis garde deux colonnes sur cinq et le chiffre au double.
- « Taux d'encaissement » devient « Encaissé ÷ facturé, <mois> », avec l'aide « Peut
  dépasser 100 % ». La formule (paiements du mois ÷ factures émises du mois) n'a pas
  changé. « Taux de facturation » devient « Heures portées à une facture » : il est
  calculé sur toutes les heures, sans borne de date, et l'aide le dit.

`components/dashboard/CashflowChart.tsx`
- Encaissé en encre, facturé en encre à 18 %. Relief retiré (dégradé, arête, ombre au
  sol), ce qui revient sur la demande antérieure d'un diagramme « 3D ».

## Mesure

`node scripts/design-audit.mjs` : `/tableau-de-bord` **37 → 32** écarts
(`DashboardViewSafe.tsx` 10 → 6, `CashflowChart.tsx` 4 → 3). Total intérieur 952 → 947.

Captures : `captures/2026-10-01_tableau_de_bord_proposition.png` (image validée, avant à
gauche, proposition à droite), `captures/2026-10-01_tableau_de_bord_apres.png` (écran
codé, cabinet démo local sans factures).

## Reste à faire

- La vitrine reprend l'ancien tableau de bord (`HeroLiveApp.tsx`, `ExperienceCinema.tsx`,
  `mockups.tsx`). Elle se met à jour maintenant que l'écran existe, selon
  `PROCEDURE_EXTRAITS_VITRINE.md`.
- `ComplianceStrip` n'est plus monté que par `/ds-preview`.
- Le diagramme avec données n'a pas été vu à l'écran : le cabinet démo local n'a aucune
  facture.
