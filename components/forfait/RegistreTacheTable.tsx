"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { Receipt, Trash2, Tag } from "lucide-react";

interface RegistreTache {
  id: string;
  description: string;
  montantBase: number;
  ajustement: number;
  rabais: number;
  rabaisRaison: string | null;
  montantFinal: number;
  taxable: boolean;
  date: string;
  statut: string;
  forfaitService: { code: string; nom: string } | null;
  dossier: { intitule: string; numeroDossier: string | null } | null;
}

interface RegistreTacheTableProps {
  dossierId?: string;
  onFacturer?: (dossierId: string) => void;
}

export function RegistreTacheTable({ dossierId, onFacturer }: RegistreTacheTableProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["registre-taches", dossierId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dossierId) params.set("dossierId", dossierId);
      const res = await fetch(`/api/registre-taches?${params}`);
      if (!res.ok) return { taches: [] };
      return res.json() as Promise<{ taches: RegistreTache[] }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/registre-taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error("Error deleting");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["registre-taches"] }),
  });

  const taches = data?.taches ?? [];
  const unbilledTaches = taches.filter(t => t.statut === "complete");
  const totalUnbilled = unbilledTaches.reduce((s, t) => s + t.montantFinal, 0);
  const totalRabais = unbilledTaches.reduce((s, t) => s + t.rabais, 0);

  if (isLoading) {
    return <Card><CardContent className="p-6"><div className="h-24 bg-neutral-100 animate-pulse rounded" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Task Register</h3>
          {unbilledTaches.length > 0 && dossierId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">
                {unbilledTaches.length} task{unbilledTaches.length > 1 ? "s" : ""} — {formatCurrency(totalUnbilled)}
                {totalRabais > 0 && <span className="text-green-600"> (disc. {formatCurrency(totalRabais)})</span>}
              </span>
              <Button variant="primary" onClick={() => onFacturer?.(dossierId)}>
                <Receipt className="w-3 h-3" /> Generate Invoice
              </Button>
            </div>
          )}
        </div>

        {taches.length === 0 ? (
          <p className="text-sm text-neutral-400 py-8 text-center">No tasks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Date</th>
                  {!dossierId && <th className="pb-2 font-medium">Matter</th>}
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium text-right">Base</th>
                  <th className="pb-2 font-medium text-right">Adj.</th>
                  <th className="pb-2 font-medium text-right">Disc.</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {taches.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="py-2 text-neutral-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("en-CA")}
                    </td>
                    {!dossierId && (
                      <td className="py-2 text-xs">
                        {t.dossier?.numeroDossier && <span className="font-mono">{t.dossier.numeroDossier}</span>}
                        {t.dossier?.intitule && <span className="text-neutral-500 ml-1">{t.dossier.intitule}</span>}
                      </td>
                    )}
                    <td className="py-2">
                      <span className="font-medium">{t.description}</span>
                      {t.forfaitService && (
                        <span className="ml-1 text-xs text-neutral-400 font-mono">[{t.forfaitService.code}]</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(t.montantBase)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {t.ajustement !== 0 ? (
                        <span className={t.ajustement > 0 ? "text-blue-600" : "text-amber-600"}>
                          {t.ajustement > 0 ? "+" : ""}{formatCurrency(t.ajustement)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {t.rabais > 0 ? (
                        <span className="text-green-600 flex items-center justify-end gap-1">
                          <Tag className="w-3 h-3" />
                          -{formatCurrency(t.rabais)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(t.montantFinal)}</td>
                    <td className="py-2">
                      <StatusBadge
                        label={t.statut === "facture" ? "Invoiced" : t.statut === "complete" ? "Ready" : "In progress"}
                        variant={t.statut === "facture" ? "success" : t.statut === "complete" ? "warning" : "neutral"}
                      />
                    </td>
                    <td className="py-2">
                      {t.statut !== "facture" && (
                        <button
                          onClick={() => deleteMutation.mutate(t.id)}
                          className="text-neutral-300 hover:text-red-500 transition-colors"
                          title="Remove task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
