"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useTimeEntries,
  useTempsContext,
} from "@/lib/hooks/useTemps";
import { routes } from "@/lib/routes";
import { canViewAllTimeEntries } from "@/lib/auth/permissions";
import { SaisieRapideBlock } from "@/components/temps/SaisieRapideBlock";
import { TimeMetricsCards } from "@/components/temps/TimeMetricsCards";
import { TimeFiltersBar } from "@/components/temps/TimeFiltersBar";
import { TimeEntriesTable } from "@/components/temps/TimeEntriesTable";
import { WeekGrid } from "@/components/temps/WeekGrid";
import { TimeEntryFormModal } from "@/components/temps/TimeEntryFormModal";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { RegistrePagination, REGISTRE_TAILLE_PAGE } from "@/components/ui/registre";
import type { TimeEntryFilters } from "@/types/temps";
import type { UserRole } from "@prisma/client";

interface TempsPageClientProps {
  cabinetId: string;
  userId: string;
  role: UserRole;
  /** Masque le bouton « Nouvelle entrée » quand imbriqué dans TempsMixteView (le chooser gère l'ajout). */
  hideAddButton?: boolean;
  /** Masque l'en-tête quand la vue est imbriquée sous les onglets mixtes. */
  hideHeader?: boolean;
  /** Ouverture contrôlée du modal d'ajout. Si fourni, prime sur l'état interne. */
  addModalOpen?: boolean;
  onAddModalOpenChange?: (open: boolean) => void;
  onAddSuccess?: () => void;
}

export function TempsPageClient({
  cabinetId,
  userId,
  role,
  hideAddButton = false,
  hideHeader = false,
  addModalOpen: controlledAddOpen,
  onAddModalOpenChange,
  onAddSuccess,
}: TempsPageClientProps) {
  const t = useTranslations("mattersUi");
  const tc = useTranslations("common");
  const [filters, setFilters] = useState<TimeEntryFilters>({});
  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  const [showAllEntries, setShowAllEntries] = useState(true);
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  // Mode contrôlé si `controlledAddOpen` est fourni, sinon état interne.
  const addModalOpen = controlledAddOpen ?? internalAddOpen;
  const setAddModalOpen = (open: boolean) => {
    onAddModalOpenChange?.(open);
    if (controlledAddOpen === undefined) setInternalAddOpen(open);
  };
  const [weekOffset, setWeekOffset] = useState(0);
  const [page, setPage] = useState(1);

  const effectiveFilters: TimeEntryFilters = useMemo(() => {
    const f = { ...filters };
    if (!showAllEntries && !canViewAllTimeEntries(role)) {
      f.userId = userId;
    }
    return f;
  }, [filters, showAllEntries, role, userId]);

  const {
    data: tempsData,
    isLoading,
    isError: isEntriesError,
    isFetching: isEntriesFetching,
    refetch,
  } = useTimeEntries(cabinetId, effectiveFilters);
  const entries = tempsData?.entries ?? [];
  const activeCount = tempsData?.activeCount ?? 0;
  const archivedCount = tempsData?.archivedCount ?? 0;
  const {
    data: context,
    isError: isContextError,
    isFetching: isContextFetching,
    refetch: refetchContext,
  } = useTempsContext(cabinetId);
  const clients = context?.clients ?? [];
  const dossiers = context?.dossiers ?? [];
  const users = context?.users ?? [];

  const canViewAll = canViewAllTimeEntries(role);
  const hasLoadingError = isEntriesError || isContextError;

  const retryLoading = () => {
    void Promise.all([refetch(), refetchContext()]);
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const entriesWithDate = entries.map((e) => ({ ...e, date: typeof e.date === "string" ? e.date : (e.date as Date).toISOString?.() ?? "" }));

  const semaineEntries = entriesWithDate.filter((e) => {
    const d = e.date.slice(0, 10);
    return d >= startOfWeek.toISOString().slice(0, 10) && d <= endOfWeek.toISOString().slice(0, 10);
  });
  const moisEntries = entriesWithDate.filter((e) => {
    const d = e.date.slice(0, 10);
    return d >= startOfMonth.toISOString().slice(0, 10) && d <= endOfMonth.toISOString().slice(0, 10);
  });
  // Non facturé = facturable et pas encore sur une facture émise (billingStatus !== "BILLED")
  const nonFactureEntries = entriesWithDate.filter((e) => e.facturable && e.billingStatus !== "BILLED");
  const nonFactureMontant = nonFactureEntries.reduce((s, e) => s + e.montant, 0);
  const facturableCount = entriesWithDate.filter((e) => e.facturable).length;
  const tauxFacturablePercent = entries.length > 0 ? Math.round((facturableCount / entries.length) * 100) : 0;

  const semaineHeures = semaineEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;
  const moisHeures = moisEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;

  /**
   * Historique paginé par 20, comme le registre clients.
   *
   * L'écran rendait la totalité des entrées d'un coup : sur un cabinet qui
   * travaille, cela fait des centaines de rangées à parcourir au défilement
   * pour atteindre la plus ancienne, sans jamais savoir où l'on en est.
   *
   * La tranche ne concerne QUE le tableau. Les quatre cartes du haut — semaine,
   * mois, non facturé, taux facturable — continuent de compter sur la totalité
   * des entrées : un total qui ne porterait que sur la page affichée serait
   * faux.
   *
   * `pageSure` borne la page au nombre réel de pages : un filtre qui raccourcit
   * la liste alors qu'on est en page 4 afficherait sinon du vide.
   */
  const totalPages = Math.max(1, Math.ceil(entriesWithDate.length / REGISTRE_TAILLE_PAGE));
  const pageSure = Math.min(page, totalPages);
  const debut = (pageSure - 1) * REGISTRE_TAILLE_PAGE;
  const entriesPage = entriesWithDate.slice(debut, debut + REGISTRE_TAILLE_PAGE);

  const activeTab = filters.facture === true ? "facture" : "active";
  const setActiveTab = (tab: string) => {
    setPage(1);
    if (tab === "facture") setFilters((f) => ({ ...f, facture: true }));
    else setFilters((f) => ({ ...f, facture: undefined }));
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          variant="dashboard"
          title={t("timesheetTitle")}
          description={t("timesheetSubtitle")}
          action={
            <>
              <Link href={routes.facturationHonoraires}>
                <Button variant="secondary">{t("feesToBill")}</Button>
              </Link>
              {!hideAddButton && (
                <Button variant="primary" onClick={() => setAddModalOpen(true)}>
                  {t("newEntry")}
                </Button>
              )}
            </>
          }
        />
      )}

      {hasLoadingError ? (
        <QueryErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          retryLabel={t("retry")}
          onRetry={retryLoading}
          retrying={isEntriesFetching || isContextFetching}
        />
      ) : (
        <>
          <SaisieRapideBlock cabinetId={cabinetId} currentUserId={userId} />

          <TimeMetricsCards
            semaineHeures={semaineHeures}
            moisHeures={moisHeures}
            nonFactureMontant={nonFactureMontant}
            tauxFacturablePercent={tauxFacturablePercent}
            loading={isLoading}
          />

          <Card>
            <section aria-labelledby="time-history-title">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 id="time-history-title" className="text-sm font-medium text-si-ink">
                {t("entriesHistory")}
              </h2>
              <span className="text-sm text-si-muted">{t("entriesCount", { count: entries.length })}</span>
            </div>
          <div className="flex border-b border-si-line px-4 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "active"
                  ? "border-si-forest text-si-verified"
                  : "border-transparent text-si-muted hover:text-si-ink"
              }`}
            >
              {t("activeTab", { count: activeCount })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("facture")}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "facture"
                  ? "border-si-forest text-si-verified"
                  : "border-transparent text-si-muted hover:text-si-ink"
              }`}
            >
              {t("archivedTab", { count: archivedCount })}
            </button>
          </div>
          <TimeFiltersBar
            filters={filters}
            onFiltersChange={(f) => {
              setPage(1);
              setFilters(f);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showAllEntries={showAllEntries}
            onShowAllEntriesChange={setShowAllEntries}
            canViewAll={canViewAll}
            dossiers={dossiers}
            users={users}
          />
          {isLoading ? (
            <div className="space-y-3 p-8" aria-busy="true">
              <div className="h-4 w-3/4 rounded-md bg-si-line" />
              <div className="h-4 w-1/2 rounded-md bg-si-line" />
              <div className="h-4 w-2/3 rounded-md bg-si-line" />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={
                hideAddButton ? undefined : (
                  <Button onClick={() => setAddModalOpen(true)}>{t("newEntry")}</Button>
                )
              }
            />
          ) : viewMode === "week" ? (
            <div className="p-4">
              <WeekGrid
                entries={entriesWithDate}
                weekStart={(() => {
                  const d = new Date(now);
                  d.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
                  d.setHours(0, 0, 0, 0);
                  return d;
                })()}
                onPrevWeek={() => setWeekOffset((o) => o - 1)}
                onNextWeek={() => setWeekOffset((o) => o + 1)}
              />
            </div>
          ) : (
            <>
              <TimeEntriesTable
                entries={entriesPage}
                cabinetId={cabinetId}
                currentUserId={userId}
                clients={clients}
                dossiers={dossiers}
                users={users}
                canEditAll={canViewAll}
                onRefresh={() => refetch()}
              />
              <RegistrePagination
                totalCount={entriesWithDate.length}
                currentPage={pageSure}
                resume={t("paginationRange", {
                  start: debut + 1,
                  end: Math.min(debut + REGISTRE_TAILLE_PAGE, entriesWithDate.length),
                  total: entriesWithDate.length,
                })}
                labelPage={t("paginationPage", { current: pageSure, total: totalPages })}
                labelPrecedent={tc("previous")}
                labelSuivant={tc("next")}
                onPageChange={setPage}
              />
            </>
          )}
          </section>
          </Card>

          <TimeEntryFormModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            cabinetId={cabinetId}
            currentUserId={userId}
            clients={clients}
            dossiers={dossiers}
            users={users}
            onSuccess={() => {
              setAddModalOpen(false);
              refetch();
              onAddSuccess?.();
            }}
          />
        </>
      )}
    </div>
  );
}
