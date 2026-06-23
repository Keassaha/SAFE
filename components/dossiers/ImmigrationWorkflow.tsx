"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertTriangle, CheckCircle, Clock, Globe } from "lucide-react";

const IRCC_STEPS = [
  { value: "consultation", label: "Consultation", icon: "1" },
  { value: "preparation", label: "Preparation", icon: "2" },
  { value: "soumission", label: "Submitted", icon: "3" },
  { value: "biometrie", label: "Biometrics", icon: "4" },
  { value: "suivi", label: "Follow-up", icon: "5" },
  { value: "decision", label: "Decision", icon: "6" },
  { value: "cloture", label: "Landing", icon: "7" },
];

interface ImmigrationWorkflowProps {
  dossierId: string;
}

interface ImmigrationSummary {
  workflow: {
    irccStatut: string | null;
    irccNumDossier: string | null;
    itaDate: string | null;
    submissionDeadline: string | null;
    cnpCode: string | null;
    cnpValidated: boolean;
    sousType: string | null;
  } | null;
  itaDeadline: { daysLeft: number; isUrgent: boolean; isCritical: boolean } | null;
  expiredDocs: number;
  expiringSoonDocs: number;
  hasBackgroundRisks: boolean | null;
  misrepresentationRisk: boolean;
}

export function ImmigrationWorkflow({ dossierId }: ImmigrationWorkflowProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["immigration", dossierId],
    queryFn: async () => {
      const res = await fetch(`/api/dossiers/immigration?dossierId=${dossierId}`);
      if (!res.ok) throw new Error("Error loading immigration data");
      return res.json() as Promise<ImmigrationSummary>;
    },
  });

  const updateStatut = useMutation({
    mutationFn: async (irccStatut: string) => {
      const res = await fetch("/api/dossiers/immigration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_statut", dossierId, irccStatut }),
      });
      if (!res.ok) throw new Error("Error updating status");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["immigration", dossierId] }),
  });

  const setIta = useMutation({
    mutationFn: async (itaDate: string) => {
      const res = await fetch("/api/dossiers/immigration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_ita_date", dossierId, itaDate }),
      });
      if (!res.ok) throw new Error("Error setting ITA date");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["immigration", dossierId] }),
  });

  if (isLoading || !data?.workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-si-canvas animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentStep = IRCC_STEPS.findIndex((s) => s.value === data.workflow?.irccStatut);

  return (
    <div className="space-y-4">
      {/* ITA Deadline Alert */}
      {data.itaDeadline && (
        <Card className={`border ${data.itaDeadline.isCritical ? "border-[#B84A3E]/40 bg-[#B84A3E]/10" : data.itaDeadline.isUrgent ? "border-si-amber/30 bg-si-amber/[0.13]" : "border-si-line bg-si-canvas/30"}`}>
          <CardContent className="p-3 flex items-center gap-3">
            {data.itaDeadline.isCritical ? (
              <AlertTriangle className="w-4 h-4 text-[#B84A3E] shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-si-amber-ink shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${data.itaDeadline.isCritical ? "text-[#B84A3E]" : "text-si-amber-ink"}`}>
                ITA Deadline: {data.itaDeadline.daysLeft} days remaining
                {data.itaDeadline.daysLeft <= 0 && " — EXPIRED! Profile will be deleted."}
              </p>
              <p className="text-xs text-si-muted">
                Submit by {data.workflow.submissionDeadline
                  ? new Date(data.workflow.submissionDeadline).toLocaleDateString("en-CA")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Misrepresentation warning */}
      {data.misrepresentationRisk && (
        <Card className="border-[#B84A3E]/40 bg-[#B84A3E]/10">
          <CardContent className="p-3 flex items-center gap-2 text-[#B84A3E]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">
              Art. 40 LIPR — Prior misrepresentation declared. 5-year ban risk. Review carefully.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document expiry warnings */}
      {(data.expiredDocs > 0 || data.expiringSoonDocs > 0) && (
        <Card className={`border ${data.expiredDocs > 0 ? "border-[#B84A3E]/30 bg-[#B84A3E]/10" : "border-si-amber/30 bg-si-amber/[0.13]"}`}>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${data.expiredDocs > 0 ? "text-[#B84A3E]" : "text-si-amber-ink"}`} />
            <p className="text-sm">
              {data.expiredDocs > 0 && <span className="text-[#B84A3E] font-medium">{data.expiredDocs} expired document(s). </span>}
              {data.expiringSoonDocs > 0 && <span className="text-si-amber-ink">{data.expiringSoonDocs} expiring within 30 days.</span>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* IRCC Workflow Stepper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-si-ink" />
            <h4 className="text-sm font-semibold">IRCC Workflow</h4>
            {data.workflow.irccNumDossier && (
              <span className="text-xs text-si-muted ml-auto">
                IRCC# {data.workflow.irccNumDossier}
              </span>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto">
            {IRCC_STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <button
                  key={step.value}
                  onClick={() => updateStatut.mutate(step.value)}
                  disabled={updateStatut.isPending}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                    ${isCompleted ? "bg-si-verified/10 text-si-verified border border-si-verified/40" :
                      isCurrent ? "bg-si-canvas text-si-ink border-2 border-si-forest/40 shadow-sm" :
                      "bg-si-canvas text-si-muted/50 border border-si-line hover:bg-si-canvas"}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${isCurrent ? "bg-si-canvas0 text-white" : "bg-si-canvas text-si-muted"}`}>
                      {step.icon}
                    </span>
                  )}
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* ITA Date input (Express Entry) */}
          {data.workflow.sousType === "ee" && !data.workflow.itaDate && (
            <div className="flex items-end gap-3 pt-3 border-t">
              <Input
                label="ITA Received Date"
                type="date"
                id="ita-date"
                className="w-44"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const input = document.getElementById("ita-date") as HTMLInputElement;
                  if (input?.value) setIta.mutate(input.value);
                }}
                disabled={setIta.isPending}
              >
                Set ITA
              </Button>
              <span className="text-xs text-si-muted mb-2">60-day deadline starts on ITA date</span>
            </div>
          )}

          {/* CNP Code */}
          <div className="flex items-center gap-3 pt-3 border-t mt-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-si-muted mb-1">
                NOC/CNP Code
              </label>
              <span className="text-sm font-medium">
                {data.workflow.cnpCode || "Not set"}
              </span>
            </div>
            {data.workflow.cnpCode && (
              <StatusBadge
                label={data.workflow.cnpValidated ? "Validated" : "Not validated"}
                variant={data.workflow.cnpValidated ? "success" : "warning"}
              />
            )}
            {!data.workflow.cnpValidated && (
              <p className="text-xs text-si-amber-ink">
                CNP must match primary duties, not job title
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
