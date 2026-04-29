/**
 * SAFE — Configuration et application des taxes par province.
 *
 * Source de vérité : docs/accounting/TAX_AND_PROVINCE_MODEL.md
 *
 * Tous les helpers sont purs. Aucun accès Prisma. Aucune dépendance UI.
 *
 * Convention de lecture : la config vit dans `CabinetInterface.modules.facturation.taxes`
 * (JSON). On la lit via `getCabinetTaxConfig(modulesJson)`. Si la config est
 * manquante ou incohérente, on retombe sur un défaut explicite (QC) en
 * documentant le warning dans la valeur de retour.
 */

import type {
  AppliedTaxes,
  CabinetTaxConfig,
  CanadianProvince,
  TaxMode,
  TaxRates,
} from "./types";

const ROUND_2 = (n: number): number => Math.round(n * 100) / 100;

/* ───────── Taux canoniques par province ───────── */

const PROVINCE_DEFAULTS: Record<CanadianProvince, CabinetTaxConfig> = {
  QC: { province: "QC", mode: "tps_tvq", rates: { tps: 5.0, tvq: 9.975 } },
  ON: { province: "ON", mode: "hst",     rates: { hst: 13.0 } },
  AB: { province: "AB", mode: "tps_only",rates: { tps: 5.0 } },
  BC: { province: "BC", mode: "tps_pst", rates: { tps: 5.0, pst: 7.0 } },
  MB: { province: "MB", mode: "tps_rst", rates: { tps: 5.0, rst: 7.0 } },
  SK: { province: "SK", mode: "tps_pst", rates: { tps: 5.0, pst: 6.0 } },
  NB: { province: "NB", mode: "hst",     rates: { hst: 15.0 } },
  NS: { province: "NS", mode: "hst",     rates: { hst: 15.0 } },
  NL: { province: "NL", mode: "hst",     rates: { hst: 15.0 } },
  PE: { province: "PE", mode: "hst",     rates: { hst: 15.0 } },
  YT: { province: "YT", mode: "tps_only",rates: { tps: 5.0 } },
  NT: { province: "NT", mode: "tps_only",rates: { tps: 5.0 } },
  NU: { province: "NU", mode: "tps_only",rates: { tps: 5.0 } },
};

const SUPPORTED_PROVINCES: ReadonlySet<CanadianProvince> = new Set(
  Object.keys(PROVINCE_DEFAULTS) as CanadianProvince[],
);

/* ───────── Lecture / défaut ───────── */

/**
 * Renvoie la config par défaut pour une province (Canada).
 * Si la province n'est pas reconnue, on retombe sur QC.
 */
export function getDefaultTaxConfig(province: string | null | undefined): CabinetTaxConfig {
  const p = (province ?? "QC").toUpperCase() as CanadianProvince;
  if (SUPPORTED_PROVINCES.has(p)) return PROVINCE_DEFAULTS[p];
  return PROVINCE_DEFAULTS.QC;
}

/**
 * Lit la config taxes depuis la sous-arborescence JSON
 * `CabinetInterface.modules.facturation.taxes`.
 *
 * Format historique toléré : `{ mode: "hst", taux: 13 }` (cas Derisier).
 * Format canonique V2 : voir `CabinetTaxConfig`.
 *
 * Si la config est manquante ou malformée, on retombe sur QC par défaut.
 * Aucune exception levée — le fallback est explicite.
 */
export function getCabinetTaxConfig(
  modulesJson: unknown,
  fallbackProvince: string | null | undefined = "QC",
): CabinetTaxConfig {
  const taxes = readTaxesNode(modulesJson);
  if (!taxes) return getDefaultTaxConfig(fallbackProvince);

  // 1) Format canonique
  if (typeof taxes.mode === "string" && taxes.rates && typeof taxes.rates === "object") {
    const province = (typeof taxes.province === "string" ? taxes.province.toUpperCase() : (fallbackProvince ?? "QC").toUpperCase()) as CanadianProvince;
    return {
      province: SUPPORTED_PROVINCES.has(province) ? province : "QC",
      mode: normalizeMode(taxes.mode),
      rates: sanitizeRates(taxes.rates as Record<string, unknown>),
      registrations: taxes.registrations as CabinetTaxConfig["registrations"],
    };
  }

  // 2) Format historique : { mode: "hst", taux: 13 }
  if (typeof taxes.mode === "string" && typeof taxes.taux === "number") {
    const mode = normalizeMode(taxes.mode);
    const rates: TaxRates = {};
    if (mode === "hst") rates.hst = taxes.taux;
    else if (mode === "tps_only") rates.tps = taxes.taux;
    else if (mode === "tps_tvq") {
      // pas assez d'info — on retombe sur les défauts QC
      const def = PROVINCE_DEFAULTS.QC.rates;
      rates.tps = def.tps;
      rates.tvq = def.tvq;
    }
    const province = (mode === "hst" ? "ON" : "QC") as CanadianProvince;
    return { province, mode, rates };
  }

  return getDefaultTaxConfig(fallbackProvince);
}

function readTaxesNode(modulesJson: unknown): Record<string, unknown> | null {
  if (!modulesJson || typeof modulesJson !== "object") return null;
  const m = modulesJson as Record<string, unknown>;
  // Soit modules.facturation.taxes, soit modules directement
  const fact = (m.facturation && typeof m.facturation === "object")
    ? (m.facturation as Record<string, unknown>)
    : m;
  const taxes = fact.taxes;
  if (!taxes || typeof taxes !== "object") return null;
  return taxes as Record<string, unknown>;
}

function normalizeMode(raw: string): TaxMode {
  const v = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (v === "tps_tvq" || v === "qst" || v === "qc") return "tps_tvq";
  if (v === "hst") return "hst";
  if (v === "tps_only" || v === "gst" || v === "tps") return "tps_only";
  if (v === "tps_pst" || v === "pst") return "tps_pst";
  if (v === "tps_rst" || v === "rst") return "tps_rst";
  if (v === "none" || v === "exempt") return "none";
  return "tps_tvq";
}

function sanitizeRates(input: Record<string, unknown>): TaxRates {
  const out: TaxRates = {};
  for (const k of ["tps", "tvq", "hst", "pst", "rst"] as const) {
    const raw = input[k];
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0 && raw <= 100) {
      out[k] = raw;
    }
  }
  return out;
}

/* ───────── Calcul ───────── */

const ZERO_TAXES: AppliedTaxes = {
  base: 0, tps: 0, tvq: 0, hst: 0, pst: 0, rst: 0, taxesTotal: 0, total: 0,
};

/**
 * Applique les taxes pour un montant donné.
 *
 * Convention V2 :
 *  - QC : TPS et TVQ calculées séparément sur la base (méthode standard).
 *  - ON / Atlantique : HST calculé sur la base.
 *  - BC / MB / SK : TPS + (PST/RST) calculées séparément.
 *  - AB / Territoires : TPS uniquement.
 *  - Si `taxable === false`, retourne uniquement la base.
 *
 * Tous les montants arrondis à 2 décimales.
 */
export function applyTaxes(
  amount: number,
  taxable: boolean,
  config: CabinetTaxConfig,
): AppliedTaxes {
  const base = ROUND_2(amount);
  if (!taxable || config.mode === "none") {
    return { ...ZERO_TAXES, base, total: base };
  }

  const r = config.rates;
  const tps = r.tps ? ROUND_2((base * r.tps) / 100) : 0;
  const tvq = r.tvq ? ROUND_2((base * r.tvq) / 100) : 0;
  const hst = r.hst ? ROUND_2((base * r.hst) / 100) : 0;
  const pst = r.pst ? ROUND_2((base * r.pst) / 100) : 0;
  const rst = r.rst ? ROUND_2((base * r.rst) / 100) : 0;

  const taxesTotal = ROUND_2(tps + tvq + hst + pst + rst);
  const total = ROUND_2(base + taxesTotal);

  return { base, tps, tvq, hst, pst, rst, taxesTotal, total };
}

/**
 * Décomposition inverse : à partir d'un total TTC et de la config, retrouve la base et les taxes.
 *
 * Utile pour les imports bancaires où le total est connu mais pas la ventilation.
 *
 * Limites : pour les régimes avec plusieurs taxes (QC, BC, MB), on suppose que **toutes** les taxes
 * applicables ont été ajoutées au total. Pour les régimes "tps_only" ou "hst", c'est trivial.
 */
export function splitInclusiveTaxes(
  total: number,
  config: CabinetTaxConfig,
): AppliedTaxes {
  if (config.mode === "none" || total <= 0) {
    return { ...ZERO_TAXES, base: ROUND_2(total), total: ROUND_2(total) };
  }

  const r = config.rates;
  const totalRatePct = (r.tps ?? 0) + (r.tvq ?? 0) + (r.hst ?? 0) + (r.pst ?? 0) + (r.rst ?? 0);
  if (totalRatePct === 0) {
    return { ...ZERO_TAXES, base: ROUND_2(total), total: ROUND_2(total) };
  }

  const base = ROUND_2(total / (1 + totalRatePct / 100));
  // Recalcule les taxes individuelles depuis la base, comme en mode forward.
  return applyTaxes(base, true, config);
}

/* ───────── Helpers d'affichage ───────── */

/**
 * Donne le libellé court d'une taxe pour l'UI (ex: "HST 13%", "TPS 5% + TVQ 9.975%").
 */
export function describeTaxConfig(config: CabinetTaxConfig): string {
  switch (config.mode) {
    case "hst":     return `HST ${config.rates.hst ?? 0}%`;
    case "tps_tvq": return `TPS ${config.rates.tps ?? 0}% + TVQ ${config.rates.tvq ?? 0}%`;
    case "tps_only":return `TPS ${config.rates.tps ?? 0}%`;
    case "tps_pst": return `TPS ${config.rates.tps ?? 0}% + PST ${config.rates.pst ?? 0}%`;
    case "tps_rst": return `TPS ${config.rates.tps ?? 0}% + RST ${config.rates.rst ?? 0}%`;
    case "none":    return "Aucune taxe";
  }
}
