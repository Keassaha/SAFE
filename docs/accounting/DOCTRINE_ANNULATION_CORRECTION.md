# SAFE — Doctrine d'annulation et de correction

Date : 2026-08-17
Statut : **VALIDÉE (CEO, 2026-08-17)**. §1 à §4 et §7 sont livrés et vérifiés à l'écran.
§5 (saisie en langage humain) et §6 (journée auditable) restent à construire.
Portée : toute écriture financière du produit (journal général, paiements, fidéicommis, dépenses, débours).
Documents liés : [SAFE_ACCOUNTING_DOCTRINE.md](SAFE_ACCOUNTING_DOCTRINE.md), [APPEND_ONLY_CORRECTIONS.md](APPEND_ONLY_CORRECTIONS.md).

---

## 0. Le problème réel

Un cabinet se trompe. Tous les jours. Ce n'est pas un cas limite, c'est le régime normal.

Aujourd'hui SAFE traite l'erreur comme une anomalie : la saisie est possible, le retour en arrière ne l'est pas. Résultat concret, observé le 2026-08-17 : une écriture d'ajustement passée en croyant enregistrer un paiement, et aucun moyen de la retirer de la page.

La doctrine comptable existante dit « append-only, jamais de mutation ». Elle a raison. Mais append-only n'a jamais voulu dire « on ne peut pas revenir en arrière ». Ça veut dire « on revient en arrière en écrivant, pas en effaçant ». La différence est technique. Pour le cabinet, elle doit être invisible.

**Règle mère : ce qui peut être saisi doit pouvoir être défait. Toujours. Sans exception.**

---

## 1. Trois verbes, jamais « supprimer »

Le mot « supprimer » ne doit apparaître nulle part dans le module comptable. Il ment sur ce qui se passe et il fait peur à un avocat qui pense au Barreau. Trois verbes le remplacent.

### 1.1 Annuler

**Quand** : l'écriture entière est fausse. Mauvais type, mauvais objet, doublon, transaction qui n'a jamais eu lieu.

**Ce que voit le cabinet** : la ligne quitte le registre. Elle n'est plus dans la liste, elle n'est plus dans les totaux.

**Ce qui se passe vraiment** : une écriture de contrepassation de montant strictement égal et de sens inverse est ajoutée, liée à l'originale. Les deux lignes sont marquées `annulee`. Elles quittent la vue Lisible et vivent dans le registre des corrections.

**Obligatoire** : un motif. Sans motif, le bouton ne part pas.

### 1.2 Corriger

**Quand** : l'écriture est la bonne, mais une valeur est fausse. Un montant, une date, un client.

**Ce que voit le cabinet** : la valeur change. Une pastille discrète « corrigée » apparaît sur la ligne, cliquable pour voir l'avant.

**Ce qui se passe vraiment** : contrepassation de l'effet net cumulé, puis re-jeu de l'écriture corrigée en version `#vN+1`. C'est exactement `applyCabinetExpenseCorrection` de `append-only-corrections.ts`, étendu aux autres objets.

**Obligatoire** : un motif.

### 1.3 Reclasser

**Quand** : les chiffres sont bons, le classement est faux. C'est le cas de l'incident du 2026-08-17 : un ajustement qui aurait dû être un paiement.

**Ce que voit le cabinet** : « Ce n'était pas un ajustement, c'était : [liste] ». La ligne change de nature.

**Ce qui se passe vraiment** : annulation, puis création dans le bon module métier. Jamais une réécriture du type sur place, parce que la règle de séparation des flux (`manual-entry-policy.ts`) interdit qu'un paiement naisse au journal général.

**Obligatoire** : un motif.

---

## 2. Le motif

Liste fermée, courte, en français de cabinet. Pas de champ libre par défaut, parce qu'un champ libre se remplit avec « erreur » et ne sert plus à rien à l'inspection.

| Code | Libellé affiché |
|---|---|
| `ERREUR_SAISIE` | Erreur de saisie |
| `MAUVAIS_TYPE` | Mauvais type d'écriture |
| `DOUBLON` | Écriture en double |
| `MONTANT_ERRONE` | Montant erroné |
| `TRANSACTION_ANNULEE` | Transaction annulée par la banque ou le client |
| `MAUVAIS_DOSSIER` | Rattachée au mauvais client ou dossier |
| `AUTRE` | Autre, à préciser |

`AUTRE` ouvre un champ texte obligatoire, minimum 10 caractères. Les six autres acceptent une précision facultative.

Le motif est stocké sur l'écriture de contrepassation, pas sur l'originale. L'originale ne bouge jamais.

---

## 3. Le registre des corrections

Un troisième onglet à côté de Lisible et Expert : **Corrections**.

Il contient tout ce qui a été annulé, corrigé ou reclassé, avec pour chaque cas : la ligne d'origine, la contrepassation, le motif, qui l'a fait, quand. Aucun total n'en sort, il ne compte pas dans les soldes.

Ce que ça donne aux trois publics :

- **Au cabinet** : la page principale est propre. L'erreur ne le nargue plus.
- **À l'inspection du Barreau** : rien n'est perdu, tout est motivé, tout est daté, tout est signé.
- **Au comptable externe** : l'export d'une période verrouillée reste balancé, parce que la contrepassation est une écriture comme une autre.

---

## 4. La période verrouillée

`AccountingPeriodLock` reste souverain. On n'annule jamais dans un mois clos.

Une annulation qui vise une écriture d'un mois verrouillé s'inscrit dans la période ouverte courante, avec la date d'origine rappelée dans la description. C'est déjà la règle de la doctrine existante, elle s'applique telle quelle.

---

## 5. La saisie, avant l'erreur

Corriger vite, c'est bien. Ne pas se tromper, c'est mieux.

Le formulaire « Nouvelle écriture » du journal général doit disparaître au profit d'une question en français : **« Qu'est-ce qui s'est passé ? »**

| Réponse | Ce que fait SAFE |
|---|---|
| J'ai reçu de l'argent d'un client | Ouvre la saisie de paiement, pas le journal |
| J'ai payé quelque chose pour le cabinet | Ouvre le journal des dépenses |
| J'ai payé quelque chose pour un dossier | Ouvre la saisie de débours |
| J'ai déposé ou retiré du fidéicommis | Ouvre le registre fidéicommis |
| Je corrige une erreur déjà passée | Ouvre le seul vrai formulaire d'ajustement |

Les quatre premières réponses ne peuvent structurellement pas produire une écriture manuelle au journal. La règle est déjà codée côté serveur, elle n'était simplement pas visible côté écran. L'incident du 2026-08-17 devient impossible.

Le cinquième chemin garde les colonnes Entrée et Sortie, parce que c'est le seul cas où elles ont un sens.

---

## 6. La journée auditable

`AuditLog` existe en base et n'a aucune page. C'est un actif dormant.

**« Ce qui a bougé aujourd'hui »** : un fil chronologique, par heure, une ligne par mouvement financier. Qui, quoi, valeur avant, valeur après, motif s'il y en a un. Filtrable par jour, par personne, par dossier.

Usage réel : le vendredi soir, reprendre la semaine en trois minutes au lieu de fouiller sept registres. Et le jour de l'inspection, sortir la piste d'audit sans préparation.

---

## 7. Ce que ça change dans le code

| Objet | État avant | Livré le 2026-08-17 |
|---|---|---|
| `JournalGeneralEntry` | Aucun lien d'annulation | `annuleId` (UNIQUE), `motifCode`, `motifTexte`. Migration additive `20260817090000`. |
| Écriture manuelle | Création seule | `annulerEcritureJournal` + `annulerEcritureJournalAction` |
| Portée des listes et des KPI | Tout ou rien | `buildPorteeWhere` : `actives` par défaut partout |
| `updatePayment` | `update` nu, journal non touché | Contrepassation + re-jeu versionné, motif obligatoire |
| `Payment.allocationStatus` | `REVERSED` jamais écrit | Écrit par `annulerPaiement`, avec motif, date et auteur |
| Journal général, écran | 2 onglets | 3 onglets, dont Corrections |
| Piste d'audit | `action: "update"` indifférencié | `action: "reverse"` sur l'écriture et sur le paiement |

Aucune de ces lignes ne casse la doctrine append-only. Toutes la rendent utilisable.

**Garde-fous vérifiés** : l'index UNIQUE sur `annuleId` refuse une seconde annulation
de la même écriture (P2002), une annulation ne s'annule pas, et une écriture issue
d'un module métier renvoie vers son module au lieu de se laisser annuler au journal.

---

## 8. Règle de prudence

Aucune annulation ne touche le fidéicommis sans passer par les garde-fous existants de `TrustTransaction`. Le fidéicommis a déjà son mécanisme de correction (`correctionOfId`) et ses motifs réglementaires. On l'harmonise avec la présente doctrine, on ne le remplace pas.
