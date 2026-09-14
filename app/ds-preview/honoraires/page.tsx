"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { HonorairesAFacturerView } from "@/app/(app)/facturation/honoraires/HonorairesAFacturerView";
import type { HonorairesRow } from "@/lib/hooks/useFacturation";

/**
 * Contrôle visuel de « Honoraires à facturer », hors authentification.
 *
 * Le composant est le VRAI : ses données sont semées dans le cache de requêtes
 * au lieu d'être servies par l'API. C'est le seul moyen de le regarder sans
 * session, et c'est ce qui permet de vérifier d'un coup d'œil les deux cas que
 * la tête de groupe distingue.
 *
 * Deux clients à un seul dossier — plus de tête de groupe, le nom du client sur
 * la ligne — et un client à trois dossiers, qui la garde avec son sous-total et
 * son lien de facture groupée. Demande CEO du 2026-09-14.
 */
const CABINET = "cab-apercu";

const ligne = (o: Partial<HonorairesRow> & { key: string; clientId: string; clientName: string }): HonorairesRow => ({
  dossierId: `d-${o.key}`,
  dossierNumero: null,
  dossierIntitule: null,
  count: 1,
  totalHeures: 2.5,
  totalHonoraires: 875,
  totalDebours: 0,
  totalForfaits: 0,
  taxesEstimees: 131.03,
  totalAFacturer: 1006.03,
  totalLibre: 1006.03,
  sousSeuil: false,
  lastDate: "2026-08-31",
  plusAncienneDate: "2026-08-31",
  ageMaxJours: 14,
  avocats: ["Me Camille Roy"],
  timeEntryIds: ["t1"],
  expenseIds: [],
  deboursIds: [],
  registreTacheIds: [],
  draftInvoiceIds: [],
  ...o,
});

const ROWS: HonorairesRow[] = [
  ligne({ key: "r1", clientId: "c1", clientName: "Services Longueuil inc.", dossierNumero: "2026-092", dossierIntitule: "Services Longueuil — litige civil" }),
  ligne({ key: "r2", clientId: "c2", clientName: "Tremblay, Marie", dossierNumero: "2026-001", dossierIntitule: "Tremblay c. Commission — révision", totalHeures: 1.5, totalHonoraires: 375, totalAFacturer: 431.16, totalLibre: 431.16, ageMaxJours: 33 }),
  ligne({ key: "r3", clientId: "c3", clientName: "Groupe immobilier Northfield et Associés inc.", dossierNumero: "2026-0042", dossierIntitule: "Northfield c. Ville de Laval", totalHeures: 12.5, totalHonoraires: 3750, totalAFacturer: 4311.56, totalLibre: 4311.56, count: 4, ageMaxJours: 21 }),
  ligne({ key: "r4", clientId: "c3", clientName: "Groupe immobilier Northfield et Associés inc.", dossierNumero: "2026-0051", dossierIntitule: "Northfield — bail commercial", totalHeures: 6, totalHonoraires: 1800, totalAFacturer: 2069.55, totalLibre: 2069.55, count: 2, avocats: ["Me Ngo"], ageMaxJours: 9 }),
  ligne({ key: "r5", clientId: "c3", clientName: "Groupe immobilier Northfield et Associés inc.", dossierNumero: "2026-0060", dossierIntitule: "Northfield — servitude de passage", totalHeures: 3, totalHonoraires: 900, totalAFacturer: 1034.78, totalLibre: 1034.78, ageMaxJours: 5 }),
];

export default function ApercuHonoraires() {
  const [client] = useState(() => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    qc.setQueryData(["facturation", "honoraires", {}], { rows: ROWS, seuil: 100 });
    qc.setQueryData(["temps", "context", CABINET], {
      clients: [], dossiers: [], users: [{ id: "u1", nom: "Me Camille Roy", defaultHourlyRate: 300 }], roundingMinutes: 6,
    });
    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      <div className="min-h-screen bg-si-canvas">
        <div className="mx-auto max-w-[1240px] space-y-4 px-6 py-10">
          <PageHeader
            variant="dashboard"
            title="Honoraires à facturer"
            description="Données fictives. Deux clients à un dossier, un client à trois."
          />
          <HonorairesAFacturerView cabinetId={CABINET} />
        </div>
      </div>
    </QueryClientProvider>
  );
}
