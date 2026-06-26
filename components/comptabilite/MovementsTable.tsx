"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { JournalEntryRow } from "@/types/journal";
import {
  describeMovement,
  type MovementKind,
  type MovementTone,
  type RelatedBalance,
} from "@/lib/accounting/movement-semantics";

/**
 * Tableau lisible « Mouvements expliqués ».
 * Remplace les colonnes brutes entrée/sortie par des colonnes en langage avocat :
 * Augmente le dû · Réduit le dû · Impact trésorerie · Solde lié. La lecture de
 * chaque ligne vient d'une seule source : describeMovement().
 */

const KIND_LABEL_KEY: Record<MovementKind, string> = {
  INVOICE_ISSUED: "moveKindInvoice",
  CREDIT_NOTE: "moveKindCreditNote",
  PAYMENT_RECEIVED: "moveKindPayment",
  EXPENSE: "moveKindExpense",
  DISBURSEMENT: "moveKindDisbursement",
  TRUST_DEPOSIT: "moveKindTrustDeposit",
  TRUST_WITHDRAWAL: "moveKindTrustWithdrawal",
  ADJUSTMENT: "moveKindAdjustment",
  CORRECTION_TRUST: "moveKindCorrection",
  CORRECTION_CASH: "moveKindCorrection",
};

const RELATED_BALANCE_KEY: Record<RelatedBalance, string> = {
  RECEIVABLE: "balanceReceivable",
  OPERATING_CASH: "balanceOperating",
  TRUST: "balanceTrust",
  DISBURSEMENTS: "balanceDisbursements",
};

const TONE_DOT: Record<MovementTone, string> = {
  positive: "bg-si-verified",
  reduction: "bg-[#B84A3E]",
  warning: "bg-si-amber",
  neutral: "bg-si-muted",
};

const TH =
  "px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]";
const TH_R =
  "px-4 py-3 text-right text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]";

export function MovementsTable({ entries }: { entries: JournalEntryRow[] }) {
  const t = useTranslations("accountingUi");

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-si-canvas mb-4">
            <BookOpen className="w-8 h-8 text-si-muted" aria-hidden />
          </div>
          <p className="text-[16px] font-medium text-si-ink">{t("emptyTitle")}</p>
          <p className="text-[14px] text-si-muted mt-2 max-w-[400px] mx-auto">{t("emptyHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b-[0.5px] border-si-line bg-si-canvas">
            <th className={TH}>{t("date")}</th>
            <th className={TH}>{t("type")}</th>
            <th className={TH}>{t("client")}</th>
            <th className={TH}>{t("matter")}</th>
            <th className={TH}>{t("description")}</th>
            <th className={TH_R}>{t("colIncreasesDue")}</th>
            <th className={TH_R}>{t("colReducesDue")}</th>
            <th className={TH_R}>{t("colCashImpact")}</th>
            <th className={TH}>{t("colRelatedBalance")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const m = describeMovement(e);
            return (
              <tr
                key={e.id}
                className="border-b-[0.5px] border-si-line hover:bg-si-canvas/60 transition-colors"
              >
                <td className="px-4 py-3 text-[14px] text-si-ink whitespace-nowrap">
                  {formatDate(e.dateTransaction)}
                </td>
                <td className="px-4 py-3 text-[14px] text-si-ink whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[m.tone]}`} aria-hidden />
                    {t(KIND_LABEL_KEY[m.kind])}
                  </span>
                </td>
                <td className="px-4 py-3 text-[14px] text-si-ink max-w-[180px] truncate">
                  {e.clientName ?? "—"}
                </td>
                <td className="px-4 py-3 text-[14px] font-mono text-si-ink max-w-[160px] truncate">
                  {e.dossierLabel ?? "—"}
                </td>
                <td className="px-4 py-3 text-[14px] text-si-ink max-w-[220px] truncate" title={e.description}>
                  {e.description}
                </td>
                {/* Augmente le dû — amber */}
                <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-si-amber-ink">
                  {m.increasesDue > 0 ? formatCurrency(m.increasesDue) : "—"}
                </td>
                {/* Réduit le dû — rouge */}
                <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-[#B84A3E]">
                  {m.reducesDue > 0 ? `- ${formatCurrency(m.reducesDue)}` : "—"}
                </td>
                {/* Impact trésorerie — vert si +, rouge si −, neutre si 0 */}
                <td
                  className={`px-4 py-3 text-[14px] text-right font-mono tabular-nums ${
                    m.cashImpact > 0
                      ? "text-si-verified"
                      : m.cashImpact < 0
                        ? "text-[#B84A3E]"
                        : "text-si-muted"
                  }`}
                >
                  {m.cashImpact === 0
                    ? "—"
                    : `${m.cashImpact > 0 ? "+ " : "- "}${formatCurrency(Math.abs(m.cashImpact))}`}
                </td>
                {/* Solde lié */}
                <td className="px-4 py-3 text-[14px] whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border border-si-line bg-si-canvas px-2 py-0.5 text-[12px] text-si-muted">
                    {t(RELATED_BALANCE_KEY[m.relatedBalance])}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
