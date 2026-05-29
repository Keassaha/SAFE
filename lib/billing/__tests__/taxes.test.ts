import { describe, expect, it } from "vitest";
import {
  applyTaxes,
  splitInclusiveTaxes,
  getCabinetTaxConfig,
  getDefaultTaxConfig,
  describeTaxConfig,
  toInvoiceTaxColumns,
  toDisplayTaxes,
  computeLineTaxColumns,
} from "@/lib/billing/taxes";
import type { CabinetTaxConfig } from "@/lib/billing/types";

const QC: CabinetTaxConfig = { province: "QC", mode: "tps_tvq", rates: { tps: 5, tvq: 9.975 } };
const ON: CabinetTaxConfig = { province: "ON", mode: "hst", rates: { hst: 13 } };
const AB: CabinetTaxConfig = { province: "AB", mode: "tps_only", rates: { tps: 5 } };
const NONE: CabinetTaxConfig = { province: "QC", mode: "none", rates: {} };

describe("applyTaxes — calcul forward", () => {
  it("QC: 100$ taxable → TPS 5$ + TVQ 9.98$ + total 114.98$", () => {
    const r = applyTaxes(100, true, QC);
    expect(r.base).toBe(100);
    expect(r.tps).toBe(5);
    expect(r.tvq).toBe(9.98);
    expect(r.taxesTotal).toBe(14.98);
    expect(r.total).toBe(114.98);
  });

  it("ON: 1000$ taxable → HST 130$ + total 1130$", () => {
    const r = applyTaxes(1000, true, ON);
    expect(r.hst).toBe(130);
    expect(r.tps).toBe(0);
    expect(r.tvq).toBe(0);
    expect(r.total).toBe(1130);
  });

  it("AB: 500$ taxable → TPS 25$ + total 525$ (pas de PST/TVQ)", () => {
    const r = applyTaxes(500, true, AB);
    expect(r.tps).toBe(25);
    expect(r.tvq).toBe(0);
    expect(r.hst).toBe(0);
    expect(r.total).toBe(525);
  });

  it("Ligne non taxable retourne uniquement la base", () => {
    const r = applyTaxes(250, false, QC);
    expect(r.base).toBe(250);
    expect(r.tps).toBe(0);
    expect(r.tvq).toBe(0);
    expect(r.taxesTotal).toBe(0);
    expect(r.total).toBe(250);
  });

  it("Mode none: aucune taxe même si taxable", () => {
    const r = applyTaxes(100, true, NONE);
    expect(r.taxesTotal).toBe(0);
    expect(r.total).toBe(100);
  });

  it("Arrondi à 2 décimales par taxe", () => {
    // 33.33 * 9.975% = 3.32...
    const r = applyTaxes(33.33, true, QC);
    expect(r.tps).toBe(1.67);
    expect(r.tvq).toBe(3.32);
    expect(r.total).toBe(38.32);
  });
});

describe("splitInclusiveTaxes — décomposition inverse", () => {
  it("ON: 1130$ TTC → base 1000$ + HST 130$", () => {
    const r = splitInclusiveTaxes(1130, ON);
    expect(r.base).toBe(1000);
    expect(r.hst).toBe(130);
    expect(r.total).toBe(1130);
  });

  it("AB: 525$ TTC → base 500$ + TPS 25$", () => {
    const r = splitInclusiveTaxes(525, AB);
    expect(r.base).toBe(500);
    expect(r.tps).toBe(25);
  });

  it("QC: 114.98$ TTC → base ~100$ + TPS + TVQ", () => {
    const r = splitInclusiveTaxes(114.98, QC);
    expect(r.base).toBeCloseTo(100, 1);
    expect(r.taxesTotal).toBeCloseTo(14.98, 1);
  });

  it("Total nul ou négatif retourne base = total", () => {
    const r = splitInclusiveTaxes(0, ON);
    expect(r.base).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe("getCabinetTaxConfig — lecture JSON", () => {
  it("Format canonique V2", () => {
    const json = {
      facturation: {
        taxes: { province: "ON", mode: "hst", rates: { hst: 13 } },
      },
    };
    const cfg = getCabinetTaxConfig(json);
    expect(cfg.province).toBe("ON");
    expect(cfg.mode).toBe("hst");
    expect(cfg.rates.hst).toBe(13);
  });

  it("Format historique Derisier { mode: hst, taux: 13 }", () => {
    const json = { facturation: { taxes: { mode: "hst", taux: 13 } } };
    const cfg = getCabinetTaxConfig(json);
    expect(cfg.mode).toBe("hst");
    expect(cfg.rates.hst).toBe(13);
    expect(cfg.province).toBe("ON");
  });

  it("Config absente: fallback QC", () => {
    expect(getCabinetTaxConfig(null).province).toBe("QC");
    expect(getCabinetTaxConfig({}).province).toBe("QC");
    expect(getCabinetTaxConfig({ facturation: {} }).province).toBe("QC");
  });

  it("Config malformée: fallback sur la province indiquée", () => {
    const cfg = getCabinetTaxConfig({ facturation: { taxes: 42 } }, "ON");
    expect(cfg.province).toBe("ON");
    expect(cfg.rates.hst).toBe(13);
  });

  it("getDefaultTaxConfig couvre toutes les provinces canadiennes", () => {
    expect(getDefaultTaxConfig("QC").mode).toBe("tps_tvq");
    expect(getDefaultTaxConfig("ON").mode).toBe("hst");
    expect(getDefaultTaxConfig("BC").mode).toBe("tps_pst");
    expect(getDefaultTaxConfig("NB").rates.hst).toBe(15);
    expect(getDefaultTaxConfig("XX").province).toBe("QC"); // fallback
  });
});

describe("Option A — mapping colonnes DB (tps/tvq) sans migration", () => {
  it("invariant : tps + tvq === taxesTotal (ON)", () => {
    const applied = applyTaxes(1000, true, ON);
    const cols = toInvoiceTaxColumns(applied, ON.mode);
    // HST logé dans la colonne tps, tvq=0.
    expect(cols.tps).toBe(130);
    expect(cols.tvq).toBe(0);
    expect(cols.taxGst).toBe(130);
    expect(cols.taxQst).toBe(0);
    expect(cols.tps + cols.tvq).toBe(cols.taxTotal);
    expect(cols.taxTotal).toBe(applied.taxesTotal);
  });

  it("invariant : tps + tvq === taxesTotal (QC)", () => {
    const applied = applyTaxes(1000, true, QC);
    const cols = toInvoiceTaxColumns(applied, QC.mode);
    expect(cols.tps).toBe(50);
    expect(cols.tvq).toBe(99.75);
    expect(cols.tps + cols.tvq).toBe(cols.taxTotal);
  });

  it("toDisplayTaxes : ON re-libellé en TVH (hst), QC en TPS/TVQ", () => {
    // ON : colonnes (130, 0) → affichage HST 130, tps/tvq 0.
    const on = toDisplayTaxes(130, 0, "hst");
    expect(on.hst).toBe(130);
    expect(on.tps).toBe(0);
    expect(on.tvq).toBe(0);
    // QC : colonnes (50, 99.75) → affichage tps/tvq, hst 0.
    const qc = toDisplayTaxes(50, 99.75, "tps_tvq");
    expect(qc.hst).toBe(0);
    expect(qc.tps).toBe(50);
    expect(qc.tvq).toBe(99.75);
  });

  it("computeLineTaxColumns : ligne non taxable → 0", () => {
    expect(computeLineTaxColumns(1000, false, ON)).toEqual({ gstAmount: 0, qstAmount: 0 });
    const taxed = computeLineTaxColumns(1000, true, ON);
    expect(taxed.gstAmount).toBe(130);
    expect(taxed.qstAmount).toBe(0);
  });
});

describe("describeTaxConfig — libellé UI", () => {
  it("résume correctement chaque mode", () => {
    expect(describeTaxConfig(QC)).toBe("TPS 5% + TVQ 9.975%");
    expect(describeTaxConfig(ON)).toBe("HST 13%");
    expect(describeTaxConfig(AB)).toBe("TPS 5%");
    expect(describeTaxConfig(NONE)).toBe("Aucune taxe");
  });
});
