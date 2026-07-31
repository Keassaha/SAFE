# 2026-07-31 — CH-05 livré : la chaîne des espèces

Septième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-05** de l'audit, qui relevait ici **trois défauts simultanés, dont deux
opposés**.

## Les trois défauts

**1. Sur-blocage.** Le code refusait toute somme de 7 500 $ ou plus en espèces. Or
l'art. 69 prévoit six paragraphes d'exception et la s. 6 en prévoit cinq. La plus
courante, l'avance d'honoraires (art. 69(6)), était bloquée.

C'est aussi grave que l'inverse. Un garde-fou qui refuse une opération licite pousse
au contournement : la somme est saisie en mode « AUTRE », et l'indication « espèces »
de l'art. 38(1)g disparaît des registres. Le sur-blocage détruit la donnée qu'il
prétendait protéger.

**2. Sous-blocage.** La s. 4(1) vise un montant **agrégé** par dossier client. Trois
versements de 3 000 $ franchissent le seuil et passaient tous les trois.

**3. Absence complète** des art. 70 à 73 et de la s. 19(1).

## Une distinction de régime qui manquait

L'art. 69 vise la réception **en fidéicommis**. La s. 4(1) vise **toute** somme reçue
ou acceptée relativement à un dossier client, en fiducie ou non.

Des espèces reçues en paiement direct d'une facture ne tombent donc pas sous
l'art. 69, mais tombent sous la s. 4(1). Aplatir les deux régimes produirait soit un
blocage illégitime au Québec, soit un trou de conformité en Ontario.

## Livré

- **`lib/compliance/cash.ts`** — module pur : périmètre par province, seuil agrégé,
  sept cas d'exception québécois pour six paragraphes, cinq exceptions ontariennes,
  champs du reçu, déclaration, remboursement, conversion. 33 tests.
- **`CashReceipt`** — reçu numéroté sans trou, deux signatures, exception invoquée et
  justifiée, conversion FX, échéance de déclaration.
- **`CashRefund`** — le flux de l'art. 72, distinct et explicite.
- **Remplacement du contrôle brut** dans le dépôt fidéicommis.
- 23 tests de service.

## Décisions de conception

**Le reçu n'a pas de seuil.** L'art. 70 vise « une somme en espèces » et la s. 19(1)
« every licensee who receives cash ». Un reçu est exigé pour 50 $ comme pour
50 000 $. Seuls l'acceptation et la déclaration dépendent du seuil.

**Une exception sans justification n'est pas une exception.** Le motif est obligatoire
et devient la réponse du cabinet en cas d'inspection.

**La dispense de signature n'existe qu'en Ontario.** La s. 19(2) admet l'absence de
signature du payeur après efforts raisonnables documentés. B-1 r.5 ne prévoit rien de
tel : au Québec, le refus est ferme même avec un motif.

**Le mode de remboursement est explicite, jamais deviné.** L'art. 57 interdit les
sorties en espèces ; l'art. 72 les impose pour les sommes de 7 500 $ ou plus reçues en
espèces. Deviner produirait tantôt une infraction à l'un, tantôt à l'autre.

**En Ontario, la condition tient à l'exception, pas au montant.** La s. 6(e) n'accorde
l'exception « honoraires, débours, cautionnement » que si tout remboursement se fait
lui aussi en espèces. Un petit montant reçu sous cette exception engage donc le
cabinet pour la suite. C'est mémorisé à la réception.

**Le calendrier des jours fériés est injecté.** C'est une donnée, pas une règle de ce
module. La s. 1(1) By-Law 9 en donne la liste ontarienne ; la boucle de recul est
bornée pour qu'une fonction injectée ne puisse pas la faire tourner indéfiniment.

**L'agrégation porte sur les montants convertis.** Le seuil est exprimé en dollars
canadiens : 6 000 USD ne sont pas 6 000 $ CAD.

## Vérification

`tsc --noEmit` propre. **105 fichiers de tests, 1 086 tests, tous verts.**
56 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-00+06 | CH-01 | CH-02 | CH-03 | CH-04 | CH-05 |
|---|---|---|---|---|---|---|---|
| Barreau du Québec | 48 | 60 | 67 | 74 | 80 | 85 | **91** |
| Law Society of Ontario | 42 | 44 | 49 | 57 | 66 | 71 | **77** |
| Global | 45 | 52 | 58 | 66 | 73 | 78 | **84** |

## Reste

**CH-07** (Ontario : Form 9A, double contrôle des virements, cautionnement des
signataires), **CH-08** (autres biens en fidéicommis), **CH-09** (rapport annuel),
**CH-10** à **CH-12**. Et les écrans.
