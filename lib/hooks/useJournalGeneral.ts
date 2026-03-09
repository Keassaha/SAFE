"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface JournalFiltersState {
  dateFrom: string;
  dateTo: string;
  clientId: string;
  dossierId: string;
  typeTransaction: string;
  categorie: string;
  sourceModule: string;
  utilisateurId: string;
  montantMin: string;
  montantMax: string;
  entreesOnly: boolean;
  sortiesOnly: boolean;
  search: string;
  page: number;
}

const DEFAULT_FILTERS: JournalFiltersState = {
  dateFrom: "",
  dateTo: "",
  clientId: "",
  dossierId: "",
  typeTransaction: "",
  categorie: "",
  sourceModule: "",
  utilisateurId: "",
  montantMin: "",
  montantMax: "",
  entreesOnly: false,
  sortiesOnly: false,
  search: "",
  page: 1,
};

function stateToParams(state: JournalFiltersState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.dateFrom) p.set("dateFrom", state.dateFrom);
  if (state.dateTo) p.set("dateTo", state.dateTo);
  if (state.clientId) p.set("clientId", state.clientId);
  if (state.dossierId) p.set("dossierId", state.dossierId);
  if (state.typeTransaction) p.set("typeTransaction", state.typeTransaction);
  if (state.categorie) p.set("categorie", state.categorie);
  if (state.sourceModule) p.set("sourceModule", state.sourceModule);
  if (state.utilisateurId) p.set("utilisateurId", state.utilisateurId);
  if (state.montantMin) p.set("montantMin", state.montantMin);
  if (state.montantMax) p.set("montantMax", state.montantMax);
  if (state.entreesOnly) p.set("entreesOnly", "1");
  if (state.sortiesOnly) p.set("sortiesOnly", "1");
  if (state.search) p.set("q", state.search);
  if (state.page > 1) p.set("page", String(state.page));
  return p;
}

export function paramsToFiltersState(params: URLSearchParams): JournalFiltersState {
  return {
    dateFrom: params.get("dateFrom") ?? "",
    dateTo: params.get("dateTo") ?? "",
    clientId: params.get("clientId") ?? "",
    dossierId: params.get("dossierId") ?? "",
    typeTransaction: params.get("typeTransaction") ?? "",
    categorie: params.get("categorie") ?? "",
    sourceModule: params.get("sourceModule") ?? "",
    utilisateurId: params.get("utilisateurId") ?? "",
    montantMin: params.get("montantMin") ?? "",
    montantMax: params.get("montantMax") ?? "",
    entreesOnly: params.get("entreesOnly") === "1",
    sortiesOnly: params.get("sortiesOnly") === "1",
    search: params.get("q") ?? "",
    page: Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1),
  };
}

/** Hook pour mettre à jour les filtres du journal via l’URL (revalidation serveur). */
export function useJournalFilters(basePath: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const setFilters = useCallback(
    (current: JournalFiltersState, updates: Partial<JournalFiltersState>) => {
      const next: JournalFiltersState = { ...current, ...updates };
      const query = stateToParams(next).toString();
      startTransition(() => {
        router.push(query ? `${basePath}?${query}` : basePath);
      });
    },
    [router, basePath]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => router.push(basePath));
  }, [router, basePath]);

  return { setFilters, resetFilters, isPending };
}
