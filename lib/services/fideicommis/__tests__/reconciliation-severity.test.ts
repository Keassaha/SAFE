import { describe, expect, it } from "vitest";
import { computeReconciliationSeverity } from "@/lib/services/fideicommis/reconciliation-service";

/**
 * STATUS-PROV-01 : le seuil critique J+25 est PROPRE À L'ONTARIO (By-Law 9, art. 22(2)).
 * Le Québec (B-1, r. 5) n'impose aucun délai chiffré : on ne doit JAMAIS marquer un cabinet
 * québécois « critique / non-conforme » sur un compte de jours. Ces tests verrouillent ça.
 */
describe("computeReconciliationSeverity — province-aware", () => {
  it("période courante certifiée → ni retard ni critique (toutes provinces)", () => {
    for (const province of ["QC", "ON", null, undefined]) {
      expect(
        computeReconciliationSeverity({ isCurrentPeriodDone: true, daysSinceMonthEnd: 40, province }),
      ).toEqual({ overdue: false, critical: false });
    }
  });

  it("Ontario : rappel à J+21, critique à J+26", () => {
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 21, province: "ON" }),
    ).toEqual({ overdue: true, critical: false });
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 26, province: "ON" }),
    ).toEqual({ overdue: true, critical: true });
  });

  it("Québec : rappel possible, mais JAMAIS critique, même à J+40", () => {
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 26, province: "QC" }),
    ).toEqual({ overdue: true, critical: false });
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 40, province: "QC" }),
    ).toEqual({ overdue: true, critical: false });
  });

  it("Québec (casse insensible) n'est jamais critique", () => {
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 30, province: "qc" }),
    ).toEqual({ overdue: true, critical: false });
  });

  it("province absente ou inconnue → comportement Ontario (défaut historique)", () => {
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 26, province: null }),
    ).toEqual({ overdue: true, critical: true });
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 26, province: "BC" }),
    ).toEqual({ overdue: true, critical: true });
  });

  it("avant J+20 : ni rappel ni critique", () => {
    expect(
      computeReconciliationSeverity({ isCurrentPeriodDone: false, daysSinceMonthEnd: 10, province: "ON" }),
    ).toEqual({ overdue: false, critical: false });
  });
});
