import { describe, expect, it } from "vitest";
import {
  getDocketModeForDossier,
  resolveAvailableSectionKey,
  suggestPracticeDocument,
} from "@/lib/dossiers/practice-docket";

describe("practice-docket — modes par pratique", () => {
  it("associe les pratiques principales au bon mode de cahier", () => {
    expect(getDocketModeForDossier("droit_famille")).toBe("procedure");
    expect(getDocketModeForDossier("criminel")).toBe("procedure");
    expect(getDocketModeForDossier("immigration")).toBe("suivi");
    expect(getDocketModeForDossier("immobilier")).toBe("transaction");
  });

  it("reconnait TUF/protection via le sous-type", () => {
    expect(getDocketModeForDossier("litige_civil", "Protection / curatelle")).toBe("procedure");
  });
});

describe("practice-docket — classement documentaire", () => {
  it("classe une ordonnance familiale dans jugements et cree une entree de procedure", () => {
    const res = suggestPracticeDocument({
      dossierType: "droit_famille",
      fileName: "Ordonnance de sauvegarde.pdf",
      documentType: "procedure",
    });

    expect(res.sectionKey).toBe("jugements");
    expect(res.docketMode).toBe("procedure");
    expect(res.shouldCreateDocketEntry).toBe(true);
  });

  it("classe une divulgation criminelle dans la section divulgation", () => {
    const res = suggestPracticeDocument({
      dossierType: "criminel",
      fileName: "Divulgation DPCP volume 1.pdf",
    });

    expect(res.sectionKey).toBe("divulgation");
    expect(res.docketEntryType).toBe("divulgation");
    expect(res.shouldCreateDocketEntry).toBe(true);
  });

  it("classe une lettre IRCC comme suivi immigration", () => {
    const res = suggestPracticeDocument({
      dossierType: "immigration",
      fileName: "Lettre IRCC - demande de documents additionnels.pdf",
    });

    expect(res.sectionKey).toBe("correspondance");
    expect(res.docketMode).toBe("suivi");
    expect(res.shouldCreateDocketEntry).toBe(true);
  });

  it("classe un engagement hypothecaire comme transaction immobiliere", () => {
    const res = suggestPracticeDocument({
      dossierType: "immobilier",
      fileName: "Engagement hypothécaire prêteur.pdf",
    });

    expect(res.sectionKey).toBe("financement-hypotheque");
    expect(res.docketMode).toBe("transaction");
    expect(res.shouldCreateDocketEntry).toBe(true);
  });

  it("marque un document non classable comme revue humaine requise", () => {
    const res = suggestPracticeDocument({
      dossierType: "autre",
      fileName: "scan-001.pdf",
    });

    expect(res.sectionKey).toBe("formulaires");
    expect(res.needsReview).toBe(true);
    expect(res.shouldCreateDocketEntry).toBe(false);
  });
});

describe("practice-docket — sections disponibles", () => {
  it("retombe sur une section existante quand la section cible n'existe pas encore", () => {
    expect(resolveAvailableSectionKey("financement-hypotheque", ["mandat", "formulaires", "fideicommis"])).toBe("formulaires");
    expect(resolveAvailableSectionKey("decisions", ["mandat", "immigration", "correspondance"])).toBe("immigration");
  });
});
