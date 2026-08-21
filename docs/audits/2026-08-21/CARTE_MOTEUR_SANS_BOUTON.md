# Carte du moteur sans bouton

Date : 2026-08-21 · Périmètre : services facturation et fidéicommis
Origine : constat B-01 de l'audit de production.

> Ce document ne demande rien et ne propose aucun chantier. Il rend une décision
> possible le jour où elle se pose : lequel de ces modules mérite un bouton.
> Le §4.2 de `REGLE_DE_BUILD.md` place cette question avant toutes les autres,
> et le §5 dit qui y répond : le relevé des trente minutes avec un cabinet, pas
> ce document.

---

## Le chiffre, corrigé

Un premier comptage annonçait 38 fonctions sans appelant. Il était faux du
double : il excluait le fichier de définition, donc il comptait comme mortes des
fonctions utilisées trois lignes plus bas.

| | |
|---|---|
| Fonctions exportées par les deux modules | **122** |
| Appelées depuis un écran ou une route | 84 |
| Utilisées dans leur propre fichier | 20 |
| Référencées uniquement par des tests | 9 |
| **Référencées nulle part** | **18** |

Les 9 « tests seulement » comptent autant que les 18 : leur règle est vérifiée,
il leur manque seulement un écran.

---

## Ce que la carte révèle vraiment

L'image « huit modules à construire » est fausse. **Les écrans existent presque
tous.** Ce qui manque, c'est la moitié écriture de chacun.

Douze écrans d'Inspection sont en production. Quatre d'entre eux n'appellent
aucun service d'écriture : ils affichent, ils n'enregistrent pas.

| Écran | Ce qu'il fait déjà | Ce qu'il ne fait pas |
|---|---|---|
| `/inspection/especes` | affiche | aucune saisie d'espèces |
| `/inspection/registres` | affiche | — |
| `/inspection/conservation` | affiche | — |
| `/inspection/rapport-annuel` | affiche | pas de relevé bancaire joint |
| `/inspection/autres-biens` | enregistre un **avis au client** | pas le **bien** lui-même |
| `/inspection/virements` | enregistre confirmation et exécution | pas le transfert entre cartes-clients |

Aucune donnée n'existe pour aucun de ces modules en production : douze tables à
zéro ligne.

---

## Les huit familles

### 1. Registre des chèques — art. 61 B-1 r.5

Quatre fonctions inertes : `voidTrustCheque`, `markChequesCleared`,
`getOutstandingChequesTotal`, `getChequeRegisterProvince`.

**Déjà branché** : `registerTrustCheque` s'exécute à chaque retrait par chèque.
Les chèques s'inscrivent donc, mais **rien ne permet de les voir, de les marquer
compensés, ni d'en annuler un**. L'annulation est écrite avec soin : le chèque
est conservé, « un trou dans la séquence est » ce que l'inspecteur cherche.

**Manque** : un écran de registre, avec la liste, l'état de compensation et
l'annulation motivée. **Taille : M.**

### 2. Espèces — art. 70 et 57 B-1 r.5

`recordCashReceipt`, `recordCashRefund`. Couvertes par des tests, jamais
appelées. L'écran `/inspection/especes` existe et n'écrit rien.

Le plafond de 7 500 $ et ses exceptions sont déjà codés et testés.

**Manque** : le formulaire de réception et celui de remboursement, sur un écran
qui existe déjà. **Taille : S.**

### 3. Biens détenus en fidéicommis — art. 43 B-1 r.5

`recordTrustProperty` (« dès réception »), `moveTrustProperty` (déplacement avec
historique), `checkPropertiesBeforeDossierClosure`, `getPropertyFormFields`.

**Déjà branché** : `/inspection/autres-biens` enregistre l'avis au client.
**Le bien lui-même n'est jamais inscrit.**

Le contrôle de fermeture de dossier existe bien (`getDossierClosureBlockers`) et
bloque sur un solde fidéicommis négatif, mais il **ne regarde pas les biens** :
`checkPropertiesBeforeDossierClosure` n'est appelée nulle part. On peut donc
fermer un dossier en gardant un bien du client, sans que rien ne le signale.

**Manque** : le formulaire d'inscription et le branchement du contrôle de
fermeture. **Taille : M.**

### 4. Pièces justificatives — art. 32(2) B-1 r.5, s. 18(10) By-Law 9

`attachSupportingDocument`, `getTransactionDocumentStatus`,
`buildMissingDocumentsReport` (« pièces manquantes sur une période »).

**Manque** : le dépôt d'une pièce sur une écriture, et le rapport des manquantes.
C'est la première chose qu'un inspecteur échantillonne. **Taille : M.**

### 5. Virements et honoraires de référence — art. 39, 58 B-1 r.5, s. 18(4)

`recordClientLedgerTransfer` (transfert entre cartes-clients),
`recordReferralFee`, `getMaxBalancePreviousFiscalYear`, `checkSignatory`.

**Déjà branché** : `/inspection/virements` gère la réquisition électronique.
**Le transfert entre cartes-clients, lui, n'existe pas** alors que la s. 18(4)
en exige le registre.

**Manque** : le transfert entre cartes, et le contrôle de signataire.
**Taille : M.**

### 6. Remise d'intérêts — art. 60 B-1 r.5

`recordInterestRemittance`, `getInterestRemittances`. Le module de découvert est
branché, la remise d'intérêts au Fonds d'études juridiques ne l'est pas.
**Taille : S.**

### 7. Notes de crédit — module complet, jamais atteignable

`createCreditNote`, `applyCreditNote`. La route n'expose qu'un `GET`, l'écran ne
fait que lire une table vide.

⚠️ **Deux défauts dorment ici** (constat B-02) : décompte perdu sur l'application
concurrente, et aucun plafond du crédit contre le solde de la facture. **À
corriger avant de brancher, pas après.** **Taille : M**, correctifs compris.

### 8. Intérêts de retard

`createOrUpdateInterestCharge`. ⚠️ **Ne fait que créer** malgré son nom, et
`Invoice.lastInterestAppliedAt` n'est lu nulle part : trois appels sur une
facture en retard de 90 jours facturent 180 jours d'intérêts (constat B-03).
**À corriger avant de brancher.** **Taille : S**, correctif compris.

---

## Les orphelines isolées

Cinq fonctions hors module, à traiter séparément :

| Fonction | Nature |
|---|---|
| `applyTrustToInvoice` | **pierre tombale volontaire** : lève une erreur qui redirige vers `createTrustWithdrawal`. À garder telle quelle. |
| `getInvoiceDeliveryStatus` | doublon probable de la lecture faite dans l'écran de transmission |
| `getReconciliation` | doublon probable de `getLatestReconciliation` |
| `getClientBalanceInAccount` | **la borne exacte de la s. 9(3)** : solde d'un client DANS UN COMPTE. C'est la fonction qui corrigerait le constat A-01. |
| `getTrustBankAccountCompliance` | contrôle de conformité d'un compte bancaire |

`getClientBalanceInAccount` mérite d'être signalée : le correctif du plafond de
retrait par compte (A-01) est **déjà écrit**, il n'est simplement pas appelé.

---

## Ce que ce document ne dit pas

Il ne dit pas lequel brancher. Aucune de ces familles ne se justifie par sa
seule existence : le §5 est clair, la question n'est pas « quel module
ajoute-t-on » mais « qu'est-ce qui manque pour qu'un cabinet ouvre SAFE demain
matin et y trouve son travail ».

Un seul relevé y répond, et il n'est pas dans le code.
