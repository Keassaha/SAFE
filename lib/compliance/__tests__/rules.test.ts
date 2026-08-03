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

  it("le flag de branchement est ALLUMÉ par défaut depuis CH-12", () => {
    // Il est resté éteint tant que le registre n'avait pas été confronté au texte
    // primaire, et il avait raison de l'être : huit entrées étaient fausses. Elles
    // sont corrigées, et la doctrine ADR-011 continue de filtrer les INCERTAIN.
    expect(COMPLIANCE_RULES_ENABLED).toBe(true);
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
    expect(openQc).toContain("CONF-QC-01"); // Code de déontologie non lu
    // et ne fuit pas dans l'affichage
    expect(getDisplayableRules("QC").map((r) => r.id)).not.toContain("CONF-QC-01");
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

/* ════════════════════════════════════════════════════════════════
   CH-12 — Les huit entrées corrigées
   ════════════════════════════════════════════════════════════════

   L'audit du 2026-07-30 (§0.3) a trouvé huit entrées fausses ou imprécises. Ces tests
   les verrouillent : si quelqu'un réintroduit l'ancienne formulation, ils tombent.
   ════════════════════════════════════════════════════════════════ */

describe("CH-12 — corrections du registre", () => {
  it("TR-QC-09 porte les trois conditions de l'art. 50, pas seulement le délai", () => {
    const r = getRuleById("TR-QC-09")!;
    expect(r.statement.fr).toContain("succursale québécoise");
    expect(r.statement.fr).toContain("entente avec le Barreau");
    expect(r.statement.fr).toContain("en fidéicommis");
    expect(r.article).toBe("art. 50");
  });

  it("TR-ON-05 cite la s. 7(1) et son mot « immédiatement », pas l'art. 1(3)", () => {
    // L'art. 1(3) est une présomption limitée aux par. 9(1)(2)(3) et à l'art. 14.
    // Le citer comme règle de délai était à la fois faux et plus permissif que le texte.
    const r = getRuleById("TR-ON-05")!;
    expect(r.article).toBe("s. 7(1)");
    expect(r.statement.fr).toMatch(/IMMÉDIATEMENT/);
    expect(r.statement.fr).not.toContain("jour ouvrable");
  });

  it("la règle des espèces est SCINDÉE, et l'Ontario porte l'agrégation", () => {
    // C'était la correction la plus grave : l'entrée unique bloquait ce qui est permis
    // et laissait passer ce qui est interdit.
    expect(getRuleById("CASH-01")).toBeUndefined();

    const qc = getRuleById("CASH-QC-01")!;
    expect(qc.jurisdiction).toBe("QC");
    expect(qc.statement.fr).toContain("six exceptions");

    const on = getRuleById("CASH-ON-01")!;
    expect(on.jurisdiction).toBe("ON");
    expect(on.statement.fr).toContain("AGRÉGÉ");
  });

  it("chaque province ne voit que sa règle d'espèces", () => {
    expect(getRulesForProvince("QC").map((r) => r.id)).not.toContain("CASH-ON-01");
    expect(getRulesForProvince("ON").map((r) => r.id)).not.toContain("CASH-QC-01");
  });

  it("CASH-QC-02 nomme le destinataire et le contenu de la déclaration", () => {
    // Une déclaration nue envoyée au bon moment ne satisfait pas l'art. 71.
    const r = getRuleById("CASH-QC-02")!;
    expect(r.statement.fr).toContain("INSPECTION PROFESSIONNELLE");
    expect(r.statement.fr).toContain("copie du reçu");
    expect(r.statement.fr).toContain("fondement");
  });

  it("RET-QC-01 et RET-QC-02 portent DEUX points de départ différents", () => {
    // Les confondre fait purger trop tôt.
    expect(getRuleById("RET-QC-01")!.statement.fr).toContain("FERMETURE DU DOSSIER");
    expect(getRuleById("RET-QC-02")!.statement.fr).toContain("FIN DE L'EXERCICE");
  });

  it("TR-QC-04 ne dit plus que l'art. 43 n'est pas couvert", () => {
    const r = getRuleById("TR-QC-04")!;
    expect(r.note ?? "").not.toMatch(/non couvert/);
    expect(r.note ?? "").toContain("CH-08");
  });

  it("TR-QC-12 tranche : aucun audit CPA imposé par B-1 r. 5", () => {
    const r = getRuleById("TR-QC-12")!;
    expect(r.confidence).toBe("CONFIRME");
    expect(r.statement.fr).toMatch(/Aucun audit annuel/);
    // Et l'affirmation reste bornée au règlement lu.
    expect(r.note ?? "").toContain("D'autres instruments");
  });

  it("TR-QC-11 remplace le « RAP » inexistant par l'art. 42", () => {
    // Garder un identifiant pour un document qui n'existe pas sous ce nom aurait
    // envoyé un cabinet chercher le mauvais formulaire.
    const r = getRuleById("TR-QC-11")!;
    expect(r.statement.fr).not.toContain("RAP");
    expect(r.article).toBe("art. 42");
    expect(r.confidence).toBe("CONFIRME");
  });
});

describe("CH-12 — traçabilité des règles vérifiées", () => {
  it("toute règle citant un article de B-1 r.5 ou de By-Law 9 porte sa date de vérification", () => {
    // Une règle sans date de vérification ne peut être ni défendue ni corrigée : on ne
    // sait pas contre quoi elle a été confrontée.
    const sourcees = COMPLIANCE_RULES.filter((r) =>
      /LegisQuébec|PDF officiel/.test(r.source),
    );
    expect(sourcees.length).toBeGreaterThan(0);
    for (const r of sourcees) {
      expect(r.verifiedOn, `${r.id} sans date de vérification`).toBeTruthy();
    }
  });

  it("un contrôle logiciel déclaré pointe vers un module et une fonction", () => {
    for (const r of COMPLIANCE_RULES.filter((x) => x.controlId)) {
      expect(r.controlId, `${r.id}`).toMatch(/^lib\/.+#.+$/);
    }
  });
});
