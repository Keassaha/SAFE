"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

const PARAMS = {
  status: "status",
  type: "type",
  clientId: "clientId",
} as const;

interface DossierFiltersProps {
  clients: { id: string; raisonSociale: string }[];
}

export function DossierFilters({ clients }: DossierFiltersProps) {
  const t = useTranslations("matters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const clientOptions = [
    { value: "", label: t("allClients") },
    ...clients.map((c) => ({ value: c.id, label: c.raisonSociale })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label={t("filterByStatus")}
        value={searchParams.get(PARAMS.status) ?? ""}
        onChange={(e) => updateFilter(PARAMS.status, e.target.value)}
        className="h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
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
        className="h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
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
        className="h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none min-w-[180px]"
      >
        {clientOptions.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-neutral-50 text-sm font-medium transition-colors disabled:opacity-50"
        aria-label={t("refresh")}
      >
        <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
        {t("refresh")}
      </button>
    </div>
  );
}
