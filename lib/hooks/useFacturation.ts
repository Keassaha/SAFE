"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FacturationHonorairesQueryInput } from "@/lib/validations/facturation";

export type HonorairesRow = {
  clientId: string;
  clientName: string;
  count: number;
  totalHeures: number;
  totalHonoraires: number;
  totalDebours: number;
  taxesEstimees: number;
  totalAFacturer: number;
  lastDate: string;
  timeEntryIds: string[];
  expenseIds: string[];
};

export type HonorairesDetailEntry = {
  id: string;
  kind?: "time";
  date: string;
  description: string | null;
  dureeMinutes: number;
  tauxHoraire: number;
  montant: number;
  userId: string;
  userNom: string;
  dossierId: string | null;
  dossierIntitule: string | null;
  taxable?: boolean;
};

export type HonorairesDetailExpense = {
  id: string;
  kind: "expense";
  date: string;
  description: string;
  vendorName: string | null;
  amount: number;
  taxable: boolean;
  dossierId: string | null;
};

function buildQueryString(filters: FacturationHonorairesQueryInput): string {
  const params = new URLSearchParams();
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.dossierId) params.set("dossierId", filters.dossierId);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.dateFrom) params.set("dateFrom", String(filters.dateFrom));
  if (filters.dateTo) params.set("dateTo", String(filters.dateTo));
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export function useFacturationHonoraires(
  filters: FacturationHonorairesQueryInput = {}
) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ["facturation", "honoraires", filters],
    queryFn: async (): Promise<{ rows: HonorairesRow[] }> => {
      const res = await fetch(`/api/facturation/honoraires?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur chargement honoraires");
      }
      return res.json();
    },
    enabled: !filters.clientId,
  });
}

export function useFacturationHonorairesDetail(clientId: string | null) {
  return useQuery({
    queryKey: ["facturation", "honoraires", "detail", clientId],
    queryFn: async (): Promise<{
      clientId: string;
      clientName: string | null;
      entries: HonorairesDetailEntry[];
      expenses: HonorairesDetailExpense[];
    }> => {
      const res = await fetch(
        `/api/facturation/honoraires?clientId=${encodeURIComponent(clientId!)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur chargement détail");
      }
      const data = await res.json();
      const norm = (d: string) => (typeof d === "string" ? d : new Date(d).toISOString?.() ?? "");
      return {
        ...data,
        entries: (data.entries ?? []).map((e: { date: string }) => ({ ...e, date: norm(e.date) })),
        expenses: (data.expenses ?? []).map((e: { date: string }) => ({ ...e, date: norm(e.date) })),
      };
    },
    enabled: Boolean(clientId),
  });
}

export function useCreerFactureDepuisTemps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      clientId: string;
      dossierId?: string | null;
      timeEntryIds: string[];
      expenseIds?: string[];
    }) => {
      const res = await fetch("/api/facturation/factures/creer-depuis-temps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur création facture");
      return data as { invoiceId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export function useCreerEtEnvoyerFactureDepuisTemps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      clientId: string;
      dossierId?: string | null;
      timeEntryIds: string[];
      expenseIds?: string[];
    }) => {
      const res = await fetch("/api/facturation/factures/creer-et-envoyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur création et envoi facture");
      return data as { invoiceId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
      queryClient.invalidateQueries({ queryKey: ["facturation", "honoraires"] });
    },
  });
}

export function useFacture(id: string | null) {
  return useQuery({
    queryKey: ["facturation", "facture", id],
    queryFn: async () => {
      const res = await fetch(`/api/facturation/factures/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Facture introuvable");
      }
      return res.json();
    },
    enabled: Boolean(id),
  });
}

export function usePatchFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { items?: Array<{ id?: string; description: string; date: string; hours?: number | null; rate?: number | null; amount: number; type: string; timeEntryId?: string | null; userId?: string | null; professionalDisplayName?: string | null }> }) => {
      const res = await fetch(`/api/facturation/factures/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur mise à jour");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export function useValiderFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/valider`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur validation");
      return data as { success: boolean; invoiceId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export function useEnvoyerFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/envoyer`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur envoi");
      return data as { success: boolean; invoiceId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export function useAnnulerFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cancelReason?: string) => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/annuler`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancelReason }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur annulation");
      return data as { success: boolean };
    },
    onSuccess: () => {
      // Invalider toute la facturation et surtout les honoraires à facturer pour afficher les lignes revenues
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
      queryClient.invalidateQueries({ queryKey: ["facturation", "honoraires"] });
    },
  });
}

type DuplicateItem = {
  id?: string;
  description: string;
  date: string;
  hours?: number | null;
  rate?: number | null;
  amount: number;
  type: string;
  professionalDisplayName?: string | null;
  parentItemId?: string | null;
  parentLineId?: string | null;
};

export function useDuplicateFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { items: DuplicateItem[] }) => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/duplicate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la duplication");
      return data as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export type LienClientFactureResult = {
  url: string;
  expiresAt: string;
  alreadyGenerated?: boolean;
};

export function useLienClientFacture(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<LienClientFactureResult> => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/lien-client`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la génération du lien");
      return data as LienClientFactureResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}

export type EnvoyerFactureEmailResult = {
  success: boolean;
  sentTo: string;
};

export function useEnvoyerFactureEmail(invoiceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<EnvoyerFactureEmailResult> => {
      const res = await fetch(
        `/api/facturation/factures/${invoiceId}/envoyer-email`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi de l'email");
      return data as EnvoyerFactureEmailResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturation"] });
    },
  });
}
