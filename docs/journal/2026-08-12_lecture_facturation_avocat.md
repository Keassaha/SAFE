# 2026-08-12 — La facturation s'ouvre en lecture, et le tableau de bord tient ses promesses

Suite directe de « La comptabilité s'ouvre à l'avocate ». Il restait une dizaine
de liens, sur le tableau de bord d'une avocate, qui la renvoyaient au tableau de
bord.

## Ce qu'on a découvert avant de choisir

Le mur n'en était pas un.

Sur la douzaine de pages sous `/facturation`, cinq seulement utilisaient
`canManageInvoices` : `suivi`, `frais`, `paiements`, `verification`,
`notes-de-credit`. Tout le reste était déjà ouvert à l'avocate :

- `/facturation` (le hub), `/facturation/factures/[id]`,
  `/facturation/honoraires`, `/facturation/nouvelle` n'ont aucune garde de rôle,
  une session suffit ;
- `/facturation/creances-aging`, `/rentabilite`, `/taxes`,
  `/temps-non-facture` passent par `canViewBillingTrust`, qui admet l'avocat
  depuis longtemps.

Elle voyait donc la liste de ses factures et l'âge de ses créances, mais
rebondissait sur le pipeline de suivi qui affiche les mêmes factures. La ligne
n'était pas une frontière de confidentialité choisie, c'était le hasard de
quelle page avait reçu quelle garde.

## Décision CEO

Introduire `canViewBilling`, droit de LECTURE distinct de `canManageInvoices`,
plutôt que masquer les liens du tableau de bord.

Deux raisons. On n'invente pas une politique, on écrit celle qui existait déjà
en pratique. Et masquer aurait demandé le même volume de plomberie (faire
descendre un drapeau depuis `tableau-de-bord/page.tsx` jusqu'à `BillingPipeline`,
`BillingFollowUpTable` et `OutstandingAccountsTable`, qui ne reçoivent pas le
rôle) pour retirer de la valeur à l'écran de l'avocate.

Contrepartie assumée : dans un cabinet à plusieurs avocats, chaque avocat lit
les encaissements de tout le cabinet.

## Ce qui a changé

- `canViewBilling` accepte les quatre rôles du cabinet. Liste explicite, un rôle
  futur est refusé par défaut.
- Les cinq pages passent à `requirePageAccess(canViewBilling)`. Trois d'entre
  elles (`suivi`, `verification`, `notes-de-credit`) n'avaient déjà aucune
  action d'écriture : rien à masquer.
- Les actions restent sous `canManageInvoices`, et disparaissent sans ce droit :
  - `suivi` : le bouton « Nouvelle facture » ;
  - `frais` : le bouton « Nouveau débours » ;
  - `paiements` : la barre entière (saisie, import de preuve, et le lien
    « payeurs tiers » qui mène lui aussi à une page gardée), l'édition,
    l'allocation, la demande de remboursement, et les quatre modales.
- Trois GET d'API s'ouvrent à la lecture (`paiements`, `surpaiements`,
  `credit-notes`). Tous les POST, PATCH et DELETE gardent `canManageInvoices`.
- Deux pièces jointes suivent la lecture plutôt que l'écriture : le reçu de
  paiement et la preuve conservée. Elles portent sur des paiements déjà visibles
  dans la table ; les laisser fermées aurait affiché deux icônes qui répondent
  403.
- `/api/facturation/paiements/context` reste fermé. Sans droit d'écriture les
  modales ne sont pas montées, la requête n'est jamais déclenchée.
- `lib/auth/effective-access.ts` : `facturation.view` et `paiements.view`
  suivent `canViewBilling`. Sans ça, l'onglet Accès de la fiche employé aurait
  annoncé un refus que le code n'applique plus.

Un dernier détail relevé à l'écran : la liste vide des débours invitait à
cliquer sur « Nouveau débours », bouton désormais masqué en lecture seule. Une
seconde formulation (`noDisbursementsReadOnly`) remplace l'invitation par un
constat.

Trois tests ajoutés, dont l'invariant « qui écrit peut lire » : un rôle avec
`canManageInvoices` mais sans `canViewBilling` signalerait que les deux gardes
ont divergé. 1442 tests verts, typage et lint propres.

## Vérifié en session réelle

Connecté comme Me Camille Roy, rôle `avocat`, sur le cabinet de démonstration
(28 dossiers, 21 clients). Les cinq pages s'ouvrent, aucune ne rebondit :

- `suivi` : les deux colonnes s'affichent, pas de bouton « Nouvelle facture » ;
- `paiements` : la table se charge (le GET répond), aucune barre d'action ;
- `frais` : les deux montants et la liste, pas de bouton « Nouveau débours » ;
- `verification` et `notes-de-credit` : listes complètes.

## Titre du tableau de bord

Défaut repéré au passage et corrigé. La bascule sur `DashboardViewSafe` avait
perdu le `PageHeader` que portait `DashboardView` : l'écran s'ouvrait
directement sur la décision du jour, seul de l'application à ne pas se
présenter. Le titre revient, sans le sous-titre (le premier écran doit rester
des chiffres), et le titre de la bande d'action passe de `h1` à `h2` pour qu'il
n'y ait qu'un seul `h1` par page.

## Ce qui reste ouvert

Deux entrées de menu n'ont pas été touchées, faute de décision :

- la barre du haut et `SidebarNav` n'affichent « Facturation » que sous
  `canManageInvoices`, alors que `/facturation` n'a aucune garde de rôle et
  s'ouvre déjà à tout le monde. Le menu cache ici quelque chose qui fonctionne,
  l'inverse du défaut du 2026-08-12 ;
- dans `/comptabilite`, l'onglet Paiements reste masqué sous
  `canManageInvoices`. Sa justification écrite (« l'API qui le sert vérifie
  `canManageInvoices`, il n'aurait affiché qu'une erreur ») ne tient plus
  maintenant que le GET est ouvert.
