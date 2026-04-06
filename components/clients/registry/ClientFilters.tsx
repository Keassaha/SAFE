"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

const PARAMS = {
  status: "status",
  type: "type",
} as const;

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("clients");

  const STATUS_OPTIONS = [
    { value: "", label: t("allStatuses") },
    { value: "actif", label: t("statusActive") },
    { value: "inactif", label: t("statusInactive") },
    { value: "archive", label: t("statusArchived") },
  ];

  const TYPE_OPTIONS = [
    { value: "", label: t("allTypes") },
    { value: "personne_physique", label: t("individual") },
    { value: "personne_morale", label: t("company") },
  ];

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.push(`/clients?${next.toString()}`);
    });
  }

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label={t("filterByStatus")}
        value={searchParams.get(PARAMS.status) ?? ""}
        onChange={(e) => updateFilter(PARAMS.status, e.target.value)}
        className="h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-neutral-text-primary text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
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
        className="h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-neutral-text-primary text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="p-2 rounded-safe-sm border border-neutral-border bg-white text-neutral-muted hover:text-primary-700 hover:bg-primary-50/50 transition-colors disabled:opacity-50"
        aria-label={t("refresh")}
      >
        <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
