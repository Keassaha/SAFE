import { describe, expect, it } from "vitest";
import {
  accountNumberLast4,
  blockingViolations,
  defaultInterestBeneficiary,
  getPostOpeningDuties,
  labelHasTrustMarker,
  labelRequirementReference,
  validateTrustBankAccount,
  type TrustBankAccountDraft,
} from "../trust-bank-account";

/**
 * CH-01.2 — Règles d'ouverture d'un compte bancaire en fidéicommis.
 *
 * Sources : B-1 r.5 art. 36, 50, 51, 62, 63, 64 · By-Law 9 s. 7.
 */

const OPENED = new Date("2026-06-01T00:00:00Z");

function draft(overrides: Partial<TrustBankAccountDraft> = {}): TrustBankAccountDraft {
  return {
    type: "GENERAL",
    accountLabel: "Me Derisier avocate en fidéicommis",
    institutionName: "Desjardins",
    accountNumber: "123456789",
    barreauAgreementConfirmed: true,
    openedAt: OPENED,
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════════
   Libellé — art. 50 al. 2 et 63 al. 2
   ════════════════════════════════════════════════════════════════ */

describe("Libellé du compte", () => {
  it("accepte « en fidéicommis »", () => {
    expect(labelHasTrustMarker("Cabinet Tremblay en fidéicommis")).toBe(true);
  });

  it("accepte la forme sans accent, telle que la banque l'écrit souvent", () => {
    expect(labelHasTrustMarker("CABINET TREMBLAY EN FIDEICOMMIS")).toBe(true);
  });

  it("accepte « in trust »", () => {
    expect(labelHasTrustMarker("Tremblay Law in Trust")).toBe(true);
  });

  it("accepte « trust account », la désignation ontarienne (s. 7(1))", () => {
    expect(labelHasTrustMarker("Tremblay Law Trust Account")).toBe(true);
  });

  it("REFUSE un compte courant présenté comme compte en fidéicommis", () => {
    // C'est l'erreur réelle : le cabinet saisit son compte d'opérations et croit
    // avoir un compte en fidéicommis. Le mélange des fonds commence là.
    expect(labelHasTrustMarker("Cabinet Tremblay compte courant")).toBe(false);
  });

  it("cite l'article selon la province et le type de compte", () => {
    expect(labelRequirementReference("QC", "GENERAL")).toContain("art. 50");
    expect(labelRequirementReference("QC", "PARTICULIER")).toContain("art. 63");
    expect(labelRequirementReference("ON", "GENERAL")).toContain("s. 7(1)");
  });
});

/* ════════════════════════════════════════════════════════════════
   Validation d'ouverture
   ════════════════════════════════════════════════════════════════ */

describe("validateTrustBankAccount", () => {
  it("accepte un compte général québécois conforme", () => {
    expect(blockingViolations(validateTrustBankAccount("QC", draft()))).toHaveLength(0);
  });

  it("BLOQUE un libellé sans mention réglementaire", () => {
    const v = blockingViolations(
      validateTrustBankAccount("QC", draft({ accountLabel: "Compte d'opérations" })),
    );
    expect(v.map((x) => x.code)).toContain("LABEL_MISSING_TRUST_MARKER");
  });

  it("BLOQUE l'absence d'institution ou de numéro de compte", () => {
    const v = blockingViolations(
      validateTrustBankAccount("QC", draft({ institutionName: "  ", accountNumber: "" })),
    );
    expect(v.map((x) => x.code)).toEqual(
      expect.arrayContaining(["INSTITUTION_REQUIRED", "ACCOUNT_NUMBER_REQUIRED"]),
    );
  });

  it("renvoie TOUS les manquements d'un coup, pas le premier", () => {
    // Un utilisateur qui ouvre un compte veut voir tout ce qui cloche, pas corriger
    // un champ à la fois.
    const v = validateTrustBankAccount(
      "QC",
      draft({ accountLabel: "Compte courant", institutionName: "", accountNumber: "" }),
    );
    expect(v.length).toBeGreaterThanOrEqual(3);
  });

  it("BLOQUE un compte particulier sans client (art. 62)", () => {
    const v = blockingViolations(validateTrustBankAccount("QC", draft({ type: "PARTICULIER" })));
    expect(v.map((x) => x.code)).toContain("PARTICULAR_ACCOUNT_REQUIRES_CLIENT");
  });

  it("signale sans bloquer qu'un compte particulier est propre au Québec", () => {
    const v = validateTrustBankAccount("ON", draft({ type: "PARTICULIER", clientId: "c1" }));
    const found = v.find((x) => x.code === "PARTICULAR_ACCOUNT_QC_ONLY");
    expect(found).toBeDefined();
    expect(found?.blocking).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Avertissements non bloquants
   ════════════════════════════════════════════════════════════════ */

describe("Manquements non bloquants", () => {
  it("signale une succursale hors Québec, sans empêcher la saisie", () => {
    // L'art. 50 exige une succursale québécoise. Bloquer la saisie n'y changerait
    // rien : le compte existe déjà à la banque. On signale pour que le cabinet agisse.
    const v = validateTrustBankAccount("QC", draft({ branchProvince: "ON" }));
    const found = v.find((x) => x.code === "BRANCH_MUST_BE_IN_QUEBEC");
    expect(found?.blocking).toBe(false);
    expect(found?.reference).toContain("art. 50");
  });

  it("demande à confirmer l'entente B-1 r.10 sur un compte général québécois", () => {
    const v = validateTrustBankAccount("QC", draft({ barreauAgreementConfirmed: false }));
    expect(v.map((x) => x.code)).toContain("BARREAU_AGREEMENT_UNCONFIRMED");
  });

  it("N'exige PAS l'entente B-1 r.10 sur un compte particulier", () => {
    // Art. 63 ne reprend pas cette condition : les revenus du compte particulier
    // vont au client, pas au Fonds d'études juridiques.
    const v = validateTrustBankAccount(
      "QC",
      draft({ type: "PARTICULIER", clientId: "c1", barreauAgreementConfirmed: false }),
    );
    expect(v.map((x) => x.code)).not.toContain("BARREAU_AGREEMENT_UNCONFIRMED");
  });

  it("N'exige PAS l'entente B-1 r.10 en Ontario, où elle n'existe pas", () => {
    const v = validateTrustBankAccount("ON", draft({ barreauAgreementConfirmed: false }));
    expect(v.map((x) => x.code)).not.toContain("BARREAU_AGREEMENT_UNCONFIRMED");
  });
});

/* ════════════════════════════════════════════════════════════════
   Démarches post-ouverture — art. 51 et 64
   ════════════════════════════════════════════════════════════════ */

describe("Démarches après l'ouverture", () => {
  it("exige le formulaire au Barreau pour un compte général québécois (art. 51)", () => {
    const d = getPostOpeningDuties("QC", "GENERAL", {});
    expect(d).toHaveLength(1);
    expect(d[0]!.reference).toContain("art. 51");
    expect(d[0]!.done).toBe(false);
  });

  it("ajoute la copie au client pour un compte particulier (art. 64)", () => {
    const d = getPostOpeningDuties("QC", "PARTICULIER", {});
    expect(d.map((x) => x.code)).toEqual(["REGULATOR_FORM_SENT", "CLIENT_COPY_SENT"]);
    expect(d[0]!.reference).toContain("art. 64");
  });

  it("marque la démarche faite quand la date est renseignée", () => {
    const d = getPostOpeningDuties("QC", "GENERAL", { regulatorNotifiedAt: OPENED });
    expect(d[0]!.done).toBe(true);
  });

  it("n'invente AUCUNE démarche en Ontario : By-Law 9 n'en impose pas à l'ouverture", () => {
    expect(getPostOpeningDuties("ON", "GENERAL", {})).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Intérêts et affichage
   ════════════════════════════════════════════════════════════════ */

describe("Bénéficiaire des intérêts", () => {
  it("compte général : Fonds d'études juridiques au Québec, Law Foundation en Ontario", () => {
    expect(defaultInterestBeneficiary("QC", "GENERAL")).toBe("FONDS_ETUDES_JURIDIQUES");
    expect(defaultInterestBeneficiary("ON", "GENERAL")).toBe("LAW_FOUNDATION_ONTARIO");
  });

  it("compte particulier : le client, c'est sa raison d'être (art. 62)", () => {
    expect(defaultInterestBeneficiary("QC", "PARTICULIER")).toBe("CLIENT");
  });
});

describe("accountNumberLast4", () => {
  it("extrait les quatre derniers chiffres", () => {
    expect(accountNumberLast4("123456789")).toBe("6789");
    expect(accountNumberLast4("12345-678-9012")).toBe("9012");
  });

  it("reste défini sur une valeur courte ou non numérique", () => {
    expect(accountNumberLast4("À compléter")).toHaveLength(4);
    expect(accountNumberLast4("12")).toHaveLength(4);
  });
});
