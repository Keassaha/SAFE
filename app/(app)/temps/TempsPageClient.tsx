"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
import type { TimeEntryFilters } from "@/types/temps";
import type { UserRole } from "@prisma/client";

interface TempsPageClientProps {
  cabinetId: string;
  userId: string;
  role: UserRole;
}

export function TempsPageClient({ cabinetId, userId, role }: TempsPageClientProps) {
  const [filters, setFilters] = useState<TimeEntryFilters>({});
  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  const [showAllEntries, setShowAllEntries] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const effectiveFilters: TimeEntryFilters = useMemo(() => {
    const f = { ...filters };
    if (!showAllEntries && !canViewAllTimeEntries(role)) {
      f.userId = userId;
    }
    return f;
  }, [filters, showAllEntries, role, userId]);

  const { data: tempsData, isLoading, refetch } = useTimeEntries(cabinetId, effectiveFilters);
  const entries = tempsData?.entries ?? [];
  const activeCount = tempsData?.activeCount ?? 0;
  const archivedCount = tempsData?.archivedCount ?? 0;
  const { data: context } = useTempsContext(cabinetId);
  const clients = context?.clients ?? [];
  const dossiers = context?.dossiers ?? [];
  const users = context?.users ?? [];

  const canViewAll = canViewAllTimeEntries(role);

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

  const activeTab = filters.facture === true ? "facture" : "active";
  const setActiveTab = (tab: string) => {
    if (tab === "facture") setFilters((f) => ({ ...f, facture: true }));
    else setFilters((f) => ({ ...f, facture: undefined }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fiche de temps</h1>
            <p className="mt-1 text-white/80 text-sm">Suivez et gérez votre temps facturable.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={routes.facturationHonoraires}>
              <Button
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                Honoraires à facturer
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="bg-white text-green-800 hover:bg-white/90"
              onClick={() => setAddModalOpen(true)}
            >
              + Nouvelle entrée
            </Button>
          </div>
        </div>
      </header>

      <SaisieRapideBlock cabinetId={cabinetId} currentUserId={userId} />

      <TimeMetricsCards
        semaineHeures={semaineHeures}
        moisHeures={moisHeures}
        nonFactureMontant={nonFactureMontant}
        tauxFacturablePercent={tauxFacturablePercent}
        loading={isLoading}
      />

      <Card>
        <CardHeader
          title="Historique des entrées"
          action={
            <div className="flex items-center gap-2 text-sm safe-text-secondary">
              <span>{entries.length} entrée(s)</span>
            </div>
          }
        />
        <CardContent className="p-0">
          <div className="flex border-b border-[var(--safe-neutral-border)] px-4 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "active"
                  ? "border-green-600 text-green-800"
                  : "border-transparent safe-text-secondary hover:safe-text-title"
              }`}
            >
              Actives ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("facture")}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "facture"
                  ? "border-green-600 text-green-800"
                  : "border-transparent safe-text-secondary hover:safe-text-title"
              }`}
            >
              Archives (facturées) ({archivedCount})
            </button>
          </div>
          <TimeFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showAllEntries={showAllEntries}
            onShowAllEntriesChange={setShowAllEntries}
            canViewAll={canViewAll}
            dossiers={dossiers}
            users={users}
          />
          {isLoading ? (
            <div className="p-8 space-y-3">
              <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Aucune entrée de temps"
              description="Démarrez le chronomètre ou ajoutez une entrée manuellement."
              action={
                <Button onClick={() => setAddModalOpen(true)}>+ Nouvelle entrée</Button>
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
            <TimeEntriesTable
              entries={entriesWithDate}
              cabinetId={cabinetId}
              currentUserId={userId}
              clients={clients}
              dossiers={dossiers}
              users={users}
              canEditAll={canViewAll}
              onRefresh={() => refetch()}
            />
          )}
        </CardContent>
      </Card>

      <TimeEntryFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        cabinetId={cabinetId}
        currentUserId={userId}
        clients={clients}
        dossiers={dossiers}
        users={users}
        onSuccess={() => { setAddModalOpen(false); refetch(); }}
      />
    </div>
  );
}
