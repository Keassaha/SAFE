import type { RawRow, ColumnMapping, NormalizedRow, NormalizedBankTransaction, FieldError } from "../types";

function parseAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeBankRow(
  row: RawRow,
  mapping: ColumnMapping,
  index: number,
): NormalizedRow<NormalizedBankTransaction> {
  const errors: FieldError[] = [];
  const warnings: string[] = [];

  const get = (field: string) => {
    const col = mapping[field];
    return col ? (row[col] ?? "").trim() : "";
  };

  const dateRaw = get("date");
  let date = "";
  if (dateRaw) {
    const d = new Date(dateRaw);
    date = Number.isNaN(d.getTime()) ? dateRaw : d.toISOString().slice(0, 10);
  }
  if (!date) {
    errors.push({ field: "date", message: "Date manquante" });
  }

  const description = get("description");
  if (!description) {
    errors.push({ field: "description", message: "Description manquante" });
  }

  let amount = 0;
  let rawType: "debit" | "credit" = "debit";

  const amountRaw = get("amount");
  const debitRaw = get("debit");
  const creditRaw = get("credit");

  if (amountRaw) {
    amount = Math.abs(parseAmount(amountRaw));
    rawType = amountRaw.trim().startsWith("-") || amountRaw.includes("(") ? "debit" : "credit";
  } else if (debitRaw || creditRaw) {
    const d = parseAmount(debitRaw);
    const c = parseAmount(creditRaw);
    if (c > 0) {
      amount = c;
      rawType = "credit";
    } else {
      amount = Math.abs(d);
      rawType = "debit";
    }
  }

  if (amount === 0) {
    warnings.push("Montant nul ou non détecté");
  }

  const balance = get("balance") ? parseAmount(get("balance")) : undefined;

  const data: NormalizedBankTransaction = {
    date,
    description,
    amount,
    rawType,
    balance,
    reference: get("reference") || undefined,
  };

  return { index, data, errors, warnings };
}
