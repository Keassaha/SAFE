import { describe, it, expect } from "vitest";
import {
  amountForSubject,
  computeMonthlyPay,
  isClaimBlocking,
  isLegalAidSubject,
  monthBounds,
  parseGrid,
} from "@/lib/payroll/remuneration-service";

const plan = { grid: { IMM: 150, FA: 100 }, legalAidSubjectCode: "LAO" };

describe("rémunération à trois sources", () => {
  it("lit la grille en écartant les montants vides, nuls ou négatifs", () => {
    expect(parseGrid({ imm: "150", FA: 100, RE: 0, BU: -5, WE: "abc" })).toEqual({ IMM: 150, FA: 100 });
    expect(parseGrid(null)).toEqual({});
    expect(parseGrid([1, 2])).toEqual({});
  });

  it("un dossier, une seule voie : l'aide juridique ne passe jamais par la grille", () => {
    expect(amountForSubject(plan, "IMM")).toBe(150);
    expect(amountForSubject(plan, "lao")).toBeNull();
    expect(amountForSubject({ ...plan, grid: { ...plan.grid, LAO: 999 } }, "LAO")).toBeNull();
    expect(amountForSubject(plan, "RE")).toBeNull();
    expect(amountForSubject(plan, null)).toBeNull();
    expect(isLegalAidSubject(plan, "LAO")).toBe(true);
    expect(isLegalAidSubject(plan, "IMM")).toBe(false);
  });

  it("un dossier refusé peut être redéclaré, pas un dossier en attente, approuvé ou payé", () => {
    expect(isClaimBlocking("rejected")).toBe(false);
    expect(isClaimBlocking("submitted")).toBe(true);
    expect(isClaimBlocking("approved")).toBe(true);
    expect(isClaimBlocking("paid")).toBe(true);
  });

  it("calcule les trois lignes et le brut", () => {
    const pay = computeMonthlyPay({
      monthlySalary: 2000,
      legalAidHourlyRate: 25,
      claimAmounts: [150, 150, 150, 100, 100],
      legalAidHours: [8, 2.5, 3.5],
    });
    expect(pay.lines.map((l) => [l.kind, l.amount])).toEqual([
      ["salaire_fixe", 2000],
      ["compensation_dossier", 650],
      ["heures_aide_juridique", 350],
    ]);
    expect(pay.gross).toBe(3000);
    expect(pay.legalAidHours).toBe(14);
  });

  it("garde le salaire seul quand rien d'autre n'est approuvé", () => {
    const pay = computeMonthlyPay({ monthlySalary: 2000, legalAidHourlyRate: 25, claimAmounts: [], legalAidHours: [] });
    expect(pay.gross).toBe(2000);
    expect(pay.lines).toHaveLength(3);
  });

  it("arrondit au cent", () => {
    const pay = computeMonthlyPay({ monthlySalary: 0, legalAidHourlyRate: 27.33, claimAmounts: [], legalAidHours: [1.25] });
    expect(pay.gross).toBe(34.16);
  });

  it("borne le mois civil en UTC, février compris", () => {
    const oct = monthBounds(2026, 10);
    expect(oct.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(oct.end.toISOString()).toBe("2026-10-31T23:59:59.999Z");
    expect(oct.lastDay.toISOString().slice(0, 10)).toBe("2026-10-31");
    expect(monthBounds(2028, 2).lastDay.toISOString().slice(0, 10)).toBe("2028-02-29");
    expect(monthBounds(2026, 12).end.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });
});
