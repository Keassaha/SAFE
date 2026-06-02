"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency } from "@/lib/utils/format";
import type { PerformanceAvocatRow } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

export function PerformanceAvocatsTable({ data }: { data: PerformanceAvocatRow[] }) {
  const t = useTranslations("reportsUi");

  const columns = [
    { key: "nom", header: t("lawyer"), render: (r: PerformanceAvocatRow) => r.nom },
    { key: "heuresTravaillees", header: t("hoursWorked"), render: (r: PerformanceAvocatRow) => `${r.heuresTravaillees} h` },
    { key: "heuresFacturees", header: t("billedHours"), render: (r: PerformanceAvocatRow) => `${r.heuresFacturees} h` },
    { key: "revenusGeneres", header: t("revenueGenerated"), render: (r: PerformanceAvocatRow) => formatCurrency(r.revenusGeneres) },
    { key: "tauxHoraireMoyen", header: t("avgHourlyRate"), render: (r: PerformanceAvocatRow) => formatCurrency(r.tauxHoraireMoyen) },
    { key: "tauxRealisation", header: t("realizationRate"), render: (r: PerformanceAvocatRow) => `${r.tauxRealisation} %` },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.userId}
      emptyMessage={t("noDataForPeriod")}
    />
  );
}
