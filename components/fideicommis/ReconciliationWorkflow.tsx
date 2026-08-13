"use client";

import { useEffect, useState } from "react";
import { Figure } from "@/components/ui/Figure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { formatCurrency } from "@/lib/utils/format";

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

const panelClass = "rounded-lg border border-si-line bg-si-surface";

export function ReconciliationWorkflow() {
  const queryClient = useQueryClient();
  const t = useTranslations("trustReconciliationUi");
  const locale = useLocale();
  const isQuebec = (useCabinetProvince() ?? "").toUpperCase() === "QC";
  const formatMoney = (amount: number) => formatCurrency(amount, "CAD", locale);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["reconciliation", "list"],
    queryFn: async () => {
      const response = await fetch("/api/fideicommis/reconciliation");
      if (!response.ok) throw new Error(t("loadErrorTitle"));
      return response.json() as Promise<ReconciliationResponse>;
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

  useEffect(() => {
    if (!data?.status.expectedPeriode) return;
    setFormData((previous) =>
      previous.periode
        ? previous
        : { ...previous, periode: data.status.expectedPeriode }
    );
  }, [data?.status.expectedPeriode]);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/fideicommis/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("form.calculateError"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });

  const certifyMutation = useMutation({
    mutationFn: async (reconciliationId: string) => {
      const response = await fetch("/api/fideicommis/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "certify", reconciliationId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("result.certificationError"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
    },
  });

  const getFormPayload = () => ({
    periode: formData.periode || data?.status.expectedPeriode,
    soldeBancaire: parseFloat(formData.soldeBancaire) || 0,
    chequesEnCirculation: parseFloat(formData.chequesEnCirculation) || 0,
    depotsEnTransit: parseFloat(formData.depotsEnTransit) || 0,
    interetsLFO: parseFloat(formData.interetsLFO) || 0,
    notes: formData.notes || null,
  });

  if (isLoading) {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <div className="h-[58px] rounded-lg border border-si-line bg-si-surface" />
        <div className={`${panelClass} p-6`}>
          <div className="h-6 w-64 max-w-full rounded bg-si-line2" />
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[62px] rounded-md bg-si-line2" />
            ))}
          </div>
          <div className="mt-5 h-10 w-48 rounded-md bg-si-line2" />
        </div>
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <QueryErrorState
        title={t("loadErrorTitle")}
        description={t("loadErrorDescription")}
        retryLabel={t("retry")}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  const currentPeriod = data?.status.expectedPeriode || "";
  const current = data?.reconciliations.find(
    (reconciliation) => reconciliation.periode === currentPeriod
  );
  const canCertify = Boolean(
    current && current.status !== "certified" && current.ecart === 0
  );
  const statusLabel = (status: string) => {
    if (status === "certified") return t("statuses.certified");
    if (status === "complete") return t("statuses.complete");
    if (status === "draft") return t("statuses.draft");
    return status;
  };

  return (
    <div className="space-y-6">
      {data?.status && (
        <section
          className={`flex items-start gap-3 border-l-2 px-4 py-3 ${
            data.status.critical
              ? "border-status-error bg-status-error-bg"
              : data.status.overdue
                ? "border-si-amber bg-si-amber/[0.08]"
                : "border-si-verified bg-si-verified/[0.06]"
          }`}
          aria-label={t("history.status")}
        >
          {data.status.critical || data.status.overdue ? (
            <AlertTriangle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                data.status.critical ? "text-status-error" : "text-si-amber-ink"
              }`}
              aria-hidden="true"
            />
          ) : (
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-si-verified" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-si-ink">
              {data.status.critical
                ? t("status.critical", { days: data.status.daysSinceMonthEnd })
                : data.status.overdue
                  ? t("status.overdue", { period: data.status.expectedPeriode })
                  : data.status.lastCertifiedPeriode === data.status.expectedPeriode
                    ? t("status.certified", { period: data.status.expectedPeriode })
                    : t("status.pending", { period: data.status.expectedPeriode })}
            </p>
            {data.status.lastCertifiedPeriode && (
              <p className="mt-0.5 text-xs text-si-muted">
                {t("status.lastCertified", { period: data.status.lastCertifiedPeriode })}
              </p>
            )}
          </div>
        </section>
      )}

      {current && (
        <section className={panelClass} aria-labelledby="reconciliation-result-title">
          <div className="flex flex-col gap-3 border-b border-si-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="reconciliation-result-title" className="text-base font-medium text-si-ink">
              {t("result.title", { period: current.periode })}
            </h2>
            <StatusBadge
              label={statusLabel(current.status)}
              variant={
                current.status === "certified"
                  ? "success"
                  : current.ecart === 0
                    ? "warning"
                    : "error"
              }
            />
          </div>

          <div className="grid md:grid-cols-3">
            <div className="border-b border-si-line p-5 md:border-b-0 md:border-r">
              <p className="text-sm font-medium text-si-muted">{t("result.bankReconciled")}</p>
              <p className="mt-2 text-right">
                <Figure taille="secondaire">{formatMoney(current.soldeRapproche)}</Figure>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-si-muted">
                {t("result.bankDetails", {
                  bank: formatMoney(current.soldeBancaire),
                  cheques: formatMoney(current.chequesEnCirculation),
                  deposits: formatMoney(current.depotsEnTransit),
                })}
              </p>
            </div>
            <div className="border-b border-si-line p-5 md:border-b-0 md:border-r">
              <p className="text-sm font-medium text-si-muted">{t("result.safeRegister")}</p>
              <p className="mt-2 text-right">
                <Figure taille="secondaire">{formatMoney(current.soldeRegistre)}</Figure>
              </p>
              <p className="mt-2 text-xs text-si-muted">{t("result.safeRegisterDesc")}</p>
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-si-muted">{t("result.discrepancy")}</p>
              <p className="mt-2 text-right">
                <Figure taille="secondaire" teinte={current.ecart === 0 ? "confirme" : "attention"}>
                  {formatMoney(current.ecart)}
                </Figure>
              </p>
              <p className="mt-2 text-xs text-si-muted">
                {current.ecart === 0 ? t("result.balanced") : t("result.mustBeZero")}
              </p>
            </div>
          </div>

          {(current.interetsLFO > 0 || canCertify || current.status === "certified") && (
            <div className="border-t border-si-line px-5 py-4">
              {current.interetsLFO > 0 && (
                <p className="mb-3 text-sm text-si-muted">
                  {t(
                    isQuebec ? "result.foundationInterestQc" : "result.foundationInterestOn",
                    { amount: formatMoney(current.interetsLFO) }
                  )}{" "}
                  · {current.interetsPayesAt ? t("result.interestPaid") : t("result.interestPending")}
                </p>
              )}
              {canCertify && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    variant="primary"
                    onClick={() => certifyMutation.mutate(current.id)}
                    disabled={certifyMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    {certifyMutation.isPending ? t("result.certifying") : t("result.certify")}
                  </Button>
                  <p className="max-w-2xl text-xs leading-relaxed text-si-muted">
                    {t("result.certificationStatement")}
                  </p>
                </div>
              )}
              {current.status === "certified" && current.certifiedBy && (
                <p className="flex items-center gap-2 text-sm text-si-verified">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  {t("result.certifiedBy", {
                    name: current.certifiedBy.nom,
                    date: current.certifiedAt
                      ? new Date(current.certifiedAt).toLocaleDateString(
                          locale === "fr" ? "fr-CA" : "en-CA"
                        )
                      : "",
                  })}
                </p>
              )}
              {certifyMutation.isError && (
                <MutationError
                  message={
                    certifyMutation.error instanceof Error
                      ? certifyMutation.error.message
                      : t("result.certificationError")
                  }
                  retryLabel={t("result.retryCertification")}
                  onRetry={() => certifyMutation.mutate(current.id)}
                />
              )}
            </div>
          )}
        </section>
      )}

      <section className={`${panelClass} p-5 sm:p-6`} aria-labelledby="reconciliation-form-title">
        <h2 id="reconciliation-form-title" className="text-base font-medium text-si-ink">
          {t("form.title")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-si-muted">{t("form.intro")}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(getFormPayload());
          }}
          className="mt-5 space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              id="reconciliation-period"
              label={t("form.period")}
              value={formData.periode || currentPeriod}
              onChange={(event) => setFormData({ ...formData, periode: event.target.value })}
              placeholder="2026-04"
            />
            <Input
              label={t("form.bankBalance")}
              type="number"
              step="0.01"
              value={formData.soldeBancaire}
              onChange={(event) => setFormData({ ...formData, soldeBancaire: event.target.value })}
              placeholder="0.00"
            />
            <Input
              label={t("form.outstandingCheques")}
              type="number"
              step="0.01"
              value={formData.chequesEnCirculation}
              onChange={(event) => setFormData({ ...formData, chequesEnCirculation: event.target.value })}
              placeholder="0.00"
            />
            <Input
              label={t("form.depositsInTransit")}
              type="number"
              step="0.01"
              value={formData.depotsEnTransit}
              onChange={(event) => setFormData({ ...formData, depotsEnTransit: event.target.value })}
              placeholder="0.00"
            />
            <Input
              label={isQuebec ? t("form.foundationInterestQc") : t("form.foundationInterestOn")}
              type="number"
              step="0.01"
              value={formData.interetsLFO}
              onChange={(event) => setFormData({ ...formData, interetsLFO: event.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="reconciliation-notes" className="mb-1 block text-sm font-medium text-si-ink">
              {t("form.notes")}
            </label>
            <textarea
              id="reconciliation-notes"
              className="h-20 w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-sm text-si-ink outline-none transition-colors placeholder:text-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20"
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              placeholder={t("form.notesPlaceholder")}
            />
          </div>
          <Button
            type="submit"
            variant={canCertify ? "secondary" : "primary"}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? t("form.calculating") : t("form.calculate")}
          </Button>
          {createMutation.isError && (
            <MutationError
              message={
                createMutation.error instanceof Error
                  ? createMutation.error.message
                  : t("form.calculateError")
              }
              retryLabel={t("form.retryCalculate")}
              onRetry={() => createMutation.mutate(getFormPayload())}
            />
          )}
        </form>
      </section>

      {data?.reconciliations && data.reconciliations.length > 0 ? (
        <section className={panelClass} aria-labelledby="reconciliation-history-title">
          <h2 id="reconciliation-history-title" className="px-5 py-4 text-base font-medium text-si-ink">
            {t("history.title")}
          </h2>
          <div className="overflow-x-auto border-t border-si-line">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-si-line text-left text-si-muted">
                  <th className="px-5 py-3 font-medium">{t("history.period")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("history.bank")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("history.register")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("history.discrepancy")}</th>
                  <th className="px-4 py-3 font-medium">{t("history.status")}</th>
                  <th className="px-5 py-3 font-medium">{t("history.certifiedBy")}</th>
                </tr>
              </thead>
              <tbody>
                {data.reconciliations.map((reconciliation) => (
                  <tr key={reconciliation.id} className="border-b border-si-line last:border-b-0">
                    <td className="px-5 py-3 font-mono font-medium tabular-nums text-si-ink">
                      {reconciliation.periode}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatMoney(reconciliation.soldeRapproche)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatMoney(reconciliation.soldeRegistre)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-medium tabular-nums ${
                        reconciliation.ecart === 0 ? "text-si-verified" : "text-status-error"
                      }`}
                    >
                      {formatMoney(reconciliation.ecart)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={statusLabel(reconciliation.status)}
                        variant={
                          reconciliation.status === "certified"
                            ? "success"
                            : reconciliation.ecart === 0
                              ? "warning"
                              : "error"
                        }
                      />
                    </td>
                    <td className="px-5 py-3 text-si-muted">
                      {reconciliation.certifiedBy?.nom || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={`${panelClass} p-6`}>
          <EmptyState
            title={t("empty.title")}
            description={t("empty.description")}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById("reconciliation-period")?.focus()}
              >
                {t("empty.action")}
              </Button>
            }
          />
        </section>
      )}
    </div>
  );
}

function MutationError({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 border-l-2 border-status-error pl-3 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm text-status-error">{message}</p>
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
