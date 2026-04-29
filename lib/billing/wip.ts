/**
 * SAFE — Helpers de calcul WIP / facturable / classification.
 *
 * Source de vérité : docs/accounting/BILLING_CORE_MODEL.md
 *
 * Tous les helpers sont purs et testables. Ils résolvent l'ambiguïté entre
 * les champs doubles de `TimeEntry` (`montant` vs `feeAmount`) et donnent
 * un seul point d'appel pour tout calcul de WIP / réalisation / recouvrement.
 *
 * Convention : si une valeur ambiguë existe (ex: `feeAmount`), elle prime
 * sur le brut (`montant`) — voir doctrine §3.
 */

import type {
  BillingClassification,
  BillingRatios,
  BillingRegistreTache,
  BillingTimeEntry,
  DossierBillingSnapshot,
  WipBreakdown,
} from "./types";

const ROUND_2 = (n: number): number => Math.round(n * 100) / 100;

/* ───────── TimeEntry ───────── */

/**
 * Montant facturable canonique d'une TimeEntry.
 *
 * Règle V2 (cf. doctrine §3) :
 *  - Si la ligne est `WRITTEN_OFF`, `NON_BILLABLE`, `CANCELLED` ou `facturable=false`
 *    ou `isWrittenOff=true` → 0.
 *  - Sinon : `feeAmount` si défini et fini, sinon `montant`.
 *
 * Cette fonction est le **seul** point d'accès au montant facturable.
 * Aucun écran ne doit relire `feeAmount ?? montant` directement.
 *
 * @example
 *   getTimeEntryBillableAmount({ id: "t1", montant: 500, feeAmount: 425, facturable: true, isWrittenOff: false })
 *   // 425 (write-down de 75$ — feeAmount prime)
 */
export function getTimeEntryBillableAmount(entry: BillingTimeEntry): number {
  if (!entry.facturable) return 0;
  if (entry.isWrittenOff) return 0;
  if (entry.billingStatus === "WRITTEN_OFF") return 0;
  if (entry.billingStatus === "NON_BILLABLE") return 0;
  if (entry.billingStatus === "CANCELLED") return 0;

  if (typeof entry.feeAmount === "number" && Number.isFinite(entry.feeAmount)) {
    return ROUND_2(entry.feeAmount);
  }
  return ROUND_2(entry.montant ?? 0);
}

/**
 * Montant brut produit (référence) — sans considération de write-off ou de fee.
 * Utile pour calculer le ratio de réalisation.
 */
export function getTimeEntryProducedAmount(entry: BillingTimeEntry): number {
  return ROUND_2(entry.montant ?? 0);
}

/**
 * Classifie une TimeEntry pour l'affichage et les KPIs.
 */
export function classifyTimeEntryForBilling(entry: BillingTimeEntry): BillingClassification {
  if (entry.isWrittenOff || entry.billingStatus === "WRITTEN_OFF") return "written_off";
  if (!entry.facturable || entry.billingStatus === "NON_BILLABLE") return "non_billable";

  switch (entry.billingStatus) {
    case "BILLED":
      return "billed";
    case "IN_DRAFT_INVOICE":
      return "drafted";
    case "READY_TO_BILL":
      return "billable";
    case "NON_BILLED":
    case null:
    case undefined:
      return entry.feeAmount != null ? "billable" : "produced_only";
    case "CANCELLED":
      return "non_billable";
  }
  return "produced_only";
}

/**
 * Renvoie `true` si la TimeEntry est éligible au bucket "à facturer".
 * Centralise la règle utilisée par les KPIs facturation et le composeur de facture.
 */
export function isTimeEntryReadyForBilling(entry: BillingTimeEntry): boolean {
  const cls = classifyTimeEntryForBilling(entry);
  return cls === "billable";
}

/* ───────── RegistreTache (forfait) ───────── */

/**
 * Montant facturable d'une tâche forfaitaire — `montantFinal` si tâche
 * ouverte/complétée, 0 si déjà facturée.
 */
export function getRegistreTacheBillableAmount(tache: BillingRegistreTache): number {
  if (tache.statut === "facture") return 0;
  return ROUND_2(tache.montantFinal ?? 0);
}

/**
 * Recompute défensif : `montantBase + ajustement - rabais`.
 * Utile pour vérifier la cohérence du `montantFinal` stocké.
 */
export function recomputeRegistreTacheFinal(tache: BillingRegistreTache): number {
  return ROUND_2((tache.montantBase ?? 0) + (tache.ajustement ?? 0) - (tache.rabais ?? 0));
}

/* ───────── WIP par dossier ───────── */

/**
 * Calcule le WIP (Work In Progress) d'un dossier — la valeur facturable
 * non encore intégrée à une facture émise.
 *
 * Trois sources :
 *  - Heures (TimeEntry "billable")
 *  - Forfaits (RegistreTache statut != "facture")
 *  - Débours payés non encore facturés (input du snapshot)
 *
 * @example
 *   computeWipForDossier({
 *     dossierId: "d1", cabinetId: "c1",
 *     timeEntries: [{ id: "t1", montant: 500, feeAmount: 450, facturable: true, isWrittenOff: false, billingStatus: "READY_TO_BILL" }],
 *     registreTaches: [{ id: "r1", montantBase: 1500, ajustement: 0, rabais: 0, montantFinal: 1500, statut: "complete", taxable: true }],
 *     unbilledDisbursements: [{ id: "d1", montant: 250, taxable: false }],
 *   })
 *   // { hoursValue: 450, forfaitValue: 1500, disbursementsValue: 250, total: 2200 }
 */
export function computeWipForDossier(snap: DossierBillingSnapshot): WipBreakdown {
  const hoursValue = ROUND_2(
    snap.timeEntries.reduce((sum, e) => sum + (isTimeEntryReadyForBilling(e) ? getTimeEntryBillableAmount(e) : 0), 0),
  );
  const forfaitValue = ROUND_2(
    snap.registreTaches.reduce((sum, t) => sum + getRegistreTacheBillableAmount(t), 0),
  );
  const disbursementsValue = ROUND_2(
    snap.unbilledDisbursements.reduce((sum, d) => sum + (d.montant ?? 0), 0),
  );
  return {
    hoursValue,
    forfaitValue,
    disbursementsValue,
    total: ROUND_2(hoursValue + forfaitValue + disbursementsValue),
  };
}

/* ───────── Ratios ───────── */

/**
 * Réalisation = facturable / produit.
 * Si `produced === 0`, retourne 1 (aucun travail à dégrader → réalisation pleine).
 */
export function computeRealizationRate(produced: number, billable: number): number {
  if (produced <= 0) return 1;
  const r = billable / produced;
  return clamp01(r);
}

/**
 * Recouvrement = encaissé / facturé.
 * Si `billed === 0`, retourne 0 (pas de référence pour mesurer).
 */
export function computeRecoveryRate(billed: number, collected: number): number {
  if (billed <= 0) return 0;
  const r = collected / billed;
  return clamp01(r);
}

export function computeBillingRatios(
  produced: number,
  billable: number,
  billed: number,
  collected: number,
): BillingRatios {
  return {
    realization: computeRealizationRate(produced, billable),
    recovery: computeRecoveryRate(billed, collected),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return Math.round(n * 1000) / 1000;
}
