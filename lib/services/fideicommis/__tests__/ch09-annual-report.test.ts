import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-09 — Rapport comptable annuel, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. le régime refuse de s'appliquer hors Québec — By-Law 9 n'impose aucun
 *      rapport annuel ;
 *   2. les douze totaux mensuels reprennent les rapports MENSUELS quand ils
 *      existent, pour ne pas produire un chiffre différent de celui déjà certifié ;
 *   3. la certification est bloquée tant que les douze mois ne sont pas certifiés ;
 *   4. les comptes fermés durant la période sont listés (42(7)) ;
 *   5. le rapport certifié est figé.
 */

let province: "QC" | "ON";
let reportRow: Record<string, unknown> | null;
let updateData: Record<string, unknown> | null = null;

const prismaMock = {
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province }) })) },
  trustAnnualReport: {
    findFirst: vi.fn(async () => reportRow),
    findUnique: vi.fn(async () => null),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { id: "ann-1", ...data };
    }),
    updateMany: vi.fn(async () => ({ count: 1 })),
    findMany: vi.fn(async () => []),
  },
  document: { findFirst: vi.fn(async () => ({ id: "doc-1" })) },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const CALL = { cabinetId: "cab1", annualReportId: "ann-1", certifiedById: "user-1" };

function report(overrides: Record<string, unknown> = {}) {
  return {
    id: "ann-1",
    periodStart: "2025-08",
    periodEnd: "2026-07",
    status: "draft",
    certifiedAt: null,
    bankStatementDocumentId: "doc-releve",
    journalBalance: 12000,
    ledgerSumBalance: 12000,
    bankStatementBalance: 12500,
    reconciledBalance: 12000,
    ecartPeriode: 0,
    ecartCartesClients: 0,
    trustBankAccount: { accountLabel: "Cabinet Tremblay en fidéicommis" },
    monthlyTotals: Array.from({ length: 12 }, (_, i) => ({
      periode: `2025-${String(8 + i).padStart(2, "0")}`,
      totalReceipts: 1000,
      totalDisbursements: 200,
      monthlyReportCertified: true,
    })),
    closedAccounts: [
      { accountLabel: "Compte particulier Beaulieu", closedAt: new Date("2026-03-15") },
    ],
    ledgerSnapshot: [
      { clientName: "Beaulieu", balance: 8000, lastEntryDate: new Date("2026-07-20") },
      { clientName: "Tremblay", balance: 4000, lastEntryDate: new Date("2026-06-11") },
    ],
    outstandingCheques: [{ chequeNumber: 210, amount: 500 }],
    depositsInTransit: [],
    ...overrides,
  };
}

beforeEach(() => {
  province = "QC";
  reportRow = report();
  updateData = null;
  prismaMock.trustAnnualReport.update.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Garde province
   ════════════════════════════════════════════════════════════════ */

describe("Applicabilité", () => {
  it("REFUSE de certifier pour un cabinet ontarien", async () => {
    // By-Law 9 n'impose aucun rapport annuel. En produire un ici inventerait une
    // obligation.
    province = "ON";
    const { certifyAnnualReport } = await import("../annual-report-service");

    await expect(certifyAnnualReport(CALL)).rejects.toThrow(/ne s'applique pas/);
    expect(prismaMock.trustAnnualReport.update).not.toHaveBeenCalled();
  });

  it("cite ce que By-Law 9 impose à la place", async () => {
    province = "ON";
    const { certifyAnnualReport } = await import("../annual-report-service");
    await expect(certifyAnnualReport(CALL)).rejects.toThrow(/comparaison mensuelle/);
  });
});

/* ════════════════════════════════════════════════════════════════
   Certification
   ════════════════════════════════════════════════════════════════ */

describe("Certification du rapport annuel", () => {
  it("certifie un rapport complet et équilibré", async () => {
    const { certifyAnnualReport } = await import("../annual-report-service");
    await certifyAnnualReport(CALL);

    expect(updateData?.status).toBe("certified");
    expect(updateData?.certifiedById).toBe("user-1");
  });

  it("BLOQUE tant qu'un mois de la période n'est pas certifié", async () => {
    const totals = report().monthlyTotals;
    totals[3]!.monthlyReportCertified = false;
    reportRow = report({ monthlyTotals: totals });
    const { certifyAnnualReport } = await import("../annual-report-service");

    await expect(certifyAnnualReport(CALL)).rejects.toThrow(/2025-11/);
  });

  it("BLOQUE sans le relevé du dernier mois (42(5))", async () => {
    reportRow = report({ bankStatementDocumentId: null });
    const { certifyAnnualReport } = await import("../annual-report-service");

    await expect(certifyAnnualReport(CALL)).rejects.toMatchObject({
      code: "ANNUAL_REPORT_BLOCKED",
    });
  });

  it("BLOQUE un solde de carte-client débiteur", async () => {
    reportRow = report({
      ledgerSnapshot: [
        { clientName: "Beaulieu", balance: 12200, lastEntryDate: new Date("2026-07-20") },
        { clientName: "Tremblay", balance: -200, lastEntryDate: new Date("2026-06-11") },
      ],
    });
    const { certifyAnnualReport } = await import("../annual-report-service");

    await expect(certifyAnnualReport(CALL)).rejects.toThrow(/art\. 59, 60/);
  });

  it("BLOQUE la double certification", async () => {
    reportRow = report({ status: "certified", certifiedAt: new Date("2026-08-01") });
    const { certifyAnnualReport } = await import("../annual-report-service");

    await expect(certifyAnnualReport(CALL)).rejects.toThrow(/déjà certifié/);
  });

  it("renvoie tous les blocages d'un coup", async () => {
    const totals = report().monthlyTotals;
    totals[0]!.monthlyReportCertified = false;
    reportRow = report({ bankStatementDocumentId: null, monthlyTotals: totals });
    const { certifyAnnualReport, AnnualReportBlockedError } = await import(
      "../annual-report-service"
    );

    try {
      await certifyAnnualReport(CALL);
      throw new Error("aurait dû lever");
    } catch (e) {
      expect(e).toBeInstanceOf(AnnualReportBlockedError);
      if (e instanceof AnnualReportBlockedError) {
        expect(e.blockers.map((b) => b.code)).toEqual(
          expect.arrayContaining(["BANK_STATEMENT_MISSING", "MONTHLY_REPORTS_INCOMPLETE"]),
        );
      }
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Figeage et attestation
   ════════════════════════════════════════════════════════════════ */

describe("Figeage du rapport annuel", () => {
  it("fige les douze totaux mensuels et les comptes fermés", async () => {
    const { certifyAnnualReport } = await import("../annual-report-service");
    await certifyAnnualReport(CALL);

    const snap = JSON.parse(String(updateData?.snapshotJson));
    expect(snap.monthlyTotals).toHaveLength(12);
    expect(snap.closedAccounts).toHaveLength(1);
    expect(snap.periodStart).toBe("2025-08");
    expect(snap.periodEnd).toBe("2026-07");
  });

  it("enregistre les sept contrôles, un par bloc de l'art. 42", async () => {
    const { certifyAnnualReport } = await import("../annual-report-service");
    await certifyAnnualReport(CALL);

    const controls = JSON.parse(String(updateData?.verifiedControlsJson));
    expect(controls).toHaveLength(7);
    expect(controls.map((c: { id: string }) => c.id)).toContain("closed_accounts_listed");
    expect(controls.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("consigne le nombre de comptes fermés comme preuve du bloc 42(7)", async () => {
    const { certifyAnnualReport } = await import("../annual-report-service");
    await certifyAnnualReport(CALL);

    const controls = JSON.parse(String(updateData?.verifiedControlsJson));
    const closed = controls.find((c: { id: string }) => c.id === "closed_accounts_listed");
    expect(closed.evidence).toContain("1 compte");
    expect(closed.reference).toBe("B-1 r.5, art. 42(7)");
  });

  it("nomme la période et le compte dans l'attestation, et borne sa portée", async () => {
    const { certifyAnnualReport } = await import("../annual-report-service");
    await certifyAnnualReport(CALL);

    const text = String(updateData?.declarationText);
    expect(text).toContain("Cabinet Tremblay en fidéicommis");
    expect(text).toContain("2025-08");
    expect(text).toContain("2026-07");
    expect(text).toContain("porte sur les seuls éléments énumérés");
    expect(text).not.toMatch(/conforme au règlement/i);
  });
});
