"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency } from "@/lib/utils/format";
import type { PerformanceAvocatRow } from "@/lib/rapports/types";

const columns = [
  { key: "nom", header: "Avocat", render: (r: PerformanceAvocatRow) => r.nom },
  { key: "heuresTravaillees", header: "Heures travaillées", render: (r: PerformanceAvocatRow) => `${r.heuresTravaillees} h` },
  { key: "heuresFacturees", header: "Heures facturées", render: (r: PerformanceAvocatRow) => `${r.heuresFacturees} h` },
  { key: "revenusGeneres", header: "Revenus générés", render: (r: PerformanceAvocatRow) => formatCurrency(r.revenusGeneres) },
  { key: "tauxHoraireMoyen", header: "Taux horaire moyen", render: (r: PerformanceAvocatRow) => formatCurrency(r.tauxHoraireMoyen) },
  { key: "tauxRealisation", header: "Taux réalisation", render: (r: PerformanceAvocatRow) => `${r.tauxRealisation} %` },
];

export function PerformanceAvocatsTable({ data }: { data: PerformanceAvocatRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.userId}
      emptyMessage="Aucune donnée pour la période."
    />
  );
}
