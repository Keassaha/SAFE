# 2026-06-23 — Décision CEO : navigation en bannière EN HAUT (rail annulé)

Après avoir vu le rail à gauche en live, le CEO a tranché : il veut la **navigation en bannière en haut**, pas le rail latéral.

## Fait
- Annulation des éditions du rail (`2026-06-23_rail_navigation_golive.md` est donc CADUC) : AppChrome ne monte plus le `Sidebar`, le `Header` réaffiche son menu composé en haut (prop `showDesktopNav` retirée), le `Sidebar` est revenu à son style d'origine (non monté).
- CONSERVÉ : le tableau de bord au nouveau design (`DashboardViewSafe`), le design system `si-*`, et les P0 (rate-limit, gating console, équivalence facture).
- Vérifié desktop 1320px : menu en haut, pas de rail, dashboard nouveau design. tsc exit 0.

## Reste sur Task 4
- Restyler la bannière du haut au nouveau design (forêt/albâtre) — à confirmer.
- Re-skin des autres écrans (clients, dossier, compta, facture, courriels).
- Retirer la route `/tableau-de-bord/apercu`.
