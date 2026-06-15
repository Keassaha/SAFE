import { describe, expect, it } from "vitest";
import { serializeAccountingExport } from "../serialize";
import type { AccountingExportLine } from "../build-export";

const lines: AccountingExportLine[] = [
  {
    date: "2026-06-15",
    accountCode: "1100",
    accountName: "Comptes à recevoir",
    debit: 100,
    credit: 0,
    memo: "Facture; juin",
    reference: "INV-1",
    name: "Client A",
  },
  {
    date: "2026-06-15",
    accountCode: "4000",
    accountName: "Honoraires",
    debit: 0,
    credit: 100,
    memo: "Facture; juin",
    reference: "INV-1",
    name: "Client A",
  },
];

describe("serializeAccountingExport — formats cibles (Lot 5)", () => {
  it("format générique : en-tête FR, séparateur point-virgule", () => {
    const csv = serializeAccountingExport(lines, "generic");
    const rows = csv.replace(/^﻿/, "").split("\r\n");
    expect(rows[0]).toBe("Date;Code compte;Compte;Débit;Crédit;Description;Référence;Tiers");
    // le memo contient un ';' → doit être entre guillemets
    expect(rows[1]).toContain('"Facture; juin"');
    expect(rows[1]).toContain("100.00");
  });

  it("format QuickBooks : en-tête EN, séparateur virgule", () => {
    const csv = serializeAccountingExport(lines, "quickbooks");
    const head = csv.replace(/^﻿/, "").split("\r\n")[0];
    expect(head).toBe("Date,Account,Debit,Credit,Memo,Name");
  });

  it("format Xero : inclut AccountCode", () => {
    const csv = serializeAccountingExport(lines, "xero");
    const head = csv.replace(/^﻿/, "").split("\r\n")[0];
    expect(head).toBe("Date,Description,AccountCode,Debit,Credit,Reference");
  });

  it("le CSV commence par un BOM UTF-8", () => {
    const csv = serializeAccountingExport(lines, "generic");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
