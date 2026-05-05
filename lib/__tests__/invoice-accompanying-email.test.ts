import { describe, it, expect } from "vitest";
import { invoiceAccompanyingEmailHtml } from "../email";

describe("invoiceAccompanyingEmailHtml", () => {
  it("avec pièce jointe : annonce 'en pièce jointe'", () => {
    const { subject, html } = invoiceAccompanyingEmailHtml({
      clientName: "Marie Tremblay",
      invoiceNumber: "2026-001",
      cabinetName: "Derisier Law",
      dueDate: "2026-05-15",
      hasAttachment: true,
    });
    expect(subject).toContain("2026-001");
    expect(subject).toContain("Derisier Law");
    expect(html).toContain("Marie Tremblay");
    expect(html).toContain("en pièce jointe");
    expect(html).toContain("2026-001");
    expect(html).toContain("2026-05-15");
  });

  it("sans pièce jointe ET sans lien : ne ment PAS sur la pièce jointe", () => {
    const { html } = invoiceAccompanyingEmailHtml({
      clientName: "Acme Inc.",
      invoiceNumber: "2026-002",
      cabinetName: "Derisier Law",
      hasAttachment: false,
    });
    expect(html).not.toContain("ci-joint");
    expect(html).not.toContain("en pièce jointe");
    // Indique qu'un suivi est en cours plutôt que de prétendre une PJ.
    expect(html).toContain("a été émise");
  });

  it("sans pièce jointe MAIS avec lien sécurisé : pointe vers le lien, pas vers une PJ", () => {
    const { html } = invoiceAccompanyingEmailHtml({
      clientName: "Acme Inc.",
      invoiceNumber: "2026-003",
      cabinetName: "Derisier Law",
      shareUrl: "https://app.example.com/facture/abc123",
      hasAttachment: false,
    });
    expect(html).not.toContain("ci-joint");
    expect(html).not.toContain("en pièce jointe");
    expect(html).toContain("https://app.example.com/facture/abc123");
    expect(html).toContain("Consulter la facture");
  });

  it("ne contient PAS le détail de la facture en HTML (lignes / taxes / total)", () => {
    // Doctrine phase 1 : la facture officielle est le PDF. Le courriel n'inclut
    // PAS la table de lignes, ni les taxes, ni le total ventilé.
    const { html } = invoiceAccompanyingEmailHtml({
      clientName: "X",
      invoiceNumber: "2026-004",
      cabinetName: "Cabinet",
      hasAttachment: true,
    });
    expect(html).not.toMatch(/sous-total/i);
    expect(html).not.toMatch(/TPS|TVQ|HST/i);
    expect(html).not.toMatch(/Honoraires.*\$/);
  });
});
