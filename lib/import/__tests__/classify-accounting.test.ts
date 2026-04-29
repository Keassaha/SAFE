import { describe, it, expect } from "vitest";
import { classifyDocument, classifyByFileName } from "@/lib/import/classify";

describe("classifyByFileName", () => {
  it("identifie une migration comptable par le nom de fichier", () => {
    expect(classifyByFileName("grand-livre-2025.xlsx")).toBe("migration_comptable");
    expect(classifyByFileName("export-gl-cabinet.csv")).toBe("migration_comptable");
    expect(classifyByFileName("migration_comptable_decembre.xlsx")).toBe("migration_comptable");
  });

  it("identifie un relevé bancaire par le nom de fichier", () => {
    expect(classifyByFileName("releve-scotia-2024-09.pdf")).toBe("releve_bancaire");
    expect(classifyByFileName("statement-rbc.csv")).toBe("releve_bancaire");
  });
});

describe("classifyDocument — distinction migration vs relevé bancaire", () => {
  it("préfère migration_comptable quand débit + crédit + journal/compte sont présents", () => {
    const headers = ["Date", "No Compte", "Débit", "Crédit", "Description", "Type Transaction", "Catégorie"];
    const result = classifyDocument("export-grand-livre.xlsx", headers);
    expect(result.type).toBe("migration_comptable");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("garde releve_bancaire pour un fichier bancaire pur (Scotia, débit, crédit, solde)", () => {
    const headers = ["Date", "Description", "Débit", "Crédit", "Solde"];
    const titleRow = "Relevé Scotia — Septembre 2024";
    const result = classifyDocument("releve-scotia.csv", headers, titleRow);
    expect(result.type).toBe("releve_bancaire");
  });

  it("priorise migration_comptable même sans hint dans le nom de fichier si l'entête est riche", () => {
    const headers = [
      "Date écriture", "No pièce", "Compte GL", "Débit", "Crédit",
      "Source Module", "Type Transaction", "Catégorie",
    ];
    const result = classifyDocument("export-2026.xlsx", headers);
    expect(result.type).toBe("migration_comptable");
  });
});
