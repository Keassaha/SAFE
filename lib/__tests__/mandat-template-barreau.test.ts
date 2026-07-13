import { describe, it, expect } from "vitest";
import { buildMandatContent, mandatTitreParDefaut, type MandatTemplateInput } from "@/lib/edition/mandat-template";

const baseInput: MandatTemplateInput = {
  cabinetNom: "Cabinet Test",
  cabinetAdresse: "123 rue du Palais, Montréal",
  cabinetTelephone: "514-555-0100",
  cabinetEmail: "info@cabinettest.ca",
  avocatNom: "Me Marie Tremblay",
  clientNom: "Client Démo Inc.",
  clientEmail: "client@demo.ca",
  dossierIntitule: "Achat 123 rue Test",
  dossierNumero: "2026-001",
  modeFacturation: "horaire",
  tauxHoraire: 250,
  provisionInitiale: 2000,
  dateFormatee: "13 juillet 2026",
  devise: "CAD",
};

/** Reconstitue le texte lisible du document ProseMirror pour les assertions. */
function plainText(json: string): string {
  const collect = (node: Record<string, unknown>): string => {
    if (node.type === "text") return String(node.text ?? "");
    const children = (node.content as Record<string, unknown>[] | undefined) ?? [];
    return children.map(collect).join(node.type === "paragraph" || node.type === "heading" ? "" : "\n");
  };
  const doc = JSON.parse(json);
  return (doc.content as Record<string, unknown>[]).map(collect).join("\n");
}

describe("buildMandatContent — modèle Barreau du Québec", () => {
  const txt = plainText(buildMandatContent(baseInput));

  it("porte le titre de la convention officielle", () => {
    expect(txt).toContain("Convention de mandat et d'honoraires");
    expect(mandatTitreParDefaut({ dossierNumero: "2026-001", clientNom: "Client Démo Inc." })).toContain(
      "Convention de mandat et d'honoraires",
    );
  });

  it("contient les 10 sections numérotées du modèle Barreau", () => {
    for (const section of [
      "1. Quels sont les services demandés",
      "2. Combien coûtent les services",
      "3. Comment payer les services",
      "4. Comment communiquer entre nous",
      "5. Comment sont gérés les renseignements personnels",
      "6. Informer l'Avocat des changements",
      "7. Comment résoudre les différends",
      "8. Qu'est-ce qu'un conflit d'intérêts",
      "9. Quand et comment mettre fin",
      "10. À quel moment la convention",
    ]) {
      expect(txt).toContain(section);
    }
  });

  it("intègre les éléments déontologiques distinctifs du Québec", () => {
    expect(txt).toContain("Avance en fidéicommis");
    expect(txt).toContain("conciliation"); // arbitrage de compte
    expect(txt).toContain("45 jours");
    expect(txt).toContain("arbitrage de compte");
    expect(txt).toContain("conflit d'intérêts");
    expect(txt).toContain("7 ans"); // conservation du dossier
  });

  it("pré-remplit les données du dossier et laisse des champs à compléter", () => {
    expect(txt).toContain("Achat 123 rue Test");
    expect(txt).toContain("Client Démo Inc.");
    expect(txt).toContain("250 $"); // taux horaire injecté
    expect(txt).toContain("2000 $"); // provision injectée
    expect(txt).toContain("[____]"); // champs à compléter
  });

  it("adapte la clause d'honoraires au mode forfait", () => {
    const forfait = plainText(buildMandatContent({ ...baseInput, modeFacturation: "forfait", tauxHoraire: null }));
    expect(forfait).toContain("montant forfaitaire");
  });
});
