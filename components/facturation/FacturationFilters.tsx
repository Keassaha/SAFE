"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { InvoiceStatut } from "@prisma/client";
import { Search } from "lucide-react";

interface StatutOption {
  value: "" | InvoiceStatut;
  label: string;
}

interface FacturationFiltersProps {
  currentStatut: InvoiceStatut | null;
  currentSearch: string;
  statutOptions: StatutOption[];
  dateFrom: string;
  dateTo: string;
}

export function FacturationFilters({
  currentStatut,
  currentSearch,
  statutOptions,
  dateFrom,
  dateTo,
}: FacturationFiltersProps) {
  const t = useTranslations("common");
  const tFacturation = useTranslations("facturation");
  const tStatutPlural = useTranslations("invoiceStatutPlural");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: { statut?: string; q?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      const statut = updates.statut ?? (currentStatut ?? "");
      const q = updates.q ?? currentSearch;
      const from = updates.dateFrom ?? dateFrom;
      const to = updates.dateTo ?? dateTo;
      if (statut) params.set("statut", statut);
      if (q) params.set("q", q);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, currentStatut, currentSearch, dateFrom, dateTo]
  );

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex items-center gap-2 min-w-[200px]">
        <Search className="h-4 w-4 text-[var(--safe-text-secondary)] shrink-0" aria-hidden />
        <input
          type="search"
          placeholder={t("search")}
          defaultValue={currentSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ q: (e.target as HTMLInputElement).value.trim() });
            }
          }}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== currentSearch) updateParams({ q: v });
          }}
          className="flex-1 rounded-safe-sm border border-[var(--safe-neutral-border)] px-3 py-2 text-sm safe-text-title bg-white"
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm font-medium text-[var(--safe-text-secondary)]">{tFacturation("filterByInvoiceType")}</label>
        <select
          value={currentStatut ?? ""}
          onChange={(e) => updateParams({ statut: e.target.value || undefined })}
          className="rounded-safe-sm border border-[var(--safe-neutral-border)] px-3 py-2 text-sm safe-text-title bg-white"
          aria-label={tFacturation("filterByInvoiceType")}
        >
          {statutOptions.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {tStatutPlural(opt.value || "all")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm font-medium text-[var(--safe-text-secondary)]">{t("from")}</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => updateParams({ dateFrom: e.target.value })}
          className="rounded-safe-sm border border-[var(--safe-neutral-border)] px-3 py-2 text-sm safe-text-title bg-white"
        />
        <label className="text-sm font-medium text-[var(--safe-text-secondary)]">{t("to")}</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => updateParams({ dateTo: e.target.value })}
          className="rounded-safe-sm border border-[var(--safe-neutral-border)] px-3 py-2 text-sm safe-text-title bg-white"
        />
      </div>
      {isPending && (
        <span className="text-xs text-[var(--safe-text-secondary)]">{t("loading")}</span>
      )}
    </div>
  );
}
