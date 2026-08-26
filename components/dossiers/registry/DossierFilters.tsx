"use client";

import { useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { registreChampClass, registreSelectClass } from "@/components/ui/registre";

const PARAMS = {
  status: "status",
  type: "type",
  clientId: "clientId",
  dateFrom: "dateFrom",
  dateTo: "dateTo",
  overdue: "overdue",
  trust: "trust",
} as const;

/** Filtres relégués derrière « Plus de filtres ». */
const PARAMS_AVANCES = [PARAMS.dateFrom, PARAMS.dateTo, PARAMS.overdue, PARAMS.trust] as const;

interface DossierFiltersProps {
  clients: { id: string; raisonSociale: string | null }[];
  /** Autorise le filtre fiducie (rôles avec accès facturation/fiducie). */
  canViewTrust?: boolean;
}

/**
 * Filtres du registre dossiers.
 *
 * Sept contrôles vivaient en permanence dans la barre d'outils : trois listes,
 * deux dates, une bascule et un rafraîchissement. Ils repoussaient la recherche
 * à la ligne et la coupaient en deux, si bien qu'on ne voyait plus à quel objet
 * appartenait quoi.
 *
 * Trois filtres restent visibles — statut, type, client — parce qu'ils servent
 * chaque jour. Les quatre autres passent derrière « Plus de filtres », qui
 * porte une pastille dès qu'ils sont actifs : rien n'est perdu, rien ne filtre
 * en douce.
 */
export function DossierFilters({ clients, canViewTrust = false }: DossierFiltersProps) {
  const t = useTranslations("matters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [avancesOuverts, setAvancesOuverts] = useState(false);
  const zoneAvancesId = useId();

  const STATUS_OPTIONS = [
    { value: "", label: t("allStatuses") },
    { value: "ouvert", label: t("statusOpen") },
    { value: "actif", label: t("statusActive") },
    { value: "en_attente", label: t("statusPending") },
    { value: "cloture", label: t("statusClosed") },
    { value: "archive", label: t("statusArchived") },
  ];

  const TYPE_OPTIONS = [
    { value: "", label: t("allTypes") },
    { value: "droit_famille", label: t("typeFamily") },
    { value: "litige_civil", label: t("typeCivilLitigation") },
    { value: "criminel", label: t("typeCriminal") },
    { value: "immigration", label: t("typeImmigration") },
    { value: "corporate", label: t("typeCorporate") },
    { value: "autre", label: t("typeOther") },
  ];

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.push(`/dossiers?${next.toString()}`);
    });
  }

  function clearAdvanced() {
    const next = new URLSearchParams(searchParams.toString());
    PARAMS_AVANCES.forEach((k) => next.delete(k));
    next.delete("page");
    startTransition(() => {
      router.push(`/dossiers?${next.toString()}`);
    });
  }

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const clientOptions = [
    { value: "", label: t("allClients") },
    ...clients.map((c) => ({ value: c.id, label: c.raisonSociale })),
  ];

  const TRUST_OPTIONS = [
    { value: "", label: t("filterTrustAny") },
    { value: "positive", label: t("filterTrustPositive") },
    { value: "negative", label: t("filterTrustNegative") },
  ];

  const overdueActive = searchParams.get(PARAMS.overdue) === "1";
  const nbAvancesActifs = PARAMS_AVANCES.filter(
    (k) => (canViewTrust || k !== PARAMS.trust) && searchParams.get(k),
  ).length;

  const selectClass = registreSelectClass;
  const dateClass = `px-2.5 ${registreChampClass}`;

  return (
    <div className="flex flex-col items-stretch gap-2 lg:items-end">
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <select
          aria-label={t("filterByStatus")}
          value={searchParams.get(PARAMS.status) ?? ""}
          onChange={(e) => updateFilter(PARAMS.status, e.target.value)}
          className={selectClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label={t("filterByType")}
          value={searchParams.get(PARAMS.type) ?? ""}
          onChange={(e) => updateFilter(PARAMS.type, e.target.value)}
          className={selectClass}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label={t("filterByClient")}
          value={searchParams.get(PARAMS.clientId) ?? ""}
          onChange={(e) => updateFilter(PARAMS.clientId, e.target.value)}
          className={`${selectClass} max-w-[170px]`}
        >
          {clientOptions.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setAvancesOuverts((v) => !v)}
          aria-expanded={avancesOuverts}
          aria-controls={zoneAvancesId}
          className={`safe-zoom-menu inline-flex h-9 items-center gap-2 rounded-md border px-2.5 text-[13px] font-medium ${
            avancesOuverts || nbAvancesActifs > 0
              ? "border-si-ink-strong/40 text-si-ink-strong"
              : "border-si-line bg-si-surface text-si-muted hover:text-si-ink"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t("moreFilters")}</span>
          {nbAvancesActifs > 0 && (
            <span
              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-si-ink-strong px-1 font-mono text-[11px] tabular-nums text-white"
              aria-label={t("moreFiltersActive", { count: nbAvancesActifs })}
            >
              {nbAvancesActifs}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="safe-zoom-menu inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-si-line bg-si-surface text-si-muted hover:text-si-ink-strong disabled:opacity-50"
          aria-label={t("refresh")}
          title={t("refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden />
        </button>
      </div>

      {/* Seconde ligne, et non un panneau flottant : la feuille du registre est
          en `overflow-hidden` pour tenir ses coins arrondis, et rognait tout
          survol positionné en absolu. Déplier une ligne ne masque rien de la
          liste et se referme d'un clic sur le même bouton. */}
      {avancesOuverts && (
        <div
          id={zoneAvancesId}
          className="flex flex-wrap items-center gap-2 border-t border-si-line2 pt-2 lg:justify-end lg:border-t-0 lg:pt-0"
        >
          <label className="flex items-center gap-1.5 text-[12px] text-si-muted">
            <span className="whitespace-nowrap">{t("filterDateFrom")}</span>
            <input
              type="date"
              aria-label={t("filterDateFrom")}
              value={searchParams.get(PARAMS.dateFrom) ?? ""}
              onChange={(e) => updateFilter(PARAMS.dateFrom, e.target.value)}
              className={dateClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-si-muted">
            <span className="whitespace-nowrap">{t("filterDateTo")}</span>
            <input
              type="date"
              aria-label={t("filterDateTo")}
              value={searchParams.get(PARAMS.dateTo) ?? ""}
              onChange={(e) => updateFilter(PARAMS.dateTo, e.target.value)}
              className={dateClass}
            />
          </label>
          {canViewTrust && (
            <select
              aria-label={t("filterByTrust")}
              value={searchParams.get(PARAMS.trust) ?? ""}
              onChange={(e) => updateFilter(PARAMS.trust, e.target.value)}
              className={selectClass}
            >
              {TRUST_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => updateFilter(PARAMS.overdue, overdueActive ? "" : "1")}
            aria-pressed={overdueActive}
            className={`safe-zoom-menu inline-flex h-9 items-center rounded-md border px-2.5 text-[13px] font-medium ${
              overdueActive
                ? "border-si-ink-strong/40 bg-si-ink-strong/10 text-si-ink-strong"
                : "border-si-line bg-si-surface text-si-muted hover:text-si-ink"
            }`}
          >
            {t("filterOverdueTasks")}
          </button>
          {nbAvancesActifs > 0 && (
            <button
              type="button"
              onClick={clearAdvanced}
              className="px-1 text-[12px] text-si-muted underline-offset-2 transition-colors hover:text-si-ink hover:underline"
            >
              {t("clearAdvancedFilters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
