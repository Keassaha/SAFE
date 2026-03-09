"use client";

import { formatCurrency } from "@/lib/utils/format";
import { DataTable } from "@/components/ui/DataTable";

type Row = { clientId: string; clientName: string; total: number };

const columns = [
  { key: "clientName", header: "Client", render: (r: Row) => r.clientName },
  {
    key: "total",
    header: "Total facturé",
    render: (r: Row) => formatCurrency(r.total),
  },
];

export function RevenueTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.clientId}
      emptyMessage="Aucun revenu pour la période."
    />
  );
}
