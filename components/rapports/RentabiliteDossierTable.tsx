"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency } from "@/lib/utils/format";
import type { RentabiliteDossierRow } from "@/lib/rapports/types";

const columns = [
  { key: "intitule", header: "Dossier", render: (r: RentabiliteDossierRow) => r.intitule },
  { key: "client", header: "Client", render: (r: RentabiliteDossierRow) => r.client },
  { key: "revenus", header: "Revenus", render: (r: RentabiliteDossierRow) => formatCurrency(r.revenus) },
  { key: "heures", header: "Heures", render: (r: RentabiliteDossierRow) => `${r.heures} h` },
  { key: "paiements", header: "Paiements", render: (r: RentabiliteDossierRow) => formatCurrency(r.paiements) },
  { key: "profitEstime", header: "Profit estimé", render: (r: RentabiliteDossierRow) => formatCurrency(r.profitEstime) },
];

export function RentabiliteDossierTable({ data }: { data: RentabiliteDossierRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.dossierId}
      emptyMessage="Aucun dossier avec activité pour la période."
    />
  );
}
