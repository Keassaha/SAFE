/**
 * Sémantique des mouvements — traduit une écriture brute du journal général en
 * lecture compréhensible par un·e avocat·e non comptable.
 *
 * SOURCE DE VÉRITÉ UNIQUE de la lecture « langage avocat » : le tableau lisible,
 * le panneau « Comprendre les mouvements » et les tests consomment tous CE fichier.
 * On NE recalcule aucun KPI ici ; on réutilise la classification de `kpi.ts`
 * (`isTrustEntry`) pour qu'une écriture soit lue EXACTEMENT comme elle est agrégée.
 *
 * Règle d'or comptable (B-1 r.5 QC / By-Law 9 ON) :
 *  - Une FACTURE augmente le DÛ du client ; ce n'est JAMAIS du cash encaissé.
 *  - Une note de crédit (FACTURE à net négatif) RÉDUIT le dû.
 *  - Un PAIEMENT réduit le dû ET entre en trésorerie (cash vert).
 *  - DÉPENSE / DÉBOURS sortent de la trésorerie du cabinet.
 *  - Le DÉBOURS récupérable est une dépense suivie à part (« débours à récupérer »),
 *    jamais agrégée aux comptes à recevoir.
 *  - Le FIDÉICOMMIS est l'argent du client : impact trésorerie cabinet = 0.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";
import { isTrustEntry } from "@/lib/services/journal/kpi";

/** Famille de mouvement en langage avocat. */
export type MovementKind =
  | "INVOICE_ISSUED"
  | "CREDIT_NOTE"
  | "PAYMENT_RECEIVED"
  | "EXPENSE"
  | "DISBURSEMENT"
  | "TRUST_DEPOSIT"
  | "TRUST_WITHDRAWAL"
  | "ADJUSTMENT"
  | "CORRECTION_TRUST"
  | "CORRECTION_CASH";

/** Solde de rattachement (quel compteur l'écriture fait bouger). */
export type RelatedBalance =
  | "RECEIVABLE" // comptes à recevoir
  | "OPERATING_CASH" // argent opérationnel du cabinet
  | "TRUST" // fidéicommis (argent client)
  | "DISBURSEMENTS"; // débours à récupérer

/**
 * Ton de couleur :
 *  - positive  : argent reçu / hausse de trésorerie (vert)
 *  - reduction : réduction, paiement appliqué, sortie, baisse de balance (rouge)
 *  - warning   : à surveiller (facturé non encaissé, fidéicommis utilisé)
 *  - neutral   : information sans impact trésorerie immédiat (noir)
 */
export type MovementTone = "positive" | "reduction" | "neutral" | "warning";

export interface MovementView {
  kind: MovementKind;
  /** « Augmente le dû » — montant qui augmente ce que le client doit (≥ 0). */
  increasesDue: number;
  /** « Réduit le dû » — montant qui réduit ce que le client doit (≥ 0). */
  reducesDue: number;
  /** « Impact trésorerie » — signé : + entrée, − sortie, 0 si facture/fidéicommis. */
  cashImpact: number;
  /** Solde lié — quel compteur bouge. */
  relatedBalance: RelatedBalance;
  /** Ton de couleur dominant de la ligne. */
  tone: MovementTone;
  /** Clé i18n (namespace accountingUi) de l'explication pédagogique. */
  explanationKey: string;
}

/** Sous-ensemble minimal d'une écriture nécessaire à la lecture. */
export interface MovementInput {
  typeTransaction: JournalTransactionType;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Traduit une écriture en lecture avocat. Fonction PURE et déterministe.
 */
export function describeMovement(entry: MovementInput): MovementView {
  const entree = entry.montantEntree || 0;
  const sortie = entry.montantSortie || 0;
  const net = round2(entree - sortie);

  // Le fidéicommis (dépôt/retrait + correction issue du module FIDEICOMMIS) est
  // classé EXACTEMENT comme dans les KPI : argent du client, hors trésorerie cabinet.
  if (isTrustEntry(entry)) {
    if (entry.typeTransaction === "DEPOT_FIDEICOMMIS") {
      return {
        kind: "TRUST_DEPOSIT",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: 0,
        relatedBalance: "TRUST",
        tone: "neutral",
        explanationKey: "moveTrustDeposit",
      };
    }
    if (entry.typeTransaction === "RETRAIT_FIDEICOMMIS") {
      return {
        kind: "TRUST_WITHDRAWAL",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: 0,
        relatedBalance: "TRUST",
        tone: "neutral",
        explanationKey: "moveTrustWithdrawal",
      };
    }
    // CORRECTION sur le fidéicommis : ajuste l'argent client, jamais le cabinet.
    return {
      kind: "CORRECTION_TRUST",
      increasesDue: 0,
      reducesDue: 0,
      cashImpact: 0,
      relatedBalance: "TRUST",
      tone: "neutral",
      explanationKey: "moveCorrectionTrust",
    };
  }

  switch (entry.typeTransaction) {
    case "FACTURE": {
      // Note de crédit = facture à net négatif → réduit le dû.
      if (net < 0) {
        return {
          kind: "CREDIT_NOTE",
          increasesDue: 0,
          reducesDue: round2(-net),
          cashImpact: 0,
          relatedBalance: "RECEIVABLE",
          tone: "reduction",
          explanationKey: "moveCreditNote",
        };
      }
      return {
        kind: "INVOICE_ISSUED",
        increasesDue: net,
        reducesDue: 0,
        cashImpact: 0,
        relatedBalance: "RECEIVABLE",
        tone: "warning", // facturé, pas encore encaissé
        explanationKey: "moveInvoiceIssued",
      };
    }

    case "PAIEMENT": {
      // Un paiement réduit le dû ET entre en trésorerie.
      const amount = round2(Math.max(entree, sortie));
      return {
        kind: "PAYMENT_RECEIVED",
        increasesDue: 0,
        reducesDue: amount,
        cashImpact: amount,
        relatedBalance: "RECEIVABLE",
        tone: "positive",
        explanationKey: "movePaymentReceived",
      };
    }

    case "DEPENSE": {
      return {
        kind: "EXPENSE",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: round2(entree - sortie), // négatif (sortie > entrée)
        relatedBalance: "OPERATING_CASH",
        tone: "reduction",
        explanationKey: "moveExpense",
      };
    }

    case "DEBOURS": {
      // Frais avancé par le cabinet, refacturable : sortie de cash, suivi à part.
      return {
        kind: "DISBURSEMENT",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: round2(entree - sortie),
        relatedBalance: "DISBURSEMENTS",
        tone: "neutral",
        explanationKey: "moveDisbursement",
      };
    }

    case "AJUSTEMENT": {
      return {
        kind: "ADJUSTMENT",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: net,
        relatedBalance: "OPERATING_CASH",
        tone: net >= 0 ? "neutral" : "reduction",
        explanationKey: "moveAdjustment",
      };
    }

    case "CORRECTION": {
      // CORRECTION non-fidéicommis (déjà filtrée plus haut) = correction cash.
      return {
        kind: "CORRECTION_CASH",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: net,
        relatedBalance: "OPERATING_CASH",
        tone: net >= 0 ? "neutral" : "reduction",
        explanationKey: "moveCorrectionCash",
      };
    }

    // DEPOT/RETRAIT_FIDEICOMMIS sont déjà traités par isTrustEntry plus haut.
    default: {
      return {
        kind: "ADJUSTMENT",
        increasesDue: 0,
        reducesDue: 0,
        cashImpact: net,
        relatedBalance: "OPERATING_CASH",
        tone: "neutral",
        explanationKey: "moveAdjustment",
      };
    }
  }
}

/** Familles affichées dans le panneau « Comprendre les mouvements ». */
export const MOVEMENT_LEGEND_KINDS: readonly MovementKind[] = [
  "INVOICE_ISSUED",
  "PAYMENT_RECEIVED",
  "EXPENSE",
  "DISBURSEMENT",
  "TRUST_DEPOSIT",
] as const;
