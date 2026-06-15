import { describe, expect, it } from "vitest";
import {
  deriveAccountingProfile,
  type AccountingProfileInput,
} from "../profil-cabinet";

function input(partial: Partial<AccountingProfileInput>): AccountingProfileInput {
  return {
    province: "QC",
    taille: "solo",
    fideicommisPresent: false,
    fideicommisActif: false,
    methodeFacturation: "horaire",
    inscritTpsTvq: true,
    frequenceTaxes: "trimestrielle",
    comptableExterne: false,
    logicielComptable: "aucun",
    besoinExportMensuel: false,
    besoinRapprochement: false,
    ...partial,
  };
}

describe("deriveAccountingProfile — profils A/B/C/D (Lot 6)", () => {
  it("Profil A : solo sans fidéicommis actif → niveau simplifié, pas de trust", () => {
    const c = deriveAccountingProfile(input({ taille: "solo", fideicommisActif: false }));
    expect(c.profil).toBe("A");
    expect(c.niveau).toBe("simplifie");
    expect(c.features.trustActive).toBe(false);
    expect(c.features.reconciliationRequired).toBe(false);
    expect(c.features.roles).toBe(false);
  });

  it("Profil B : solo avec fidéicommis → trust actif, niveau standard", () => {
    const c = deriveAccountingProfile(
      input({ taille: "solo", fideicommisPresent: true, fideicommisActif: true, besoinRapprochement: true }),
    );
    expect(c.profil).toBe("B");
    expect(c.features.trustModule).toBe(true);
    expect(c.features.trustActive).toBe(true);
    expect(c.features.reconciliationRequired).toBe(true);
    expect(c.features.roles).toBe(false);
  });

  it("Profil C : 2-5 avocats → rôles, multi-utilisateurs", () => {
    const c = deriveAccountingProfile(input({ taille: "2_5" }));
    expect(c.profil).toBe("C");
    expect(c.features.roles).toBe(true);
    expect(c.features.multiUser).toBe(true);
    expect(c.features.advancedCategories).toBe(false);
  });

  it("Profil D : 6+ avocats → niveau avancé, catégories avancées", () => {
    const c = deriveAccountingProfile(input({ taille: "6_plus" }));
    expect(c.profil).toBe("D");
    expect(c.niveau).toBe("avance");
    expect(c.features.advancedCategories).toBe(true);
    expect(c.features.multiUser).toBe(true);
  });

  it("le rapprochement n'est jamais exigé si le fidéicommis n'est pas actif", () => {
    const c = deriveAccountingProfile(input({ taille: "6_plus", fideicommisActif: false, besoinRapprochement: true }));
    expect(c.features.reconciliationRequired).toBe(false);
  });

  it("le format d'export suit le logiciel du comptable", () => {
    expect(deriveAccountingProfile(input({ logicielComptable: "xero" })).features.exportFormat).toBe("xero");
    expect(deriveAccountingProfile(input({ logicielComptable: "autre" })).features.exportFormat).toBe("generic");
    expect(deriveAccountingProfile(input({ logicielComptable: "aucun" })).features.exportFormat).toBe("generic");
  });

  it("le niveau explicite prime sur la dérivation", () => {
    const c = deriveAccountingProfile(input({ taille: "solo", niveau: "avance" }));
    expect(c.profil).toBe("A");
    expect(c.niveau).toBe("avance");
  });

  it("export mensuel forcé si comptable externe", () => {
    const c = deriveAccountingProfile(input({ comptableExterne: true, besoinExportMensuel: false }));
    expect(c.features.monthlyExport).toBe(true);
  });
});
