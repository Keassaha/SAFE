"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import { MetricTile } from "@/components/ui/Figure";

export interface FacturationMainKpisData {
  facturablesCount: number;
  facturablesSum: number;
  envoyeesCount: number;
  envoyeesSum: number;
  verificationCount: number;
  enRetardCount: number;
  enRetardSum: number;
  tauxEncaissement: number | undefined;
}

interface FacturationMainKpisProps {
  kpis: FacturationMainKpisData;
}

/**
 * Registre synthétique. Chaque métrique filtre la table sans transformer
 * cinq chiffres de pilotage en cinq cartes concurrentes.
 */
export function FacturationMainKpis({ kpis }: FacturationMainKpisProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("facturation");
  const currentStatut = searchParams.get("statut") ?? "";

  const linkWithStatut = (statut: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statut) params.set("statut", statut);
    else params.delete("statut");
    const query = params.toString();
    return query ? `/facturation?${query}` : "/facturation";
  };

  const metrics = [
    {
      key: "billable",
      label: t("billable"),
      value: String(kpis.facturablesCount),
      detail: formatCurrency(kpis.facturablesSum, "CAD", locale),
      href: "/facturation#facturables",
      filter: "",
    },
    {
      key: "verification",
      label: t("verification"),
      value: String(kpis.verificationCount),
      detail: t("pendingApproval"),
      href: linkWithStatut("brouillon"),
      filter: "brouillon",
    },
    {
      key: "sent",
      label: t("sent"),
      value: String(kpis.envoyeesCount),
      detail: formatCurrency(kpis.envoyeesSum, "CAD", locale),
      href: linkWithStatut("envoyee"),
      filter: "envoyee",
    },
    {
      key: "overdue",
      label: t("overdue"),
      value: String(kpis.enRetardCount),
      detail: formatCurrency(kpis.enRetardSum, "CAD", locale),
      href: linkWithStatut("en_retard"),
      filter: "en_retard",
      attention: true,
    },
    {
      key: "collection",
      label: t("collectionRate"),
      value: typeof kpis.tauxEncaissement === "number" ? `${kpis.tauxEncaissement} %` : "—",
      detail: t("paidIssued"),
      href: linkWithStatut(""),
      filter: "",
    },
  ];

  return (
    <section aria-label={t("financialSummaryLabel")} className="border-y border-si-line">
      <div className="grid grid-cols-2 divide-x divide-y divide-si-line sm:grid-cols-5 sm:divide-y-0">
        {metrics.map((metric, index) => {
          const isActive = metric.filter !== "" && currentStatut === metric.filter;
          return (
            <Link
              key={metric.key}
              href={metric.href}
              className={`min-w-0 px-4 py-3 transition-colors hover:bg-si-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-si-verified ${
                isActive ? "bg-si-canvas" : "bg-si-surface"
              } ${index === metrics.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <MetricTile
                label={metric.label}
                value={metric.value}
                hint={metric.detail}
                teinte={metric.attention ? "attention" : "neutre"}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
