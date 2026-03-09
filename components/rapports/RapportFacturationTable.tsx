"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { RapportFacturationRow } from "@/lib/rapports/types";

const columns = [
  { key: "numero", header: "N° facture", render: (r: RapportFacturationRow) => r.numero },
  { key: "client", header: "Client", render: (r: RapportFacturationRow) => r.client },
  { key: "dossier", header: "Dossier", render: (r: RapportFacturationRow) => r.dossier ?? "—" },
  { key: "avocat", header: "Avocat", render: (r: RapportFacturationRow) => r.avocat ?? "—" },
  { key: "date", header: "Date", render: (r: RapportFacturationRow) => formatDate(r.date) },
  { key: "montantHT", header: "Montant HT", render: (r: RapportFacturationRow) => formatCurrency(r.montantHT) },
  { key: "taxes", header: "Taxes", render: (r: RapportFacturationRow) => formatCurrency(r.taxes) },
  { key: "total", header: "Total", render: (r: RapportFacturationRow) => formatCurrency(r.total) },
  { key: "paiementRecu", header: "Paiement reçu", render: (r: RapportFacturationRow) => formatCurrency(r.paiementRecu) },
  { key: "solde", header: "Solde", render: (r: RapportFacturationRow) => formatCurrency(r.solde) },
  { key: "statut", header: "Statut", render: (r: RapportFacturationRow) => r.statut },
];

export function RapportFacturationTable({ data }: { data: RapportFacturationRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.id}
      emptyMessage="Aucune facture pour les filtres sélectionnés."
    />
  );
}
