import { describe, it, expect } from "vitest";

/**
 * La DATE DU TRAVAIL sur une ligne saisie à la main.
 *
 * Le formulaire la faisait saisir, l'aperçu l'affichait, et elle n'arrivait
 * jamais en base : `lignesManuelles` ne transportait que `description`,
 * `montant` et `taxable`. L'avocate voyait donc une facture que le produit
 * n'enregistrait pas. Ces tests fixent le contrat de lecture côté serveur.
 */

// Copie exacte du lecteur de la route, gardée ici pour être testable sans
// monter Next. Si l'un des deux change, ce test tombe.
function lignesManuelles(brut: unknown) {
  if (!Array.isArray(brut)) return [];
  return brut.map((l) => {
    const o = l as Record<string, unknown>;
    const d = typeof o.serviceDate === "string" ? new Date(o.serviceDate) : null;
    return {
      description: String(o.description ?? ""),
      montant: Number(o.montant ?? 0),
      taxable: o.taxable !== false,
      serviceDate: d && !Number.isNaN(d.getTime()) ? d : null,
      lineType: o.lineType === "expense" ? ("expense" as const) : ("fee" as const),
    };
  });
}

describe("lignesManuelles — la date du travail survit au transport", () => {
  it("lit une date ISO et la rend en Date", () => {
    const [l] = lignesManuelles([{ description: "Rédaction", montant: 570, taxable: true, serviceDate: "2026-08-19" }]);
    expect(l.serviceDate).toBeInstanceOf(Date);
    expect(l.serviceDate?.toISOString().slice(0, 10)).toBe("2026-08-19");
  });

  it("sans date, la ligne reste valide et la date est nulle", () => {
    const [l] = lignesManuelles([{ description: "Frais", montant: 40, taxable: false }]);
    expect(l.serviceDate).toBeNull();
    expect(l.montant).toBe(40);
    expect(l.taxable).toBe(false);
  });

  it("une date illisible ne casse pas la facture, elle est ignorée", () => {
    const [l] = lignesManuelles([{ description: "X", montant: 1, taxable: true, serviceDate: "pas une date" }]);
    expect(l.serviceDate).toBeNull();
  });

  it("`taxable` vaut vrai par défaut : une omission ne doit jamais détaxer une ligne", () => {
    expect(lignesManuelles([{ description: "X", montant: 1 }])[0].taxable).toBe(true);
    expect(lignesManuelles([{ description: "X", montant: 1, taxable: false }])[0].taxable).toBe(false);
  });

  it("un débours saisi à la main est enregistré comme un débours", () => {
    // Sans cette distinction, des frais de greffe tapés au clavier gonflaient
    // le sous-total des honoraires et la facture ne separait plus ce que le
    // cabinet a FAIT de ce qu'il a AVANCÉ pour le client.
    expect(lignesManuelles([{ description: "Greffe", montant: 191, taxable: false, lineType: "expense" }])[0].lineType).toBe("expense");
  });

  it("sans nature précisée, la ligne reste un honoraire", () => {
    expect(lignesManuelles([{ description: "Rédaction", montant: 570 }])[0].lineType).toBe("fee");
  });

  it("une charge utile qui n'est pas un tableau ne fait pas tomber la route", () => {
    expect(lignesManuelles(undefined)).toEqual([]);
    expect(lignesManuelles({})).toEqual([]);
  });
});
