# 2026-07-30 — Lot L1 : garde d'accès unique de la Console

## Décision

Le CEO valide le lancement du chantier selon la priorisation recommandée. L1 en premier :
il ne dépend de rien, il ferme un vrai trou, et il est petit.

**Condition de terminé fixée avant de commencer** : toutes les actions Console passent par
une garde unique, et des tests le prouvent.

## Le trou refermé

Le layout de la Console exigeait `isInternal` **et** rôle admin. Les server actions, elles,
vérifiaient seulement `isSafeIncCabinet`, c'est-à-dire « le cabinet s'appelle SAFE ».

Une server action est un endpoint POST autonome : le layout ne la protège pas. Un compte
`avocat` ou `assistante` du cabinet SAFE pouvait donc créer des leads, déplacer des cartes
du pipeline, écrire des activités et répondre aux billets de support en appelant l'action
directement, alors que l'écran lui était refusé.

## Ce qui a été fait

### Une garde, deux formes

`lib/safe-inc.ts` :

- `hasConsoleAccess(userId, role)` : version booléenne, pour les endroits où l'accès Console
  est un privilège supplémentaire et non un prérequis.
- `requireConsoleAccess()` : version qui lève, pour les server actions.
- `CONSOLE_ACCESS_DENIED` : message unique, qui ne dit pas laquelle des deux conditions a
  échoué.

Le rôle est évalué **avant** la lecture en base : un non-admin ne déclenche aucune requête.

### Dix fichiers d'actions alignés

Les 10 fichiers d'actions sous `app/(app)/console/` passent maintenant par
`requireConsoleAccess()`. Trois l'utilisaient déjà (actions-clés, courriel, assistant), sept
ont été convertis. La page serveur `clients/nouveau` utilise `hasConsoleAccess`.

`requireSafeSuperadmin`, qui ne vérifiait que le nom du cabinet, était du code mort : zéro
usage dans tout le repo. Réécrit sur la nouvelle garde plutôt que laissé en piège.

### Deux routes API où le privilège était inter-cabinets

`app/api/support/messages/route.ts` et `app/api/support/attachments/[id]/route.ts`
utilisaient `isSafeIncCabinet` non pas comme garde d'accès mais comme **discriminant de
rôle** : « suis-je le côté SAFE ou le côté client ». Ce booléen accorde le droit d'écrire
dans le fil de n'importe quel cabinet et de lire n'importe quelle pièce jointe.

Le remplacer par `isSafeIncCabinet` aurait été une erreur d'analyse, le supprimer aussi.
Il est remplacé par `hasConsoleAccess`, ce qui conserve le comportement bidirectionnel tout
en réservant le privilège inter-cabinets aux administrateurs internes.

### Un défaut découvert au passage

`/tableau-de-bord` redirigeait vers `/console` tout membre du cabinet SAFE, et la Console
renvoyait les non-admin vers `/tableau-de-bord`. **Boucle de redirection infinie** pour un
membre non-admin du cabinet SAFE. Le défaut existait déjà, la garde correcte l'a rendu
visible. Les deux conditions sont maintenant alignées sur `hasConsoleAccess`.

## Tests

`lib/__tests__/console-access.test.ts`, 13 tests. Les cas qui comptent :

- interne + admin passe
- interne non-admin refusé, sur les trois rôles
- admin d'un cabinet client refusé
- **membre du cabinet SAFE avec un rôle non-admin refusé** : le trou de ce lot
- utilisateur introuvable refusé
- rôle inconnu refusé, pas de blanc-seing
- le message d'erreur ne distingue pas les deux causes
- un échec de session n'est jamais transformé en accès accordé

## Vérifié

- `npx tsc --noEmit` : aucune erreur sur les fichiers touchés.
- Suite complète : **770 tests verts**, stable sur deux exécutions consécutives.
- Audit par grep : les 10 fichiers d'actions Console appellent `requireConsoleAccess`.
- Les trois usages restants de `isSafeIncCabinet` sont légitimes : ils répondent à « suis-je
  le cabinet SAFE » pour l'affichage (navigation consultant, page comptabilité), pas à une
  question d'autorisation.

### Deux fausses pistes écartées

Une exécution intermédiaire a montré 7 tests fidéicommis en échec. Vérification faite :
tous tracent vers `lib/services/fideicommis/` et `lib/cabinet/get-province.ts`, aucun lien
d'import avec les fichiers touchés ici. Une **autre session travaille en parallèle sur le
fidéicommis** dans le même dossier de travail, et écrivait pendant l'exécution. Les deux
exécutions suivantes sont vertes.

De même, `tsc` signale deux erreurs dans
`lib/services/fideicommis/__tests__/ch00-withdrawal-guards.test.ts`, fichier non suivi par
git créé par l'autre session pendant ce lot. Hors périmètre.

## Non vérifié

Pas de vérification au navigateur : la garde ne se voit qu'en se connectant successivement
avec plusieurs rôles, ce que je ne fais pas moi-même. Les tests couvrent la logique, le
parcours d'écran reste à confirmer par le CEO à la prochaine connexion.

## Rien n'est commité

Le dossier de travail contient beaucoup de travail non commité d'autres sessions
(rapport d'audit, fidéicommis, landing, schéma Prisma). Aucun commit n'a été fait pour ne
pas emporter ce travail. À committer de façon chirurgicale quand le CEO le décidera.

## Suite

Lot L2 : conversion Lead → Cabinet. C'est le seul lot vraiment bloquant du MVP.
