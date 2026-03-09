"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TrustTransactionRow {
  id: string;
  cabinetId: string;
  trustAccountId: string | null;
  clientId: string;
  dossierId: string | null;
  date: string;
  amount: number;
  type: string;
  transactionType: string | null;
  balanceAfter: number | null;
  invoiceId: string | null;
  note: string | null;
  description: string | null;
  reference: string | null;
  modePaiement: string | null;
  correctionOfId: string | null;
  createdById: string | null;
  createdAt: string;
  client: { id: string; raisonSociale: string };
  dossier: { id: string; intitule: string; numeroDossier: string | null } | null;
}

export interface TrustTransactionsFilters {
  clientId?: string;
  dossierId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

function buildTransactionsQueryString(filters: TrustTransactionsFilters): string {
  const params = new URLSearchParams();
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.dossierId) params.set("dossierId", filters.dossierId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.limit != null) params.set("limit", String(filters.limit));
  return params.toString();
}

export function useTrustTransactions(cabinetId: string | null, filters: TrustTransactionsFilters = {}) {
  const qs = buildTransactionsQueryString(filters);
  return useQuery({
    queryKey: ["fideicommis", "transactions", cabinetId, filters],
    queryFn: async (): Promise<{ transactions: TrustTransactionRow[]; total: number }> => {
      const res = await fetch(`/api/fideicommis/transactions?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur chargement des transactions");
      }
      return res.json();
    },
    enabled: Boolean(cabinetId),
  });
}

export function useTrustBalance(
  cabinetId: string | null,
  clientId: string | null,
  dossierId: string | null | undefined
) {
  return useQuery({
    queryKey: ["fideicommis", "solde", cabinetId, clientId, dossierId ?? null],
    queryFn: async (): Promise<{ clientId: string; dossierId: string | null; solde: number }> => {
      const url =
        dossierId != null && dossierId !== ""
          ? `/api/fideicommis/solde/${encodeURIComponent(clientId!)}?dossierId=${encodeURIComponent(dossierId)}`
          : `/api/fideicommis/solde/${encodeURIComponent(clientId!)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur chargement du solde");
      }
      return res.json();
    },
    enabled: Boolean(cabinetId && clientId),
  });
}

export function useGlobalTrustBalance(cabinetId: string | null) {
  return useQuery({
    queryKey: ["fideicommis", "balance", cabinetId],
    queryFn: async (): Promise<{ solde: number }> => {
      const res = await fetch("/api/fideicommis/balance");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur chargement du solde global");
      }
      return res.json();
    },
    enabled: Boolean(cabinetId),
  });
}

export function useCreateTrustDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      clientId: string;
      dossierId: string;
      montant: number;
      dateTransaction: Date | string;
      modePaiement: string;
      reference?: string | null;
      description?: string | null;
    }) => {
      const res = await fetch("/api/fideicommis/depot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          dateTransaction:
            typeof body.dateTransaction === "string"
              ? body.dateTransaction
              : body.dateTransaction.toISOString().slice(0, 10),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erreur enregistrement dépôt");
      return data as { success: boolean; transactionId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fideicommis"] });
    },
  });
}

export function useCreateTrustWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      clientId: string;
      dossierId: string;
      montant: number;
      dateTransaction: Date | string;
      factureId?: string | null;
      modePaiement?: string | null;
      reference?: string | null;
      description?: string | null;
    }) => {
      const res = await fetch("/api/fideicommis/retrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          dateTransaction:
            typeof body.dateTransaction === "string"
              ? body.dateTransaction
              : body.dateTransaction.toISOString().slice(0, 10),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erreur enregistrement retrait");
      return data as { success: boolean; transactionId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fideicommis"] });
    },
  });
}

export function useGenerateTrustStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { mois: number; annee: number; clientId?: string; dossierId?: string }) => {
      const searchParams = new URLSearchParams({
        mois: String(params.mois),
        annee: String(params.annee),
      });
      if (params.clientId) searchParams.set("clientId", params.clientId);
      if (params.dossierId) searchParams.set("dossierId", params.dossierId);
      const res = await fetch(`/api/fideicommis/releve?${searchParams.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur génération relevé");
      }
      return res.json() as Promise<{
        cabinet: { nom: string; adresse: string | null };
        periode: { mois: number; annee: number; debut: string; fin: string };
        transactions: TrustTransactionRow[];
        totalDeposits: number;
        totalWithdrawals: number;
        soldeDebut: number;
        soldeFinal: number;
      }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fideicommis"] });
    },
  });
}
