import { describe, it, expect } from "vitest";
import { controlerFacture, versable } from "@/lib/services/reprise-historique/controles";
import type { FactureRepriseSaisie, StatutPaiementReprise } from "@/lib/services/reprise-historique/construire-lot";
import type { PastInvoiceExtraction, PastInvoiceLigneExtraction } from "@/lib/ai/extract-past-invoice";

const ligne = (o: Partial<PastInvoiceLigneExtraction> = {}): PastInvoiceLigneExtraction => ({
  description: "Rédaction",
  date: "2026-04-01",
  montant: 400,
  heures: 2,
  tauxHoraire: 200,
  nature: "honoraire",
  ...o,
});

function facture(
  extraction: Partial<PastInvoiceExtraction> = {},
  saisie: { statutPaiement?: StatutPaiementReprise | null; datePaiement?: string | null; clientNom?: string } = {},
): FactureRepriseSaisie {
  const nom = saisie.clientNom ?? "Société Kaboré et fils";
  return {
    id: "f1",
    fichierNom: "f1.pdf",
    statutPaiement: saisie.statutPaiement === undefined ? "impayee" : saisie.statutPaiement,
    datePaiement: saisie.datePaiement ?? null,
    match: {
      client: { statut: "nouveau", clientId: null, clientNom: nom },
      dossier: { statut: "nouveau", dossierId: null, dossierIntitule: "Bail commercial" },
    },
    extraction: {
      numeroFacture: "F-2026-011",
      clientNom: nom,
      dossierIntitule: "Bail commercial",
      dateEmission: "2026-04-10",
      montantTotal: 528,
      tps: null,
      tvq: null,
      confianceOcr: "haute",
      champsIllisibles: [],
      lignes: [ligne()],
      ...extraction,
    },
  };
}

describe("quand la facture se lit mal", () => {
  it("refuse de verser sans montant total", () => {
    const c = controlerFacture(facture({ montantTotal: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants[0]).toContain("montant total");
  });

  it("refuse de verser sans date d'émission", () => {
    const c = controlerFacture(facture({ dateEmission: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("date d'émission");
  });

  it("refuse de créer une fiche client sans nom", () => {
    const c = controlerFacture(facture({}, { clientNom: "Client sans nom lu" }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("fiche sans nom");
  });

  it("laisse verser une ligne illisible, mais le dit", () => {
    const c = controlerFacture(facture({ lignes: [ligne(), ligne({ montant: null })] }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("ne sera pas reprise au détail");
  });

  it("compte les lignes perdues quand il y en a plusieurs", () => {
    const c = controlerFacture(
      facture({ lignes: [ligne({ montant: null }), ligne({ montant: null }), ligne()] }),
    );
    expect(c.avertissements.join(" ")).toContain("2 lignes");
  });

  it("signale une facture sans aucune ligne lue", () => {
    const c = controlerFacture(facture({ lignes: [] }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("seul le total sera repris");
  });

  it("répète les champs que la lecture a signalés illisibles", () => {
    const c = controlerFacture(facture({ champsIllisibles: ["taux horaire", "taxes"] }));
    expect(c.avertissements.join(" ")).toContain("taux horaire, taxes");
  });

  it("prévient quand la pièce se lit mal dans l'ensemble", () => {
    const c = controlerFacture(facture({ confianceOcr: "basse" }));
    expect(c.avertissements.join(" ")).toContain("se lit mal");
  });

  it("prévient qu'un numéro sera attribué si la facture n'en porte pas", () => {
    const c = controlerFacture(facture({ numeroFacture: null }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("numéro");
  });
});

describe("le statut de paiement se demande, et se tient", () => {
  it("refuse tant que le statut n'est pas choisi", () => {
    const c = controlerFacture(facture({}, { statutPaiement: null }));
    expect(c.bloquants.join(" ")).toContain("payée");
  });

  it("refuse une facture payée sans date de paiement", () => {
    const c = controlerFacture(facture({}, { statutPaiement: "payee", datePaiement: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("date du paiement");
  });

  it("refuse une partielle sans montant reçu", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: null },
    );
    expect(c.bloquants.join(" ")).toContain("montant réellement reçu");
  });

  it("refuse une partielle qui couvre tout le total : ce n'est plus partiel", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: 528 },
    );
    expect(c.bloquants.join(" ")).toContain("payée, pas partielle");
  });

  it("accepte une partielle en règle", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: 300 },
    );
    expect(versable(c)).toBe(true);
  });

  it("une impayée n'a besoin d'aucune date", () => {
    expect(versable(controlerFacture(facture({}, { statutPaiement: "impayee" })))).toBe(true);
  });
});

describe("le même fichier déposé deux fois dans un lot pas encore versé", () => {
  const empreintes = [
    { id: "f0", hash: "abc" },
    { id: "f1", hash: "abc" },
    { id: "f2", hash: "zzz" },
  ];

  it("bloque le second dépôt, pas le premier", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f0" }, { empreintesDuLot: empreintes }))).toBe(true);
    const second = controlerFacture({ ...facture(), id: "f1" }, { empreintesDuLot: empreintes });
    expect(versable(second)).toBe(false);
    expect(second.bloquants.join(" ")).toContain("déjà dans le dépôt");
  });

  it("laisse passer un fichier différent", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f2" }, { empreintesDuLot: empreintes }))).toBe(true);
  });
});

describe("une facture bien lue ne dit rien", () => {
  it("ne bloque ni n'avertit", () => {
    const c = controlerFacture(facture());
    expect(c.bloquants).toEqual([]);
    expect(c.avertissements).toEqual([]);
  });
});
