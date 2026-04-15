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
          <div className="h-32 bg-neutral-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentStep = IRCC_STEPS.findIndex((s) => s.value === data.workflow?.irccStatut);

  return (
    <div className="space-y-4">
      {/* ITA Deadline Alert */}
      {data.itaDeadline && (
        <Card className={`border ${data.itaDeadline.isCritical ? "border-red-300 bg-red-50/30" : data.itaDeadline.isUrgent ? "border-amber-200 bg-amber-50/30" : "border-blue-200 bg-blue-50/30"}`}>
          <CardContent className="p-3 flex items-center gap-3">
            {data.itaDeadline.isCritical ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${data.itaDeadline.isCritical ? "text-red-800" : "text-amber-800"}`}>
                ITA Deadline: {data.itaDeadline.daysLeft} days remaining
                {data.itaDeadline.daysLeft <= 0 && " — EXPIRED! Profile will be deleted."}
              </p>
              <p className="text-xs text-neutral-500">
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
        <Card className="border-red-300 bg-red-50/30">
          <CardContent className="p-3 flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">
              Art. 40 LIPR — Prior misrepresentation declared. 5-year ban risk. Review carefully.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document expiry warnings */}
      {(data.expiredDocs > 0 || data.expiringSoonDocs > 0) && (
        <Card className={`border ${data.expiredDocs > 0 ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${data.expiredDocs > 0 ? "text-red-600" : "text-amber-600"}`} />
            <p className="text-sm">
              {data.expiredDocs > 0 && <span className="text-red-700 font-medium">{data.expiredDocs} expired document(s). </span>}
              {data.expiringSoonDocs > 0 && <span className="text-amber-700">{data.expiringSoonDocs} expiring within 30 days.</span>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* IRCC Workflow Stepper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold">IRCC Workflow</h4>
            {data.workflow.irccNumDossier && (
              <span className="text-xs text-neutral-500 ml-auto">
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
                    ${isCompleted ? "bg-green-100 text-green-700 border border-green-300" :
                      isCurrent ? "bg-blue-100 text-blue-700 border-2 border-blue-400 shadow-sm" :
                      "bg-neutral-50 text-neutral-400 border border-neutral-200 hover:bg-neutral-100"}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${isCurrent ? "bg-blue-500 text-white" : "bg-neutral-200 text-neutral-500"}`}>
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
              <span className="text-xs text-neutral-500 mb-2">60-day deadline starts on ITA date</span>
            </div>
          )}

          {/* CNP Code */}
          <div className="flex items-center gap-3 pt-3 border-t mt-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-500 mb-1">
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
              <p className="text-xs text-amber-600">
                CNP must match primary duties, not job title
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
