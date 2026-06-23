# 2026-06-23 — Bannière du haut restylée (Task 4, design safe-interface)

Suite à la décision CEO « navigation en bannière en haut » (rail annulé). On restyle la coque partagée par tous les écrans : la bannière.

## Buildé et vérifié en live
- **Sceau forêt unifié** : remplacé `LogoMark` (ancien sceau ardoise + marque abstraite) par le sceau du design adopté dans la bannière : carré forêt `#0B1F19` + « S » serif albâtre + wordmark « Safe » serif. Scope strict au `Header` : `LogoMark` est CONSERVÉ sur les 6 autres surfaces (connexion, landing, audit gratuit, inscription, sidebar mobile), vérifié sur `/connexion` qui montre toujours l'ancien logo.
- **Accents alignés sur le forêt dense** : tous les `forest-600` de la bannière (vert moyen `#2D6B47`) basculés sur `si-forest` `#0B1F19` (avatar, anneaux de focus, barre d'accent + label des menus déroulants, états actifs, pastilles d'icônes). La bannière lit maintenant le même forêt que le sceau, plus de double-vert.
- **Fond** : `bg-surface/95` (blanc pur) → `bg-si-surface/95` (off-white `#FBFCFA`), bordure `si-line` conservée.
- Styles calculés confirmés en navigateur : sceau `rgb(11,31,25)` = `#0B1F19`, texte sceau `#FBFCFA`, fond bannière `rgba(251,252,250,.95)`.
- Vérifié desktop 1320px (nav groupée + déroulant Finances propre, accents forêt) et mobile 375px (sceau seul, wordmark replié). Zéro erreur console. `tsc` exit 0. Réversible (un seul fichier touché : `components/layout/Header.tsx`).

## Découverte notable (infra)
- **DB Supabase injoignable depuis l'environnement de build** : « Can't reach database server » sur le pooler `:6543`. Erreur RÉSEAU (pas l'erreur d'auth P1000 du `.env` périmé déjà notée), l'app affiche « Projet Supabase en pause ». Conséquence : l'app authentifiée (donc la bannière en contexte réel) ne charge pas ici. Contourné en rendant le `Header` sur une route jetable `/ds-preview/banner` (données fictives, sans DB), capturé, puis supprimée.
- À confirmer côté CEO : reprendre le projet Supabase s'il est en pause, ou vérifier l'accès sortant port 6543.

## Reste sur Task 4
- Re-skin écran par écran : clients, dossier, comptabilité, facture, courriels.
- Retirer la route redondante `/tableau-de-bord/apercu`.
- Bascule finale des tokens globaux (`si-*` → globaux) une fois tous les écrans passés.

## Prochaine action
- Choisir le prochain écran à re-skinner (clients ou dossier recommandés, plus simples que facture/compta).
