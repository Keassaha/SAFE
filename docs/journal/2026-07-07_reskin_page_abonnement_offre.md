# 2026-07-07 — Amélioration de la présentation de l'offre (page abonnement)

## Contexte
Demande CEO en session : « améliorer la présentation de l'offre » sur
`/parametres/abonnement` (capture de la page Compte Test, plan actuel Essentiel).

## Buildé
- `components/settings/SubscriptionManager.tsx`
  - Forfait recommandé mis en avant : « Professionnel » porte un badge
    « Recommandé », un cadre vert forêt, un léger relief (`md:-mt-2`), un fond
    teinté et une ombre douce. Réflexe SaaS standard pour orienter le choix.
  - Ligne « pour qui » sous chaque nom (solo / cabinet qui grandit / grand cabinet).
  - Bloc prix retravaillé (28px, chiffre séparé du « /mois »).
  - Note de facturation ajoutée sous la grille : « Facturé mensuellement en
    dollars canadiens. Résiliable à tout moment. »
  - Refactor : la liste de features passe d'un empilement de 5 blocs JSX
    conditionnels à une boucle sur un tableau `features`.
- `messages/fr.json` + `messages/en.json`
  - Nouvelles clés : `subscriptionRecommended`, `subscriptionTagline{Essentiel,
    Professionnel,Cabinet}`, `subscriptionBillingNote`.
  - `subscriptionActivationRequired` reformulée : retrait du jargon « webhook
    Stripe » (visible par la cliente) au profit de « L'accès complet s'ouvre dès
    la confirmation du paiement. »

## Vérifié
- `tsc --noEmit` : aucune erreur sur SubscriptionManager.
- JSON FR/EN valides.
- Pas de capture live : la page exige une session cabinet authentifiée que le
  preview n'a pas (reste bloquée sur le skeleton de chargement). Rendu fidèle
  présenté via widget visuel à la place.

## Décidé
- Garder les tokens `safe-*` sur cette page (paramètres pas encore passée au
  re-skin `si-*`), pour cohérence intra-page. Voir [[project_design_reskin_state]].

## Tranché (CEO, 2026-07-07)
Contradiction repérée : `subscriptionFeatureNote` affirme que « tous les forfaits
débloquent le même périmètre, le prix reflète la taille du cabinet », alors que
les cartes affichaient des features différentes par palier.

Décision CEO : **même produit partout, le prix reflète la taille du cabinet**
(option A). Cartes ajustées : chaque forfait affiche désormais « Fidéicommis,
assistants IA et rapports inclus » (nouvelle clé `subscriptionFeatureAllIncluded`)
+ le nombre d'utilisateurs. Seuls le prix et le nombre d'utilisateurs varient.
Plus aucune puce ne laisse croire qu'un palier prive d'une fonction.
Lié à [[project_pricing_model]].
