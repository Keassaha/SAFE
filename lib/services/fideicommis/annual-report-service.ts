/**
 * Rapport comptable annuel — génération et certification.
 *
 * Art. 42 B-1 r.5. **Québec seulement** : By-Law 9 n'impose aucun rapport annuel.
 *
 * L'assemblage réutilise ce qui existe. Les blocs 42(1), 42(2) et 42(3) sont les
 * mêmes listes que celles du rapport mensuel, prises à la fin de la période ; les
 * totaux mensuels du 42(4) viennent des douze rapports mensuels quand ils existent,
 * et du registre append-only sinon. Recalculer différemment ferait diverger deux
 * documents qu'un inspecteur recoupe.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { isChequeStale } from "@/lib/compliance/trust-records";
import {
  annualReportRegime,
  buildAnnualDeclaration,
  computeAnnualReportDeadline,
  findAnnualCertificationBlockers,
  getAnnualBlocks,
  getPeriodMonths,
  type ExecutedAnnualControl,
} from "@/lib/compliance/annual-report";
import { periodBounds } from "./monthly-report-service";

/** Refus motivé, portant la liste complète des blocages (PR-2). */
export class AnnualReportBlockedError extends Error {
  readonly code = "ANNUAL_REPORT_BLOCKED" as const;
  readonly blockers: ReturnType<typeof findAnnualCertificationBlockers>;

  constructor(blockers: ReturnType<typeof findAnnualCertificationBlockers>) {
    super(blockers.map((b) => `${b.messageFr} (${b.reference}) ${b.remedyFr}`).join(" · "));
    this.name = "AnnualReportBlockedError";
    this.blockers = blockers;
  }

  toJSON() {
    return { code: this.code, blockers: this.blockers };
  }
}

/** Garde province : refuse d'appliquer le régime québécois hors Québec. */
async function assertQuebecRegime(cabinetId: string) {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const regime = annualReportRegime(province);
  if (!regime.applies) {
    throw new Error(
      `Le rapport comptable annuel de l'art. 42 ne s'applique pas à ce cabinet. ` +
        `(${regime.reference}) ${regime.noteFr}`,
    );
  }
  return province;
}

export interface GenerateAnnualReportParams {
  cabinetId: string;
  trustBankAccountId: string;
  /** Premier mois de la période de douze mois identifiée dans la demande. */
  periodStart: string;
  /** Solde à la fin de la période figurant au relevé (art. 42(5)). */
  bankStatementBalance: number;
  /** Date de réception de la demande du directeur. Fait courir le délai de 30 jours. */
  requestReceivedAt?: Date | null;
  /** Dépôts que le relevé du dernier mois ne montre pas encore (art. 42(3)). */
  depositInTransitTransactionIds?: string[];
  userId: string;
}

/** Génère (ou régénère) le rapport annuel d'un compte. */
export async function generateAnnualReport(params: GenerateAnnualReportParams) {
  await assertQuebecRegime(params.cabinetId);

  const months = getPeriodMonths({ periodStart: params.periodStart });
  const periodEnd = months[11]!;
  const { start } = periodBounds(months[0]!);
  const { end } = periodBounds(periodEnd);

  const account = await prisma.trustBankAccount.findFirst({
    where: { id: params.trustBankAccountId, cabinetId: params.cabinetId },
  });
  if (!account) throw new Error("Compte en fidéicommis introuvable pour ce cabinet");

  const existing = await prisma.trustAnnualReport.findUnique({
    where: {
      trustBankAccountId_periodStart: {
        trustBankAccountId: params.trustBankAccountId,
        periodStart: params.periodStart,
      },
    },
    select: { id: true, status: true, certifiedAt: true },
  });
  if (existing?.status === "certified" || existing?.certifiedAt) {
    throw new AnnualReportBlockedError(
      findAnnualCertificationBlockers({
        bankStatementAttached: true,
        uncertifiedMonths: [],
        ecartPeriode: 0,
        ecartExplained: false,
        negativeClientBalances: 0,
        alreadyCertified: true,
      }),
    );
  }

  // ── Art. 42(5) — solde au journal à la fin de la période ───────────────────
  const journalAgg = await prisma.trustTransaction.aggregate({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: { lte: end },
    },
    _sum: { amount: true },
  });
  const journalBalance = round2(journalAgg._sum.amount ?? 0);

  // ── Art. 42(4) — totaux de CHAQUE MOIS ────────────────────────────────────
  // Douze couples, pas un seul. C'est la différence la plus visible avec l'art. 41.
  const monthlyReports = await prisma.trustMonthlyReport.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      periode: { in: months },
    },
    select: { periode: true, totalReceipts: true, totalDisbursements: true, status: true },
  });
  const monthlyByPeriode = new Map(monthlyReports.map((m) => [m.periode, m]));

  const monthlyTotals: Array<{
    periode: string;
    totalReceipts: number;
    totalDisbursements: number;
    monthlyReportCertified: boolean;
  }> = [];

  for (const periode of months) {
    const certified = monthlyByPeriode.get(periode);
    if (certified) {
      // Le rapport mensuel existe : on reprend SES chiffres. Les recalculer pourrait
      // donner un total différent de celui déjà certifié.
      monthlyTotals.push({
        periode,
        totalReceipts: certified.totalReceipts,
        totalDisbursements: certified.totalDisbursements,
        monthlyReportCertified: certified.status === "certified",
      });
      continue;
    }
    // Pas de rapport mensuel : on calcule depuis le registre, et le mois est marqué
    // non certifié — ce qui bloquera la certification annuelle.
    const b = periodBounds(periode);
    const tx = await prisma.trustTransaction.findMany({
      where: {
        cabinetId: params.cabinetId,
        trustBankAccountId: params.trustBankAccountId,
        date: { gte: b.start, lte: b.end },
      },
      select: { amount: true },
    });
    monthlyTotals.push({
      periode,
      totalReceipts: round2(tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)),
      totalDisbursements: round2(
        Math.abs(tx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
      ),
      monthlyReportCertified: false,
    });
  }

  // ── Art. 42(1) — soldes de cartes-clients à la fin de la période ───────────
  const groups = await prisma.trustTransaction.groupBy({
    by: ["clientId", "dossierId"],
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: { lte: end },
    },
    _sum: { amount: true },
    _max: { date: true },
  });

  const clientIds = [...new Set(groups.map((g) => g.clientId))];
  const dossierIds = groups.map((g) => g.dossierId).filter((d): d is string => Boolean(d));
  const [clients, dossiers] = await Promise.all([
    clientIds.length
      ? prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, raisonSociale: true, prenom: true, nom: true },
        })
      : Promise.resolve([]),
    dossierIds.length
      ? prisma.dossier.findMany({
          where: { id: { in: [...new Set(dossierIds)] } },
          select: { id: true, numeroDossier: true, intitule: true },
        })
      : Promise.resolve([]),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const dossierById = new Map(dossiers.map((d) => [d.id, d]));

  const ledgerLines = groups
    .map((g) => {
      const c = clientById.get(g.clientId);
      const d = g.dossierId ? dossierById.get(g.dossierId) : null;
      return {
        clientId: g.clientId,
        clientName: c ? clientDisplayName(c, "") || g.clientId : g.clientId,
        dossierId: g.dossierId,
        dossierRef: d ? `${d.numeroDossier ?? ""} ${d.intitule}`.trim() : null,
        balance: round2(g._sum.amount ?? 0),
        lastEntryDate: g._max.date,
      };
    })
    .filter((l) => Math.abs(l.balance) > 0.005)
    .sort((a, b) => a.clientName.localeCompare(b.clientName, "fr"));

  const ledgerSumBalance = round2(ledgerLines.reduce((s, l) => s + l.balance, 0));
  const negativeClientBalances = ledgerLines.filter((l) => l.balance < -0.005).length;

  // ── Art. 42(2) — chèques en circulation à la fin de la période ─────────────
  const cheques = await prisma.trustCheque.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      status: { in: ["ISSUED", "STALE"] },
      issueDate: { lte: end },
    },
    orderBy: { chequeNumber: "asc" },
  });
  const chequeClientIds = [...new Set(cheques.map((c) => c.clientId).filter(Boolean) as string[])];
  const chequeClients = chequeClientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: chequeClientIds } },
        select: { id: true, raisonSociale: true, prenom: true, nom: true },
      })
    : [];
  const chequeClientById = new Map(chequeClients.map((c) => [c.id, c]));

  const chequeLines = cheques.map((c) => {
    const cl = c.clientId ? chequeClientById.get(c.clientId) : null;
    const d = c.dossierId ? dossierById.get(c.dossierId) : null;
    return {
      chequeId: c.id,
      chequeNumber: c.chequeNumber,
      issueDate: c.issueDate,
      amount: c.amount,
      payeeName: c.payeeName,
      clientName: cl ? clientDisplayName(cl, "") : null,
      dossierRef: d ? `${d.numeroDossier ?? ""} ${d.intitule}`.trim() : null,
      stale: isChequeStale(c.issueDate, end),
    };
  });
  const outstandingChequesTotal = round2(chequeLines.reduce((s, c) => s + c.amount, 0));

  // ── Art. 42(3) — recettes en circulation ──────────────────────────────────
  const selectedIds = params.depositInTransitTransactionIds ?? [];
  const transitTx = selectedIds.length
    ? await prisma.trustTransaction.findMany({
        where: {
          id: { in: selectedIds },
          cabinetId: params.cabinetId,
          trustBankAccountId: params.trustBankAccountId,
        },
        include: {
          client: { select: { raisonSociale: true, prenom: true, nom: true } },
          dossier: { select: { numeroDossier: true, intitule: true } },
        },
      })
    : [];
  const transitLines = transitTx.map((t) => ({
    transactionId: t.id,
    receivedDate: t.receivedAt ?? t.date,
    amount: t.amount,
    payerName: t.payerName,
    clientName: t.client ? clientDisplayName(t.client, "") : null,
    dossierRef: t.dossier ? `${t.dossier.numeroDossier ?? ""} ${t.dossier.intitule}`.trim() : null,
  }));
  const depositsInTransitTotal = round2(transitLines.reduce((s, t) => s + t.amount, 0));

  // ── Art. 42(7) — comptes FERMÉS durant la période ─────────────────────────
  // C'est l'obligation qui explique qu'un compte fermé ne soit jamais supprimé.
  const closed = await prisma.trustBankAccount.findMany({
    where: {
      cabinetId: params.cabinetId,
      closedAt: { gte: start, lte: end },
    },
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });
  const closedLines = closed.map((a) => ({
    trustBankAccountId: a.id,
    accountType: a.type,
    accountLabel: a.accountLabel,
    institutionName: a.institutionName,
    accountNumberLast4: a.accountNumberLast4,
    clientName: a.client ? clientDisplayName(a.client, "") : null,
    closedAt: a.closedAt!,
    closureReason: a.closureReason,
  }));

  const reconciledBalance = round2(
    params.bankStatementBalance - outstandingChequesTotal + depositsInTransitTotal,
  );
  const ecartPeriode = round2(reconciledBalance - journalBalance);
  const ecartCartesClients = round2(ledgerSumBalance - journalBalance);

  const report = await prisma.$transaction(async (db) => {
    const saved = existing
      ? await db.trustAnnualReport.update({
          where: { id: existing.id },
          data: {
            periodEnd,
            requestReceivedAt: params.requestReceivedAt ?? undefined,
            journalBalance,
            bankStatementBalance: params.bankStatementBalance,
            ledgerSumBalance,
            outstandingChequesTotal,
            depositsInTransitTotal,
            reconciledBalance,
            ecartPeriode,
            ecartCartesClients,
            status: "draft",
          },
        })
      : await db.trustAnnualReport.create({
          data: {
            cabinetId: params.cabinetId,
            trustBankAccountId: params.trustBankAccountId,
            periodStart: params.periodStart,
            periodEnd,
            requestReceivedAt: params.requestReceivedAt ?? undefined,
            journalBalance,
            bankStatementBalance: params.bankStatementBalance,
            ledgerSumBalance,
            outstandingChequesTotal,
            depositsInTransitTotal,
            reconciledBalance,
            ecartPeriode,
            ecartCartesClients,
          },
        });

    // Les listes sont RECONSTRUITES : elles reflètent l'état du registre, elles ne
    // s'accumulent pas.
    await db.trustAnnualMonthlyTotal.deleteMany({ where: { annualReportId: saved.id } });
    await db.trustAnnualClosedAccount.deleteMany({ where: { annualReportId: saved.id } });
    await db.trustClientLedgerSnapshot.deleteMany({ where: { annualReportId: saved.id } });
    await db.trustOutstandingChequeLine.deleteMany({ where: { annualReportId: saved.id } });
    await db.trustDepositInTransitLine.deleteMany({ where: { annualReportId: saved.id } });

    await db.trustAnnualMonthlyTotal.createMany({
      data: monthlyTotals.map((m) => ({ ...m, annualReportId: saved.id })),
    });
    if (closedLines.length) {
      await db.trustAnnualClosedAccount.createMany({
        data: closedLines.map((c) => ({ ...c, annualReportId: saved.id })),
      });
    }
    if (ledgerLines.length) {
      await db.trustClientLedgerSnapshot.createMany({
        data: ledgerLines.map((l) => ({ ...l, annualReportId: saved.id })),
      });
    }
    if (chequeLines.length) {
      await db.trustOutstandingChequeLine.createMany({
        data: chequeLines.map((c) => ({ ...c, annualReportId: saved.id })),
      });
    }
    if (transitLines.length) {
      await db.trustDepositInTransitLine.createMany({
        data: transitLines.map((t) => ({ ...t, annualReportId: saved.id })),
      });
    }

    return saved;
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: report.id,
    action: "create",
    newValues: {
      type: "annual_report",
      periodStart: params.periodStart,
      periodEnd,
      journalBalance,
      ecartPeriode,
      closedAccounts: closedLines.length,
      uncertifiedMonths: monthlyTotals.filter((m) => !m.monthlyReportCertified).length,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return {
    report,
    blocks: getAnnualBlocks(),
    months,
    monthlyTotals,
    ledgerLines,
    chequeLines,
    transitLines,
    closedLines,
    negativeClientBalances,
    deadline: params.requestReceivedAt
      ? computeAnnualReportDeadline({ requestReceivedAt: params.requestReceivedAt, now: new Date() })
      : null,
  };
}

/**
 * Certifie le rapport annuel.
 *
 * Le contrôle structurant est l'exigence des douze rapports mensuels certifiés. Il
 * découle de la combinaison des art. 40 et 42 — le message le dit, plutôt que de la
 * présenter comme une phrase du règlement.
 */
export async function certifyAnnualReport(params: {
  cabinetId: string;
  annualReportId: string;
  certifiedById: string;
}) {
  await assertQuebecRegime(params.cabinetId);

  const report = await prisma.trustAnnualReport.findFirst({
    where: { id: params.annualReportId, cabinetId: params.cabinetId },
    include: {
      trustBankAccount: { select: { accountLabel: true } },
      monthlyTotals: true,
      closedAccounts: true,
      ledgerSnapshot: true,
      outstandingCheques: true,
      depositsInTransit: true,
    },
  });
  if (!report) throw new Error("Rapport annuel introuvable pour ce cabinet");

  const uncertifiedMonths = report.monthlyTotals
    .filter((m) => !m.monthlyReportCertified)
    .map((m) => m.periode)
    .sort();
  const negativeClientBalances = report.ledgerSnapshot.filter((l) => l.balance < -0.005).length;

  const blockers = findAnnualCertificationBlockers({
    bankStatementAttached: Boolean(report.bankStatementDocumentId),
    uncertifiedMonths,
    ecartPeriode: report.ecartPeriode,
    // Le rapport annuel n'a pas de table de motifs propre : un écart de fin de
    // période s'explique dans les motifs du rapport mensuel du dernier mois.
    ecartExplained: false,
    negativeClientBalances,
    alreadyCertified: report.status === "certified" || report.certifiedAt != null,
  });

  if (blockers.length > 0) {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.certifiedById,
      entityType: "TrustAccount",
      entityId: params.annualReportId,
      action: "update",
      metadata: { blocked: true, reason: "ANNUAL_REPORT_BLOCKED" },
      newValues: { codes: blockers.map((b) => b.code) },
      performedBy: params.certifiedById,
      performedAt: new Date(),
    });
    throw new AnnualReportBlockedError(blockers);
  }

  const controls: ExecutedAnnualControl[] = [
    {
      id: "monthly_reports_certified",
      labelFr: "Les douze rapports comptables mensuels de la période sont certifiés",
      reference: "B-1 r.5, art. 40",
      passed: true,
      evidence: `${report.monthlyTotals.length}/12`,
    },
    {
      id: "ledger_listing_established",
      labelFr:
        "La liste des soldes inscrits aux cartes-clients est établie, avec la date de la dernière inscription",
      reference: "B-1 r.5, art. 42(1)",
      passed: true,
      evidence: `${report.ledgerSnapshot.length} carte(s)-client(s)`,
    },
    {
      id: "outstanding_cheques_listed",
      labelFr: "La liste des chèques en circulation à la fin de la période est établie",
      reference: "B-1 r.5, art. 42(2)",
      passed: true,
      evidence: `${report.outstandingCheques.length} chèque(s)`,
    },
    {
      id: "deposits_in_transit_listed",
      labelFr: "La liste des recettes en circulation à la fin de la période est établie",
      reference: "B-1 r.5, art. 42(3)",
      passed: true,
      evidence: `${report.depositsInTransit.length} recette(s)`,
    },
    {
      id: "monthly_totals",
      labelFr: "Le total des recettes et des débours de chaque mois de la période est établi",
      reference: "B-1 r.5, art. 42(4)",
      passed: true,
      evidence: `${report.monthlyTotals.length} mois`,
    },
    {
      id: "period_comparison",
      labelFr:
        "L'état comparatif est établi et le relevé de l'institution du dernier mois est joint",
      reference: "B-1 r.5, art. 42(5)",
      passed: true,
      evidence: `Écart : ${report.ecartPeriode.toFixed(2)} $`,
    },
    {
      id: "closed_accounts_listed",
      labelFr: "La liste des comptes fermés au cours de la période est établie",
      reference: "B-1 r.5, art. 42(7)",
      passed: true,
      evidence: `${report.closedAccounts.length} compte(s) fermé(s)`,
    },
  ];

  const now = new Date();
  const updated = await prisma.trustAnnualReport.update({
    where: { id: params.annualReportId },
    data: {
      status: "certified",
      certifiedAt: now,
      certifiedById: params.certifiedById,
      snapshotJson: JSON.stringify({
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        accountLabel: report.trustBankAccount.accountLabel,
        totals: {
          journalBalance: report.journalBalance,
          ledgerSumBalance: report.ledgerSumBalance,
          bankStatementBalance: report.bankStatementBalance,
          reconciledBalance: report.reconciledBalance,
          ecartPeriode: report.ecartPeriode,
        },
        monthlyTotals: report.monthlyTotals,
        ledgerSnapshot: report.ledgerSnapshot,
        outstandingCheques: report.outstandingCheques,
        depositsInTransit: report.depositsInTransit,
        closedAccounts: report.closedAccounts,
        certifiedAt: now.toISOString(),
      }),
      verifiedControlsJson: JSON.stringify(controls),
      declarationText: buildAnnualDeclaration({
        controls,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        accountLabel: report.trustBankAccount.accountLabel,
      }),
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.certifiedById,
    entityType: "TrustAccount",
    entityId: params.annualReportId,
    action: "update",
    newValues: {
      type: "annual_report_certified",
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
    },
    performedBy: params.certifiedById,
    performedAt: now,
  });

  return updated;
}

/** Rattache le relevé du dernier mois de la période (art. 42(5)). */
export async function attachAnnualBankStatement(params: {
  cabinetId: string;
  annualReportId: string;
  documentId: string;
  userId: string;
}): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id: params.documentId, cabinetId: params.cabinetId },
    select: { id: true },
  });
  if (!doc) throw new Error("Relevé introuvable pour ce cabinet");

  await prisma.trustAnnualReport.updateMany({
    where: { id: params.annualReportId, cabinetId: params.cabinetId, certifiedAt: null },
    data: { bankStatementDocumentId: params.documentId },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.annualReportId,
    action: "update",
    newValues: { type: "annual_bank_statement_attached", documentId: params.documentId },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/** Consigne la transmission au directeur de l'inspection professionnelle. */
export async function markAnnualReportSubmitted(params: {
  cabinetId: string;
  annualReportId: string;
  submittedAt: Date;
  documentId?: string | null;
  userId: string;
}): Promise<void> {
  await prisma.trustAnnualReport.updateMany({
    where: { id: params.annualReportId, cabinetId: params.cabinetId },
    data: {
      submittedAt: params.submittedAt,
      submissionDocumentId: params.documentId ?? undefined,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.annualReportId,
    action: "update",
    newValues: {
      type: "annual_report_submitted",
      submittedAt: params.submittedAt.toISOString(),
      recipient: "Directeur de l'inspection professionnelle",
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/**
 * Un rapport annuel et tout ce qu'il porte.
 *
 * Les blocages sont RECALCULÉS à la lecture plutôt que stockés : un mois certifié
 * après coup doit débloquer l'écran sans qu'on ait à reproduire le rapport. Sur un
 * rapport déjà certifié, la fonction renvoie l'unique blocage « déjà certifié », ce
 * que l'écran n'affiche pas — l'état certifié se lit à la déclaration figée.
 */
export async function getAnnualReport(params: { cabinetId: string; annualReportId: string }) {
  const report = await prisma.trustAnnualReport.findFirst({
    where: { id: params.annualReportId, cabinetId: params.cabinetId },
    include: {
      trustBankAccount: { select: { accountLabel: true, accountNumberLast4: true } },
      monthlyTotals: { orderBy: { periode: "asc" } },
      closedAccounts: { orderBy: { closedAt: "asc" } },
      ledgerSnapshot: true,
      outstandingCheques: true,
      depositsInTransit: true,
    },
  });
  if (!report) return null;

  const blockers = findAnnualCertificationBlockers({
    bankStatementAttached: Boolean(report.bankStatementDocumentId),
    uncertifiedMonths: report.monthlyTotals
      .filter((m) => !m.monthlyReportCertified)
      .map((m) => m.periode)
      .sort(),
    ecartPeriode: report.ecartPeriode,
    ecartExplained: false,
    negativeClientBalances: report.ledgerSnapshot.filter((l) => l.balance < -0.005).length,
    alreadyCertified: report.status === "certified" || report.certifiedAt != null,
  });

  return {
    report,
    blocks: getAnnualBlocks(),
    blockers,
    deadline:
      report.requestReceivedAt && !report.submittedAt
        ? computeAnnualReportDeadline({
            requestReceivedAt: report.requestReceivedAt,
            now: new Date(),
          })
        : null,
  };
}

/** Rapports annuels du cabinet, avec leur échéance quand une demande est en cours. */
export async function listAnnualReports(cabinetId: string) {
  const reports = await prisma.trustAnnualReport.findMany({
    where: { cabinetId },
    orderBy: [{ periodStart: "desc" }],
    include: {
      trustBankAccount: { select: { accountLabel: true, accountNumberLast4: true } },
      _count: { select: { monthlyTotals: true, closedAccounts: true, ledgerSnapshot: true } },
    },
  });

  const now = new Date();
  return reports.map((r) => ({
    ...r,
    deadline:
      r.requestReceivedAt && !r.submittedAt
        ? computeAnnualReportDeadline({ requestReceivedAt: r.requestReceivedAt, now })
        : null,
  }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
