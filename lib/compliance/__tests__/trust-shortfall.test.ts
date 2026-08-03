import { describe, expect, it } from "vitest";
import {
  assessInterestRemittance,
  assessShortfall,
  findShortfalls,
  getInterestRule,
  getRemediationOptions,
  SHORTFALL_REMAINS_VISIBLE_AFTER_RESOLUTION,
  toReportLine,
  totalShortfall,
  type LedgerBalance,
} from "../trust-shortfall";

/**
 * CH-10 — Soldes débiteurs et intérêts.
 *
 * Ferme QC-45 et ON-23 de l'audit.
 *
 * Sources : B-1 r.5 art. 50, 59, 60, 62 · By-Law 9 s. 9(3), 14.
 *
 * Le point central : ni l'art. 60 (« sans délai ») ni la s. 14 (« at all times ») ne
 * chiffrent un délai. Le module mesure l'ancienneté, mais ne la convertit jamais en
 * verdict — sinon il inventerait une tolérance que le règlement ne donne pas.
 */

const NOW = new Date("2026-07-31T12:00:00Z");

const BALANCES: LedgerBalance[] = [
  { clientId: "c1", clientName: "Beaulieu", dossierId: "d1", balance: 6800 },
  { clientId: "c2", clientName: "Tremblay", dossierId: "d2", balance: -200 },
  { clientId: "c3", clientName: "Nadeau", dossierId: "d3", balance: -1450.75 },
  { clientId: "c4", clientName: "Roy", dossierId: "d4", balance: 0 },
];

/* ════════════════════════════════════════════════════════════════
   Détection
   ════════════════════════════════════════════════════════════════ */

describe("Détection des découverts", () => {
  it("repère chaque carte-client débitrice", () => {
    const s = findShortfalls(BALANCES);
    expect(s.map((x) => x.clientName)).toEqual(["Nadeau", "Tremblay"]);
  });

  it("classe du plus gros découvert au plus petit", () => {
    // Le cabinet doit traiter d'abord là où l'exposition est la plus forte.
    const s = findShortfalls(BALANCES);
    expect(s[0]!.shortfallAmount).toBe(1450.75);
    expect(s[1]!.shortfallAmount).toBe(200);
  });

  it("exprime le manque en positif", () => {
    expect(findShortfalls(BALANCES).every((x) => x.shortfallAmount > 0)).toBe(true);
  });

  it("ignore un solde nul et les soldes créditeurs", () => {
    expect(findShortfalls(BALANCES).map((x) => x.clientId)).not.toContain("c4");
    expect(findShortfalls(BALANCES).map((x) => x.clientId)).not.toContain("c1");
  });

  it("ne se laisse pas piéger par un centième d'arrondi", () => {
    expect(findShortfalls([{ clientId: "c", dossierId: null, balance: -0.001 }])).toHaveLength(0);
  });

  it("totalise le montant à combler", () => {
    expect(totalShortfall(findShortfalls(BALANCES))).toBe(1650.75);
  });

  it("N'AGRÈGE PAS : un découvert compensé reste un découvert", () => {
    // Un compte à −200 $ compensé par un autre à +200 $ donne un total sain et
    // masque exactement ce que l'art. 60 vise.
    const compense: LedgerBalance[] = [
      { clientId: "a", dossierId: null, balance: 200 },
      { clientId: "b", dossierId: null, balance: -200 },
    ];
    expect(findShortfalls(compense)).toHaveLength(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Qualification — sans délai inventé
   ════════════════════════════════════════════════════════════════ */

describe("Qualification d'un découvert", () => {
  it("mesure l'ancienneté", () => {
    const a = assessShortfall({
      province: "QC",
      detectedAt: new Date("2026-07-01T12:00:00Z"),
      now: NOW,
      amount: 200,
    });
    expect(a.daysOpen).toBe(30);
  });

  it("N'AFFIRME AUCUN délai réglementaire", () => {
    // « sans délai » et « at all times » veulent dire immédiatement. Un système qui
    // afficherait « conforme jusqu'au jour 5 » inventerait une tolérance.
    const a = assessShortfall({ province: "QC", detectedAt: NOW, now: NOW, amount: 200 });
    expect(a.statutoryDeadlineExists).toBe(false);
  });

  it("cite l'article de la province", () => {
    expect(assessShortfall({ province: "QC", detectedAt: NOW, now: NOW, amount: 1 }).reference).toBe(
      "B-1 r.5, art. 59, 60",
    );
    expect(assessShortfall({ province: "ON", detectedAt: NOW, now: NOW, amount: 1 }).reference).toBe(
      "By-Law 9, s. 9(3), 14",
    );
  });

  it("nomme le vrai problème : les fonds d'un AUTRE client sont utilisés", () => {
    const a = assessShortfall({ province: "QC", detectedAt: NOW, now: NOW, amount: 200 });
    expect(a.messageFr).toContain("fonds d'un autre client");
  });

  it("reprend les mots du texte dans le remède", () => {
    expect(
      assessShortfall({ province: "QC", detectedAt: NOW, now: NOW, amount: 1 }).remedyFr,
    ).toContain("SANS DÉLAI");
    expect(
      assessShortfall({ province: "ON", detectedAt: NOW, now: NOW, amount: 1 }).remedyFr,
    ).toContain("en tout temps");
  });
});

/* ════════════════════════════════════════════════════════════════
   Renflouement
   ════════════════════════════════════════════════════════════════ */

describe("Façons de combler un découvert", () => {
  it("propose les trois sources admises", () => {
    expect(getRemediationOptions("QC").map((o) => o.source)).toEqual([
      "CABINET_OPERATING",
      "CLIENT_DEPOSIT",
      "LEDGER_CORRECTION",
    ]);
  });

  it("explique pourquoi le dépôt du cabinet est légitime malgré l'art. 52", () => {
    // L'art. 52 limite ce qui peut entrer au compte général. Un renflouement n'entre
    // littéralement dans aucune catégorie, mais l'art. 60 l'impose. Le raisonnement
    // est écrit plutôt que sous-entendu : un inspecteur peut poser la question.
    const o = getRemediationOptions("QC").find((x) => x.source === "CABINET_OPERATING")!;
    expect(o.noteFr).toContain("art. 52");
    expect(o.reference).toBe("B-1 r.5, art. 60");
  });

  it("précise que le dépôt du client ne dispense pas de combler sans délai", () => {
    const o = getRemediationOptions("QC").find((x) => x.source === "CLIENT_DEPOSIT")!;
    expect(o.noteFr).toContain("ne dispense pas");
  });

  it("cite l'article ontarien pour un cabinet ontarien", () => {
    const o = getRemediationOptions("ON").find((x) => x.source === "CABINET_OPERATING")!;
    expect(o.reference).toBe("By-Law 9, s. 14");
  });
});

/* ════════════════════════════════════════════════════════════════
   Visibilité après résolution
   ════════════════════════════════════════════════════════════════ */

describe("Un incident résolu reste visible", () => {
  it("le module l'affirme explicitement", () => {
    // Un découvert survenu le 3 et comblé le 4 n'apparaîtrait nulle part si l'on ne
    // regardait que les soldes de fin de mois. Or c'est ce qu'un inspecteur cherche :
    // non pas l'état à une date, mais ce qui s'est passé.
    expect(SHORTFALL_REMAINS_VISIBLE_AFTER_RESOLUTION).toBe(true);
  });

  it("calcule le délai de résolution", () => {
    const l = toReportLine({
      clientName: "Tremblay",
      dossierRef: "2026-014",
      amount: 200,
      detectedAt: new Date("2026-07-03T09:00:00Z"),
      resolvedAt: new Date("2026-07-04T15:00:00Z"),
      source: "CABINET_OPERATING",
    });
    expect(l.daysToResolve).toBe(1);
  });

  it("laisse le délai nul tant que l'incident est ouvert", () => {
    const l = toReportLine({
      clientName: "Tremblay",
      dossierRef: null,
      amount: 200,
      detectedAt: new Date("2026-07-03T09:00:00Z"),
      resolvedAt: null,
      source: null,
    });
    expect(l.daysToResolve).toBeNull();
    expect(l.resolvedAt).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════
   Intérêts
   ════════════════════════════════════════════════════════════════ */

describe("Bénéficiaire des intérêts", () => {
  it("compte général québécois : Fonds d'études juridiques (art. 50)", () => {
    const r = getInterestRule({ province: "QC", accountType: "GENERAL" });
    expect(r.beneficiary).toBe("FONDS_ETUDES_JURIDIQUES");
    expect(r.reference).toContain("B-1, r. 10");
  });

  it("compte général ontarien : Law Foundation of Ontario", () => {
    const r = getInterestRule({ province: "ON", accountType: "GENERAL" });
    expect(r.beneficiary).toBe("LAW_FOUNDATION_ONTARIO");
    expect(r.reference).toBe("Law Society Act, s. 57");
  });

  it("compte particulier : le client, c'est sa raison d'être (art. 62)", () => {
    const r = getInterestRule({ province: "QC", accountType: "PARTICULIER" });
    expect(r.beneficiary).toBe("CLIENT");
    expect(r.reference).toBe("B-1 r.5, art. 62");
  });

  it("DÉCLARE que la mécanique de versement n'est pas connue", () => {
    // Le bénéficiaire découle des articles lus. Le taux, la fréquence et le
    // formulaire relèvent de B-1 r.10 et de la s. 57, qui n'ont PAS été lus.
    // Inventer un taux ou une échéance fabriquerait une règle.
    expect(getInterestRule({ province: "QC", accountType: "GENERAL" }).mechanicsKnown).toBe(false);
    expect(getInterestRule({ province: "ON", accountType: "GENERAL" }).mechanicsKnown).toBe(false);
    expect(
      getInterestRule({ province: "QC", accountType: "GENERAL" }).noteFr,
    ).toContain("n'a pas été lu");
  });

  it("connaît en revanche la mécanique du compte particulier", () => {
    expect(getInterestRule({ province: "QC", accountType: "PARTICULIER" }).mechanicsKnown).toBe(true);
  });
});

describe("Suivi d'un versement d'intérêts", () => {
  const base = {
    periode: "2026-06",
    beneficiary: "FONDS_ETUDES_JURIDIQUES" as const,
    amount: 143.2,
    province: "QC" as const,
  };

  it("n'est complet qu'avec une date ET une preuve", () => {
    // Une date sans pièce n'est qu'une affirmation, et c'est la pièce que
    // l'inspecteur demande (art. 32).
    expect(
      assessInterestRemittance({ ...base, remittedAt: new Date("2026-07-05"), hasProof: true })
        .complete,
    ).toBe(true);
    expect(
      assessInterestRemittance({ ...base, remittedAt: new Date("2026-07-05"), hasProof: false })
        .complete,
    ).toBe(false);
    expect(
      assessInterestRemittance({ ...base, remittedAt: null, hasProof: true }).complete,
    ).toBe(false);
  });

  it("nomme ce qui manque", () => {
    // « Incomplet » sans dire quoi ne fait pas agir.
    const a = assessInterestRemittance({ ...base, remittedAt: null, hasProof: false });
    expect(a.missingFr).toEqual(["la date du versement", "la pièce justificative du versement"]);
    expect(
      assessInterestRemittance({ ...base, remittedAt: new Date("2026-07-05"), hasProof: true })
        .missingFr,
    ).toEqual([]);
  });

  it("cite l'article de conservation de la pièce", () => {
    expect(
      assessInterestRemittance({ ...base, remittedAt: null, hasProof: false }).reference,
    ).toContain("art. 32");
    expect(
      assessInterestRemittance({
        ...base,
        province: "ON",
        beneficiary: "LAW_FOUNDATION_ONTARIO",
        remittedAt: null,
        hasProof: false,
      }).reference,
    ).toContain("s. 18(10)");
  });
});
