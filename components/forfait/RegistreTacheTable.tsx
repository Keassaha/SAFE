"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { Receipt, Trash2, Tag } from "lucide-react";

type StatusVariant = "success" | "warning" | "neutral" | "error";

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
  invoiceLine: {
    invoice: {
      sentAt: string | null;
    } | null;
  } | null;
  dossier: {
    intitule: string;
    numeroDossier: string | null;
    client: { typeClient: string; raisonSociale: string | null; prenom: string | null; nom: string | null } | null;
  } | null;
}

interface RegistreTacheTableProps {
  dossierId?: string;
  onFacturer?: (dossierId: string) => void;
}

export function RegistreTacheTable({ dossierId, onFacturer }: RegistreTacheTableProps) {
  const t = useTranslations("temps.taskRegister");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";
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
          <h3 className="text-sm font-semibold">{t("tableTitle")}</h3>
          {unbilledTaches.length > 0 && dossierId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">
                {t("tasksCount", { count: unbilledTaches.length })} — {formatCurrency(totalUnbilled)}
                {totalRabais > 0 && <span className="text-green-600"> ({t("discount", { amount: formatCurrency(totalRabais) })})</span>}
              </span>
              <Button variant="primary" onClick={() => onFacturer?.(dossierId)}>
                <Receipt className="w-3 h-3" /> {t("generateInvoice")}
              </Button>
            </div>
          )}
        </div>

        {taches.length === 0 ? (
          <p className="text-sm text-neutral-400 py-8 text-center">{t("noTasks")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">{t("columnDate")}</th>
                  {!dossierId && <th className="pb-2 font-medium">{t("columnClient")}</th>}
                  <th className="pb-2 font-medium">{t("columnService")}</th>
                  <th className="pb-2 font-medium text-right">{t("columnBase")}</th>
                  <th className="pb-2 font-medium text-right">{t("columnAdjustment")}</th>
                  <th className="pb-2 font-medium text-right">{t("columnDiscount")}</th>
                  <th className="pb-2 font-medium text-right">{t("columnTotal")}</th>
                  <th className="pb-2 font-medium">{t("columnStatus")}</th>
                  <th className="pb-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {taches.map(task => {
                  const isSentToClient = Boolean(task.invoiceLine?.invoice?.sentAt);
                  const statusLabel =
                    isSentToClient ? t("statusInvoiced")
                    : task.statut === "en_cours" ? t("statusInProgress")
                    : t("statusNotInvoiced");
                  const statusVariant: StatusVariant =
                    isSentToClient ? "success"
                    : task.statut === "en_cours" ? "neutral"
                    : "warning";

                  return (
                    <tr key={task.id} className="border-b last:border-0 hover:bg-neutral-50">
                      <td className="py-2 text-neutral-500 whitespace-nowrap">
                        {new Date(task.date).toLocaleDateString(dateLocale)}
                      </td>
                      {!dossierId && (
                        <td className="py-2 text-xs">
                          <span className="font-medium">{formatClientName(task.dossier?.client ?? null) || "—"}</span>
                          {task.dossier?.numeroDossier && (
                            <span className="block text-neutral-400 font-mono">{task.dossier.numeroDossier}</span>
                          )}
                        </td>
                      )}
                      <td className="py-2">
                        <span className="font-medium">{task.description}</span>
                        {task.forfaitService && (
                          <span className="ml-1 text-xs text-neutral-400 font-mono">[{task.forfaitService.code}]</span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(task.montantBase)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {task.ajustement !== 0 ? (
                          <span className={task.ajustement > 0 ? "text-blue-600" : "text-amber-600"}>
                            {task.ajustement > 0 ? "+" : ""}{formatCurrency(task.ajustement)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {task.rabais > 0 ? (
                          <span className="text-green-600 flex items-center justify-end gap-1">
                            <Tag className="w-3 h-3" />
                            -{formatCurrency(task.rabais)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(task.montantFinal)}</td>
                      <td className="py-2">
                        <StatusBadge
                          label={statusLabel}
                          variant={statusVariant}
                        />
                      </td>
                      <td className="py-2">
                        {task.statut !== "facture" && (
                          <button
                            onClick={() => deleteMutation.mutate(task.id)}
                            className="text-neutral-300 hover:text-red-500 transition-colors"
                            title={t("removeTask")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatClientName(client: NonNullable<RegistreTache["dossier"]>["client"]) {
  if (!client) return "";
  if (client.typeClient === "personne_physique") {
    return [client.prenom, client.nom].filter(Boolean).join(" ").trim() || client.raisonSociale || "";
  }
  return client.raisonSociale || [client.prenom, client.nom].filter(Boolean).join(" ").trim();
}
