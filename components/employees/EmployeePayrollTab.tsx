"use client";

import { useTranslations } from "next-intl";
import type { PayslipStatus } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

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
}: EmployeePayrollTabProps) {
  const t = useTranslations("employees");

  return (
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
          <div className="py-12 text-center text-neutral-muted text-sm">
            {t("noPayroll")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-surface/50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">
                    {t("weekStart")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">
                    {t("weekEnd")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">{t("hours")}</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">{t("rate")}</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">{t("gross")}</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">
                    {t("deductions")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">{t("net")}</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">{t("tableHeaderStatus")}</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">
                    {t("paymentDate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-border hover:bg-neutral-surface/30"
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
                            ? "text-status-success"
                            : row.status === "generated"
                              ? "text-blue-600"
                              : "text-neutral-500"
                        }
                      >
                        {t(STATUS_KEYS[row.status])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-muted">
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
  );
}
