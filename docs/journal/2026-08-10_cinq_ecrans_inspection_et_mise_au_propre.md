# 2026-08-10 — Les cinq dernières portes, et un dépôt remis d'aplomb

Fin du chantier des écrans de conformité, ouvert le 4 août. La section
[Inspection](../compliance/REEVALUATION_2026-08-10.md) n'a plus de dalle « à venir ».

## Ce qui a été construit

Cinq écrans, tous sous `/inspection` :

| Écran | Article | Ce qu'il débloque |
|---|---|---|
| Rapport annuel | art. 42 | Produire, certifier, consigner la transmission |
| Cycle de vie | art. 7, 9, 19, 78 | Cessionnaire, prescriptions, dossiers fermés, originaux du client |
| Conservation | art. 29-33 · s. 21-23 | Durées, échéances de purge, registre des accès inspecteur |
| Transmission des factures | art. 56(2) · s. 9(1)3 | **Débloque les retraits** sur factures postées |
| Virements électroniques | s. 12 | Form 9A, double contrôle, contresignature |

## Trois décisions de fond

**La fin d'exercice se règle sur l'écran Conservation.** Le blocage renvoyait vers des
paramètres où le champ n'existait pas. Un blocage qui pointe vers une page sans remède
ne se lève jamais. La date est consignée à la piste d'audit : elle déplace des
échéances de destruction.

**Le jeton d'accès inspecteur n'est pas affiché.** Il n'ouvre rien : SAFE n'a pas de
portail de consultation. L'écran tient un REGISTRE des accès, et il l'écrit. Montrer
un secret qui n'ouvre aucune porte laisserait croire le contraire.

**Un cabinet québécois ne voit pas le Form 9A.** B-1 r.5 n'a aucun équivalent de la
s. 12. Lui imposer inventerait une obligation, faute aussi grave que d'en omettre une.
Il voit son propre régime (art. 58), sourcé.

## Ce que la mise au propre a révélé

179 fichiers dormaient hors de `git`. Le volume n'était pas le problème. Deux pièges
l'étaient.

**Deux migrations Prisma non suivies.** CH-02, CH-03, CH-05, CH-07, CH-10 à CH-13
étaient dans le dépôt. CH-08 et CH-09 ne l'étaient pas. Elles créent `TrustProperty`,
`TrustAnnualReport`, `TrustAnnualMonthlyTotal` et `TrustAnnualClosedAccount` — les
tables que lisent les écrans « Autres biens » et « Rapport annuel », livrés le matin
même. Sur un déploiement neuf, `prisma migrate deploy` ne les aurait pas créées : les
deux écrans auraient planté à l'ouverture.

C'est la même famille que le build Vercel cassé la semaine dernière — du code commité
qui dépend de fichiers non suivis. À une différence près, et elle est mauvaise :
celui-ci ne se serait pas vu au build. Il aurait attendu le premier cabinet.

**Quatre composants non suivis, importés par des fichiers modifiés.** `ui/Figure`,
`ui/QueryErrorState`, `layout/AlertCenter`, `ds-safe/DesignSystemSpecimen`. Les
séparer au moment de commiter aurait cassé le build. Ils sont partis ensemble.

Au passage : `SAFE_PREMIUM_DESIGN_STANDARD.md` et `IDENTITE_SAFE.md`, que `CLAUDE.md`
désigne comme sources de vérité depuis des semaines, n'étaient pas dans le dépôt. La
page `/marque`, citée comme contrôle visuel du logo, non plus.

## La palette n'avait pas de rouge

36 occurrences de `#B84A3E` et 20 de `#8F3529` se baladaient dans les écrans. Ces deux
valeurs n'existaient nulle part : ni dans `lib/ds/tokens.ts`, ni dans la charte. La
palette `si-*` avait un vert, un ambre, un « vérifié », et pas de danger. Chaque écran
avait bouché le trou dans son coin.

`danger` et `dangerInk` rejoignent la palette avec leurs valeurs exactes. Substitution
sans perte, vérifiée dans le CSS compilé du build : `rgb(184 74 62/.05)`. Zéro erreur
ESLint sur `inspection/` et `conformite/`, contre 110.

## Ce qui a été observé, et qui devient la priorité

**Aucun écran ne permet de déclarer un compte en fidéicommis.**
`openTrustBankAccount` n'est appelé que depuis `scripts/seed-trust-demo.ts`.

Les onze écrans d'inspection commencent alors tous par « Aucun compte en fidéicommis
n'est enregistré ». Un cabinet neuf reste bloqué à la marche zéro, et les 19 documents
producibles retombent à 6.

C'est le même motif que tout le programme : un moteur complet derrière une porte qui
n'existe pas. Sauf que celle-ci est la première du couloir.

## État du dépôt

- 5 commits, arbre propre
- 1432 tests verts
- `tsc` et `next build` vérifiés sur **HEAD isolé en worktree**, pas sur l'arbre de
  travail : c'est la leçon du build Vercel cassé
- 169 pages générées, contre 164 avant
- **83 commits d'avance sur `main`**, qui ne contient aucun écran d'inspection

## Prochaine action

L'écran d'ouverture de compte en fidéicommis (art. 34-37 QC · s. 7-8 ON). Puis la
fusion vers `main` : 83 commits d'écart, c'est le principal risque opérationnel du
dépôt aujourd'hui.
