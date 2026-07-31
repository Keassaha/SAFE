import { describe, expect, it } from "vitest";
import {
  computeVerificationDueDate,
  evaluateIdentityForFundsMovement,
  exemptionReference,
  getFallbackProcedure,
  getIdentityRetentionRule,
  getRequiredIdentificationFields,
  getVerificationDeadline,
  getVerificationMethods,
  isExemptionValid,
  isVerificationMethodAccepted,
  ongoingMonitoringReference,
  requiresOngoingMonitoring,
  type IdentityState,
} from "../identity";

/**
 * CH-06.1 — Les deux régimes d'identification, côte à côte.
 *
 * Ces tests existent surtout pour empêcher un aplatissement futur. La tentation
 * naturelle, en lisant deux règlements qui se ressemblent, est d'en faire une règle
 * unique « raisonnable ». Chaque test ci-dessous documente une divergence qui, si
 * elle était aplatie, produirait soit un blocage illégitime, soit un trou.
 *
 * Sources : B-1 r.5 art. 13-14, 20-27 · By-Law 7.1 Partie III art. 20-24.
 */

const AT = new Date("2026-06-01T12:00:00Z");

function state(overrides: Partial<IdentityState> = {}): IdentityState {
  return {
    kind: "INDIVIDUAL",
    verified: false,
    verifiedAt: null,
    exemption: null,
    firstFundsMovementAt: null,
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════════
   Délais — la divergence la plus opérationnelle
   ════════════════════════════════════════════════════════════════ */

describe("Délais de vérification — QC ≠ ON", () => {
  it("Québec, personne physique : la vérification BLOQUE la réception de fonds (art. 26(1))", () => {
    const d = getVerificationDeadline("QC", "INDIVIDUAL");
    expect(d.blocksImmediately).toBe(true);
    expect(d.days).toBe(0);
    expect(d.reference).toContain("art. 26(1)");
  });

  it("Ontario, personne physique : la vérification suit le mouvement, elle ne le bloque pas (s. 23(5))", () => {
    // Le texte dit « immediately AFTER first engaging in the activities ». Bloquer
    // le premier mouvement en Ontario serait ajouter une exigence au règlement.
    const d = getVerificationDeadline("ON", "INDIVIDUAL");
    expect(d.blocksImmediately).toBe(false);
    expect(d.reference).toContain("s. 23(5)");
  });

  it("organisation : 60 jours au Québec, 30 jours en Ontario", () => {
    expect(getVerificationDeadline("QC", "ORGANIZATION").days).toBe(60);
    expect(getVerificationDeadline("ON", "ORGANIZATION").days).toBe(30);
  });

  it("calcule l'échéance à partir du premier mouvement de fonds", () => {
    expect(computeVerificationDueDate("QC", "ORGANIZATION", AT).toISOString().slice(0, 10)).toBe("2026-07-31");
    expect(computeVerificationDueDate("ON", "ORGANIZATION", AT).toISOString().slice(0, 10)).toBe("2026-07-01");
  });
});

/* ════════════════════════════════════════════════════════════════
   Évaluation
   ════════════════════════════════════════════════════════════════ */

describe("evaluateIdentityForFundsMovement", () => {
  it("BLOQUE un mouvement de fonds pour une personne physique non vérifiée au Québec", () => {
    const v = evaluateIdentityForFundsMovement("QC", state(), AT);
    expect(v.status).toBe("BLOCKING");
  });

  it("n'en bloque PAS l'équivalent ontarien, mais ouvre un délai", () => {
    const v = evaluateIdentityForFundsMovement("ON", state(), AT);
    expect(v.status).toBe("DUE");
  });

  it("laisse passer un client vérifié", () => {
    const v = evaluateIdentityForFundsMovement("QC", state({ verified: true }), AT);
    expect(v).toMatchObject({ status: "OK", reason: "verified" });
  });

  it("laisse passer une exemption valide, avec sa référence d'article", () => {
    const v = evaluateIdentityForFundsMovement(
      "QC",
      state({ exemption: "FONDS_HONORAIRES_OU_DEBOURS" }),
      AT,
    );
    expect(v).toMatchObject({ status: "OK", reason: "exempt", reference: "art. 21(5)d" });
  });

  it("REFUSE une exemption ontarienne invoquée par un cabinet québécois", () => {
    // Le virement électronique est une exemption ontarienne (s. 22(3)(f)). Au Québec,
    // l'exclusion du TEF est rédigée dans le déclencheur de l'art. 20, pas comme une
    // exemption de ce nom. Accorder une dispense qui n'existe pas ici serait grave.
    const v = evaluateIdentityForFundsMovement(
      "QC",
      state({ exemption: "FONDS_VIREMENT_ELECTRONIQUE" }),
      AT,
    );
    expect(v.status).toBe("BLOCKING");
  });

  it("passe en OVERDUE une organisation dont le délai est dépassé", () => {
    const v = evaluateIdentityForFundsMovement(
      "ON",
      state({ kind: "ORGANIZATION", firstFundsMovementAt: new Date("2026-04-01T12:00:00Z") }),
      AT,
    );
    expect(v.status).toBe("OVERDUE");
    if (v.status === "OVERDUE") expect(v.daysOverdue).toBeGreaterThan(0);
  });

  it("reste en DUE tant que le délai court", () => {
    const v = evaluateIdentityForFundsMovement(
      "QC",
      state({ kind: "ORGANIZATION", firstFundsMovementAt: new Date("2026-05-20T12:00:00Z") }),
      AT,
    );
    expect(v.status).toBe("DUE");
    if (v.status === "DUE") expect(v.daysRemaining).toBeGreaterThan(0);
  });

  it("est une fonction pure : `now` est injecté, jamais lu de l'horloge", () => {
    const s = state({ kind: "ORGANIZATION", firstFundsMovementAt: new Date("2026-01-01T00:00:00Z") });
    const a = evaluateIdentityForFundsMovement("ON", s, new Date("2026-02-01T00:00:00Z"));
    const b = evaluateIdentityForFundsMovement("ON", s, new Date("2026-02-01T00:00:00Z"));
    expect(a).toEqual(b);
  });
});

/* ════════════════════════════════════════════════════════════════
   Renseignements à obtenir
   ════════════════════════════════════════════════════════════════ */

describe("Renseignements exigés", () => {
  const keys = (p: "QC" | "ON", k: "INDIVIDUAL" | "ORGANIZATION", t: "RETAINER" | "FUNDS_MOVEMENT") =>
    getRequiredIdentificationFields(p, k, t).map((f) => f.key);

  it("exige l'occupation d'une personne physique dans les deux provinces", () => {
    expect(keys("QC", "INDIVIDUAL", "RETAINER")).toContain("occupation");
    expect(keys("ON", "INDIVIDUAL", "RETAINER")).toContain("occupation");
  });

  it("exige les personnes autorisées d'une organisation dans les deux provinces", () => {
    expect(keys("QC", "ORGANIZATION", "RETAINER")).toContain("personnesAutorisees");
    expect(keys("ON", "ORGANIZATION", "RETAINER")).toContain("personnesAutorisees");
  });

  it("n'exige la SOURCE DES FONDS qu'en Ontario (s. 23(2))", () => {
    // B-1 r.5 ne comporte aucune obligation équivalente. L'imposer à un cabinet
    // québécois serait inventer une exigence.
    expect(keys("ON", "INDIVIDUAL", "FUNDS_MOVEMENT")).toContain("sourceDesFonds");
    expect(keys("QC", "INDIVIDUAL", "FUNDS_MOVEMENT")).not.toContain("sourceDesFonds");
  });

  it("exige les détenteurs de 25 % et plus dans les deux provinces, sur mouvement de fonds", () => {
    expect(keys("QC", "ORGANIZATION", "FUNDS_MOVEMENT")).toContain("detenteurs25");
    expect(keys("ON", "ORGANIZATION", "FUNDS_MOVEMENT")).toContain("detenteurs25");
  });

  it("n'exige fiduciaires et structure de propriété qu'en Ontario", () => {
    expect(keys("ON", "ORGANIZATION", "FUNDS_MOVEMENT")).toContain("fiducieBeneficiaires");
    expect(keys("ON", "ORGANIZATION", "FUNDS_MOVEMENT")).toContain("structurePropriete");
    expect(keys("QC", "ORGANIZATION", "FUNDS_MOVEMENT")).not.toContain("fiducieBeneficiaires");
  });

  it("le Québec exige l'occupation des administrateurs, l'Ontario seulement leur nom", () => {
    const qc = getRequiredIdentificationFields("QC", "ORGANIZATION", "FUNDS_MOVEMENT").find((f) => f.key === "administrateurs");
    const on = getRequiredIdentificationFields("ON", "ORGANIZATION", "FUNDS_MOVEMENT").find((f) => f.key === "administrateurs");
    expect(qc?.labelFr).toMatch(/occupation/i);
    expect(on?.labelFr).not.toMatch(/occupation/i);
  });

  it("porte une référence d'article sur chaque champ (PR-4)", () => {
    for (const p of ["QC", "ON"] as const) {
      for (const k of ["INDIVIDUAL", "ORGANIZATION"] as const) {
        for (const field of getRequiredIdentificationFields(p, k, "FUNDS_MOVEMENT")) {
          expect(field.reference.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Méthodes de vérification
   ════════════════════════════════════════════════════════════════ */

describe("Méthodes de vérification", () => {
  it("l'Ontario énumère limitativement ; le répondant québécois n'y figure pas", () => {
    expect(isVerificationMethodAccepted("QC", "INDIVIDUAL", "ATTESTATION_REPONDANT")).toBe(true);
    expect(isVerificationMethodAccepted("ON", "INDIVIDUAL", "ATTESTATION_REPONDANT")).toBe(false);
  });

  it("les méthodes ontariennes ne sont pas servies à un cabinet québécois", () => {
    expect(isVerificationMethodAccepted("ON", "INDIVIDUAL", "DUAL_PROCESS")).toBe(true);
    expect(isVerificationMethodAccepted("QC", "INDIVIDUAL", "DUAL_PROCESS")).toBe(false);
  });

  it("distingue les méthodes applicables aux personnes et aux organisations", () => {
    expect(isVerificationMethodAccepted("ON", "ORGANIZATION", "GOVERNMENT_PHOTO_ID")).toBe(false);
    expect(isVerificationMethodAccepted("ON", "ORGANIZATION", "GOVERNMENT_REGISTRY")).toBe(true);
  });

  it("porte une référence sur chaque méthode", () => {
    for (const p of ["QC", "ON"] as const) {
      for (const v of getVerificationMethods(p)) {
        expect(v.reference).toMatch(/B-1 r\.5|By-Law 7\.1/);
      }
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Exemptions
   ════════════════════════════════════════════════════════════════ */

describe("Exemptions", () => {
  it("valide une exemption de la bonne province", () => {
    expect(isExemptionValid("QC", "FONDS_ORDONNANCE_OU_AMENDE")).toBe(true);
    expect(isExemptionValid("ON", "FONDS_AMENDE_PENALITE_CAUTION")).toBe(true);
  });

  it("rejette une exemption de l'autre province", () => {
    expect(isExemptionValid("QC", "FONDS_VIREMENT_ELECTRONIQUE")).toBe(false);
    expect(isExemptionValid("ON", "FONDS_REGLEMENT_PROCEDURE")).toBe(false);
  });

  it("renvoie la référence d'article de chaque exemption", () => {
    expect(exemptionReference("QC", "AGIT_POUR_EMPLOYEUR")).toBe("art. 21(2)");
    expect(exemptionReference("ON", "AGIT_POUR_EMPLOYEUR")).toBe("s. 22(2)(a)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Obligations propres à l'Ontario
   ════════════════════════════════════════════════════════════════ */

describe("Obligations sans équivalent québécois", () => {
  it("la surveillance continue n'existe qu'en Ontario (s. 23.1)", () => {
    expect(requiresOngoingMonitoring("ON")).toBe(true);
    expect(requiresOngoingMonitoring("QC")).toBe(false);
    expect(ongoingMonitoringReference("QC")).toBeNull();
  });

  it("la procédure de repli sur la propriété effective n'existe qu'en Ontario (s. 23(2.2))", () => {
    const on = getFallbackProcedure("ON");
    expect(on.available).toBe(true);
    expect(on.steps).toHaveLength(3);
    expect(getFallbackProcedure("QC").available).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Conservation
   ════════════════════════════════════════════════════════════════ */

describe("Conservation des renseignements d'identification", () => {
  it("Québec : 7 ans, ancrés sur la fermeture du dossier", () => {
    const r = getIdentityRetentionRule("QC");
    expect(r.minYearsAfterCompletion).toBe(7);
    expect(r.alsoForDurationOfRelationship).toBe(false);
  });

  it("Ontario : la PLUS LONGUE de la durée de la relation ou de 6 ans (s. 23(14))", () => {
    // Ce n'est pas « 6 ans ». C'est un maximum entre deux ancrages, et un logiciel
    // qui purgerait à 6 ans pile violerait la règle pour un client toujours actif.
    const r = getIdentityRetentionRule("ON");
    expect(r.minYearsAfterCompletion).toBe(6);
    expect(r.alsoForDurationOfRelationship).toBe(true);
  });
});
