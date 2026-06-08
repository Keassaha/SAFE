import { describe, it, expect } from "vitest";
import { documentEmailTemplate } from "@/lib/services/client-send/email-templates";

const vars = { clientNom: "Okafor", cabinetNom: "Derisier Law", documentTitre: "Lettre de mise en demeure" };

describe("documentEmailTemplate", () => {
  it("FR : sujet = titre + cabinet, corps en « vous » avec salutation et signature", () => {
    const { subject, body } = documentEmailTemplate("lettre", "fr", vars);
    expect(subject).toBe("Lettre de mise en demeure — Derisier Law");
    expect(body).toContain("Bonjour Okafor,");
    expect(body).toContain("ci-joint");
    expect(body).toContain("Cordialement,");
    expect(body).toContain("Derisier Law");
  });

  it("EN : salutation + signature anglaises", () => {
    const { subject, body } = documentEmailTemplate("contrat", "en", vars);
    expect(subject).toContain("Derisier Law");
    expect(body).toContain("Dear Okafor,");
    expect(body).toContain("attached");
    expect(body).toContain("Kind regards,");
  });

  it("intro varie selon le type", () => {
    const lettre = documentEmailTemplate("lettre", "fr", vars).body;
    const contrat = documentEmailTemplate("contrat", "fr", vars).body;
    const requete = documentEmailTemplate("requete", "fr", vars).body;
    expect(lettre).toContain("correspondance");
    expect(contrat).toContain("contractuel");
    expect(requete).toContain("requête");
  });

  it("type inconnu retombe sur « autre » (cite le titre du document)", () => {
    const { body } = documentEmailTemplate("inexistant", "fr", vars);
    expect(body).toContain("Lettre de mise en demeure");
  });

  it("pas d'emoji décoratif", () => {
    const { subject, body } = documentEmailTemplate("note", "fr", vars);
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(subject + body)).toBe(false);
  });
});
