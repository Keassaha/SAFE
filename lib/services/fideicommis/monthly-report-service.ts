/**
 * Rapport comptable mensuel — génération et certification.
 *
 * Art. 40 B-1 r.5 : registre permanent des rapports mensuels de CHAQUE compte général.
 * Art. 41 : sept blocs, dont quatre listes détaillées ligne par ligne.
 * s. 18(8) By-Law 9 : comparaison mensuelle + liste détaillée par client +
 * rapprochement détaillé de chaque compte + « the reasons for any differences ».
 * s. 22(2) : dans les 25 jours suivant la fin du mois.
 *
 * C'est le livrable que l'inspecteur demande en premier, et c'est celui que SAFE ne
 * pouvait pas produire : `chequesEnCirculation` était un nombre saisi à la main là où
 * l'art. 41(2) exige une liste avec numéro, date d'émission, client et dossier.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { isChequeStale } from "@/lib/compliance/trust-records";
import {
  buildReportDeclaration,
  computeReportDeadline,
  findCertificationBlockers,
  getReportBlocks,
  type ExecutedReportControl,
} from "@/lib/compliance/monthly-report";

/** Refus de certification, portant la liste complète des blocages (PR-2). */
export class MonthlyReportBlockedError extends Error {
  readonly code = "MONTHLY_REPORT_BLOCKED" as const;
  readonly blockers: ReturnType<typeof findCertificationBlockers>;

  constructor(blockers: ReturnType<typeof findCertificationBlockers>) {
    super(blockers.map((b) => `${b.messageFr} (${b.reference}) ${b.remedyFr}`).join(" · "));
    this.name = "MonthlyReportBlockedError";
    this.blockers = blockers;
  }

  toJSON() {
    return { code: this.code, blockers: this.blockers };
  }
}

/** Bornes UTC d'une période "YYYY-MM". */
export function periodBounds(periode: string): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    throw new Error("La période doit être au format YYYY-MM");
  }
  const [year, month] = periode.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year!, month! - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year!, month!, 0, 23, 59, 59, 999)),
  };
}

/* ════════════════════════════════════════════════════════════════
   RECETTES EN CIRCULATION — art. 41(3)
   ════════════════════════════════════════════════════════════════ */

/**
 * Candidats aux « recettes en circulation ».
 *
 * Une recette en circulation est une somme inscrite au journal mais que la banque n'a
 * pas encore créditée. SAFE ne dispose d'AUCUNE donnée bancaire : il ne peut donc pas
 * la déduire. Prétendre le contraire produirait un rapport faux.
 *
 * On propose donc les dépôts de la période, et c'est l'utilisateur qui coche ceux qui
 * n'apparaissent pas au relevé — exactement le geste que fait un teneur de livres en
 * comparant le journal au relevé. La sélection est explicite, jamais devinée.
 */
export async function getDepositInTransitCandidates(params: {
  cabinetId: string;
  trustBankAccountId: string;
  periode: string;
}) {
  const { start, end } = periodBounds(params.periode);
  const deposits = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: { gte: start, lte: end },
      amount: { gt: 0 },
    },
    orderBy: { date: "desc" },
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  return deposits.map((d) => ({
    transactionId: d.id,
    receivedDate: d.receivedAt ?? d.date,
    amount: d.amount,
    payerName: d.payerName,
    clientName: d.client ? clientDisplayName(d.client, "") : null,
    dossierRef: d.dossier ? `${d.dossier.numeroDossier ?? ""} ${d.dossier.intitule}`.trim() : null,
  }));
}

/* ════════════════════════════════════════════════════════════════
   GÉNÉRATION
   ════════════════════════════════════════════════════════════════ */

export interface GenerateMonthlyReportParams {
  cabinetId: string;
  trustBankAccountId: string;
  periode: string;
  /** Solde à la fin du mois figurant au relevé de l'institution (art. 41(5)). */
  bankStatementBalance: number;
  /** Identifiants des dépôts que le relevé ne montre pas encore (art. 41(3)). */
  depositInTransitTransactionIds?: string[];
  userId: string;
}

/**
 * Génère (ou régénère) le rapport mensuel d'un compte.
 *
 * Un rapport CERTIFIÉ n'est jamais régénéré (PR-5) : c'est un instantané daté que
 * l'inspecteur compare à d'autres. Le régénérer réécrirait l'histoire.
 */
export async function generateMonthlyReport(params: GenerateMonthlyReportParams) {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const { start, end } = periodBounds(params.periode);

  const account = await prisma.trustBankAccount.findFirst({
    where: { id: params.trustBankAccountId, cabinetId: params.cabinetId },
  });
  if (!account) throw new Error("Compte en fidéicommis introuvable pour ce cabinet");

  const existing = await prisma.trustMonthlyReport.findUnique({
    where: {
      trustBankAccountId_periode: {
        trustBankAccountId: params.trustBankAccountId,
        periode: params.periode,
      },
    },
    select: { id: true, status: true, certifiedAt: true },
  });
  if (existing?.status === "certified" || existing?.certifiedAt) {
    throw new MonthlyReportBlockedError(
      findCertificationBlockers(
        {
          bankStatementAttached: true,
          ecartBanque: 0,
          ecartCartesClients: 0,
          bankDiscrepancyExplained: false,
          ledgerDiscrepancyExplained: false,
          negativeClientBalances: 0,
          ledgerLineCount: 1,
          alreadyCertified: true,
        },
        province,
      ),
    );
  }

  // ── Art. 41(5) — solde au journal de caisse à la fin du mois ───────────────
  const journalAgg = await prisma.trustTransaction.aggregate({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: { lte: end },
    },
    _sum: { amount: true },
  });
  const journalBalance = round2(journalAgg._sum.amount ?? 0);

  // ── Art. 41(4) — total des recettes et des débours DU MOIS ─────────────────
  const monthTx = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: { gte: start, lte: end },
    },
    select: { amount: true },
  });
  const totalReceipts = round2(monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0));
  const totalDisbursements = round2(
    Math.abs(monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
  );

  // ── Art. 41(1) — liste des soldes de cartes-clients, avec la date de la
  //    DERNIÈRE INSCRIPTION. C'est le champ que SAFE n'avait nulle part.
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
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
    }),
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
    // Une carte-client soldée à zéro ne figure pas à la liste des soldes : le texte
    // dit « la liste des SOLDES inscrits aux cartes-clients ».
    .filter((l) => Math.abs(l.balance) > 0.005)
    .sort((a, b) => a.clientName.localeCompare(b.clientName, "fr"));

  const ledgerSumBalance = round2(ledgerLines.reduce((s, l) => s + l.balance, 0));
  const negativeClientBalances = ledgerLines.filter((l) => l.balance < -0.005).length;

  // ── Art. 41(2) — liste des chèques en circulation ──────────────────────────
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

  // ── Art. 41(3) — liste des recettes en circulation ─────────────────────────
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

  // ── Art. 41(5) — état comparatif ───────────────────────────────────────────
  const reconciledBalance = round2(
    params.bankStatementBalance - outstandingChequesTotal + depositsInTransitTotal,
  );
  const ecartBanque = round2(reconciledBalance - journalBalance);
  const ecartCartesClients = round2(ledgerSumBalance - journalBalance);

  const report = await prisma.$transaction(async (db) => {
    const saved = existing
      ? await db.trustMonthlyReport.update({
          where: { id: existing.id },
          data: {
            totalReceipts,
            totalDisbursements,
            bankStatementBalance: params.bankStatementBalance,
            journalBalance,
            ledgerSumBalance,
            outstandingChequesTotal,
            depositsInTransitTotal,
            reconciledBalance,
            ecartBanque,
            ecartCartesClients,
            status: "draft",
          },
        })
      : await db.trustMonthlyReport.create({
          data: {
            cabinetId: params.cabinetId,
            trustBankAccountId: params.trustBankAccountId,
            periode: params.periode,
            totalReceipts,
            totalDisbursements,
            bankStatementBalance: params.bankStatementBalance,
            journalBalance,
            ledgerSumBalance,
            outstandingChequesTotal,
            depositsInTransitTotal,
            reconciledBalance,
            ecartBanque,
            ecartCartesClients,
          },
        });

    // Les listes sont RECONSTRUITES à chaque génération : elles reflètent l'état du
    // registre, elles ne s'accumulent pas.
    await db.trustClientLedgerSnapshot.deleteMany({ where: { reportId: saved.id } });
    await db.trustOutstandingChequeLine.deleteMany({ where: { reportId: saved.id } });
    await db.trustDepositInTransitLine.deleteMany({ where: { reportId: saved.id } });

    if (ledgerLines.length) {
      await db.trustClientLedgerSnapshot.createMany({
        data: ledgerLines.map((l) => ({ ...l, reportId: saved.id })),
      });
    }
    if (chequeLines.length) {
      await db.trustOutstandingChequeLine.createMany({
        data: chequeLines.map((c) => ({ ...c, reportId: saved.id })),
      });
    }
    if (transitLines.length) {
      await db.trustDepositInTransitLine.createMany({
        data: transitLines.map((t) => ({ ...t, reportId: saved.id })),
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
      type: "monthly_report",
      periode: params.periode,
      journalBalance,
      ledgerSumBalance,
      ecartBanque,
      ecartCartesClients,
      ledgerLines: ledgerLines.length,
      outstandingCheques: chequeLines.length,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return {
    report,
    province,
    blocks: getReportBlocks(province),
    deadline: computeReportDeadline({ periode: params.periode, province, now: new Date() }),
    ledgerLines,
    chequeLines,
    transitLines,
    negativeClientBalances,
  };
}

/* ════════════════════════════════════════════════════════════════
   MOTIFS D'ÉCART — s. 18(8) ON
   ════════════════════════════════════════════════════════════════ */

/** Consigne le motif d'un écart. Sans lui, la certification est refusée. */
export async function recordDiscrepancyReason(params: {
  cabinetId: string;
  reportId: string;
  kind: "BANK" | "LEDGER";
  amount: number;
  explanation: string;
  userId: string;
}): Promise<{ id: string }> {
  const report = await prisma.trustMonthlyReport.findFirst({
    where: { id: params.reportId, cabinetId: params.cabinetId },
    select: { id: true, status: true },
  });
  if (!report) throw new Error("Rapport introuvable pour ce cabinet");
  if (report.status === "certified") {
    throw new Error("Ce rapport est certifié : il ne peut plus être modifié.");
  }
  if (!params.explanation.trim()) {
    throw new Error("Le motif de l'écart ne peut pas être vide (By-Law 9, s. 18(8)).");
  }

  const created = await prisma.trustDiscrepancyReason.create({
    data: {
      reportId: params.reportId,
      kind: params.kind,
      amount: params.amount,
      explanation: params.explanation.trim(),
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.reportId,
    action: "update",
    newValues: { type: "discrepancy_reason", kind: params.kind, amount: params.amount },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return created;
}

/** Rattache le relevé bancaire du mois (art. 41(7)). */
export async function attachBankStatement(params: {
  cabinetId: string;
  reportId: string;
  documentId: string;
  userId: string;
}): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id: params.documentId, cabinetId: params.cabinetId },
    select: { id: true },
  });
  if (!doc) throw new Error("Relevé introuvable pour ce cabinet");

  await prisma.trustMonthlyReport.updateMany({
    where: { id: params.reportId, cabinetId: params.cabinetId, certifiedAt: null },
    data: { bankStatementDocumentId: params.documentId },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.reportId,
    action: "update",
    newValues: { type: "bank_statement_attached", documentId: params.documentId },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/* ════════════════════════════════════════════════════════════════
   CERTIFICATION
   ════════════════════════════════════════════════════════════════ */

/**
 * Certifie le rapport mensuel.
 *
 * Les contrôles exécutés sont sérialisés, et l'attestation est générée à partir
 * d'eux (PR-3). Le rapport est figé (PR-5) : `snapshotJson` conserve les listes
 * telles qu'elles étaient au moment de la signature, indépendamment de toute
 * écriture ultérieure.
 */
export async function certifyMonthlyReport(params: {
  cabinetId: string;
  reportId: string;
  certifiedById: string;
}) {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const report = await prisma.trustMonthlyReport.findFirst({
    where: { id: params.reportId, cabinetId: params.cabinetId },
    include: {
      trustBankAccount: { select: { accountLabel: true } },
      ledgerSnapshot: true,
      outstandingCheques: true,
      depositsInTransit: true,
      discrepancies: true,
    },
  });
  if (!report) throw new Error("Rapport introuvable pour ce cabinet");

  const negativeClientBalances = report.ledgerSnapshot.filter((l) => l.balance < -0.005).length;
  const bankDiscrepancyExplained = report.discrepancies.some((d) => d.kind === "BANK");
  const ledgerDiscrepancyExplained = report.discrepancies.some((d) => d.kind === "LEDGER");

  const blockers = findCertificationBlockers(
    {
      bankStatementAttached: Boolean(report.bankStatementDocumentId),
      ecartBanque: report.ecartBanque,
      ecartCartesClients: report.ecartCartesClients,
      bankDiscrepancyExplained,
      ledgerDiscrepancyExplained,
      negativeClientBalances,
      ledgerLineCount: report.ledgerSnapshot.length,
      alreadyCertified: report.status === "certified" || report.certifiedAt != null,
    },
    province,
  );

  if (blockers.length > 0) {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.certifiedById,
      entityType: "TrustAccount",
      entityId: params.reportId,
      action: "update",
      metadata: { blocked: true, reason: "MONTHLY_REPORT_BLOCKED" },
      newValues: { codes: blockers.map((b) => b.code) },
      performedBy: params.certifiedById,
      performedAt: new Date(),
    });
    throw new MonthlyReportBlockedError(blockers);
  }

  const controls: ExecutedReportControl[] = [
    {
      id: "bank_statement_attached",
      labelFr: "Le relevé de l'institution financière du mois est joint au rapport",
      reference: province === "QC" ? "B-1 r.5, art. 41(7)" : "By-Law 9, s. 18(10)",
      passed: true,
      evidence: report.bankStatementDocumentId,
    },
    {
      id: "ledger_listing_established",
      labelFr:
        "La liste des soldes inscrits aux cartes-clients est établie, avec la date de la dernière inscription",
      reference: province === "QC" ? "B-1 r.5, art. 41(1)" : "By-Law 9, s. 18(8)i",
      passed: true,
      evidence: `${report.ledgerSnapshot.length} carte(s)-client(s)`,
    },
    {
      id: "outstanding_cheques_listed",
      labelFr: "La liste des chèques en circulation est établie",
      reference: province === "QC" ? "B-1 r.5, art. 41(2)" : "By-Law 9, s. 18(8)ii",
      passed: true,
      evidence: `${report.outstandingCheques.length} chèque(s)`,
    },
    {
      id: "deposits_in_transit_listed",
      labelFr: "La liste des recettes en circulation est établie",
      reference: province === "QC" ? "B-1 r.5, art. 41(3)" : "By-Law 9, s. 18(8)ii",
      passed: true,
      evidence: `${report.depositsInTransit.length} recette(s)`,
    },
    {
      id: "bank_comparison",
      labelFr:
        "L'état comparatif entre le journal de caisse et le relevé de l'institution est établi",
      reference: province === "QC" ? "B-1 r.5, art. 41(5)" : "By-Law 9, s. 18(8)",
      passed: true,
      evidence: `Écart : ${report.ecartBanque.toFixed(2)} $${
        bankDiscrepancyExplained ? " (motivé)" : ""
      }`,
    },
    {
      id: "no_negative_client_balance",
      labelFr: "Aucun solde de carte-client n'est débiteur",
      reference: province === "QC" ? "B-1 r.5, art. 59, 60" : "By-Law 9, s. 9(3), 14",
      passed: true,
      evidence: `${report.ledgerSnapshot.length} carte(s)-client(s) vérifiée(s)`,
    },
  ];

  const now = new Date();
  const snapshot = {
    periode: report.periode,
    accountLabel: report.trustBankAccount.accountLabel,
    totals: {
      totalReceipts: report.totalReceipts,
      totalDisbursements: report.totalDisbursements,
      journalBalance: report.journalBalance,
      ledgerSumBalance: report.ledgerSumBalance,
      bankStatementBalance: report.bankStatementBalance,
      outstandingChequesTotal: report.outstandingChequesTotal,
      depositsInTransitTotal: report.depositsInTransitTotal,
      reconciledBalance: report.reconciledBalance,
      ecartBanque: report.ecartBanque,
      ecartCartesClients: report.ecartCartesClients,
    },
    ledgerSnapshot: report.ledgerSnapshot,
    outstandingCheques: report.outstandingCheques,
    depositsInTransit: report.depositsInTransit,
    discrepancies: report.discrepancies,
    certifiedAt: now.toISOString(),
  };

  const updated = await prisma.trustMonthlyReport.update({
    where: { id: params.reportId },
    data: {
      status: "certified",
      certifiedAt: now,
      certifiedById: params.certifiedById,
      lockedAt: now,
      snapshotJson: JSON.stringify(snapshot),
      verifiedControlsJson: JSON.stringify(controls),
      declarationText: buildReportDeclaration({
        controls,
        periode: report.periode,
        accountLabel: report.trustBankAccount.accountLabel,
        province,
      }),
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.certifiedById,
    entityType: "TrustAccount",
    entityId: params.reportId,
    action: "update",
    newValues: { type: "monthly_report_certified", periode: report.periode },
    performedBy: params.certifiedById,
    performedAt: now,
  });

  return updated;
}

/** Rapports d'un cabinet, les plus récents d'abord. */
export async function listMonthlyReports(cabinetId: string, trustBankAccountId?: string | null) {
  return prisma.trustMonthlyReport.findMany({
    where: { cabinetId, ...(trustBankAccountId ? { trustBankAccountId } : {}) },
    orderBy: [{ periode: "desc" }],
    include: {
      trustBankAccount: { select: { accountLabel: true, accountNumberLast4: true } },
      _count: { select: { ledgerSnapshot: true, outstandingCheques: true, discrepancies: true } },
    },
  });
}

/** Rapport complet, prêt à rendre. */
export async function getMonthlyReport(params: { cabinetId: string; reportId: string }) {
  const report = await prisma.trustMonthlyReport.findFirst({
    where: { id: params.reportId, cabinetId: params.cabinetId },
    include: {
      trustBankAccount: true,
      ledgerSnapshot: { orderBy: { clientName: "asc" } },
      outstandingCheques: { orderBy: { chequeNumber: "asc" } },
      depositsInTransit: { orderBy: { receivedDate: "asc" } },
      discrepancies: true,
    },
  });
  if (!report) return null;

  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  return {
    report,
    province,
    blocks: getReportBlocks(province),
    deadline: computeReportDeadline({ periode: report.periode, province, now: new Date() }),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type { CabinetProvince };
