"use client";

import { useTranslations } from "next-intl";
import type { PayslipStatus } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { Plus, AlertTriangle } from "lucide-react";
import {
  PendingHoursApproval,
  type SerializedPendingHour,
  type ApprovedSummary,
} from "./PendingHoursApproval";

export type PayslipRow = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  hoursWorked: number;
  hourlyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: PayslipStatus;
  paymentDate: Date | null;
};

interface EmployeePayrollTabProps {
  payslips: PayslipRow[];
  canGenerate: boolean;
  onGenerate?: () => void;
  /** Soumissions d'heures employé (N8) — bloc d'approbation au-dessus de l'historique. */
  employeeId?: string;
  hourlyRate?: number;
  pendingHours?: SerializedPendingHour[];
  approvedSummary?: ApprovedSummary | null;
  locale?: "fr" | "en";
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const STATUS_KEYS: Record<PayslipStatus, string> = {
  draft: "statusDraft",
  generated: "statusGenerated",
  paid: "statusPaid",
};

export function EmployeePayrollTab({
  payslips,
  canGenerate,
  onGenerate,
  employeeId,
  hourlyRate = 0,
  pendingHours = [],
  approvedSummary = null,
  locale = "en",
}: EmployeePayrollTabProps) {
  const t = useTranslations("employees");

  return (
    <div className="space-y-4">
      {canGenerate && employeeId ? (
        <PendingHoursApproval
          employeeId={employeeId}
          pending={pendingHours}
          approved={approvedSummary}
          hourlyRate={hourlyRate}
          locale={locale}
        />
      ) : null}
      {payslips.length > 0 ? (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>{t("payrollEstimateTitle")}</AlertTitle>
          <AlertDescription>
            <p>{t("payrollEstimateBody")}</p>
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
      <CardHeader
        title={t("payrollHistory")}
        action={
          canGenerate && onGenerate && (
            <Button type="button" onClick={onGenerate}>
              <Plus className="w-4 h-4 mr-2 inline-block" aria-hidden />
              {t("generatePayslip")}
            </Button>
          )
        }
      />
      <CardContent className="p-0">
        {payslips.length === 0 ? (
          <div className="py-12 text-center text-si-muted text-sm">
            {t("noPayroll")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-si-line bg-si-canvas/60">
                  <th className="px-4 py-3 text-left font-medium text-si-muted">
                    {t("weekStart")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-si-muted">
                    {t("weekEnd")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-si-muted">{t("hours")}</th>
                  <th className="px-4 py-3 text-right font-medium text-si-muted">{t("rate")}</th>
                  <th className="px-4 py-3 text-right font-medium text-si-muted">{t("gross")}</th>
                  <th className="px-4 py-3 text-right font-medium text-si-muted">
                    {t("deductions")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-si-muted">{t("net")}</th>
                  <th className="px-4 py-3 text-left font-medium text-si-muted">{t("tableHeaderStatus")}</th>
                  <th className="px-4 py-3 text-left font-medium text-si-muted">
                    {t("paymentDate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-si-line hover:bg-si-surface/30"
                  >
                    <td className="px-4 py-3">{formatDate(row.periodStart)}</td>
                    <td className="px-4 py-3">{formatDate(row.periodEnd)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.hoursWorked}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.hourlyRate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.grossPay)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.deductions)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(row.netPay)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.status === "paid"
                            ? "text-si-verified"
                            : row.status === "generated"
                              ? "text-si-ink"
                              : "text-si-muted"
                        }
                      >
                        {t(STATUS_KEYS[row.status])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-si-muted">
                      {row.paymentDate ? formatDate(row.paymentDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
