# B-02 — Une facture peut être créditée au-delà de son montant

**Gravité** : P2
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24

## Ce qui a été mesuré

`lib/services/billing/credit-note-service.ts`, séquence de `createCreditNote` :

```
 45   if (!invoice) throw new Error("Facture introuvable")        <- lecture
 48   const balanceOrTotal = invoice.balanceDue ?? invoice.totalInvoiceAmount ?? ...
 49   const amount = creditFull ? balanceOrTotal : (creditAmount ?? balanceOrTotal)
 50   if (amount <= 0) throw new Error("Le montant à créditer doit être positif")
 66   const creditNoteNumber = await getNextCreditNoteNumber(cabinetId)
 69   await prisma.creditNote.create({ ... })                      <- écriture
```

Lignes relevées le 2026-08-24. Entre la lecture (45) et l'écriture (69), aucune
transaction, aucun verrou.

Deux défauts distincts sur cette séquence.

## 1. Aucun plafond cumulé

Le montant est comparé au solde de la facture, **jamais à la somme des notes de
crédit déjà émises sur elle**. Rien n'empêche donc, en deux gestes successifs, de
créditer plus que ce que la facture vaut. Le seul contrôle est `amount <= 0`.

## 2. Lecture et écriture ne sont pas dans la même transaction

La facture est lue au début, la note est créée à la fin, sans transaction ni verrou
entre les deux. Deux notes de crédit émises en même temps sur la même facture lisent
le même `balanceDue`, le trouvent chacune suffisant, et se créent toutes les deux.

C'est le même motif que A-02, corrigé le 2026-08-22 sur les retraits de fidéicommis
en relisant le solde de la facture sous `pg_advisory_xact_lock('invoice:<id>')`.
La correction est donc connue et déjà écrite ailleurs dans le dépôt.

## Pourquoi ce n'est pas corrigé

**Les notes de crédit ne sont branchées à aucun écran.** Le service existe, rien ne
l'appelle depuis l'interface. Le défaut est réel et actuellement inatteignable.

Ce n'est pas « réparé », c'est « pas encore dangereux ».

## Ce qui rendrait la correction urgente

**Le bouton.** Le jour où une note de crédit devient émissible depuis l'interface,
ce constat devient un trou dans une facture, c'est-à-dire dans un document remis à
un client et inscrit au journal.

À traiter **avant** le branchement, pas après. C'est moins cher, et ça évite d'avoir
à corriger des données déjà écrites.

## Voir aussi

- [B-03](B-03_interets_le_nom_promet_une_mise_a_jour.md) — même module, même état (construit, non branché)
- A-02, corrigé : le verrou consultatif à reprendre tel quel
