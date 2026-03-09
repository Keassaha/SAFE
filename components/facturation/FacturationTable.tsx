"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/lib/routes";
import type { InvoiceStatut } from "@prisma/client";
import { ChevronRight, FileText, Building2, Bell } from "lucide-react";

export interface FacturationTableRow {
  id: string;
  numero: string;
  client: string;
  clientId: string;
  dossier: string;
  dossierId: string | null;
  dateEmission: Date;
  dateEcheance: Date;
  montantTotal: number;
  balanceDue: number;
  statut: InvoiceStatut;
  lastReminderDay?: number | null;
  lastReminderSentAt?: Date | null;
}

const STATUT_VARIANTS: Record<InvoiceStatut, "neutral" | "warning" | "success" | "error"> = {
  brouillon: "neutral",
  envoyee: "warning",
  partiellement_payee: "warning",
  payee: "success",
  en_retard: "error",
};

function paidPercent(montantTotal: number, balanceDue: number): number {
  if (montantTotal <= 0) return 0;
  const paid = montantTotal - balanceDue;
  return Math.min(100, Math.round((paid / montantTotal) * 100));
}

export function FacturationTable({ invoices }: { invoices: FacturationTableRow[] }) {
  const t = useTranslations("common");
  const tStatut = useTranslations("invoiceStatut");

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-[var(--safe-neutral-border)] bg-neutral-50/80">
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("invoiceNumber")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("client")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("dossier")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("issueDate")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("dueDate")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("totalAmount")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("balance")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider">
              {t("status")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider w-24">
              {t("reminder")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--safe-text-secondary)] uppercase tracking-wider w-28">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => {
            const percent = paidPercent(inv.montantTotal, inv.balanceDue);
            const hasPayment = percent > 0;
            const hasReminder = inv.lastReminderDay != null || inv.lastReminderSentAt != null;
            return (
              <tr
                key={inv.id}
                className={`border-b border-[var(--safe-neutral-border)]/80 transition-colors hover:bg-neutral-50/60 ${
                  i % 2 === 1 ? "bg-neutral-50/40" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={routes.facturationFactureEdit(inv.id)}
                    className="inline-flex items-center gap-2 text-sm font-medium safe-text-title text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-mono">{inv.numero}</span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={routes.client(inv.clientId)}
                    className="inline-flex items-center gap-2 text-sm safe-text-title text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <Building2 className="h-4 w-4 text-[var(--safe-text-secondary)] shrink-0" aria-hidden />
                    {inv.client}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm safe-text-title">
                  {inv.dossierId ? (
                    <Link
                      href={routes.dossier(inv.dossierId)}
                      className="text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {inv.dossier}
                    </Link>
                  ) : (
                    inv.dossier
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--safe-text-secondary)]">
                  {formatDate(inv.dateEmission)}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--safe-text-secondary)]">
                  {formatDate(inv.dateEcheance)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium safe-text-title">
                    {formatCurrency(inv.montantTotal)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm font-medium safe-text-title">
                      {formatCurrency(inv.balanceDue)}
                    </span>
                    {hasPayment && (
                      <span className="text-xs text-[var(--safe-text-secondary)]">
                        {percent} {t("paidPercent")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={tStatut(inv.statut)}
                    variant={STATUT_VARIANTS[inv.statut]}
                  />
                </td>
                <td className="px-4 py-3">
                  {hasReminder ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--safe-text-secondary)]"
                      title={
                        inv.lastReminderSentAt
                          ? `${t("relanceOn")} ${formatDate(inv.lastReminderSentAt)}`
                          : undefined
                      }
                    >
                      <Bell className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {inv.lastReminderDay != null ? `J+${inv.lastReminderDay}` : "—"}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={routes.facturationFactureEdit(inv.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {t("see")}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
