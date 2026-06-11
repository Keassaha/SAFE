"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { FileText, Download, Eye } from "lucide-react";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

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
  nbActiveTrustAccounts: number;
  annualReconciliations: {
    months: { periode: string; status: string; certified: boolean; certifiedAt: string | null; ecart: number }[];
    allCertified: boolean;
    missingOrUncertifiedMonths: string[];
    totalEcart: number;
  } | null;
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

export function LSOReportGenerator({
  canGenerate = false,
  canCertify = false,
}: {
  canGenerate?: boolean;
  canCertify?: boolean;
}) {
  const queryClient = useQueryClient();
  const copy = getTrustRegulatorCopy(useCabinetProvince());
  const [periode, setPeriode] = useState("");
  const [reportType, setReportType] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [preview, setPreview] = useState<ReportData | null>(null);
  const [certifyError, setCertifyError] = useState<string | null>(null);

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

  const certifyMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/fideicommis/lso-report/${reportId}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Erreur de certification");
      }
      return res.json();
    },
    onSuccess: () => {
      setCertifyError(null);
      queryClient.invalidateQueries({ queryKey: ["lso-reports"] });
    },
    onError: (err: Error) => setCertifyError(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Generate form — réservé à qui peut générer (comptabilité / admin) */}
      {canGenerate && (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {copy.reportGeneratorTitle}
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            {copy.reportGeneratorDesc}
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <Input
              label={copy.reportFieldPeriod}
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              placeholder="2026-04"
              className="w-36"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {copy.reportFieldType}
              </label>
              <select
                className="h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "monthly" | "quarterly" | "annual")}
              >
                <option value="monthly">{copy.reportTypeMonthly}</option>
                <option value="quarterly">{copy.reportTypeQuarterly}</option>
                <option value="annual">{copy.reportTypeAnnual}</option>
              </select>
            </div>
            <Button
              variant="secondary"
              onClick={() => previewMutation.mutate()}
              disabled={!periode || previewMutation.isPending}
            >
              <Eye className="w-4 h-4" />
              {previewMutation.isPending ? copy.reportLoading : copy.reportPreview}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Preview */}
      {preview && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  {copy.reportStatementTitle} — {preview.cabinetName}
                </h3>
                <p className="text-sm text-neutral-500">
                  {copy.reportMetaLine(preview.periode, preview.type, preview.generatedBy)}
                </p>
              </div>
              {canGenerate && (
                <Button
                  variant="primary"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Download className="w-4 h-4" />
                  {saveMutation.isPending ? copy.reportSaving : copy.reportSave}
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-safe bg-neutral-50 border">
                <p className="text-xs text-neutral-500">{copy.reportOpeningBalance}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(preview.soldeOuverture)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-green-50 border border-green-200">
                <p className="text-xs text-green-600">{copy.reportTotalDeposits}</p>
                <p className="text-lg font-semibold tabular-nums text-green-700">
                  {formatCurrency(preview.totalDeposits)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600">{copy.reportTotalWithdrawals}</p>
                <p className="text-lg font-semibold tabular-nums text-amber-700">
                  {formatCurrency(preview.totalWithdrawals)}
                </p>
              </div>
              <div className="p-3 rounded-safe bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600">{copy.reportClosingBalance}</p>
                <p className="text-lg font-semibold tabular-nums text-blue-700">
                  {formatCurrency(preview.soldeFermeture)}
                </p>
              </div>
            </div>

            {/* Active trust accounts (Barreau annual requirement) */}
            <div className="mb-6 p-3 rounded-safe bg-neutral-50 border inline-block">
              <p className="text-xs text-neutral-500">Comptes fidéicommis actifs</p>
              <p className="text-lg font-semibold tabular-nums">{preview.nbActiveTrustAccounts}</p>
            </div>

            {/* Annual: 12 monthly reconciliations confirmation */}
            {preview.annualReconciliations && (
              <div
                className={`mb-6 p-4 rounded-safe border ${
                  preview.annualReconciliations.allCertified
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4 className="text-sm font-semibold mb-2">
                  Rapprochements mensuels de l&apos;exercice (12 mois)
                </h4>
                {preview.annualReconciliations.allCertified ? (
                  <p className="text-sm text-green-700 mb-3">
                    Les 12 rapprochements mensuels sont certifiés. Écart total : {formatCurrency(preview.annualReconciliations.totalEcart)}.
                  </p>
                ) : (
                  <p className="text-sm text-red-700 mb-3">
                    Rapport annuel incomplet : {preview.annualReconciliations.missingOrUncertifiedMonths.length} mois
                    sans rapprochement certifié ({preview.annualReconciliations.missingOrUncertifiedMonths.join(", ")}).
                    Ces mois doivent être rapprochés et certifiés avant le dépôt au Barreau.
                  </p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {preview.annualReconciliations.months.map((m) => (
                    <div
                      key={m.periode}
                      className={`p-2 rounded text-xs text-center border ${
                        m.certified
                          ? "bg-white border-green-200 text-green-700"
                          : "bg-white border-red-200 text-red-600"
                      }`}
                      title={m.certifiedAt ? `Certifié le ${new Date(m.certifiedAt).toLocaleDateString("fr-CA")}` : m.status}
                    >
                      <div className="font-medium">{m.periode.slice(5)}</div>
                      <div>{m.certified ? "✓ certifié" : m.status === "missing" ? "absent" : m.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reconciliation status */}
            {preview.reconciliation && (
              <div className="mb-6 p-4 rounded-safe bg-neutral-50 border">
                <h4 className="text-sm font-semibold mb-2">{copy.threeWayReconciliation}</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">{copy.reportBankBalance}</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(preview.reconciliation.soldeBancaire)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">{copy.reportRegisterBalance}</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(preview.reconciliation.soldeRegistre)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">{copy.reportDiscrepancy}</p>
                    <p className={`font-medium tabular-nums ${
                      preview.reconciliation.ecart === 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(preview.reconciliation.ecart)}
                    </p>
                  </div>
                </div>
                {preview.reconciliation.certifiedBy && (
                  <p className="text-xs text-green-600 mt-2">
                    {copy.reportCertifiedBy(preview.reconciliation.certifiedBy)}
                    {preview.reconciliation.certifiedAt &&
                      copy.reportCertifiedOn(new Date(preview.reconciliation.certifiedAt).toLocaleDateString("en-CA"))}
                  </p>
                )}
              </div>
            )}

            {preview.interetsLFO > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                {copy.foundationInterestLabel} {formatCurrency(preview.interetsLFO)}
              </p>
            )}

            {/* Transaction journal */}
            <h4 className="text-sm font-semibold mb-2">
              {copy.reportTransactionJournal(preview.nbTransactions)}
            </h4>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">{copy.reportColDate}</th>
                    <th className="pb-2 font-medium">{copy.reportColType}</th>
                    <th className="pb-2 font-medium">{copy.reportColClientMatter}</th>
                    <th className="pb-2 font-medium">{copy.reportColDescription}</th>
                    <th className="pb-2 font-medium text-right">{copy.reportColAmount}</th>
                    <th className="pb-2 font-medium text-right">{copy.reportColBalance}</th>
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
            <h3 className="text-lg font-semibold mb-4">{copy.reportSavedTitle}</h3>
            {certifyError && (
              <p className="mb-3 text-sm text-status-error">{certifyError}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">{copy.reportColPeriod}</th>
                    <th className="pb-2 font-medium">{copy.reportColType}</th>
                    <th className="pb-2 font-medium">{copy.reportColGenerated}</th>
                    <th className="pb-2 font-medium">{copy.reportColBy}</th>
                    <th className="pb-2 font-medium">{copy.reportColReconciliation}</th>
                    <th className="pb-2 font-medium">{copy.reportColStatus}</th>
                    {canCertify && <th className="pb-2 font-medium text-right">{copy.reportColAction}</th>}
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
                          <span className="text-neutral-400">{copy.reportReconciliationNone}</span>
                        )}
                      </td>
                      <td className="py-2">
                        <StatusBadge label={r.status} variant={r.status === "final" ? "success" : "neutral"} />
                      </td>
                      {canCertify && (
                        <td className="py-2 text-right">
                          {r.status === "final" ? (
                            <span className="text-xs text-green-600">Signé</span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Signer la déclaration de conformité de ce rapport, à titre d'avocat responsable ? Cette action est définitive."
                                  )
                                ) {
                                  certifyMutation.mutate(r.id);
                                }
                              }}
                              disabled={certifyMutation.isPending}
                            >
                              Certifier
                            </Button>
                          )}
                        </td>
                      )}
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
