import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FacturationMainKpis,
  type FacturationMainKpisData,
} from "@/components/facturation/FacturationMainKpis";

/**
 * Controle visuel de l'en-tete de /facturation, hors authentification.
 *
 * Rend le composant REEL sur les chiffres de la capture du CEO, pas sur des
 * valeurs rondes : « 33 282,12 $ » et « En attente d'approbation » sont ce qui
 * dit si une mesure tient dans sa colonne.
 */
export const dynamic = "force-dynamic";

const KPIS: FacturationMainKpisData = {
  facturablesCount: 1,
  facturablesSum: 375,
  verificationCount: 0,
  envoyeesCount: 2,
  envoyeesSum: 5820.62,
  enRetardCount: 15,
  enRetardSum: 33282.12,
  tauxEncaissement: 0,
};

const OUTILS = [
  { titre: "Temps non facturé", indice: "Revenus dormants" },
  { titre: "Débours", indice: "À refacturer" },
  { titre: "Ancienneté des créances", indice: "Impayés par période" },
  { titre: "TPS / TVQ", indice: "Estimation à remettre" },
  { titre: "Rentabilité", indice: "Marge par dossier" },
];

export default function ApercuEntete() {
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <section aria-label="En-tête de facturation" className="space-y-6">
          <PageHeader
            title="Facturation et suivi"
            description="Gérez vos factures : création, validation, envoi et suivi des paiements."
          />
          <FacturationMainKpis kpis={KPIS} />
          {/* Recopie du balisage de la page : l'apercu doit rendre ce que rend
              la page, sinon il valide une composition que personne ne verra. */}
          <nav aria-label="Outils">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {OUTILS.map((o) => (
                <li key={o.titre}>
                  <Link
                    href="#"
                    className="safe-zoom flex h-full flex-col justify-center rounded-[10px] border border-si-line bg-si-surface px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                  >
                    <span className="text-[14px] font-medium leading-5 text-si-ink">{o.titre}</span>
                    <span className="mt-0.5 text-[12px] leading-[17px] text-si-muted">{o.indice}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </div>
    </div>
  );
}
