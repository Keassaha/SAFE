import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-03 — Certification du rapport comptable mensuel.
 *
 * Ferme M-01 de l'audit, le constat numéro un : « le livrable central de
 * l'inspection n'existe pas ».
 *
 * Ce qui est prouvé ici :
 *   1. on ne certifie pas sans le relevé bancaire du mois (art. 41(7)) ;
 *   2. on ne certifie pas un écart SILENCIEUX, mais un écart MOTIVÉ passe
 *      (art. 41(5) QC / s. 18(8) ON — le texte exige les motifs, pas un zéro) ;
 *   3. un solde de carte-client débiteur bloque, motif ou pas (art. 59-60) ;
 *   4. le rapport certifié est FIGÉ, listes comprises (PR-5) ;
 *   5. l'attestation n'énumère que les contrôles réellement exécutés (PR-3).
 */

let reportRow: Record<string, unknown> | null;
let updateData: Record<string, unknown> | null = null;

const prismaMock = {
  trustMonthlyReport: {
    findFirst: vi.fn(async () => reportRow),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { id: "rep-1", ...data };
    }),
  },
  cabinet: {
    findUnique: vi.fn(async () => ({ config: JSON.stringify({ province: "QC" }) })),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const CALL = { cabinetId: "cab1", reportId: "rep-1", certifiedById: "user-1" };

function report(overrides: Record<string, unknown> = {}) {
  return {
    id: "rep-1",
    periode: "2026-06",
    status: "draft",
    certifiedAt: null,
    bankStatementDocumentId: "doc-releve",
    ecartBanque: 0,
    ecartCartesClients: 0,
    totalReceipts: 15000,
    totalDisbursements: 4200,
    journalBalance: 10800,
    ledgerSumBalance: 10800,
    bankStatementBalance: 11300,
    outstandingChequesTotal: 500,
    depositsInTransitTotal: 0,
    reconciledBalance: 10800,
    trustBankAccount: { accountLabel: "Cabinet Tremblay en fidéicommis" },
    ledgerSnapshot: [
      { clientName: "Beaulieu", balance: 6800, lastEntryDate: new Date("2026-06-20") },
      { clientName: "Tremblay", balance: 4000, lastEntryDate: new Date("2026-06-11") },
    ],
    outstandingCheques: [{ chequeNumber: 105, amount: 500 }],
    depositsInTransit: [],
    discrepancies: [],
    ...overrides,
  };
}

beforeEach(() => {
  reportRow = report();
  updateData = null;
  prismaMock.trustMonthlyReport.update.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Le cas conforme
   ════════════════════════════════════════════════════════════════ */

describe("Certification d'un rapport complet", () => {
  it("certifie un rapport équilibré, relevé joint", async () => {
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await certifyMonthlyReport(CALL);

    expect(updateData?.status).toBe("certified");
    expect(updateData?.certifiedById).toBe("user-1");
    expect(updateData?.lockedAt).toBeInstanceOf(Date);
  });

  it("FIGE le rapport, listes comprises (PR-5)", async () => {
    // Un rapport certifié est un instantané daté que l'inspecteur compare à
    // d'autres. Sans figeage, une écriture postérieure réécrirait l'histoire.
    const { certifyMonthlyReport } = await import("../monthly-report-service");
    await certifyMonthlyReport(CALL);

    const snap = JSON.parse(String(updateData?.snapshotJson));
    expect(snap.periode).toBe("2026-06");
    expect(snap.ledgerSnapshot).toHaveLength(2);
    expect(snap.outstandingCheques).toHaveLength(1);
    expect(snap.totals.journalBalance).toBe(10800);
  });
});

/* ════════════════════════════════════════════════════════════════
   Ce qui bloque
   ════════════════════════════════════════════════════════════════ */

describe("Refus de certification", () => {
  it("REFUSE sans le relevé bancaire du mois (art. 41(7))", async () => {
    reportRow = report({ bankStatementDocumentId: null });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await expect(certifyMonthlyReport(CALL)).rejects.toMatchObject({
      code: "MONTHLY_REPORT_BLOCKED",
    });
    expect(prismaMock.trustMonthlyReport.update).not.toHaveBeenCalled();
  });

  it("REFUSE un écart bancaire silencieux", async () => {
    reportRow = report({ ecartBanque: 250 });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await expect(certifyMonthlyReport(CALL)).rejects.toThrow(/art\. 41\(5\)/);
  });

  it("ACCEPTE un écart bancaire MOTIVÉ", async () => {
    // Le texte exige « the reasons for any differences », pas l'absence de
    // différence. Exiger zéro pousserait à ajuster un chiffre pour faire tomber
    // l'écart, ce qui détruit l'information que l'inspecteur cherche.
    reportRow = report({
      ecartBanque: 250,
      discrepancies: [{ kind: "BANK", amount: 250, explanation: "Frais bancaires non journalisés" }],
    });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await certifyMonthlyReport(CALL);
    expect(updateData?.status).toBe("certified");
  });

  it("REFUSE un écart de cartes-clients silencieux", async () => {
    reportRow = report({ ecartCartesClients: -75 });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await expect(certifyMonthlyReport(CALL)).rejects.toThrow(/art\. 41\(1\)/);
  });

  it("REFUSE un solde de carte-client débiteur, MÊME motivé", async () => {
    // Ce n'est pas une différence à expliquer : c'est l'utilisation des fonds d'un
    // autre client, que l'art. 60 impose de combler sans délai.
    reportRow = report({
      ecartCartesClients: -200,
      ledgerSnapshot: [
        { clientName: "Beaulieu", balance: 11000, lastEntryDate: new Date("2026-06-20") },
        { clientName: "Tremblay", balance: -200, lastEntryDate: new Date("2026-06-11") },
      ],
      discrepancies: [{ kind: "LEDGER", amount: -200, explanation: "En cours de correction" }],
    });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await expect(certifyMonthlyReport(CALL)).rejects.toThrow(/art\. 59, 60/);
  });

  it("REFUSE la double certification", async () => {
    reportRow = report({ status: "certified", certifiedAt: new Date("2026-07-05") });
    const { certifyMonthlyReport } = await import("../monthly-report-service");

    await expect(certifyMonthlyReport(CALL)).rejects.toThrow(/déjà certifié/);
  });

  it("renvoie TOUS les blocages d'un coup, avec leurs codes", async () => {
    reportRow = report({ bankStatementDocumentId: null, ecartBanque: 100 });
    const { certifyMonthlyReport, MonthlyReportBlockedError } = await import(
      "../monthly-report-service"
    );

    try {
      await certifyMonthlyReport(CALL);
      throw new Error("aurait dû lever");
    } catch (e) {
      expect(e).toBeInstanceOf(MonthlyReportBlockedError);
      if (e instanceof MonthlyReportBlockedError) {
        expect(e.blockers.map((b) => b.code)).toEqual(
          expect.arrayContaining(["BANK_STATEMENT_MISSING", "BANK_DISCREPANCY_UNEXPLAINED"]),
        );
      }
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Attestation — PR-3
   ════════════════════════════════════════════════════════════════ */

describe("Attestation du rapport mensuel", () => {
  it("enregistre les six contrôles exécutés, avec leur article", async () => {
    const { certifyMonthlyReport } = await import("../monthly-report-service");
    await certifyMonthlyReport(CALL);

    const controls = JSON.parse(String(updateData?.verifiedControlsJson));
    expect(controls.map((c: { id: string }) => c.id)).toEqual([
      "bank_statement_attached",
      "ledger_listing_established",
      "outstanding_cheques_listed",
      "deposits_in_transit_listed",
      "bank_comparison",
      "no_negative_client_balance",
    ]);
    expect(controls.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("nomme le compte et borne la portée de l'attestation", async () => {
    const { certifyMonthlyReport } = await import("../monthly-report-service");
    await certifyMonthlyReport(CALL);

    const text = String(updateData?.declarationText);
    expect(text).toContain("Cabinet Tremblay en fidéicommis");
    expect(text).toContain("2026-06");
    expect(text).toContain("porte sur les seuls éléments énumérés");
    expect(text).not.toMatch(/conforme au règlement/i);
  });

  it("mentionne qu'un écart a été motivé, plutôt que de le taire", async () => {
    reportRow = report({
      ecartBanque: 250,
      discrepancies: [{ kind: "BANK", amount: 250, explanation: "Frais bancaires" }],
    });
    const { certifyMonthlyReport } = await import("../monthly-report-service");
    await certifyMonthlyReport(CALL);

    const controls = JSON.parse(String(updateData?.verifiedControlsJson));
    const comparison = controls.find((c: { id: string }) => c.id === "bank_comparison");
    expect(comparison.evidence).toContain("motivé");
  });
});

/* ════════════════════════════════════════════════════════════════
   Bornes de période
   ════════════════════════════════════════════════════════════════ */

describe("periodBounds", () => {
  it("couvre le mois entier, dernière milliseconde comprise", async () => {
    const { periodBounds } = await import("../monthly-report-service");
    const { start, end } = periodBounds("2026-06");
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-30T23:59:59.999Z");
  });

  it("gère février d'une année bissextile", async () => {
    const { periodBounds } = await import("../monthly-report-service");
    expect(periodBounds("2028-02").end.toISOString().slice(0, 10)).toBe("2028-02-29");
  });

  it("refuse un format de période invalide", async () => {
    const { periodBounds } = await import("../monthly-report-service");
    expect(() => periodBounds("2026-6")).toThrow(/YYYY-MM/);
  });
});
