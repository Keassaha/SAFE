import { describe, it, expect } from "vitest";
import {
  normalizeAccountingRow,
  parseLocalAmount,
  parseFlexibleDate,
  computeSourceLine,
  buildAccountingIdempotencyQuery,
} from "@/lib/import/normalizers/accounting-ledger";
import { generateAccountingPreview } from "@/lib/import/pipeline";
import type { ColumnMapping, ParsedFile, RawRow } from "@/lib/import/types";

const MAPPING: ColumnMapping = {
  date: "Date",
  description: "Description",
  reference: "Réf",
  clientName: "Client",
  numeroDossier: "Dossier",
  categorie: "Catégorie",
  compte: "Compte",
  debit: "Débit",
  credit: "Crédit",
  amount: "Montant",
  balance: "Solde",
  sourceModule: "Source",
  typeTransaction: "Type",
};

function rawRow(over: Partial<Record<string, string>>, meta: Partial<RawRow> = {}): RawRow {
  return {
    Date: "",
    Description: "",
    "Réf": "",
    Client: "",
    Dossier: "",
    "Catégorie": "",
    Compte: "",
    "Débit": "",
    "Crédit": "",
    Montant: "",
    Solde: "",
    Source: "",
    Type: "",
    ...over,
    ...meta,
  };
}

describe("parseLocalAmount", () => {
  it("parse les formats locaux français et anglais", () => {
    expect(parseLocalAmount("1 234,56")).toBeCloseTo(1234.56, 2);
    expect(parseLocalAmount("1,234.56")).toBeCloseTo(1234.56, 2);
    expect(parseLocalAmount("1.234,56")).toBeCloseTo(1234.56, 2); // FR avec millier point
    expect(parseLocalAmount("12.50")).toBeCloseTo(12.5, 2);
  });

  it("traite les parenthèses comme négatif", () => {
    expect(parseLocalAmount("(123,45)")).toBeCloseTo(-123.45, 2);
    expect(parseLocalAmount("(1,234.50)")).toBeCloseTo(-1234.5, 2);
  });

  it("ignore symboles monétaires et espaces", () => {
    expect(parseLocalAmount("$ 1 200,00")).toBeCloseTo(1200, 2);
    expect(parseLocalAmount("CAD 75.00")).toBeCloseTo(75, 2);
  });

  it("retourne NaN pour une chaîne non numérique", () => {
    expect(Number.isNaN(parseLocalAmount("abc"))).toBe(true);
    expect(Number.isNaN(parseLocalAmount(""))).toBe(true);
  });
});

describe("parseFlexibleDate", () => {
  it("accepte ISO, FR et US", () => {
    expect(parseFlexibleDate("2026-04-28")).toBe("2026-04-28");
    expect(parseFlexibleDate("28/04/2026")).toBe("2026-04-28");
    expect(parseFlexibleDate("28-04-26")).toBe("2026-04-28");
  });

  it("accepte un Excel serial", () => {
    // 45000 ≈ 2023-03-15
    const v = parseFlexibleDate("45000");
    expect(v).toMatch(/^2023-03-1[45]$/);
  });
});

describe("normalizeAccountingRow — debit/credit", () => {
  it("dérive direction OUT à partir d'un débit seul", () => {
    const row = rawRow({
      Date: "2026-04-01",
      Description: "Achat fournitures",
      Compte: "5100",
      "Débit": "120,00",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.errors).toHaveLength(0);
    expect(r.data.direction).toBe("OUT");
    expect(r.data.amount).toBe(120);
    expect(r.severity).toBe("ok");
  });

  it("dérive direction IN à partir d'un crédit seul", () => {
    const row = rawRow({
      Date: "2026-04-01",
      Description: "Encaissement client",
      Compte: "4100",
      "Crédit": "1 500,00",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.data.direction).toBe("IN");
    expect(r.data.amount).toBe(1500);
  });

  it("bloque une ligne avec débit ET crédit non nuls", () => {
    const row = rawRow({
      Date: "2026-04-01",
      Description: "Erreur saisie",
      "Débit": "100",
      "Crédit": "100",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.errors.some((e) => e.field === "debit/credit")).toBe(true);
    expect(r.severity).toBe("blocked");
  });
});

describe("normalizeAccountingRow — amount unique", () => {
  it("amount négatif => OUT", () => {
    const row = rawRow({
      Date: "2026-04-02",
      Description: "Frais bancaires",
      Montant: "-25.00",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.data.direction).toBe("OUT");
    expect(r.data.amount).toBe(25);
  });

  it("amount positif sans typeTransaction => UNKNOWN (warning)", () => {
    const row = rawRow({
      Date: "2026-04-02",
      Description: "Mouvement non classifié",
      Montant: "150",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.data.direction).toBe("UNKNOWN");
    expect(r.warnings.some((w) => /Direction/.test(w))).toBe(true);
  });

  it("amount positif + typeTransaction PAIEMENT => IN", () => {
    const row = rawRow({
      Date: "2026-04-02",
      Description: "Encaissement",
      Montant: "200",
      Type: "PAIEMENT",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.data.direction).toBe("IN");
  });
});

describe("normalizeAccountingRow — lignes spéciales", () => {
  it("marque la ligne 'Total mensuel' comme summary", () => {
    const row = rawRow({
      Date: "",
      Description: "Total mensuel",
      Montant: "10000",
    }, { __sourceRowKind: "data" });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.isSummaryRow).toBe(true);
  });

  it("ne signale pas date manquante pour une ligne de synthèse", () => {
    const row = rawRow({
      Description: "Solde d'ouverture",
      Montant: "5000",
    });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.isSummaryRow).toBe(true);
    expect(r.data.sourceRowKind).toBe("opening_balance");
    expect(r.errors.some((e) => e.field === "date")).toBe(false);
  });

  it("bloque une ligne sans date ni description", () => {
    const row = rawRow({ Montant: "10" });
    const r = normalizeAccountingRow(row, MAPPING, 0);
    expect(r.severity).toBe("blocked");
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("generateAccountingPreview — breakdown + doublons", () => {
  function buildParsedFile(rows: RawRow[]): ParsedFile {
    return {
      fileName: "ledger.csv",
      headers: ["Date", "Description", "Débit", "Crédit", "Montant"],
      rows,
      headerRowIndex: 0,
    };
  }

  it("compte correctement clean / blocked / summary / duplicates", () => {
    const rows: RawRow[] = [
      // 1 ligne propre
      rawRow({ Date: "2026-04-01", Description: "Loyer", Compte: "5200", "Débit": "1200" }, { __rowFingerprint: "fp1" }),
      // doublon de la précédente
      rawRow({ Date: "2026-04-01", Description: "Loyer", Compte: "5200", "Débit": "1200" }, { __rowFingerprint: "fp1" }),
      // ligne summary
      rawRow({ Description: "Total avril", Montant: "5000" }, { __rowFingerprint: "fp2", __sourceRowKind: "summary" }),
      // ligne bloquée (date impossible et description vide)
      rawRow({ Montant: "999" }, { __rowFingerprint: "fp3" }),
      // ligne propre
      rawRow({ Date: "2026-04-03", Description: "Honoraires", Compte: "4100", "Crédit": "2500" }, { __rowFingerprint: "fp4" }),
    ];
    const preview = generateAccountingPreview(buildParsedFile(rows), MAPPING);
    expect(preview.breakdown.cleanCount).toBe(1);
    expect(preview.breakdown.blockedCount).toBe(1);
    expect(preview.breakdown.summaryCount).toBe(1);
    expect(preview.breakdown.duplicateCount).toBeGreaterThanOrEqual(2);
    // willImport: fp4 (propre, unique) + une seule des deux occurrences de fp1
    expect(preview.breakdown.willImportCount).toBeGreaterThanOrEqual(1);
    expect(preview.breakdown.willImportCount).toBeLessThanOrEqual(2);
  });
});

describe("computeSourceLine — numéro de ligne source", () => {
  it("renvoie sourceRowIndex tel quel quand le parser l'a fourni (déjà 1-based)", () => {
    expect(computeSourceLine({ index: 0, sourceRowIndex: 7 })).toBe(7);
    expect(computeSourceLine({ index: 42, sourceRowIndex: 1 })).toBe(1);
  });

  it("retombe sur index + 1 quand sourceRowIndex est absent (index normalisé 0-based)", () => {
    expect(computeSourceLine({ index: 0 })).toBe(1);
    expect(computeSourceLine({ index: 5 })).toBe(6);
  });

  it("ne décale plus de +1 par rapport au fichier source quand le parser a fait son boulot", () => {
    // Avant la correction: (sourceRowIndex ?? index) + 1 → 7 + 1 = 8 (faux).
    // Après: sourceRowIndex tel quel → 7 (correct).
    const row = { index: 3, sourceRowIndex: 7 };
    expect(computeSourceLine(row)).toBe(7);
  });
});

describe("buildAccountingIdempotencyQuery — clé d'idempotence inter-lots", () => {
  it("renvoie null si aucun fingerprint n'est disponible", () => {
    expect(buildAccountingIdempotencyQuery("cab_1", undefined)).toBeNull();
    expect(buildAccountingIdempotencyQuery("cab_1", null)).toBeNull();
    expect(buildAccountingIdempotencyQuery("cab_1", "")).toBeNull();
  });

  it("cible cabinetId + sourceId, jamais reference", () => {
    const q = buildAccountingIdempotencyQuery("cab_1", "abcd1234");
    expect(q).toEqual({ cabinetId: "cab_1", sourceId: "abcd1234" });
    // Garde-fou: l'objet ne contient pas de clé "reference" (qui était la cause du bug).
    expect(q && "reference" in q).toBe(false);
  });

  it("garde le fingerprint intact, sans préfixe MIG: ni concaténation", () => {
    const fp = "deadbeef";
    expect(buildAccountingIdempotencyQuery("cab_1", fp)?.sourceId).toBe(fp);
  });
});
