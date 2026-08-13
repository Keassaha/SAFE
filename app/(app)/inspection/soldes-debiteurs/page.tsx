import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import {
  getOpenShortfalls,
  getShortfallsForPeriod,
} from "@/lib/services/fideicommis/trust-shortfall-service";
import { ShortfallsScreen } from "@/components/conformite/ShortfallsScreen";

/**
 * Soldes débiteurs en fidéicommis.
 *
 * Art. 59, 60 B-1 r.5 · s. 9(3), 14 By-Law 9.
 *
 * La détection tourne à chaque écriture depuis CH-10 ; elle n'avait pas d'écran. Un
 * découvert détecté que personne ne voit ne vaut guère mieux qu'un découvert non
 * détecté.
 */

export default async function SoldesDebiteursPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const canEdit = canEditBillingTrust(role as UserRole);
  const now = new Date();

  // Historique sur douze mois : c'est la fenêtre que l'inspecteur demande, et celle
  // du rapport annuel.
  const debut = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));

  const [status, periode] = await Promise.all([
    getOpenShortfalls({ cabinetId, now }),
    getShortfallsForPeriod({ cabinetId, periodStart: debut, periodEnd: now }),
  ]);

  const ouverts = status.lines.map((l) => ({
    id: l.id,
    clientName: l.clientName,
    dossierRef: l.dossierRef,
    amount: l.amount,
    detectedAt: l.detectedAt.toISOString(),
    resolvedAt: null,
    daysToResolve: null,
    source: null,
    daysOpen: l.assessment.daysOpen,
    severityFr: l.assessment.messageFr,
    remedyFr: l.assessment.remedyFr,
    reference: l.assessment.reference,
  }));

  // Historique : les incidents RÉSOLUS de la période. Les ouverts sont déjà au-dessus,
  // les répéter ferait croire à deux fois plus d'incidents qu'il n'y en a.
  const historique = periode
    .filter((l) => l.resolvedAt !== null)
    .map((l) => ({
      id: `${l.clientName}-${l.detectedAt.toISOString()}`,
      clientName: l.clientName,
      dossierRef: l.dossierRef,
      amount: l.amount,
      detectedAt: l.detectedAt.toISOString(),
      resolvedAt: l.resolvedAt ? l.resolvedAt.toISOString() : null,
      daysToResolve: l.daysToResolve,
      source: l.source,
      daysOpen: null,
      severityFr: "",
      remedyFr: "",
      reference: "",
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soldes débiteurs"
        description="Les cartes-clients dont le solde est passé sous zéro, et ce qui a été fait."
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <ShortfallsScreen
        canEdit={canEdit}
        openCount={status.openCount}
        totalOpen={status.totalOpen}
        open={ouverts}
        history={historique}
        options={status.remediationOptions.map((o) => ({
          source: o.source,
          labelFr: o.labelFr,
          reference: o.reference,
          noteFr: o.noteFr,
        }))}
        // Toujours false : ni l'art. 60 ni la s. 14 ne chiffrent de délai. Le champ
        // existe pour que l'écran ne puisse pas inventer une tolérance.
        statutoryDeadlineExists={false}
      />
    </div>
  );
}
