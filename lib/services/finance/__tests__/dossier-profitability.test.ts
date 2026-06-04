import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: { findMany: vi.fn() },
    deboursDossier: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getDossierProfitability } from "@/lib/services/finance/dossier-profitability";

const corpo = (nom: string) => ({ raisonSociale: nom, prenom: null, nom: null, typeClient: "personne_morale" });

beforeEach(() => {
  prismaMock.invoice.findMany.mockReset();
  prismaMock.deboursDossier.findMany.mockReset();
});

describe("getDossierProfitability — marge brute = facturé HT − débours payés", () => {
  it("agrège revenu et coûts par dossier", async () => {
    prismaMock.invoice.findMany.mockResolvedValue([
      { dossierId: "A", totalInvoiceAmount: 1149.75, taxGst: 50, taxQst: 99.75,
        dossier: { intitule: "Dossier A", numeroDossier: "A-1", client: corpo("ACME") } }, // HT 1000
      { dossierId: "A", totalInvoiceAmount: 229.95, taxGst: 10, taxQst: 19.95,
        dossier: { intitule: "Dossier A", numeroDossier: "A-1", client: corpo("ACME") } }, // HT 200
    ]);
    prismaMock.deboursDossier.findMany.mockResolvedValue([
      { dossierId: "A", montant: 300 },
      { dossierId: "B", montant: 100 }, // dossier sans facture
    ]);

    const r = await getDossierProfitability("cab1");

    const a = r.dossiers.find((d) => d.dossierId === "A")!;
    expect(a.factureHT).toBe(1200);
    expect(a.coutsDirects).toBe(300);
    expect(a.margeBrute).toBe(900);
    expect(a.margePct).toBe(0.75);

    const b = r.dossiers.find((d) => d.dossierId === "B")!;
    expect(b.factureHT).toBe(0);
    expect(b.coutsDirects).toBe(100);
    expect(b.margeBrute).toBe(-100);
    expect(b.margePct).toBeNull();

    expect(r.dossiers.map((d) => d.dossierId)).toEqual(["A", "B"]); // tri marge desc
    expect(r.totals).toEqual({ factureHT: 1200, coutsDirects: 400, margeBrute: 800, nbDossiers: 2 });
  });
});
