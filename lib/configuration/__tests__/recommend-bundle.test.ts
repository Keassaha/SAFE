import { describe, expect, it } from "vitest";
import {
  generateConfigurationPackage,
  getBundleById,
  recommendBundle,
  runConfigurationEngine,
  buildAuditSnapshot,
} from "@/lib/configuration";

/**
 * Cas de référence pour le moteur de recommandation.
 * On construit des `answers` dans la même forme que celle produite par
 * le formulaire d'audit gratuit v2 (lib/audit-gratuit/questions.ts).
 *
 * On vise des assertions stables et lisibles, pas une couverture exhaustive.
 */

function baseAnswers(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    raison_sociale: "Cabinet Test",
    localisation: { ville: "Montréal", province: "QC" },
    forme_juridique: "inc",
    identite: { nom_complet: "Test User", titre: "Avocat" },
    annees_pratique: "6_15",
    nb_utilisateurs: "1",
    contact: { email: "test@example.com", telephone: "(514) 555-0199" },
    gestion_facturation: "moi",
    gestion_fideicommis: "moi",
    adjoint_statut: "non",
    comptable_statut: "externe",
    autres_roles: ["aucun"],
    utilisateur_principal: "moi",
    domaines_pratique: "Droit civil et général",
    dossiers_actifs: "10_30",
    nouveaux_mois: "5_15",
    mode_facturation: "horaire",
    type_clientele: "particuliers",
    langues: ["fr"],
    aide_juridique: "non",
    fideicommis_usage: "non",
    evolution: "stable",
    logiciel_actuel: "aucun",
    satisfaction: 5,
    frustrations: ["admin"],
    heures_admin: "2_5",
    visibilite_creances: "logiciel",
    delai_paiement: "15_30",
    urgence: "moyen",
    automatisation_reve: "facturation",
    ...overrides,
  };
}

describe("recommend-bundle: cas Derisier (ON solo immobilier+immigration forfait)", () => {
  it("recommande on-solo-real-estate-immigration-flat-fee avec confiance high", () => {
    const answers = baseAnswers({
      localisation: { ville: "Toronto", province: "ON" },
      nb_utilisateurs: "2",
      domaines_pratique: "Real estate residential and immigration (Express Entry, sponsorship)",
      mode_facturation: "forfait",
      langues: ["en"],
      fideicommis_usage: "actif",
      gestion_fideicommis: "adjoint",
      type_clientele: "particuliers",
      adjoint_statut: "tp",
    });

    const out = runConfigurationEngine(answers);
    expect(out.bundleRecommendation.bundleId).toBe("on-solo-real-estate-immigration-flat-fee");
    expect(out.bundleRecommendation.confidence).toBe("high");
    expect(out.bundleRecommendation.why.join(" ")).toMatch(/Province ON/);
    expect(out.configurationPackage.cabinetInterfaceConfig.locale).toBe("en");
    expect(out.configurationPackage.cabinetInterfaceConfig.disciplines).toEqual(
      expect.arrayContaining(["immobilier", "immigration"]),
    );
    // Les seeds standards immobilier/immigration doivent être planifiés.
    const seedIds = out.configurationPackage.seedPlan.map((s) => s.seedId);
    expect(seedIds).toEqual(expect.arrayContaining(["seed-immobilier-on", "seed-immigration"]));
    const seedWithScript = out.configurationPackage.seedPlan.find((s) => s.seedId === "seed-immobilier-on");
    expect(seedWithScript?.args).toEqual(["lib/seeds/checklists-immobilier-on.ts"]);
  });
});

describe("recommend-bundle: cas QC famille forfait", () => {
  it("recommande qc-solo-family-flat-fee", () => {
    const answers = baseAnswers({
      localisation: { ville: "Québec", province: "QC" },
      nb_utilisateurs: "1",
      domaines_pratique: "Droit de la famille (divorce, garde, pension alimentaire)",
      mode_facturation: "forfait",
      fideicommis_usage: "peu",
    });

    const out = runConfigurationEngine(answers);
    expect(out.bundleRecommendation.bundleId).toBe("qc-solo-family-flat-fee");
    expect(out.configurationPackage.cabinetInterfaceConfig.locale).toBe("fr");
    expect(out.configurationPackage.cabinetInterfaceConfig.disciplines).toContain("famille");
  });
});

describe("recommend-bundle: cas QC affaires horaire", () => {
  it("recommande qc-small-business-hourly", () => {
    const answers = baseAnswers({
      localisation: { ville: "Montréal", province: "QC" },
      nb_utilisateurs: "2",
      domaines_pratique: "Droit des affaires et droit corporatif pour PME québécoises",
      mode_facturation: "horaire",
      taux_horaire: "251_400",
    });

    const out = runConfigurationEngine(answers);
    expect(out.bundleRecommendation.bundleId).toBe("qc-small-business-hourly");
    expect(out.configurationPackage.cabinetInterfaceConfig.disciplines).toContain("affaires");
    // En horaire on ne masque pas l'onglet temps.
    expect(out.configurationPackage.cabinetInterfaceConfig.ongletsActifs).toContain("temps");
  });
});

describe("recommend-bundle: cas hybride QC multi-pratique", () => {
  it("recommande qc-hybrid-multi-practice-small-firm", () => {
    const answers = baseAnswers({
      localisation: { ville: "Montréal", province: "QC" },
      nb_utilisateurs: "3plus",
      domaines_pratique: "Droit du travail, droit des affaires et droit de la famille",
      mode_facturation: "mixte",
    });

    const out = runConfigurationEngine(answers);
    expect(out.bundleRecommendation.bundleId).toBe("qc-hybrid-multi-practice-small-firm");
    expect(out.auditSnapshot.profiles.practiceProfile).toMatchObject({
      practiceMixType: "hybrid_multi_practice",
    });
  });
});

describe("recommend-bundle: cas hors standard -> custom trigger", () => {
  it("détecte un trigger custom quand la facturation est à la commission", () => {
    const answers = baseAnswers({
      localisation: { ville: "Montréal", province: "QC" },
      domaines_pratique: "Droit immobilier et successions (commissions)",
      mode_facturation: "commission",
      aide_juridique: "reg",
    });

    const out = runConfigurationEngine(answers);
    const triggers = out.bundleRecommendation.customTriggers.join(" | ");
    expect(triggers).toMatch(/commission/i);
    expect(triggers).toMatch(/Aide juridique/i);
    // Le backlog custom doit refléter ces triggers.
    expect(out.configurationPackage.customBacklog.length).toBeGreaterThan(0);
  });
});

describe("generate-config-package: application des overrides validés", () => {
  it("applique les overrides sémantiques dans la bonne partie de la config", () => {
    const answers = baseAnswers({
      localisation: { ville: "Toronto", province: "ON" },
      domaines_pratique: "Real estate and immigration",
      mode_facturation: "forfait",
      langues: ["en", "fr"],
      delai_paiement: "31_60",
      fideicommis_usage: "actif",
    });

    const snapshot = buildAuditSnapshot(answers);
    const recommendation = recommendBundle(snapshot);
    const bundle = getBundleById(recommendation.bundleId);

    expect(bundle).toBeDefined();

    const configPackage = generateConfigurationPackage({
      snapshot,
      bundle: bundle!,
      recommendation,
      decision: {
        bundleId: recommendation.bundleId,
        validatedOverrides: [
          { key: "reminder_days", value: 45 },
          { key: "accepted_payment_methods", value: ["wire", "interac"] },
          { key: "locale_secondary_fr", value: true },
          { key: "real_estate_subtypes", value: ["achat", "condo"] },
          { key: "modules.facturation.notes", value: "Needs bilingual billing reminders" },
        ],
        rejectedOverrides: [],
        customItems: [],
        activationPriorities: [],
        blockingIntegrations: [],
      },
    });

    expect(configPackage.cabinetInterfaceConfig.modules).toMatchObject({
      facturation: {
        joursRelance: 45,
        methodesAcceptees: ["wire", "interac"],
        notes: "Needs bilingual billing reminders",
      },
      localization: {
        secondaryLocale: "fr",
      },
      realEstate: {
        subtypes: ["achat", "condo"],
      },
    });
  });
});
