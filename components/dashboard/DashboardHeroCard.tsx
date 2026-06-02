"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DollarSign, BarChart3, Clock } from "lucide-react";

interface DashboardHeroCardProps {
  soldeFiduciaire: string;
  libelle?: string;
}

/**
 * Éditorial Chaleureux — hero metric card.
 * Sand-50 canvas with forest icon, editorial metric typography, and
 * sand quick-link buttons with forest label.
 */
export function DashboardHeroCard({
  soldeFiduciaire,
  libelle,
}: DashboardHeroCardProps) {
  const tUi = useTranslations("dashboardUi");
  const resolvedLibelle = libelle ?? tUi("trustBalance");
  return (
    <div
      className="overflow-hidden p-5 md:p-6"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3
            className="tracking-tight"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--zinc-950)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {resolvedLibelle}
          </h3>
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: "var(--sand-600)", margin: 0 }}
          >
            SAFE
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: "var(--sand-100)",
            border: "1px solid var(--sand-300)",
          }}
        >
          <DollarSign
            className="w-5 h-5"
            strokeWidth={1.5}
            style={{ color: "var(--brand-800)" }}
            aria-hidden
          />
        </div>
      </div>

      <p
        className="tabular-nums tracking-tight"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--zinc-950)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {soldeFiduciaire}
      </p>
      <p
        className="flex items-center gap-2 mt-1"
        style={{ fontSize: 13, color: "var(--sand-700)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--brand-800)" }}
          aria-hidden
        />
        {tUi("active")}
      </p>

      <div className="flex items-center gap-2 mt-6">
        <Link
          href="/rapports"
          className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-md transition-colors text-xs font-semibold"
          style={{
            background: "var(--sand-100)",
            border: "1px solid var(--sand-300)",
            color: "var(--brand-800)",
            textDecoration: "none",
          }}
        >
          <BarChart3 className="w-4 h-4" strokeWidth={1.5} aria-hidden />
          {tUi("reports")}
        </Link>
        <Link
          href="/temps"
          className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-md transition-colors text-xs font-semibold"
          style={{
            background: "var(--sand-100)",
            border: "1px solid var(--sand-300)",
            color: "var(--brand-800)",
            textDecoration: "none",
          }}
        >
          <Clock className="w-4 h-4" strokeWidth={1.5} aria-hidden />
          {tUi("timesheet")}
        </Link>
      </div>
    </div>
  );
}
