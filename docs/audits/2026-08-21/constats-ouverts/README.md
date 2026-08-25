# Registre des constats d'audit restés ouverts

**Audit** : 2026-08-21, production SAFE Inc., lecture seule
**Registre écrit le** : 2026-08-24
**Auteur du registre** : session Claude Code, sur demande du CEO

---

## ⚠️ Ce que ce registre n'est pas

L'audit du 2026-08-21 prévoyait vingt livrables sous `docs/audits/`. **Deux existent** :
la matrice des permissions et la carte du moteur sans bouton, les deux que le CEO
avait demandés nommément. Le rapport d'audit lui-même n'a jamais été écrit sur disque.

Les constats et leurs identifiants (A-01, C-05…) ont été produits et suivis **dans une
conversation**, pas dans un document. Ce registre existe parce que cette conversation
allait se terminer et emporter avec elle la trace de ce qui avait été vu, mesuré, et
laissé ouvert délibérément.

Il couvre donc **ce qui reste ouvert**, revérifié le 2026-08-24. Il ne remplace pas le
rapport d'audit, qui n'existe pas.

---

## Les six constats ouverts

| Constat | Gravité | En une phrase |
|---|---|---|
| [A-03](A-03_argent_en_virgule_flottante.md) | **P1** | 115 colonnes d'argent en virgule flottante, dont les erreurs s'accumulent sur toute série |
| [A-05](A-05_isolation_des_cabinets.md) | **P1** | 124 tables avec RLS activé, zéro politique, et un rôle applicatif qui la contourne de toute façon |
| [A-07](A-07_solde_fiduciaire_aveugle_au_compte.md) | P2 | Le solde d'un client fusionne ses comptes en fidéicommis au lieu de les distinguer |
| [A-08](A-08_deux_comptes_generaux_possibles.md) | P2 | Un index unique sur colonne nullable n'empêche pas deux comptes généraux par client |
| [B-02](B-02_notes_de_credit_sans_plafond.md) | P2 | Une facture peut être créditée au-delà de son montant, et deux notes simultanées passent |
| [B-03](B-03_interets_le_nom_promet_une_mise_a_jour.md) | P3 | `createOrUpdateInterestCharge` ne contient qu'un `create` |

---

## Comment les lire

Ils ne sont pas de la même nature, et les traiter pareil serait une erreur.

**A-03 et A-05 sont des décisions, pas des correctifs.** Le premier est une migration de
115 colonnes et de tout le code qui les lit. Le second change la façon dont l'application
se connecte à sa base. Ils ont un coût, un risque, et une fenêtre de bascule. Ils demandent
un arbitrage du CEO, pas une séance de code.

**A-07, A-08, B-02 et B-03 portent sur du code qu'aucun écran n'atteint aujourd'hui.**
Notes de crédit, intérêts, second compte en fidéicommis : construits, testés, non branchés.

> Ce n'est pas « réparé », c'est « pas encore dangereux ».

Chaque fiche nomme donc **ce qui rendrait sa correction urgente**. Dans les quatre cas,
c'est le même déclencheur : le branchement. Les traiter avant le bouton coûte moins cher
que de corriger ensuite des données déjà écrites.

---

## Ce qui a été corrigé

Treize correctifs entre le 2026-08-21 et le 2026-08-24, tous déployés en production.

```
daca9c0  un retrait sur un compte pouvait être autorisé par un autre        (fidéicommis)
b3b085f  les fonds d'un dossier réglaient la facture d'un autre             (fidéicommis)
b50bebe  le solde de la facture se recalculait après le commit              (fidéicommis)
a19bdd8  deux relations SetNull rendaient une suppression impossible        (schéma)
958ab7e  une catégorie pouvait venir d'un autre cabinet                     (étanchéité)
f350cb3  le module Édition n'avait aucune notion de qui a le droit d'entrer (accès)
4f714b9  quatorze routes vérifiaient la session, jamais le rôle             (accès)
1ed8dae  un employé qui part gardait son accès, sans moyen de le retirer    (accès)
3333e82  l'état de conformité reste ouvert, le détail fiduciaire non        (accès)
0487a0c  le revenu récurrent annonçait 299,99 $ quand la réponse était 0    (console)
bfe7408  les forfaits ne verrouillaient rien, et promettaient faux          (abonnement)
c79bf9b  l'essai fini cesse de valoir abonnement en cours                   (abonnement)
         + la variable Stripe de production, corrigée sans commit           (déploiement)
```

Deux constats P0 concernaient Stripe. La cause s'est révélée plus simple que prévu :
**Stripe n'a jamais été branché**, clés de test, zéro point d'entrée, zéro événement en
135 jours. Ce qui a suivi (chaîne d'encaissement Interac, accès payé, facture
d'abonnement) découle de ce constat et n'appartient pas à l'audit.

---

## Le motif qui revient

Un même défaut traverse l'audit, au point d'avoir sa propre carte
([`../CARTE_MOTEUR_SANS_BOUTON.md`](../CARTE_MOTEUR_SANS_BOUTON.md)) :

> du code construit, testé, correct, et que rien n'appelle.

Il s'est manifesté encore le 2026-08-24, hors audit : `prolongerAccesApresPaiement`
lisait `Invoice.accesMoisCouverts`, un champ qu'aucun code n'écrivait, sur une facture
qu'aucun code ne savait créer. Quatre des six constats ouverts sont de la même famille.

Ce n'est pas un défaut de qualité. C'est un défaut de séquence : le moteur se construit
avant que quiconque ait eu besoin de s'en servir.
