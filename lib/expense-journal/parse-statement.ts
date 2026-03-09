/**
 * Parsing de relevé bancaire (CSV).
 * Détection des colonnes et extraction des transactions.
 */

export type RawBankRow = Record<string, string>;

export type DetectedColumnMap = {
  date: string | null;
  description: string | null;
  amount: string | null;
  debit: string | null;
  credit: string | null;
  balance: string | null;
  reference: string | null;
};

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  rawType: "debit" | "credit";
  balance?: number;
  reference?: string;
  raw: RawBankRow;
};

const BANK_COLUMN_ALIASES: Record<keyof DetectedColumnMap, string[]> = {
  date: ["date", "transaction date", "date opération", "date operation", "trans date", "posting date"],
  description: ["description", "memo", "details", "libellé", "libelle", "narrative", "transaction", "payee", "name"],
  amount: ["amount", "montant", "transaction amount", "debit/credit", "somme"],
  debit: ["debit", "débit", "depense", "withdrawal"],
  credit: ["credit", "crédit", "deposit", "revenu"],
  balance: ["balance", "solde", "running balance"],
  reference: ["reference", "ref", "référence", "numero", "number", "id", "no"],
};

function normalizeHeader(h: string): string {
  return h.replace(/\s+/g, " ").trim().toLowerCase();
}

function findColumnFor(headers: string[], keys: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const key of keys) {
    const k = key.toLowerCase();
    const i = normalized.findIndex((h) => h === k || h.includes(k));
    if (i >= 0) return headers[i] ?? null;
  }
  return null;
}

/**
 * Détecte le mapping des colonnes à partir de la première ligne (headers).
 */
export function detectColumnMap(headers: string[]): DetectedColumnMap {
  return {
    date: findColumnFor(headers, BANK_COLUMN_ALIASES.date),
    description: findColumnFor(headers, BANK_COLUMN_ALIASES.description),
    amount: findColumnFor(headers, BANK_COLUMN_ALIASES.amount),
    debit: findColumnFor(headers, BANK_COLUMN_ALIASES.debit),
    credit: findColumnFor(headers, BANK_COLUMN_ALIASES.credit),
    balance: findColumnFor(headers, BANK_COLUMN_ALIASES.balance),
    reference: findColumnFor(headers, BANK_COLUMN_ALIASES.reference),
  };
}

function parseAmount(val: string): number {
  if (val == null || val === "") return 0;
  const cleaned = String(val).replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseDate(val: string): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toISOString().slice(0, 10);
}

/**
 * Parse une ligne CSV en transaction à partir du mapping de colonnes.
 */
export function parseRow(
  row: RawBankRow,
  map: DetectedColumnMap
): ParsedTransaction | null {
  const descKey = map.description ?? map.amount ?? Object.keys(row)[0];
  const description = (descKey && row[descKey]) ? String(row[descKey]).trim() : "";
  if (!description) return null;

  let amount = 0;
  let rawType: "debit" | "credit" = "debit";

  if (map.amount) {
    amount = Math.abs(parseAmount(row[map.amount] ?? ""));
    if (map.debit && map.credit) {
      const d = parseAmount(row[map.debit] ?? "0");
      const c = parseAmount(row[map.credit] ?? "0");
      if (c > 0) {
        amount = c;
        rawType = "credit";
      } else {
        amount = d;
        rawType = "debit";
      }
    } else {
      const raw = (row[map.amount] ?? "").trim();
      if (raw.startsWith("-") || raw.startsWith("(")) rawType = "debit";
      else rawType = "credit";
    }
  } else if (map.debit && map.credit) {
    const d = parseAmount(row[map.debit] ?? "0");
    const c = parseAmount(row[map.credit] ?? "0");
    if (c > 0) {
      amount = c;
      rawType = "credit";
    } else {
      amount = d;
      rawType = "debit";
    }
  }

  const dateKey = map.date ?? Object.keys(row).find((k) => /date/i.test(k));
  const date = dateKey ? parseDate(row[dateKey] ?? "") : "";

  return {
    date: date || new Date().toISOString().slice(0, 10),
    description,
    amount,
    rawType,
    balance: map.balance && row[map.balance] ? parseAmount(row[map.balance]) : undefined,
    reference: map.reference && row[map.reference] ? String(row[map.reference]).trim() : undefined,
    raw: row,
  };
}

/**
 * Parse un fichier CSV texte en lignes + détection des colonnes.
 */
export function parseCsvText(csvText: string): { headers: string[]; rows: RawBankRow[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headerLine = lines[0];
  const sep = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(sep).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows: RawBankRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep).map((p) => p.replace(/^"|"$/g, "").trim());
    const row: RawBankRow = {};
    headers.forEach((h, j) => {
      row[h] = parts[j] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Pipeline: texte CSV → transactions parsées.
 */
export function parseBankStatementCsv(csvText: string): {
  map: DetectedColumnMap;
  transactions: ParsedTransaction[];
} {
  const { headers, rows } = parseCsvText(csvText);
  const map = detectColumnMap(headers);
  const transactions: ParsedTransaction[] = [];
  for (const row of rows) {
    const tx = parseRow(row, map);
    if (tx && tx.amount > 0) transactions.push(tx);
  }
  return { map, transactions };
}
