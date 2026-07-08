# 2026-07-08 — Finances de l'interface créateur : chrono + retrait fidéicommis

## Demandes CEO
1. Dans facturation & suivi, avoir aussi « les chrono » (« on ne sait jamais »).
2. Dans le volet comptabilité, retirer le fidéicommis et tout ce qui s'y rapporte.

## Constat / fait

### 1. Chrono — déjà présent
Le `GlobalTimer` (bouton « Temps » de la barre du haut, `components/temps/GlobalTimer.tsx`)
est monté dans le `Header`, donc **disponible sur toutes les pages, y compris
facturation et suivi**, en mode créateur. Rien à ajouter pour l'accès global.
Reste possible si voulu : intégrer un panneau d'entrées de temps DANS l'écran de suivi
(à clarifier, non fait).

### 2. Fidéicommis retiré du volet comptabilité créateur (mode SAFE Inc.)
Aligné sur la spec consultant (CONSOLE_CONSULTANT_REFACTOR : retirer le fidéicommis
des vues consultant). Surfaces masquées quand `isSafeInc` :
- **Carte « Fidéicommis »** de la synthèse compta (`ComptabilitePageView` : carte
  `tone="trust"` masquée, grille passée de 5 à 4 colonnes). `page.tsx` calcule et
  passe `isSafeInc` via `isSafeIncCabinet(cabinetId)`.
- **Bannière de rapprochement fidéicommis** (`AppChrome` : `{!isSafeInc && trustStatus && …}`).
- **Phrase d'intro** de la compta (description créateur sans la mention fidéicommis).

## Vérif
- `tsc --noEmit` : 0 erreur.
- Visuel port 3010 (créateur) : comptabilité affiche 4 cartes (Facturé / Encaissé /
  À recevoir / Dépenses), plus de carte ni bannière fidéicommis, intro nettoyée.

## Résidu connu (petit suivi)
Le filtre « Type » du journal général contient encore les options « Dépôt fidéicommis »
/ « Retrait fidéicommis » (types de mouvements du journal comptable). Non masquées :
nécessiterait de threader `isSafeInc` jusqu'au composant de filtre du journal. À faire
si le CEO veut le nettoyage complet.
