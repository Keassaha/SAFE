# 2026-08-17 — Le module comptable devient réversible

## Ce qui a déclenché

Une écriture d'ajustement passée en croyant enregistrer un paiement, et aucun moyen
de la retirer de la page. Demande CEO : rendre l'écriture comptable simple, et rendre
l'erreur défaisable, avec motif, tout en gardant une piste d'audit complète.

## Ce que le code disait vraiment

Trois trous, confirmés en lisant le code avant de proposer quoi que ce soit :

1. **L'écriture manuelle du journal n'était annulable par aucun chemin.** Le formulaire
   ne proposait que « Ajustement » et « Correction », avec des colonnes Entrée / Sortie.
   Du langage de comptable, dans un écran où rien ne dit qu'un paiement se saisit ailleurs.

2. **`updatePayment` modifiait le montant sans toucher au journal.** Le paiement disait
   800 $, le journal restait à 1 000 $, et le solde opérationnel était faux sans qu'aucun
   signal ne se lève. C'est le défaut le plus grave des trois, parce qu'il était silencieux.

3. **`allocationStatus = REVERSED` était un statut mort.** Lu à trois endroits, écrit
   nulle part. Un encaissement enregistré par erreur ne pouvait pas être défait.

La bonne nouvelle : la machinerie de correction append-only existait déjà et était propre
(`append-only-corrections.ts`), branchée sur les dépenses et les débours. Il fallait
l'étendre, pas la réécrire.

## La décision

Doctrine écrite et validée : `docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md`.

Le principe tient en une phrase : **append-only n'a jamais voulu dire « pas de retour en
arrière », ça veut dire « on revient en arrière en écrivant, pas en effaçant »**. SAFE
n'appliquait que la moitié de la règle.

Trois verbes remplacent « supprimer », qui disparaît du module : annuler, corriger,
reclasser. Chacun exige un motif pris dans une liste fermée de sept. La liste fermée est
délibérée : un champ libre se remplit avec « erreur » et ne prouve plus rien le jour de
l'inspection.

## Livré et vérifié à l'écran

- Migration additive `20260817090000_annulation_correction_motive` : `annuleId` en UNIQUE
  sur le journal, motif et texte, plus les colonnes d'annulation sur `Payment`.
- Annulation d'une écriture manuelle : contrepassation motivée, datée, signée.
- Troisième onglet **Corrections** à côté de Mouvements expliqués et Journal brut.
- Annulation d'un encaissement : désallocation, factures rouvertes, contrepassation.
- Modification d'un montant de paiement : motif exigé, journal corrigé par re-jeu versionné.
- 21 tests sur les garde-fous purs. Suite complète verte, 1480 tests.

Vérification faite en reproduisant l'incident exact dans le cabinet de test local :
l'ajustement de 1 250 $ quitte la page, les totaux retombent à zéro, la ligne d'origine
et sa contrepassation restent en base avec un effet net de zéro, et une seconde annulation
de la même écriture est refusée par l'index UNIQUE.

## Ce qui reste ouvert

- **§5 de la doctrine** : remplacer « Nouvelle écriture » par la question « Qu'est-ce qui
  s'est passé ? » à cinq réponses. C'est ce qui rend l'erreur impossible plutôt que
  réparable.
- **§6** : le fil « Ce qui a bougé aujourd'hui » sur `AuditLog`, qui existe en base et n'a
  toujours aucune page.
- **Dépenses et impôt** : demande CEO du même jour, volontairement mise en attente.
- **Écart de date d'un jour** au journal (saisie le 17, affichage le 16). Défaut
  préexistant d'interprétation UTC, indépendant de ce chantier, à traiter à part.
