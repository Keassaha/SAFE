# 2026-09-14 — La transmission se déclare là où l'argent arrive

Livraison de `docs/product/SPEC_DECLARATION_TRANSMISSION_A_L_ENCAISSEMENT.md`, validée
le même jour (« Oui, on met à exécution »). Rouvre et referme le rang 2 du chantier
(`/facturation/paiements`, fermé le 2026-09-12).

## Ce que vous avez demandé

Un processus qui propose de déclarer la transmission au moment où on enregistre un
paiement, plutôt que de laisser l'incohérence signalée sans remède à portée.

## Ce que j'ai trouvé

Le produit calculait déjà l'avertissement et ne le montrait nulle part.

`createPayment` construit un tableau de `GuardWarning` depuis sa création, la route
`POST /api/facturation/paiements` les renvoie au navigateur, et **aucun des trois écrans
de paiement ne les lisait**. Un premier avertissement y dormait, « paiement enregistré
sans facture associée » : personne ne l'a jamais vu.

Ce chantier est donc surtout un branchement. Il relève du §4.2 de la règle de build,
rendre visible ce qui est déjà construit, et du §4.1, supprimer une saisie réelle : il
n'y a plus à quitter l'écran pour aller chercher la facture dans Inspection.

## Ce qui a été construit

**La règle, pure et testée.** `warnPaymentOnUndeliveredInvoice()` rejoint les quatre
fonctions de `lib/accounting/anti-erreurs.ts`. Elle se tait si la facture porte une
`deliveredAt`, quel que soit le canal ; elle se tait si le paiement ne vise aucune
facture, parce que l'autre avertissement parle déjà dans ce cas. Cinq tests, dont le
numéro vide traité comme absent.

`GuardWarning` gagne deux champs optionnels, `invoiceId` et `invoiceNumero` : sans eux
l'écran ne pourrait pas offrir la réparation sur place.

**Les deux chemins de l'argent.** `createPayment` lit désormais `deliveredAt` sur la
facture qu'il alloue, et émet l'avertissement après le commit — un avertissement ne doit
jamais pouvoir faire échouer un encaissement déjà inscrit. `allocateToInvoices`, qui ne
renvoyait rien, renvoie maintenant ses avertissements comme son voisin : allouer un
paiement à une facture est le même fait que l'encaisser dessus.

**Le bandeau.** `AvertissementsComptables` affiche les avertissements en tête du
registre des paiements, en ambre, après l'écriture. Il traduit par le code de
l'avertissement et non par la chaîne du serveur : le service parle français, l'écran
parle la langue de la personne. La chaîne du serveur reste le repli pour les codes que
l'écran ne connaît pas encore.

**La fenêtre de déclaration.** Deux champs, la date et le canal, ce que
`getDeclarationRequirements()` exige et rien de plus. Les canaux viennent de
`getSelectableDeliveryChannels()` : cinq, jamais six. « Courriel envoyé depuis SAFE »
n'est pas proposé, et l'action serveur le revérifie. Une phrase dit en clair que SAFE
date la déclaration et l'attribue, sans jamais la présenter comme une preuve.

**L'état vit dans la vue, pas dans les fenêtres.** Les trois fenêtres de paiement se
ferment en réussissant ; un bandeau qui disparaîtrait avec la fenêtre qui l'a produit
n'aurait jamais été lu. `PaiementsView` tient donc les avertissements et la facture à
déclarer, et les trois fenêtres les lui remontent.

**L'action existante sert les deux endroits.** `declareDeliveryAction` ne revalidait que
l'écran d'Inspection ; elle revalide aussi `/facturation` et `/facturation/paiements`,
pour que la facture cesse d'être signalée aux trois endroits d'un coup.

## Ce que le processus ne fait jamais

- Il ne refuse pas l'argent : le paiement est au journal quand le bandeau paraît.
- Il ne bloque pas. Le raisonnement est dans `lib/compliance/invoice-delivery.ts` : un
  cabinet qui poste ses factures les a envoyées, et le lui refuser produit du
  contournement.
- Il ne touche pas au retrait de fidéicommis, qui lui est bloqué, à bon droit, et l'était
  déjà.
- Il ne réclame pas de pièce jointe, ni ne présume le canal.

## Vérifications

- Typecheck vert.
- **2 159 tests verts** (180 fichiers), dont les cinq nouveaux.
- Parité FR/EN parfaite. 24 libellés ajoutés dans les deux langues, canaux compris : le
  module de conformité reste la source de vérité sur *quels* canaux sont déclarables,
  l'écran possède les mots.
- Captures des composants réels :
  `docs/journal/captures/2026-09-14_transmission_bandeau.png` et
  `…_fenetre.png`, rendues sur `/ds-preview/paiements` et `/ds-preview/transmission`.

## Ce que je n'ai pas pu vérifier

- **Le parcours complet avec une session ouverte.** Enregistrer un paiement sur une
  facture jamais transmise, voir le bandeau, déclarer, et vérifier que la facture cesse
  d'être en rouge au registre. À faire sur le port 3001 : c'est le test qui compte.
- L'onglet Paiements de la Comptabilité reçoit le même bandeau, par la même vue. Non
  rendu.
- Le bandeau affiche l'avertissement du DERNIER enregistrement seulement. S'il fallait
  un jour lister toutes les factures payées non transmises, l'écran d'Inspection le fait
  déjà.

## Les deux questions restées ouvertes

Inchangées depuis la spécification, et toujours au CEO :

1. Faut-il aussi demander la transmission au moment d'émettre la facture ? Cela
   empêcherait l'incohérence au lieu de la réparer.
2. Une transmission déclarée après la date du paiement doit-elle alerter ?
