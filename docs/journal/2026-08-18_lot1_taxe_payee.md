# 2026-08-18 — Lot 1 : la taxe payée existe enfin sur les trois chemins

## Le défaut

`CabinetExpense` porte `montantHt`, `tps`, `tvq` depuis le début. Trois chemins créent
des dépenses, et un seul les remplissait : l'import de reçu par IA, c'est-à-dire le
chemin de plus **faible** volume. L'import bancaire, qui fait le gros du volume, écrivait
`montant = montantTtc = rawAmount` et s'arrêtait là.

La conséquence n'est pas cosmétique : un cabinet remet la taxe collectée sans déduire la
taxe payée sur ses achats. Il remet trop, tous les trimestres, sans jamais le voir.

## Trois origines, pas deux

La spec parlait de « déclarée » et « estimée ». Il en fallait une troisième, sinon une
dépense **sans** taxe est indiscernable d'une dépense dont on n'a pas su **lire** la
taxe. Ce sont deux situations opposées : la première est un fait qui s'affiche, la
seconde est un trou qui se comble avec la pièce.

| Origine | Sens | Réclamable |
| --- | --- | --- |
| `DECLAREE` | la pièce le dit | **oui** |
| `ESTIMEE` | décomposée d'un TTC | non |
| `AUCUNE` | la catégorie n'en porte pas | non |

`NULL` reste distinct des trois : il signifie « origine inconnue » pour les dépenses
antérieures au lot, et surtout pas « sans taxe ». Leur reprise est un lot à part, et elle
marquera `ESTIMEE`, jamais `DECLAREE`.

## Estimée n'est pas réclamable

C'est le point que la recherche du 17 imposait à la spec (§2.2 c) et qui gouverne tout le
module : le montant de taxe est exigé sur la pièce dès le premier dollar pour la TVQ. Une
taxe obtenue en décomposant un TTC sert à la justesse des états et à la prévision, jamais
à la déclaration.

D'où `taxeReclamable()`, qui sépare au lieu d'additionner. Additionner sans filtrer
gonflerait la demande de remboursement avec des montants qui ne se justifient pas en
vérification. C'est exactement le « faux positif silencieux » que la recherche désignait
comme risque principal.

## L'ordre des règles n'est pas indifférent

Le régime de la catégorie est consulté **avant** la déclaration. Une catégorie sans taxe
dure refuse donc même une saisie.

C'est le piège de l'assurance : la taxe sur les primes existe au Québec et n'est **pas**
récupérable. Si le cabinet la voit sur sa facture et la saisit, l'accepter la ferait
entrer dans les récupérables. L'ordre inverse aurait produit exactement le défaut que le
lot 0 bis cherchait à empêcher.

## Livré

- `lib/expense-journal/tax-decomposition.ts` : fonction pure, pilotée par le régime du
  lot 0 bis.
- Migration additive `20260818120000_expense_tax_origin` : enum à trois valeurs, colonne
  nullable, index `(cabinetId, taxOrigin)` pour le futur écran des taxes à confirmer.
- Les **trois** chemins branchés : import bancaire, import de reçu, édition manuelle.
- `EditCabinetExpenseInput` expose enfin `tps`, `tvq`, `montantHt`. Le cabinet ne pouvait
  rien corriger jusqu'ici : le type n'avait aucun champ de taxe, donc ce que l'import
  n'avait pas rempli restait vide pour toujours.
- 16 tests, dont l'invariant HT + taxes = TTC au centime sur quatre montants et deux
  régimes.

## Ce qui manque pour que le lot compte comme fait

**L'écran.** La règle R-04 de la doctrine d'ancrage dit qu'une fonctionnalité bâtie mais
invisible à l'écran n'existe pas et compte comme non faite. C'est le cas ici : l'action
d'édition accepte une taxe lue sur la pièce, aucun formulaire ne la propose. Un cabinet
ne peut donc toujours pas corriger une taxe, même si le moteur sait la recevoir.

C'est la prochaine chose à faire avant d'ouvrir le lot 2.

**La reprise de l'historique** (arbitrage CEO n° 4) reste entière : les dépenses déjà
saisies portent `taxOrigin = NULL` et ne comptent nulle part. Sans elle, le premier
dossier de fin d'année n'a pas de valeur.
