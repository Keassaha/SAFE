# SAFE — Revue de code comptable (état des lieux)

Date : 2026-06-15
Méthode : lecture directe du code (fichier:ligne vérifiés), recoupée avec l'audit multi-agents du 2026-06-10 ([AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md](AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md)) et la recherche QC/ON ([RECHERCHE_COMPTA_SAFE_QC_ON.md](RECHERCHE_COMPTA_SAFE_QC_ON.md)).
Contexte : le commit `df82243` (« corrections compta QC/ON ») a déjà appliqué l'essentiel du Lot A/B de l'audit du 10 juin. Cette revue reflète l'état **après** ces corrections.

> Lecture en une phrase : **le moteur comptable est sain et conforme à la doctrine sur les flux principaux.** Les trous restants sont périphériques (statuts de débours, verrouillage de période, export mappable, profil de cabinet) et deux durcissements de sécurité fidéicommis.

---

## A. Ce qui fonctionne déjà conformément à la doctrine

| Élément | Preuve (fichier:ligne) | Verdict |
|---|---|---|
| **Séparation facture / encaissement** | `Payment` + `PaymentAllocation` distincts ; `FACTURE` ≠ cash dans [kpi.ts:113-117](../../lib/services/journal/kpi.ts) | ✅ Conforme |
| **Revenu en HT (taxe en axe distinct)** | Le journal reçoit `subtotalBeforeTax` ; colonnes `tps`/`tvq` isolées sur `Invoice` | ✅ Conforme |
| **Fidéicommis jamais dans le solde cabinet** | `isTrustEntry()` exclut dépôts/retraits **et** corrections fidéicommis du solde opérationnel ([kpi.ts:54-57,99-110](../../lib/services/journal/kpi.ts)) | ✅ Conforme |
| **KPI séparés, plus de « Solde global »** | `totalFacture`, `totalEncaisse`, `comptesARecevoir`, `totalDepenses`, `soldeOperationnelEstime`, `soldeFideicommis` ([kpi.ts:124-134](../../lib/services/journal/kpi.ts)) | ✅ Conforme |
| **Journal append-only + idempotent** | Index unique partiel `(cabinetId, sourceModule, sourceId)` + `pg_advisory_xact_lock` ; aucun UPDATE/DELETE | ✅ Conforme |
| **KPI recalculés depuis les montants (jamais le `solde` stocké)** | `computeJournalKpis()` classe par type et par date, jamais par solde cumulé ([kpi.ts:1-13](../../lib/services/journal/kpi.ts)) | ✅ Robuste à l'antidatage |
| **Dépenses cabinet journalisées** | `lib/services/journal/cabinet-expense-journal.ts` | ✅ Le « [À FAIRE] » d'avril est fait |
| **Débours journalisés (si payés par le cabinet)** | `writeJournalForDeboursPaiement`, gardé par `payeParCabinet === true` ([debours-dossier-journal.ts](../../lib/services/journal/debours-dossier-journal.ts)) | ✅ Conforme |
| **Allocation de paiement atomique** | Validation pure + verrous advisory sur paiement et factures ([payment-allocation-service.ts:27-84](../../lib/services/billing/payment-allocation-service.ts)) | ✅ Conforme |
| **Taxe pilotée par le mode du cabinet** | `lib/billing/taxes.ts` (modes `hst`/`tps_tvq`/`tps_only`/`tps_pst`/`tps_rst`/`none`) + `cabinet-tax-config.ts` | ✅ Conforme |
| **Fidéicommis : règles Barreau** | Solde vérifié avant retrait ([trust-transaction-service.ts:223-228](../../lib/services/fideicommis/trust-transaction-service.ts)) ; blocage inter-clients ([:159-200](../../lib/services/fideicommis/trust-transaction-service.ts)) ; plafond espèces 7500$ ([:72-76](../../lib/services/fideicommis/trust-transaction-service.ts)) | ✅ Conforme |
| **Rapprochement 3 voies + certification** | Banque / registre / par dossier ; certification bloquée si `ecart !== 0` ([reconciliation-service.ts:116-129](../../lib/services/fideicommis/reconciliation-service.ts)) | ✅ Présent |
| **Tests comptables** | 24 fichiers `.test.ts` : KPI, idempotence, allocation, verrous, corrections append-only, receivables-aging, tax-remittance, trust-monitoring | ✅ Couverture solide sur le cœur |
| **Export journal** | `exportJournalCsv` (UTF-8 + BOM Excel) et `exportJournalExcelRows` ([export-journal.ts](../../lib/services/journal/export-journal.ts)) | ✅ Existe (générique) |

---

## B. Ce qui ne fonctionne pas ou reste dangereux

| id | Élément | Problème | Preuve | Sévérité |
|---|---|---|---|---|
| **R-1** | ✅ **Corrigé 2026-06-15** — Certification rapprochement | La certification vérifie maintenant **chaque** `TrustAccount.currentBalance ≥ 0` et bloque en listant les comptes fautifs. Test : `reconciliation-certify.test.ts`. | [reconciliation-service.ts:131-146](../../lib/services/fideicommis/reconciliation-service.ts) | ✅ Résolu |
| **R-2** | ✅ **Corrigé 2026-06-15** — Retrait fidéicommis (TOCTOU) | Le solde est désormais (re)lu **dans** le `$transaction`, sous `pg_advisory_xact_lock(trust:<id>)`. Deux retraits concurrents ne peuvent plus passer tous deux. Test : `trust-withdrawal-lock.test.ts`. | [trust-transaction-service.ts:230-250](../../lib/services/fideicommis/trust-transaction-service.ts) | ✅ Résolu |
| **R-3** | Libellés QC figés (Dérisier ON) | Écrans Rapports→Taxes et Facturation→« à remettre » potentiellement figés en TPS/TVQ. À revérifier post-`df82243`. | audit `DASH-03`/`TAX-03` | 🟠 Majeur (si non corrigé) |
| **R-4** | Localisation EN figée (Cayard QC) | Rapprochement / générateur de rapport fidéicommis / conformité en anglais codé en dur. À revérifier post-`df82243`. | audit `T1+T3`,`L1`,`L2+L3` | 🟠 Majeur (si non corrigé) |
| **R-5** | « Taxes collectées » | Libellé trompeur (calculé en méthode d'exercice sur factures émises). | audit `DASH-05` | 🟡 Mineur |

> R-3 et R-4 viennent de l'audit du 10 juin et peuvent avoir été réglés par `df82243`. **Action de vérification** : scan live des écrans Cayard et Dérisier avant de les recoder (voir plan, Lot de vérification).

---

## C. Ce qui manque encore

| id | Manque | Détail | Impact doctrine |
|---|---|---|---|
| ~~M-1~~ | ✅ **Fait 2026-06-15** — Statuts de débours | Enum `DeboursStatut { NON_FACTURE, FACTURE, RECOUVRE, RADIE }` ajouté + transitions (facturation → FACTURE, paiement total → RECOUVRE, radiation → RADIE). Migration additive `20260615120000_add_debours_statut`. | ✅ Résolu |
| ~~M-2~~ | ✅ **Fait 2026-06-15** — KPI « Débours à récupérer » | Carte ajoutée à l'aperçu (`deboursARecuperer`), Σ débours payés/refacturables non recouvrés/radiés. | ✅ Résolu |
| **M-3** | **Vue taxes province-aware unifiée** | À confirmer : carte unique TVH en mode `hst`, deux cartes TPS/TVQ en `tps_tvq`. | §7 doctrine |
| ~~M-4~~ | ✅ **Fait 2026-06-15** — Verrouillage de période | Modèle `AccountingPeriodLock` + garde-fou dans `createJournalEntry` (rejet de toute écriture datée dans un mois verrouillé) + auto-verrouillage à la certification du rapprochement + clôture/réouverture manuelle (`period-lock.ts`). Migration `20260615130000_add_accounting_period_lock`. | ✅ Résolu |
| ~~M-5~~ | ✅ **Fait 2026-06-15 (cœur)** — Export mappable | Mappage de comptes (`lib/accounting/export/`) → double-entrée balancée ; sérialiseurs generic/QuickBooks/Xero/Sage ; service `buildPeriodAccountingExport` par période (horodaté + statut verrouillé) ; action `exportAccountingPeriodAction`. **Reliquats** : bouton UI (période + format) et persistance du plan comptable surchargé par cabinet. | ✅ Résolu (UI + chart persistant à brancher) |
| ~~M-6~~ | ✅ **Fait 2026-06-15 (cœur)** — Profil comptable + onboarding | Module pur `lib/accounting/profil-cabinet.ts` (dérivation A/B/C/D + flags d'activation) + persistance `lib/services/accounting-profile.ts` (dans `modules.comptabilite`, sans migration) + action `saveAccountingProfileAction`/`getAccountingProfileAction`. **Reliquats** : formulaire UI du questionnaire d'onboarding et activation conditionnelle de la nav à partir des `features`. | ✅ Résolu (questionnaire UI + gating nav à brancher) |
| ~~M-7~~ | ✅ **Fait 2026-06-15 (logique + serveur)** — Contrôles anti-erreurs | Module pur `lib/accounting/anti-erreurs.ts` : blocage facture sans client (`assertInvoiceHasClient`, câblé dans `createDraftFromBillableItems`), avertissements paiement sans facture (renvoyé par `createPayment` + route API) et débours non facturé sur dossier fermé (renvoyé par `createDeboursDossier`). **Reliquat mince** : afficher ces `warnings` dans les formulaires (toast/bannière). | ✅ Résolu (affichage UI à brancher) |

---

## D. Risques prioritaires (classés)

| Niveau | Risques | Justification |
|---|---|---|
| 🔴 **Critique** | *(aucun ouvert sur le moteur)* — les ex-critiques (commingling « Solde global », revenu=TTC, PDF mauvaise province) sont traités par `df82243`. **À confirmer par scan live.** | Le cœur est conforme à la doctrine. |
| 🟠 **Élevé** | R-1 (certification masque un compte négatif), R-2 (TOCTOU retrait), R-3/R-4 (localisation si non corrigée) | Touchent la conformité fidéicommis et des documents/écrans client-facing. |
| 🟡 **Moyen** | M-1 (statuts débours), M-4 (verrouillage période), M-6 (profil cabinet) | Dette structurante : sans eux, SAFE reste « mal-utilisable » sur le suivi des débours, l'intégrité de période et l'adaptation au cabinet. |
| 🟢 **Faible** | M-2, M-3, M-5, M-7, R-5 | Améliorations de clarté et d'exportabilité, sans risque de non-conformité immédiat. |

---

## Garde-fous avant toute correction (rappel de l'audit)

- **Dérisier (ON) est en production.** Aucune correction ne doit régresser : anglais par défaut légitime, mode TVH, By-Law 9. Vérifier contre ses données de prod avant tout changement `both` ou fidéicommis (R-1, R-2).
- **Cayard (QC) est un cabinet de démo.** Corrections sans risque de données.
- **Ne pas passer en partie double.** Hors périmètre, lourd, risqué sur données live. La doctrine ne le requiert pas.
