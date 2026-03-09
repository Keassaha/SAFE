import { Suspense } from "react";
import { requireCabinetId } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadRapportsPayload } from "@/lib/rapports/load";
import { RapportsView } from "@/components/rapports/RapportsView";

function getDefaultDates() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { dateDebut: yearStart, dateFin: yearEnd };
}

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateDebut?: string;
    dateFin?: string;
    clientId?: string;
    userId?: string;
    statut?: string;
  }>;
}) {
  const cabinetId = await requireCabinetId();
  const params = await searchParams;
  const defaults = getDefaultDates();

  let dateDebut = defaults.dateDebut;
  let dateFin = defaults.dateFin;
  if (params.dateDebut) {
    const d = new Date(params.dateDebut);
    if (!Number.isNaN(d.getTime())) dateDebut = d;
  }
  if (params.dateFin) {
    const d = new Date(params.dateFin);
    if (!Number.isNaN(d.getTime())) dateFin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  const filters = {
    dateDebut,
    dateFin,
    clientId: params.clientId ?? null,
    userId: params.userId ?? null,
    statut: params.statut ?? null,
  };

  const payload = await loadRapportsPayload(cabinetId, filters);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rapports"
        description="Dashboard financier, facturation, comptes à recevoir, performance et rapports fiscaux."
      />
      <Suspense fallback={<p className="safe-text-secondary">Chargement des rapports…</p>}>
        <RapportsView payload={payload} />
      </Suspense>
    </div>
  );
}
