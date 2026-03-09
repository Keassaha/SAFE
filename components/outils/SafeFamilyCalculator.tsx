"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  CircleDollarSign,
  Landmark,
  Scale,
  Handshake,
  User,
  Users,
  CreditCard,
  ClipboardList,
  Home,
  Car,
  LayoutGrid,
  TrendingUp,
  Building2,
  Calculator,
  ChevronDown,
  AlertTriangle,
  Info,
  type LucideIcon,
} from "lucide-react";
import { WIZARD_COLORS as C } from "@/lib/documents/famille/wizard-data";

/*
  SAFE — Calculateur Droit Familial Québécois
  Module 1: Pension alimentaire enfants (Annexe I — 5 scénarios)
  Module 2: Patrimoine familial (CCQ art. 414-426)
  Module 3: Société d'acquêts (CCQ art. 448-484)
  Module 4: Prestation compensatoire (CCQ art. 427-430)
  Table de fixation 2026 — Déduction de base: 13 865 $
*/

const BASIC_DEDUCTION_2026 = 13865;

const TABLE_2026: number[][] = [
  [1000, 0, 0, 0, 0, 0, 0],
  [2000, 100, 100, 100, 100, 100, 100],
  [3000, 200, 300, 300, 300, 300, 300],
  [4000, 400, 600, 600, 600, 600, 600],
  [5000, 600, 1000, 1000, 1000, 1000, 1000],
  [6000, 900, 1400, 1500, 1500, 1500, 1500],
  [7000, 1200, 1900, 2100, 2100, 2100, 2100],
  [8000, 1600, 2500, 2800, 2800, 2800, 2800],
  [9000, 2100, 3200, 3600, 3700, 3700, 3700],
  [10000, 2600, 4000, 4500, 4700, 4700, 4700],
  [12000, 3200, 4900, 5600, 6000, 6200, 6200],
  [14000, 3700, 5700, 6600, 7200, 7600, 7600],
  [16000, 4100, 6300, 7400, 8200, 8800, 9000],
  [18000, 4400, 6800, 8100, 9100, 9900, 10500],
  [20000, 4610, 7090, 8540, 10040, 10130, 10130],
  [22000, 4850, 7380, 8940, 10560, 11300, 11300],
  [24000, 5080, 7680, 9330, 11080, 12000, 12400],
  [26000, 5310, 7970, 9730, 11590, 12780, 13500],
  [28000, 5550, 8260, 10120, 12110, 13530, 14570],
  [30000, 6030, 9150, 11290, 13460, 15190, 15190],
  [32000, 6270, 9450, 11680, 13970, 15840, 17070],
  [34000, 6500, 9740, 12080, 14490, 16470, 17840],
  [36000, 6740, 10040, 12470, 15000, 17110, 18600],
  [38000, 6970, 10330, 12870, 15520, 17740, 19370],
  [40000, 7210, 10630, 13260, 16030, 18380, 20130],
  [42000, 7440, 10920, 13660, 16550, 19010, 20900],
  [44000, 7680, 11220, 14050, 17060, 19650, 21660],
  [46000, 7910, 11510, 14450, 17580, 20280, 22430],
  [48000, 8140, 11800, 14840, 18090, 20910, 23190],
  [50000, 7810, 11480, 14370, 17280, 20150, 23040],
  [52000, 8040, 11770, 14760, 17800, 20790, 23800],
  [54000, 8280, 12060, 15160, 18310, 21420, 24570],
  [56000, 8510, 12360, 15550, 18830, 22060, 25330],
  [58000, 8750, 12650, 15940, 19340, 22690, 26090],
  [60000, 8980, 12940, 16340, 19860, 23320, 26860],
  [62000, 9220, 13240, 16730, 20370, 23960, 27620],
  [64000, 9450, 13530, 17130, 20890, 24590, 28380],
  [66000, 9690, 13820, 17520, 21400, 25220, 29150],
  [68000, 9920, 14110, 17910, 21920, 25860, 29910],
  [70000, 10150, 14410, 18310, 22430, 26490, 30680],
  [72000, 10390, 14700, 18700, 22950, 27130, 31440],
  [74000, 10620, 14990, 19100, 23460, 27760, 32200],
  [76000, 10860, 15290, 19490, 23980, 28390, 32970],
  [78000, 11090, 15580, 19880, 24490, 29030, 33730],
  [80000, 10470, 15060, 19230, 23400, 27560, 31730],
  [82000, 10700, 15350, 19620, 23910, 28190, 32500],
  [84000, 10930, 15640, 20020, 24430, 28830, 33260],
  [86000, 11170, 15940, 20410, 24940, 29460, 34020],
  [88000, 11400, 16230, 20810, 25460, 30090, 34790],
  [90000, 11630, 16520, 21200, 25970, 30730, 35550],
  [92000, 11870, 16820, 21590, 26490, 31360, 36320],
  [94000, 11970, 16960, 21800, 26690, 31590, 36570],
  [96000, 12060, 17110, 22010, 26890, 31820, 36810],
  [98000, 12160, 17260, 22220, 27090, 32050, 37060],
  [100000, 11660, 16590, 21320, 26010, 30740, 35450],
  [102000, 11760, 16740, 21530, 26220, 30970, 35700],
  [104000, 11850, 16890, 21740, 26420, 31200, 35940],
  [106000, 11950, 17040, 21950, 26620, 31430, 36190],
  [108000, 12050, 17190, 22160, 26820, 31660, 36430],
  [110000, 12140, 17340, 22370, 27020, 31890, 36680],
  [112000, 12240, 17490, 22580, 27220, 32120, 36920],
  [114000, 12340, 17640, 22790, 27420, 32350, 37170],
  [116000, 12430, 17790, 23000, 27620, 32590, 37410],
  [118000, 12530, 17940, 23210, 27820, 32820, 37650],
  [120000, 12630, 18090, 23420, 28020, 33050, 37900],
  [122000, 12720, 18240, 23630, 28220, 33280, 38140],
  [124000, 12820, 18390, 23840, 28430, 33510, 38390],
  [126000, 12920, 18540, 24050, 28630, 33740, 38630],
  [128000, 13010, 18690, 24260, 28830, 33970, 38880],
  [130000, 13110, 18850, 24470, 29030, 34200, 39120],
  [132000, 13200, 19000, 24680, 29230, 34430, 39370],
  [134000, 13300, 19150, 24890, 29430, 34670, 39610],
  [136000, 13400, 19300, 25100, 29630, 34900, 39860],
  [138000, 13490, 19450, 25310, 29830, 35130, 40100],
  [140000, 13590, 19600, 25520, 30030, 35360, 40350],
  [142000, 13690, 19750, 25730, 30230, 35590, 40590],
  [144000, 13780, 19900, 25940, 30430, 35820, 40830],
  [146000, 13880, 20050, 26150, 30640, 36050, 41080],
  [148000, 13970, 20200, 26360, 30840, 36280, 41320],
  [150000, 13500, 18890, 24710, 30200, 36040, 41540],
  [152000, 13590, 19040, 24920, 30400, 36270, 41790],
  [154000, 13690, 19190, 25130, 30600, 36500, 42030],
  [156000, 13780, 19340, 25340, 30800, 36740, 42280],
  [158000, 13880, 19490, 25550, 31000, 36970, 42520],
  [160000, 13970, 19640, 25760, 31200, 37200, 42770],
  [162000, 14070, 19800, 25970, 31410, 37430, 43010],
  [164000, 14170, 19950, 26180, 31610, 37660, 43260],
  [166000, 14260, 20100, 26390, 31810, 37890, 43500],
  [168000, 14360, 20250, 26600, 32010, 38120, 43740],
  [170000, 14450, 20400, 26810, 32210, 38360, 43990],
  [172000, 14550, 20550, 27020, 32410, 38590, 44230],
  [174000, 14640, 20700, 27230, 32610, 38820, 44480],
  [176000, 14740, 20850, 27440, 32810, 39050, 44720],
  [178000, 14840, 21000, 27650, 33010, 39280, 44970],
  [180000, 14930, 21160, 27860, 33220, 39510, 45210],
  [182000, 15030, 21310, 28070, 33420, 39750, 45460],
  [184000, 15120, 21460, 28280, 33620, 39980, 45700],
  [186000, 15220, 21610, 28490, 33820, 40210, 45950],
  [188000, 15310, 21760, 28700, 34020, 40440, 46190],
  [190000, 15410, 21910, 28910, 34220, 40670, 46430],
  [192000, 15500, 22060, 29120, 34420, 40900, 46680],
  [194000, 15600, 22210, 29330, 34620, 41130, 46920],
  [196000, 15700, 22360, 29540, 34820, 41370, 47170],
  [198000, 15790, 22510, 29750, 35030, 41600, 47410],
  [200000, 15140, 20960, 27810, 34050, 40920, 47140],
];
const EXCESS_RATES_2026 = [0.035, 0.045, 0.065, 0.08, 0.1, 0.115];

function lookupTable(combinedIncome: number, numChildren: number): number {
  const col = Math.min(numChildren, 6);
  if (col < 1 || combinedIncome <= 0) return 0;
  for (let i = 0; i < TABLE_2026.length; i++) {
    if (combinedIncome <= TABLE_2026[i][0]) return TABLE_2026[i][col];
  }
  const base = TABLE_2026[TABLE_2026.length - 1][col];
  const excess = combinedIncome - 200000;
  const rate = EXCESS_RATES_2026[col - 1];
  let result = base + excess * rate;
  if (numChildren > 6) {
    const base6 = TABLE_2026[TABLE_2026.length - 1][6];
    const base5 = TABLE_2026[TABLE_2026.length - 1][5];
    result += (base6 - base5) * (numChildren - 6);
  }
  return Math.round(result);
}

function calcChildSupport(data: Record<string, unknown>) {
  const p1 = (data.parent1 as Record<string, unknown>) || {};
  const p2 = (data.parent2 as Record<string, unknown>) || {};
  const n = (v: unknown) => parseFloat(String(v)) || 0;

  const gross1 =
    n(p1.emploi) + n(p1.autonome) + n(p1.prestations) + n(p1.pensionRecue) + n(p1.retraite) + n(p1.placements) + n(p1.locatif) + n(p1.autre);
  const gross2 =
    n(p2.emploi) + n(p2.autonome) + n(p2.prestations) + n(p2.pensionRecue) + n(p2.retraite) + n(p2.placements) + n(p2.locatif) + n(p2.autre);

  const deductions1 = BASIC_DEDUCTION_2026 + n(p1.cotSyndicale) + n(p1.cotProfessionnelle);
  const deductions2 = BASIC_DEDUCTION_2026 + n(p2.cotSyndicale) + n(p2.cotProfessionnelle);
  const disp1 = Math.max(0, gross1 - deductions1);
  const disp2 = Math.max(0, gross2 - deductions2);
  const combined = disp1 + disp2;
  const pct1 = combined > 0 ? disp1 / combined : 0;
  const pct2 = combined > 0 ? disp2 / combined : 0;

  const numChildren = parseInt(String(data.numChildren), 10) || 1;
  const basicContrib = lookupTable(combined, numChildren);
  const share1 = basicContrib * pct1;
  const share2 = basicContrib * pct2;

  const childcare = n(data.fraisGarde);
  const postSec = n(data.fraisPostSec);
  const special = n(data.fraisSpeciaux);
  const totalAdditional = childcare + postSec + special;
  const addShare1 = totalAdditional * pct1;
  const addShare2 = totalAdditional * pct2;

  const custody = (data.custodyType as string) || "exclusive";
  let pension1 = 0,
    pension2 = 0;

  if (custody === "exclusive") {
    const custodialParent = (data.custodialParent as string) || "parent1";
    const totalPool = basicContrib + totalAdditional;
    if (custodialParent === "parent1") pension2 = totalPool * pct2;
    else pension1 = totalPool * pct1;
  } else if (custody === "extended") {
    const accessPct = n(data.accessDays) / 365;
    const compensation = Math.max(0, accessPct - 0.2) * basicContrib;
    const adjustedTotal = basicContrib + totalAdditional - compensation;
    const custodialParent = (data.custodialParent as string) || "parent1";
    if (custodialParent === "parent1") pension2 = adjustedTotal * pct2;
    else pension1 = adjustedTotal * pct1;
  } else if (custody === "shared") {
    const time1 = n(data.custodyPct1) / 100 || 0.5;
    const time2 = 1 - time1;
    const costByTime1 = basicContrib * time1;
    const costByTime2 = basicContrib * time2;
    const base1 = Math.max(0, share1 - costByTime1);
    const base2 = Math.max(0, share2 - costByTime2);
    pension1 = base1 > 0 ? base1 + addShare1 : 0;
    pension2 = base2 > 0 ? base2 + addShare2 : 0;
    if (pension1 > pension2) {
      pension1 = pension1 - pension2;
      pension2 = 0;
    } else {
      pension2 = pension2 - pension1;
      pension1 = 0;
    }
  } else if (custody === "split") {
    const children1 = parseInt(String(data.childrenWithP1), 10) || 1;
    const children2 = numChildren - children1;
    const avgCost = basicContrib / numChildren;
    const custCost1 = avgCost * children1;
    const custCost2 = avgCost * children2;
    const base1 = Math.max(0, share1 - custCost1);
    const base2 = Math.max(0, share2 - custCost2);
    pension1 = base1 > 0 ? base1 + addShare1 : 0;
    pension2 = base2 > 0 ? base2 + addShare2 : 0;
    if (pension1 > pension2) {
      pension1 = pension1 - pension2;
      pension2 = 0;
    } else {
      pension2 = pension2 - pension1;
      pension1 = 0;
    }
  } else if (custody === "mixed") {
    const time1 = n(data.custodyPct1) / 100 || 0.5;
    const time2 = 1 - time1;
    const costByTime1 = basicContrib * time1;
    const costByTime2 = basicContrib * time2;
    const base1 = Math.max(0, share1 - costByTime1);
    const base2 = Math.max(0, share2 - costByTime2);
    pension1 = base1 > 0 ? base1 + addShare1 : 0;
    pension2 = base2 > 0 ? base2 + addShare2 : 0;
    if (pension1 > pension2) {
      pension1 = pension1 - pension2;
      pension2 = 0;
    } else {
      pension2 = pension2 - pension1;
      pension1 = 0;
    }
  }

  const cap1 = disp1 * 0.5;
  const cap2 = disp2 * 0.5;
  const finalPension1 = Math.min(pension1, cap1);
  const finalPension2 = Math.min(pension2, cap2);

  return {
    gross1,
    gross2,
    deductions1,
    deductions2,
    disp1,
    disp2,
    combined,
    pct1,
    pct2,
    basicContrib,
    share1,
    share2,
    totalAdditional,
    addShare1,
    addShare2,
    pension1: Math.round(finalPension1),
    pension2: Math.round(finalPension2),
    cap1,
    cap2,
    cappedP1: pension1 > cap1,
    cappedP2: pension2 > cap2,
    monthly1: Math.round(finalPension1 / 12),
    monthly2: Math.round(finalPension2 / 12),
    payer: finalPension1 > 0 ? "Parent 1" : finalPension2 > 0 ? "Parent 2" : "Aucun",
    annualAmount: Math.max(finalPension1, finalPension2),
    monthlyAmount: Math.round(Math.max(finalPension1, finalPension2) / 12),
  };
}

function calcPatrimoine(data: Record<string, unknown>) {
  const n = (v: unknown) => parseFloat(String(v)) || 0;
  const cats = ["residences", "meubles", "vehicules", "retraite", "rrq"];
  let totalNet1 = 0,
    totalNet2 = 0;
  const details: Record<string, { val1: number; debt1: number; net1: number; val2: number; debt2: number; net2: number }> = {};
  cats.forEach((cat) => {
    const val1 = n(data[`${cat}_val1`]);
    const debt1 = n(data[`${cat}_debt1`]);
    const val2 = n(data[`${cat}_val2`]);
    const debt2 = n(data[`${cat}_debt2`]);
    const net1 = val1 - debt1;
    const net2 = val2 - debt2;
    details[cat] = { val1, debt1, net1, val2, debt2, net2 };
    totalNet1 += net1;
    totalNet2 += net2;
  });
  const deduct1 = n(data.deduction418_1);
  const deduct2 = n(data.deduction418_2);
  const shareable1 = Math.max(0, totalNet1 - deduct1);
  const shareable2 = Math.max(0, totalNet2 - deduct2);
  const totalShareable = shareable1 + shareable2;
  const halfTotal = totalShareable / 2;
  const equalization = Math.abs(shareable1 - shareable2) / 2;
  const payer = shareable1 > shareable2 ? "Époux 1" : shareable2 > shareable1 ? "Époux 2" : "Aucun";
  return {
    details,
    totalNet1,
    totalNet2,
    deduct1,
    deduct2,
    shareable1,
    shareable2,
    totalShareable,
    halfTotal,
    equalization: Math.round(equalization),
    payer,
  };
}

function calcAcquets(data: Record<string, unknown>) {
  const n = (v: unknown) => parseFloat(String(v)) || 0;
  const acq1 = n(data.acquets1);
  const acq2 = n(data.acquets2);
  const recompAcq1 = n(data.recompAcq1);
  const recompProp1 = n(data.recompProp1);
  const recompAcq2 = n(data.recompAcq2);
  const recompProp2 = n(data.recompProp2);
  const netAcq1 = acq1 + recompAcq1 - recompProp1;
  const netAcq2 = acq2 + recompAcq2 - recompProp2;
  const halfAcq1 = netAcq1 / 2;
  const halfAcq2 = netAcq2 / 2;
  const spouse1Receives = halfAcq2;
  const spouse2Receives = halfAcq1;
  const netTransfer = Math.abs(spouse2Receives - spouse1Receives);
  return {
    acq1,
    acq2,
    propres1: n(data.propres1),
    propres2: n(data.propres2),
    recompAcq1,
    recompProp1,
    recompAcq2,
    recompProp2,
    netAcq1,
    netAcq2,
    halfAcq1,
    halfAcq2,
    spouse1Receives: Math.round(spouse1Receives),
    spouse2Receives: Math.round(spouse2Receives),
    netTransfer: Math.round(netTransfer),
    payer: netTransfer > 0 ? (spouse2Receives > spouse1Receives ? "Époux 1" : "Époux 2") : "Aucun",
  };
}

function calcCompensation(data: Record<string, unknown>) {
  const n = (v: unknown) => parseFloat(String(v)) || 0;
  const enrichment = n(data.enrichment);
  const contribution = n(data.contribution);
  const alreadyCompensated = n(data.alreadyCompensated);
  const amount = Math.max(0, Math.min(enrichment, contribution) - alreadyCompensated);
  return { enrichment, contribution, alreadyCompensated, amount: Math.round(amount) };
}

// ─── Module icon (card style like document generator)
const MODULE_ICONS: Record<string, LucideIcon> = {
  pa: CircleDollarSign,
  patrimoine: Landmark,
  acquets: Scale,
  compensation: Handshake,
};

function ModuleIcon({ iconKey, color, size = 22 }: { iconKey: string; color: string; size?: number }) {
  const IconComponent = MODULE_ICONS[iconKey];
  if (!IconComponent) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color }}>
      <IconComponent size={size} strokeWidth={1.8} />
    </span>
  );
}

const MODULES = [
  { id: "pa", label: "Pension alimentaire", desc: "Annexe I — 5 scénarios", color: C.warn, icon: "pa" },
  { id: "patrimoine", label: "Patrimoine familial", desc: "CCQ art. 414-426", color: C.purple, icon: "patrimoine" },
  { id: "acquets", label: "Société d'acquêts", desc: "CCQ art. 448-484", color: C.bl500, icon: "acquets" },
  { id: "compensation", label: "Prestation compensatoire", desc: "CCQ art. 427-430", color: C.ok, icon: "compensation" },
];

const fmt = (v: number | string) =>
  (typeof v === "string" ? parseFloat(v) || 0 : v).toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " $";
const fmtPct = (v: number) => (v * 100).toFixed(1) + " %";

function NumInput({
  label,
  value,
  onChange,
  prefix = "$",
  hint,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  prefix?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.sl400, marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center" }}>
        {prefix && (
          <span
            style={{
              padding: "8px 10px",
              borderRadius: "10px 0 0 10px",
              border: `1px solid ${C.sl100}`,
              borderRight: "none",
              background: C.sl50,
              fontSize: 12,
              color: C.sl400,
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: `1px solid ${C.sl100}`,
            borderRadius: prefix ? "0 10px 10px 0" : 10,
            fontSize: 13,
            color: C.sl800,
            fontFamily: "'JetBrains Mono', monospace",
            outline: "none",
            background: C.white,
            width: "100%",
          }}
          onFocus={(e) => (e.target.style.borderColor = C.bl400)}
          onBlur={(e) => (e.target.style.borderColor = C.sl100)}
        />
      </div>
      {hint && <div style={{ fontSize: 10.5, color: C.sl300, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.sl400, marginBottom: 4 }}>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 10,
          border: `1px solid ${C.sl100}`,
          fontSize: 13,
          color: C.sl800,
          fontFamily: "inherit",
          background: C.white,
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  color = C.bl500,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <div
      style={{
        padding: big ? "20px 22px" : "14px 18px",
        borderRadius: 14,
        background: `${color}08`,
        border: `1.5px solid ${color}20`,
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 600, color: C.sl400, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: big ? 28 : 20, fontWeight: 800, color: C.sl900, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.sl400, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  color = C.bl500,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, borderRadius: 16, border: `1px solid ${C.sl100}`, background: C.white, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: open ? `${color}06` : "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background .2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span style={{ fontSize: 14, fontWeight: 700, color: C.sl900 }}>{title}</span>
        </div>
        <span style={{ color: C.sl300, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <ChevronDown size={18} />
        </span>
      </button>
      {open && <div style={{ padding: "4px 20px 20px" }}>{children}</div>}
    </div>
  );
}

const INCOME_FIELDS = [
  { key: "emploi", label: "Revenu d'emploi (L.200)" },
  { key: "autonome", label: "Travail autonome (L.202)" },
  { key: "prestations", label: "Prestations AE/RQAP (L.203)" },
  { key: "pensionRecue", label: "Pension reçue de tiers (L.204)" },
  { key: "retraite", label: "Retraite/invalidité (L.205)" },
  { key: "placements", label: "Placements/dividendes (L.206)" },
  { key: "locatif", label: "Revenus locatifs (L.207)" },
  { key: "autre", label: "Autres revenus (L.208)" },
];

function IncomeGroup({
  label,
  data,
  onChange,
  iconColor,
}: {
  label: string;
  data: Record<string, string | number | undefined>;
  onChange: (key: string, v: string) => void;
  iconColor: string;
}) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: C.sl50, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={18} style={{ color: iconColor }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sl600 }}>{label}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {INCOME_FIELDS.map((f) => (
          <NumInput key={f.key} label={f.label} value={data[f.key]} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>
      <NumInput label="Cotisation syndicale (L.302)" value={data.cotSyndicale} onChange={(v) => onChange("cotSyndicale", v)} />
      <NumInput label="Cotisation professionnelle (L.303)" value={data.cotProfessionnelle} onChange={(v) => onChange("cotProfessionnelle", v)} />
    </div>
  );
}

const PATRIMOINE_CATS = [
  { key: "residences", label: "Résidences familiales", Icon: Home },
  { key: "meubles", label: "Meubles du ménage", Icon: LayoutGrid },
  { key: "vehicules", label: "Véhicules automobiles", Icon: Car },
  { key: "retraite", label: "REER / Régimes de retraite", Icon: TrendingUp },
  { key: "rrq", label: "Droits RRQ/RPC", Icon: Building2 },
];

export function SafeFamilyCalculator() {
  const [tab, setTab] = useState("pa");
  const [ready, setReady] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  useEffect(() => {
    setTimeout(() => setReady(true), 60);
  }, []);

  const [paData, setPaData] = useState<Record<string, unknown>>({
    parent1: {},
    parent2: {},
    numChildren: "1",
    custodyType: "exclusive",
    custodialParent: "parent1",
    accessDays: "",
    custodyPct1: "50",
    childrenWithP1: "1",
    fraisGarde: "",
    fraisPostSec: "",
    fraisSpeciaux: "",
  });
  const updatePA = useCallback((path: string, val: string) => {
    setPaData((prev) => {
      const next = { ...prev };
      if (path.includes(".")) {
        const [group, key] = path.split(".");
        (next[group] as Record<string, unknown>) = { ...(next[group] as Record<string, unknown>), [key]: val };
      } else {
        next[path] = val;
      }
      return next;
    });
  }, []);
  const paResult = useMemo(() => calcChildSupport(paData), [paData]);

  const [patData, setPatData] = useState<Record<string, unknown>>({});
  const patResult = useMemo(() => calcPatrimoine(patData), [patData]);

  const [acqData, setAcqData] = useState<Record<string, unknown>>({});
  const acqResult = useMemo(() => calcAcquets(acqData), [acqData]);

  const [compData, setCompData] = useState<Record<string, unknown>>({});
  const compResult = useMemo(() => calcCompensation(compData), [compData]);

  const an = (d = 0) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(10px)",
    transition: `all .5s cubic-bezier(.16,1,.3,1) ${d}s`,
  });

  function renderContent() {
    if (tab === "pa") {
      const parent1 = (paData.parent1 as Record<string, unknown>) || {};
      const parent2 = (paData.parent2 as Record<string, unknown>) || {};
      return (
        <div>
          <IncomeGroup
            label="Parent 1 — Revenus annuels"
            data={parent1 as Record<string, string | number | undefined>}
            onChange={(k, v) => updatePA(`parent1.${k}`, v)}
            iconColor={C.bl500}
          />
          <IncomeGroup
            label="Parent 2 — Revenus annuels"
            data={parent2 as Record<string, string | number | undefined>}
            onChange={(k, v) => updatePA(`parent2.${k}`, v)}
            iconColor={C.purple}
          />

          <Section
            title="Garde & enfants"
            icon={
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.ok}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={18} style={{ color: C.ok }} />
              </div>
            }
            color={C.ok}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SelectInput
                label="Nombre d'enfants"
                value={String(paData.numChildren ?? "1")}
                onChange={(v) => updatePA("numChildren", v)}
                options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} enfant${n > 1 ? "s" : ""}` }))}
              />
              <SelectInput
                label="Type de garde"
                value={String(paData.custodyType ?? "exclusive")}
                onChange={(v) => updatePA("custodyType", v)}
                options={[
                  { value: "exclusive", label: "Garde exclusive (≤20% accès)" },
                  { value: "extended", label: "Accès prolongé (20-40%)" },
                  { value: "shared", label: "Garde partagée (≥40% chaque)" },
                  { value: "split", label: "Garde divisée (chaque parent ≥1 enfant)" },
                  { value: "mixed", label: "Arrangements mixtes" },
                ]}
              />
            </div>
            {(paData.custodyType === "exclusive" || paData.custodyType === "extended") && (
              <SelectInput
                label="Parent gardien"
                value={String(paData.custodialParent ?? "parent1")}
                onChange={(v) => updatePA("custodialParent", v)}
                options={[{ value: "parent1", label: "Parent 1" }, { value: "parent2", label: "Parent 2" }]}
              />
            )}
            {paData.custodyType === "extended" && (
              <NumInput
                label="Jours d'accès par année (non-gardien)"
                value={String(paData.accessDays ?? "")}
                onChange={(v) => updatePA("accessDays", v)}
                prefix=""
                hint="Entre 73 et 146 jours (20-40%)"
              />
            )}
            {(paData.custodyType === "shared" || paData.custodyType === "mixed") && (
              <NumInput
                label="% du temps de garde — Parent 1"
                value={String(paData.custodyPct1 ?? "50")}
                onChange={(v) => updatePA("custodyPct1", v)}
                prefix="%"
                hint="Ex: 50 pour 50/50, 60 pour 60/40"
              />
            )}
            {paData.custodyType === "split" && (
              <NumInput label="Nb enfants avec Parent 1" value={String(paData.childrenWithP1 ?? "1")} onChange={(v) => updatePA("childrenWithP1", v)} prefix="#" />
            )}
          </Section>

          <Section
            title="Frais additionnels (nets)"
            icon={
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.warn}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={18} style={{ color: C.warn }} />
              </div>
            }
            color={C.warn}
            defaultOpen={false}
          >
            <NumInput label="Frais de garde annuels nets (L.403)" value={String(paData.fraisGarde ?? "")} onChange={(v) => updatePA("fraisGarde", v)} hint="Après crédits d'impôt et subventions" />
            <NumInput label="Frais postsecondaires nets (L.404)" value={String(paData.fraisPostSec ?? "")} onChange={(v) => updatePA("fraisPostSec", v)} />
            <NumInput label="Frais spéciaux nets (L.405)" value={String(paData.fraisSpeciaux ?? "")} onChange={(v) => updatePA("fraisSpeciaux", v)} hint="Orthodontie, école privée, sport compétitif..." />
          </Section>

          <div style={{ padding: 20, borderRadius: 16, background: `linear-gradient(135deg, ${C.bl500}06, ${C.purple}06)`, border: `1.5px solid ${C.bl200}`, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.bl500}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calculator size={18} style={{ color: C.bl500 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.sl600 }}>Résultats — Pension alimentaire 2026</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Revenu disponible P1" value={fmt(paResult.disp1)} sub={fmtPct(paResult.pct1) + " du total"} />
              <ResultCard label="Revenu disponible P2" value={fmt(paResult.disp2)} sub={fmtPct(paResult.pct2) + " du total"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Revenu combiné" value={fmt(paResult.combined)} color={C.sl500} />
              <ResultCard label="Contrib. de base (table)" value={fmt(paResult.basicContrib)} color={C.bl500} />
              <ResultCard label="Frais additionnels" value={fmt(paResult.totalAdditional)} color={C.warn} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <ResultCard label="Pension annuelle" value={fmt(paResult.annualAmount)} sub={`Payée par ${paResult.payer}`} color={C.ok} big />
              <ResultCard label="Pension mensuelle" value={fmt(paResult.monthlyAmount)} sub={`${fmt(paResult.annualAmount / 26)} aux 2 semaines`} color={C.ok} big />
            </div>
            {(paResult.cappedP1 || paResult.cappedP2) && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: C.warnBg, border: `1px solid ${C.warn}20`, display: "flex", gap: 8, fontSize: 12, color: C.sl700 }}>
                <AlertTriangle size={14} style={{ color: C.warn, flexShrink: 0 }} />
                Le plafond de 50 % du revenu disponible a été appliqué (art. 8 du Règlement).
              </div>
            )}
          </div>
        </div>
      );
    }

    if (tab === "patrimoine") {
      return (
        <div>
          {PATRIMOINE_CATS.map(({ key, label, Icon }) => (
            <Section
              key={key}
              title={label}
              icon={
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.ok}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: C.ok }} />
                </div>
              }
              color={C.ok}
              defaultOpen={key === "residences"}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.sl500, marginBottom: 8 }}>Époux 1</div>
                  <NumInput label="Valeur marchande" value={String(patData[`${key}_val1`] ?? "")} onChange={(v) => setPatData((p) => ({ ...p, [`${key}_val1`]: v }))} />
                  <NumInput label="Dettes liées" value={String(patData[`${key}_debt1`] ?? "")} onChange={(v) => setPatData((p) => ({ ...p, [`${key}_debt1`]: v }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.sl500, marginBottom: 8 }}>Époux 2</div>
                  <NumInput label="Valeur marchande" value={String(patData[`${key}_val2`] ?? "")} onChange={(v) => setPatData((p) => ({ ...p, [`${key}_val2`]: v }))} />
                  <NumInput label="Dettes liées" value={String(patData[`${key}_debt2`] ?? "")} onChange={(v) => setPatData((p) => ({ ...p, [`${key}_debt2`]: v }))} />
                </div>
              </div>
            </Section>
          ))}
          <Section
            title="Déductions art. 418 CCQ"
            icon={
              <span style={{ color: C.sl400 }}>
                <Info size={18} />
              </span>
            }
            color={C.ok}
            defaultOpen={false}
          >
            <div style={{ fontSize: 12, color: C.sl400, marginBottom: 10, lineHeight: 1.6 }}>
              Valeur nette des biens de patrimoine possédés avant le mariage + contributions provenant de successions/donations durant le mariage (avec plus-values proportionnelles).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumInput label="Déductions — Époux 1" value={String(patData.deduction418_1 ?? "")} onChange={(v) => setPatData((p) => ({ ...p, deduction418_1: v }))} />
              <NumInput label="Déductions — Époux 2" value={String(patData.deduction418_2 ?? "")} onChange={(v) => setPatData((p) => ({ ...p, deduction418_2: v }))} />
            </div>
          </Section>
          <div style={{ padding: 20, borderRadius: 16, background: `${C.ok}08`, border: `1.5px solid ${C.ok}25`, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sl600, marginBottom: 14 }}>Résultats — Patrimoine familial</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Valeur nette — Époux 1" value={fmt(patResult.totalNet1)} color={C.ok} />
              <ResultCard label="Valeur nette — Époux 2" value={fmt(patResult.totalNet2)} color={C.ok} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Partageable — Époux 1" value={fmt(patResult.shareable1)} sub={`Après déduction: ${fmt(patResult.deduct1)}`} color={C.sl500} />
              <ResultCard label="Partageable — Époux 2" value={fmt(patResult.shareable2)} sub={`Après déduction: ${fmt(patResult.deduct2)}`} color={C.sl500} />
            </div>
            <ResultCard label="Paiement d'égalisation" value={fmt(patResult.equalization)} sub={`Payé par ${patResult.payer} à l'autre époux`} color={C.ok} big />
          </div>
        </div>
      );
    }

    if (tab === "acquets") {
      return (
        <div>
          <Section
            title="Époux 1 — Biens"
            icon={
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.bl500}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} style={{ color: C.bl500 }} />
              </div>
            }
            color={C.purple}
          >
            <NumInput label="Valeur totale des acquêts" value={String(acqData.acquets1 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, acquets1: v }))} hint="Tous biens non propres acquis pendant le régime" />
            <NumInput label="Valeur totale des propres" value={String(acqData.propres1 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, propres1: v }))} hint="Biens avant mariage, héritages, dons..." />
            <NumInput label="Récompenses dûes AUX acquêts" value={String(acqData.recompAcq1 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, recompAcq1: v }))} hint="Fonds propres utilisés pour biens acquêts" />
            <NumInput label="Récompenses dûes PAR les acquêts" value={String(acqData.recompProp1 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, recompProp1: v }))} hint="Fonds acquêts utilisés pour biens propres" />
          </Section>
          <Section
            title="Époux 2 — Biens"
            icon={
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.purple}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} style={{ color: C.purple }} />
              </div>
            }
            color={C.purple}
          >
            <NumInput label="Valeur totale des acquêts" value={String(acqData.acquets2 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, acquets2: v }))} />
            <NumInput label="Valeur totale des propres" value={String(acqData.propres2 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, propres2: v }))} />
            <NumInput label="Récompenses dûes AUX acquêts" value={String(acqData.recompAcq2 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, recompAcq2: v }))} />
            <NumInput label="Récompenses dûes PAR les acquêts" value={String(acqData.recompProp2 ?? "")} onChange={(v) => setAcqData((p) => ({ ...p, recompProp2: v }))} />
          </Section>
          <div style={{ padding: 20, borderRadius: 16, background: `${C.purple}08`, border: `1.5px solid ${C.purple}25`, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sl600, marginBottom: 14 }}>Résultats — Société d&apos;acquêts</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Acquêts nets — Époux 1" value={fmt(acqResult.netAcq1)} color={C.purple} />
              <ResultCard label="Acquêts nets — Époux 2" value={fmt(acqResult.netAcq2)} color={C.purple} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <ResultCard label="Époux 1 reçoit (½ acq. Ép.2)" value={fmt(acqResult.spouse1Receives)} color={C.sl500} />
              <ResultCard label="Époux 2 reçoit (½ acq. Ép.1)" value={fmt(acqResult.spouse2Receives)} color={C.sl500} />
            </div>
            <ResultCard label="Transfert net" value={fmt(acqResult.netTransfer)} sub={`Payé par ${acqResult.payer}`} color={C.purple} big />
          </div>
        </div>
      );
    }

    if (tab === "compensation") {
      return (
        <div>
          <div style={{ padding: 16, borderRadius: 14, background: C.warnBg, border: `1px solid ${C.warn}20`, marginBottom: 16, fontSize: 12, color: C.sl700, lineHeight: 1.7 }}>
            <strong>Note :</strong> La prestation compensatoire est discrétionnaire. Ce calculateur fournit une estimation basée sur l&apos;enrichissement et la contribution; le tribunal considère de nombreux facteurs.
          </div>
          <Section
            title="Évaluation de la contribution"
            icon={
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.warn}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={18} style={{ color: C.warn }} />
              </div>
            }
            color={C.warn}
          >
            <NumInput
              label="Enrichissement du patrimoine de l'autre époux"
              value={String(compData.enrichment ?? "")}
              onChange={(v) => setCompData((p) => ({ ...p, enrichment: v }))}
              hint="Augmentation de la valeur du patrimoine de l&apos;époux bénéficiaire"
            />
            <NumInput
              label="Valeur de la contribution (apport)"
              value={String(compData.contribution ?? "")}
              onChange={(v) => setCompData((p) => ({ ...p, contribution: v }))}
              hint="Valeur marchande du travail/apport (services non rémunérés, collaboration à l&apos;entreprise, etc.)"
            />
            <NumInput
              label="Compensation déjà reçue"
              value={String(compData.alreadyCompensated ?? "")}
              onChange={(v) => setCompData((p) => ({ ...p, alreadyCompensated: v }))}
              hint="Via le régime matrimonial, le patrimoine familial, ou des paiements antérieurs"
            />
          </Section>
          <div style={{ padding: 20, borderRadius: 16, background: C.warnBg, border: `1.5px solid ${C.warn}25`, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sl600, marginBottom: 14 }}>Estimation — Prestation compensatoire</div>
            <ResultCard label="Prestation estimée" value={fmt(compResult.amount)} sub="= Min(enrichissement, contribution) − déjà compensé" color={C.warn} big />
            <div style={{ fontSize: 11, color: C.sl400, marginTop: 10, lineHeight: 1.6 }}>
              Méthode: le moindre de l&apos;enrichissement et de la contribution, moins toute compensation déjà reçue (CCQ art. 427-430). Le tribunal peut accorder un montant différent.
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, ...an(0) }}>
        {MODULES.map((mod) => {
          const isActive = tab === mod.id;
          const isHover = hoveredCard === mod.id;
          return (
            <div
              key={mod.id}
              role="button"
              tabIndex={0}
              onClick={() => setTab(mod.id)}
              onMouseEnter={() => setHoveredCard(mod.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onKeyDown={(e) => e.key === "Enter" && setTab(mod.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 12,
                cursor: "pointer",
                background: isActive || isHover ? C.sl50 : C.white,
                border: `1px solid ${isActive ? `${mod.color}30` : isHover ? `${mod.color}30` : C.sl100}`,
                transition: "all .2s ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${mod.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ModuleIcon iconKey={mod.icon} color={mod.color} size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.sl900 }}>{mod.label}</div>
                <div style={{ fontSize: 12, color: C.sl400, marginTop: 2 }}>{mod.desc}</div>
              </div>
              <ChevronDown
                size={18}
                style={{
                  color: C.sl300,
                  flexShrink: 0,
                  transform: isActive ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform .2s",
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={an(0.04)}>{renderContent()}</div>

      <div style={{ textAlign: "center", marginTop: 28, padding: "16px 0", borderTop: `1px solid ${C.sl100}`, ...an(0.08) }}>
        <div style={{ fontSize: 11, color: C.sl300, lineHeight: 1.6 }}>
          SAFE Legal Suite — Calculs basés sur le Règlement C-25.01, r. 0.4 et le CCQ
          <br />
          Table de fixation 2026 — Déduction de base: {BASIC_DEDUCTION_2026.toLocaleString("fr-CA")} $
          <br />
          <span style={{ color: C.warn }}>Outil d&apos;estimation — ne remplace pas un avis juridique professionnel</span>
        </div>
      </div>
    </div>
  );
}
