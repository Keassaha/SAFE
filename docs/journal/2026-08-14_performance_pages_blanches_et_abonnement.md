# Trois bugs remontés par Me Dadié : lenteur, pages blanches, redirect abonnement

> 14 août 2026. Après une démonstration avec Me Dadié : « le site n'est pas
> rapide, il y a des pages blanches après la création d'une facture, et un
> rafraîchissement me renvoie vers le choix d'abonnement au lieu de me laisser
> sur la confirmation ».

## Ce qui a été confirmé, et ce qui ne l'a pas été

Trois enquêtes en parallèle (flux facture, performance générale, garde
d'abonnement) ont donné des causes structurelles précises pour la lenteur et
les pages blanches. Le troisième point s'est révélé plus incertain : le
cabinet réel de Me Dadié a `stripeSubscriptionStatus = "trialing"`, traité
comme actif par le code depuis toujours (`ACTIVE_STRIPE_STATUSES = ["active",
"trialing"]`). La garde ne devrait donc pas se déclencher pour lui.

### Reproduction en direct (Cabinet Test, jamais Dadié)

Client + dossier + facture créés sur `cabinet-test-2026` (statut `active`),
puis 5 rechargements complets d'affilée sur la page de confirmation : aucun
redirect. Même test répété en se connectant localement sur le cabinet de
Me Dadié (statut `trialing`, sans créer aucune donnée cette fois — juste des
rafraîchissements sur une page existante) : 3 rechargements, aucun redirect
non plus.

Verdict H3 : le bug ne s'est pas reproduit avec l'état actuel du code et des
données. Un agent de planification a par ailleurs relu le code source de
`next-auth` (`withAuth`) et démontré que la branche qui porte l'en-tête
`x-pathname` est bien celle empruntée pour un utilisateur authentifié — la
piste initiale (en-tête jamais propagé) ne tenait pas à l'examen.

### Le garde-fou appliqué quand même

Un défaut réel restait : si `pathname` arrivait vide pour n'importe quelle
raison, `isSubscriptionExemptPath("")` ne reconnaît jamais `/parametres/
abonnement` comme exemptée, ce qui bloquerait ce cabinet en boucle le jour où
son abonnement redeviendrait inactif. Correctif d'une ligne, dans
`app/(app)/layout.tsx` et son double `app/(app-v2)/v2/layout.tsx` :

```ts
if (cabinetId && pathname && !isSubscriptionExemptPath(pathname)) {
```

En cas de doute sur la page visitée, on laisse passer plutôt qu'on verrouille
un cabinet payant. La garde se réévalue à chaque navigation, donc rien ne
reste ouvert plus d'un rendu.

## Page blanche après création de facture

`app/(app)/facturation/` (racine, `nouvelle/`, `factures/[id]/`) n'avait
aucun `loading.tsx`, alors que ce sont des Server Components async avec
requêtes Prisma. Le précédent existait déjà dans le repo :
`components/layout/PageTransition.tsx` documente un ancien wrapper
framer-motion qui causait le même symptôme sur `/temps` et `/comptes`, réglé
depuis — juste jamais reporté sur la facturation.

Trois squelettes ajoutés sur le modèle de `journal/loading.tsx` (immobile,
`role="status"`, texte `sr-only`, PS-042) : `facturation/loading.tsx`,
`nouvelle/loading.tsx` (deux colonnes : champs + aperçu), `factures/[id]/
loading.tsx` (bandeau de montants + document). Confirmé visuellement : le
squelette du détail de facture s'est affiché le temps d'un aller-retour vers
un cabinet différent (404 cross-cabinet, comportement attendu).

Le `router.refresh()` après `router.push()` dans `CreateInvoiceView.tsx` a
été examiné pour suppression, puis gardé : `getSidebarCounts` compte les
factures en `brouillon`, exactement le statut de celle qu'on vient de créer,
et une navigation douce ne relève pas le layout partagé qui porte ce
compteur. Documenté en commentaire plutôt que retiré à l'aveugle.

## Performance : la cascade du layout applicatif

`app/(app)/layout.tsx` enchaînait 7 `await` séquentiels à chaque navigation,
dont 3 requêtes séparées sur la même ligne `Cabinet`
(`getCabinetSubscriptionState`, `getCabinetProvince`, `isSafeIncCabinet`),
aucune cachée.

- `React.cache()` posé sur les trois, comme `getCabinetInterfaceDerived`
  le fait déjà. `getCabinetProvince` est aussi rappelée séparément dans 30+
  pages sous `inspection/`, `fideicommis/`, `conformite/` : le cache profite
  au-delà des trois appels du layout.
- Les cinq lectures indépendantes du layout (interface, statut fidéicommis,
  province, compteurs sidebar, mode consultant) regroupées en un seul
  `Promise.all`, après la garde d'abonnement qui doit rester séquentielle
  (elle peut rediriger).
- `trust-reconciliation-status.ts` : les deux `count` en `Promise.all`.

## Performance : pages de listing

- **Tableau de bord** : `clientsCount` et `activeClientsCount` exécutaient la
  même requête deux fois ; `cabinetForOnboarding`/`cabinetConfigRow`,
  fusionnées en un seul `select`. 35 requêtes à 33.
- **Clients** : le `count` isolé de `activeCasesResult` rejoint le
  `Promise.all` de 6 requêtes qui le précédait.
- **Dossiers** : trois vagues séquentielles (`Promise.all` de 7, un `count`
  isolé, un second `Promise.all` de 2) fusionnées en une seule de 10.
  `include: { client: true }` remplacé par un `select` ciblé (`id,
  raisonSociale, prenom, nom, typeClient`) — seuls ces champs sont consommés
  par `DossiersTable`.
- `loading.tsx` ajoutés à `tableau-de-bord`, `clients`, `dossiers` — les
  quatre routes les plus visitées de l'app en ont maintenant un.

## Vérifications

`npx tsc --noEmit` propre à chaque étape. `npx vitest run` : 1459 tests
verts, 126 fichiers, dont `subscription-state.test.ts` inchangé. `npx eslint`
propre sur tous les fichiers touchés. Chaque page revue visuellement en
local (Cabinet Test, données réelles créées pour l'occasion), les compteurs
affichés inchangés avant/après déduplication.
