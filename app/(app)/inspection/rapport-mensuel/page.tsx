import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { computeReportDeadline, getReportBlocks } from "@/lib/compliance/monthly-report";
import {
  getMonthlyReport,
  listMonthlyReports,
  getDepositInTransitCandidates,
} from "@/lib/services/fideicommis/monthly-report-service";
import { listTrustBankAccounts } from "@/lib/services/fideicommis/trust-bank-account-service";
import { MonthlyReportScreen } from "@/components/fideicommis/MonthlyReportScreen";

/**
 * Écran du rapport comptable mensuel.
 *
 * Art. 41 B-1 r.5 · s. 18(8) et 22(2) By-Law 9.
 *
 * C'est le premier document qu'un inspecteur demande. Le moteur existait depuis CH-03 ;
 * le cabinet ne pouvait pas le voir. Cet écran est la surface de ce moteur, rien de plus :
 * aucune règle n'est réimplémentée ici, tout vient de `lib/compliance/monthly-report.ts`
 * et du service.
 */

function previousPeriode(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function RapportMensuelPage({
  searchParams,
}: {
  searchParams: Promise<{ rapport?: string; compte?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const params = await searchParams;
  const canEdit = canEditBillingTrust(role as UserRole);
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const now = new Date();

  const [accounts, reports] = await Promise.all([
    listTrustBankAccounts(cabinetId),
    listMonthlyReports(cabinetId),
  ]);

  // Rapport ouvert : celui demandé, sinon le plus récent. L'écran n'ouvre jamais sur
  // un formulaire vide quand un rapport existe déjà.
  const selectedId = params.rapport ?? reports[0]?.id ?? null;
  const detail = selectedId ? await getMonthlyReport({ cabinetId, reportId: selectedId }) : null;

  // Le mois par défaut est le mois ÉCOULÉ, pas le mois courant : on ne rapproche pas
  // un mois qui n'est pas terminé.
  const defaultPeriode = previousPeriode(now);
  const defaultAccountId = params.compte ?? accounts[0]?.id ?? null;

  const depositCandidates =
    canEdit && defaultAccountId
      ? await getDepositInTransitCandidates({
          cabinetId,
          trustBankAccountId: defaultAccountId,
          periode: defaultPeriode,
        }).catch(() => [])
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport comptable mensuel"
        description={
          province === "QC"
            ? "Les sept blocs de l'article 41 du Règlement sur la comptabilité en fidéicommis des avocats."
            : "The monthly comparison required by section 18(8) of By-Law 9."
        }
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <MonthlyReportScreen
        province={province}
        canEdit={canEdit}
        blocks={getReportBlocks(province)}
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.accountLabel,
          last4: a.accountNumberLast4 ?? null,
        }))}
        reports={reports.map((r) => ({
          id: r.id,
          periode: r.periode,
          status: r.status,
          accountLabel: r.trustBankAccount?.accountLabel ?? "—",
          certifiedAt: r.certifiedAt ? r.certifiedAt.toISOString() : null,
          deadline: serializeDeadline(
            computeReportDeadline({ periode: r.periode, province, now }),
          ),
        }))}
        detail={detail ? await serializeDetail(cabinetId, detail) : null}
        defaultPeriode={defaultPeriode}
        defaultAccountId={defaultAccountId}
        depositCandidates={depositCandidates.map((d) => ({
          id: d.transactionId,
          receivedDate: d.receivedDate.toISOString(),
          amount: d.amount,
          clientName: d.clientName,
          dossierRef: d.dossierRef,
        }))}
      />
    </div>
  );
}

function serializeDeadline(d: ReturnType<typeof computeReportDeadline>) {
  return {
    dueAt: d.dueAt ? d.dueAt.toISOString() : null,
    daysRemaining: d.daysRemaining,
    overdue: d.overdue,
    reference: d.reference,
    noteFr: d.noteFr,
  };
}

/**
 * Aplatit le rapport pour le client.
 *
 * Les listes sont envoyées ENTIÈRES, sans troncature. Une liste tronquée à vingt
 * lignes ressemblerait à la liste complète, et c'est exactement le document qu'un
 * inspecteur compte ligne par ligne.
 */
async function serializeDetail(
  cabinetId: string,
  detail: NonNullable<Awaited<ReturnType<typeof getMonthlyReport>>>,
) {
  const r = detail.report;

  const statement = r.bankStatementDocumentId
    ? await prisma.document.findFirst({
        where: { id: r.bankStatementDocumentId, cabinetId },
        select: { id: true, nom: true },
      })
    : null;

  // Relevés candidats : documents du cabinet, les plus récents d'abord. Le rattachement
  // reste un geste humain — SAFE ne devine pas quel PDF est le relevé du mois.
  const documents = r.certifiedAt
    ? []
    : await prisma.document.findMany({
        where: { cabinetId },
        select: { id: true, nom: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

  return {
    id: r.id,
    periode: r.periode,
    status: r.status,
    accountLabel: r.trustBankAccount?.accountLabel ?? "—",
    accountLast4: r.trustBankAccount?.accountNumberLast4 ?? null,
    totalReceipts: r.totalReceipts,
    totalDisbursements: r.totalDisbursements,
    bankStatementBalance: r.bankStatementBalance,
    journalBalance: r.journalBalance,
    ledgerSumBalance: r.ledgerSumBalance,
    outstandingChequesTotal: r.outstandingChequesTotal,
    depositsInTransitTotal: r.depositsInTransitTotal,
    reconciledBalance: r.reconciledBalance,
    ecartBanque: r.ecartBanque,
    ecartCartesClients: r.ecartCartesClients,
    certifiedAt: r.certifiedAt ? r.certifiedAt.toISOString() : null,
    declarationText: r.declarationText,
    bankStatement: statement,
    documents,
    deadline: serializeDeadline(detail.deadline),
    ledgerLines: r.ledgerSnapshot.map((l) => ({
      clientName: l.clientName,
      dossierRef: l.dossierRef,
      lastEntryDate: l.lastEntryDate ? l.lastEntryDate.toISOString() : null,
      balance: l.balance,
    })),
    chequeLines: r.outstandingCheques.map((c) => ({
      chequeNumber: c.chequeNumber,
      issueDate: c.issueDate.toISOString(),
      amount: c.amount,
      payeeName: c.payeeName,
      clientName: c.clientName,
      dossierRef: c.dossierRef,
      stale: c.stale,
    })),
    depositLines: r.depositsInTransit.map((d) => ({
      receivedDate: d.receivedDate.toISOString(),
      amount: d.amount,
      payerName: d.payerName,
      clientName: d.clientName,
      dossierRef: d.dossierRef,
    })),
    discrepancies: r.discrepancies.map((d) => ({
      kind: d.kind,
      amount: d.amount,
      explanation: d.explanation,
    })),
  };
}
