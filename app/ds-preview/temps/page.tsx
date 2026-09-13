"use client";

import { useState } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { RegistreFeuille } from "@/components/ui/registre";
import { TimeEntriesTable } from "@/components/temps/TimeEntriesTable";
import { TimeFiltersBar } from "@/components/temps/TimeFiltersBar";
import { TimeSummaryBar } from "@/components/temps/TimeSummaryBar";
import type { TimeEntryFilters } from "@/types/temps";

/**
 * Aperçu du registre des heures, hors authentification.
 *
 * Sert à vérifier trois choses signalées par le CEO le 12 août 2026 :
 * l'entrée « Supprimer » invisible, le menu qui se mêlait aux rangées du
 * dessous, et l'ouverture de la saisie au clic sur la rangée.
 *
 * La dernière rangée est là exprès : c'est celle dont le menu se faisait
 * rogner par `overflow-x-auto`. Une rangée est marquée « valide » pour que le
 * menu à deux entrées, celui de la capture, se rejoue tel quel.
 *
 * Route publique et temporaire, non branchée à la navigation.
 */
export const dynamic = "force-dynamic";

const JOUR = 86_400_000;
const AUTEUR = { id: "u1", nom: "Me Camille Roy" };

const CLIENT = {
  raisonSociale: "Services Longueuil inc.",
  prenom: null,
  nom: null,
};

function rangee(
  i: number,
  o: {
    description: string;
    minutes: number;
    taux: number;
    statut: string;
    billingStatus: string | null;
  },
) {
  return {
    id: `apercu-${i}`,
    dossierId: `d${i}`,
    clientId: "c1",
    userId: AUTEUR.id,
    date: new Date(Date.now() - i * JOUR).toISOString(),
    dureeMinutes: o.minutes,
    description: o.description,
    typeActivite: "redaction",
    facturable: true,
    statut: o.statut,
    billingStatus: o.billingStatus,
    tauxHoraire: o.taux,
    montant: (o.minutes / 60) * o.taux,
    dossier: {
      id: `d${i}`,
      intitule: "Dossier d'aperçu",
      numeroDossier: `2026-00${10 + i}`,
      reference: null,
      client: CLIENT,
    },
    client: { id: "c1", ...CLIENT },
    user: AUTEUR,
    invoiceLines: [],
  };
}

const ENTREES = [
  rangee(1, { description: "Conférence de gestion", minutes: 150, taux: 350, statut: "valide", billingStatus: null }),
  rangee(2, { description: "Séance de signature", minutes: 90, taux: 275, statut: "brouillon", billingStatus: null }),
  rangee(3, { description: "Dépôt de la demande", minutes: 90, taux: 250, statut: "valide", billingStatus: "BILLED" }),
  rangee(4, { description: "Analyse du dossier et stratégie", minutes: 90, taux: 250, statut: "brouillon", billingStatus: null }),
  rangee(5, { description: "Rédaction de la mise en demeure et des pièces jointes au soutien de la demande", minutes: 165, taux: 250, statut: "valide", billingStatus: null }),
];

export default function ApercuTemps() {
  const [filters, setFilters] = useState<TimeEntryFilters>({});
  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  return (
    <QueryProvider>
      <div className="min-h-screen bg-si-canvas">
        <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <PageHeader
              variant="dashboard"
              title="Temps"
              description="Données fictives. Contrôle visuel des composants réels sur leurs cas limites."
            />
            <div className="flex gap-2 pb-4">
              <Button variant="secondary">Honoraires à facturer</Button>
              <Button variant="primary">Nouvelle entrée</Button>
            </div>
          </div>
          <TimeSummaryBar
            semaineMinutes={750}
            moisMinutes={2892}
            nonFactureMontant={6240}
            nonFactureCount={38}
            tauxFacturablePercent={91}
          />
          <RegistreFeuille ariaLabel="Registre des entrées de temps">
            <TimeFiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              canViewAll
              currentUserId={AUTEUR.id}
              dossiers={[]}
              users={[AUTEUR, { id: "u2", nom: "Me Ngo" }]}
              count={ENTREES.length}
            />
            <TimeEntriesTable
              entries={ENTREES}
              cabinetId="cab-apercu"
              currentUserId={AUTEUR.id}
              clients={[{ id: "c1", raisonSociale: CLIENT.raisonSociale }]}
              dossiers={[]}
              users={[AUTEUR]}
              canEditAll
              onRefresh={() => {}}
            />
          </RegistreFeuille>
        </div>
      </div>
    </QueryProvider>
  );
}
