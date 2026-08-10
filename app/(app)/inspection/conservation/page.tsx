import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings, canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  DEFAULT_ACCESS_DAYS,
  MAX_ACCESS_DAYS,
  getPresentationDuties,
} from "@/lib/compliance/inspection-access";
import {
  getPurgeCandidates,
  getRetentionStatus,
} from "@/lib/services/compliance/retention-service";
import { listInspectionSessions } from "@/lib/services/compliance/inspection-access-service";
import { RetentionScreen } from "@/components/conformite/RetentionScreen";

/**
 * Écran de conservation et d'accès de l'inspecteur.
 *
 * Art. 29 à 33 B-1 r.5 · s. 21 à 23 By-Law 9.
 *
 * L'art. 29 est l'article qui fonde vraiment le module inspecteur : les livres sont
 * accessibles en tout temps au syndic, à ses enquêteurs, au directeur de l'inspection
 * professionnelle et à ses experts. L'art. 30 et le par. 21(2) portent sur la FORME —
 * pouvoir imprimer immédiatement — et l'art. 33 sur la reconstitution aux frais de
 * l'avocat. Les trois se lisent ensemble, et c'est pourquoi ils vivent sur un même
 * écran.
 */

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default async function ConservationPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès aux écrans d&apos;inspection.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const canEdit = canManageCabinetSettings(role as UserRole);

  const [status, candidates, sessions] = await Promise.all([
    getRetentionStatus(cabinetId),
    // `includeBlocked` : ce qui n'est PAS encore purgeable est compté, jamais listé.
    // Le montrer ligne à ligne noierait le peu qui est réellement arrivé à échéance.
    getPurgeCandidates({ cabinetId, includeBlocked: true }),
    listInspectionSessions({ cabinetId }),
  ]);

  const purgeables = candidates.filter((c) => c.eligibility.purgeable);
  const bloques = candidates.filter((c) => !c.eligibility.purgeable);

  // Regroupement par dossier : une ligne par pièce donnerait le nombre de dossiers
  // fermés multiplié par le nombre de catégories.
  const parDossier = new Map<
    string,
    { dossierId: string; dossierRef: string | null; labelsFr: string[]; purgeableFrom: Date | null }
  >();
  for (const c of purgeables) {
    const cle = c.dossierId ?? "—";
    const existant = parDossier.get(cle);
    const depuis = c.eligibility.purgeableFrom;
    if (existant) {
      existant.labelsFr.push(c.labelFr);
      if (depuis && (!existant.purgeableFrom || depuis < existant.purgeableFrom)) {
        existant.purgeableFrom = depuis;
      }
    } else {
      parDossier.set(cle, {
        dossierId: c.dossierId ?? "",
        dossierRef: c.dossierRef,
        labelsFr: [c.labelFr],
        purgeableFrom: depuis,
      });
    }
  }

  // La plus proche des échéances encore à venir. Une date manquante veut dire que le
  // compte à rebours n'a pas démarré, pas qu'elle est imminente.
  const prochaine = bloques
    .map((c) => c.eligibility.purgeableFrom)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const fy = status.fiscalYearEnd;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Conservation"
        description={
          province === "QC"
            ? "Combien de temps garder quoi, sous quelle forme, et qui peut consulter vos livres."
            : "How long to keep what, in what form, and who may inspect your books."
        }
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <RetentionScreen
        canEdit={canEdit}
        fiscalYearEndLabel={fy ? `${fy.day} ${MOIS[fy.month - 1]}` : null}
        blockedFr={status.blockedFr}
        rules={status.rules.map((r) => ({
          kind: r.kind,
          labelFr: r.labelFr,
          years: r.years,
          anchor: r.anchor,
          reference: r.reference,
          noteFr: r.noteFr,
        }))}
        formDuties={status.formDuties}
        presentationDuties={getPresentationDuties(province)}
        candidates={[...parDossier.values()]
          .sort((a, b) => (a.purgeableFrom?.getTime() ?? 0) - (b.purgeableFrom?.getTime() ?? 0))
          .map((c) => ({
            dossierId: c.dossierId,
            dossierRef: c.dossierRef,
            labelsFr: c.labelsFr,
            purgeableFrom: c.purgeableFrom ? c.purgeableFrom.toISOString() : null,
          }))}
        notYetCount={bloques.length}
        earliestUpcoming={prochaine ? prochaine.toISOString() : null}
        sessions={sessions.map((s) => ({
          id: s.id,
          inspectorName: s.inspectorName,
          inspectorOrganization: s.inspectorOrganization,
          purpose: s.purpose,
          grantedAt: s.grantedAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          state: s.evaluation.state,
          messageFr: s.evaluation.messageFr,
          readCount: s.readCount,
        }))}
        defaultAccessDays={DEFAULT_ACCESS_DAYS}
        maxAccessDays={MAX_ACCESS_DAYS}
        kitHref={routes.trousseInspection}
      />
    </div>
  );
}
