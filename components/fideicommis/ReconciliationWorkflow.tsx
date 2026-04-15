"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { CheckCircle, AlertTriangle, Shield } from "lucide-react";

interface Reconciliation {
  id: string;
  periode: string;
  soldeBancaire: number;
  chequesEnCirculation: number;
  depotsEnTransit: number;
  soldeRapproche: number;
  soldeRegistre: number;
  soldeParDossier: number;
  ecart: number;
  interetsLFO: number;
  interetsPayesAt: string | null;
  status: string;
  certifiedAt: string | null;
  certifiedBy: { id: string; nom: string } | null;
  notes: string | null;
}

interface ReconciliationStatus {
  expectedPeriode: string;
  daysSinceMonthEnd: number;
  overdue: boolean;
  critical: boolean;
  lastCertifiedPeriode: string | null;
}

interface ReconciliationResponse {
  reconciliations: Reconciliation[];
  status: ReconciliationStatus;
}

export function ReconciliationWorkflow() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reconciliation", "list"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/reconciliation");
      if (!res.ok) throw new Error("Error loading reconciliations");
      return res.json() as Promise<ReconciliationResponse>;
    },
  });

  const [formData, setFormData] = useState({
    periode: "",
    soldeBancaire: "",
    chequesEnCirculation: "",
    depotsEnTransit: "",
    interetsLFO: "",
    notes: "",
  });

  // Set default period to expected period
  useState(() => {
    if (data?.status.expectedPeriode && !formData.periode) {
      setFormData((prev) => ({ ...prev, periode: data.status.expectedPeriode }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/fideicommis/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error creating reconciliation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });

  const certifyMutation = useMutation({
    mutationFn: async (reconciliationId: string) => {
      const res = await fetch("/api/fideicommis/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "certify", reconciliationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error certifying reconciliation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      periode: formData.periode || data?.status.expectedPeriode,
      soldeBancaire: parseFloat(formData.soldeBancaire) || 0,
      chequesEnCirculation: parseFloat(formData.chequesEnCirculation) || 0,
      depotsEnTransit: parseFloat(formData.depotsEnTransit) || 0,
      interetsLFO: parseFloat(formData.interetsLFO) || 0,
      notes: formData.notes || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-neutral-100 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentPeriode = data?.status.expectedPeriode || "";
  const existingForPeriod = data?.reconciliations.find((r) => r.periode === currentPeriode);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {data?.status && (
        <Card className={
          data.status.critical ? "border-red-300 bg-red-50/50" :
          data.status.overdue ? "border-amber-200 bg-amber-50/50" :
          "border-green-200 bg-green-50/50"
        }>
          <CardContent className="p-4 flex items-center gap-3">
            {data.status.critical ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : data.status.overdue ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Shield className="w-5 h-5 text-green-600 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">
                {data.status.critical
                  ? `OVERDUE: ${data.status.daysSinceMonthEnd} days since month-end (By-Law 9 limit: 25 days)`
                  : data.status.overdue
                  ? `Due soon: ${25 - data.status.daysSinceMonthEnd} days remaining`
                  : data.status.lastCertifiedPeriode === data.status.expectedPeriode
                  ? `Period ${data.status.expectedPeriode} certified`
                  : `Period ${data.status.expectedPeriode} pending reconciliation`
                }
              </p>
              {data.status.lastCertifiedPeriode && (
                <p className="text-xs opacity-75">
                  Last certified: {data.status.lastCertifiedPeriode}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            3-Way Trust Reconciliation — {currentPeriode || "New Period"}
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Enter your bank statement balance and outstanding items. SAFE calculates the
            register balance automatically from recorded transactions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Period (YYYY-MM)"
                value={formData.periode || currentPeriode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                placeholder="2026-04"
              />
              <Input
                label="Bank Statement Balance ($)"
                type="number"
                step="0.01"
                value={formData.soldeBancaire}
                onChange={(e) => setFormData({ ...formData, soldeBancaire: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Outstanding Cheques ($)"
                type="number"
                step="0.01"
                value={formData.chequesEnCirculation}
                onChange={(e) => setFormData({ ...formData, chequesEnCirculation: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Deposits in Transit ($)"
                type="number"
                step="0.01"
                value={formData.depotsEnTransit}
                onChange={(e) => setFormData({ ...formData, depotsEnTransit: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="LFO Interest Payable ($)"
                type="number"
                step="0.01"
                value={formData.interetsLFO}
                onChange={(e) => setFormData({ ...formData, interetsLFO: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                Notes
              </label>
              <textarea
                className="w-full h-20 px-3 py-2 rounded-safe border border-neutral-border bg-white/90 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes for this reconciliation..."
              />
            </div>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Calculating..." : "Calculate Reconciliation"}
            </Button>
            {createMutation.isError && (
              <p className="text-sm text-status-error">
                {createMutation.error instanceof Error ? createMutation.error.message : "Error"}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results — show if existing reconciliation for period */}
      {existingForPeriod && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Reconciliation Result — {existingForPeriod.periode}
              </h3>
              <StatusBadge
                label={existingForPeriod.status}
                variant={
                  existingForPeriod.status === "certified" ? "success" :
                  existingForPeriod.ecart === 0 ? "warning" : "error"
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-safe bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Bank (Reconciled)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(existingForPeriod.soldeRapproche)}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Bank: {formatCurrency(existingForPeriod.soldeBancaire)}
                  {existingForPeriod.chequesEnCirculation > 0 && ` − Cheques: ${formatCurrency(existingForPeriod.chequesEnCirculation)}`}
                  {existingForPeriod.depotsEnTransit > 0 && ` + Transit: ${formatCurrency(existingForPeriod.depotsEnTransit)}`}
                </p>
              </div>
              <div className="p-4 rounded-safe bg-green-50 border border-green-200">
                <p className="text-xs text-green-600 font-medium mb-1">SAFE Register</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(existingForPeriod.soldeRegistre)}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Sum of all recorded transactions
                </p>
              </div>
              <div className={`p-4 rounded-safe border ${
                existingForPeriod.ecart === 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-300"
              }`}>
                <p className={`text-xs font-medium mb-1 ${
                  existingForPeriod.ecart === 0 ? "text-green-600" : "text-red-600"
                }`}>
                  Discrepancy
                </p>
                <p className={`text-lg font-semibold tabular-nums ${
                  existingForPeriod.ecart === 0 ? "text-green-700" : "text-red-700"
                }`}>
                  {formatCurrency(existingForPeriod.ecart)}
                </p>
                <p className={`text-xs mt-1 ${
                  existingForPeriod.ecart === 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {existingForPeriod.ecart === 0 ? "Balanced — ready to certify" : "Must be $0.00 to certify"}
                </p>
              </div>
            </div>

            {existingForPeriod.interetsLFO > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                LFO Interest: {formatCurrency(existingForPeriod.interetsLFO)}
                {existingForPeriod.interetsPayesAt ? " (paid)" : " (pending)"}
              </p>
            )}

            {/* Certify button */}
            {existingForPeriod.status !== "certified" && existingForPeriod.ecart === 0 && (
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={() => certifyMutation.mutate(existingForPeriod.id)}
                  disabled={certifyMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  {certifyMutation.isPending ? "Certifying..." : "Certify Reconciliation"}
                </Button>
                <p className="text-xs text-neutral-500">
                  I certify that this 3-way reconciliation is accurate per By-Law 9, LSO.
                </p>
              </div>
            )}

            {existingForPeriod.status === "certified" && existingForPeriod.certifiedBy && (
              <div className="flex items-center gap-2 pt-4 border-t text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                Certified by {existingForPeriod.certifiedBy.nom} on{" "}
                {existingForPeriod.certifiedAt
                  ? new Date(existingForPeriod.certifiedAt).toLocaleDateString("en-CA")
                  : ""}
              </div>
            )}

            {certifyMutation.isError && (
              <p className="text-sm text-status-error mt-2">
                {certifyMutation.error instanceof Error ? certifyMutation.error.message : "Error"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {data?.reconciliations && data.reconciliations.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reconciliation History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Bank</th>
                    <th className="pb-2 font-medium">Register</th>
                    <th className="pb-2 font-medium">Discrepancy</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Certified By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reconciliations.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{r.periode}</td>
                      <td className="py-2 tabular-nums">{formatCurrency(r.soldeRapproche)}</td>
                      <td className="py-2 tabular-nums">{formatCurrency(r.soldeRegistre)}</td>
                      <td className={`py-2 tabular-nums ${r.ecart !== 0 ? "text-red-600 font-medium" : "text-green-600"}`}>
                        {formatCurrency(r.ecart)}
                      </td>
                      <td className="py-2">
                        <StatusBadge
                          label={r.status}
                          variant={
                            r.status === "certified" ? "success" :
                            r.ecart === 0 ? "warning" : "error"
                          }
                        />
                      </td>
                      <td className="py-2 text-neutral-500">
                        {r.certifiedBy?.nom || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
