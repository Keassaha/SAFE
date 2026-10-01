# 2026-10-01 · Facturation : cinq retouches et le menu « Outils »

## Décision CEO

Image avant/après validée le 2026-10-01 (`captures/2026-10-01_facturation_proposition.png`),
fabriquée en appliquant les retouches sur la page réelle. « oui, code-le », menu
« Outils » compris.

## Ce qui a changé

1. **« Total estimé » devient « Total, taxes incl. »** (`billingUi.colTotalEstime`).
   375,00 $ d'honoraires et 0,00 $ de débours y donnaient 431,16 $ sans dire pourquoi :
   ce sont les taxes (× 1,14975).
2. **Les filtres disent ce qu'ils filtrent** : « Client : tous », « Avocat : tous »,
   « Période : toute » (honoraires à facturer), « Statut : toutes » (liste des factures).
3. **Les deux dates de la liste des factures portent « Du » et « Au »**, comme au
   registre du fidéicommis. Elles n'avaient aucune étiquette visible.
4. **« 0 facture(s) » devient « 0 facture »** : pluriel ICU, qui corrige aussi deux
   mentions de `FacturationKpis`.
5. **L'état vide perd son rond à icône** : `EmptyState` reçoit `sansIcone`, employé ici
   seulement.
6. **Menu « Outils »** : les deux entrées grisées « Bientôt » (export CSV/PDF, paramètres
   de facturation) sont retirées ; le survol gris uni des lignes devient `safe-zoom-menu`
   (règle CEO du 2026-08-11).

## Mesure

`/facturation` : 18 → 18. Lot de corrections : les écarts comptés viennent surtout de la
fenêtre « Nouvelle facture » (`NewInvoiceChoiceModal.tsx`, 10 à elle seule) et de
`InvoiceCard.tsx`, qui demandent une image avant d'être refaits.
