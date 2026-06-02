"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  createManualJournalEntryAction,
  getJournalEntriesAction,
  getJournalKpisAction,
  getManualJournalContextAction,
  exportJournalAction,
} from "./actions";
import type { JournalKpiData, JournalEntryRow } from "@/types/journal";
import { JOURNAL_TRANSACTION_TYPE_LABELS } from "@/types/journal";
import type { JournalTransactionType } from "@prisma/client";
import { Download, Loader2, BookOpen, Scale, TrendingUp, TrendingDown, Activity, Plus } from "lucide-react";
import { staggerContainer, staggerContainerReduced, fadeInUp, useSafeMotion } from "@/lib/motion";
import { ComptaKpiCard } from "@/components/comptabilite/ComptaKpiCard";
import type { ManualJournalContext } from "./actions";

const PAGE_SIZE = 50;
const TRANSACTION_TYPE_OPTIONS: { value: JournalTransactionType; label: string }[] = (
  Object.entries(JOURNAL_TRANSACTION_TYPE_LABELS) as [JournalTransactionType, string][]
).map(([value, label]) => ({ value, label }));

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
  const t = useTranslations("accountingUi");
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
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualContext, setManualContext] = useState<ManualJournalContext | null>(null);
  const [manualType, setManualType] = useState<JournalTransactionType>("FACTURE");
  const [manualClientId, setManualClientId] = useState("");

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

  async function openManualEntry() {
    setManualModalOpen(true);
    setManualError(null);
    if (!manualContext) {
      try {
        setManualContext(await getManualJournalContextAction());
      } catch (err) {
        setManualError(err instanceof Error ? err.message : t("loadingError"));
      }
    }
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManualSubmitting(true);
    setManualError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await createManualJournalEntryAction({
        dateTransaction: formData.get("dateTransaction") as string,
        typeTransaction: formData.get("typeTransaction") as JournalTransactionType,
        reference: (formData.get("reference") as string) || null,
        clientId: (formData.get("clientId") as string) || null,
        dossierId: (formData.get("dossierId") as string) || null,
        description: formData.get("description") as string,
        categorie: (formData.get("categorie") as string) || null,
        montantEntree: Number(formData.get("montantEntree") || 0),
        montantSortie: Number(formData.get("montantSortie") || 0),
      });
      setManualModalOpen(false);
      setPage(1);
      await Promise.all([loadEntries(), refreshKpis()]);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : t("entrySaveError"));
    } finally {
      setManualSubmitting(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const manualDossiers = manualContext?.dossiers.filter((dossier) => !manualClientId || dossier.clientId === manualClientId) ?? [];
  const defaultDirection = defaultDirectionFor(manualType);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={openManualEntry}
        >
          <Plus className="w-4 h-4" aria-hidden />
          <span className="ml-2">{t("newEntry")}</span>
        </Button>
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
          <span className="ml-2">{t("exportCsv")}</span>
        </Button>
      </div>

      <Modal
        open={manualModalOpen}
        onClose={() => {
          if (!manualSubmitting) setManualModalOpen(false);
        }}
        title={t("newEntry")}
        maxWidth="max-w-2xl"
      >
        <form key={manualType} onSubmit={handleManualSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setManualType("FACTURE")}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                manualType === "FACTURE"
                  ? "border-forest-700 bg-forest-50 text-forest-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t("invoiceSent")}
            </button>
            <button
              type="button"
              onClick={() => setManualType("PAIEMENT")}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                manualType === "PAIEMENT"
                  ? "border-forest-700 bg-forest-50 text-forest-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t("paymentReceived")}
            </button>
            <button
              type="button"
              onClick={() => setManualType("DEPENSE")}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                manualType === "DEPENSE"
                  ? "border-forest-700 bg-forest-50 text-forest-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t("expense")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("date")}</label>
              <input
                name="dateTransaction"
                type="date"
                required
                defaultValue={toDateStr(new Date())}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("type")}</label>
              <select
                name="typeTransaction"
                value={manualType}
                onChange={(e) => setManualType(e.target.value as JournalTransactionType)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              >
                {Object.entries(JOURNAL_TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("client")}</label>
              <select
                name="clientId"
                value={manualClientId}
                onChange={(e) => setManualClientId(e.target.value)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              >
                <option value="">{t("noClient")}</option>
                {manualContext?.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("matter")}</label>
              <select
                name="dossierId"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              >
                <option value="">{t("noMatter")}</option>
                {manualDossiers.map((dossier) => (
                  <option key={dossier.id} value={dossier.id}>
                    {dossier.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("reference")}</label>
              <input
                name="reference"
                placeholder={manualType === "FACTURE" ? t("invoiceNumberPlaceholder") : t("referencePlaceholder")}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("category")}</label>
              <input
                name="categorie"
                defaultValue={defaultCategoryFor(manualType)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("description")}</label>
            <input
              name="description"
              required
              defaultValue={defaultDescriptionFor(manualType)}
              className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("moneyIn")}</label>
              <input
                name="montantEntree"
                type="number"
                min="0"
                step="0.01"
                required={defaultDirection === "IN"}
                defaultValue={defaultDirection === "IN" ? "" : "0"}
                placeholder="0,00"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">{t("moneyOut")}</label>
              <input
                name="montantSortie"
                type="number"
                min="0"
                step="0.01"
                required={defaultDirection === "OUT"}
                defaultValue={defaultDirection === "OUT" ? "" : "0"}
                placeholder="0,00"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
          </div>

          {manualError && <p className="text-sm text-red-600">{manualError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" disabled={manualSubmitting} onClick={() => setManualModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={manualSubmitting}>
              {manualSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
              {t("save")}
            </Button>
          </div>
        </form>
      </Modal>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={reduceMotion ? staggerContainerReduced : staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <ComptaKpiCard
          label={t("kpiGlobalBalance")}
          value={soldeGlobal}
          format="currency"
          icon={Scale}
          semantic={soldeGlobal >= 0 ? "credit" : "debit"}
        />
        <ComptaKpiCard
          label={t("kpiRevenueThisMonth")}
          value={kpis.totalRevenus}
          format="currency"
          icon={TrendingUp}
          semantic="credit"
        />
        <ComptaKpiCard
          label={t("kpiExpensesThisMonth")}
          value={kpis.totalDepenses}
          format="currency"
          icon={TrendingDown}
          semantic="debit"
        />
        <ComptaKpiCard
          label={t("kpiTransactionsThisMonth")}
          value={kpis.nbTransactionsCeMois}
          format="integer"
          icon={Activity}
          semantic="neutral"
        />
      </motion.div>

      <Card>
        <CardHeader title={t("filters")} />
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
                {t("from")}
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
                {t("to")}
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
                {t("type")}
              </label>
              <select
                value={typeTransaction}
                onChange={(e) => setTypeTransaction(e.target.value)}
                className="w-48 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 focus:border-forest-700 focus:shadow-focus outline-none"
              >
                <option value="">{t("allTypes")}</option>
                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-[6px]">
                {t("search")}
              </label>
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 h-[38px] px-3 rounded-md border-[0.5px] border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-forest-700 focus:shadow-focus outline-none"
              />
            </div>
            <Button type="submit" variant="primary">
              {t("apply")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={t("entries")}
          action={
            <span className="text-sm font-normal text-neutral-500">
              {t("entryCount", { count: totalCount })}
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
                      {t("date")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("type")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("reference")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("client")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("matter")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("description")}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("moneyIn")}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("moneyOut")}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 uppercase tracking-[0.05em]">
                      {t("balance")}
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
                          <p className="text-[16px] font-medium text-slate-800">{t("emptyTitle")}</p>
                          <p className="text-[14px] text-slate-600 mt-2 max-w-[400px] mx-auto">{t("emptyHint")}</p>
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
                    {t("pageOf", { page, totalPages })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      {t("next")}
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

function defaultDirectionFor(type: JournalTransactionType): "IN" | "OUT" {
  switch (type) {
    case "DEPENSE":
    case "DEBOURS":
    case "RETRAIT_FIDEICOMMIS":
      return "OUT";
    case "FACTURE":
    case "PAIEMENT":
    case "DEPOT_FIDEICOMMIS":
    case "AJUSTEMENT":
    case "CORRECTION":
      return "IN";
  }
}

function defaultCategoryFor(type: JournalTransactionType): string {
  switch (type) {
    case "FACTURE":
      return "Facturation client";
    case "PAIEMENT":
      return "Paiement client";
    case "DEPENSE":
      return "Dépense cabinet";
    case "DEBOURS":
      return "Débours";
    case "DEPOT_FIDEICOMMIS":
    case "RETRAIT_FIDEICOMMIS":
      return "Fidéicommis";
    case "AJUSTEMENT":
      return "Ajustement manuel";
    case "CORRECTION":
      return "Correction";
  }
}

function defaultDescriptionFor(type: JournalTransactionType): string {
  switch (type) {
    case "FACTURE":
      return "Facture envoyée manuellement";
    case "PAIEMENT":
      return "Paiement reçu manuellement";
    case "DEPENSE":
      return "Dépense saisie manuellement";
    case "DEBOURS":
      return "Débours saisi manuellement";
    case "DEPOT_FIDEICOMMIS":
      return "Dépôt fidéicommis saisi manuellement";
    case "RETRAIT_FIDEICOMMIS":
      return "Retrait fidéicommis saisi manuellement";
    case "AJUSTEMENT":
      return "Ajustement manuel";
    case "CORRECTION":
      return "Correction manuelle";
  }
}
