# A-03 — L'argent est stocké en virgule flottante

**Gravité** : P1
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24

## Ce qui a été mesuré

```
Colonnes `Float` au schéma ......................... 142
dont colonnes portant de l'argent .................. 115
(montant, total, solde, taux, tps, tvq, honoraires, paid, due, credit, subtotal…)
```

Commande : `grep -E "^\s+\w+\s+Float" prisma/schema.prisma`

## Pourquoi c'est un problème

Un nombre à virgule flottante ne représente pas exactement les décimales de base 10.
Mesuré sur la machine de développement le 2026-08-24 :

```
0.1 + 0.2        = 0.30000000000000004
0.01 × 1000 fois = 9.999999999999831      (au lieu de 10.00)
```

L'erreur est invisible sur une opération et s'accumule sur une série. Les endroits
qui font des séries sont exactement ceux qui comptent : totalisation d'une facture,
somme d'un registre de fidéicommis, rapprochement mensuel, export comptable.

Un rapprochement de fidéicommis qui tombe à 0,01 $ près n'est pas un rapprochement.
Le règlement ne prévoit pas de tolérance.

Le code se défend déjà par des epsilons (`EPSILON = 0.005` dans le module
facturation, arrondis `round2`). Ces défenses traitent le symptôme et prouvent que
le problème est connu. Elles ne le suppriment pas.

## Pourquoi ce n'est pas corrigé

Ce n'est pas un correctif, c'est une migration.

- 115 colonnes à passer de `Float` (`double precision`) vers `Decimal(12,2)`.
- Tout le code qui les lit reçoit alors un `Prisma.Decimal` et non un `number` :
  chaque addition, comparaison et sérialisation JSON est à revoir.
- Les tests existants comparent des nombres avec `toBe(149.99)` et casseront en bloc.
- Il existe une fenêtre où les deux types coexistent en production.

C'est une décision d'architecture avec un coût et un risque, pas une ligne à changer.

## Ce qui rendrait la correction urgente

- Un rapprochement de fidéicommis qui ne tombe pas juste chez un vrai cabinet.
- Le branchement de l'export comptable vers un logiciel tiers, qui refusera un écart.
- Le premier cabinet dont le volume dépasse quelques centaines de transactions.

## Voir aussi

- [A-07](A-07_solde_fiduciaire_aveugle_au_compte.md) — soldes de fidéicommis, même surface de risque
- Doctrine : `docs/accounting/` (journal append-only, double entrée à l'export)
