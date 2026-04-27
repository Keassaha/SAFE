"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
import { Download, Loader2, BookOpen, Scale, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { staggerContainer, staggerContainerReduced, fadeInUp, useSafeMotion } from "@/lib/motion";
import { ComptaKpiCard } from "@/components/comptabilite/ComptaKpiCard";

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
  const { reduceMotion } = useSafeMotion();
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
    <div className="space-y-6 pb-12">
      <div className="flex justify-end">
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
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={reduceMotion ? staggerContainerReduced : staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <ComptaKpiCard
          label="Solde global"
          value={soldeGlobal}
          format="currency"
          icon={Scale}
          semantic={soldeGlobal >= 0 ? "credit" : "debit"}
        />
        <ComptaKpiCard
          label="Revenus (ce mois)"
          value={kpis.totalRevenus}
          format="currency"
          icon={TrendingUp}
          semantic="credit"
        />
        <ComptaKpiCard
          label="Dépenses (ce mois)"
          value={kpis.totalDepenses}
          format="currency"
          icon={TrendingDown}
          semantic="debit"
        />
        <ComptaKpiCard
          label="Transactions ce mois"
          value={kpis.nbTransactionsCeMois}
          format="integer"
          icon={Activity}
          semantic="neutral"
        />
      </motion.div>

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
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">
                Du
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">
                Au
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">
                Type
              </label>
              <select
                value={typeTransaction}
                onChange={(e) => setTypeTransaction(e.target.value)}
                className="w-48 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">
                Recherche
              </label>
              <input
                type="search"
                placeholder="Référence, description, client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-forest-700 focus:shadow-focus outline-none"
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
              <Loader2 className="w-8 h-8 animate-spin text-forest-700" aria-hidden />
            </div>
          ) : (
            <>
              <motion.div
                variants={reduceMotion ? undefined : fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-[0.5px] border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Référence
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Dossier
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Entrée
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Sortie
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      Solde
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <BookOpen className="w-8 h-8 text-slate-500" />
                          </div>
                          <p className="text-[16px] font-medium text-slate-800">Aucune écriture pour ces critères.</p>
                          <p className="text-[14px] text-slate-600 mt-2 max-w-[400px] mx-auto">Veuillez modifier vos filtres pour trouver ce que vous cherchez.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b-[0.5px] border-slate-100 hover:bg-neutral-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-[14px] text-slate-700 whitespace-nowrap">
                          {formatDate(e.dateTransaction)}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-slate-700 whitespace-nowrap">
                          {JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction]}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-mono text-slate-700 whitespace-nowrap">
                          {e.reference ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-slate-700 max-w-[180px] truncate">
                          {e.clientName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-mono text-slate-700 max-w-[180px] truncate">
                          {e.dossierLabel ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-slate-700 max-w-[220px] truncate">
                          {e.description}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-forest-700">
                          {e.montantEntree > 0 ? formatCurrency(e.montantEntree) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-red-600">
                          {e.montantSortie > 0 ? formatCurrency(e.montantSortie) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-[14px] text-right font-mono tabular-nums font-medium ${e.solde >= 0 ? "text-forest-700" : "text-red-600"}`}>
                          {formatCurrency(e.solde)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </motion.div>
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
