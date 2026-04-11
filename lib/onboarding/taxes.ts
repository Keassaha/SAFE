/* ─────────────────────────────────────────────
   Taxes par province canadienne
   ───────────────────────────────────────────── */

export interface ProvinceTax {
  province: string;
  taxes: { name: string; rate: number }[];
}

export const PROVINCE_TAXES: Record<string, ProvinceTax> = {
  QC: {
    province: "Québec",
    taxes: [
      { name: "TPS / GST", rate: 5 },
      { name: "TVQ / QST", rate: 9.975 },
    ],
  },
  ON: {
    province: "Ontario",
    taxes: [{ name: "HST", rate: 13 }],
  },
  BC: {
    province: "Colombie-Britannique / British Columbia",
    taxes: [
      { name: "GST", rate: 5 },
      { name: "PST", rate: 7 },
    ],
  },
  AB: {
    province: "Alberta",
    taxes: [{ name: "GST", rate: 5 }],
  },
  SK: {
    province: "Saskatchewan",
    taxes: [
      { name: "GST", rate: 5 },
      { name: "PST", rate: 6 },
    ],
  },
  MB: {
    province: "Manitoba",
    taxes: [
      { name: "GST", rate: 5 },
      { name: "PST", rate: 7 },
    ],
  },
  NB: {
    province: "Nouveau-Brunswick / New Brunswick",
    taxes: [{ name: "HST", rate: 15 }],
  },
  NS: {
    province: "Nouvelle-Écosse / Nova Scotia",
    taxes: [{ name: "HST", rate: 15 }],
  },
  PE: {
    province: "Île-du-Prince-Édouard / PEI",
    taxes: [{ name: "HST", rate: 15 }],
  },
  NL: {
    province: "Terre-Neuve / Newfoundland",
    taxes: [{ name: "HST", rate: 15 }],
  },
  NT: {
    province: "Territoires du Nord-Ouest / NWT",
    taxes: [{ name: "GST", rate: 5 }],
  },
  YT: {
    province: "Yukon",
    taxes: [{ name: "GST", rate: 5 }],
  },
  NU: {
    province: "Nunavut",
    taxes: [{ name: "GST", rate: 5 }],
  },
};

export function getTaxDisplay(provinceCode: string): string {
  const info = PROVINCE_TAXES[provinceCode];
  if (!info) return "GST 5%";
  return info.taxes.map((t) => `${t.name} ${t.rate}%`).join(" + ");
}

export const PROVINCES = [
  { code: "QC", fr: "Québec", en: "Quebec" },
  { code: "ON", fr: "Ontario", en: "Ontario" },
  { code: "BC", fr: "Colombie-Britannique", en: "British Columbia" },
  { code: "AB", fr: "Alberta", en: "Alberta" },
  { code: "SK", fr: "Saskatchewan", en: "Saskatchewan" },
  { code: "MB", fr: "Manitoba", en: "Manitoba" },
  { code: "NB", fr: "Nouveau-Brunswick", en: "New Brunswick" },
  { code: "NS", fr: "Nouvelle-Écosse", en: "Nova Scotia" },
  { code: "PE", fr: "Île-du-Prince-Édouard", en: "Prince Edward Island" },
  { code: "NL", fr: "Terre-Neuve-et-Labrador", en: "Newfoundland and Labrador" },
  { code: "NT", fr: "Territoires du Nord-Ouest", en: "Northwest Territories" },
  { code: "YT", fr: "Yukon", en: "Yukon" },
  { code: "NU", fr: "Nunavut", en: "Nunavut" },
];
