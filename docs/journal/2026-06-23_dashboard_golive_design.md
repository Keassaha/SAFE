# 2026-06-23 — Go-live du tableau de bord (design safe-interface)

## Buildé et vérifié en live
- Socle design porté en namespace `si-*` (tokens forêt/albâtre + composants `components/ds-safe/`), additif, zéro impact sur l'existant. Démo : `/ds-preview`.
- `DashboardViewSafe` créé : consomme le MÊME `DashboardPayload` que l'ancienne vue (aucune re-requête), rend le design focalisé (priorité, conformité, fidéicommis, indicateurs, obligations).
- Page live `/tableau-de-bord` basculée sur `DashboardViewSafe`. Ancienne `DashboardView` conservée comme REPLI (revert = 1 ligne).
- Vérifié connecté comme Derisier : vraies données (À recevoir 2 252,46 $, fidéicommis 0 « Jamais rapproché », 1 dossier/1 client, alerte réelle « 393,33 $ en heures non facturées »). Forêt dense, aucun warning/erreur console. tsc exit 0.

## Reste sur Task 4
- Rail de navigation (coque app-wide) : sous-étape suivante, touche toutes les pages → faite séparément, vérifiée.
- Re-skin des autres écrans (clients, dossier, compta, facture, courriels).
- Route `/tableau-de-bord/apercu` (preview) désormais redondante : à retirer au nettoyage.
- Bascule finale des tokens globaux (si-* → globaux) une fois tous les écrans passés.

## Prochaine action
- Sur go : adopter le rail dans la coque `app/(app)/layout.tsx`, avec repli, vérifié écran par écran.
