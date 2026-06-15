# SAFE — Doctrine comptable

Date : 2026-06-15 (remplace la version du 2026-04-29)
Statut : **source de vérité**. Toute divergence dans le code est un bug, pas une variante autorisée.
Portée : tout module qui crée, modifie ou lit un objet financier.
Documents liés : [SAFE_ACCOUNTING_SOP.md](SAFE_ACCOUNTING_SOP.md), [SAFE_ACCOUNTING_CODE_REVIEW.md](SAFE_ACCOUNTING_CODE_REVIEW.md), [SAFE_ACCOUNTING_IMPLEMENTATION_PLAN.md](SAFE_ACCOUNTING_IMPLEMENTATION_PLAN.md), [BILLING_CORE_MODEL.md](BILLING_CORE_MODEL.md), [TAX_AND_PROVINCE_MODEL.md](TAX_AND_PROVINCE_MODEL.md), [EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md](EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md), [INVOICE_STATUS_NORMALIZATION.md](INVOICE_STATUS_NORMALIZATION.md), [APPEND_ONLY_CORRECTIONS.md](APPEND_ONLY_CORRECTIONS.md).

---

## 1. Positionnement comptable de SAFE

**SAFE est une comptabilité juridique opérationnelle avec export comptable externe.**

Cela veut dire trois choses précises :

- **Juridique** : la priorité absolue est la conformité Barreau du Québec (B-1 r.5) et Barreau de l'Ontario (By-Law 9 LSO) sur le fidéicommis, la facturation et la piste d'audit. La comptabilité de SAFE existe d'abord pour protéger le permis d'exercice de l'avocat.
- **Opérationnelle** : SAFE suit l'argent réel du cabinet au quotidien (qui doit quoi, qu'est-ce qui est entré, qu'est-ce qui est sorti, combien d'argent client je détiens). Elle répond aux questions de gestion, pas aux questions d'états financiers normalisés.
- **Avec export comptable externe** : SAFE n'est pas le livre comptable final. Elle produit des exports propres, horodatés et mappables que le comptable externe (ou QuickBooks / Xero / Sage) reprend pour les états financiers, la déclaration de taxes finale et l'impôt.

La frontière est volontaire. **L'objectif n'est pas de rendre SAFE complète comme QuickBooks. L'objectif est de rendre SAFE difficile à mal utiliser.**

Modèle technique actuel : journal général **append-only mono-axe** (entrée / sortie classées par type), pas de partie double ni de plan comptable. C'est suffisant pour la conformité et la gestion. Le passage en partie double n'est pas requis et n'est pas au programme (voir §3).

---

## 2. Ce que SAFE fait

| Domaine | Couverture SAFE |
|---|---|
| **Factures** | Émission, lignes (honoraires, forfait, débours, intérêts, ajustement), taxes par mode du cabinet, statuts, numérotation sans trou. |
| **Encaissements** | Paiement réel indépendant des factures, allocation explicite à une ou plusieurs factures, paiement partiel, remboursement. |
| **Comptes à recevoir** | Solde dû par facture et par client, ancienneté, base pour la relance. |
| **Débours récupérables** | Frais avancés par le cabinet pour un dossier, destinés à être refacturés au client. |
| **Dépenses du cabinet** | Coûts d'exploitation jamais refacturés, avec taxes payées (CTI/RTI). |
| **Taxes TPS/TVQ/TVH** | Taxe collectée à la facturation (méthode d'exercice), taxe payée sur dépenses, résumé par période. |
| **Fidéicommis par dossier/client** | Journal append-only, carte-client par dossier, solde courant après chaque mouvement, transfert vers admin lié à une facture. |
| **Rapprochement mensuel fidéicommis** | Rapprochement à 3 voies (banque / registre / par dossier), écart calculé, certification par l'avocat. |
| **Piste d'audit** | Journal général immuable, corrections par écriture inverse, log d'audit horodaté sur les opérations sensibles. |
| **Exports comptables** | CSV / Excel du journal, par période. (Mappage QuickBooks/Xero/Sage : cible, voir plan.) |

---

## 3. Ce que SAFE ne fait PAS

SAFE **ne tente pas** de produire :

- un **bilan** complet (actif / passif / capitaux propres) ;
- une **comptabilité en partie double** complète avec plan comptable ;
- des **amortissements** d'immobilisations ;
- une **paie complexe** (la paie reste hors périmètre comptable juridique) ;
- des **états financiers certifiés** (mission d'examen / audit CPA) ;
- des **déclarations fiscales finales** (TPS/TVQ finale, T2/CO-17, T1).

Pour tout cela, SAFE **exporte** vers le comptable externe. Si un cabinet demande l'une de ces fonctions, la réponse par défaut est : « SAFE prépare et exporte, votre comptable produit le document final. »

---

## 4. Règles fondamentales de non-mélange

Ce sont les cinq règles dures. Une violation est un bug critique, jamais une variante.

1. **Fidéicommis ≠ argent du cabinet (commingling).** L'argent détenu en fidéicommis appartient au client. Il n'entre dans **aucun** total « cabinet » (revenu, solde opérationnel, trésorerie). Il a sa propre carte et son propre rapprochement. *Implémenté : `isTrustEntry()` exclut les types fidéicommis du solde opérationnel ([kpi.ts:54-57](../../lib/services/journal/kpi.ts)).*
2. **Facture ≠ encaissement.** Une facture émise est une **créance**, pas de la trésorerie. Émettre une facture n'augmente jamais l'encaissé. *Implémenté : `FACTURE` alimente « Facturé », jamais le cash ([kpi.ts:113-115](../../lib/services/journal/kpi.ts)).*
3. **Taxe ≠ revenu.** La TPS/TVQ/TVH collectée est une dette envers l'État, pas un revenu du cabinet. Le revenu se compte **hors taxe (HT)**. *Implémenté : le journal reçoit le HT (`subtotalBeforeTax`), la taxe est un axe distinct.*
4. **Débours ≠ dépense.** Un débours est avancé **pour un client** et sera refacturé ; une dépense est un **coût du cabinet** jamais refacturé. Test unique : « est-ce qu'on va le refacturer à un client ? » oui = débours, non = dépense.
5. **Une écriture de journal ne se modifie jamais.** Toute correction passe par une **écriture inverse** (`CORRECTION`), jamais par un `UPDATE`/`DELETE`. *Implémenté : journal append-only, idempotence `(cabinetId, sourceModule, sourceId)`.*

---

## 5. Distinction des sept concepts financiers

| Concept | Ce que c'est | Ce que ce n'est pas | Effet trésorerie | Effet créance | Modèle |
|---|---|---|---|---|---|
| **Facture** | Créance émise au client | Un encaissement | Aucun | + crée la créance | `Invoice` |
| **Encaissement** | Argent réellement reçu | Une recette par facture (tant que non alloué) | + cash entré | − réduit la créance via allocation | `Payment` + `PaymentAllocation` |
| **Compte à recevoir** | Solde dû d'une facture ouverte | De l'argent en banque | Aucun | = la créance restante | dérivé de `Invoice.balanceDue` |
| **Débours récupérable** | Frais avancé pour un dossier, refacturable | Une dépense du cabinet | − cash sorti (si payé par le cabinet) | ligne future de facture | `DeboursDossier` |
| **Dépense cabinet** | Coût d'exploitation jamais refacturé | Un débours | − cash sorti | Aucun | `CabinetExpense` |
| **Fidéicommis** | Argent du client détenu en fiducie | De l'argent du cabinet | **hors trésorerie cabinet** | Aucun | `TrustAccount` + `TrustTransaction` |
| **Taxe (TPS/TVQ/TVH)** | Montant collecté pour l'État | Un revenu | dette à remettre | Aucun | colonnes `tps`/`tvq` sur `Invoice` |

Cas limites :
- Un **débours payé par le cabinet** est à la fois une sortie de trésorerie immédiate (journalisée) **et** une créance refacturable future. Les deux sont vrais.
- Un **transfert fidéicommis vers admin** lié à une facture : sortie du fidéicommis du client + application à sa facture. Interdit sans facture du **même** client.

---

## 6. KPI autorisés

Seuls ces indicateurs sont autorisés sur l'aperçu financier. Aucun KPI ne doit fusionner deux axes.

| KPI | Définition | Source code |
|---|---|---|
| **Facturé ce mois** | Σ factures émises dans la période (HT, créance) | `totalFacture` |
| **Encaissé ce mois** | Σ paiements reçus dans la période (cash) | `totalEncaisse` |
| **Comptes à recevoir** | Σ soldes dus des factures ouvertes (point dans le temps) | `comptesARecevoir` |
| **Débours à récupérer** | Σ débours payés par le cabinet, refacturables, non encore recouvrés/radiés | `deboursARecuperer` |
| **Dépenses du mois** | Σ dépenses + débours payés sortis dans la période | `totalDepenses` |
| **Fidéicommis détenu** | Σ soldes fidéicommis (argent client) — **carte séparée** | `soldeFideicommis` |
| **Taxes collectées** | TPS/TVQ/TVH facturée sur la période (méthode d'exercice) | module rapports |
| **Solde opérationnel estimé** | Cash réel = encaissements − dépenses (jamais facture, jamais fidéicommis) | `soldeOperationnelEstime` |

KPI **interdits** : « Solde global », « Revenu » incluant la taxe, tout total mélangeant fidéicommis et cabinet, « Taxes collectées » présenté comme encaissé alors qu'il s'agit d'exercice (préciser « facturées »).

---

## 7. Libellés recommandés dans l'interface

| Bon libellé | À bannir | Pourquoi |
|---|---|---|
| « Facturé ce mois » | « Revenu », « Chiffre d'affaires TTC » | Une facture impayée n'est pas un revenu encaissé ; la taxe n'est pas un revenu. |
| « Encaissé ce mois » | « Revenu » | Sépare la trésorerie de la créance. |
| « Comptes à recevoir » | « Solde dû » seul | Précise qu'il s'agit de créances clients. |
| « Fidéicommis détenu (argent du client) » | « Solde global », « Solde total » | Empêche toute lecture de commingling. |
| « Solde opérationnel estimé » | « Bénéfice », « Profit » | « Estimé » signale que ce n'est pas un résultat comptable certifié. |
| « Taxes facturées (méthode d'exercice) » | « Taxes collectées » | La taxe est due à l'émission, pas à l'encaissement. |
| « Débours à récupérer » | « Dépenses » | Distingue l'avance refacturable du coût du cabinet. |
| Mode QC : « TPS 5 % / TVQ 9,975 % » · Mode ON : « TVH 13 % » | Libellé figé d'une province | Le libellé dérive du **mode taxe du cabinet**, jamais d'un défaut. |

Règles dures de présentation (CEO) : **jamais** de numéro de Barreau/LSO sur une facture ; **maximum 2 couleurs** sur une facture.

---

## 8. Erreurs critiques à éviter

| Erreur | Conséquence | Gravité |
|---|---|---|
| Compter une facture comme de l'argent encaissé | Vision de trésorerie fausse, décisions de dépense erronées | Critique |
| Inclure le fidéicommis dans un total cabinet (commingling) | Violation Barreau la plus sanctionnée | Critique |
| Compter la taxe dans le revenu | Double comptage, sur-estimation du résultat, erreur de remise | Critique |
| Sortir une facture PDF avec le mauvais régime de taxe (province) | Document client-facing faux | Critique |
| Transférer du fidéicommis vers admin sans facture | Retrait fiduciaire injustifié | Critique |
| Rendre un solde fidéicommis (par dossier) négatif | Utilisation des fonds d'un client pour un autre | Critique |
| Modifier ou supprimer une écriture de journal | Perte de la piste d'audit | Élevé |
| Confondre débours et dépense | Marge faussée, débours jamais refacturés | Élevé |
| Certifier un rapprochement avec un compte-client négatif masqué | Certification trompeuse | Élevé |
| Libeller « Taxes collectées » ce qui est « facturé » | Confusion de méthode comptable | Moyen |

---

## 9. Logique comptable cible par événement

Règle d'or : **tout mouvement financier réel produit une entrée au journal général.** Une entrée n'est jamais modifiée. Idempotence : `(cabinetId, sourceModule, sourceId)` unique.

| Événement | Écriture journal | `sourceModule` | `typeTransaction` | Effet KPI | Statut |
|---|---|---|---|---|---|
| Émission facture (`ISSUED`) | Oui, **HT** | `FACTURATION` | `FACTURE` | + Facturé, + Comptes à recevoir | ✅ |
| Encaissement paiement | Oui | `PAIEMENTS` | `PAIEMENT` | + Encaissé, + solde opérationnel | ✅ |
| Allocation paiement → facture | Non (déjà reflété) | — | — | − Comptes à recevoir | ✅ |
| Dépôt fidéicommis | Oui | `FIDEICOMMIS` | `DEPOT_FIDEICOMMIS` | + Fidéicommis détenu | ✅ |
| Retrait fidéicommis | Oui | `FIDEICOMMIS` | `RETRAIT_FIDEICOMMIS` | − Fidéicommis détenu | ✅ |
| Transfert fidéicommis → facture | Oui (retrait) | `FIDEICOMMIS` | `RETRAIT_FIDEICOMMIS` | − Fidéicommis ; applique à la facture | ✅ (exige facture même client) |
| Validation dépense cabinet | Oui | `DEPENSES` | `DEPENSE` | + Dépenses, − solde opérationnel | ✅ |
| Paiement d'un débours par le cabinet | Oui (si `payeParCabinet`) | `DEBOURS` | `DEBOURS` | + Dépenses (sortie), débours à récupérer | ✅ |
| Refacturation d'un débours | Non (couverte par `FACTURE`) | — | — | — | ✅ |
| Import comptable historique | Oui (direct) | `IMPORT_BANCAIRE` | mappé | selon type | ✅ |
| Ajustement manuel | Oui | `AJUSTEMENT_MANUEL` | `AJUSTEMENT` | solde opérationnel | ✅ |
| Correction | Oui (écriture inverse) | `CORRECTION_SYSTEME` ou `FIDEICOMMIS` | `CORRECTION` | selon module | ✅ |

Note : une `CORRECTION` issue du module `FIDEICOMMIS` ajuste le solde **fidéicommis**, jamais le cash cabinet ([kpi.ts:54-57](../../lib/services/journal/kpi.ts)).

---

## 10. Procédure SOP

La procédure d'utilisation quotidienne (facturation, encaissement, débours, dépenses, fidéicommis, rapprochement, correction, export, contrôles mensuels) et la configuration par profil de cabinet (A/B/C/D) sont définies dans **[SAFE_ACCOUNTING_SOP.md](SAFE_ACCOUNTING_SOP.md)**.

---

## Règle de prudence (inchangée)

Quand un événement métier semble proche de plusieurs concepts canoniques, **ne pas inventer un raccourci dans le code**. Ouvrir une question et la résoudre par référence à ce document. La liste des concepts est volontairement étroite : tout nouveau concept doit être ajouté ici avant d'être codé.
