import { describe, expect, it } from "vitest";
import {
  ANNUAL_REPORT_DEADLINE_DAYS,
  annualReportRegime,
  buildAnnualDeclaration,
  computeAnnualReportDeadline,
  findAnnualCertificationBlockers,
  getAnnualBlocks,
  getPeriodMonths,
  type AnnualCertificationInput,
} from "../annual-report";

/**
 * CH-09 — Rapport comptable annuel.
 *
 * Ferme QC-28 de l'audit.
 *
 * Source : B-1 r.5 art. 42. By-Law 9 n'a AUCUN équivalent — c'est le point à ne pas
 * rater : ses obligations périodiques s'arrêtent à la comparaison mensuelle.
 */

const NOW = new Date("2026-07-15T12:00:00Z");

function input(overrides: Partial<AnnualCertificationInput> = {}): AnnualCertificationInput {
  return {
    bankStatementAttached: true,
    uncertifiedMonths: [],
    ecartPeriode: 0,
    ecartExplained: false,
    negativeClientBalances: 0,
    alreadyCertified: false,
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════════
   Applicabilité
   ════════════════════════════════════════════════════════════════ */

describe("Applicabilité du rapport annuel", () => {
  it("s'applique au Québec (art. 42)", () => {
    const r = annualReportRegime("QC");
    expect(r.applies).toBe(true);
    expect(r.reference).toBe("B-1 r.5, art. 42");
  });

  it("NE s'applique PAS en Ontario : By-Law 9 n'impose aucun rapport annuel", () => {
    const r = annualReportRegime("ON");
    expect(r.applies).toBe(false);
    expect(r.noteFr).toContain("n'impose aucun rapport comptable annuel");
  });

  it("borne l'affirmation : le Lawyer Annual Report existe hors By-Law 9", () => {
    // Dire « l'Ontario n'a pas de rapport annuel » tout court serait faux. Le LSO en
    // impose un, mais hors du corpus lu. L'incertitude est déclarée plutôt que tue.
    expect(annualReportRegime("ON").noteFr).toContain("Lawyer Annual Report");
    expect(annualReportRegime("ON").noteFr).toContain("hors du corpus vérifié");
  });
});

/* ════════════════════════════════════════════════════════════════
   Les sept blocs
   ════════════════════════════════════════════════════════════════ */

describe("Blocs du rapport annuel", () => {
  it("produit les sept blocs de l'art. 42, dans l'ordre du texte", () => {
    expect(getAnnualBlocks().map((b) => b.id)).toEqual([
      "CLIENT_LEDGER_BALANCES",
      "OUTSTANDING_CHEQUES",
      "DEPOSITS_IN_TRANSIT",
      "MONTHLY_TOTALS",
      "PERIOD_COMPARISON",
      "PARTICULAR_ACCOUNTS",
      "CLOSED_ACCOUNTS",
    ]);
  });

  it("marque les DEUX blocs absents du rapport mensuel", () => {
    // 42(4) demande douze couples de totaux là où 41(4) n'en demande qu'un ;
    // 42(7) n'a aucun équivalent nulle part.
    const nouveaux = getAnnualBlocks().filter((b) => b.newVersusMonthly).map((b) => b.id);
    expect(nouveaux).toEqual(["MONTHLY_TOTALS", "CLOSED_ACCOUNTS"]);
  });

  it("exige le relevé du DERNIER MOIS de la période (42(5))", () => {
    const bloc = getAnnualBlocks().find((b) => b.id === "PERIOD_COMPARISON")!;
    expect(bloc.requiredFieldsFr.join(" ")).toContain("DERNIER MOIS");
  });

  it("exige les six mentions des comptes particuliers (42(6))", () => {
    const bloc = getAnnualBlocks().find((b) => b.id === "PARTICULAR_ACCOUNTS")!;
    expect(bloc.requiredFieldsFr).toHaveLength(6);
    expect(bloc.requiredFieldsFr).toContain("montant initial déposé");
  });

  it("exige la date de la dernière inscription aux cartes-clients (42(1))", () => {
    const bloc = getAnnualBlocks().find((b) => b.id === "CLIENT_LEDGER_BALANCES")!;
    expect(bloc.requiredFieldsFr).toContain("date de la dernière inscription");
  });

  it("cite le sous-paragraphe de chaque bloc", () => {
    for (const b of getAnnualBlocks()) {
      expect(b.reference, b.id).toMatch(/^B-1 r\.5, art\. 42\(\d\)$/);
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Délai — depuis la DEMANDE, pas depuis le calendrier
   ════════════════════════════════════════════════════════════════ */

describe("Délai de transmission", () => {
  it("court 30 jours depuis la réception de la demande", () => {
    const d = computeAnnualReportDeadline({
      requestReceivedAt: new Date("2026-07-01T00:00:00Z"),
      now: NOW,
    });
    expect(ANNUAL_REPORT_DEADLINE_DAYS).toBe(30);
    expect(d.dueAt.toISOString().slice(0, 10)).toBe("2026-07-31");
    expect(d.overdue).toBe(false);
  });

  it("marque le retard passé l'échéance", () => {
    const d = computeAnnualReportDeadline({
      requestReceivedAt: new Date("2026-05-01T00:00:00Z"),
      now: NOW,
    });
    expect(d.overdue).toBe(true);
  });

  it("dit que le délai part de la DEMANDE, pas d'une date de calendrier", () => {
    // Sans demande, il n'y a pas d'échéance : seulement l'obligation de rendre
    // compte « au moins une fois par an ». Calculer une échéance en l'absence de
    // demande inventerait un délai.
    const d = computeAnnualReportDeadline({ requestReceivedAt: NOW, now: NOW });
    expect(d.noteFr).toContain("depuis la réception de la demande");
  });
});

/* ════════════════════════════════════════════════════════════════
   Période de douze mois
   ════════════════════════════════════════════════════════════════ */

describe("Période de douze mois", () => {
  it("énumère douze mois consécutifs", () => {
    const months = getPeriodMonths({ periodStart: "2025-08" });
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2025-08");
    expect(months[11]).toBe("2026-07");
  });

  it("franchit correctement le changement d'année", () => {
    const months = getPeriodMonths({ periodStart: "2026-11" });
    expect(months.slice(0, 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
  });

  it("n'impose NI l'année civile NI l'exercice financier", () => {
    // L'art. 42 vise « la période de 12 mois identifiée DANS LA DEMANDE ». La période
    // est une donnée de la demande, pas une convention du logiciel.
    expect(getPeriodMonths({ periodStart: "2026-04" })[0]).toBe("2026-04");
  });

  it("refuse un format de période invalide", () => {
    expect(() => getPeriodMonths({ periodStart: "2026-4" })).toThrow(/YYYY-MM/);
  });
});

/* ════════════════════════════════════════════════════════════════
   Conditions de certification
   ════════════════════════════════════════════════════════════════ */

describe("Certification du rapport annuel", () => {
  it("laisse certifier un rapport complet", () => {
    expect(findAnnualCertificationBlockers(input())).toHaveLength(0);
  });

  it("BLOQUE sans le relevé du dernier mois (42(5))", () => {
    const b = findAnnualCertificationBlockers(input({ bankStatementAttached: false }));
    expect(b.map((x) => x.code)).toContain("BANK_STATEMENT_MISSING");
    expect(b[0]!.reference).toBe("B-1 r.5, art. 42(5)");
  });

  it("BLOQUE tant que les douze rapports mensuels ne sont pas certifiés", () => {
    const b = findAnnualCertificationBlockers(
      input({ uncertifiedMonths: ["2026-03", "2026-04"] }),
    );
    const blocker = b.find((x) => x.code === "MONTHLY_REPORTS_INCOMPLETE")!;
    expect(blocker.messageFr).toContain("2026-03");
  });

  it("présente cette exigence comme une DÉDUCTION, pas comme une phrase du texte", () => {
    // Elle vient de la combinaison des art. 40 et 42. La donner pour une citation
    // serait inventer une règle.
    const b = findAnnualCertificationBlockers(input({ uncertifiedMonths: ["2026-03"] }));
    const blocker = b.find((x) => x.code === "MONTHLY_REPORTS_INCOMPLETE")!;
    expect(blocker.reference).toBe("B-1 r.5, art. 40, 42");
    expect(blocker.remedyFr).toContain("n'est pas une phrase du règlement");
  });

  it("BLOQUE un écart de période silencieux, mais LAISSE passer un écart motivé", () => {
    expect(
      findAnnualCertificationBlockers(input({ ecartPeriode: 120 })).map((x) => x.code),
    ).toContain("PERIOD_DISCREPANCY_UNEXPLAINED");

    expect(
      findAnnualCertificationBlockers(input({ ecartPeriode: 120, ecartExplained: true })),
    ).toHaveLength(0);
  });

  it("BLOQUE un solde de carte-client débiteur", () => {
    const b = findAnnualCertificationBlockers(input({ negativeClientBalances: 1 }));
    expect(b.map((x) => x.code)).toContain("NEGATIVE_CLIENT_BALANCE");
  });

  it("BLOQUE la double certification, et n'évalue rien d'autre", () => {
    const b = findAnnualCertificationBlockers(
      input({ alreadyCertified: true, bankStatementAttached: false }),
    );
    expect(b).toHaveLength(1);
    expect(b[0]!.code).toBe("ALREADY_CERTIFIED");
  });

  it("accompagne chaque blocage d'une action de remplacement (PR-2)", () => {
    for (const b of findAnnualCertificationBlockers(
      input({ bankStatementAttached: false, negativeClientBalances: 2 }),
    )) {
      expect(b.remedyFr.length, b.code).toBeGreaterThan(20);
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Attestation
   ════════════════════════════════════════════════════════════════ */

describe("Attestation annuelle", () => {
  const controls = [
    {
      id: "monthly_reports_certified",
      labelFr: "Les douze rapports comptables mensuels de la période sont certifiés",
      reference: "B-1 r.5, art. 40",
      passed: true,
      evidence: "12/12",
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
    const t = buildAnnualDeclaration({
      controls,
      periodStart: "2025-08",
      periodEnd: "2026-07",
      accountLabel: "Cabinet Tremblay en fidéicommis",
    });
    expect(t).toContain("art. 40");
    expect(t).not.toContain("Contrôle non exécuté");
  });

  it("nomme la période et le compte, et borne sa portée", () => {
    const t = buildAnnualDeclaration({
      controls,
      periodStart: "2025-08",
      periodEnd: "2026-07",
      accountLabel: "Cabinet Tremblay en fidéicommis",
    });
    expect(t).toContain("2025-08");
    expect(t).toContain("2026-07");
    expect(t).toContain("Cabinet Tremblay en fidéicommis");
    expect(t).toContain("porte sur les seuls éléments énumérés");
  });

  it("n'affirme PAS une conformité générale au règlement", () => {
    const t = buildAnnualDeclaration({
      controls,
      periodStart: "2025-08",
      periodEnd: "2026-07",
      accountLabel: "Compte A",
    });
    expect(t).not.toMatch(/conforme au règlement/i);
  });
});
