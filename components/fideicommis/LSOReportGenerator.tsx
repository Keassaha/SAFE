"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { FileText, Download, Eye } from "lucide-react";

interface ReportData {
  cabinetName: string;
  periode: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  soldeOuverture: number;
  soldeFermeture: number;
  totalDeposits: number;
  totalWithdrawals: number;
  transactions: {
    date: string;
    type: string;
    description: string | null;
    dossier: string | null;
    client: string | null;
    amount: number;
    balance: number;
  }[];
  reconciliation: {
    soldeBancaire: number;
    soldeRegistre: number;
    ecart: number;
    status: string;
    certifiedAt: string | null;
    certifiedBy: string | null;
  } | null;
  interetsLFO: number;
  nbTransactions: number;
}

interface SavedReport {
  id: string;
  periode: string;
  type: string;
  generatedAt: string;
  status: string;
  generatedBy: { nom: string };
  reconciliation: { status: string; certifiedAt: string | null } | null;
}

export function LSOReportGenerator() {
  const queryClient = useQueryClient();
  const [periode, setPeriode] = useState("");
  const [reportType, setReportType] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [preview, setPreview] = useState<ReportData | null>(null);

  const { data: savedReports } = useQuery({
    queryKey: ["lso-reports"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/lso-report");
      if (!res.ok) throw new Error("Error loading reports");
      return res.json() as Promise<{ reports: SavedReport[] }>;
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/fideicommis/lso-report?preview=true&periode=${periode}&type=${reportType}`
      );
      if (!res.ok) throw new Error("Error generating preview");
      return res.json() as Promise<ReportData>;
    },
    onSuccess: (data) => setPreview(data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/fideicommis/lso-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, type: reportType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error saving report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lso-reports"] });
      setPreview(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Generate form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            LSO Compliance Report Generator
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Generate a trust account compliance report formatted for By-Law 9, LSO spot audit.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <Input
              label="Period (YYYY-MM)"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              placeholder="2026-04"
              className="w-36"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                Type
              </label>
              <select
                className="h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "monthly" | "quarterly" | "annual")}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <Button
              variant="secondary"
              onClick={() => previewMutation.mutate()}
              disabled={!periode || previewMutation.isPending}
            >
              <Eye className="w-4 h-4" />
              {previewMutation.isPending ? "Loading..." : "Preview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Trust Account Statement — {preview.cabinetName}
                </h3>
                <p className="text-sm text-neutral-500">
                  Period: {preview.periode} | Type: {preview.type} |{" "}
                  Generated by {preview.generatedBy}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Download className="w-4 h-4" />
                {saveMutation.isPending ? "Saving..." : "Save Report"}
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-safe bg-neutral-50 border">
                <p className="text-xs text-neutral-500">Opening Balance</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(preview.soldeOuverture)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-green-50 border border-green-200">
                <p className="text-xs text-green-600">Total Deposits</p>
                <p className="text-lg font-semibold tabular-nums text-green-700">
                  {formatCurrency(preview.totalDeposits)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600">Total Withdrawals</p>
                <p className="text-lg font-semibold tabular-nums text-amber-700">
                  {formatCurrency(preview.totalWithdrawals)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600">Closing Balance</p>
                <p className="text-lg font-semibold tabular-nums text-blue-700">
                  {formatCurrency(preview.soldeFermeture)}
                </p>
              </div>
            </div>

            {/* Reconciliation status */}
            {preview.reconciliation && (
              <div className="mb-6 p-4 rounded-safe bg-neutral-50 border">
                <h4 className="text-sm font-semibold mb-2">3-Way Reconciliation</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Bank Balance</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(preview.reconciliation.soldeBancaire)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Register Balance</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(preview.reconciliation.soldeRegistre)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Discrepancy</p>
                    <p className={`font-medium tabular-nums ${
                      preview.reconciliation.ecart === 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(preview.reconciliation.ecart)}
                    </p>
                  </div>
                </div>
                {preview.reconciliation.certifiedBy && (
                  <p className="text-xs text-green-600 mt-2">
                    Certified by {preview.reconciliation.certifiedBy}
                    {preview.reconciliation.certifiedAt &&
                      ` on ${new Date(preview.reconciliation.certifiedAt).toLocaleDateString("en-CA")}`}
                  </p>
                )}
              </div>
            )}

            {preview.interetsLFO > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                Law Foundation of Ontario interest: {formatCurrency(preview.interetsLFO)}
              </p>
            )}

            {/* Transaction journal */}
            <h4 className="text-sm font-semibold mb-2">
              Transaction Journal ({preview.nbTransactions} entries)
            </h4>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Client / Matter</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.transactions.map((tx, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5">{tx.date}</td>
                      <td className="py-1.5">
                        <StatusBadge
                          label={tx.type}
                          variant={tx.amount > 0 ? "success" : tx.type === "correction" ? "warning" : "error"}
                        />
                      </td>
                      <td className="py-1.5 text-xs">
                        {tx.client && <span className="font-medium">{tx.client}</span>}
                        {tx.dossier && <span className="text-neutral-500 block">{tx.dossier}</span>}
                      </td>
                      <td className="py-1.5 text-neutral-600 max-w-48 truncate">
                        {tx.description || "—"}
                      </td>
                      <td className={`py-1.5 text-right tabular-nums font-medium ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatCurrency(tx.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved reports history */}
      {savedReports?.reports && savedReports.reports.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Saved Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Generated</th>
                    <th className="pb-2 font-medium">By</th>
                    <th className="pb-2 font-medium">Reconciliation</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {savedReports.reports.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{r.periode}</td>
                      <td className="py-2">{r.type}</td>
                      <td className="py-2">
                        {new Date(r.generatedAt).toLocaleDateString("en-CA")}
                      </td>
                      <td className="py-2">{r.generatedBy.nom}</td>
                      <td className="py-2">
                        {r.reconciliation ? (
                          <StatusBadge
                            label={r.reconciliation.status}
                            variant={r.reconciliation.status === "certified" ? "success" : "warning"}
                          />
                        ) : (
                          <span className="text-neutral-400">None</span>
                        )}
                      </td>
                      <td className="py-2">
                        <StatusBadge label={r.status} variant={r.status === "final" ? "success" : "neutral"} />
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
