"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { TrustSummaryBarView } from "@/components/fideicommis/TrustSummaryBar";
import { TrustTransactionsRegistre } from "@/components/fideicommis/TransactionsTable";
import { RegistreBarreOutils, RegistreFeuille, registreChampClass, registreSelectClass } from "@/components/ui/registre";
import { RANGEES, RESUME, RAPPROCHEMENT_OK, RAPPROCHEMENT_RETARD, ALERTES_RIEN, ALERTES } from "./donnees";

/**
 * Contrôle visuel du fidéicommis, hors authentification.
 *
 * Rend les composants RÉELS sur des cas limites : tout va bien, puis tout
 * cloche (rapprochement en retard, soldes négatifs, fonds dormants), et le
 * registre avec un nom très long, une correction, une opération sans dossier.
 * Ne touche pas la base, n'est pas branchée à la navigation.
 */
export default function ApercuFideicommis() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] space-y-6 px-6 py-10">
        <PageHeader
          variant="dashboard"
          title="Fidéicommis"
          description="Données fictives. Contrôle visuel des composants réels sur leurs cas limites."
        />
        <TrustSummaryBarView summary={RESUME} reconciliation={RAPPROCHEMENT_OK} alerts={ALERTES_RIEN} />
        <p className="text-[12px] uppercase tracking-[0.08em] text-si-muted">Quand quelque chose cloche</p>
        <TrustSummaryBarView summary={RESUME} reconciliation={RAPPROCHEMENT_RETARD} alerts={ALERTES} />
        <RegistreFeuille ariaLabel="Registre des opérations">
          <RegistreBarreOutils
            recherche={
              <div className="flex gap-2">
                <select className={registreSelectClass} disabled><option>Tous les clients</option></select>
                <select className={registreSelectClass} disabled><option>Tous les dossiers</option></select>
              </div>
            }
            filtres={
              <div className="flex items-center gap-2 text-[13px] text-si-muted">
                Du <input className={`${registreChampClass} px-2`} value="2026-09-01" readOnly />
                Au <input className={`${registreChampClass} px-2`} value="2026-09-30" readOnly />
                <span>7 opérations</span>
              </div>
            }
          />
          <TrustTransactionsRegistre rangees={RANGEES} />
        </RegistreFeuille>
      </div>
    </div>
  );
}
