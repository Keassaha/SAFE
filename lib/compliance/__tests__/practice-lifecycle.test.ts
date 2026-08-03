import { describe, expect, it } from "vitest";
import {
  canDestroyDocument,
  closedMattersListSince,
  evaluateDeadline,
  findMissingAnticipatoryDuties,
  getCessationDuties,
  getCodeRegisterDuty,
  getDeadlineRule,
} from "../practice-lifecycle";

/**
 * CH-12 — Cycle de vie du cabinet.
 *
 * Sources : B-1 r.5 art. 7, 9, 15, 19, 74 à 82.
 *
 * Ces articles ne parlent pas de fidéicommis. Ils décrivent ce qu'un cabinet doit tenir
 * pour être un cabinet, et un inspecteur les vérifie au même titre que la comptabilité.
 *
 * Côté ontarien le module est presque muet, DÉLIBÉRÉMENT : By-Law 9 ne traite ni la
 * prescription, ni les originaux du client, ni la cession de pratique. Ces obligations
 * existent probablement, dans des textes qui n'ont pas été lus. Les inventer par
 * symétrie serait la pire façon de servir un cabinet ontarien.
 */

const NOW = new Date("2026-08-03T12:00:00Z");

/* ════════════════════════════════════════════════════════════════
   Art. 7 — prescription
   ════════════════════════════════════════════════════════════════ */

describe("Délais et prescription (art. 7)", () => {
  it("distingue ce qui éteint un droit de ce qui se rattrape", () => {
    // Manquer une prescription n'est pas un retard : c'est une faute qui se répare en
    // indemnisant.
    expect(getDeadlineRule({ kind: "PRESCRIPTION", province: "QC" }).extinguishesRight).toBe(true);
    expect(getDeadlineRule({ kind: "PROCEDURE", province: "QC" }).extinguishesRight).toBe(false);
  });

  it("DÉCLARE que les préavis ne viennent pas du règlement", () => {
    // L'art. 7 dit « à jour ». Il ne dit ni 90 jours, ni 30, ni 7.
    const r = getDeadlineRule({ kind: "PRESCRIPTION", province: "QC" });
    expect(r.noteFr).toContain("choix de produit");
  });

  it("n'alerte pas tant qu'aucun palier n'est franchi", () => {
    const a = evaluateDeadline({
      kind: "PRESCRIPTION",
      dueAt: new Date("2028-01-01T00:00:00Z"),
      now: NOW,
      province: "QC",
    });
    expect(a.severity).toBe("NONE");
    expect(a.triggeredAt).toBeNull();
  });

  it("franchit le palier le plus proche, pas le plus large", () => {
    const a = evaluateDeadline({
      kind: "PRESCRIPTION",
      dueAt: new Date("2026-09-15T12:00:00Z"),
      now: NOW,
      province: "QC",
    });
    expect(a.triggeredAt).toBe(90);
  });

  it("passe en CRITIQUE dans les trente derniers jours d'une prescription", () => {
    const a = evaluateDeadline({
      kind: "PRESCRIPTION",
      dueAt: new Date("2026-08-20T12:00:00Z"),
      now: NOW,
      province: "QC",
    });
    expect(a.severity).toBe("CRITICAL");
  });

  it("laisse un délai de procédure en avertissement, pas en critique", () => {
    const a = evaluateDeadline({
      kind: "PROCEDURE",
      dueAt: new Date("2026-08-05T12:00:00Z"),
      now: NOW,
      province: "QC",
    });
    expect(a.severity).toBe("WARNING");
  });

  it("CONTINUE de signaler une prescription DÉPASSÉE", () => {
    // C'est précisément le moment où le cabinet doit agir : aviser le client, aviser
    // l'assureur. Un système qui la ferait disparaître aiderait à l'oublier.
    const a = evaluateDeadline({
      kind: "PRESCRIPTION",
      dueAt: new Date("2026-06-01T12:00:00Z"),
      now: NOW,
      province: "QC",
    });
    expect(a.overdue).toBe(true);
    expect(a.severity).toBe("CRITICAL");
    expect(a.messageFr).toContain("assureur");
  });

  it("N'ATTRIBUE PAS l'obligation à un article ontarien inexistant", () => {
    const r = getDeadlineRule({ kind: "PRESCRIPTION", province: "ON" });
    expect(r.reference).toContain("non vérifiée en Ontario");
    expect(r.reference).not.toMatch(/By-Law 9, s\./);
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 9 — dossiers fermés
   ════════════════════════════════════════════════════════════════ */

describe("Liste des dossiers fermés (art. 9)", () => {
  it("remonte à sept ans", () => {
    expect(closedMattersListSince(NOW).toISOString().slice(0, 10)).toBe("2019-08-03");
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 15 — registre des codes
   ════════════════════════════════════════════════════════════════ */

describe("Registre des codes (art. 15)", () => {
  it("n'est exigé QUE si les dossiers sont codifiés", () => {
    // Imposer le registre à un cabinet qui nomme ses dossiers en clair ajouterait à
    // l'obligation. Le conditionnel de l'article est repris tel quel.
    expect(
      getCodeRegisterDuty({ province: "QC", usesCodedIdentification: false }).required,
    ).toBe(false);
    expect(
      getCodeRegisterDuty({ province: "QC", usesCodedIdentification: true }).required,
    ).toBe(true);
  });

  it("ne prétend pas couvrir l'Ontario", () => {
    const d = getCodeRegisterDuty({ province: "ON", usesCodedIdentification: true });
    expect(d.required).toBe(false);
    expect(d.dutyFr).toContain("n'a pas été lu");
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 19 — originaux du client
   ════════════════════════════════════════════════════════════════ */

describe("Originaux appartenant au client (art. 19)", () => {
  it("refuse la destruction sans autorisation ni offre de reprise", () => {
    const v = canDestroyDocument({ province: "QC", isClientOriginal: true });
    expect(v.allowed).toBe(false);
    expect(v.reference).toBe("B-1 r.5, art. 19");
  });

  it("admet DEUX portes de sortie, pas une", () => {
    // Un système qui n'admettrait que l'autorisation bloquerait un cabinet dont le
    // client ne répond plus, et le pousserait à détruire sans rien consigner.
    expect(
      canDestroyDocument({
        province: "QC",
        isClientOriginal: true,
        clientAuthorizedAt: new Date("2026-01-10"),
      }).allowed,
    ).toBe(true);
    expect(
      canDestroyDocument({
        province: "QC",
        isClientOriginal: true,
        returnOfferedAt: new Date("2026-01-10"),
      }).allowed,
    ).toBe(true);
  });

  it("N'INVENTE AUCUN délai après l'offre de reprise", () => {
    // L'art. 19 ne dit pas combien de temps attendre. Le déclarer « écoulé »
    // fabriquerait une règle.
    const v = canDestroyDocument({
      province: "QC",
      isClientOriginal: true,
      returnOfferedAt: new Date("2026-07-30"),
    });
    expect(v.allowed).toBe(true);
    expect(v.remedyFr).toContain("ne fixe aucun délai");
  });

  it("laisse passer un document qui n'est pas un original du client", () => {
    expect(canDestroyDocument({ province: "QC", isClientOriginal: false }).allowed).toBe(true);
  });

  it("dit sa porte de sortie quand il refuse", () => {
    const v = canDestroyDocument({ province: "QC", isClientOriginal: true });
    expect(v.remedyFr).toContain("OU");
  });
});

/* ════════════════════════════════════════════════════════════════
   Art. 74-82 — cessation d'exercice
   ════════════════════════════════════════════════════════════════ */

describe("Cessation d'exercice (art. 74 à 82)", () => {
  it("expose le cessionnaire comme une obligation PERMANENTE", () => {
    // L'obligation la plus facile à manquer : elle se tient à froid, des années avant
    // qu'elle ne serve, et rien ne la rappelle.
    const anticipees = getCessationDuties({ province: "QC" });
    expect(anticipees.map((d) => d.id)).toEqual(["CESS-78-CESSIONNAIRE"]);
    expect(anticipees[0]!.anticipatory).toBe(true);
  });

  it("déploie les obligations de cession quand la cause survient", () => {
    const d = getCessationDuties({ province: "QC", cause: "DECES" });
    expect(d.map((x) => x.id)).toContain("CESS-75-CESSION");
    expect(d.map((x) => x.id)).toContain("CESS-76-AVIS");
    expect(d.map((x) => x.id)).toContain("CESS-82-CONSERVATION");
  });

  it("exige DEUX avis écrits distincts : le syndic ET les clients", () => {
    const avis = getCessationDuties({ province: "QC", cause: "RETRAIT" }).find(
      (d) => d.id === "CESS-76-AVIS",
    )!;
    expect(avis.detailFr).toContain("syndic");
    expect(avis.detailFr).toContain("clients");
  });

  it("rappelle que la cessation n'éteint pas la conservation", () => {
    const c = getCessationDuties({ province: "QC", cause: "DECES" }).find(
      (d) => d.id === "CESS-82-CONSERVATION",
    )!;
    expect(c.detailFr).toContain("n'éteint pas");
  });

  it("signale un cabinet sans cessionnaire désigné", () => {
    const m = findMissingAnticipatoryDuties({ province: "QC", hasDesignatedSuccessor: false });
    expect(m).toHaveLength(1);
    expect(
      findMissingAnticipatoryDuties({ province: "QC", hasDesignatedSuccessor: true }),
    ).toHaveLength(0);
  });

  it("NE MODÉLISE RIEN en Ontario faute de texte lu", () => {
    // Le LSO impose un plan de succession, relevé en recherche web mais jamais lu dans
    // un texte officiel. L'inventer par symétrie serait pire que de l'omettre.
    expect(getCessationDuties({ province: "ON", cause: "DECES" })).toEqual([]);
    expect(
      findMissingAnticipatoryDuties({ province: "ON", hasDesignatedSuccessor: false }),
    ).toEqual([]);
  });
});
