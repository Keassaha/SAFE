import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { getPresentationDuties } from "@/lib/compliance/inspection-access";
import { buildInspectionKit } from "@/lib/services/compliance/inspection-kit-service";
import { InspectionKitScreen } from "@/components/conformite/InspectionKitScreen";

/**
 * Trousse d'inspection.
 *
 * Art. 29 B-1 r.5 (accès en tout temps du syndic et de l'inspection) · art. 30 (copie
 * papier immédiate) · art. 33 (reconstitution aux frais de l'avocat) · By-Law 9,
 * par. 21(2).
 *
 * L'écran assemble la trousse À CHAQUE CHARGEMENT plutôt qu'au clic. C'est plus coûteux,
 * et c'est le point : le cabinet doit voir ce qui manque AVANT de remettre l'archive,
 * pas le découvrir devant l'inspecteur.
 */

function defaultPeriod(now: Date): { from: string; to: string } {
  // Douze mois glissants : c'est la fenêtre que l'inspecteur demande, et la période
  // du rapport annuel de l'art. 42.
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const from = new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth() + 1, 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function TrousseInspectionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const params = await searchParams;
  const now = new Date();
  const fallback = defaultPeriod(now);
  const isDay = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

  const from = isDay(params.from) ? params.from! : fallback.from;
  const to = isDay(params.to) ? params.to! : fallback.to;

  const periodFrom = new Date(`${from}T00:00:00.000Z`);
  const periodTo = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000 - 1);

  const province = resolveProvince(await getCabinetProvince(cabinetId));

  const kit = await buildInspectionKit({
    cabinetId,
    periodFrom,
    periodTo,
    generatedBy: userId,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Trousse d'inspection"
        description="Tout ce qu'un inspecteur demande, rassemblé pour une période, avec ce qui manque nommé."
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <InspectionKitScreen
        from={from}
        to={to}
        province={province}
        cabinetName={kit.cabinetName}
        missingCount={kit.missingCount}
        manifestFingerprint={kit.manifestFingerprint}
        manifest={kit.manifest}
        duties={getPresentationDuties(province)}
        items={kit.items.map((i) => ({
          kind: i.kind,
          filename: i.filename,
          titleFr: i.titleFr,
          reference: i.reference,
          rowCount: i.rowCount,
          fingerprint: i.fingerprint,
          missingReasonFr: i.missingReasonFr,
        }))}
      />
    </div>
  );
}
