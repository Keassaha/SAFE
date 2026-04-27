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
  tone: "neutral" | "info" | "danger" | "success";
}

/**
 * Éditorial Chaleureux billing pipeline.
 * Tones mapped to sand/forest/semantic palette — no raw pastels.
 */
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
      tone: "neutral",
    },
    {
      key: "issued",
      label: t("issued"),
      icon: Send,
      count: issued.length,
      total: sum(issued),
      tone: "info",
    },
    {
      key: "overdue",
      label: t("overdue"),
      icon: AlertTriangle,
      count: overdue.length,
      total: sum(overdue),
      tone: "danger",
    },
    {
      key: "paid",
      label: "Payées",
      icon: CheckCircle,
      count: paid.length,
      total: sum(paid),
      tone: "success",
    },
  ];

  const toneStyle = (tone: PipelineStage["tone"]) => {
    switch (tone) {
      case "danger":
        return {
          bg: "var(--safe-status-error-bg)",
          text: "var(--safe-status-error)",
          icon: "var(--safe-status-error)",
          border: "var(--safe-status-error)",
        };
      case "success":
        return {
          bg: "var(--safe-status-success-bg)",
          text: "var(--safe-status-success)",
          icon: "var(--safe-status-success)",
          border: "var(--safe-status-success)",
        };
      case "info":
        return {
          bg: "var(--sand-100)",
          text: "var(--zinc-950)",
          icon: "var(--brand-800)",
          border: "var(--sand-300)",
        };
      case "neutral":
      default:
        return {
          bg: "var(--sand-100)",
          text: "var(--sand-700)",
          icon: "var(--sand-600)",
          border: "var(--sand-300)",
        };
    }
  };

  return (
    <div
      className="p-5 md:p-6"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3
            className="tracking-tight"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--zinc-950)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {t("billingFollowUpTitle")}
          </h3>
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: "var(--sand-600)", margin: 0 }}
          >
            Pipeline de facturation
          </p>
        </div>
        <Link
          href={routes.facturationSuivi}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: "var(--sand-100)",
            border: "1px solid var(--sand-300)",
            color: "var(--sand-700)",
          }}
          aria-label={t("viewBillingFollowUp")}
        >
          <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const tone = toneStyle(stage.tone);
          return (
            <div
              key={stage.key}
              className="p-4 text-center"
              style={{
                background: tone.bg,
                border: `1px solid ${tone.border}`,
                borderRadius: 10,
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Icon
                  className="w-3.5 h-3.5"
                  strokeWidth={1.5}
                  style={{ color: tone.icon }}
                  aria-hidden
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: tone.text }}
                >
                  {stage.label}
                </span>
              </div>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: tone.text, letterSpacing: "-0.01em" }}
              >
                {stage.count}
              </p>
              <p
                className="text-xs font-medium mt-1 tabular-nums"
                style={{ color: tone.icon }}
              >
                {formatCurrency(stage.total, "CAD", locale)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
