import { PageHeader } from "@/components/ui/PageHeader";
import { FacturationTable } from "@/components/facturation/FacturationTable";
import { FacturationPagination } from "@/components/facturation/FacturationPagination";
import {
  RegistreBarreOutils,
  RegistreFeuille,
  registreChampClass,
  registreSelectClass,
} from "@/components/ui/registre";
import { RANGEES } from "./donnees";

/**
 * Contrôle visuel du registre de facturation, hors authentification.
 *
 * Rend le composant RÉEL (`FacturationTable`) sur des cas limites (M1) : nom de
 * client très long, intitulé de dossier très long, montant à sept chiffres,
 * facture sans dossier, solde nul, retard relancé, brouillon.
 *
 * Ne touche pas la base, n'est pas branchée à la navigation.
 */
export const dynamic = "force-dynamic";

export default function ApercuFacturation() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] space-y-6 px-6 py-10">
        <PageHeader
          variant="dashboard"
          title="Registre de facturation"
          description="Données fictives. Contrôle visuel du composant réel sur ses cas limites."
        />
        <RegistreFeuille ariaLabel="Liste des factures">
          <RegistreBarreOutils
            recherche={
              <input
                className={`${registreChampClass} w-full px-3`}
                placeholder="Rechercher"
                readOnly
              />
            }
            filtres={
              <div className="flex gap-2">
                <select className={registreSelectClass} disabled>
                  <option>Tous les statuts</option>
                </select>
              </div>
            }
          />
          <FacturationTable invoices={RANGEES} sortBy="dateEmission" sortOrder="desc" />
          <FacturationPagination totalCount={143} currentPage={1} />
        </RegistreFeuille>
      </div>
    </div>
  );
}
