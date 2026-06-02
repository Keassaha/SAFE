"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { RapportDeboursRow } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

export function RapportDeboursSection({ data }: { data: RapportDeboursRow[] }) {
  const t = useTranslations("reportsUi");

  const columns = [
    { key: "date", header: t("date"), render: (r: RapportDeboursRow) => formatDate(r.date) },
    { key: "client", header: t("client"), render: (r: RapportDeboursRow) => r.client },
    { key: "dossier", header: t("matter"), render: (r: RapportDeboursRow) => r.dossier ?? "—" },
    { key: "description", header: t("description"), render: (r: RapportDeboursRow) => r.description },
    { key: "montant", header: t("amount"), render: (r: RapportDeboursRow) => formatCurrency(r.montant) },
    { key: "factureNumero", header: t("invoice"), render: (r: RapportDeboursRow) => r.factureNumero ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title tracking-tight">{t("disbursementsReportTitle")}</h3>
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage={t("noDisbursementForPeriod")}
      />
    </div>
  );
}
