import { describe, it, expect } from "vitest";
import { construireLotReprise, type FactureRepriseSaisie } from "@/lib/services/reprise-historique/construire-lot";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";

function facture(
  overrides: Partial<PastInvoiceExtraction> & { id: string; clientExistant?: boolean; clientId?: string },
): FactureRepriseSaisie {
  const extraction: PastInvoiceExtraction = {
    numeroFacture: overrides.numeroFacture ?? null,
    clientNom: overrides.clientNom ?? "Client Test",
    dossierIntitule: overrides.dossierIntitule ?? null,
    dateEmission: overrides.dateEmission ?? null,
    montantTotal: overrides.montantTotal ?? 0,
    tps: overrides.tps ?? null,
    tvq: overrides.tvq ?? null,
    lignes: overrides.lignes ?? [],
    confianceOcr: overrides.confianceOcr ?? "haute",
    champsIllisibles: overrides.champsIllisibles ?? [],
  };
  return {
    id: overrides.id,
    fichierNom: `${overrides.id}.pdf`,
    extraction,
    match: {
      client: overrides.clientExistant
        ? { statut: "existant", clientId: overrides.clientId ?? "c1", clientNom: extraction.clientNom ?? "" }
        : { statut: "nouveau", clientId: null, clientNom: extraction.clientNom ?? "" },
      dossier: { statut: "nouveau", dossierId: null, dossierIntitule: extraction.dossierIntitule ?? "Dossier" },
    },
    statutPaiement: null,
    datePaiement: null,
  };
}

describe("construireLotReprise — rangement chronologique", () => {
  it("range les factures par date d'émission, pas par ordre de dépôt", () => {
    const deposeesEnVrac = [
      facture({ id: "f-juin", dateEmission: "2026-06-02" }),
      facture({ id: "f-mars-1", dateEmission: "2026-03-08" }),
      facture({ id: "f-mars-2", dateEmission: "2026-03-21" }),
    ];

    const lot = construireLotReprise(deposeesEnVrac);

    const idsDansLordre = lot.groupes.flatMap((g) => g.factures.map((f) => f.id));
    expect(idsDansLordre).toEqual(["f-mars-1", "f-mars-2", "f-juin"]);
  });

  it("détecte un mois entier sans dépôt entre le premier et le dernier", () => {
    const lot = construireLotReprise([
      facture({ id: "a", dateEmission: "2026-03-08" }),
      facture({ id: "b", dateEmission: "2026-05-14" }),
    ]);

    const cles = lot.groupes.map((g) => g.cle);
    expect(cles).toEqual(["2026-03", "2026-04", "2026-05"]);
    const avril = lot.groupes.find((g) => g.cle === "2026-04");
    expect(avril?.factures).toEqual([]);
  });

  it("une facture sans date lisible sort de la chronologie plutôt que d'être devinée", () => {
    const lot = construireLotReprise([
      facture({ id: "datee", dateEmission: "2026-03-08" }),
      facture({ id: "sans-date", dateEmission: null }),
    ]);

    expect(lot.dateInconnue.map((f) => f.id)).toEqual(["sans-date"]);
    expect(lot.groupes.flatMap((g) => g.factures.map((f) => f.id))).toEqual(["datee"]);
  });

  it("liste vide ne produit aucun groupe", () => {
    const lot = construireLotReprise([]);
    expect(lot.groupes).toEqual([]);
    expect(lot.synthese.nombreClients).toBe(0);
  });
});

describe("construireLotReprise — synthèse", () => {
  it("compte les clients uniques et ceux à créer séparément", () => {
    const lot = construireLotReprise([
      facture({ id: "a", dateEmission: "2026-03-01", clientNom: "Nadine Ouellet", clientExistant: true, clientId: "c1" }),
      facture({ id: "b", dateEmission: "2026-03-02", clientNom: "Nadine Ouellet", clientExistant: true, clientId: "c1" }),
      facture({ id: "c", dateEmission: "2026-03-03", clientNom: "Société Kaboré et fils" }),
    ]);

    expect(lot.synthese.nombreClients).toBe(2);
    expect(lot.synthese.nombreClientsACreer).toBe(1);
  });

  it("additionne les heures lisibles des lignes et le total facturé", () => {
    const lot = construireLotReprise([
      facture({
        id: "a",
        dateEmission: "2026-03-01",
        montantTotal: 805,
        lignes: [
          { description: "Étude", date: "2026-02-24", montant: 805, heures: 1.75, tauxHoraire: 460, nature: "honoraire" },
        ],
      }),
      facture({
        id: "b",
        dateEmission: "2026-03-02",
        montantTotal: 1125,
        lignes: [
          { description: "Forfait", date: null, montant: 1125, heures: null, tauxHoraire: null, nature: "honoraire" },
        ],
      }),
    ]);

    expect(lot.synthese.heuresReprises).toBe(1.75);
    expect(lot.synthese.totalFacture).toBe(1930);
  });

  it("un débours compte dans le total facturé mais jamais dans les heures reprises", () => {
    const lot = construireLotReprise([
      facture({
        id: "a",
        dateEmission: "2026-03-01",
        montantTotal: 933,
        lignes: [
          { description: "Rédaction", date: "2026-02-24", montant: 805, heures: 1.75, tauxHoraire: 460, nature: "honoraire" },
          { description: "Frais de greffe", date: "2026-02-26", montant: 128, heures: null, tauxHoraire: null, nature: "debours" },
        ],
      }),
    ]);

    expect(lot.synthese.heuresReprises).toBe(1.75);
    expect(lot.synthese.totalFacture).toBe(933);
  });

  it("le reste dû ne compte que les factures marquées impayées", () => {
    const impayee = facture({ id: "a", dateEmission: "2026-03-01", montantTotal: 500 });
    impayee.statutPaiement = "impayee";
    const payee = facture({ id: "b", dateEmission: "2026-03-02", montantTotal: 300 });
    payee.statutPaiement = "payee";

    const lot = construireLotReprise([impayee, payee]);
    expect(lot.synthese.resteDu).toBe(500);
  });
});
