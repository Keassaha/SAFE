import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_RULES,
  COMPLIANCE_RULES_ENABLED,
  getDisplayableRules,
  getDisplayableRulesByDomain,
  getOpenQuestions,
  getRuleById,
  getRulesForProvince,
  isDisplayable,
  localeForProvince,
  localizedStatement,
  resolveProvince,
  type ComplianceRule,
} from "@/lib/compliance/rules";

/**
 * Invariants du registre de conformité (ADR-011). Le point critique : aucune règle
 * INCERTAIN ne doit jamais atteindre l'utilisateur, et une règle ontarienne ne doit
 * jamais être servie à un cabinet québécois (ni l'inverse).
 */
describe("Registre de conformité — intégrité des données", () => {
  it("les identifiants sont uniques", () => {
    const ids = COMPLIANCE_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque règle a un énoncé bilingue (fr + en) et une source non vides", () => {
    for (const r of COMPLIANCE_RULES) {
      expect(r.statement.fr.trim().length, `statement.fr vide: ${r.id}`).toBeGreaterThan(0);
      expect(r.statement.en.trim().length, `statement.en vide: ${r.id}`).toBeGreaterThan(0);
      expect(r.source.trim().length, `source vide: ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("toute règle INCERTAIN route vers une question ou porte une source explicite", () => {
    for (const r of COMPLIANCE_RULES.filter((x) => x.confidence === "INCERTAIN")) {
      // Une INCERTAIN doit soit référencer une question ouverte, soit dire pourquoi.
      expect(
        Boolean(r.openQuestion) || /voir QUESTIONS|absent|Non (sourcé|confirmé)|mention/i.test(r.source),
        `INCERTAIN sans traçabilité: ${r.id}`,
      ).toBe(true);
    }
  });

  it("le flag de branchement est éteint par défaut (env non défini)", () => {
    expect(COMPLIANCE_RULES_ENABLED).toBe(false);
  });
});

describe("resolveProvince — aligné sur regulator.ts", () => {
  it("QC (toutes casses) → QC", () => {
    expect(resolveProvince("QC")).toBe("QC");
    expect(resolveProvince("qc")).toBe("QC");
    expect(resolveProvince(" Qc ".trim())).toBe("QC");
  });

  it("ON, inconnu, absent → ON (comportement historique)", () => {
    expect(resolveProvince("ON")).toBe("ON");
    expect(resolveProvince("BC")).toBe("ON");
    expect(resolveProvince(null)).toBe("ON");
    expect(resolveProvince(undefined)).toBe("ON");
  });
});

describe("Localisation par province", () => {
  it("localeForProvince : QC → fr, ON/inconnu/absent → en", () => {
    expect(localeForProvince("QC")).toBe("fr");
    expect(localeForProvince("qc")).toBe("fr");
    expect(localeForProvince("ON")).toBe("en");
    expect(localeForProvince("BC")).toBe("en");
    expect(localeForProvince(null)).toBe("en");
  });

  it("localizedStatement rend la bonne langue", () => {
    const rule = getRuleById("TR-ON-02")!;
    expect(localizedStatement(rule, "en")).toContain("25 days");
    expect(localizedStatement(rule, "fr")).toContain("25 jours");
  });

  it("un cabinet ON reçoit l'anglais, un cabinet QC le français (via localeForProvince)", () => {
    const onRule = getDisplayableRules("ON").find((r) => r.id === "TR-ON-01")!;
    expect(localizedStatement(onRule, localeForProvince("ON"))).toBe("Trust accounting governed by By-Law 9 (LSO).");
    const qcRule = getDisplayableRules("QC").find((r) => r.id === "TR-QC-01")!;
    expect(localizedStatement(qcRule, localeForProvince("QC"))).toContain("Comptabilité en fidéicommis");
  });
});

describe("isDisplayable — doctrine ADR-011", () => {
  const base: ComplianceRule = {
    id: "X", domain: "fideicommis", jurisdiction: "QC",
    statement: { fr: "s", en: "s" }, source: "src", confidence: "CONFIRME",
  };
  it("CONFIRME sourcée → affichable", () => {
    expect(isDisplayable(base)).toBe(true);
  });
  it("PARTIEL sourcée → affichable", () => {
    expect(isDisplayable({ ...base, confidence: "PARTIEL" })).toBe(true);
  });
  it("INCERTAIN → jamais affichable", () => {
    expect(isDisplayable({ ...base, confidence: "INCERTAIN" })).toBe(false);
  });
  it("sans source → jamais affichable", () => {
    expect(isDisplayable({ ...base, source: "   " })).toBe(false);
  });
});

describe("Province-aware — garantie de non-contamination", () => {
  it("un cabinet QC ne voit jamais de règle purement ontarienne", () => {
    const qc = getRulesForProvince("QC");
    expect(qc.some((r) => r.jurisdiction === "ON")).toBe(false);
  });

  it("un cabinet ON ne voit jamais de règle purement québécoise", () => {
    const on = getRulesForProvince("ON");
    expect(on.some((r) => r.jurisdiction === "QC")).toBe(false);
  });

  it("le délai ontarien de 25 jours (TR-ON-02/03) n'atteint jamais un cabinet QC", () => {
    const qcIds = getRulesForProvince("QC").map((r) => r.id);
    expect(qcIds).not.toContain("TR-ON-02");
    expect(qcIds).not.toContain("TR-ON-03");
  });

  it("les règles fédérales et transversales s'appliquent aux deux provinces", () => {
    for (const p of ["QC", "ON"] as const) {
      const ids = getRulesForProvince(p).map((r) => r.id);
      expect(ids, `FED manquant pour ${p}`).toContain("FIN-01"); // FED
      expect(ids, `ALL manquant pour ${p}`).toContain("CASH-01"); // ALL
      expect(ids, `FACT-01 (ALL) manquant pour ${p}`).toContain("FACT-01");
    }
  });

  it("QC voit bien ses règles québécoises confirmées", () => {
    const qcIds = getRulesForProvince("QC").map((r) => r.id);
    expect(qcIds).toContain("TR-QC-06");
    expect(qcIds).toContain("TR-QC-08");
  });
});

describe("getDisplayableRules — aucune fuite d'INCERTAIN", () => {
  it("ne renvoie jamais de règle INCERTAIN, quelle que soit la province", () => {
    for (const p of ["QC", "ON"] as const) {
      const displayable = getDisplayableRules(p);
      expect(displayable.every((r) => r.confidence !== "INCERTAIN")).toBe(true);
      expect(displayable.every((r) => r.source.trim().length > 0)).toBe(true);
    }
  });

  it("les INCERTAIN restent visibles via getOpenQuestions (suivi interne)", () => {
    const openQc = getOpenQuestions("QC").map((r) => r.id);
    expect(openQc).toContain("TR-QC-11"); // RAP
    // et ne fuit pas dans l'affichage
    expect(getDisplayableRules("QC").map((r) => r.id)).not.toContain("TR-QC-11");
  });

  it("filtrage par domaine respecte la province et la doctrine d'affichage", () => {
    const fidQc = getDisplayableRulesByDomain("fideicommis", "QC");
    expect(fidQc.length).toBeGreaterThan(0);
    expect(fidQc.every((r) => r.domain === "fideicommis")).toBe(true);
    expect(fidQc.every((r) => r.jurisdiction !== "ON")).toBe(true);
    expect(fidQc.every((r) => r.confidence !== "INCERTAIN")).toBe(true);
  });
});

describe("getRuleById", () => {
  it("retrouve une règle connue", () => {
    expect(getRuleById("TR-ON-06")?.deadline).toBe("2026-03-31");
  });
  it("renvoie undefined pour un id inconnu", () => {
    expect(getRuleById("NOPE")).toBeUndefined();
  });
});
