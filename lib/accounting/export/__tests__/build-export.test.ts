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

describe("buildAccountingExportLines — double-entrée mappée (Lot 5)", () => {
  it("une FACTURE produit Dr Comptes à recevoir / Cr Honoraires, balancée", () => {
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
