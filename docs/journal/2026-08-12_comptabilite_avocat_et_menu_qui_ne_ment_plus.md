# 2026-08-12 — La comptabilité s'ouvre à l'avocate, et le menu cesse de mentir

Le CEO clique « Comptabilité » et atterrit sur le tableau de bord.

## Ce qui se passait

Trois pièces qui, séparément, avaient l'air correctes.

1. La session de travail tourne sur le cabinet de démonstration, connecté comme
   Me Camille Roy, dont le rôle est `avocat`.
2. `/comptabilite` est gardée par `canViewComptabilite`, qui n'acceptait
   qu'`admin_cabinet`, `comptabilite` et `assistante`. Refus égale
   `redirect("/tableau-de-bord")` (`lib/auth/page-guard.ts`).
3. La barre du haut (`components/layout/Header.tsx`) recevait bien le rôle, mais
   ne s'en servait pas. Elle affichait donc toutes les entrées à tout le monde.

Le menu latéral mobile, lui, filtrait déjà par rôle (`SidebarNav`). Sur
ordinateur, la barre du haut est la SEULE navigation depuis `AppChrome` : elle
proposait une porte que la garde refusait. Un aller simple vers le tableau de
bord, sans un mot d'explication.

Un test verrouillait même l'ancienne politique, avec son intention écrite noir
sur blanc : « avocat NON (cohérent avec la nav) ». La nav n'était pas cohérente.

## Décision CEO

L'avocat peut LIRE la comptabilité. Deux raisons.

Son tableau de bord lui montre déjà facturé, encaissé, à recevoir et le solde en
fidéicommis. Le refus ne cachait aucun chiffre, il cassait seulement un lien.
Et dans un cabinet solo, la cible de SAFE, c'est l'avocate qui tient ses livres.

Lire n'est pas tenir : l'écriture reste à l'administration et à la comptabilité.

## Ce qui a changé

- `canViewComptabilite` accepte les quatre rôles du cabinet. La liste reste
  explicite : un rôle futur (stagiaire, lecture seule) est refusé par défaut.
- La barre du haut filtre ses entrées par rôle, chaque prédicat reprenant
  exactement la garde de la page visée. Effet immédiat au delà de la
  comptabilité : l'assistante ne voit plus « Fidéicommis » ni « Inspection »,
  que `canViewBillingTrust` lui refuse.
- La page de comptabilité s'adapte au droit du lecteur :
  - sans droit d'écriture, « Nouvelle écriture », l'import de reçu, l'import de
    relevé et le panneau de validation disparaissent. L'export CSV reste.
  - sans droit de facturation, l'onglet Paiements disparaît (l'API qui le sert
    vérifie `canManageInvoices`, il n'aurait affiché qu'une erreur), et
    `?tab=paiements` retombe sur le journal général.
  - la ligne « Encaissé ce mois » pointe vers l'onglet Paiements de la page au
    lieu de `/facturation/paiements`. Sans le droit, elle reste lisible mais ne
    mène nulle part : un chiffre qui ne promet pas une page.
  - la ligne « Dépenses » pointe vers son onglet plutôt que vers
    `/journal/depenses`, qui n'est plus qu'une redirection 308 vers ce même
    onglet.
- Durcissement rendu nécessaire par l'ouverture : les actions du journal des
  dépenses (`app/(app)/journal/depenses/actions.ts`) n'exigeaient qu'une
  session. Elles étaient protégées par ricochet, parce que seule la page pouvait
  les appeler et que la page refusait les autres rôles. Ce ricochet disparaît
  quand la page s'ouvre : le mur est maintenant dans les actions, sous
  `canManageExpenseJournal`. Aucun changement pour admin, comptabilité et
  assistante, qui tenaient déjà le journal.

Vérifié en direct sur le serveur local, connecté comme Me Camille Roy : la page
s'ouvre, aucune action d'écriture n'est proposée, aucun lien ne rebondit.
1439 tests verts, typage et lint propres.

## Ce qui reste ouvert

Le tableau de bord d'un avocat contient encore des liens vers des pages que
`canManageInvoices` lui refuse, et qui le renvoient donc au tableau de bord :
`/facturation/suivi` (factures en retard, pipeline, comptes en souffrance),
`/facturation/frais`, `/facturation/paiements`. Une dizaine de points d'appel
dans `components/dashboard/`.

Deux traitements possibles, à trancher : masquer ces liens quand le rôle ne peut
pas les ouvrir, ou introduire un droit de lecture `canViewBilling` distinct de
`canManageInvoices` (l'écriture resterait gardée). Le second garde le tableau de
bord utile pour une avocate ; le premier ne touche à aucune permission.

Autre irritant repéré au passage : la barre du haut ignore aussi la
configuration d'interface du cabinet (`activeNavIds`), que le menu mobile
respecte. Le cabinet Dérisier n'a pas « comptabilite » dans ses onglets actifs.
