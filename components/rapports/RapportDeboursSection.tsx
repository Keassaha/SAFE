"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { RapportDeboursRow } from "@/lib/rapports/types";

const columns = [
  { key: "date", header: "Date", render: (r: RapportDeboursRow) => formatDate(r.date) },
  { key: "client", header: "Client", render: (r: RapportDeboursRow) => r.client },
  { key: "dossier", header: "Dossier", render: (r: RapportDeboursRow) => r.dossier ?? "—" },
  { key: "description", header: "Description", render: (r: RapportDeboursRow) => r.description },
  { key: "montant", header: "Montant", render: (r: RapportDeboursRow) => formatCurrency(r.montant) },
  { key: "factureNumero", header: "Facture", render: (r: RapportDeboursRow) => r.factureNumero ?? "—" },
];

export function RapportDeboursSection({ data }: { data: RapportDeboursRow[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title">Rapport débours</h3>
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage="Aucun débours pour la période."
      />
    </div>
  );
}
