"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useTranslations } from "next-intl";
import { provenanceEcriture } from "@/lib/comptabilite/provenance";
import { BookOpen, Undo2 } from "lucide-react";
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
  reduction: "bg-si-danger",   // PS-001 : jeton, plus d'hexadécimale en dur
  warning: "bg-si-amber",
  neutral: "bg-si-muted",
};

/* Espacement d'origine rétabli le 2026-09-09.
   Serré à 8 px avec des largeurs fixes en pourcentage, chaque colonne tronquait :
   « Virement banca… », « 2026-05… », le client coupé. Huit colonnes de ce
   contenu ne tiennent pas dans 1 280 px. On rend donc l'air aux cellules et on
   laisse le tableau défiler dans SON conteneur, jamais la page (MB3). */
const TH =
  "px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]";
const TH_R =
  "px-4 py-3 text-right text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]";
const TD = "px-4 py-3 text-[14px] text-si-ink whitespace-nowrap";
const TD_N = `${TD} text-right font-mono tabular-nums`;

export function MovementsTable({
  entries,
  onAnnuler,
}: {
  entries: JournalEntryRow[];
  /**
   * Fourni : une colonne d'action apparaît. Elle ne s'active que sur les lignes
   * `annulable` (saisie manuelle vivante), miroir exact du garde-fou serveur
   * `assertAnnulable`. Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md.
   */
  onAnnuler?: (entry: JournalEntryRow) => void;
}) {
  const t = useTranslations("accountingUi");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();

  /* La colonne d'action ne s'affiche que si AU MOINS une ligne est annulable.
     Sur un journal de factures et de paiements, aucune ne l'est : la colonne
     n'affichait qu'une suite de tirets, et prenait la place du reste. */
  const avecActions = Boolean(onAnnuler) && entries.some((e) => e.annulable);

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
            <th className={TH}>{t("colSource")}</th>
            <th className={TH}>{t("client")}</th>
            <th className={TH}>{t("matter")}</th>
            <th className={TH}>{t("colVoucher")}</th>
            <th className={TH_R}>{t("colDueEffect")}</th>
            <th className={TH_R}>{t("colCashImpact")}</th>
            {avecActions ? <th className={TH_R}>{t("actions")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const m = describeMovement(e);
            const prov = provenanceEcriture(e);
            const piece = e.documentIdentifier ?? e.reference;
            return (
              <tr key={e.id} className="safe-zoom-rang border-b-[0.5px] border-si-line transition-colors">
                <td className={`${TD} font-mono tabular-nums whitespace-nowrap text-si-body`}>
                  {formatCalendarDate(e.dateTransaction)}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[m.tone]}`} aria-hidden />
                    {t(KIND_LABEL_KEY[m.kind])}
                  </span>
                </td>
                {/* Provenance : comment l'argent est arrivé, ou la catégorie de
                    la dépense. Vide sur une facture émise, où elle ne ferait
                    que répéter le type. */}
                <td className={`${TD} text-si-body`}>{prov ?? "—"}</td>
                <td className={`${TD} max-w-[220px] truncate`} title={e.clientName ?? undefined}>
                  {e.clientName ?? "—"}
                </td>
                <td className={`${TD} max-w-[180px] truncate font-mono tabular-nums`} title={e.dossierLabel ?? undefined}>
                  {e.dossierLabel ?? "—"}
                </td>
                {/* La pièce : le numéro de facture, le même sur la facture et
                    sur le paiement qui la règle. Le fournisseur pour une dépense. */}
                <td className={`${TD} font-mono tabular-nums`}>{piece ?? "—"}</td>
                {/* Un seul montant signé, au lieu de deux colonnes dont l'une
                    était toujours vide. L'ambre monte le dû, le vert le réduit :
                    le signe double la couleur, elle ne travaille jamais seule. */}
                <td
                  className={`${TD_N} ${
                    m.increasesDue > 0
                      ? "text-si-amber-ink"
                      : m.reducesDue > 0
                        ? "text-si-verified"
                        : "text-si-muted"
                  }`}
                >
                  {m.increasesDue > 0
                    ? `+ ${formatCurrency(m.increasesDue)}`
                    : m.reducesDue > 0
                      ? `− ${formatCurrency(m.reducesDue)}`
                      : "—"}
                </td>
                <td
                  className={`${TD_N} ${
                    m.cashImpact > 0
                      ? "text-si-verified"
                      : m.cashImpact < 0
                        ? "text-si-danger-ink"
                        : "text-si-muted"
                  }`}
                >
                  {m.cashImpact === 0
                    ? "—"
                    : `${m.cashImpact > 0 ? "+ " : "− "}${formatCurrency(Math.abs(m.cashImpact))}`}
                </td>
                {avecActions ? (
                  <td className={`${TD} text-right whitespace-nowrap`}>
                    {e.annulable ? (
                      <button
                        type="button"
                        onClick={() => onAnnuler?.(e)}
                        className="min-h-tap inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink-strong"
                      >
                        <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
                        {t("cancelEntry")}
                      </button>
                    ) : (
                      <span className="text-[12px] text-si-muted">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
