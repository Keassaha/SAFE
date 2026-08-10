import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { annualReportRegime, getAnnualBlocks } from "@/lib/compliance/annual-report";
import {
  getAnnualReport,
  listAnnualReports,
} from "@/lib/services/fideicommis/annual-report-service";
import { listTrustBankAccounts } from "@/lib/services/fideicommis/trust-bank-account-service";
import { AnnualReportScreen } from "@/components/conformite/AnnualReportScreen";
import { Panel } from "@/components/conformite/primitives";

/**
 * Écran du rapport comptable annuel.
 *
 * Art. 42 B-1 r.5 — Québec seulement.
 *
 * By-Law 9, lu intégralement, n'impose AUCUN rapport annuel : ses obligations
 * périodiques s'arrêtent à la comparaison mensuelle. Un cabinet ontarien ne voit donc
 * pas cet écran mais la raison de son absence, sourcée. Lui afficher le formulaire lui
 * ferait croire à une obligation qu'il n'a pas ; le masquer sans rien dire lui ferait
 * croire à un trou dans le produit.
 */

/** Douze mois pleins qui précèdent le mois courant. */
function defaultPeriodStart(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function RapportAnnuelPage({
  searchParams,
}: {
  searchParams: Promise<{ rapport?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const regime = annualReportRegime(province);

  const header = (
    <PageHeader
      title="Rapport comptable annuel"
      description={
        regime.applies
          ? "Les sept blocs de l'article 42, dont deux n'existent qu'ici : les totaux de chaque mois et les comptes fermés."
          : "Cette obligation n'existe pas en Ontario."
      }
      backHref={routes.inspection}
      backLabel="Retour à l'inspection"
    />
  );

  if (!regime.applies) {
    return (
      <div className="animate-fade-in space-y-6">
        {header}
        <Panel className="p-6">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Aucun rapport annuel n&apos;est exigé de votre cabinet
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            {regime.noteFr}
          </p>
          <p className="mt-3 text-xs text-[var(--si-muted)]">{regime.reference}</p>
        </Panel>
      </div>
    );
  }

  const params = await searchParams;
  const canEdit = canEditBillingTrust(role as UserRole);

  const [accounts, reports] = await Promise.all([
    listTrustBankAccounts(cabinetId),
    listAnnualReports(cabinetId),
  ]);

  // Rapport ouvert : celui demandé, sinon le plus récent. On n'ouvre jamais sur un
  // formulaire vide quand un rapport existe déjà.
  const selectedId = params.rapport ?? reports[0]?.id ?? null;
  const detail = selectedId
    ? await getAnnualReport({ cabinetId, annualReportId: selectedId })
    : null;

  return (
    <div className="animate-fade-in space-y-6">
      {header}

      <AnnualReportScreen
        canEdit={canEdit}
        blocks={getAnnualBlocks()}
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.accountLabel,
          last4: a.accountNumberLast4 ?? null,
        }))}
        reports={reports.map((r) => ({
          id: r.id,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          certifiedAt: r.certifiedAt ? r.certifiedAt.toISOString() : null,
        }))}
        detail={detail ? serializeDetail(detail) : null}
        defaultPeriodStart={defaultPeriodStart(new Date())}
      />
    </div>
  );
}

/**
 * Aplatit le rapport pour le client.
 *
 * Les trois listes de l'art. 42(1)(2)(3) ne sont pas envoyées ligne à ligne : elles
 * sont volumineuses, elles s'impriment depuis les registres, et un extrait tronqué
 * ressemblerait à la liste complète. Seul leur décompte figure ici.
 */
function serializeDetail(detail: NonNullable<Awaited<ReturnType<typeof getAnnualReport>>>) {
  const r = detail.report;
  return {
    id: r.id,
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
    accountLabel: r.trustBankAccount?.accountLabel ?? "—",
    accountLast4: r.trustBankAccount?.accountNumberLast4 ?? null,
    bankStatementBalance: r.bankStatementBalance,
    journalBalance: r.journalBalance,
    ledgerSumBalance: r.ledgerSumBalance,
    outstandingChequesTotal: r.outstandingChequesTotal,
    depositsInTransitTotal: r.depositsInTransitTotal,
    reconciledBalance: r.reconciledBalance,
    ecartPeriode: r.ecartPeriode,
    ecartCartesClients: r.ecartCartesClients,
    certifiedAt: r.certifiedAt ? r.certifiedAt.toISOString() : null,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    declarationText: r.declarationText,
    deadline: detail.deadline
      ? {
          dueAt: detail.deadline.dueAt.toISOString(),
          daysRemaining: detail.deadline.daysRemaining,
          overdue: detail.deadline.overdue,
          noteFr: detail.deadline.noteFr,
        }
      : null,
    monthlyTotals: r.monthlyTotals.map((m) => ({
      periode: m.periode,
      totalReceipts: m.totalReceipts,
      totalDisbursements: m.totalDisbursements,
      certified: m.monthlyReportCertified,
    })),
    closedAccounts: r.closedAccounts.map((c) => ({
      accountLabel: c.accountLabel,
      accountType: c.accountType,
      institutionName: c.institutionName,
      clientName: c.clientName,
      closedAt: c.closedAt.toISOString(),
      closureReason: c.closureReason,
    })),
    ledgerCount: r.ledgerSnapshot.length,
    chequeCount: r.outstandingCheques.length,
    depositCount: r.depositsInTransit.length,
    blockers: detail.blockers.map((b) => ({
      code: b.code,
      messageFr: b.messageFr,
      reference: b.reference,
      remedyFr: b.remedyFr,
    })),
  };
}
