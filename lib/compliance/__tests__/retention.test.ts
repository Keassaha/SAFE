import { describe, expect, it } from "vitest";
import {
  assessPurgeEligibility,
  fiscalYearEndOnOrAfter,
  getAllRetentionRules,
  getRetentionFormDuties,
  getRetentionRule,
} from "../retention";

/**
 * CH-11 — Conservation, et refus de purger.
 *
 * Sources : B-1 r.5 art. 30, 31, 32, 33 · By-Law 9 s. 21(2), 23(1), 23(2), 23(3).
 *
 * Les deux régimes ne se ressemblent pas, et c'est tout l'enjeu :
 *   Québec  — même durée (7 ans), DEUX points de départ (fermeture vs exercice) ;
 *   Ontario — même point de départ (exercice), DEUX durées (6 et 10 ans).
 *
 * Aplatir l'un ou l'autre détruirait des pièces encore exigibles.
 */

const NOW = new Date("2026-07-31T12:00:00Z");
const FY = { fiscalYearEndMonth: 12, fiscalYearEndDay: 31 };

/* ════════════════════════════════════════════════════════════════
   Québec — deux ancres
   ════════════════════════════════════════════════════════════════ */

describe("Québec : deux points de départ pour la même durée", () => {
  it("ancre les registres sur la FERMETURE DU DOSSIER (art. 31)", () => {
    const r = getRetentionRule({ kind: "TRUST_CASH_JOURNAL", province: "QC" });
    expect(r.years).toBe(7);
    expect(r.anchor).toBe("FILE_CLOSURE");
    expect(r.reference).toBe("B-1 r.5, art. 31");
  });

  it("ancre les rapports et les pièces sur la FIN D'EXERCICE (art. 32)", () => {
    for (const kind of ["MONTHLY_REPORT", "SUPPORTING_DOCUMENT", "TRUST_CHEQUE_COPY"] as const) {
      const r = getRetentionRule({ kind, province: "QC" });
      expect(r.anchor).toBe("FISCAL_YEAR_END");
      expect(r.reference).toBe("B-1 r.5, art. 32");
    }
  });

  it("garde sept ans partout : c'est la durée qui est commune, pas l'ancre", () => {
    expect(getAllRetentionRules("QC").every((r) => r.years === 7)).toBe(true);
    const ancres = new Set(getAllRetentionRules("QC").map((r) => r.anchor));
    expect(ancres.size).toBe(2);
  });

  it("rattache le dossier d'identification au dossier client", () => {
    const r = getRetentionRule({ kind: "CLIENT_IDENTIFICATION", province: "QC" });
    expect(r.anchor).toBe("FILE_CLOSURE");
  });
});

/* ════════════════════════════════════════════════════════════════
   Ontario — deux durées
   ════════════════════════════════════════════════════════════════ */

describe("Ontario : deux durées pour le même point de départ", () => {
  it("donne dix ans aux paragraphes nommés par la s. 23(2)", () => {
    // par. 18(1)(2)(3)(8)(9)(10)(11). Purger à six ans détruirait le journal du
    // fidéicommis, qui en vaut dix.
    for (const kind of [
      "TRUST_CASH_JOURNAL",
      "ADMIN_CASH_JOURNAL",
      "CLIENT_LEDGERS",
      "MONTHLY_REPORT",
      "TRUST_PROPERTY_REGISTER",
      "SUPPORTING_DOCUMENT",
      "ELECTRONIC_TRANSFER_CONFIRMATION",
    ] as const) {
      const r = getRetentionRule({ kind, province: "ON" });
      expect(r.years, kind).toBe(10);
      expect(r.reference, kind).toBe("By-Law 9, s. 23(2)");
    }
  });

  it("laisse six ans à ce que la s. 23(2) ne vise pas", () => {
    const r = getRetentionRule({ kind: "FEES_BOOK", province: "ON" });
    expect(r.years).toBe(6);
    expect(r.reference).toBe("By-Law 9, s. 23(1)");
  });

  it("traite l'identification par la s. 23(3), distincte de la s. 23(2)", () => {
    const r = getRetentionRule({ kind: "CLIENT_IDENTIFICATION", province: "ON" });
    expect(r.years).toBe(10);
    expect(r.reference).toBe("By-Law 9, s. 23(3)");
  });

  it("ancre TOUT sur la fin d'exercice, jamais sur la fermeture du dossier", () => {
    expect(getAllRetentionRules("ON").every((r) => r.anchor === "FISCAL_YEAR_END")).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════
   Le refus de purger
   ════════════════════════════════════════════════════════════════ */

describe("Purge : le défaut est NON", () => {
  it("refuse tant que le dossier n'est pas fermé", () => {
    // Se tromper en conservant coûte du stockage ; se tromper en détruisant est
    // irréversible et constitue le manquement lui-même.
    const e = assessPurgeEligibility({
      kind: "CLIENT_LEDGERS",
      province: "QC",
      now: NOW,
      recordDate: new Date("2005-01-01T00:00:00Z"),
      fileClosedAt: null,
    });
    expect(e.purgeable).toBe(false);
    expect(e.purgeableFrom).toBeNull();
    expect(e.blockedReasonFr).toContain("n'ont pas commencé à courir");
  });

  it("refuse une pièce ancrée sur l'exercice quand l'exercice n'est pas réglé", () => {
    // Supposer le 31 décembre détruirait des pièces encore exigibles.
    const e = assessPurgeEligibility({
      kind: "SUPPORTING_DOCUMENT",
      province: "QC",
      now: NOW,
      recordDate: new Date("2000-01-01T00:00:00Z"),
    });
    expect(e.purgeable).toBe(false);
    expect(e.blockedReasonFr).toContain("exercice financier");
  });

  it("autorise une fois les sept ans écoulés depuis la fermeture", () => {
    const e = assessPurgeEligibility({
      kind: "CLIENT_LEDGERS",
      province: "QC",
      now: NOW,
      recordDate: new Date("2015-01-01T00:00:00Z"),
      fileClosedAt: new Date("2019-01-01T00:00:00Z"),
    });
    expect(e.purgeable).toBe(true);
    expect(e.purgeableFrom).toEqual(new Date("2026-01-01T00:00:00Z"));
  });

  it("refuse à un jour près", () => {
    const e = assessPurgeEligibility({
      kind: "CLIENT_LEDGERS",
      province: "QC",
      now: new Date("2026-07-30T12:00:00Z"),
      recordDate: new Date("2015-01-01T00:00:00Z"),
      fileClosedAt: new Date("2019-08-01T00:00:00Z"),
    });
    expect(e.purgeable).toBe(false);
    expect(e.blockedReasonFr).toContain("2026-08-01");
  });

  it("une même pièce vit plus longtemps en Ontario qu'au Québec", () => {
    // 10 ans ON contre 7 ans QC sur le journal du fidéicommis : un moteur unique
    // aurait purgé trois ans trop tôt de l'autre côté de la rivière.
    const base = {
      kind: "TRUST_CASH_JOURNAL" as const,
      recordDate: new Date("2017-06-01T00:00:00Z"),
      fileClosedAt: new Date("2017-06-01T00:00:00Z"),
      now: NOW,
      ...FY,
    };
    expect(assessPurgeEligibility({ ...base, province: "QC" }).purgeable).toBe(true);
    expect(assessPurgeEligibility({ ...base, province: "ON" }).purgeable).toBe(false);
  });

  it("compte l'exercice à partir de la fin d'exercice SUIVANT la pièce", () => {
    // Une pièce du 3 janvier appartient à l'exercice qui se termine en décembre de la
    // même année, pas à celui qui vient de fermer.
    const fin = fiscalYearEndOnOrAfter({
      date: new Date("2020-01-03T00:00:00Z"),
      fiscalYearEndMonth: 12,
      fiscalYearEndDay: 31,
    });
    expect(fin.toISOString().slice(0, 10)).toBe("2020-12-31");
  });

  it("bascule sur l'exercice suivant quand la pièce est postérieure à la clôture", () => {
    const fin = fiscalYearEndOnOrAfter({
      date: new Date("2020-07-01T00:00:00Z"),
      fiscalYearEndMonth: 3,
      fiscalYearEndDay: 31,
    });
    expect(fin.toISOString().slice(0, 10)).toBe("2021-03-31");
  });

  it("porte toujours l'article dans le motif de refus", () => {
    const e = assessPurgeEligibility({
      kind: "MONTHLY_REPORT",
      province: "ON",
      now: NOW,
      recordDate: new Date("2024-01-01T00:00:00Z"),
      ...FY,
    });
    expect(e.blockedReasonFr).toContain("By-Law 9, s. 23(2)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Forme de la conservation
   ════════════════════════════════════════════════════════════════ */

describe("Forme de la conservation", () => {
  it("rend l'impression obligatoire au Québec (art. 30)", () => {
    // C'est ce qui rend le moteur d'impression du CH-04 réglementaire et non décoratif.
    // À ne pas confondre avec l'art. 29, qui porte sur l'accès et la confidentialité.
    const d = getRetentionFormDuties("QC");
    expect(d.some((x) => x.reference === "B-1 r.5, art. 30")).toBe(true);
    expect(d.some((x) => x.dutyFr.includes("copie papier"))).toBe(true);
  });

  it("rappelle que la reconstitution est aux frais de l'avocat (art. 33)", () => {
    expect(getRetentionFormDuties("QC").some((x) => x.dutyFr.includes("à ses frais"))).toBe(true);
  });

  it("impose la même impression immédiate en Ontario (par. 21(2))", () => {
    const d = getRetentionFormDuties("ON");
    expect(d.some((x) => x.reference === "By-Law 9, par. 21(2)")).toBe(true);
  });
});
