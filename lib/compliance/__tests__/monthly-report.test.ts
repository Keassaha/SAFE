import { describe, expect, it } from "vitest";
import {
  buildReportDeclaration,
  computeReportDeadline,
  findCertificationBlockers,
  getReportBlocks,
  ONTARIO_REPORT_DEADLINE_DAYS,
  type ReportCertificationInput,
} from "../monthly-report";

/**
 * CH-03 — Règles du rapport comptable mensuel.
 *
 * Sources : B-1 r.5 art. 40, 41 · By-Law 9 s. 18(8), 22(2).
 */

const NOW = new Date("2026-07-15T12:00:00Z");

function input(overrides: Partial<ReportCertificationInput> = {}): ReportCertificationInput {
  return {
    bankStatementAttached: true,
    ecartBanque: 0,
    ecartCartesClients: 0,
    bankDiscrepancyExplained: false,
    ledgerDiscrepancyExplained: false,
    negativeClientBalances: 0,
    ledgerLineCount: 4,
    alreadyCertified: false,
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════════
   Les sept blocs de l'art. 41
   ════════════════════════════════════════════════════════════════ */

describe("Blocs du rapport mensuel", () => {
  it("produit les sept blocs de l'art. 41 au Québec", () => {
    const ids = getReportBlocks("QC").map((b) => b.id);
    expect(ids).toEqual([
      "CLIENT_LEDGER_BALANCES",
      "OUTSTANDING_CHEQUES",
      "DEPOSITS_IN_TRANSIT",
      "PERIOD_TOTALS",
      "BANK_COMPARISON",
      "PARTICULAR_ACCOUNTS",
      "BANK_STATEMENT",
    ]);
  });

  it("N'AJOUTE PAS les comptes particuliers en Ontario, où la catégorie n'existe pas", () => {
    // By-Law 9 ne connaît pas le « compte particulier ». L'exiger inventerait une
    // obligation, ce qui est aussi grave que d'en omettre une.
    const ids = getReportBlocks("ON").map((b) => b.id);
    expect(ids).not.toContain("PARTICULAR_ACCOUNTS");
    expect(ids).toHaveLength(6);
  });

  it("énumère la date de la dernière inscription, exigée par l'art. 41(1)", () => {
    const bloc = getReportBlocks("QC").find((b) => b.id === "CLIENT_LEDGER_BALANCES")!;
    expect(bloc.requiredFieldsFr).toContain("date de la dernière inscription");
    expect(bloc.reference).toBe("B-1 r.5, art. 41(1)");
  });

  it("énumère le numéro de chèque, exigé par l'art. 41(2)", () => {
    const bloc = getReportBlocks("QC").find((b) => b.id === "OUTSTANDING_CHEQUES")!;
    expect(bloc.requiredFieldsFr).toEqual(
      expect.arrayContaining(["montant", "date d'émission", "numéro du chèque"]),
    );
  });

  it("cite l'article ontarien pour un cabinet ontarien (PR-7)", () => {
    const bloc = getReportBlocks("ON").find((b) => b.id === "CLIENT_LEDGER_BALANCES")!;
    expect(bloc.reference).toBe("By-Law 9, s. 18(8)i");
  });
});

/* ════════════════════════════════════════════════════════════════
   Ce qui bloque la certification
   ════════════════════════════════════════════════════════════════ */

describe("Conditions de certification", () => {
  it("laisse certifier un rapport complet et équilibré", () => {
    expect(findCertificationBlockers(input(), "QC")).toHaveLength(0);
  });

  it("BLOQUE sans relevé bancaire (art. 41(7))", () => {
    const b = findCertificationBlockers(input({ bankStatementAttached: false }), "QC");
    expect(b.map((x) => x.code)).toContain("BANK_STATEMENT_MISSING");
    expect(b[0]!.reference).toBe("B-1 r.5, art. 41(7)");
  });

  it("BLOQUE un écart bancaire SANS motif consigné", () => {
    const b = findCertificationBlockers(input({ ecartBanque: 125.5 }), "QC");
    expect(b.map((x) => x.code)).toContain("BANK_DISCREPANCY_UNEXPLAINED");
  });

  it("LAISSE certifier un écart bancaire MOTIVÉ", () => {
    // Le texte n'interdit pas l'écart : l'art. 41(5) exige un état comparatif, et la
    // s. 18(8) exige « the reasons for any differences ». Exiger zéro serait plus
    // strict que le règlement, et pousserait l'utilisateur à ajuster un chiffre pour
    // faire tomber l'écart — détruisant l'information que l'inspecteur cherche.
    const b = findCertificationBlockers(
      input({ ecartBanque: 125.5, bankDiscrepancyExplained: true }),
      "QC",
    );
    expect(b).toHaveLength(0);
  });

  it("BLOQUE un écart de cartes-clients sans motif", () => {
    const b = findCertificationBlockers(input({ ecartCartesClients: -40 }), "QC");
    expect(b.map((x) => x.code)).toContain("LEDGER_DISCREPANCY_UNEXPLAINED");
  });

  it("BLOQUE un solde de carte-client débiteur, motif ou pas", () => {
    // Ce n'est pas une différence à expliquer : c'est l'utilisation des fonds d'un
    // autre client, que l'art. 60 impose de combler « sans délai ».
    const b = findCertificationBlockers(
      input({
        negativeClientBalances: 2,
        ecartCartesClients: -200,
        ledgerDiscrepancyExplained: true,
      }),
      "QC",
    );
    expect(b.map((x) => x.code)).toContain("NEGATIVE_CLIENT_BALANCE");
  });

  it("BLOQUE une liste de cartes-clients vide alors que le journal porte un solde", () => {
    const b = findCertificationBlockers(
      input({ ledgerLineCount: 0, ecartCartesClients: -5000 }),
      "QC",
    );
    expect(b.map((x) => x.code)).toContain("EMPTY_LEDGER_LISTING");
  });

  it("BLOQUE la double certification et n'évalue rien d'autre", () => {
    const b = findCertificationBlockers(
      input({ alreadyCertified: true, bankStatementAttached: false }),
      "QC",
    );
    expect(b).toHaveLength(1);
    expect(b[0]!.code).toBe("ALREADY_CERTIFIED");
  });

  it("accompagne chaque blocage d'une action de remplacement (PR-2)", () => {
    const b = findCertificationBlockers(input({ bankStatementAttached: false }), "QC");
    expect(b[0]!.remedyFr.length).toBeGreaterThan(20);
  });
});

/* ════════════════════════════════════════════════════════════════
   Échéance — s. 22(2) ON, rien de chiffré au Québec
   ════════════════════════════════════════════════════════════════ */

describe("Échéance du rapport", () => {
  it("fixe 25 jours après la fin du mois en Ontario", () => {
    const d = computeReportDeadline({ periode: "2026-06", province: "ON", now: NOW });
    expect(ONTARIO_REPORT_DEADLINE_DAYS).toBe(25);
    // Juin se termine le 30 ; l'échéance tombe le 25 juillet.
    expect(d.dueAt?.toISOString().slice(0, 10)).toBe("2026-07-25");
    expect(d.overdue).toBe(false);
    expect(d.reference).toBe("By-Law 9, s. 22(2)");
  });

  it("marque le retard passé l'échéance ontarienne", () => {
    const d = computeReportDeadline({
      periode: "2026-06",
      province: "ON",
      now: new Date("2026-07-28T00:00:00Z"),
    });
    expect(d.overdue).toBe(true);
  });

  it("N'INVENTE PAS de date limite au Québec", () => {
    // L'art. 40 impose un registre tenu à jour, sans nombre de jours. Appliquer le
    // seuil ontarien à un cabinet québécois serait lui opposer une règle qui ne le
    // régit pas.
    const d = computeReportDeadline({ periode: "2026-06", province: "QC", now: NOW });
    expect(d.dueAt).toBeNull();
    expect(d.overdue).toBe(false);
    expect(d.reference).toBe("B-1 r.5, art. 40");
    expect(d.noteFr).toContain("propre à l'Ontario");
  });
});

/* ════════════════════════════════════════════════════════════════
   Attestation — PR-3
   ════════════════════════════════════════════════════════════════ */

describe("Attestation du rapport", () => {
  const controls = [
    {
      id: "bank_statement_attached",
      labelFr: "Le relevé de l'institution du mois est joint",
      reference: "B-1 r.5, art. 41(7)",
      passed: true,
      evidence: null,
    },
    {
      id: "ledger_listing_complete",
      labelFr: "La liste des soldes de cartes-clients est établie",
      reference: "B-1 r.5, art. 41(1)",
      passed: true,
      evidence: "4 cartes-clients",
    },
    {
      id: "not_run",
      labelFr: "Contrôle non exécuté",
      reference: "n/a",
      passed: false,
      evidence: null,
    },
  ];

  it("n'énumère QUE les contrôles réussis", () => {
    const text = buildReportDeclaration({
      controls,
      periode: "2026-06",
      accountLabel: "Cabinet Tremblay en fidéicommis",
      province: "QC",
    });
    expect(text).toContain("art. 41(7)");
    expect(text).toContain("art. 41(1)");
    expect(text).not.toContain("Contrôle non exécuté");
  });

  it("borne explicitement sa propre portée", () => {
    const text = buildReportDeclaration({
      controls,
      periode: "2026-06",
      accountLabel: "Compte A",
      province: "QC",
    });
    expect(text).toContain("porte sur les seuls éléments énumérés");
    // Jamais d'affirmation générale de conformité au règlement entier.
    expect(text).not.toMatch(/conforme au règlement/i);
  });

  it("rédige en anglais pour un cabinet ontarien", () => {
    const text = buildReportDeclaration({
      controls,
      periode: "2026-06",
      accountLabel: "Trust Account",
      province: "ON",
    });
    expect(text).toContain("I certify");
    expect(text).toContain("covers only the items listed above");
  });
});
