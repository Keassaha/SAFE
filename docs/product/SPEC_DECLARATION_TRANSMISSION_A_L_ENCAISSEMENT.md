# Déclarer la transmission là où l'argent arrive

Date : 2026-09-14
Statut : **proposition**. Aucun code écrit. En attente du oui du CEO.
Demande : « peux-tu créer un processus pour cela ? », après le constat du 2026-09-13
qu'une facture payée pouvait n'avoir jamais été transmise sans que rien ne se passe.

---

## 1. Le problème, en une phrase

De l'argent entre sur une facture que le client n'a peut-être jamais reçue, et le seul
endroit où réparer est un écran que personne n'ouvre en encaissant.

---

## 2. Ce qui existe déjà, et qu'il ne faut pas rebâtir

Le produit sait presque tout faire. Vérifié dans le code le 2026-09-14 :

| Pièce | Où | État |
|---|---|---|
| La doctrine de la transmission, lue sur les textes | `lib/compliance/invoice-delivery.ts` | Complète depuis le 2026-07-30 |
| Les six canaux, dont cinq déclarables | même fichier | Complets |
| Le service qui écrit la déclaration et son journal d'audit | `lib/services/billing/invoice-delivery-service.ts` | Complet |
| L'écran de déclaration, en masse | Inspection › Transmission des factures | Livré |
| Le blocage du retrait de fidéicommis sur facture non transmise | `trust-transaction-service.ts` | **Déjà en place, et il bloque** |
| Le signalement dans le registre des factures | `FacturationTable` | Livré hier |
| **Le mécanisme d'avertissement à l'encaissement** | `lib/accounting/anti-erreurs.ts` + `createPayment` | **Construit, renvoyé par l'API, et affiché nulle part** |

Ce dernier point décide de tout. `createPayment` calcule des `GuardWarning`, la route
`POST /api/facturation/paiements` les renvoie au navigateur, et **aucun des trois écrans
de paiement ne les lit**. Un avertissement existe déjà (« paiement sans facture
associée ») et personne ne l'a jamais vu.

Ce chantier est donc d'abord un cas du §4.2 de la règle de build : rendre visible et
utilisable quelque chose qui est déjà construit. Il supprime aussi une saisie réelle
(§4.1) : aujourd'hui, réparer demande de quitter l'écran, d'ouvrir Inspection, d'y
retrouver la facture.

---

## 3. La règle

Une seule, pure, testable sans navigateur, à ajouter à `anti-erreurs.ts` à côté des
quatre qui y vivent :

> **Un encaissement s'applique à une facture dont aucune transmission n'est
> enregistrée.** Ce n'est pas une faute : le cabinet a pu la poster. C'est une
> incohérence tant qu'elle n'est pas déclarée.

Elle ne se déclenche pas :
- si la facture porte déjà une `deliveredAt`, quel que soit le canal ;
- si le paiement n'est rattaché à aucune facture (c'est l'autre avertissement, qui
  existe déjà) ;
- sur un retrait de fidéicommis, qui est **bloqué** plus haut et n'a pas besoin d'être
  averti.

---

## 4. Les trois moments

Le même avertissement, au même endroit de l'écran, aux trois endroits où l'argent
rencontre une facture :

| Moment | Écran | Ce qu'il faut ajouter |
|---|---|---|
| Enregistrer un paiement sur une facture | `PaiementFormModal` | Lire les `warnings` déjà renvoyés |
| Allouer un paiement existant à une facture | `PaiementAllocationModal` | `allocateToInvoices` ne renvoie rien : lui faire renvoyer des `warnings`, comme `createPayment` |
| Confirmer une preuve de paiement importée | `ImportPreuveModal` | Lire les `warnings` déjà renvoyés |

---

## 5. Ce que la personne voit

**Après.** Jamais avant. Le paiement est enregistré, il est déjà au journal. Un bandeau
ambre s'ouvre en tête du registre des paiements :

> ⚠ **Paiement enregistré. La facture 2026-0039 n'a jamais été transmise au client.**
> Le règlement n'ouvre le retrait du fidéicommis que pour la facturation qui a été
> envoyée (B-1 r.5, art. 56(2)). Si vous l'avez postée ou remise en main propre,
> déclarez-le : la date et le canal suffisent.
>
> [ Déclarer la transmission ]  ·  Plus tard

**La déclaration : deux champs.** La date et le canal, ce que
`getDeclarationRequirements()` exige, et rien de plus. Les cinq canaux déclarables
seulement : « Courriel envoyé depuis SAFE » n'est jamais proposé, parce que lui seul est
prouvé et que personne ne doit pouvoir se l'attribuer. Le code le refuse déjà
(`findMissingDeclarationFields`).

Une phrase le dit en clair : SAFE date la déclaration et l'attribue, il ne la présente
jamais comme une preuve d'envoi.

**« Plus tard » ne perd rien.** La facture garde sa marque rouge au registre, et
Inspection › Transmission des factures continue de les lister toutes.

Image : `docs/journal/captures/2026-09-14_transmission_processus.png`

---

## 6. Ce que le processus ne fait jamais

- **Il ne refuse pas l'argent.** L'argent est reçu ; refuser de l'inscrire ferait mentir
  SAFE sur le compte en banque.
- **Il ne bloque pas.** La doctrine du module dit pourquoi : un cabinet qui poste ses
  factures a bel et bien envoyé sa facturation, et le lui refuser produit du
  contournement, donc la perte de traçabilité qu'on voulait éviter.
- **Il ne touche pas au retrait de fidéicommis**, qui lui est bloqué, à bon droit, et
  l'est déjà.
- **Il ne réclame pas de pièce jointe.** Ce serait faire de la porte de sortie un second
  mur.
- **Il ne présume pas le canal**, et ne maquille pas une déclaration en preuve.

---

## 7. Ce qu'il y a à construire

Petit, et surtout additif.

1. `warnPaymentOnUndeliveredInvoice()` dans `anti-erreurs.ts`, pure, avec ses tests.
2. `createPayment` l'appelle : il lit déjà la facture, il a `deliveredAt` sous la main.
3. `allocateToInvoices` renvoie des `warnings` au lieu de `void`.
4. Un composant d'avertissement partagé, lu par les trois écrans de paiement.
5. Une fenêtre de déclaration réutilisant `declareInvoiceDelivery`, qui existe.
6. Une route serveur pour l'appeler depuis la facturation (l'action existante vit sous
   Inspection).
7. Les libellés, dans les deux langues.

Rien à migrer : `deliveredAt`, `deliveryChannel`, `deliveryDeclaredById` et
`deliveryNote` sont déjà en base.

---

## 8. Les deux questions que je ne tranche pas

1. **Faut-il aussi demander la transmission au moment d'émettre la facture ?**
   « Vous venez de créer la facture 2026-0043. Comment la transmettez-vous ? » Cela
   empêcherait l'incohérence au lieu de la réparer. C'est un autre moment, un autre
   écran, et un chantier à part. À ouvrir ou non.
2. **Une transmission déclarée après la date du paiement doit-elle alerter ?** On ne
   paie normalement pas une facture qu'on n'a pas reçue. Le règlement ne l'interdit pas ;
   la règle existe uniquement pour le retrait de fidéicommis
   (`isDeliveryBeforeWithdrawal`). Je ne l'invente pas ici.

---

## 9. Ce que « terminé » voudra dire

Une personne du cabinet encaisse un paiement sur une facture jamais transmise, voit le
bandeau, clique, remplit deux champs, et la facture cesse d'être en rouge au registre —
sans que personne de SAFE n'intervienne, et avec une entrée au journal d'audit qui dit
qui a déclaré quoi, quand, et par quel canal.
