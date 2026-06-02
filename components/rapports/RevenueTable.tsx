"use client";

import { formatCurrency } from "@/lib/utils/format";
import { DataTable } from "@/components/ui/DataTable";
import { useTranslations } from "next-intl";

type Row = { clientId: string; clientName: string; total: number };

export function RevenueTable({ data }: { data: Row[] }) {
  const t = useTranslations("reportsUi");

  const columns = [
    { key: "clientName", header: t("client"), render: (r: Row) => r.clientName },
    {
      key: "total",
      header: t("totalBilled"),
      render: (r: Row) => formatCurrency(r.total),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.clientId}
      emptyMessage={t("noRevenueForPeriod")}
    />
  );
}
