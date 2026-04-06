"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileEdit, Send, AlertTriangle, CheckCircle, Maximize2 } from "lucide-react";
import { routes } from "@/lib/routes";
import type { BillingFollowUpRow } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";

export interface BillingPipelineProps {
  rows: BillingFollowUpRow[];
}

interface PipelineStage {
  key: string;
  label: string;
  icon: typeof FileEdit;
  count: number;
  total: number;
  bgColor: string;
  iconColor: string;
  textColor: string;
  borderColor: string;
  countBg: string;
}

export function BillingPipeline({ rows }: BillingPipelineProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const draft = rows.filter((r) => r.status === "Brouillon" || r.status === "Draft");
  const issued = rows.filter((r) => r.status === "Envoyée" || r.status === "Issued");
  const overdue = rows.filter((r) => r.status === "En retard" || r.status === "Overdue");
  const paid = rows.filter((r) => r.status === "Payée" || r.status === "Paid");

  const sum = (arr: BillingFollowUpRow[]) => arr.reduce((acc, r) => acc + r.amount, 0);

  const stages: PipelineStage[] = [
    {
      key: "draft",
      label: t("draft"),
      icon: FileEdit,
      count: draft.length,
      total: sum(draft),
      bgColor: "bg-gray-50",
      iconColor: "text-gray-500",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      countBg: "bg-gray-100",
    },
    {
      key: "issued",
      label: t("issued"),
      icon: Send,
      count: issued.length,
      total: sum(issued),
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      countBg: "bg-blue-100",
    },
    {
      key: "overdue",
      label: t("overdue"),
      icon: AlertTriangle,
      count: overdue.length,
      total: sum(overdue),
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      textColor: "text-red-800",
      borderColor: "border-red-200",
      countBg: "bg-red-100",
    },
    {
      key: "paid",
      label: "Payées",
      icon: CheckCircle,
      count: paid.length,
      total: sum(paid),
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-800",
      borderColor: "border-emerald-200",
      countBg: "bg-emerald-100",
    },
  ];

  return (
    <div className="bg-white rounded-safe-md border border-[var(--safe-neutral-border)] shadow-sm p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--safe-text-title)] tracking-tight">
            {t("billingFollowUpTitle")}
          </h3>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">Pipeline de facturation</p>
        </div>
        <Link
          href={routes.facturationSuivi}
          className="w-8 h-8 rounded-safe-sm bg-[var(--safe-neutral-page)] hover:bg-[var(--safe-neutral-100)] flex items-center justify-center transition-colors text-[var(--safe-text-secondary)]"
          aria-label={t("viewBillingFollowUp")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.key}
              className={`rounded-safe ${stage.bgColor} border ${stage.borderColor} p-4 text-center`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${stage.iconColor}`} aria-hidden />
                <span className={`text-xs font-semibold ${stage.textColor}`}>
                  {stage.label}
                </span>
              </div>
              <p className={`text-2xl font-bold ${stage.textColor}`}>
                {stage.count}
              </p>
              <p className={`text-xs font-medium mt-1 ${stage.iconColor}`}>
                {formatCurrency(stage.total, "CAD", locale)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
