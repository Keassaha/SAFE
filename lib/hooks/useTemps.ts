"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TimeEntryFilters } from "@/types/temps";
import type { TimeEntryCreateInput, TimeEntryUpdateInput } from "@/lib/validations/time-entry";

export interface TimeEntryRow {
  id: string;
  dossierId: string | null;
  userId: string;
  date: string;
  dureeMinutes: number;
  description: string | null;
  typeActivite: string | null;
  facturable: boolean;
  statut: string;
  billingStatus: string | null;
  tauxHoraire: number;
  montant: number;
  dossier: { id: string; intitule: string; numeroDossier: string | null; reference: string | null; client: { raisonSociale: string } } | null;
  user: { id: string; nom: string };
  invoiceLines: { id: string }[];
}

export interface TimeEntriesResponse {
  entries: TimeEntryRow[];
  activeCount: number;
  archivedCount: number;
}

async function fetchTimeEntries(
  cabinetId: string,
  filters: TimeEntryFilters
): Promise<TimeEntriesResponse> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.dossierId) params.set("dossierId", filters.dossierId);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.facturable !== undefined) params.set("facturable", String(filters.facturable));
  if (filters.facture !== undefined) params.set("facture", String(filters.facture));
  if (filters.statut) params.set("statut", filters.statut);
  if (filters.q) params.set("q", filters.q);
  const res = await fetch(`/api/temps?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Erreur chargement des entrées");
  }
  return res.json() as Promise<TimeEntriesResponse>;
}

export function useTimeEntries(cabinetId: string | null, filters: TimeEntryFilters = {}) {
  return useQuery({
    queryKey: ["temps", cabinetId, filters],
    queryFn: () => fetchTimeEntries(cabinetId!, filters),
    enabled: !!cabinetId,
  });
}

export function useCreateTimeEntry(cabinetId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TimeEntryCreateInput) => {
      const res = await fetch("/api/temps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur création");
      }
      return res.json();
    },
    onSuccess: async (_, variables) => {
      qc.invalidateQueries({ queryKey: ["temps"] });
      await qc.refetchQueries({ queryKey: ["temps"], type: "active" });
      if (cabinetId) {
        qc.invalidateQueries({ queryKey: ["dashboardKpis", cabinetId] });
      }
      if (variables.dossierId) {
        qc.invalidateQueries({ queryKey: ["dossier", variables.dossierId] });
      }
    },
  });
}

export function useUpdateTimeEntry(cabinetId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TimeEntryUpdateInput) => {
      const res = await fetch(`/api/temps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (cabinetId) qc.invalidateQueries({ queryKey: ["temps", cabinetId] });
      qc.invalidateQueries({ queryKey: ["dashboardKpis", cabinetId] });
      if (data?.dossierId) qc.invalidateQueries({ queryKey: ["dossier", data.dossierId] });
    },
  });
}

export function useDeleteTimeEntry(cabinetId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/temps/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur suppression");
      }
    },
    onSuccess: (_, id) => {
      if (cabinetId) qc.invalidateQueries({ queryKey: ["temps", cabinetId] });
      qc.invalidateQueries({ queryKey: ["dashboardKpis", cabinetId] });
    },
  });
}

export function useTempsContext(cabinetId: string | null) {
  return useQuery({
    queryKey: ["temps", "context", cabinetId],
    queryFn: async () => {
      const res = await fetch("/api/temps/context");
      if (!res.ok) throw new Error("Erreur chargement contexte");
      return res.json() as Promise<{
        clients: Array<{ id: string; raisonSociale: string }>;
        dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null; reference: string | null; clientId: string; client: { raisonSociale: string } }>;
        users: Array<{ id: string; nom: string }>;
        roundingMinutes: number;
      }>;
    },
    enabled: !!cabinetId,
  });
}

export function useUnbilledTimeSummary(cabinetId: string | null, dateRange: { from: string; to: string } | null) {
  const filters: TimeEntryFilters = dateRange
    ? { dateFrom: dateRange.from, dateTo: dateRange.to, facturable: true, facture: false }
    : {};
  const query = useTimeEntries(cabinetId, filters);
  const entries = query.data?.entries ?? [];
  const totalMinutes = entries.reduce((s, e) => s + e.dureeMinutes, 0);
  const totalMontant = entries.reduce((s, e) => s + e.montant, 0);
  return {
    ...query,
    totalMinutes,
    totalMontant,
    count: entries.length,
  };
}
