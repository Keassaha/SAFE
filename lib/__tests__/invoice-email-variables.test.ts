import { describe, it, expect } from "vitest";
import {
  applyInvoiceEmailVariables,
  mergeCabinetConfig,
  getEmailFactureConfig,
  parseCabinetConfig,
} from "@/lib/cabinet-config";

describe("applyInvoiceEmailVariables", () => {
  const vars = {
    client: "Marie Tremblay",
    numeroFacture: "2026-014",
    cabinet: "Derisier Avocats",
    echeance: "2026-08-01",
  };

  it("substitue toutes les variables connues", () => {
    const out = applyInvoiceEmailVariables(
      "Bonjour {{client}}, facture {{numero_facture}} de {{cabinet}}, échéance {{echeance}}.",
      vars,
    );
    expect(out).toBe(
      "Bonjour Marie Tremblay, facture 2026-014 de Derisier Avocats, échéance 2026-08-01.",
    );
  });

  it("accepte l'alias {{numero}} et les espaces internes", () => {
    expect(applyInvoiceEmailVariables("Facture {{ numero }}", vars)).toBe("Facture 2026-014");
  });

  it("laisse une variable inconnue intacte", () => {
    expect(applyInvoiceEmailVariables("Bonjour {{prenom}}", vars)).toBe("Bonjour {{prenom}}");
  });

  it("remplace une variable manquante par une chaîne vide", () => {
    expect(applyInvoiceEmailVariables("Échéance {{echeance}}", { client: "X" })).toBe("Échéance ");
  });
});

describe("mergeCabinetConfig — emailFacture", () => {
  it("fusionne le gabarit d'email sans écraser les autres réglages", () => {
    const base = mergeCabinetConfig(null, {
      envoiFactureClient: { activer: true, lienExpirationJours: 30 },
    });
    const merged = mergeCabinetConfig(base, {
      emailFacture: { objet: "Facture {{numero_facture}}" },
    });
    const config = parseCabinetConfig(merged);
    expect(getEmailFactureConfig(config).objet).toBe("Facture {{numero_facture}}");
    expect(config.envoiFactureClient?.lienExpirationJours).toBe(30);
  });

  it("conserve les champs non fournis lors d'une mise à jour partielle", () => {
    const first = mergeCabinetConfig(null, {
      emailFacture: { objet: "Objet", message: "Corps" },
    });
    const second = mergeCabinetConfig(first, {
      emailFacture: { message: "Nouveau corps" },
    });
    const email = getEmailFactureConfig(parseCabinetConfig(second));
    expect(email.objet).toBe("Objet");
    expect(email.message).toBe("Nouveau corps");
  });
});
