import { PageHeader } from "@/components/ui/PageHeader";
import { DossierSummaryCards } from "@/components/dossiers/registry/DossierSummaryCards";

/**
 * Contrôle visuel de la barre de synthèse des dossiers, hors authentification.
 *
 * Rend le composant RÉEL. Les nombres ne sont pas ronds et le total est
 * désormais la somme de ses parties : 38 actifs + 126 clôturés + 3 en attente.
 * Avant la décision du 2026-08-27, « Total dossiers » excluait les clôturés et
 * affichait 41 à côté de 126.
 */
export const dynamic = "force-dynamic";

export default function ApercuSyntheseDossiers() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <section aria-label="Synthèse des dossiers" className="space-y-6">
          <PageHeader title="Dossiers" description="Données fictives. Contrôle visuel du composant réel." />
          <DossierSummaryCards
            totalDossiers={167}
            actifsCount={38}
            cloturesCount={126}
            totalActes={312}
            actesEnCours={74}
            actesUrgents={9}
            actesTermines={198}
          />
        </section>
      </div>
    </div>
  );
}
