"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { InvoiceStatut } from "@prisma/client";
import { Search } from "lucide-react";
import { registreChampClass, registreSelectClass } from "@/components/ui/registre";

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

/**
 * Filtres du registre de facturation, en deux morceaux.
 *
 * `RegistreBarreOutils` place la recherche à gauche et les filtres à droite :
 * la recherche reçoit l'espace en premier, et les filtres ne se glissent jamais
 * entre elle et son champ. Le bloc unique d'avant ne pouvait pas s'y couler.
 *
 * Les deux morceaux partagent `useMiseAJourParams`, qui **préserve le tri** et
 * remet la pagination à la première page : filtrer en gardant `?page=7` renvoie
 * sur une page vide.
 */
function useMiseAJourParams({
  currentStatut,
  currentSearch,
  dateFrom,
  dateTo,
}: Omit<FacturationFiltersProps, "statutOptions">) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      // Le tri est un choix de l'utilisateur, pas un effet du filtre : il survit.
      const sortBy = searchParams.get("sortBy");
      const sortOrder = searchParams.get("sortOrder");
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams, currentStatut, currentSearch, dateFrom, dateTo],
  );

  return { updateParams, isPending };
}

/** Champ de recherche, à gauche de la barre d'outils. */
export function FacturationRecherche(props: Omit<FacturationFiltersProps, "statutOptions">) {
  const t = useTranslations("common");
  const { updateParams } = useMiseAJourParams(props);
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-si-muted"
        aria-hidden
      />
      <input
        type="search"
        placeholder={t("search")}
        defaultValue={props.currentSearch}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateParams({ q: (e.target as HTMLInputElement).value.trim() });
          }
        }}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== props.currentSearch) updateParams({ q: v });
        }}
        className={`w-full pl-9 pr-3 ${registreChampClass}`}
      />
    </div>
  );
}

/** Statut et bornes de dates, à droite de la barre d'outils. */
export function FacturationFiltres({ statutOptions, ...props }: FacturationFiltersProps) {
  const t = useTranslations("common");
  const tFacturation = useTranslations("facturation");
  const tStatutPlural = useTranslations("invoiceStatutPlural");
  const { updateParams, isPending } = useMiseAJourParams(props);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={props.currentStatut ?? ""}
        onChange={(e) => updateParams({ statut: e.target.value || undefined })}
        className={registreSelectClass}
        aria-label={tFacturation("filterByInvoiceType")}
      >
        {statutOptions.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {tStatutPlural(opt.value || "all")}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={props.dateFrom}
        onChange={(e) => updateParams({ dateFrom: e.target.value })}
        aria-label={t("from")}
        className={`px-2.5 ${registreChampClass}`}
      />
      <input
        type="date"
        value={props.dateTo}
        onChange={(e) => updateParams({ dateTo: e.target.value })}
        aria-label={t("to")}
        className={`px-2.5 ${registreChampClass}`}
      />
      {isPending && <span className="text-xs text-si-muted">{t("loading")}</span>}
    </div>
  );
}
