# 2026-08-18 — Lot 2 : la déductibilité, portée par la catégorie

## Les deux catégories qui manquaient

`DEFAULT_EXPENSE_CATEGORIES` comptait 24 entrées, sans **repas / représentation** ni
**véhicule**. Ce sont les deux dépenses les plus fréquentes d'un cabinet solo, et les
deux **seules** qui ne se déduisent pas à 100 %.

Absentes de la liste, elles atterrissaient dans « Autres » et se déduisaient en plein.
Un cabinet qui déduit ses repas à 100 % ne s'en aperçoit pas avant la vérification.

## La règle vit sur la catégorie, jamais sur la dépense

Conséquence voulue : le cabinet n'a **jamais** à se souvenir d'un pourcentage. Il classe
correctement, le reste suit. C'est aussi ce qui rend la règle modifiable en un seul
endroit le jour où elle change.

## Deux taux, pas un

C'est la correction que la recherche du 17 imposait à la spec. La limite de 50 % sur les
repas s'applique à la déduction au revenu **et** au crédit de taxe : quand la déduction
est limitée à moitié, seuls 50 % de la TPS/TVH payée sont réclamables en CTI.

Ne limiter que le revenu ferait réclamer **le double** de ce que la loi permet. Les deux
taux coïncident aujourd'hui ; ils sont portés séparément parce que les confondre casserait
à la première règle où ils divergent.

Conséquence immédiate, livrée : `taxeReclamable` applique désormais le taux de la
catégorie. Un repas de 114,98 $ rend 7,49 $ de crédit, pas 14,98 $.

## Un plafond n'est pas un taux

Au Québec, la déduction des frais de représentation est le **moindre** de 50 % et d'un
plafond fondé sur le chiffre d'affaires annuel. Ce plafond ne se connaît qu'en fin
d'exercice et s'applique au **cumul**, pas à la ligne.

D'où une règle dure du module : il ne calcule **jamais** un « montant déductible » par
dépense, parce que ce montant n'existe pas avant la clôture. Il rend un taux et signale
qu'un plafond s'ajoutera. Le calcul appartient au dossier de fin d'année (lot 4).

Un test verrouille l'absence de montant par ligne, pour que personne ne l'ajoute par
commodité un jour.

## Le véhicule sans prorata reste inconnu

Ni zéro, ni cent : `null`.

Zéro ferait croire que rien n'est déductible, ce qui est faux. Cent réclamerait un usage
personnel. Inconnu est la seule réponse honnête, et un troisième seau (`indetermine`) a été
ajouté à `taxeReclamable` pour recueillir cette taxe sans la réclamer ni la faire
disparaître.

C'est la traduction en code de l'arbitrage CEO n° 1 : le prorata est une valeur saisie,
assumée plus faible qu'un registre kilométrique, et le dossier de fin d'année doit la
classer en zone d'incertitude tant que le registre n'existe pas.

Un prorata aberrant (négatif, ou supérieur à 1) est refusé plutôt qu'appliqué.

## Reste pour clore le lot 2

- **Le stockage du prorata véhicule.** Le moteur le consomme, rien ne le saisit encore.
  C'est un champ de configuration du cabinet, daté, et il lui faut un écran.
- **Les paliers du plafond québécois** restent `A_CONFIRMER` depuis le 17 : 2 %, 650 $ ou
  1,25 % du chiffre d'affaires « selon le cas », sans que les bornes soient connues. Sans
  eux, le plafond ne peut pas être calculé au lot 4.
- **Le traitement ontarien du plafond**, également `A_CONFIRMER`.

## Vérifié

16 tests sur la déductibilité, 1552 au total, `tsc` et lint propres. Aucune vérification à
l'écran : ce lot n'a pas encore d'écran, par construction, puisque la règle §2.2 b interdit
d'afficher un montant déductible par ligne.
