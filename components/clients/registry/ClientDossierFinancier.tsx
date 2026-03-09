"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import {
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";

export type TimeEntryFinancialRow = {
  id: string;
  date: Date;
  description: string | null;
  dureeMinutes: number;
  montant: number;
  userNom: string;
  dossierIntitule: string | null;
  dossierId: string | null;
};

export type InvoiceFinancialRow = {
  id: string;
  numero: string;
  dateEmission: Date;
  dateEcheance: Date;
  montantTotal: number;
  balanceDue: number;
  statut: string;
  dossierIntitule: string | null;
  dossierId: string | null;
  paymentsCount: number;
};

interface ClientDossierFinancierProps {
  totalBilled: number;
  totalReceived: number;
  balanceDue: number;
  invoiceCount: number;
  paymentCount: number;
  timeEntries: TimeEntryFinancialRow[];
  invoices: InvoiceFinancialRow[];
  transactions: Array<{ date: Date; label: string; amount: number }>;
}

export function ClientDossierFinancier({
  totalBilled,
  totalReceived,
  balanceDue,
  invoiceCount,
  paymentCount,
  timeEntries,
  invoices,
  transactions,
}: ClientDossierFinancierProps) {
  const t = useTranslations("clients");
  const tInv = useTranslations("invoiceStatut");

  const totalHeures =
    timeEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;
  const totalMontantTemps = timeEntries.reduce((s, e) => s + e.montant, 0);

  const cards = [
    {
      title: t("totalBilled"),
      value: formatCurrency(totalBilled),
      sub: t("invoicesCount", { count: invoiceCount }),
      icon: FileText,
    },
    {
      title: t("totalReceived"),
      value: formatCurrency(totalReceived),
      sub: t("paymentsCount", { count: paymentCount }),
      icon: CheckCircle,
    },
    {
      title: t("balanceDue"),
      value: formatCurrency(balanceDue),
      sub: null,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ title, value, sub, icon: Icon }) => (
          <div
            key={title}
            className="rounded-xl bg-white border border-neutral-border/80 shadow-[var(--safe-shadow-sm)] p-4"
          >
            <p className="text-xs font-medium text-neutral-muted uppercase tracking-wider">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold text-neutral-text-primary">
              {value}
            </p>
            {sub && (
              <p className="mt-0.5 text-sm text-neutral-muted">{sub}</p>
            )}
            <div className="mt-2 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t("financialHistory")}
          action={
            <span className="text-xs text-neutral-muted">
              {t("financialHistorySub")}
            </span>
          }
        />
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-neutral-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noTransactions")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-neutral-border/60 last:border-0"
                >
                  <span className="text-sm text-neutral-text-secondary">
                    {formatDate(tx.date)} — {tx.label}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={t("timePerformed")}
          action={
            <span className="text-xs text-neutral-muted">
              {t("timeEntriesSummary", {
                count: timeEntries.length,
                hours: totalHeures.toFixed(1),
                amount: formatCurrency(totalMontantTemps),
              })}
            </span>
          }
        />
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-muted">
              {t("noTimeEntriesForClient")}
            </p>
          ) : (
            <div className="overflow-x-auto border border-neutral-border rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-surface/50 border-b border-neutral-border">
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableDate")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableMatter")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableDescription")}
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-muted">
                      {t("tableDuration")}
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-muted">
                      {t("tableAmount")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableLawyer")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-border last:border-0"
                    >
                      <td className="py-2 px-3 text-neutral-muted">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-2 px-3">
                        {r.dossierId ? (
                          <Link
                            href={routes.dossier(r.dossierId)}
                            className="text-primary-600 hover:underline"
                          >
                            {r.dossierIntitule ?? "—"}
                          </Link>
                        ) : (
                          r.dossierIntitule ?? "—"
                        )}
                      </td>
                      <td className="py-2 px-3">{r.description ?? "—"}</td>
                      <td className="py-2 px-3 text-right">
                        {(r.dureeMinutes / 60).toFixed(1)} h
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(r.montant)}
                      </td>
                      <td className="py-2 px-3">{r.userNom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("invoices")} />
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-muted">
              {t("noInvoicesForClient")}
            </p>
          ) : (
            <div className="overflow-x-auto border border-neutral-border rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-surface/50 border-b border-neutral-border">
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableInvoiceNumber")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableMatter")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableIssueDate")}
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-muted">
                      {t("tableAmount")}
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-muted">
                      {t("tableBalance")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-muted">
                      {t("tableStatus")}
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-neutral-border last:border-0 hover:bg-neutral-50/50"
                    >
                      <td className="py-2 px-3 font-medium text-neutral-800">
                        {inv.numero}
                      </td>
                      <td className="py-2 px-3 text-neutral-muted">
                        {inv.dossierIntitule ?? "—"}
                      </td>
                      <td className="py-2 px-3">
                        {formatDate(inv.dateEmission)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(inv.montantTotal)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            inv.statut === "payee"
                              ? "bg-status-success-bg text-status-success"
                              : inv.statut === "en_retard"
                                ? "bg-status-error-bg text-status-error"
                                : inv.statut === "brouillon"
                                  ? "bg-neutral-100 text-neutral-600"
                                  : "bg-status-warning-bg text-status-warning"
                          }`}
                        >
                          {tInv(inv.statut as any)}
                        </span>
                      </td>
                      <td className="py-2 px-3" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
