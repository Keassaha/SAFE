"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useTrustTransactions, type TrustTransactionsFilters } from "@/lib/hooks/useFideicommis";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface TransactionsTableProps {
  cabinetId: string | null;
  clients: { id: string; raisonSociale: string }[];
  dossiers: { id: string; clientId: string; intitule: string; numeroDossier: string | null }[];
}

export function TransactionsTable({ cabinetId, clients, dossiers }: TransactionsTableProps) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const TYPE_LABELS: Record<string, string> = {
    deposit: tf("typeDeposit"),
    withdrawal: tf("typeWithdrawal"),
    correction: tf("typeCorrection"),
  };

  const filters: TrustTransactionsFilters = {
    clientId: clientId || undefined,
    dossierId: dossierId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 100,
  };

  const { data, isLoading } = useTrustTransactions(cabinetId, filters);
  const transactions = data?.transactions ?? [];

  return (
    <Card>
      <CardHeader
        title={tf("transactionHistory")}
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-9 px-2 rounded border border-neutral-border bg-white text-sm"
            >
              <option value="">{tf("allClients")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale}
                </option>
              ))}
            </select>
            <select
              value={dossierId}
              onChange={(e) => setDossierId(e.target.value)}
              className="h-9 px-2 rounded border border-neutral-border bg-white text-sm"
            >
              <option value="">{tf("allMatters")}</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.numeroDossier ? `${d.numeroDossier} – ` : ""}{d.intitule}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-2 rounded border border-neutral-border bg-white text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-2 rounded border border-neutral-border bg-white text-sm"
            />
          </div>
        }
      />
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-neutral-500 py-8 text-center">{tf("noTransactions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left py-3 px-3 font-medium">{tc("date")}</th>
                  <th className="text-left py-3 px-3 font-medium">{tc("client")}</th>
                  <th className="text-left py-3 px-3 font-medium">{tc("dossier")}</th>
                  <th className="text-left py-3 px-3 font-medium">{tc("type")}</th>
                  <th className="text-left py-3 px-3 font-medium">{tc("description")}</th>
                  <th className="text-left py-3 px-3 font-medium">{tf("reference")}</th>
                  <th className="text-right py-3 px-3 font-medium">{tf("typeDeposit")}</th>
                  <th className="text-right py-3 px-3 font-medium">{tf("typeWithdrawal")}</th>
                  <th className="text-right py-3 px-3 font-medium">{tc("balance")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                    <td className="py-2 px-3">{formatDate(t.date)}</td>
                    <td className="py-2 px-3">{t.client?.raisonSociale ?? "—"}</td>
                    <td className="py-2 px-3">
                      {t.dossier ? (t.dossier.numeroDossier ? `${t.dossier.numeroDossier} – ` : "") + t.dossier.intitule : "—"}
                    </td>
                    <td className="py-2 px-3">{TYPE_LABELS[t.type] ?? t.type}</td>
                    <td className="py-2 px-3 max-w-[180px] truncate" title={t.description ?? t.note ?? ""}>
                      {t.description ?? t.note ?? "—"}
                    </td>
                    <td className="py-2 px-3">{t.reference ?? "—"}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {t.amount > 0 ? formatCurrency(t.amount) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {t.amount < 0 ? formatCurrency(Math.abs(t.amount)) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">
                      {t.balanceAfter != null ? formatCurrency(t.balanceAfter) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
