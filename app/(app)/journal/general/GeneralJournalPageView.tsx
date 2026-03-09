"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  getJournalEntriesAction,
  getJournalKpisAction,
  exportJournalAction,
} from "./actions";
import type { JournalKpiData, JournalEntryRow } from "@/types/journal";
import { JOURNAL_TRANSACTION_TYPE_LABELS } from "@/types/journal";
import type { JournalTransactionType } from "@prisma/client";
import { Download, Loader2 } from "lucide-react";

const PAGE_SIZE = 50;
const TRANSACTION_TYPES: { value: "" | JournalTransactionType; label: string }[] = [
  { value: "", label: "Tous les types" },
  ...(Object.entries(JOURNAL_TRANSACTION_TYPE_LABELS) as [JournalTransactionType, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export function GeneralJournalPageView({
  initialKpis,
}: {
  initialKpis: JournalKpiData;
}) {
  const now = new Date();
  const [kpis, setKpis] = useState<JournalKpiData>(initialKpis);
  const [dateFrom, setDateFrom] = useState<string>(() => toDateStr(startOfMonth(now)));
  const [dateTo, setDateTo] = useState<string>(() => toDateStr(endOfMonth(now)));
  const [typeTransaction, setTypeTransaction] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [soldeGlobal, setSoldeGlobal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJournalEntriesAction({
        dateFrom: dateFrom ? new Date(dateFrom + "T00:00:00") : undefined,
        dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
        typeTransaction: (typeTransaction || undefined) as JournalTransactionType | undefined,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
        orderBy: "dateTransaction",
        orderDir: "desc",
      });
      setEntries(result.entries);
      setTotalCount(result.totalCount);
      setSoldeGlobal(result.soldeGlobal);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, typeTransaction, search, page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const refreshKpis = useCallback(async () => {
    const data = await getJournalKpisAction();
    setKpis(data);
  }, []);

  useEffect(() => {
    refreshKpis();
  }, [refreshKpis]);

  async function handleExport() {
    setExporting(true);
    try {
      const { blob: b64, filename } = await exportJournalAction(
        {
          dateFrom: dateFrom ? new Date(dateFrom + "T00:00:00") : undefined,
          dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
          typeTransaction: (typeTransaction || undefined) as JournalTransactionType | undefined,
          search: search.trim() || undefined,
          page: 1,
          pageSize: 10000,
          orderBy: "dateTransaction",
          orderDir: "asc",
        },
        "csv"
      );
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Journal général"
        description="Registre central des écritures comptables (append-only). Filtrez par période, type et recherchez par référence, description ou client."
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Download className="w-4 h-4" aria-hidden />
            )}
            <span className="ml-2">Exporter CSV</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-neutral-500">Solde global</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(soldeGlobal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-neutral-500">Revenus (ce mois)</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(kpis.totalRevenus)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-neutral-500">Dépenses (ce mois)</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(kpis.totalDepenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-neutral-500">Transactions ce mois</p>
            <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
              {kpis.nbTransactionsCeMois}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Filtres" />
        <CardContent>
          <form
            className="flex flex-wrap gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
          >
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Du
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:ring-2 focus:ring-primary-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Au
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:ring-2 focus:ring-primary-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Type
              </label>
              <select
                value={typeTransaction}
                onChange={(e) => setTypeTransaction(e.target.value)}
                className="w-48 h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">
                Recherche
              </label>
              <input
                type="search"
                placeholder="Référence, description, client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500/30 outline-none"
              />
            </div>
            <Button type="submit" variant="primary">
              Appliquer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Écritures"
          action={
            <span className="text-sm font-normal text-neutral-500">
              {totalCount} écriture{totalCount !== 1 ? "s" : ""}
            </span>
          }
        />
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" aria-hidden />
            </div>
          ) : (
            <>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80">
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Dossier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Entrée
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Sortie
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Solde
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 text-center text-sm text-neutral-500"
                      >
                        Aucune écriture pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50/60"
                      >
                        <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                          {formatDate(e.dateTransaction)}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                          {JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction]}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                          {e.reference ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 max-w-[180px] truncate">
                          {e.clientName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 max-w-[180px] truncate">
                          {e.dossierLabel ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 max-w-[220px] truncate">
                          {e.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-neutral-700">
                          {e.montantEntree > 0 ? formatCurrency(e.montantEntree) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-neutral-700">
                          {e.montantSortie > 0 ? formatCurrency(e.montantSortie) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums font-medium text-neutral-900">
                          {formatCurrency(e.solde)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
