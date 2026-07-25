# 2026-07-08 — Écran blanc en prod à chaque navigation → frontières d'erreur + récup skew

## Symptôme signalé (CEO)
En prod (Vercel), à chaque chargement de page il y a un vide blanc indéfini
jusqu'à un rechargement complet manuel. Corrélé au dernier commit (9644dd0,
câblage multi-personnes + enchaînement client).

## Diagnostic
- Diff de 9644dd0 **propre** : rien qui plante globalement. Frontière
  client/serveur saine (`lib/dossiers/parties-sync` marqué `server-only`
  n'est importé que dans des server actions ; `DossierPartiesEditor` client
  n'importe qu'un `type`). Éditeurs de parties gardés derrière une sélection
  de client.
- Logs runtime prod (`vercel logs` sur le déploiement Ready) : **que des 200**
  (+ quelques 401 = logins ratés), **aucune 500, aucun log d'erreur**. Le
  serveur ne plante pas → le blanc est **côté client**.
- Pas de service worker / PWA, pas de cache HTML agressif, chunks statiques
  correctement `immutable` + content-hashés.
- Cause retenue (confirmée par le CEO) : **deployment skew**. Un onglet resté
  sur un ancien déploiement fait une navigation douce qui va chercher des
  chunks JS remplacés → échec de chargement → écran blanc. Aggravé par
  l'**absence totale de frontière d'erreur** dans l'app (aucun `error.tsx` /
  `global-error.tsx`) : React affichait du vide au lieu d'un message.

## Fait
- `lib/errors/chunk-reload.ts` : `isChunkLoadError()` + `tryReloadForChunkError()`
  (recharge **une seule fois**, garde anti-boucle 10 s via sessionStorage).
- `app/(app)/error.tsx` : frontière du segment applicatif (message lisible +
  « Réessayer » / « Recharger », réf. digest). Récupère le skew automatiquement.
- `app/global-error.tsx` : frontière racine (rend son propre html/body, importe
  globals.css), même logique.
- Sans dépendance i18n/dynamique volontairement (une frontière d'erreur ne doit
  jamais pouvoir planter). Textes FR (cabinet Derisier).

## Cure racine (à faire côté CEO, hors code)
Activer **Skew Protection** sur Vercel : Project `safe` → Settings → Advanced →
Skew Protection. Vercel sert alors à un ancien client les assets de SON
déploiement (fenêtre configurable), donc les chunks résolvent toujours. La
frontière d'erreur reste le filet de sécurité.

## Non vérifié
- Pas de vérif navigateur : déclencher une vraie erreur exige d'être authentifié
  en prod, et les serveurs de dev locaux étaient occupés par d'autres sessions.
- `tsc --noEmit` n'a pas terminé dans la fenêtre (projet volumineux) ; aucune
  erreur remontée sur les 3 fichiers avant l'arrêt. Fichiers simples, tokens
  `si-*` et APIs confirmés.
