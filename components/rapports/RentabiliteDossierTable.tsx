"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { DataTable } from "@/components/ui/DataTable";
import type { RentabiliteDossierRow } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

export function RentabiliteDossierTable({ data }: { data: RentabiliteDossierRow[] }) {
  const t = useTranslations("reportsUi");
  const { formatCurrency } = useFormatteurs();

  const columns = [
    { key: "intitule", header: t("matter"), render: (r: RentabiliteDossierRow) => r.intitule },
    { key: "client", header: t("client"), render: (r: RentabiliteDossierRow) => r.client },
    { key: "revenus", header: t("revenue"), render: (r: RentabiliteDossierRow) => formatCurrency(r.revenus) },
    { key: "heures", header: t("hours"), render: (r: RentabiliteDossierRow) => `${r.heures} h` },
    { key: "paiements", header: t("payments"), render: (r: RentabiliteDossierRow) => formatCurrency(r.paiements) },
    { key: "profitEstime", header: t("estimatedProfit"), render: (r: RentabiliteDossierRow) => formatCurrency(r.profitEstime) },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.dossierId}
      emptyMessage={t("noMatterWithActivity")}
    />
  );
}
