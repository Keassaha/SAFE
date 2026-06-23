"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { Layers, CheckCircle, Receipt } from "lucide-react";

interface BillingStage {
  id: string;
  nom: string;
  ordre: number;
  montant: number;
  pourcentage: number | null;
  statut: string;
  invoiceId: string | null;
  invoicedAt: string | null;
  invoice: { id: string; numero: string; statut: string; montantTotal: number } | null;
}

interface BillingStageConfigProps {
  dossierId: string;
}

const DEFAULT_STAGES = [
  { nom: "File Preparation", pourcentage: 50 },
  { nom: "Application Submission", pourcentage: 25 },
  { nom: "Follow-up & Decision", pourcentage: 25 },
];

export function BillingStageConfig({ dossierId }: BillingStageConfigProps) {
  const queryClient = useQueryClient();
  const [totalForfait, setTotalForfait] = useState("");
  const [customStages, setCustomStages] = useState(DEFAULT_STAGES);

  const { data: stages } = useQuery({
    queryKey: ["billing-stages", dossierId],
    queryFn: async () => {
      const res = await fetch(`/api/facturation/billing-stages?dossierId=${dossierId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.stages ?? []) as BillingStage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/facturation/billing-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          dossierId,
          totalForfait: parseFloat(totalForfait),
          stages: customStages,
        }),
      });
      if (!res.ok) throw new Error("Error creating stages");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-stages", dossierId] }),
  });

  const markReadyMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const res = await fetch("/api/facturation/billing-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_ready", dossierId, stageId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-stages", dossierId] }),
  });

  const hasStages = stages && stages.length > 0;
  const totalConfigured = stages?.reduce((sum, s) => sum + s.montant, 0) ?? 0;
  const totalInvoiced = stages?.filter((s) => s.statut === "invoiced").reduce((sum, s) => sum + s.montant, 0) ?? 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-si-ink" />
          <h4 className="text-sm font-semibold">Stage-Based Billing (B4)</h4>
        </div>

        {!hasStages ? (
          /* Setup form */
          <div className="space-y-3">
            <p className="text-xs text-si-muted">
              Split the flat fee into stages. Default: 50% preparation / 25% submission / 25% follow-up.
            </p>
            <Input
              label="Total Flat Fee ($)"
              type="number"
              step="0.01"
              value={totalForfait}
              onChange={(e) => setTotalForfait(e.target.value)}
              placeholder="e.g. 2000.00"
            />
            <div className="space-y-2">
              {customStages.map((stage, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-si-canvas text-si-ink flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <input
                    className="flex-1 h-8 px-2 rounded border border-si-line bg-si-surface text-sm"
                    value={stage.nom}
                    onChange={(e) => {
                      const updated = [...customStages];
                      updated[i] = { ...stage, nom: e.target.value };
                      setCustomStages(updated);
                    }}
                  />
                  <input
                    className="w-16 h-8 px-2 rounded border border-si-line bg-si-surface text-sm text-right"
                    type="number"
                    value={stage.pourcentage}
                    onChange={(e) => {
                      const updated = [...customStages];
                      updated[i] = { ...stage, pourcentage: parseInt(e.target.value) || 0 };
                      setCustomStages(updated);
                    }}
                  />
                  <span className="text-si-muted/50 text-xs">%</span>
                  {totalForfait && (
                    <span className="text-xs text-si-muted tabular-nums w-20 text-right">
                      {formatCurrency(parseFloat(totalForfait) * stage.pourcentage / 100)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!totalForfait || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Configure Stages"}
            </Button>
          </div>
        ) : (
          /* Stage progress view */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-si-muted">
              <span>Total: {formatCurrency(totalConfigured)}</span>
              <span>Invoiced: {formatCurrency(totalInvoiced)}</span>
            </div>

            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  stage.statut === "invoiced" ? "border-si-verified/30 bg-si-verified/10" :
                  stage.statut === "ready" ? "border-si-verified/30 bg-si-verified/10" :
                  "border-si-line"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  stage.statut === "invoiced" ? "bg-si-verified/10 text-si-verified" :
                  stage.statut === "ready" ? "bg-si-verified/10 text-si-verified" :
                  "bg-si-canvas text-si-muted"
                }`}>
                  {stage.statut === "invoiced" ? <CheckCircle className="w-3 h-3" /> : stage.ordre}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stage.nom}</p>
                  <p className="text-xs text-si-muted">
                    {formatCurrency(stage.montant)}
                    {stage.pourcentage && ` (${stage.pourcentage}%)`}
                  </p>
                </div>
                <StatusBadge
                  label={stage.statut}
                  variant={
                    stage.statut === "invoiced" ? "success" :
                    stage.statut === "ready" ? "warning" : "neutral"
                  }
                />
                {stage.statut === "pending" && (
                  <Button
                    variant="secondary"
                    onClick={() => markReadyMutation.mutate(stage.id)}
                    disabled={markReadyMutation.isPending}
                  >
                    Mark Ready
                  </Button>
                )}
                {stage.statut === "ready" && (
                  <Button variant="primary" onClick={() => {
                    window.location.href = `/facturation/factures?stageId=${stage.id}&dossierId=${dossierId}`;
                  }}>
                    <Receipt className="w-3 h-3" />
                    Invoice
                  </Button>
                )}
                {stage.invoice && (
                  <span className="text-xs text-si-verified">
                    #{stage.invoice.numero}
                  </span>
                )}
              </div>
            ))}

            {markReadyMutation.isError && (
              <p className="text-sm text-[#B84A3E]">
                {markReadyMutation.error instanceof Error ? markReadyMutation.error.message : "Error"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
