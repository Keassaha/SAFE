"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatCalendarDate } from "@/lib/utils/format";
import {
  createManualJournalEntryAction,
  getJournalEntriesAction,
  getJournalKpisAction,
  getManualJournalContextAction,
  exportJournalAction,
  annulerEcritureJournalAction,
} from "./actions";
import type { JournalKpiData, JournalEntryRow, JournalPortee } from "@/types/journal";
import { JOURNAL_TRANSACTION_TYPE_LABELS, JOURNAL_MOTIVE_LABELS } from "@/types/journal";
import type { JournalCorrectionMotive, JournalTransactionType } from "@prisma/client";
import { MotifAnnulationModal } from "@/components/comptabilite/MotifAnnulationModal";
import { Download, Loader2, BookOpen, Scale, TrendingUp, TrendingDown, Landmark, Wallet, FileClock, HandCoins, Plus, Undo2 } from "lucide-react";
import { staggerContainer, staggerContainerReduced, fadeInUp, useSafeMotion } from "@/lib/motion";
import { ComptaKpiCard } from "@/components/comptabilite/ComptaKpiCard";
import { MovementsTable } from "@/components/comptabilite/MovementsTable";
import { RegistrePagination, REGISTRE_TAILLE_PAGE } from "@/components/ui/registre";
import type { ManualJournalContext } from "./actions";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

/**
 * Trois lectures du même registre (doctrine §3) :
 *  - `readable`    : ce qui compte aujourd'hui, en langage avocat. L'annulé n'y est pas.
 *  - `expert`      : les colonnes brutes entrée/sortie. L'annulé n'y est pas non plus.
 *  - `corrections` : le registre des corrections. Rien n'est perdu, tout est motivé.
 */
type JournalViewMode = "readable" | "expert" | "corrections";

const PORTEE_PAR_VUE: Record<JournalViewMode, JournalPortee> = {
  readable: "actives",
  expert: "actives",
  corrections: "corrections",
};

// Le journal se pagine côté serveur, mais à la même taille que les autres
// registres du produit : une seule règle à retenir pour le cabinet.
const PAGE_SIZE = REGISTRE_TAILLE_PAGE;
const TRANSACTION_TYPE_OPTIONS: { value: JournalTransactionType; label: string }[] = (
  Object.entries(JOURNAL_TRANSACTION_TYPE_LABELS) as [JournalTransactionType, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Serialise un instant en `YYYY-MM-DD` pour un `<input type="date">`.
 *
 * Passe par le JOUR CALENDAIRE du cabinet, jamais par `toISOString()` brut.
 * Avec `toISOString()`, tout ce qui suit 20 h a Montreal est deja le lendemain en
 * UTC : le formulaire de nouvelle ecriture proposait la date de DEMAIN chaque
 * soir, et l'ecriture partait postdatee sans que rien ne le signale. Releve a
 * l'ecran le 2026-08-17 a 22 h 57, ou le champ affichait le 18.
 *
 * Voir lib/utils/calendar-date.ts.
 */
function toDateStr(d: Date): string {
  return toIsoDay(toCalendarDayUTC(d));
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export function GeneralJournalPageView({
  initialKpis,
  embedded = false,
  canWrite = true,
}: {
  initialKpis: JournalKpiData;
  /** Intégré dans la page Comptabilité : masque les KPI (déjà affichés en haut de page). */
  embedded?: boolean;
  /** Tenir le journal. En lecture seule, la saisie disparaît ; l'export reste. */
  canWrite?: boolean;
}) {
  const t = useTranslations("accountingUi");
  const tc = useTranslations("common");
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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualContext, setManualContext] = useState<ManualJournalContext | null>(null);
  const [manualType, setManualType] = useState<JournalTransactionType>("AJUSTEMENT");
  const [manualClientId, setManualClientId] = useState("");
  const [viewMode, setViewMode] = useState<JournalViewMode>("readable");
  const [annulationCible, setAnnulationCible] = useState<JournalEntryRow | null>(null);
  const [annulationSubmitting, setAnnulationSubmitting] = useState(false);
  const [annulationError, setAnnulationError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJournalEntriesAction({
        dateFrom: dateFrom ? new Date(dateFrom + "T00:00:00") : undefined,
        dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
        typeTransaction: (typeTransaction || undefined) as JournalTransactionType | undefined,
        search: search.trim() || undefined,
        portee: PORTEE_PAR_VUE[viewMode],
        page,
        pageSize: PAGE_SIZE,
        orderBy: "dateTransaction",
        orderDir: "desc",
      });
      setEntries(result.entries);
      setTotalCount(result.totalCount);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, typeTransaction, search, page, viewMode]);

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

  async function handleAnnuler(
    motifCode: JournalCorrectionMotive,
    motifTexte: string | null,
  ) {
    if (!annulationCible) return;
    setAnnulationSubmitting(true);
    setAnnulationError(null);
    try {
      await annulerEcritureJournalAction({
        entryId: annulationCible.id,
        motifCode,
        motifTexte,
      });
      setAnnulationCible(null);
      // La ligne quitte la vue courante et les totaux : les deux se rechargent.
      await Promise.all([loadEntries(), refreshKpis()]);
    } catch (e) {
      setAnnulationError(e instanceof Error ? e.message : t("cancelEntryError"));
    } finally {
      setAnnulationSubmitting(false);
    }
  }

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

  // Cible de projection des actions quand le journal est embarqué dans la page
  // Comptabilité. Résolue après le montage, sinon le noeud n'existe pas encore.
  const [actionsHost, setActionsHost] = useState<HTMLElement | null>(null);
  const [hostLookupDone, setHostLookupDone] = useState(false);
  useEffect(() => {
    if (!embedded) return;
    setActionsHost(document.getElementById("compta-journal-actions"));
    setHostLookupDone(true);
  }, [embedded]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  // La tranche vient du serveur : le pied la décrit à partir de la page courante.
  const debut = (page - 1) * PAGE_SIZE;
  const pagination = (
    <RegistrePagination
      totalCount={totalCount}
      currentPage={page}
      resume={tc("paginationRange", {
        start: totalCount === 0 ? 0 : debut + 1,
        end: Math.min(debut + PAGE_SIZE, totalCount),
        total: totalCount,
      })}
      labelPage={tc("paginationPage", { current: page, total: totalPages })}
      labelPrecedent={tc("previous")}
      labelSuivant={tc("next")}
      onPageChange={setPage}
    />
  );
  const manualDossiers = manualContext?.dossiers.filter((dossier) => !manualClientId || dossier.clientId === manualClientId) ?? [];
  const defaultDirection = defaultDirectionFor(manualType);
  const invoiceBalanceThisMonth = kpis.totalFacture - kpis.totalEncaisse;

  const actionButtons = (
    <>
      {/* La saisie ne s'affiche qu'à qui peut écrire : le serveur refuse de
          toute façon (`app/(app)/journal/general/actions.ts`), autant ne pas
          proposer un bouton qui finit en message d'erreur. */}
      {canWrite && (
        <Button
          type="button"
          variant="primary"
          onClick={openManualEntry}
        >
          <Plus className="w-4 h-4" aria-hidden />
          <span className="ml-2">{t("newEntry")}</span>
        </Button>
      )}
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
    </>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Embarqué dans la page Comptabilité, le journal projette ses actions sur la
          ligne de titre de la section plutôt que de les laisser flotter au milieu
          de la page. Autonome, il les rend à sa place habituelle. */}
      {embedded && actionsHost
        ? createPortal(actionButtons, actionsHost)
        : embedded && !hostLookupDone
          ? null /* le temps de résoudre la cible, évite un saut visuel */
          : /* cible absente ou vue autonome : on rend en place, jamais rien */
            <div className="flex flex-wrap justify-end gap-2">{actionButtons}</div>}

      <Modal
        open={manualModalOpen}
        onClose={() => {
          if (!manualSubmitting) setManualModalOpen(false);
        }}
        title={t("newEntry")}
        maxWidth="max-w-2xl"
      >
        <form key={manualType} onSubmit={handleManualSubmit} className="space-y-5">
          <p className="text-[13px] leading-relaxed text-si-muted bg-si-canvas border border-si-line rounded-md px-3 py-2.5">
            {t("manualEntryRestrictionHint")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("date")}</label>
              <input
                name="dateTransaction"
                type="date"
                required
                defaultValue={toDateStr(new Date())}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("type")}</label>
              <select
                name="typeTransaction"
                value={manualType}
                onChange={(e) => setManualType(e.target.value as JournalTransactionType)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              >
                {Object.entries(JOURNAL_TRANSACTION_TYPE_LABELS)
                  .filter(([value]) => value === "AJUSTEMENT" || value === "CORRECTION")
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("client")}</label>
              <select
                name="clientId"
                value={manualClientId}
                onChange={(e) => setManualClientId(e.target.value)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
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
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("matter")}</label>
              <select
                name="dossierId"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
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
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("reference")}</label>
              <input
                name="reference"
                placeholder={manualType === "FACTURE" ? t("invoiceNumberPlaceholder") : t("referencePlaceholder")}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink placeholder:text-si-muted focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("category")}</label>
              <input
                name="categorie"
                defaultValue={defaultCategoryFor(manualType)}
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("description")}</label>
            <input
              name="description"
              required
              defaultValue={defaultDescriptionFor(manualType)}
              className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("moneyIn")}</label>
              <input
                name="montantEntree"
                type="number"
                min="0"
                step="0.01"
                required={defaultDirection === "IN"}
                defaultValue={defaultDirection === "IN" ? "" : "0"}
                placeholder="0,00"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">{t("moneyOut")}</label>
              <input
                name="montantSortie"
                type="number"
                min="0"
                step="0.01"
                required={defaultDirection === "OUT"}
                defaultValue={defaultDirection === "OUT" ? "" : "0"}
                placeholder="0,00"
                className="w-full h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
          </div>

          {manualError && <p className="text-sm text-[#B84A3E]">{manualError}</p>}

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

      {!embedded && (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={reduceMotion ? staggerContainerReduced : staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <ComptaKpiCard
          label={t("kpiOperatingBalance")}
          value={kpis.soldeOperationnelEstime}
          format="currency"
          icon={Scale}
          semantic={kpis.soldeOperationnelEstime >= 0 ? "credit" : "debit"}
        />
        <ComptaKpiCard
          label={t("kpiBilledThisMonth")}
          value={kpis.totalFacture}
          format="currency"
          icon={TrendingUp}
          semantic="credit"
        />
        <ComptaKpiCard
          label={t("kpiCollectedThisMonth")}
          value={kpis.totalEncaisse}
          format="currency"
          icon={Wallet}
          semantic="credit"
        />
        <ComptaKpiCard
          label={t("kpiInvoiceBalanceThisMonth")}
          value={invoiceBalanceThisMonth}
          format="currency"
          icon={FileClock}
          semantic={invoiceBalanceThisMonth >= 0 ? "warning" : "debit"}
          subText={t("kpiInvoiceBalanceHint")}
        />
        <ComptaKpiCard
          label={t("kpiExpensesThisMonth")}
          value={kpis.totalDepenses}
          format="currency"
          icon={TrendingDown}
          semantic="debit"
        />
        <ComptaKpiCard
          label={t("kpiAccountsReceivable")}
          value={kpis.comptesARecevoir}
          format="currency"
          icon={FileClock}
          semantic="neutral"
        />
        <ComptaKpiCard
          label={t("kpiDisbursementsToRecover")}
          value={kpis.deboursARecuperer}
          format="currency"
          icon={HandCoins}
          semantic="neutral"
        />
        <ComptaKpiCard
          label={t("kpiTrustBalance")}
          value={kpis.soldeFideicommis}
          format="currency"
          icon={Landmark}
          semantic="neutral"
        />
      </motion.div>
      )}

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
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">
                {t("from")}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-40 h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">
                {t("to")}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-40 h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">
                {t("type")}
              </label>
              <select
                value={typeTransaction}
                onChange={(e) => {
                  setTypeTransaction(e.target.value);
                  setPage(1);
                }}
                className="w-48 h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink focus:border-si-verified focus:shadow-focus outline-none"
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
              <label className="block text-[12px] font-medium text-si-ink mb-[6px]">
                {t("search")}
              </label>
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-56 h-[38px] px-3 rounded-md border-[0.5px] border-si-line bg-si-surface text-si-ink placeholder:text-si-muted focus:border-si-verified focus:shadow-focus outline-none"
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
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-lg border border-si-line bg-si-canvas p-0.5">
                {(["readable", "expert", "corrections"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setViewMode(mode);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                      viewMode === mode
                        ? "bg-si-surface text-si-ink shadow-sm"
                        : "text-si-muted hover:text-si-ink"
                    }`}
                  >
                    {t(
                      mode === "readable"
                        ? "viewReadable"
                        : mode === "expert"
                          ? "viewExpert"
                          : "viewCorrections",
                    )}
                  </button>
                ))}
              </div>
              <span className="text-sm font-normal text-si-muted">
                {t("entryCount", { count: totalCount })}
              </span>
            </div>
          }
        />
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-si-verified" aria-hidden />
            </div>
          ) : viewMode === "corrections" ? (
            <>
              <motion.div
                variants={reduceMotion ? undefined : fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                <CorrectionsTable entries={entries} emptyLabel={t("correctionsEmpty")} />
              </motion.div>
              {pagination}
            </>
          ) : viewMode === "readable" ? (
            <>
              <motion.div
                variants={reduceMotion ? undefined : fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                <MovementsTable
                  entries={entries}
                  onAnnuler={canWrite ? setAnnulationCible : undefined}
                />
              </motion.div>
              {pagination}
            </>
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
                  <tr className="border-b-[0.5px] border-si-line bg-si-canvas">
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("date")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("type")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("reference")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("client")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("matter")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("description")}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("moneyIn")}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]">
                      {t("moneyOut")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-si-canvas mb-4">
                            <BookOpen className="w-8 h-8 text-si-muted" />
                          </div>
                          <p className="text-[16px] font-medium text-si-ink">{t("emptyTitle")}</p>
                          <p className="text-[14px] text-si-muted mt-2 max-w-[400px] mx-auto">{t("emptyHint")}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => {
                      const display = displayJournalAmounts(e);
                      return (
                        <tr key={e.id} className="safe-zoom-rang border-b-[0.5px] border-si-line transition-colors" >
                          <td className="px-4 py-3 text-[14px] text-si-ink whitespace-nowrap">
                            {formatCalendarDate(e.dateTransaction)}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-si-ink whitespace-nowrap">
                            {JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction]}
                          </td>
                          <td className="px-4 py-3 text-[14px] font-mono text-si-ink whitespace-nowrap">
                            {e.reference ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-si-ink max-w-[180px] truncate">
                            {e.clientName ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[14px] font-mono text-si-ink max-w-[180px] truncate">
                            {e.dossierLabel ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-si-ink max-w-[220px] truncate">
                            {e.description}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-si-verified">
                            {display.inAmount > 0 ? formatCurrency(display.inAmount) : "—"}
                          </td>
                          <td className="px-4 py-3 text-[14px] text-right font-mono tabular-nums text-[#B84A3E]">
                            {display.outAmount > 0 ? formatCurrency(display.outAmount) : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </motion.div>
              {pagination}
            </>
          )}
        </CardContent>
      </Card>

      <MotifAnnulationModal
        open={annulationCible !== null}
        onClose={() => {
          setAnnulationCible(null);
          setAnnulationError(null);
        }}
        onConfirm={handleAnnuler}
        title={t("cancelEntryTitle")}
        intro={t("cancelEntryIntro")}
        cible={
          annulationCible
            ? `${formatCalendarDate(annulationCible.dateTransaction)} · ${annulationCible.description} · ${formatCurrency(
                Math.max(annulationCible.montantEntree, annulationCible.montantSortie),
              )}`
            : null
        }
        submitting={annulationSubmitting}
        error={annulationError}
      />
    </div>
  );
}

/**
 * Registre des corrections (doctrine §3).
 *
 * Une ligne par CONTREPASSATION, avec son motif. Aucun total n'en sort : ces
 * écritures ne comptent nulle part, elles prouvent. C'est la page qu'on ouvre le
 * jour de l'inspection, et celle qu'on relit quand un chiffre surprend.
 */
function CorrectionsTable({
  entries,
  emptyLabel,
}: {
  entries: JournalEntryRow[];
  emptyLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-si-canvas">
            <Undo2 className="h-8 w-8 text-si-muted" aria-hidden />
          </div>
          <p className="max-w-[420px] text-[14px] text-si-muted">{emptyLabel}</p>
        </div>
      </div>
    );
  }

  const TH =
    "px-4 py-3 text-left text-[11px] font-medium text-si-muted uppercase tracking-[0.05em]";

  return (
    <table className="min-w-full">
      <thead>
        <tr className="border-b-[0.5px] border-si-line bg-si-canvas">
          <th className={TH}>Date</th>
          <th className={TH}>Écriture annulée</th>
          <th className={TH}>Motif</th>
          <th className={`${TH} text-right`}>Montant neutralisé</th>
          <th className={TH}>Par</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr
            key={e.id}
            className="safe-zoom-rang border-b-[0.5px] border-si-line transition-colors"
          >
            <td className="whitespace-nowrap px-4 py-3 text-[14px] text-si-ink">
              {formatCalendarDate(e.dateTransaction)}
            </td>
            <td
              className="max-w-[320px] truncate px-4 py-3 text-[14px] text-si-ink"
              title={e.description}
            >
              {e.description}
            </td>
            <td className="px-4 py-3 text-[14px] text-si-ink">
              {e.motifCode ? (
                <span className="inline-flex items-center rounded-full border border-si-line bg-si-canvas px-2 py-0.5 text-[12px] text-si-muted">
                  {JOURNAL_MOTIVE_LABELS[e.motifCode]}
                </span>
              ) : (
                "—"
              )}
              {e.motifTexte ? (
                <span className="ml-2 text-[12px] text-si-muted">{e.motifTexte}</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[14px] tabular-nums text-si-muted">
              {formatCurrency(Math.max(e.montantEntree, e.montantSortie))}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] text-si-muted">
              {e.utilisateurName ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function displayJournalAmounts(entry: JournalEntryRow): { inAmount: number; outAmount: number } {
  if (entry.typeTransaction === "PAIEMENT") {
    return {
      inAmount: 0,
      outAmount: Math.max(entry.montantEntree, entry.montantSortie),
    };
  }
  return {
    inAmount: entry.montantEntree,
    outAmount: entry.montantSortie,
  };
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
