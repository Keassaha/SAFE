# 2026-06-23 — Rail de navigation adopté (coque app)

## Buildé et vérifié
- Le composant `Sidebar` (rail desktop avec la vraie nav par rôle via SidebarNavList) était importé mais NON monté. Monté dans `AppChrome` (sauf mode consultant SAFE Inc., qui garde son menu du haut).
- Header : nouvelle prop `showDesktopNav` ; le menu composé du haut est masqué quand le rail porte la nav (plus de double nav). Utilitaires (recherche, FR/EN, Temps, avatar, hamburger mobile) conservés.
- Rail restylé au nouveau design (surface claire `si-surface` + ligne fine, fini le sable).
- Vérifié : desktop 1320px → rail 260px + barre du haut slimmée + dashboard nouveau design ; mobile 390px → pas de rail, hamburger + drawer intacts. Zéro erreur console. tsc exit 0. Réversible (revert AppChrome/Header/Sidebar).

## Reste sur Task 4 (re-skin écran par écran)
- Logo : unifier sur le sceau forêt (actuellement ancien LogoMark, et logo redondant rail + barre du haut).
- Re-skin : clients, dossier, comptabilité, facture, courriels.
- Retirer la route redondante `/tableau-de-bord/apercu`.
- Bascule finale des tokens globaux (si-* → globaux) quand tous les écrans sont passés.

## Prochaine action
- Choisir le prochain écran à re-skinner (clients ou dossier recommandés), ou faire la passe de polish (logo unifié) d'abord.
