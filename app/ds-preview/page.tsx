import { SafeLogo } from "@/components/branding/SafeLogo";
import { DesignSystemSpecimen } from "@/components/ds-safe/DesignSystemSpecimen";
import { Button } from "@/components/ui/Button";
import {
  ComplianceStrip,
  PriorityCard,
  TrustCard,
  KpiCard,
  Obligations,
} from "@/components/ds-safe/sections";

/**
 * Spécimen public du design system SAFE. Il monte les mêmes primitives que les
 * écrans de production afin de rendre toute divergence visible immédiatement.
 */
export const dynamic = "force-static";

export default function DsPreviewPage() {
  return (
    <div className="min-h-screen bg-si-canvas text-si-ink font-sans">
      <div className="max-w-content mx-auto px-8 py-10">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <SafeLogo size={30} alt="SAFE" />
          <div>
            <div className="font-serif text-[26px] leading-none text-si-ink">SAFE</div>
            <div className="text-[10px] text-si-muted tracking-wide mt-1">
              Facturation · Fidéicommis · Conformité
            </div>
          </div>
          <span className="ml-auto text-xs text-si-muted">
            Aperçu design — namespace si-* (non branché aux données réelles)
          </span>
        </div>

        {/* Bandeau conformité */}
        <ComplianceStrip
          rightNote="Lundi 23 juin 2026"
          items={[
            { label: "Rapprochement fiducie", value: "À jour", state: "ok" },
            { label: "Certification annuelle", value: "Dans 42 j", state: "ok" },
            { label: "Plafond espèces", value: "Respecté", state: "ok" },
          ]}
        />

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          <PriorityCard
            priority={{
              eyebrow: "Priorité du jour",
              title: "Rapprochez le fidéicommis du mois de mai",
              metrics: [
                { label: "Écart 3 voies", value: "0,00 $" },
                { label: "Dernier rapprochement", value: "il y a 34 j", tone: "amber" },
              ],
            }}
            upNext={[
              { text: "Facturer le travail prêt (393,33 $)", meta: "Facturation", tone: "verified" },
              { text: "Relancer la facture 2026-001", meta: "5 j de retard", tone: "amber" },
              { text: "Préparer la fermeture du dossier Tremblay", meta: "Dossier", tone: "muted" },
            ]}
          >
            <Button>Rapprocher maintenant</Button>
          </PriorityCard>

          <div className="flex flex-col gap-5">
            <TrustCard
              badge="Fidéicommis"
              label="Solde en fidéicommis (clients)"
              amount="12 500,00 $"
              caption="Rapproché le 30 mai · à jour"
            />
            <KpiCard
              title="Ce mois"
              kpis={[
                { label: "Encaissé", value: "4 200,00 $" },
                { label: "À recevoir", value: "2 293,75 $" },
                { label: "Dépenses", value: "850,00 $" },
                { label: "Taux d'encaissement", value: "86 %" },
              ]}
            />
          </div>
        </div>

        {/* Obligations */}
        <div className="mt-5">
          <Obligations
            items={[
              { title: "Rapport annuel LSO", detail: "Échéance 31 mars", status: "À jour", state: "ok" },
              { title: "Rapprochement mensuel", detail: "Mai 2026", status: "À faire", state: "warn" },
              { title: "Assurance responsabilité", detail: "Renouvelée en janvier", status: "OK", state: "ok" },
              { title: "Plafond espèces 7 500 $", detail: "Respecté", status: "OK", state: "ok" },
            ]}
          />
        </div>

        <DesignSystemSpecimen />
      </div>
    </div>
  );
}
