import { requireCabinetAndUser } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";
import { ComplianceDashboard } from "@/components/conformite/ComplianceDashboard";
import { ReadinessOverview } from "@/components/conformite/ReadinessOverview";
import { TrustDetailPanel, type TrustDetailLine } from "@/components/conformite/TrustDetailPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";
import { getCabinetReadiness } from "@/lib/admin/readiness";
import {
  getGlobalTrustBalance,
  getTrustBalancesByDossier,
  getReconciliationStatus,
} from "@/lib/services/fideicommis";

/** Flag d'exposition du readiness au cabinet (étape 3). Off = comportement historique. */
const COMPLIANCE_DASHBOARD_V2 =
  process.env.COMPLIANCE_DASHBOARD_V2 === "1" || process.env.COMPLIANCE_DASHBOARD_V2 === "true";

/** Construit le détail fidéicommis par dossier (solde + libellé lisible). */
async function buildTrustDetail(cabinetId: string, province: string | null) {
  const [balances, total, reconciliation] = await Promise.all([
    getTrustBalancesByDossier(cabinetId),
    getGlobalTrustBalance(cabinetId),
    getReconciliationStatus(cabinetId, province),
  ]);

  if (balances.length === 0 && Math.abs(total) < 0.005) return null;

  const clientIds = [...new Set(balances.map((b) => b.clientId))];
  const dossierIds = [...new Set(balances.map((b) => b.dossierId).filter((x): x is string => !!x))];
  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({ where: { cabinetId, id: { in: clientIds } }, select: { id: true, raisonSociale: true } }),
    prisma.dossier.findMany({ where: { cabinetId, id: { in: dossierIds } }, select: { id: true, intitule: true, numeroDossier: true } }),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.raisonSociale ?? "—"]));
  const dossierLabel = new Map(dossiers.map((d) => [d.id, d.numeroDossier ? `${d.numeroDossier} — ${d.intitule}` : d.intitule]));

  const lines: TrustDetailLine[] = balances.map((b) => ({
    clientId: b.clientId,
    dossierId: b.dossierId,
    balance: b.balance,
    label: b.dossierId
      ? `${clientName.get(b.clientId) ?? "—"} · ${dossierLabel.get(b.dossierId) ?? "—"}`
      : `${clientName.get(b.clientId) ?? "—"}`,
  }));

  return {
    total,
    reconciliationStatus: (reconciliation.critical ? "critical" : reconciliation.overdue ? "overdue" : "ok") as
      | "ok"
      | "overdue"
      | "critical",
    expectedPeriode: reconciliation.expectedPeriode,
    lastCertified: reconciliation.lastCertifiedPeriode,
    lines,
  };
}

export default async function ConformitePage() {
  const { cabinetId } = await requireCabinetAndUser();
  const province = await getCabinetProvince(cabinetId);
  const copy = getTrustRegulatorCopy(province);

  // V2 : le vrai moteur de readiness (14 domaines) en tête, l'opérationnel dessous.
  const report = COMPLIANCE_DASHBOARD_V2 ? await getCabinetReadiness(cabinetId) : null;

  if (COMPLIANCE_DASHBOARD_V2 && report) {
    const t = await getTranslations("conformite");
    const trustDetail = await buildTrustDetail(cabinetId, province);
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader title={copy.complianceTitle} description={copy.complianceDesc} />
          <a
            href="/api/conformite/dossier-inspection"
            className="inline-flex shrink-0 items-center gap-2 rounded-[var(--safe-radius)] bg-si-forest px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("generateInspectionBundle")}
          </a>
        </div>

        <ReadinessOverview report={report} />

        {trustDetail && <TrustDetailPanel detail={trustDetail} isQuebec={copy.isQuebec} />}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-si-ink">{t("operationalHeading")}</h2>
            <p className="text-sm text-si-muted">{t("operationalSubtitle")}</p>
          </div>
          <ComplianceDashboard />
        </section>
      </div>
    );
  }

  // Comportement historique (flag off ou snapshot indisponible).
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={copy.complianceTitle} description={copy.complianceDesc} />
      <ComplianceDashboard />
    </div>
  );
}
