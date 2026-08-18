import { describe, expect, it } from "vitest";
import {
  buildAccountingExportLines,
  exportTotals,
  type ExportableEntry,
} from "../build-export";

function entry(partial: Partial<ExportableEntry>): ExportableEntry {
  return {
    dateTransaction: new Date(2026, 5, 15),
    typeTransaction: "FACTURE",
    sourceModule: "FACTURATION",
    montantEntree: 0,
    montantSortie: 0,
    ...partial,
  };
}

describe("date d'export", () => {
  it("exporte le jour stocké, pas la veille", () => {
    // Forme RÉELLE des données de production : `z.coerce.date()` sur "2026-08-17"
    // donne minuit UTC. L'ancien `toIsoDate` lisait en heure locale et sortait
    // "2026-08-16" dans les fichiers QuickBooks, Xero et Sage. Une écriture datée
    // d'un autre jour, et près d'une fin de mois, d'une autre période de TPS/TVQ.
    //
    // Le fixture par défaut de ce fichier utilise `new Date(2026, 5, 15)`, minuit
    // LOCAL, ce qui masquait le défaut : les deux lectures tombaient d'accord.
    const lines = buildAccountingExportLines([
      entry({ dateTransaction: new Date("2026-08-17"), montantEntree: 100 }),
    ]);
    expect(lines.every((l) => l.date === "2026-08-17")).toBe(true);
  });

  it("ne recule pas non plus au tournant de l'année", () => {
    const lines = buildAccountingExportLines([
      entry({ dateTransaction: new Date("2026-01-01"), montantEntree: 100 }),
    ]);
    expect(lines.every((l) => l.date === "2026-01-01")).toBe(true);
  });
});

describe("buildAccountingExportLines — double-entrée mappée (Lot 5)", () => {
  it("une FACTURE sans détail de taxes produit Dr Comptes à recevoir / Cr Honoraires, balancée", () => {
    const lines = buildAccountingExportLines([
      entry({ typeTransaction: "FACTURE", sourceModule: "FACTURATION", montantEntree: 100 }),
    ]);
    expect(lines).toHaveLength(2);
    const debit = lines.find((l) => l.debit > 0)!;
    const credit = lines.find((l) => l.credit > 0)!;
    expect(debit.accountName).toBe("Comptes à recevoir");
    expect(debit.debit).toBe(100);
    expect(credit.accountName).toBe("Honoraires");
    expect(credit.credit).toBe(100);
  });

  it("une FACTURE avec taxes crédite les taxes séparément des honoraires", () => {
    const lines = buildAccountingExportLines([
      entry({
        typeTransaction: "FACTURE",
        sourceModule: "FACTURATION",
        montantEntree: 1130,
        subtotalBeforeTax: 1000,
        taxTotal: 130,
      }),
    ]);
    expect(lines).toHaveLength(3);
    expect(lines.find((l) => l.accountName === "Comptes à recevoir")?.debit).toBe(1130);
    expect(lines.find((l) => l.accountName === "Honoraires")?.credit).toBe(1000);
    expect(lines.find((l) => l.accountName === "Taxes à remettre")?.credit).toBe(130);
    expect(exportTotals(lines)).toEqual({ totalDebit: 1130, totalCredit: 1130, balanced: true });
  });

  it("un PAIEMENT produit Dr Banque admin / Cr Comptes à recevoir", () => {
    const lines = buildAccountingExportLines([
      entry({ typeTransaction: "PAIEMENT", sourceModule: "PAIEMENTS", montantEntree: 80 }),
    ]);
    expect(lines.find((l) => l.debit > 0)!.accountName).toBe("Banque - Administration");
    expect(lines.find((l) => l.credit > 0)!.accountName).toBe("Comptes à recevoir");
  });

  it("dépôt et retrait fidéicommis utilisent les comptes fidéicommis", () => {
    const depot = buildAccountingExportLines([
      entry({ typeTransaction: "DEPOT_FIDEICOMMIS", sourceModule: "FIDEICOMMIS", montantEntree: 500 }),
    ]);
    expect(depot.find((l) => l.debit > 0)!.accountName).toBe("Banque - Fidéicommis");
    expect(depot.find((l) => l.credit > 0)!.accountName).toBe("Fonds détenus en fidéicommis");

    const retrait = buildAccountingExportLines([
      entry({ typeTransaction: "RETRAIT_FIDEICOMMIS", sourceModule: "FIDEICOMMIS", montantSortie: 200 }),
    ]);
    expect(retrait.find((l) => l.debit > 0)!.accountName).toBe("Fonds détenus en fidéicommis");
    expect(retrait.find((l) => l.credit > 0)!.accountName).toBe("Banque - Fidéicommis");
  });

  it("une correction fidéicommis (entrée) débite la banque fidéicommis", () => {
    const lines = buildAccountingExportLines([
      entry({ typeTransaction: "CORRECTION", sourceModule: "FIDEICOMMIS", montantEntree: 30 }),
    ]);
    expect(lines.find((l) => l.debit > 0)!.accountName).toBe("Banque - Fidéicommis");
    expect(lines.find((l) => l.credit > 0)!.accountName).toBe("Fonds détenus en fidéicommis");
  });

  it("ignore les écritures de montant nul", () => {
    const lines = buildAccountingExportLines([
      entry({ typeTransaction: "FACTURE", montantEntree: 0, montantSortie: 0 }),
    ]);
    expect(lines).toHaveLength(0);
  });

  it("un lot mixte est toujours balancé (Σ débits == Σ crédits)", () => {
    const lines = buildAccountingExportLines([
      entry({ typeTransaction: "FACTURE", sourceModule: "FACTURATION", montantEntree: 114.98 }),
      entry({ typeTransaction: "PAIEMENT", sourceModule: "PAIEMENTS", montantEntree: 50 }),
      entry({ typeTransaction: "DEPENSE", sourceModule: "DEPENSES", montantSortie: 33.33 }),
      entry({ typeTransaction: "DEPOT_FIDEICOMMIS", sourceModule: "FIDEICOMMIS", montantEntree: 1000 }),
    ]);
    const totals = exportTotals(lines);
    expect(totals.balanced).toBe(true);
    expect(totals.totalDebit).toBe(totals.totalCredit);
  });

  it("applique la surcharge de plan comptable du cabinet", () => {
    const lines = buildAccountingExportLines(
      [entry({ typeTransaction: "PAIEMENT", sourceModule: "PAIEMENTS", montantEntree: 10 })],
      { bank_admin: { code: "9999", name: "Compte Banque Perso" } },
    );
    const debit = lines.find((l) => l.debit > 0)!;
    expect(debit.accountCode).toBe("9999");
    expect(debit.accountName).toBe("Compte Banque Perso");
  });
});

describe("dépense : la taxe récupérable sort de la dépense (lot 3)", () => {
  const depense = (over: Partial<Parameters<typeof entry>[0]> = {}) =>
    entry({ typeTransaction: "DEPENSE", sourceModule: "DEPENSES", montantSortie: 114.98, ...over });

  it("sans taxe récupérable, deux lignes et rien dans le compte de taxe", () => {
    // Inscrire zéro dans un compte de taxe à recouvrer polluerait le grand livre.
    const lines = buildAccountingExportLines([depense({ taxReclamable: 0 })]);
    expect(lines).toHaveLength(2);
    expect(lines.some((l) => l.accountCode === "1210")).toBe(false);
    expect(lines.find((l) => l.debit > 0)!.debit).toBe(114.98);
  });

  it("avec taxe récupérable, trois lignes balancées", () => {
    const lines = buildAccountingExportLines([
      depense({ categoryCode: "LOGICIELS", taxReclamable: 14.98 }),
    ]);
    expect(lines).toHaveLength(3);
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    expect(Math.round(debits * 100) / 100).toBe(114.98);
    expect(Math.round(credits * 100) / 100).toBe(114.98);

    const taxe = lines.find((l) => l.accountCode === "1210")!;
    expect(taxe.debit).toBe(14.98);
    // La dépense ne porte plus que le HT : elle partait surévaluée jusqu'ici.
    const dep = lines.find((l) => l.accountCode === "5120")!;
    expect(dep.debit).toBe(100);
  });

  it("un repas ne met en actif que la moitié de sa taxe, le reste est un coût", () => {
    // Le taux vient de la catégorie (lot 2). Le demi-crédit non permis n'est pas
    // perdu : il reste dans la dépense, parce que c'est ce qu'il est.
    const lines = buildAccountingExportLines([
      depense({ categoryCode: "REPAS_REPRESENTATION", taxReclamable: 7.49 }),
    ]);
    const taxe = lines.find((l) => l.accountCode === "1210")!;
    const dep = lines.find((l) => l.accountCode === "5220")!;
    expect(taxe.debit).toBe(7.49);
    expect(dep.debit).toBe(107.49);
    expect(Math.round((taxe.debit + dep.debit) * 100) / 100).toBe(114.98);
  });

  it("chaque catégorie a son compte, le classement n'est plus jeté", () => {
    const lines = buildAccountingExportLines([
      depense({ categoryCode: "LOYER", taxReclamable: 0 }),
      depense({ categoryCode: "ASSURANCES", taxReclamable: 0 }),
      depense({ categoryCode: "TRIBUNAL", taxReclamable: 0 }),
    ]);
    const comptes = lines.filter((l) => l.debit > 0).map((l) => l.accountCode);
    expect(comptes).toEqual(["5100", "5700", "5430"]);
  });

  it("une catégorie inconnue retombe sur le compte général au lieu d'échouer", () => {
    const lines = buildAccountingExportLines([
      depense({ categoryCode: "CATEGORIE_INVENTEE", taxReclamable: 0 }),
    ]);
    expect(lines.find((l) => l.debit > 0)!.accountCode).toBe("5000");
  });

  it("une taxe aberrante ne peut pas dépasser le montant payé", () => {
    const lines = buildAccountingExportLines([depense({ taxReclamable: 999 })]);
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    expect(Math.round(debits * 100) / 100).toBe(114.98);
  });
});
