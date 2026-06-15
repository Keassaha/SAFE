# SAFE — Plan d'implémentation comptable

Date : 2026-06-15
Base : [SAFE_ACCOUNTING_CODE_REVIEW.md](SAFE_ACCOUNTING_CODE_REVIEW.md) (état réel post-`df82243`).
Principe directeur : **rendre SAFE difficile à mal utiliser**, sans complexifier, sans partie double.
Effort : **S** ≤ ½ j · **M** ½–2 j · **L** > 2 j.

> Le brief original définissait 6 priorités. Une grande partie de la Priorité 1 et 2 (libellés, séparation Facturé/Encaissé, fidéicommis détenu séparé, comptes à recevoir, revenu HT) est **déjà livrée** par `df82243`. Ce plan ne reprend que le **travail réellement restant**, réordonné par impact × risque × finissabilité.

---

## Lot 0 — Vérification live (préalable, non négociable)

*Pourquoi : avant de recoder quoi que ce soit, confirmer ce que `df82243` a réellement corrigé, et vérifier les données de prod de Dérisier.*

- Scan live des écrans Cayard (QC) et Dérisier (ON) : aperçu compta, Rapports→Taxes, Facturation→« à remettre », rapprochement, conformité. Noter toute chaîne anglaise figée (R-4) ou libellé QC figé chez Dérisier (R-3).
- Requête prod : existe-t-il des `TrustAccount.currentBalance < 0` chez Dérisier ? (bloque le déploiement de R-1 sinon).
- **Définition de terminé** : un court rapport listant, écran par écran, « conforme / à corriger », et le résultat de la requête solde négatif.
- **Effort** : S. **Risque** : nul (lecture seule).

---

## Lot 1 — Durcir le fidéicommis (R-1 + R-2) — ✅ FAIT 2026-06-15

> Implémenté et testé (7 tests, suite compta 145/145 verte). **Gate de déploiement restant** : exécuter en prod Dérisier la requête `SELECT id, "clientId", "currentBalance" FROM "TrustAccount" WHERE "cabinetId" = '<derisier>' AND "currentBalance" < 0;` — si elle renvoie des lignes, corriger ces comptes (écriture de correction) AVANT de déployer R-1, sinon la prochaine certification de Dérisier serait bloquée.

<details><summary>Détail (conservé pour mémoire)</summary>


*Anomalies : R-1 (certification masque un compte négatif), R-2 (TOCTOU retrait). Cœur conformité Barreau.*

1. **R-1** : à la certification, vérifier **chaque** `TrustAccount.currentBalance ≥ 0` (pas seulement l'agrégat). Bloquer avec un message listant les comptes fautifs.
   - Fichier : [reconciliation-service.ts](../../lib/services/fideicommis/reconciliation-service.ts) (`certifyReconciliation`, ajouter un check par compte).
2. **R-2** : déplacer le contrôle de solde **dans** le `$transaction` du retrait, avec `pg_advisory_xact_lock` par `trustAccountId` (réutiliser le pattern de `payment-allocation-service`).
   - Fichier : [trust-transaction-service.ts:202-333](../../lib/services/fideicommis/trust-transaction-service.ts).
- **Pré-requis** : Lot 0 (données prod Dérisier).
- **Tests** : certification bloquée si un compte < 0 ; deux retraits concurrents → un seul passe.
- **Définition de terminé** : tests verts + `npm run build` vert + vérif que Dérisier n'a pas de solde négatif légitime.
- **Effort** : M. **Risque** : moyen (touche Dérisier prod → après Lot 0).
</details>

---

## Lot 2 — Statuts de débours + KPI « Débours à récupérer » (M-1 + M-2) — ✅ FAIT 2026-06-15

> Implémenté et testé (suite compta 177/177 verte, typecheck 0 erreur). **Gate de déploiement** : appliquer la migration `prisma/migrations/20260615120000_add_debours_statut` (`prisma migrate deploy`) AVANT de déployer le code — la page comptabilité interroge `statutDebours`, qui n'existe pas sans la migration. La migration est additive et inclut le backfill (FACTURE si `factureId`, RECOUVRE si facture PAID).

*Donne un cycle de vie nommé au débours : non facturé → facturé → recouvré → radié.*

1. Ajouter un enum `DeboursStatut { NON_FACTURE, FACTURE, RECOUVRE, RADIE }` sur `DeboursDossier` (migration Prisma additive, défaut `NON_FACTURE`).
2. Transitions : facturation d'une ligne débours → `FACTURE` ; paiement de la facture couvrant le débours → `RECOUVRE` ; radiation explicite (écriture inverse) → `RADIE`.
3. KPI « Débours à récupérer » = Σ débours `payeParCabinet` non `RECOUVRE`/`RADIE`.
- **Tests** : transitions d'état ; KPI exclut recouvrés/radiés.
- **Définition de terminé** : enum + transitions + carte KPI + tests verts.
- **Effort** : M. **Risque** : faible (additif).

---

## Lot 3 — Verrouillage de période du journal (M-4) — ✅ FAIT 2026-06-15

> Implémenté et testé (suite compta 180/180 verte, typecheck 0 erreur). Modèle `AccountingPeriodLock`, garde-fou défensif dans `createJournalEntry`, auto-verrouillage à la certification, service `period-lock.ts` (lock/unlock/list). **Gate de déploiement** : `prisma migrate deploy` (migration additive `20260615130000_add_accounting_period_lock`) avant le code.



*Une fois un mois certifié au rapprochement, on ne doit plus pouvoir antidater une écriture dedans.*

1. Notion de période comptable verrouillée : à la certification d'un rapprochement (ou via une action explicite « clôturer le mois »), marquer la période.
2. `createJournalEntry` refuse une `dateTransaction` tombant dans une période verrouillée (sauf `CORRECTION` documentée qui crée une écriture **dans la période ouverte** courante, jamais dans la période fermée).
- **Tests** : écriture antidatée dans une période verrouillée rejetée ; correction post-clôture acceptée dans la période ouverte.
- **Définition de terminé** : garde-fou + message clair + tests.
- **Effort** : M. **Risque** : moyen (toucher `createJournalEntry` = chemin chaud → tests rigoureux).

---

## Lot 4 — Contrôles anti-erreurs interface (M-7)

*Les contrôles moteur existent ; il manque les avertissements côté saisie.*

- Avertissement (non bloquant) : paiement sans facture associée.
- Blocage : facture sans client/dossier.
- Avertissement : débours non facturé dans un dossier fermé.
- **Définition de terminé** : chaque contrôle visible à la saisie + test de la règle bloquante.
- **Effort** : S–M. **Risque** : faible.

---

## Lot 5 — Export comptable mappable (M-5)

*Passer du CSV générique à un export repris tel quel par le comptable / QuickBooks / Xero / Sage.*

1. Export par **période** (mois/trimestre/exercice), **horodaté** et **verrouillé** (snapshot).
2. Jeux d'export : transactions admin, factures, paiements, débours, dépenses, taxes, fidéicommis, piste d'audit.
3. Mappage de comptes configurable par cabinet (mapping vers le plan du logiciel cible).
- **Définition de terminé** : un export de période téléchargeable, importable dans au moins un des trois logiciels cibles, avec un fichier de mappage documenté.
- **Effort** : L. **Risque** : faible (lecture + génération).

---

## Lot 6 — Profil comptable du cabinet + onboarding (M-6)

*La pièce qui rend SAFE « adapté au profil réel du cabinet ». Voir [SAFE_ACCOUNTING_SOP.md](SAFE_ACCOUNTING_SOP.md) §4-5.*

1. Champs de profil sur `Cabinet` (ou `CabinetInterface.modules.comptabilite`) : province, taille, fidéicommis présent / actif, méthode de facturation, inscription TPS/TVQ + fréquence, comptable externe, logiciel comptable, besoins (export mensuel, rapprochement), niveau (simplifié/standard/avancé).
2. Questionnaire d'onboarding comptable à la création du cabinet.
3. Dérivation du **profil A/B/C/D** et activation conditionnelle des modules (ex. masquer le fidéicommis si absent).
- **Définition de terminé** : un cabinet créé via le questionnaire obtient un profil et une interface compta adaptée ; profil persisté et relisible.
- **Effort** : L. **Risque** : faible à moyen (touche l'onboarding).

---

## Ordre recommandé et justification

| Ordre | Lot | Pourquoi | Risque prod |
|---|---|---|---|
| 1 | **Lot 0** (vérif live) | Débloque tout le reste, confirme le déjà-fait, protège Dérisier | nul |
| 2 | **Lot 1** (fidéicommis R-1/R-2) | Plus fort enjeu de conformité encore ouvert | moyen → après Lot 0 |
| 3 | **Lot 2** (statuts débours) | Additif, finissable, comble un manque doctrine net | faible |
| 4 | **Lot 4** (anti-erreurs UI) | Petit, fort effet « difficile à mal utiliser » | faible |
| 5 | **Lot 3** (verrouillage période) | Intégrité de période, mais touche le chemin chaud | moyen |
| 6 | **Lot 6** (profil cabinet) | Structurant, gros, à faire quand le moteur est figé | faible-moyen |
| 7 | **Lot 5** (export mappable) | Valeur comptable externe, indépendant | faible |

**Ce qu'on ne fait pas** : partie double, bilan, amortissements, états certifiés, déclarations finales (hors doctrine).

---

## Première action physique concrète (quand vous validez)

> **Lot 1, R-1** : dans [reconciliation-service.ts](../../lib/services/fideicommis/reconciliation-service.ts), ajouter dans `certifyReconciliation` une vérification `prisma.trustAccount.findMany({ where: { cabinetId, currentBalance: { lt: 0 } } })` avant la mise à `certified`, et lever une erreur listant les comptes fautifs. Ajouter le test correspondant. **Précédé du Lot 0** (confirmer qu'aucun solde négatif légitime n'existe chez Dérisier).
