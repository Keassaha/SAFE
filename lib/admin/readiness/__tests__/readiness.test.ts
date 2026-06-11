import { describe, it, expect } from "vitest";
import {
  evaluateReadiness,
  enforceEvidenceRule,
  evaluateRetention,
  evaluateTaxes,
  evaluateBilling,
  evaluateTrust,
  evaluateUserAccess,
  evaluateConsole,
  evaluateRoles,
  evaluateTeam,
  evaluateAuditLog,
  evaluateSecurity,
  evaluateOnboarding,
  type CabinetReadinessSnapshot,
  type DomainResult,
} from "@/lib/admin/readiness";
import { RETENTION_REQUIREMENTS } from "@/lib/admin/readiness/retention-requirements";

function makeSnapshot(over: Partial<CabinetReadinessSnapshot> = {}): CabinetReadinessSnapshot {
  return {
    identity: { nom: "Cabinet X", adresse: "1 rue Test", email: "x@test.ca", barreauNumero: "12345" },
    province: "QC",
    taxNumbers: { gstNumber: "123456789RT0001", qstNumber: "1234567890TQ0001" },
    team: {
      employees: [{ role: "ADMIN_ACCOUNTANT", status: "active", userId: "u1" }],
      adminUserCount: 1,
    },
    audit: { lastEntryAt: new Date("2026-01-01T00:00:00Z") },
    billing: { hasInvoiceConfig: true, template: "standard", hasNotice: true, hasSignature: false },
    trust: null,
    userAccess: { totalUsers: 1, usersWithoutEmployee: 0 },
    console: { isSafeInc: false },
    subscription: {
      plan: "essentiel",
      stripeSubscriptionStatus: "active",
      stripeCurrentPeriodEnd: null,
      stripeCancelAtPeriodEnd: false,
      stripeTrialEnd: null,
    },
    retention: { policies: [] },
    ...over,
  };
}

const ALL_TYPES = RETENTION_REQUIREMENTS.map((r) => r.documentType);

function fullCoverage(years = 12) {
  return ALL_TYPES.map((documentType) => ({ documentType, retentionYears: years }));
}

describe("Readiness — règle d'or (jamais complete sans preuve)", () => {
  it("rétrograde un `complete` dont un check n'a pas de preuve", () => {
    const fake: DomainResult = {
      domain: "identity",
      title: "X",
      state: "complete",
      checks: [
        { id: "a", label: "A", passed: true, evidence: "ok" },
        { id: "b", label: "B", passed: true, evidence: null }, // pas de preuve
      ],
      evidence: "prétendu complet",
      action: null,
    };
    expect(enforceEvidenceRule(fake).state).toBe("to_complete");
  });

  it("laisse `complete` si tous les checks passent ET ont une preuve", () => {
    const real: DomainResult = {
      domain: "identity",
      title: "X",
      state: "complete",
      checks: [{ id: "a", label: "A", passed: true, evidence: "ok" }],
      evidence: "prouvé",
      action: null,
    };
    expect(enforceEvidenceRule(real).state).toBe("complete");
  });

  it("ne touche pas un état non-complete", () => {
    const blocking: DomainResult = {
      domain: "province",
      title: "X",
      state: "blocking",
      checks: [{ id: "a", label: "A", passed: false, evidence: null }],
      evidence: null,
      action: "fix",
    };
    expect(enforceEvidenceRule(blocking).state).toBe("blocking");
  });
});

describe("Readiness — domaine Rétention (couverture réelle par type)", () => {
  it("province absente -> blocking", () => {
    const r = evaluateRetention(makeSnapshot({ province: null }));
    expect(r.state).toBe("blocking");
  });

  it("aucune politique -> to_complete, 0 couvert", () => {
    const r = evaluateRetention(makeSnapshot({ retention: { policies: [] } }));
    expect(r.state).toBe("to_complete");
    expect(r.data?.covered).toBe(0);
    expect(r.data?.required).toBe(ALL_TYPES.length);
  });

  it("couverture partielle -> to_complete avec ratio", () => {
    const r = evaluateRetention(
      makeSnapshot({ retention: { policies: [{ documentType: "contrat", retentionYears: 10 }] } }),
    );
    expect(r.state).toBe("to_complete");
    expect(r.data?.covered).toBe(1);
    expect((r.data?.missing as string[]).length).toBe(ALL_TYPES.length - 1);
  });

  it("couverture complète + durées suffisantes -> complete (avec preuve)", () => {
    const r = evaluateRetention(makeSnapshot({ retention: { policies: fullCoverage(12) } }));
    expect(r.state).toBe("complete");
    expect(r.evidence).toContain(`${ALL_TYPES.length} / ${ALL_TYPES.length}`);
  });

  it("couverture complète mais une durée sous le minimum -> warning", () => {
    const policies = fullCoverage(12).map((p) =>
      p.documentType === "comptabilite_dossier" ? { ...p, retentionYears: 3 } : p,
    );
    const r = evaluateRetention(makeSnapshot({ retention: { policies } }));
    expect(r.state).toBe("warning");
    expect((r.data?.belowMinimum as unknown[]).length).toBe(1);
  });

  it("ON exige 10 ans pour le fidéicommis : 7 ans -> sous le minimum (warning)", () => {
    const policies = fullCoverage(12).map((p) =>
      p.documentType === "fideicommis" ? { ...p, retentionYears: 7 } : p,
    );
    const r = evaluateRetention(makeSnapshot({ province: "ON", retention: { policies } }));
    expect(r.state).toBe("warning");
  });

  it("matching tolérant : alias et accents (« Pièce d'identité » -> piece_identite)", () => {
    const policies = fullCoverage(12).filter((p) => p.documentType !== "piece_identite");
    policies.push({ documentType: "Pièce d'identité", retentionYears: 12 });
    const r = evaluateRetention(makeSnapshot({ retention: { policies } }));
    expect(r.state).toBe("complete"); // l'accentué a bien été reconnu
  });
});

describe("Readiness — rapport agrégé", () => {
  it("assemble score, counts, blocking ; les 14 domaines sont branchés", () => {
    const report = evaluateReadiness(makeSnapshot({ retention: { policies: fullCoverage(12) } }));
    // 13 domaines de base + onboarding agrégé.
    expect(report.domains.length).toBe(14);
    expect(report.score).toBeGreaterThan(0);
    expect(report.score).toBeLessThanOrEqual(100);
    // P2 clos : plus aucun domaine en attente.
    expect(report.pending.length).toBe(0);
    // tout vert ici -> aucun bloquant
    expect(report.blocking.length).toBe(0);
  });

  it("province manquante propage 2 bloquants (province + rétention)", () => {
    const report = evaluateReadiness(makeSnapshot({ province: null, retention: { policies: [] } }));
    const blockingDomains = report.blocking.map((d) => d.domain);
    expect(blockingDomains).toContain("province");
    expect(blockingDomains).toContain("retention");
  });
});

describe("Readiness — nouveaux domaines", () => {
  it("Taxes QC : TPS+TVQ présents -> complete ; manquants -> to_complete", () => {
    expect(evaluateTaxes(makeSnapshot()).state).toBe("complete");
    expect(evaluateTaxes(makeSnapshot({ taxNumbers: {} })).state).toBe("to_complete");
  });

  it("Taxes ON : HST attendu, pas TPS/TVQ", () => {
    const ok = evaluateTaxes(makeSnapshot({ province: "ON", taxNumbers: { hstNumber: "12345HST" } }));
    expect(ok.state).toBe("complete");
    const ko = evaluateTaxes(makeSnapshot({ province: "ON", taxNumbers: { gstNumber: "x" } }));
    expect(ko.state).toBe("to_complete");
  });

  it("Rôles : aucun admin -> blocking", () => {
    const r = evaluateRoles(makeSnapshot({ team: { employees: [], adminUserCount: 0 } }));
    expect(r.state).toBe("blocking");
  });

  it("Rôles : un rôle non connectable (INTERN) avec compte -> warning", () => {
    const r = evaluateRoles(
      makeSnapshot({
        team: {
          adminUserCount: 1,
          employees: [{ role: "INTERN", status: "active", userId: "u9" }],
        },
      }),
    );
    expect(r.state).toBe("warning");
  });

  it("Équipe : aucun actif -> to_complete ; un actif -> complete", () => {
    expect(evaluateTeam(makeSnapshot({ team: { employees: [], adminUserCount: 0 } })).state).toBe(
      "to_complete",
    );
    expect(evaluateTeam(makeSnapshot()).state).toBe("complete");
  });

  it("Journal d'audit : écriture présente -> complete ; aucune -> to_complete", () => {
    expect(evaluateAuditLog(makeSnapshot()).state).toBe("complete");
    expect(evaluateAuditLog(makeSnapshot({ audit: { lastEntryAt: null } })).state).toBe("to_complete");
  });

  it("Sécurité : honnêtement to_complete (pas de MFA mesurable), jamais complete", () => {
    expect(evaluateSecurity(makeSnapshot()).state).toBe("to_complete");
  });

  it("Onboarding : complete si aucun bloquant, to_complete sinon", () => {
    const noBlock: DomainResult[] = [
      { domain: "identity", title: "I", state: "complete", checks: [], evidence: "ok", action: null },
    ];
    expect(evaluateOnboarding(noBlock).state).toBe("complete");
    const withBlock: DomainResult[] = [
      { domain: "province", title: "P", state: "blocking", checks: [], evidence: null, action: "fix" },
    ];
    expect(evaluateOnboarding(withBlock).state).toBe("to_complete");
  });

  it("Facturation : gabarit non personnalisé -> to_complete ; personnalisé -> complete", () => {
    expect(
      evaluateBilling(
        makeSnapshot({ billing: { hasInvoiceConfig: false, template: null, hasNotice: false, hasSignature: false } }),
      ).state,
    ).toBe("to_complete");
    expect(evaluateBilling(makeSnapshot()).state).toBe("complete");
  });

  it("Fidéicommis : aucune activité -> not_applicable ; en retard -> blocking ; à jour -> complete", () => {
    expect(evaluateTrust(makeSnapshot({ trust: null })).state).toBe("not_applicable");
    expect(
      evaluateTrust(
        makeSnapshot({
          trust: {
            isOverdue: true,
            daysOverdue: 12,
            expectedPeriode: "2026-03",
            lastCertifiedPeriode: null,
            hasNeverReconciled: true,
            hasTrustActivity: true,
          },
        }),
      ).state,
    ).toBe("blocking");
    expect(
      evaluateTrust(
        makeSnapshot({
          trust: {
            isOverdue: false,
            daysOverdue: 0,
            expectedPeriode: "2026-03",
            lastCertifiedPeriode: "2026-03",
            hasNeverReconciled: false,
            hasTrustActivity: true,
          },
        }),
      ).state,
    ).toBe("complete");
  });

  it("Accès utilisateurs : comptes orphelins -> warning ; tous rattachés -> complete", () => {
    expect(
      evaluateUserAccess(makeSnapshot({ userAccess: { totalUsers: 3, usersWithoutEmployee: 2 } })).state,
    ).toBe("warning");
    expect(evaluateUserAccess(makeSnapshot()).state).toBe("complete");
  });

  it("Console : cabinet non SAFE -> not_applicable ; cabinet SAFE -> blocking (garde par nom)", () => {
    expect(evaluateConsole(makeSnapshot({ console: { isSafeInc: false } })).state).toBe("not_applicable");
    expect(evaluateConsole(makeSnapshot({ console: { isSafeInc: true } })).state).toBe("blocking");
  });
});
