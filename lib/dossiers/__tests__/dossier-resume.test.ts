import { describe, it, expect } from "vitest";
import {
  buildResumeSummary,
  dossierAuditLabel,
  eventTypeLabel,
  nextActionByKind,
  daysLeftUntil,
  type ResumeSummaryParts,
  type ResumeLastActivity,
} from "../dossier-resume";

const lastActivity: ResumeLastActivity = {
  label: "Funds proof uploaded",
  actorName: "Marie",
  actorType: "human",
  at: new Date("2026-05-28T00:00:00Z"),
};

describe("daysLeftUntil", () => {
  const now = new Date("2026-06-01T15:00:00Z");
  it("counts calendar days, floored at 0", () => {
    expect(daysLeftUntil(new Date("2026-06-04T00:00:00Z"), now)).toBe(3);
    expect(daysLeftUntil(new Date("2026-06-01T23:00:00Z"), now)).toBe(0);
    expect(daysLeftUntil(new Date("2026-05-20T00:00:00Z"), now)).toBe(0); // passé → 0
  });
});

describe("dossierAuditLabel", () => {
  it("maps known actions bilingually", () => {
    expect(dossierAuditLabel("create", "en")).toBe("Matter opened");
    expect(dossierAuditLabel("create", "fr")).toBe("Dossier ouvert");
    expect(dossierAuditLabel("ready_for_review", "en")).toBe("Marked ready for review");
  });
  it("humanizes unknown actions", () => {
    expect(dossierAuditLabel("identity_verified", "en")).toBe("Identity verified");
  });
});

describe("eventTypeLabel", () => {
  it("maps event types bilingually", () => {
    expect(eventTypeLabel("audience", "en")).toBe("Hearing");
    expect(eventTypeLabel("audience", "fr")).toBe("Audience");
    expect(eventTypeLabel("relance_facture", "fr")).toBe("Relance de facture");
  });
});

describe("nextActionByKind (localisé, jamais le FR dur)", () => {
  it("EN: legal English clean", () => {
    expect(nextActionByKind("identity", "en")).toBe("Verify the client's identity");
    expect(nextActionByKind("mandate", "en")).toBe("Create the engagement mandate");
    expect(nextActionByKind("billing_mode", "en")).toContain("billing mode");
  });
  it("FR: français propre", () => {
    expect(nextActionByKind("identity", "fr")).toBe("Vérifier l'identité du client");
    expect(nextActionByKind("assistant", "fr")).toBe("Assigner une assistante au dossier");
  });
});

describe("buildResumeSummary", () => {
  it("EN: last action + near deadline + next action", () => {
    const parts: ResumeSummaryParts = {
      lastActivity,
      nextAction: "Follow up with the client for the medical report",
      nearestDeadline: { label: "IRCC portal", date: new Date("2026-06-04T00:00:00Z"), daysLeft: 3 },
      state: "en_preparation",
    };
    const s = buildResumeSummary(parts, "en");
    expect(s).toContain("Last action: Funds proof uploaded by Marie");
    expect(s).toContain("IRCC portal in 3 days");
    expect(s).toContain("Next: Follow up");
  });

  it("FR: same shape in French", () => {
    const parts: ResumeSummaryParts = {
      lastActivity,
      nextAction: "Relancer le client",
      nearestDeadline: { label: "Portail IRCC", date: new Date("2026-06-04T00:00:00Z"), daysLeft: 1 },
      state: "en_preparation",
    };
    const s = buildResumeSummary(parts, "fr");
    expect(s).toContain("Dernière action : Funds proof uploaded par Marie");
    expect(s).toContain("Portail IRCC dans 1 jour");
    expect(s).toContain("Prochaine action : Relancer le client");
  });

  it("no history → opening sentence", () => {
    const parts: ResumeSummaryParts = {
      lastActivity: null,
      nextAction: null,
      nearestDeadline: null,
      state: "incomplet",
    };
    expect(buildResumeSummary(parts, "en")).toContain("recently opened");
    expect(buildResumeSummary(parts, "fr")).toContain("ouvert récemment");
  });

  it("ready for review → caught-up message, no next action", () => {
    const parts: ResumeSummaryParts = {
      lastActivity,
      nextAction: null,
      nearestDeadline: null,
      state: "pret_pour_revue",
    };
    expect(buildResumeSummary(parts, "en")).toContain("Everything is ready");
    expect(buildResumeSummary(parts, "fr")).toContain("Tout est prêt");
  });

  it("deadline today is phrased as today; far deadline (>7d) is omitted", () => {
    const today: ResumeSummaryParts = {
      lastActivity,
      nextAction: null,
      nearestDeadline: { label: "Hearing", date: new Date("2026-06-01T00:00:00Z"), daysLeft: 0 },
      state: "en_preparation",
    };
    expect(buildResumeSummary(today, "en")).toContain("Hearing is due today");

    const far: ResumeSummaryParts = {
      ...today,
      nearestDeadline: { label: "Hearing", date: new Date("2026-07-01T00:00:00Z"), daysLeft: 30 },
    };
    expect(buildResumeSummary(far, "en")).not.toContain("Hearing");
  });
});
