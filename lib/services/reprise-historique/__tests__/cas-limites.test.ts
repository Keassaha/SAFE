/**
 * Batterie adverse : les cas qu'un cabinet produira sans le vouloir.
 *
 * Chaque cas vise une famille de panne, pas une ligne de code. Ce fichier est
 * le filet posé avant mise en ligne : ce qui casse ici ne casse pas chez un
 * avocat. Les cas sont rangés par ce qui les provoque, pas par le module
 * touché — c'est ainsi qu'on les retrouvera pour en ajouter.
 */
import { describe, it, expect } from "vitest";
import { controlerFacture, versable } from "@/lib/services/reprise-historique/controles";
import { matchFacturePassee } from "@/lib/services/reprise-historique/matcher";
import { construireLotReprise } from "@/lib/services/reprise-historique/construire-lot";
import type { FactureRepriseSaisie, StatutPaiementReprise } from "@/lib/services/reprise-historique/construire-lot";
import type { PastInvoiceExtraction, PastInvoiceLigneExtraction } from "@/lib/ai/extract-past-invoice";

const LE_JOUR = new Date("2026-09-23T00:00:00.000Z");

const ligne = (o: Partial<PastInvoiceLigneExtraction> = {}): PastInvoiceLigneExtraction => ({
  description: "Rédaction",
  date: "2025-04-01",
  montant: 400,
  heures: 2,
  tauxHoraire: 200,
  nature: "honoraire",
  ...o,
});

function f(
  extraction: Partial<PastInvoiceExtraction> = {},
  saisie: Partial<Pick<FactureRepriseSaisie, "statutPaiement" | "datePaiement" | "sansPiece" | "id">> & {
    clientNom?: string;
    dossier?: string;
    clientExistant?: string;
  } = {},
): FactureRepriseSaisie {
  const nom = saisie.clientNom ?? "Constructions Béliveau inc.";
  return {
    id: saisie.id ?? "f1",
    fichierNom: "f.pdf",
    sansPiece: saisie.sansPiece,
    statutPaiement: (saisie.statutPaiement === undefined ? "impayee" : saisie.statutPaiement) as StatutPaiementReprise | null,
    datePaiement: saisie.datePaiement ?? null,
    match: {
      client: saisie.clientExistant
        ? { statut: "existant", clientId: saisie.clientExistant, clientNom: nom }
        : { statut: "nouveau", clientId: null, clientNom: nom },
      dossier: { statut: "nouveau", dossierId: null, dossierIntitule: saisie.dossier ?? "Bail commercial" },
    },
    extraction: {
      numeroFacture: "F-2025-118",
      clientNom: nom,
      dossierIntitule: "Bail commercial",
      dateEmission: "2025-04-10",
      montantTotal: 528,
      tps: null,
      tvq: null,
      confianceOcr: "haute",
      champsIllisibles: [],
      lignes: [ligne(), ligne({ description: "Frais de greffe", montant: 128, heures: null, tauxHoraire: null, nature: "debours" })],
      ...extraction,
    },
  };
}

const bloque = (facture: FactureRepriseSaisie) =>
  !versable(controlerFacture(facture, { aujourdhui: LE_JOUR }));

describe("une fiche sans nom ne doit jamais s'ouvrir", () => {
  it("bloque un nom vide, d'où qu'il vienne", () => {
    expect(bloque(f({}, { clientNom: "" }))).toBe(true);
  });

  it("bloque un nom qui n'est que des espaces", () => {
    expect(bloque(f({}, { clientNom: "   " }))).toBe(true);
  });

  it("bloque la chaîne posée par le rapprochement quand il n'a rien lu", () => {
    expect(bloque(f({}, { clientNom: "Client sans nom lu" }))).toBe(true);
  });

  it("bloque un dossier sans intitulé", () => {
    expect(bloque(f({}, { dossier: "  " }))).toBe(true);
  });

  it("laisse passer un client existant, dont le nom vient de la base", () => {
    expect(bloque(f({}, { clientExistant: "c1", clientNom: "Constructions Béliveau inc." }))).toBe(false);
  });
});

describe("les montants qu'une lecture peut inventer", () => {
  it("bloque un total nul", () => {
    expect(bloque(f({ montantTotal: 0 }))).toBe(true);
  });

  it("bloque un total négatif", () => {
    expect(bloque(f({ montantTotal: -528 }))).toBe(true);
  });

  it("avertit quand le détail ne tombe pas sur le total, sans bloquer", () => {
    const c = controlerFacture(f({ montantTotal: 1728.24 }), { aujourdhui: LE_JOUR });
    expect(versable(c)).toBe(true);
    expect(c.avertissements.some((a) => a.includes("détail"))).toBe(true);
  });

  it("ne crie pas sur un écart d'un sou, qui est un arrondi et non une erreur", () => {
    const c = controlerFacture(f({ montantTotal: 528.01 }), { aujourdhui: LE_JOUR });
    expect(c.avertissements.some((a) => a.includes("détail"))).toBe(false);
  });

  it("tolère un total sans aucune ligne : le papier fait foi", () => {
    expect(bloque(f({ lignes: [] }))).toBe(false);
  });
});

describe("les dates qu'une lecture peut inventer", () => {
  it("bloque une date d'émission à venir", () => {
    expect(bloque(f({ dateEmission: "2027-01-01" }))).toBe(true);
  });

  it("bloque une année d'avant l'informatique de bureau", () => {
    expect(bloque(f({ dateEmission: "1912-04-15" }))).toBe(true);
  });

  it("bloque un paiement reçu avant que la facture existe", () => {
    expect(bloque(f({}, { statutPaiement: "payee", datePaiement: "2025-04-01" }))).toBe(true);
  });

  it("accepte un paiement le jour même de l'émission", () => {
    expect(bloque(f({}, { statutPaiement: "payee", datePaiement: "2025-04-10" }))).toBe(false);
  });

  it("accepte le jour même comme date d'émission : ce n'est pas le futur", () => {
    expect(bloque(f({ dateEmission: "2026-09-23" }))).toBe(false);
  });
});

describe("le statut de paiement, qui ne se devine pas", () => {
  it("bloque tant qu'il n'est pas choisi", () => {
    expect(bloque(f({}, { statutPaiement: null }))).toBe(true);
  });

  it("exige la date sur une facture payée", () => {
    expect(bloque(f({}, { statutPaiement: "payee", datePaiement: null }))).toBe(true);
  });

  it("exige la date sur une facture partielle", () => {
    expect(bloque(f({}, { statutPaiement: "partielle", datePaiement: null }))).toBe(true);
  });
});

describe("le même papier deux fois dans un seul dépôt", () => {
  it("bloque les deux cartes qui portent la même empreinte", () => {
    const a = f({}, { id: "a" });
    const b = f({}, { id: "b" });
    const empreintes = [
      { id: "a", hash: "MÊME" },
      { id: "b", hash: "MÊME" },
    ];
    const cb = controlerFacture(b, { aujourdhui: LE_JOUR, empreintesDuLot: empreintes });
    expect(versable(cb)).toBe(false);
    expect(controlerFacture(a, { aujourdhui: LE_JOUR, empreintesDuLot: empreintes }).bloquants).toHaveLength(0);
  });
});

describe("le rapprochement ne doit pas se tromper de dossier", () => {
  const client = {
    id: "c1",
    nom: "Constructions Béliveau inc.",
    dossiers: [{ id: "d1", intitule: "Divorce" }],
  };

  it("ne range pas « Divorce 2 » sur « Divorce »", () => {
    const m = matchFacturePassee(
      { clientNom: "Constructions Béliveau inc.", dossierIntitule: "Divorce 2" } as PastInvoiceExtraction,
      [client],
    );
    expect(m.dossier.statut).toBe("nouveau");
  });

  it("retrouve le même dossier malgré la casse et les accents", () => {
    const m = matchFacturePassee(
      { clientNom: "CONSTRUCTIONS BELIVEAU INC.", dossierIntitule: "divorce" } as PastInvoiceExtraction,
      [client],
    );
    expect(m.client.statut).toBe("existant");
    expect(m.dossier.statut).toBe("existant");
  });

  it("n'invente pas un client sur un nom vide", () => {
    const m = matchFacturePassee({ clientNom: null, dossierIntitule: null } as PastInvoiceExtraction, [client]);
    expect(m.client.statut).toBe("nouveau");
    expect(m.client.clientId).toBeNull();
  });
});

describe("la chronologie du lot", () => {
  it("range les factures de la plus ancienne à la plus récente, tous mois confondus", () => {
    const lot = construireLotReprise([
      f({ dateEmission: "2026-05-20" }, { id: "tard" }),
      f({ dateEmission: "2025-03-14" }, { id: "tot" }),
    ]);
    const mois = lot.groupes.map((g) => g.cle);
    expect(mois[0] < mois[mois.length - 1]).toBe(true);
  });

  it("met à part les factures dont la date n'a pas été lue", () => {
    const lot = construireLotReprise([f({ dateEmission: null }, { id: "sansdate" })]);
    expect(lot.dateInconnue).toHaveLength(1);
  });

  it("ne compte qu'une fois un client qui revient dans plusieurs mois", () => {
    const lot = construireLotReprise([
      f({ dateEmission: "2025-03-14" }, { id: "a" }),
      f({ dateEmission: "2025-06-09" }, { id: "b" }),
    ]);
    expect(lot.synthese.nombreClients).toBe(1);
  });
});
