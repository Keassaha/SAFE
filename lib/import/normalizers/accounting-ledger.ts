/**
 * Normalisation prudente d'une ligne de migration comptable.
 *
 * Principes:
 *  - on n'invente jamais de donnée
 *  - une ligne ambiguë devient un warning ou un blocage, jamais une écriture silencieuse
 *  - les lignes de total/sous-total/report sont marquées et exclues du journal
 *  - un fingerprint stable est conservé pour détecter les doublons et les rejeux
 *  - la direction (IN/OUT) est dérivée de manière déterministe à partir
 *    de debit/credit, du signe de `amount` ou d'une heuristique sur le typeTransaction
 *
 * Source des conventions: docs/SOURCE_OF_TRUTH.md, types/journal.ts.
 */

import type {
  RawRow,
  ColumnMapping,
  NormalizedRow,
  NormalizedAccountingEntry,
  AccountingDirection,
  FieldError,
} from "../types";

/**
 * Calcule le numéro de ligne tel qu'il apparaît dans le fichier source.
 * Les parseurs (CSV/Excel) attachent déjà `__sourceRowIndex` en base 1.
 * Le fallback `index` est l'index normalisé (0-based) — on lui ajoute 1.
 */
export function computeSourceLine(row: {
  index: number;
  sourceRowIndex?: number;
}): number {
  return row.sourceRowIndex ?? row.index + 1;
}

/**
 * Clé d'idempotence stable pour les imports de migration comptable.
 *
 * On s'appuie sur `JournalGeneralEntry.sourceId`, alimenté à la création
 * avec le fingerprint de la ligne. Avant cette correction, la recherche
 * passait par `reference`, qui pouvait être suffixée de la référence
 * métier source (`MIG:<fp> | <ref>`) — ce qui faisait échouer le check
 * d'idempotence dès que la ligne source contenait une référence.
 *
 * Retourne `null` si on ne peut pas calculer de clé fiable (pas de fingerprint).
 */
export function buildAccountingIdempotencyQuery(
  cabinetId: string,
  fingerprint: string | undefined | null,
): { cabinetId: string; sourceId: string } | null {
  if (!fingerprint) return null;
  return { cabinetId, sourceId: fingerprint };
}

const SUMMARY_TEXT_PATTERNS = [
  /^total\b/i,
  /^totaux\b/i,
  /^sub[\s-]?total\b/i,
  /^sous[\s-]?total\b/i,
  /^report\b/i,
  /^carry[\s-]?forward\b/i,
  /^solde\s+d['’]ouverture\b/i,
  /^opening\s+balance\b/i,
  /^solde\s+de\s+cl[oô]ture\b/i,
  /^closing\s+balance\b/i,
  /^grand\s+total\b/i,
];

const TYPE_TRANSACTION_OUT = ["depense", "dépense", "expense", "retrait", "withdrawal", "debours", "débours", "paiement_sortie", "payment_out"];
const TYPE_TRANSACTION_IN = ["paiement", "payment", "facture", "invoice", "depot", "dépôt", "deposit", "encaissement", "receipt", "revenu", "revenue"];

function get(row: RawRow, mapping: ColumnMapping, field: string): string {
  const col = mapping[field];
  return col ? (row[col] ?? "").trim() : "";
}

/**
 * Parse les montants suivants:
 *   "1 234,56", "1,234.56", "(123,45)" (négatif), "-12.50", "12.50 CR", "$ 1 200"
 * Retourne NaN si non parsable.
 */
export function parseLocalAmount(raw: string): number {
  if (!raw) return NaN;
  let s = raw.trim();
  if (!s) return NaN;

  // Suffixes comptables courants.
  let sign = 1;
  // Parenthèses = négatif.
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  // Suffixes DR / CR (Anglo).
  const upper = s.toUpperCase();
  if (/\bDR$/.test(upper)) {
    s = s.replace(/\s*DR$/i, "");
  } else if (/\bCR$/.test(upper)) {
    s = s.replace(/\s*CR$/i, "");
  }

  // Retire tout caractère non numérique sauf séparateurs et signes.
  s = s.replace(/[^\d,.\-]/g, "");

  // Si le séparateur décimal est ',' (FR), on convertit en '.'.
  // Heuristique: si la chaîne contient à la fois ',' et '.', le dernier des deux est le décimal.
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // Format FR: "1.234,56" -> "1234.56"
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // Format EN: "1,234.56" -> "1234.56"
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Une seule virgule comme séparateur décimal -> '.'
    s = s.replace(",", ".");
  }

  // Signe explicite peut subsister.
  if (s.startsWith("-")) {
    sign *= -1;
    s = s.slice(1);
  }

  const num = Number.parseFloat(s);
  if (!Number.isFinite(num)) return NaN;
  return sign * num;
}

/** Excel sérialise les dates en jours depuis 1899-12-30. */
function fromExcelSerial(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 60 || serial > 200000) return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const FR_DATE_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;
const EN_DATE_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

/**
 * Parse une date robuste:
 *   "2026-04-28", "28/04/2026", "04/28/2026", "28-04-26",
 *   "12 janv. 2026", "January 12, 2026", "45123" (Excel serial).
 */
export function parseFlexibleDate(raw: string, hint?: "fr" | "en"): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // ISO direct.
  const iso = s.match(ISO_DATE_RE);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Excel serial (chaîne uniquement numérique).
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number.parseFloat(s);
    const d = fromExcelSerial(serial);
    if (d) return d.toISOString().slice(0, 10);
  }

  // FR/EN avec séparateurs / ou -.
  const fr = s.match(FR_DATE_RE) ?? s.match(EN_DATE_RE);
  if (fr) {
    let [_, a, b, y] = fr;
    let day: number;
    let month: number;
    if (hint === "en" || (Number(a) > 12 && Number(b) <= 12) === false && Number(a) <= 12 && Number(b) > 12) {
      // a = month, b = day
      month = Number(a);
      day = Number(b);
    } else {
      // Par défaut FR: a = day, b = month.
      day = Number(a);
      month = Number(b);
    }
    let year = Number(y);
    if (year < 100) year = year < 70 ? 2000 + year : 1900 + year;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dd = String(day).padStart(2, "0");
    const mm = String(month).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  // Dernier recours: `Date` natif (couvre "January 12, 2026", "12 Jan 2026", etc.)
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function isSummaryByDescription(desc: string): boolean {
  if (!desc) return false;
  return SUMMARY_TEXT_PATTERNS.some((re) => re.test(desc.trim()));
}

function deriveDirection(
  debit: number | null,
  credit: number | null,
  amount: number | null,
  typeTransaction: string,
): { direction: AccountingDirection; amount: number; conflict: boolean } {
  let conflict = false;

  if (debit != null && credit != null && debit !== 0 && credit !== 0) {
    conflict = true;
  }

  if (credit != null && credit !== 0 && (debit == null || debit === 0)) {
    return { direction: "IN", amount: Math.abs(credit), conflict };
  }
  if (debit != null && debit !== 0 && (credit == null || credit === 0)) {
    return { direction: "OUT", amount: Math.abs(debit), conflict };
  }

  if (amount != null && Number.isFinite(amount)) {
    const absAmt = Math.abs(amount);
    if (absAmt === 0) return { direction: "UNKNOWN", amount: 0, conflict };
    if (amount < 0) return { direction: "OUT", amount: absAmt, conflict };
    // Positif: on regarde le typeTransaction pour ne pas tout mettre en IN par défaut.
    const t = typeTransaction.toLowerCase();
    if (TYPE_TRANSACTION_OUT.some((k) => t.includes(k))) {
      return { direction: "OUT", amount: absAmt, conflict };
    }
    if (TYPE_TRANSACTION_IN.some((k) => t.includes(k))) {
      return { direction: "IN", amount: absAmt, conflict };
    }
    // Ambigu — on retourne UNKNOWN pour forcer un warning.
    return { direction: "UNKNOWN", amount: absAmt, conflict };
  }

  return { direction: "UNKNOWN", amount: 0, conflict };
}

const REFERENCE_VAGUE_PATTERNS = [/^[#-]+$/, /^n\/?a$/i, /^aucun/i, /^none$/i];

function fingerprintFallback(parts: string[]): string {
  const seed = parts.filter(Boolean).join("||");
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function normalizeAccountingRow(
  row: RawRow,
  mapping: ColumnMapping,
  index: number,
): NormalizedRow<NormalizedAccountingEntry> {
  const errors: FieldError[] = [];
  const warnings: string[] = [];

  const dateRaw = get(row, mapping, "date");
  const description = get(row, mapping, "description");
  const reference = get(row, mapping, "reference");
  const clientName = get(row, mapping, "clientName");
  const numeroDossier = get(row, mapping, "numeroDossier");
  const categorie = get(row, mapping, "categorie");
  const compte = get(row, mapping, "compte");
  const debitRaw = get(row, mapping, "debit");
  const creditRaw = get(row, mapping, "credit");
  const amountRaw = get(row, mapping, "amount");
  const balanceRaw = get(row, mapping, "balance");
  const sourceModule = get(row, mapping, "sourceModule").toUpperCase() || undefined;
  const typeTransaction = get(row, mapping, "typeTransaction").toUpperCase() || undefined;

  // Métadonnées de provenance déjà attachées par le parser (si dispo).
  const sheetName = row.__sheetName;
  const sourceRowIndex = row.__sourceRowIndex ? Number.parseInt(row.__sourceRowIndex, 10) : undefined;
  const rawRowText = row.__rawRowText;
  const parserKind = row.__sourceRowKind;

  // 1. Détection ligne synthèse: combiné parser + texte de description.
  const summaryByParser = parserKind === "summary";
  const summaryByDesc = isSummaryByDescription(description);
  const isSummary = summaryByParser || summaryByDesc;

  let kind: NormalizedAccountingEntry["sourceRowKind"] = "data";
  if (parserKind === "comment") kind = "comment";
  else if (isSummary) {
    // distinguer "opening balance" pour traçabilité.
    if (/ouverture|opening/i.test(description) || /ouverture|opening/i.test(reference)) {
      kind = "opening_balance";
    } else {
      kind = "summary";
    }
  }

  // 2. Date.
  const date = dateRaw ? parseFlexibleDate(dateRaw) ?? "" : "";
  if (!date && !isSummary) {
    errors.push({ field: "date", message: "Date manquante ou non parsable", value: dateRaw });
  } else if (dateRaw && !date) {
    warnings.push(`Date non reconnue: ${dateRaw}`);
  }

  // 3. Description.
  if (!description && !isSummary) {
    errors.push({ field: "description", message: "Description manquante" });
  }

  // 4. Montants.
  const debit = debitRaw ? parseLocalAmount(debitRaw) : null;
  const credit = creditRaw ? parseLocalAmount(creditRaw) : null;
  const amount = amountRaw ? parseLocalAmount(amountRaw) : null;
  const balance = balanceRaw ? parseLocalAmount(balanceRaw) : undefined;

  if (debitRaw && Number.isNaN(debit as number)) {
    warnings.push(`Débit non parsable: ${debitRaw}`);
  }
  if (creditRaw && Number.isNaN(credit as number)) {
    warnings.push(`Crédit non parsable: ${creditRaw}`);
  }
  if (amountRaw && Number.isNaN(amount as number)) {
    warnings.push(`Montant non parsable: ${amountRaw}`);
  }

  const cleanDebit = debit != null && Number.isFinite(debit) ? debit : null;
  const cleanCredit = credit != null && Number.isFinite(credit) ? credit : null;
  const cleanAmount = amount != null && Number.isFinite(amount) ? amount : null;

  const { direction, amount: derivedAmount, conflict } = deriveDirection(
    cleanDebit,
    cleanCredit,
    cleanAmount,
    typeTransaction ?? "",
  );

  if (conflict) {
    errors.push({
      field: "debit/credit",
      message: "Débit ET Crédit non nuls — ligne contradictoire",
      value: { debit: cleanDebit, credit: cleanCredit },
    });
  }

  if (!isSummary) {
    if (derivedAmount === 0) {
      // Une ligne montant nul peut être un ajustement; on la passe en warning et on n'écrit pas.
      warnings.push("Montant nul ou indétecté");
    } else if (direction === "UNKNOWN") {
      warnings.push("Direction financière indéterminée (ni débit, ni crédit, ni signe clair)");
    }
  }

  // 5. Référence vague.
  if (reference && REFERENCE_VAGUE_PATTERNS.some((re) => re.test(reference.trim()))) {
    warnings.push(`Référence vague: ${reference}`);
  }

  // 6. Compte / catégorie absents = warning seulement (un grand livre peut être implicite).
  if (!compte && !categorie && !isSummary) {
    warnings.push("Aucun compte ni catégorie associé");
  }

  // 7. SourceModule / typeTransaction libres = on les garde, on ne tente pas de coercer.
  // Le mapping vers les enums Prisma se fait plus tard, dans l'action.

  // Fingerprint final: on préfère celui du parser (basé sur le texte brut),
  // sinon on en calcule un sur les champs canoniques.
  const rowFingerprint =
    row.__rowFingerprint ??
    fingerprintFallback([
      date, description, reference, clientName, numeroDossier,
      compte, String(cleanDebit ?? ""), String(cleanCredit ?? ""),
      String(cleanAmount ?? ""),
    ]);

  const data: NormalizedAccountingEntry = {
    date,
    description,
    reference: reference || undefined,
    clientName: clientName || undefined,
    numeroDossier: numeroDossier || undefined,
    categorie: categorie || undefined,
    compte: compte || undefined,
    amount: derivedAmount,
    debit: cleanDebit ?? undefined,
    credit: cleanCredit ?? undefined,
    direction,
    balance,
    sourceModule,
    typeTransaction,
    sheetName,
    sourceRowIndex,
    rowFingerprint,
    sourceRowKind: kind,
    rawRowText,
  };

  const severity: NormalizedRow["severity"] = errors.length > 0
    ? "blocked"
    : warnings.length > 0 || isSummary
      ? "warning"
      : "ok";

  return {
    index,
    data,
    errors,
    warnings,
    severity,
    isSummaryRow: isSummary,
    rowFingerprint,
    sourceRowIndex,
    sheetName,
  };
}
