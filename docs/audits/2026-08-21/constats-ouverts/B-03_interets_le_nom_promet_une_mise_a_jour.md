# B-03 — `createOrUpdateInterestCharge` ne met jamais rien à jour

**Gravité** : P3
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24

## Ce qui a été mesuré

`lib/services/billing/interest-service.ts:16` déclare :

```ts
export async function createOrUpdateInterestCharge(params: { ... })
```

Le corps de la fonction ne contient qu'une écriture, `lib/services/billing/interest-service.ts:44` :

```ts
const charge = await prisma.interestCharge.create({ ... })
```

Aucun `update`, aucun `upsert`, aucun `findFirst` préalable.

## Ce que ça produit

Chaque passage crée une charge d'intérêt de plus. Appelée deux fois sur la même
facture pour la même période, la fonction empile deux charges au lieu d'en corriger
une. La facture porte alors des intérêts comptés en double.

Le nom rend le défaut plus dangereux qu'il n'en a l'air : un appelant qui lit
`createOrUpdate` a toutes les raisons de croire qu'il peut appeler la fonction
plusieurs fois sans conséquence. C'est exactement ce que le nom promet.

## Pourquoi ce n'est pas corrigé

Les intérêts ne sont branchés à aucun écran ni à aucune tâche planifiée. La fonction
n'est appelée que depuis `lib/services/billing/index.ts`, qui la réexporte.

## Correction attendue

Deux gestes, dans cet ordre :

1. **Renommer** en `createInterestCharge` tant que la mise à jour n'existe pas. Un
   nom qui ment coûte plus cher que la fonction manquante.
2. Poser la clé d'unicité réelle (facture + période) et faire un `upsert`, ou refuser
   explicitement le doublon.

## Ce qui rendrait la correction urgente

Le branchement des intérêts sur créance en retard, qui deviendra tentant dès que les
impayés seront suivis. La facture 2026-002 de Derisier Law, émise le 2026-08-01 et
impayée, est le premier cas réel où la question se posera.

## Voir aussi

- [B-02](B-02_notes_de_credit_sans_plafond.md) — même module, même état
