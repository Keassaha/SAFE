/**
 * Calcul des indicateurs du journal général — logique PURE et testable.
 *
 * Principe : on ne lit JAMAIS le `solde` cumulé stocké par ligne (qui devient faux
 * si une écriture est antidatée). Tous les indicateurs sont recalculés depuis les
 * montants `montantEntree`/`montantSortie`, classés par TYPE d'écriture.
 *
 * Séparation stricte des flux (B-1 r.5 QC / By-Law 9 ON) :
 *  - FACTURE        → « Facturé » (créance), JAMAIS du cash.
 *  - PAIEMENT       → « Encaissé » + solde opérationnel (cash entré).
 *  - DEPENSE/DEBOURS→ solde opérationnel (cash sorti).
 *  - AJUSTEMENT/CORRECTION → ajustements cash documentés du solde opérationnel.
 *  - DEPOT/RETRAIT_FIDEICOMMIS → solde fidéicommis SEULEMENT, jamais le cabinet.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";

/** Types d'écritures du fidéicommis (argent du client, jamais au cabinet). */
export const TRUST_TX_TYPES: readonly JournalTransactionType[] = [
  "DEPOT_FIDEICOMMIS",
  "RETRAIT_FIDEICOMMIS",
] as const;

/**
 * Types qui composent le SOLDE OPÉRATIONNEL (cash réel du compte d'administration).
 * On EXCLUT FACTURE (créance, pas du cash) et le fidéicommis. PAIEMENT = cash entré ;
 * DEPENSE/DEBOURS = cash sorti ; AJUSTEMENT/CORRECTION = ajustements cash documentés.
 */
export const OPERATIONAL_CASH_TYPES: readonly JournalTransactionType[] = [
  "PAIEMENT",
  "DEPENSE",
  "DEBOURS",
  "AJUSTEMENT",
  "CORRECTION",
] as const;

/** Sous-ensemble minimal d'une écriture nécessaire au calcul des indicateurs. */
export interface KpiEntry {
  typeTransaction: JournalTransactionType;
  /** Module d'origine — sert à distinguer une CORRECTION de fidéicommis d'une correction cash. */
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
  dateTransaction: Date;
}

/**
 * Une écriture appartient-elle au FIDÉICOMMIS (argent du client) ?
 * Les dépôts/retraits le sont par leur type. Une CORRECTION issue du module
 * FIDEICOMMIS (cf. createTrustCorrection) corrige aussi de l'argent client : elle
 * doit ajuster le solde fidéicommis, jamais le solde opérationnel du cabinet.
 *
 * Exporté pour que la couche de présentation (movement-semantics) classe les
 * écritures EXACTEMENT comme les KPI — pas de divergence possible.
 */
export function isTrustEntry(e: Pick<KpiEntry, "typeTransaction" | "sourceModule">): boolean {
  if (TRUST_TX_TYPES.includes(e.typeTransaction)) return true;
  return e.typeTransaction === "CORRECTION" && e.sourceModule === "FIDEICOMMIS";
}

export interface KpiPeriod {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const net = (e: KpiEntry): number => e.montantEntree - e.montantSortie;

const inPeriod = (e: KpiEntry, from: Date, to: Date): boolean =>
  e.dateTransaction >= from && e.dateTransaction <= to;

/**
 * Calcule les indicateurs du journal à partir des écritures (classées par TYPE),
 * du solde des comptes à recevoir et de la période courante.
 *
 * @param entries           toutes les écritures du cabinet (tous exercices).
 * @param comptesARecevoir  Σ des soldes dus des factures ouvertes (source : module facturation).
 * @param period            bornes de la période courante et de la précédente.
 */
export function computeJournalKpis(
  entries: KpiEntry[],
  comptesARecevoir: number,
  period: KpiPeriod,
  deboursARecuperer = 0,
): JournalKpiData {
  let totalFacture = 0;
  let totalFactureMoisPrecedent = 0;
  let totalEncaisse = 0;
  let totalDepenses = 0;
  let totalDepensesMoisPrecedent = 0;
  let soldeOperationnelEstime = 0;
  let soldeFideicommis = 0;
  let nbTransactionsCeMois = 0;

  for (const e of entries) {
    const isTrust = isTrustEntry(e);
    // Une CORRECTION de fidéicommis (isTrust) est exclue du cash opérationnel,
    // même si CORRECTION figure dans OPERATIONAL_CASH_TYPES.
    const isOperational = OPERATIONAL_CASH_TYPES.includes(e.typeTransaction) && !isTrust;
    const thisMonth = inPeriod(e, period.from, period.to);
    const prevMonth = inPeriod(e, period.prevFrom, period.prevTo);

    if (thisMonth) nbTransactionsCeMois += 1;

    // ── Soldes (point dans le temps, tous exercices confondus) ──
    if (isTrust) soldeFideicommis += net(e);
    // Solde opérationnel = cash réel : on N'INCLUT JAMAIS la FACTURE ici.
    if (isOperational) soldeOperationnelEstime += net(e);

    // ── Indicateurs de période ──
    if (e.typeTransaction === "FACTURE") {
      if (thisMonth) totalFacture += net(e);
      if (prevMonth) totalFactureMoisPrecedent += net(e);
    } else if (e.typeTransaction === "PAIEMENT") {
      if (thisMonth) totalEncaisse += e.montantEntree;
    } else if (e.typeTransaction === "DEPENSE" || e.typeTransaction === "DEBOURS") {
      if (thisMonth) totalDepenses += e.montantSortie - e.montantEntree;
      if (prevMonth) totalDepensesMoisPrecedent += e.montantSortie - e.montantEntree;
    }
  }

  return {
    totalFacture: round2(totalFacture),
    totalEncaisse: round2(totalEncaisse),
    totalDepenses: round2(totalDepenses),
    comptesARecevoir: round2(comptesARecevoir),
    deboursARecuperer: round2(deboursARecuperer),
    soldeOperationnelEstime: round2(soldeOperationnelEstime),
    soldeFideicommis: round2(soldeFideicommis),
    nbTransactionsCeMois,
    totalFactureMoisPrecedent: round2(totalFactureMoisPrecedent),
    totalDepensesMoisPrecedent: round2(totalDepensesMoisPrecedent),
  };
}
