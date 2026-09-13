"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { TimeEntryFilters } from "@/types/temps";
import { RegistreBarreOutils, registreChampClass, registreSelectClass } from "@/components/ui/registre";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Periode = "semaine" | "mois" | "trois_mois" | "tout" | "perso";

interface TimeFiltersBarProps {
  filters: TimeEntryFilters;
  onFiltersChange: (f: TimeEntryFilters) => void;
  viewMode: "list" | "week";
  onViewModeChange: (m: "list" | "week") => void;
  canViewAll: boolean;
  currentUserId: string;
  dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null }>;
  users: Array<{ id: string; nom: string }>;
  /** Nombre d'entrées après filtres, affiché au bout de la barre. */
  count: number;
}

/**
 * Barre du registre des heures.
 *
 * Deux rangées et treize contrôles, dont deux tris faits deux fois : les
 * onglets Actives / Archives doublaient le sélecteur de statut, la bascule
 * Toutes / Mes entrées doublait le sélecteur d'utilisateur. Il reste un
 * sélecteur par question : période, dossier, qui, statut, et une bascule
 * Liste / Semaine. Les pastilles pleines disparaissent : un filtre choisi ne
 * doit pas ressembler à l'action principale. Demande CEO du 2026-09-12.
 */
export function TimeFiltersBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  canViewAll,
  currentUserId,
  dossiers,
  users,
  count,
}: TimeFiltersBarProps) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");

  const bornes = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return {
      semaine: { from: toISODate(startOfWeek), to: toISODate(endOfWeek) },
      mois: { from: toISODate(startOfMonth), to: toISODate(endOfMonth) },
      trois_mois: { from: toISODate(threeMonthsAgo), to: toISODate(now) },
      tout: { from: undefined, to: undefined },
    } as const;
  }, []);

  /* La période affichée se déduit des dates : une plage qui ne correspond à
     aucun raccourci est « personnalisée », et ses deux champs se montrent. */
  const periode: Periode = (() => {
    for (const k of ["semaine", "mois", "trois_mois", "tout"] as const) {
      if (bornes[k].from === filters.dateFrom && bornes[k].to === filters.dateTo) return k;
    }
    return "perso";
  })();

  const changerPeriode = (p: Periode) => {
    if (p === "perso") {
      onFiltersChange({ ...filters, dateFrom: filters.dateFrom ?? bornes.mois.from, dateTo: filters.dateTo ?? bornes.mois.to });
      return;
    }
    onFiltersChange({ ...filters, dateFrom: bornes[p].from, dateTo: bornes[p].to });
  };

  const qui = filters.userId ?? "";
  const statut = filters.facture === undefined ? "" : filters.facture ? "facture" : "non";
  const bascule = (actif: boolean) =>
    `min-h-tap px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified ${
      actif ? "bg-si-ink text-si-surface" : "bg-si-surface text-si-body hover:text-si-ink"
    }`;

  return (
    <RegistreBarreOutils
      recherche={
        <input
          type="search"
          value={filters.q ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, q: e.target.value || undefined })}
          placeholder={t("searchEntries")}
          aria-label={t("searchEntries")}
          className={`${registreChampClass} w-full px-3`}
        />
      }
      filtres={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periode}
            onChange={(e) => changerPeriode(e.target.value as Periode)}
            aria-label={t("period")}
            className={registreSelectClass}
          >
            <option value="semaine">{t("thisWeek")}</option>
            <option value="mois">{t("thisMonth")}</option>
            <option value="trois_mois">{t("lastThreeMonths")}</option>
            <option value="tout">{t("allTime")}</option>
            <option value="perso">{t("periodCustom")}</option>
          </select>
          {periode === "perso" ? (
            <>
              <label className="flex items-center gap-1.5 text-[13px] text-si-muted">
                {t("from")}
                <input
                  type="date"
                  value={filters.dateFrom ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                  className={`${registreChampClass} px-2`}
                />
              </label>
              <label className="flex items-center gap-1.5 text-[13px] text-si-muted">
                {t("to")}
                <input
                  type="date"
                  value={filters.dateTo ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                  className={`${registreChampClass} px-2`}
                />
              </label>
            </>
          ) : null}
          <select
            value={filters.dossierId ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dossierId: e.target.value || undefined })}
            aria-label={t("filterByMatter")}
            className={`${registreSelectClass} max-w-[220px]`}
          >
            <option value="">{t("allMatters")}</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ?? "—"} {d.intitule}
              </option>
            ))}
          </select>
          {canViewAll ? (
            <select
              value={qui}
              onChange={(e) => onFiltersChange({ ...filters, userId: e.target.value || undefined })}
              aria-label={t("whoLabel")}
              className={registreSelectClass}
            >
              <option value="">{t("allEntries")}</option>
              <option value={currentUserId}>{t("myEntries")}</option>
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
            </select>
          ) : null}
          {/* « À facturer » porte l'ambre : c'est le seul choix qui réclame un
              geste. Le mot le dit aussi (WCAG 1.4.1). */}
          <select
            value={statut}
            onChange={(e) => {
              const v = e.target.value;
              onFiltersChange({ ...filters, facture: v === "" ? undefined : v === "facture" });
            }}
            aria-label={t("billingStatus")}
            className={`${registreSelectClass} ${statut === "non" ? "border-si-amber/40 bg-status-warning-bg font-medium text-si-amber-ink" : ""}`}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="non">{t("statusToBill")}</option>
            <option value="facture">{t("statusBilled")}</option>
          </select>
          <div role="group" aria-label={t("viewLabel")} className="inline-flex h-9 overflow-hidden rounded-md border border-si-line">
            <button type="button" aria-pressed={viewMode === "list"} onClick={() => onViewModeChange("list")} className={bascule(viewMode === "list")}>
              {t("viewList")}
            </button>
            <button type="button" aria-pressed={viewMode === "week"} onClick={() => onViewModeChange("week")} className={`${bascule(viewMode === "week")} border-l border-si-line`}>
              {t("viewWeek")}
            </button>
          </div>
          <span className="text-[13px] text-si-muted">{t("entriesPlural", { count })}</span>
          <span className="sr-only">{tc("searchPlaceholder")}</span>
        </div>
      }
    />
  );
}
